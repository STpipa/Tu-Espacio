import { Client } from "colyseus.js";

const wsEndpoint = process.env.EXPO_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567";

export const colyseusClient = new Client(wsEndpoint);

function httpEndpoint() {
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
