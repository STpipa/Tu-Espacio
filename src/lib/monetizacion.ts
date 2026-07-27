import { supabase } from "./supabase";
import type { Profile } from "./types";

const LIMITE_SESIONES_GRATIS_POR_MES = 2;

export function puedeCrearSala(profile: Profile, suscripcionActiva: boolean): boolean {
  return profile.role === "super_admin" || profile.exento_pago || suscripcionActiva;
}

function inicioDeMesISO(): string {
  const inicio = new Date();
  inicio.setDate(1);
  return inicio.toISOString().slice(0, 10);
}

export async function contarSesionesEsteMes(clienteId: string): Promise<number> {
  const { count, error } = await supabase
    .from("sesiones_uso")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .gte("fecha_asistencia", inicioDeMesISO());

  if (error) throw error;
  return count ?? 0;
}

// Marca la asistencia de hoy. Si ya había una fila para hoy (unique
// constraint en la base), no hace nada: reconectarse el mismo día no
// gasta una segunda sesión gratis.
export async function registrarAsistenciaSiHaceFalta(clienteId: string): Promise<void> {
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("sesiones_uso")
    .insert({ cliente_id: clienteId, fecha_asistencia: hoy });

  if (error && !/duplicate key/i.test(error.message)) {
    throw error;
  }
}

export async function puedeUnirseComoCliente(
  profile: Profile
): Promise<{ permitido: boolean; motivo?: string }> {
  if (profile.role === "super_admin" || profile.exento_pago) {
    return { permitido: true };
  }

  const usadas = await contarSesionesEsteMes(profile.id);
  if (usadas >= LIMITE_SESIONES_GRATIS_POR_MES) {
    return {
      permitido: false,
      motivo: `Ya usaste tus ${LIMITE_SESIONES_GRATIS_POR_MES} sesiones gratis de este mes. Hablá con tu curador para más info.`,
    };
  }
  return { permitido: true };
}

export { LIMITE_SESIONES_GRATIS_POR_MES };
