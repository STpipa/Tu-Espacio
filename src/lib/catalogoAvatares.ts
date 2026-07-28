import { supabase } from "./supabase";
import type { AvatarItem } from "./types";

// El catálogo cambia poco (es contenido curado, no algo que edite el
// usuario), así que alcanza con traerlo una vez por sesión de la app y
// reusar la misma promesa en vez de pedirlo de nuevo en cada componente.
let catalogoPromise: Promise<AvatarItem[]> | null = null;

async function cargarCatalogo(): Promise<AvatarItem[]> {
  const { data, error } = await supabase
    .from("catalogo_avatares")
    .select("id, nombre, categoria, model_url, es_premium");
  if (error) throw error;
  return (data ?? []) as AvatarItem[];
}

export function obtenerCatalogoAvatares(): Promise<AvatarItem[]> {
  if (!catalogoPromise) {
    catalogoPromise = cargarCatalogo().catch((err) => {
      catalogoPromise = null;
      throw err;
    });
  }
  return catalogoPromise;
}

export function mapaModelUrlPorNombre(items: AvatarItem[]): Record<string, string | null> {
  const mapa: Record<string, string | null> = {};
  for (const item of items) {
    mapa[item.nombre] = item.model_url;
  }
  return mapa;
}
