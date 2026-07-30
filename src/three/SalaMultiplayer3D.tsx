import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@react-three/fiber";
import AvatarModel from "./AvatarModel";
import OrbitRig from "./OrbitRig";
import Environment from "./Environment";
import CampoAmbientalRenderer from "./particles/CampoAmbientalRenderer";
import { useParticleStore } from "./particles/particleStore";
import { obtenerCampo } from "./particles/camposAmbientales";
import { useOrbitCamera } from "./useOrbitCamera";
import { esCampoConMotor, type AmbienteId } from "../lib/ambientes";
import type { JugadorSala } from "../hooks/useSalaRoom";
import type { AccesorioTransform, AvatarConfig } from "../lib/types";
import { obtenerCatalogoAvatares, mapaModelUrlPorNombre } from "../lib/catalogoAvatares";

function parsearTransform(json: string): AccesorioTransform | undefined {
  if (!json) return undefined;
  try {
    const valor = JSON.parse(json);
    if (Array.isArray(valor?.offset) && typeof valor?.rotacionY === "number") {
      return valor as AccesorioTransform;
    }
  } catch {
    // Ignorar JSON inválido: AvatarModel cae solo al offset por defecto.
  }
  return undefined;
}

interface Props {
  jugadores: JugadorSala[];
  ambiente: AmbienteId;
}

const RADIO_FUERZA_AVATAR = 3.2;
const INTENSIDAD_FUERZA_AVATAR = 2.2;
const ALTURA_FUERZA_AVATAR = 1.3;

// La sincronización en Colyseus manda solo el nombre elegido (ver
// PlayerState.ts), no la URL del modelo. Se resuelve acá contra el mismo
// catálogo que usa el editor de avatar, igual que ya se hacía con el color
// de relleno (colorParaNombre).
function avatarConfigDeJugador(
  j: JugadorSala,
  modelUrlPorNombre: Record<string, string | null>
): AvatarConfig {
  return {
    capa: j.capaNombre
      ? { id: j.capaNombre, nombre: j.capaNombre, model_url: modelUrlPorNombre[j.capaNombre] }
      : null,
    disfraz: j.disfrazNombre
      ? {
          id: j.disfrazNombre,
          nombre: j.disfrazNombre,
          model_url: modelUrlPorNombre[j.disfrazNombre],
        }
      : null,
    accesorio: j.accesorioNombre
      ? {
          id: j.accesorioNombre,
          nombre: j.accesorioNombre,
          model_url: modelUrlPorNombre[j.accesorioNombre],
        }
      : null,
    accesorioTransform: parsearTransform(j.accesorioTransform),
    capaTransform: parsearTransform(j.capaTransform),
  };
}

// Mientras el ambiente activo sea un "Campo" con motor de partículas, cada
// jugador real de la sala se registra como fuente de fuerza (representante)
// en el store del motor — así las partículas reaccionan a dónde está y se
// mueve cada persona de verdad, no a esferas de demo. Se limpia sola cuando
// alguien se va o el curador cambia a un ambiente sin motor.
function useSincronizarRepresentantesReales(jugadores: JugadorSala[], ambiente: AmbienteId) {
  const idsAnterioresRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const store = useParticleStore.getState();

    if (!esCampoConMotor(ambiente)) {
      idsAnterioresRef.current.forEach((id) => store.removeRepresentanteFuerza(id));
      idsAnterioresRef.current = new Set();
      return;
    }

    const tipoEnergia = obtenerCampo(ambiente).particulas.energiaRepresentantePorDefecto;
    const idsActuales = new Set<string>();

    for (const j of jugadores) {
      const id = `avatar-${j.sessionId}`;
      idsActuales.add(id);
      const posicion: [number, number, number] = [j.x, ALTURA_FUERZA_AVATAR, j.z];
      if (idsAnterioresRef.current.has(id)) {
        store.updateRepresentantePosition(id, posicion);
      } else {
        store.addRepresentanteFuerza(
          id,
          posicion,
          tipoEnergia,
          RADIO_FUERZA_AVATAR,
          INTENSIDAD_FUERZA_AVATAR
        );
      }
    }

    idsAnterioresRef.current.forEach((id) => {
      if (!idsActuales.has(id)) store.removeRepresentanteFuerza(id);
    });
    idsAnterioresRef.current = idsActuales;
  }, [jugadores, ambiente]);

  // Limpieza si el componente se desmonta (se sale de la sala) mientras
  // había representantes reales registrados.
  useEffect(() => {
    return () => {
      const store = useParticleStore.getState();
      idsAnterioresRef.current.forEach((id) => store.removeRepresentanteFuerza(id));
    };
  }, []);
}

export default function SalaMultiplayer3D({ jugadores, ambiente }: Props) {
  const { orbitState, panHandlers, containerRef } = useOrbitCamera({
    azimuth: 0.6,
    polar: 1.0,
    radius: 7,
  });
  const [modelUrlPorNombre, setModelUrlPorNombre] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let activo = true;
    obtenerCatalogoAvatares()
      .then((items) => {
        if (activo) setModelUrlPorNombre(mapaModelUrlPorNombre(items));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  useSincronizarRepresentantesReales(jugadores, ambiente);

  return (
    <View ref={containerRef} style={styles.container} {...panHandlers}>
      <Canvas camera={{ position: [4, 4, 7], fov: 50 }}>
        {esCampoConMotor(ambiente) ? (
          <CampoAmbientalRenderer campo={obtenerCampo(ambiente)} size={14} />
        ) : (
          <Environment id={ambiente} size={14} />
        )}

        {jugadores.map((j) => (
          <AvatarModel
            key={j.sessionId}
            config={avatarConfigDeJugador(j, modelUrlPorNombre)}
            position={[j.x, 0, j.z]}
            rotation={j.rotY}
          />
        ))}

        <OrbitRig orbitState={orbitState} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
