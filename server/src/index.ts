import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { SalaRoom } from "./rooms/SalaRoom";

const app = express();
app.use(cors());
app.use(express.json());

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

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("sala", SalaRoom);

const port = Number(process.env.PORT) || 2567;
httpServer.listen(port, () => {
  console.log(`Tu Espacio server escuchando en puerto ${port}`);
});
