import type { CampoAmbientalConfig } from "./types";

// Los 5 campos arquetípicos del motor de partículas reactivas. Son un
// segundo grupo, separado de los 5 "Entornos" ya existentes en la sala
// (Noche/Paraíso/Infierno/Tierra/Mar en src/three/Environment.tsx) — el
// usuario pidió mantener ambos en vez de reemplazar uno con el otro.
export const CAMPOS_AMBIENTALES: CampoAmbientalConfig[] = [
  {
    id: "utero",
    label: "Vientre materno",
    colorChip: "#FF9FC4",
    fondo: "#3A0F22",
    niebla: { color: "#5A1C34", near: 4, far: 16 },
    luzAmbiente: { color: "#FFB8D4", intensidad: 0.75 },
    luzDireccional: { color: "#FFD9E8", intensidad: 0.35, posicion: [2, 4, 2] },
    piso: { tipo: "reflectante", color: "#7A2A45" },
    particulas: {
      color: "#FFD3E4",
      velocidadBase: 0.12,
      tamano: 0.09,
      carga: 0.3,
      energiaRepresentantePorDefecto: "atraccion",
    },
  },
  {
    id: "agujero_negro",
    label: "Horizonte de agujero negro",
    colorChip: "#8B7CFF",
    fondo: "#020103",
    niebla: { color: "#050208", near: 6, far: 22 },
    luzAmbiente: { color: "#4A3AFF", intensidad: 0.3 },
    luzDireccional: { color: "#B39CFF", intensidad: 0.5, posicion: [0, 6, 0] },
    piso: { tipo: "grilla", color: "#6A4CFF" },
    particulas: {
      color: "#C9BBFF",
      velocidadBase: 0.4,
      tamano: 0.05,
      carga: -0.6,
      fuerzaCentral: { tipo: "atraccion", radio: 9, intensidad: 3.2 },
      energiaRepresentantePorDefecto: "turbulencia",
    },
  },
  {
    id: "paraiso_luz",
    label: "Paraíso / Campo de luz",
    colorChip: "#FFE9A8",
    fondo: "#1A1508",
    niebla: { color: "#2A2210", near: 8, far: 26 },
    luzAmbiente: { color: "#FFF3D6", intensidad: 0.9 },
    luzDireccional: { color: "#FFEBB0", intensidad: 1.0, posicion: [5, 9, 4] },
    piso: { tipo: "reflectante", color: "#E8D9A0" },
    particulas: {
      color: "#FFEFC2",
      velocidadBase: 0.15,
      tamano: 0.06,
      carga: 0.8,
      energiaRepresentantePorDefecto: "atraccion",
    },
  },
  {
    id: "infierno_submundo",
    label: "Infierno / Submundo",
    colorChip: "#FF5C3D",
    fondo: "#180402",
    niebla: { color: "#2B0705", near: 5, far: 18 },
    luzAmbiente: { color: "#FF6A3D", intensidad: 0.35 },
    luzDireccional: { color: "#FF3B1F", intensidad: 0.5, posicion: [2, 5, -3] },
    piso: { tipo: "agrietado", color: "#1F0F0C" },
    particulas: {
      color: "#FF8A4D",
      velocidadBase: 0.6,
      tamano: 0.05,
      carga: -0.8,
      energiaRepresentantePorDefecto: "repulsion",
    },
  },
  {
    id: "espacio_profundo",
    label: "Espacio profundo",
    colorChip: "#4CC9F0",
    fondo: "#04070F",
    niebla: { color: "#060B18", near: 10, far: 30 },
    luzAmbiente: { color: "#6E8FD9", intensidad: 0.35 },
    luzDireccional: { color: "#BFD8FF", intensidad: 0.4, posicion: [-4, 5, 3] },
    piso: { tipo: "ninguno", color: "#000000" },
    particulas: {
      color: "#9FD8FF",
      velocidadBase: 0.08,
      tamano: 0.07,
      carga: 0,
      energiaRepresentantePorDefecto: "turbulencia",
    },
  },
];

export function obtenerCampo(id: string): CampoAmbientalConfig {
  return CAMPOS_AMBIENTALES.find((c) => c.id === id) ?? CAMPOS_AMBIENTALES[0];
}
