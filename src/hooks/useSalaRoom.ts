import { useCallback, useEffect, useRef, useState } from "react";
import { getStateCallbacks, type Room } from "colyseus.js";
import { colyseusClient, resolverRoomId } from "../lib/colyseus";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { registrarAsistenciaSiHaceFalta } from "../lib/monetizacion";

export interface JugadorSala {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  x: number;
  z: number;
  rotY: number;
  congelado: boolean;
  silenciado: boolean;
  capaNombre: string;
  disfrazNombre: string;
  accesorioNombre: string;
}

export type AccionModeracion =
  | "congelar"
  | "descongelar"
  | "silenciar"
  | "habilitar"
  | "teletransportar"
  | "expulsar";

interface EstadoSala {
  conectando: boolean;
  error: string | null;
  jugadores: Record<string, JugadorSala>;
  miSessionId: string | null;
}

function snapshotJugador(sessionId: string, j: any): JugadorSala {
  return {
    sessionId,
    userId: j.userId,
    email: j.email,
    role: j.role,
    x: j.x,
    z: j.z,
    rotY: j.rotY,
    congelado: j.congelado,
    silenciado: j.silenciado,
    capaNombre: j.capaNombre,
    disfrazNombre: j.disfrazNombre,
    accesorioNombre: j.accesorioNombre,
  };
}

export function useSalaRoom(codigoAcceso: string | undefined) {
  const roomRef = useRef<Room | null>(null);
  const { profile } = useAuth();
  const [estado, setEstado] = useState<EstadoSala>({
    conectando: true,
    error: null,
    jugadores: {},
    miSessionId: null,
  });

  useEffect(() => {
    if (!codigoAcceso) return;
    let activo = true;

    async function conectar() {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) throw new Error("No hay sesión activa");

        const roomId = await resolverRoomId(codigoAcceso!);
        const room = await colyseusClient.joinById(roomId, {
          accessToken,
          codigoAcceso,
        });

        if (!activo) {
          room.leave();
          return;
        }
        roomRef.current = room;

        const $ = getStateCallbacks(room);

        $(room.state).players.onAdd((jugador: any, sessionId: string) => {
          setEstado((prev) => ({
            ...prev,
            jugadores: {
              ...prev.jugadores,
              [sessionId]: snapshotJugador(sessionId, jugador),
            },
          }));

          $(jugador).onChange(() => {
            setEstado((prev) => ({
              ...prev,
              jugadores: {
                ...prev.jugadores,
                [sessionId]: snapshotJugador(sessionId, jugador),
              },
            }));
          });
        });

        $(room.state).players.onRemove((_jugador: any, sessionId: string) => {
          setEstado((prev) => {
            const copia = { ...prev.jugadores };
            delete copia[sessionId];
            return { ...prev, jugadores: copia };
          });
        });

        room.onLeave(() => {
          roomRef.current = null;
        });

        setEstado((prev) => ({
          ...prev,
          conectando: false,
          miSessionId: room.sessionId,
        }));

        // Cuenta como "asistencia" del mes para el límite gratis de
        // clientes. Curadores/super_admin entrando a su propia sala no
        // gastan nada.
        if (profile?.role === "cliente") {
          registrarAsistenciaSiHaceFalta(profile.id).catch(() => {});
        }
      } catch (err) {
        if (!activo) return;
        setEstado((prev) => ({
          ...prev,
          conectando: false,
          error:
            err instanceof Error ? err.message : "No se pudo conectar a la sala",
        }));
      }
    }

    conectar();

    return () => {
      activo = false;
      roomRef.current?.leave();
      roomRef.current = null;
    };
  }, [codigoAcceso]);

  const mover = useCallback((x: number, z: number, rotY: number) => {
    roomRef.current?.send("mover", { x, z, rotY });
  }, []);

  const moderar = useCallback(
    (
      accion: AccionModeracion,
      targetSessionId: string,
      extra?: { x?: number; z?: number }
    ) => {
      roomRef.current?.send("moderar", { accion, targetSessionId, ...extra });
    },
    []
  );

  return { ...estado, mover, moderar };
}
