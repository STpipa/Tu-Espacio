import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@react-three/fiber";
import AvatarModel from "./AvatarModel";
import OrbitRig from "./OrbitRig";
import Environment, { type EnvironmentId } from "./Environment";
import { useOrbitCamera } from "./useOrbitCamera";
import type { JugadorSala } from "../hooks/useSalaRoom";
import type { AvatarConfig } from "../lib/types";
import { obtenerCatalogoAvatares, mapaModelUrlPorNombre } from "../lib/catalogoAvatares";

interface Props {
  jugadores: JugadorSala[];
  environment: EnvironmentId;
}

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
      ? { id: j.accesorioNombre, nombre: j.accesorioNombre }
      : null,
  };
}

export default function SalaMultiplayer3D({ jugadores, environment }: Props) {
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

  return (
    <View ref={containerRef} style={styles.container} {...panHandlers}>
      <Canvas camera={{ position: [4, 4, 7], fov: 50 }}>
        <Environment id={environment} size={14} />

        {jugadores.map((j) => (
          <AvatarModel
            key={j.sessionId}
            config={avatarConfigDeJugador(j, modelUrlPorNombre)}
            position={[j.x, 0, j.z]}
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
