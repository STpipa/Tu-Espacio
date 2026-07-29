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
  // JSON de AccesorioTransform ({offset:[x,y,z], rotacionY}) o "" para usar
  // el default del cliente — se manda como string en vez de sumar 4 campos
  // numéricos al schema, mismo criterio que avatar_config del lado de
  // Supabase (un blob JSON en vez de columnas nuevas por cada dato chico).
  @type("string") accesorioTransform = "";
}
