export type TipoEnergia = "atraccion" | "repulsion" | "turbulencia";

export interface RepresentanteFuerza {
  id: string;
  position: [number, number, number];
  tipoEnergia: TipoEnergia;
  radio: number;
  intensidad: number;
}

export type TipoVinculo = "amor" | "trauma" | "secreto";

export interface Conexion {
  id: string;
  idA: string;
  idB: string;
  tipoVinculo: TipoVinculo;
}

export type CampoId =
  | "utero"
  | "agujero_negro"
  | "paraiso_luz"
  | "infierno_submundo"
  | "espacio_profundo";

export interface CampoAmbientalConfig {
  id: CampoId;
  label: string;
  colorChip: string;
  fondo: string;
  niebla: { color: string; near: number; far: number };
  luzAmbiente: { color: string; intensidad: number };
  luzDireccional: { color: string; intensidad: number; posicion: [number, number, number] };
  piso: { tipo: "reflectante" | "grilla" | "agrietado" | "ninguno"; color: string };
  particulas: {
    color: string;
    velocidadBase: number;
    tamano: number;
    carga: number;
    // Fuerza ambiente propia del campo (ej. la atracción gravitacional
    // central del agujero negro), independiente de los representantes.
    fuerzaCentral?: { tipo: TipoEnergia; radio: number; intensidad: number };
  };
}
