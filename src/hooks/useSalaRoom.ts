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
  accesorioTransform: string;
  capaTransform: string;
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
  ambiente: string;
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
    accesorioTransform: j.accesorioTransform,
    capaTransform: j.capaTransform,
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
    ambiente: "noche",
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

        $(room.state).listen("ambiente", (ambiente: string) => {
          setEstado((prev) => ({ ...prev, ambiente }));
        });

        // El server desconecta con code 4000 al expulsado (ver SalaRoom.ts
        // "expulsar") y con 4001 a una sesión vieja de la misma cuenta
        // reemplazada por una nueva (ver SalaRoom.ts "onJoin"). En los dos
        // casos, antes no se avisaba nada del lado del cliente: la pantalla
        // de la sala quedaba intacta, mandando "mover"/"girar" a un roomRef
        // ya nulo (silenciosamente ignorado), lo que se sentía como
        // "congelado" sin explicación. Reusa la misma vista de error que
        // ya existe para fallas de conexión.
        room.onLeave((code: number, reason?: string) => {
          roomRef.current = null;
          if (code === 4000 || code === 4001) {
            setEstado((prev) => ({
              ...prev,
              error: reason || "Se cerró tu conexión a la sala.",
            }));
          }
        });

        setEstado((prev) => ({
          ...prev,
          conectando: false,
          miSessionId: room.sessionId,
          ambiente: room.state.ambiente,
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

  const cambiarAmbiente = useCallback((ambiente: string) => {
    roomRef.current?.send("cambiarAmbiente", { ambiente });
  }, []);

  return { ...estado, mover, moderar, cambiarAmbiente };
}
