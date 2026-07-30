import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";
import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { SalaRoom } from "./rooms/SalaRoom";

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const livekitUrl = process.env.LIVEKIT_URL;
const livekitApiKey = process.env.LIVEKIT_API_KEY;
const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

app.get("/", (_req, res) => {
  res.json({ ok: true, servicio: "tu-espacio-server" });
});

// El cliente pide el roomId real de Colyseus para un código de sala de
// Supabase. Si ya hay una sala en memoria con ese código, la reutiliza;
// si no, crea una nueva instancia de SalaRoom. La validación real de que
// el código exista en `salas_3d` ocurre después, en SalaRoom.onAuth.
app.post("/salas/resolver", async (req, res) => {
  const codigoAcceso = String(req.body?.codigoAcceso ?? "").trim();
  if (!codigoAcceso) {
    res.status(400).json({ error: "Falta codigoAcceso" });
    return;
  }

  try {
    const salasActivas = await matchMaker.query({ name: "sala" });
    const existente = salasActivas.find(
      (sala) => (sala.metadata as { codigoAcceso?: string } | undefined)?.codigoAcceso === codigoAcceso
    );
    if (existente) {
      res.json({ roomId: existente.roomId });
      return;
    }

    const nueva = await matchMaker.createRoom("sala", { codigoAcceso });
    res.json({ roomId: nueva.roomId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Error interno" });
  }
});

// Token de LiveKit para el audio real de la sala. Misma validación que
// SalaRoom.onAuth (el JWT de Supabase manda quién sos), pero acá no hace
// falta esperar a Colyseus: el cliente puede pedirlo apenas entra a la
// sala. Un participante de LiveKit por sala de Colyseus (mismo código de
// acceso), así que no hace falta guardar ningún mapeo nuevo.
app.post("/voz/token", async (req, res) => {
  const accessToken = String(req.body?.accessToken ?? "");
  const codigoAcceso = String(req.body?.codigoAcceso ?? "").trim();
  if (!accessToken || !codigoAcceso) {
    res.status(400).json({ error: "Faltan accessToken/codigoAcceso" });
    return;
  }
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    res.status(503).json({ error: "Audio no configurado en el server (faltan LIVEKIT_*)" });
    return;
  }

  const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
  }

  const at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: userData.user.id,
    name: userData.user.email ?? undefined,
  });
  at.addGrant({
    roomJoin: true,
    room: `sala-${codigoAcceso}`,
    canPublish: true,
    canSubscribe: true,
  });

  res.json({ url: livekitUrl, token: await at.toJwt() });
});

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("sala", SalaRoom);

const port = Number(process.env.PORT) || 2567;
httpServer.listen(port, () => {
  console.log(`Tu Espacio server escuchando en puerto ${port}`);
});
