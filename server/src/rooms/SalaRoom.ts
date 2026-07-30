import { Room, Client } from "@colyseus/core";
import { createClient } from "@supabase/supabase-js";
import { SalaState } from "./schema/SalaState";
import { PlayerState } from "./schema/PlayerState";
import {
  AMBIENTES_VALIDOS,
  type CambiarAmbienteMensaje,
  type ModeracionMensaje,
  type MoverMensaje,
  type SalaJoinOptions,
} from "../types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan SUPABASE_URL / SUPABASE_ANON_KEY en server/.env");
}

interface AvatarConfigDb {
  capa?: { nombre?: string } | null;
  disfraz?: { nombre?: string } | null;
  accesorio?: { nombre?: string } | null;
  accesorioTransform?: { offset?: number[]; rotacionY?: number; escala?: number } | null;
  capaTransform?: { offset?: number[]; rotacionY?: number; escala?: number } | null;
}

interface AuthResult {
  userId: string;
  email: string;
  role: string;
  curadorId: string;
  avatarConfig: AvatarConfigDb | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export class SalaRoom extends Room<SalaState> {
  maxClients = 30;

  onCreate(options: { codigoAcceso?: string }) {
    this.setState(new SalaState());
    this.setMetadata({ codigoAcceso: options?.codigoAcceso ?? null });

    this.onMessage("mover", (client, message: MoverMensaje) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.congelado) return;
      player.x = clamp(Number(message.x) || 0, -5, 5);
      player.z = clamp(Number(message.z) || 0, -5, 5);
      player.rotY = Number(message.rotY) || 0;
    });

    this.onMessage("moderar", (client, message: ModeracionMensaje) => {
      this.manejarModeracion(client, message);
    });

    this.onMessage("cambiarAmbiente", (client, message: CambiarAmbienteMensaje) => {
      const solicitante = this.state.players.get(client.sessionId);
      if (!solicitante) return;
      const esModerador = solicitante.role === "curador" || solicitante.role === "super_admin";
      if (!esModerador) return;
      if (!AMBIENTES_VALIDOS.includes(message.ambiente)) return;
      this.state.ambiente = message.ambiente;
    });
  }

  // Se ejecuta antes de onJoin. Valida el JWT de Supabase del usuario,
  // que la sala exista, y carga su rol real desde `profiles` (nunca se
  // confía en un rol mandado por el cliente).
  async onAuth(_client: Client, options: SalaJoinOptions): Promise<AuthResult> {
    if (!options?.accessToken || !options?.codigoAcceso) {
      throw new Error("Faltan credenciales para unirse a la sala");
    }

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: `Bearer ${options.accessToken}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(
      options.accessToken
    );
    if (userError || !userData.user) {
      throw new Error("Sesión inválida o expirada");
    }

    // No usamos .from("salas_3d").select() acá: la RLS de esa tabla solo
    // deja ver la sala a su propio curador. Buscamos por código a través
    // de una función SECURITY DEFINER que expone únicamente la fila que
    // coincide exactamente (ver supabase/schema_paso_c.sql).
    const { data: salas, error: salaError } = await supabase.rpc(
      "buscar_sala_por_codigo",
      { codigo: options.codigoAcceso }
    );
    const sala = salas?.[0];
    if (salaError || !sala) {
      throw new Error("La sala no existe");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, avatar_config")
      .eq("id", userData.user.id)
      .single();
    if (profileError || !profile) {
      throw new Error("No se pudo cargar el perfil del usuario");
    }

    return {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      curadorId: sala.curador_id,
      avatarConfig: profile.avatar_config ?? null,
    };
  }

  onJoin(client: Client, _options: SalaJoinOptions, auth: AuthResult) {
    const player = new PlayerState();
    player.userId = auth.userId;
    player.email = auth.email;
    player.role = auth.role;
    player.capaNombre = auth.avatarConfig?.capa?.nombre ?? "";
    player.disfrazNombre = auth.avatarConfig?.disfraz?.nombre ?? "";
    player.accesorioNombre = auth.avatarConfig?.accesorio?.nombre ?? "";
    player.accesorioTransform = auth.avatarConfig?.accesorioTransform
      ? JSON.stringify(auth.avatarConfig.accesorioTransform)
      : "";
    player.capaTransform = auth.avatarConfig?.capaTransform
      ? JSON.stringify(auth.avatarConfig.capaTransform)
      : "";
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }

  private manejarModeracion(client: Client, message: ModeracionMensaje) {
    const solicitante = this.state.players.get(client.sessionId);
    if (!solicitante) return;

    const esModerador = solicitante.role === "curador" || solicitante.role === "super_admin";
    if (!esModerador) return;

    const objetivo = this.state.players.get(message.targetSessionId);
    if (!objetivo) return;

    switch (message.accion) {
      case "congelar":
        objetivo.congelado = true;
        break;
      case "descongelar":
        objetivo.congelado = false;
        break;
      case "silenciar":
        objetivo.silenciado = true;
        break;
      case "habilitar":
        objetivo.silenciado = false;
        break;
      case "teletransportar":
        objetivo.x = clamp(Number(message.x) || 0, -5, 5);
        objetivo.z = clamp(Number(message.z) || 0, -5, 5);
        break;
      case "expulsar": {
        const targetClient = this.clients.find(
          (c) => c.sessionId === message.targetSessionId
        );
        targetClient?.leave(4000, "Expulsado por el curador");
        break;
      }
    }
  }
}
