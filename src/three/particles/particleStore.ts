import { create } from "zustand";
import type {
  CampoAmbientalConfig,
  Conexion,
  RepresentanteFuerza,
  TipoEnergia,
  TipoVinculo,
} from "./types";

interface ParticleStoreState {
  campoActivo: CampoAmbientalConfig | null;
  representantes: Record<string, RepresentanteFuerza>;
  conexiones: Record<string, Conexion>;

  setCampoAmbiental: (config: CampoAmbientalConfig) => void;
  addRepresentanteFuerza: (
    id: string,
    position: [number, number, number],
    tipoEnergia: TipoEnergia,
    radio: number,
    intensidad: number
  ) => void;
  updateRepresentantePosition: (id: string, newPosition: [number, number, number]) => void;
  removeRepresentanteFuerza: (id: string) => void;
  conectarRepresentantes: (idA: string, idB: string, tipoVinculo: TipoVinculo) => void;
  desconectarRepresentantes: (idA: string, idB: string) => void;
}

function idConexion(idA: string, idB: string) {
  return [idA, idB].sort().join("__");
}

export const useParticleStore = create<ParticleStoreState>((set) => ({
  campoActivo: null,
  representantes: {},
  conexiones: {},

  setCampoAmbiental: (config) => set({ campoActivo: config }),

  addRepresentanteFuerza: (id, position, tipoEnergia, radio, intensidad) =>
    set((state) => ({
      representantes: {
        ...state.representantes,
        [id]: { id, position, tipoEnergia, radio, intensidad },
      },
    })),

  updateRepresentantePosition: (id, newPosition) =>
    set((state) => {
      const actual = state.representantes[id];
      if (!actual) return state;
      return {
        representantes: { ...state.representantes, [id]: { ...actual, position: newPosition } },
      };
    }),

  removeRepresentanteFuerza: (id) =>
    set((state) => {
      if (!(id in state.representantes)) return state;
      const representantes = { ...state.representantes };
      delete representantes[id];
      // Un representante que se va también se lleva sus vínculos.
      const conexiones = Object.fromEntries(
        Object.entries(state.conexiones).filter(
          ([, c]) => c.idA !== id && c.idB !== id
        )
      );
      return { representantes, conexiones };
    }),

  conectarRepresentantes: (idA, idB, tipoVinculo) =>
    set((state) => {
      const id = idConexion(idA, idB);
      return { conexiones: { ...state.conexiones, [id]: { id, idA, idB, tipoVinculo } } };
    }),

  desconectarRepresentantes: (idA, idB) =>
    set((state) => {
      const id = idConexion(idA, idB);
      if (!(id in state.conexiones)) return state;
      const conexiones = { ...state.conexiones };
      delete conexiones[id];
      return { conexiones };
    }),
}));
