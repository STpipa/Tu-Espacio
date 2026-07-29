import { ENTORNOS, type EnvironmentId } from "../three/Environment";
import { CAMPOS_AMBIENTALES } from "../three/particles/camposAmbientales";
import type { CampoId } from "../three/particles/types";

// El picker de la sala en vivo une los 5 "Entornos" originales (estáticos,
// sin motor de partículas) con los 5 "Campos" nuevos (con el motor de
// partículas reactivas) en una sola lista — son dos sistemas de render
// distintos por debajo, pero para el curador es un solo control de
// ambiente. El editor de avatar (espacio individual) sigue usando solo los
// Entornos, sin tocar.
export type AmbienteId = EnvironmentId | CampoId;

export interface AmbienteOpcion {
  id: AmbienteId;
  label: string;
  color: string;
  conMotorDeParticulas: boolean;
}

const CAMPO_IDS = new Set<string>(CAMPOS_AMBIENTALES.map((c) => c.id));

export function esCampoConMotor(id: string): id is CampoId {
  return CAMPO_IDS.has(id);
}

export const AMBIENTES: AmbienteOpcion[] = [
  ...ENTORNOS.map((e) => ({
    id: e.id as AmbienteId,
    label: e.label,
    color: e.color,
    conMotorDeParticulas: false,
  })),
  ...CAMPOS_AMBIENTALES.map((c) => ({
    id: c.id as AmbienteId,
    label: c.label,
    color: c.colorChip,
    conMotorDeParticulas: true,
  })),
];
