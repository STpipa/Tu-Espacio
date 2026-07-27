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
