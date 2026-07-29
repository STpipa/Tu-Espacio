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

// Mismos ids que EnvironmentId en src/three/Environment.tsx del cliente.
export type EntornoId = "noche" | "paraiso" | "infierno" | "tierra" | "mar";

export const ENTORNOS_VALIDOS: EntornoId[] = [
  "noche",
  "paraiso",
  "infierno",
  "tierra",
  "mar",
];

export interface CambiarEntornoMensaje {
  entorno: EntornoId;
}
