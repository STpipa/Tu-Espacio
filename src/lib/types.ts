export type UserRole = "super_admin" | "curador" | "cliente";

export type AvatarCategoria = "capa" | "disfraz" | "accesorio";

export interface AvatarItem {
  id: string;
  nombre: string;
  categoria: AvatarCategoria;
  model_url: string | null;
  es_premium: boolean;
}

export type AvatarSeleccion = {
  id: string;
  nombre: string;
  model_url?: string | null;
} | null;

// Offset/rotación/escala relativo al cuerpo, ajustable a mano por el
// usuario (antes era un valor fijo para todos los accesorios, y como cada
// modelo tiene un tamaño/pivote distinto terminaba atravesando el cuerpo o
// tapando la cara según el caso). Mismo tipo reusado para la "capa"
// (ver CAPA_TRANSFORM_DEFAULT) — misma necesidad, un modelo subido a mano
// (ej. alas hechas en Blender) rara vez cae ya centrado/escalado bien.
export interface AccesorioTransform {
  offset: [number, number, number];
  rotacionY: number;
  escala: number;
}

export const ACCESORIO_TRANSFORM_DEFAULT: AccesorioTransform = {
  offset: [0.5, 0.9, 0.1],
  rotacionY: Math.PI / 5,
  escala: 1,
};

export const CAPA_TRANSFORM_DEFAULT: AccesorioTransform = {
  offset: [0, 0, 0],
  rotacionY: 0,
  escala: 1,
};

// Tinte/opacidad/brillo aplicado a todo el modelo (cuerpo + accesorio) —
// para representar ausentes (opacidad baja), figuras energéticas (brillo),
// o simplemente un color a gusto. `color: null` = sin tinte.
export interface AvatarApariencia {
  color: string | null;
  opacidad: number;
  brillo: number;
}

export const APARIENCIA_DEFAULT: AvatarApariencia = {
  color: null,
  opacidad: 1,
  brillo: 0,
};

export interface AvatarConfig {
  capa: AvatarSeleccion;
  disfraz: AvatarSeleccion;
  accesorio: AvatarSeleccion;
  accesorioTransform?: AccesorioTransform;
  capaTransform?: AccesorioTransform;
  apariencia?: AvatarApariencia;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  exento_pago: boolean;
  avatar_config: AvatarConfig;
  foto_url: string | null;
}

const AVATAR_CONFIG_VACIO: AvatarConfig = {
  capa: null,
  disfraz: null,
  accesorio: null,
};

export function normalizarAvatarConfig(raw: unknown): AvatarConfig {
  if (!raw || typeof raw !== "object") return { ...AVATAR_CONFIG_VACIO };
  const value = raw as Partial<AvatarConfig>;
  return {
    capa: value.capa ?? null,
    disfraz: value.disfraz ?? null,
    accesorio: value.accesorio ?? null,
    // Merge con el default: un avatar_config guardado antes de que existiera
    // `escala` (o `capaTransform`) no lo trae, y leer ese campo como
    // undefined más adelante (ej. `transform.escala.toFixed(1)` en el panel
    // de ajuste) tira la pantalla en blanco entera.
    accesorioTransform: value.accesorioTransform
      ? { ...ACCESORIO_TRANSFORM_DEFAULT, ...value.accesorioTransform }
      : undefined,
    capaTransform: value.capaTransform
      ? { ...CAPA_TRANSFORM_DEFAULT, ...value.capaTransform }
      : undefined,
    apariencia: value.apariencia ?? undefined,
  };
}
