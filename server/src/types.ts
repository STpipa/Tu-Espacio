export type AccionModeracion =
  | "congelar"
  | "descongelar"
  | "silenciar"
  | "habilitar"
  | "teletransportar"
  | "expulsar";

export interface ModeracionMensaje {
  accion: AccionModeracion;
  targetSessionId: string;
  x?: number;
  z?: number;
}

export interface MoverMensaje {
  x: number;
  z: number;
  rotY: number;
}

export interface SalaJoinOptions {
  codigoAcceso: string;
  accessToken: string;
}

// Mismos ids que AmbienteId en src/lib/ambientes.ts del cliente: los 5
// "Entornos" clásicos (src/three/Environment.tsx) + los 5 "Campos" nuevos
// con motor de partículas reactivas (src/three/particles/camposAmbientales.ts).
// El server no necesita distinguir cuáles traen motor de partículas y
// cuáles no — solo valida que el id pedido exista.
export type AmbienteId =
  | "noche"
  | "paraiso"
  | "infierno"
  | "tierra"
  | "mar"
  | "utero"
  | "agujero_negro"
  | "paraiso_luz"
  | "infierno_submundo"
  | "espacio_profundo";

export const AMBIENTES_VALIDOS: AmbienteId[] = [
  "noche",
  "paraiso",
  "infierno",
  "tierra",
  "mar",
  "utero",
  "agujero_negro",
  "paraiso_luz",
  "infierno_submundo",
  "espacio_profundo",
];

export interface CambiarAmbienteMensaje {
  ambiente: AmbienteId;
}
