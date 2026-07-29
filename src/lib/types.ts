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

// Offset/rotación del accesorio relativo al cuerpo, ajustable a mano por el
// usuario (antes era un valor fijo para todos los accesorios, y como cada
// modelo tiene un tamaño/pivote distinto terminaba atravesando el cuerpo o
// tapando la cara según el caso).
export interface AccesorioTransform {
  offset: [number, number, number];
  rotacionY: number;
}

export const ACCESORIO_TRANSFORM_DEFAULT: AccesorioTransform = {
  offset: [0.5, 0.9, 0.1],
  rotacionY: Math.PI / 5,
};

export interface AvatarConfig {
  capa: AvatarSeleccion;
  disfraz: AvatarSeleccion;
  accesorio: AvatarSeleccion;
  accesorioTransform?: AccesorioTransform;
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
    accesorioTransform: value.accesorioTransform ?? undefined,
  };
}
