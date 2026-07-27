import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") userId = "";
  @type("string") email = "";
  @type("string") role = "cliente";
  @type("number") x = 0;
  @type("number") z = 0;
  @type("number") rotY = 0;
  @type("boolean") congelado = false;
  @type("boolean") silenciado = false;
  @type("string") capaNombre = "";
  @type("string") disfrazNombre = "";
  @type("string") accesorioNombre = "";
}
