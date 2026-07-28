import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@react-three/fiber";
import AvatarModel from "./AvatarModel";
import OrbitRig from "./OrbitRig";
import Starfield from "./Starfield";
import { useOrbitCamera } from "./useOrbitCamera";
import type { JugadorSala } from "../hooks/useSalaRoom";
import type { AvatarConfig } from "../lib/types";
import { obtenerCatalogoAvatares, mapaModelUrlPorNombre } from "../lib/catalogoAvatares";

interface Props {
  jugadores: JugadorSala[];
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

export default function SalaMultiplayer3D({ jugadores }: Props) {
  const { orbitState, panHandlers } = useOrbitCamera({
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
    <View style={styles.container} {...panHandlers}>
      <Canvas camera={{ position: [4, 4, 7], fov: 50 }}>
        <color attach="background" args={["#0F0919"]} />
        <fog attach="fog" args={["#0F0919", 14, 32]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
        <pointLight position={[0, 4, 0]} intensity={0.6} color="#9D5CFF" />

        <Starfield />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <meshStandardMaterial color="#1B1130" />
        </mesh>

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
