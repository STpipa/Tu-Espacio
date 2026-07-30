import { Platform } from "react-native";
import Constants from "expo-constants";
import { Client } from "colyseus.js";

// En celular (Expo Go) "localhost" apunta al propio teléfono, no a esta
// PC. Si no hay EXPO_PUBLIC_COLYSEUS_URL explícita, en nativo se deduce la
// IP de LAN del mismo host que sirve el bundle de Metro (Constants la
// expone en hostUri, ej. "192.168.1.5:8081") para no tener que cambiarla a
// mano cada vez que se prueba desde el teléfono.
function endpointPorDefecto(): string {
  if (Platform.OS !== "web") {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
    const host = hostUri?.split(":")[0];
    if (host) return `ws://${host}:2567`;
  }
  return "ws://localhost:2567";
}

const wsEndpoint = process.env.EXPO_PUBLIC_COLYSEUS_URL ?? endpointPorDefecto();

export const colyseusClient = new Client(wsEndpoint);

export function httpEndpoint() {
  return wsEndpoint.replace(/^ws/, "http");
}

// Traduce un código de sala de Supabase al roomId real de Colyseus.
// La validación de que el código exista de verdad ocurre en SalaRoom.onAuth.
export async function resolverRoomId(codigoAcceso: string): Promise<string> {
  const res = await fetch(`${httpEndpoint()}/salas/resolver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigoAcceso }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo encontrar la sala");
  }
  return data.roomId as string;
}
