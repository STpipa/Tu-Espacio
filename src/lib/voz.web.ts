import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { supabase } from "./supabase";
import { httpEndpoint } from "./colyseus";

export interface EstadoVoz {
  conectado: boolean;
  micHabilitado: boolean;
  error: string | null;
  alternarMic: () => void;
}

// Audio real de la sala vía LiveKit — versión web (WebRTC del navegador,
// sin módulos nativos). Un participante de LiveKit por sala de Colyseus
// (mismo código de acceso mapeado a "sala-<codigo>" del lado del server,
// ver server/src/index.ts /voz/token).
export function useVoz(
  codigoAcceso: string | undefined,
  silenciadoPorModerador: boolean
): EstadoVoz {
  const roomRef = useRef<Room | null>(null);
  const elementosRef = useRef<HTMLMediaElement[]>([]);
  // El mic propio (tocando el ícono) es aparte del mute que impone el
  // curador — si el curador te silenció, no podés reactivarte solo.
  const [autoSilenciado, setAutoSilenciado] = useState(false);
  const [estado, setEstado] = useState<{ conectado: boolean; error: string | null }>({
    conectado: false,
    error: null,
  });

  const micDebeEstarActivo = !silenciadoPorModerador && !autoSilenciado;

  useEffect(() => {
    if (!codigoAcceso) return;
    let activo = true;
    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) return;
      const el = track.attach();
      el.style.display = "none";
      document.body.appendChild(el);
      elementosRef.current.push(el);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      for (const el of track.detach()) el.remove();
      elementosRef.current = elementosRef.current.filter((e) => !track.attachedElements.includes(e));
    });

    async function conectar() {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) throw new Error("No hay sesión activa");

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "El navegador bloqueó el micrófono: hace falta HTTPS (o localhost). Probar desde la web publicada."
          );
        }

        const res = await fetch(`${httpEndpoint()}/voz/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, codigoAcceso }),
        });
        const cuerpo = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo conectar el audio");
        if (!activo) return;

        await room.connect(cuerpo.url, cuerpo.token);
        if (!activo) {
          room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(micDebeEstarActivo);
        setEstado({ conectado: true, error: null });
      } catch (err) {
        if (!activo) return;
        setEstado((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "No se pudo conectar el audio",
        }));
      }
    }

    conectar();

    return () => {
      activo = false;
      for (const el of elementosRef.current) el.remove();
      elementosRef.current = [];
      room.disconnect();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoAcceso]);

  // El curador puede silenciar/habilitar en cualquier momento (ver
  // SalaRoom.ts "moderar"), y el propio usuario puede tocar el ícono —
  // cualquiera de los dos cambia el mic real sin reconectar la sala.
  useEffect(() => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;
    room.localParticipant.setMicrophoneEnabled(micDebeEstarActivo).catch(() => {});
  }, [micDebeEstarActivo]);

  const alternarMic = useCallback(() => {
    if (silenciadoPorModerador) return;
    setAutoSilenciado((v) => !v);
  }, [silenciadoPorModerador]);

  return { ...estado, micHabilitado: micDebeEstarActivo, alternarMic };
}
