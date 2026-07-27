import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";

export class SalaState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
