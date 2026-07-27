import React from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@react-three/fiber";
import AvatarModel from "./AvatarModel";
import OrbitRig from "./OrbitRig";
import { useOrbitCamera } from "./useOrbitCamera";
import type { JugadorSala } from "../hooks/useSalaRoom";
import type { AvatarConfig } from "../lib/types";

interface Props {
  jugadores: JugadorSala[];
}

function avatarConfigDeJugador(j: JugadorSala): AvatarConfig {
  return {
    capa: j.capaNombre ? { id: j.capaNombre, nombre: j.capaNombre } : null,
    disfraz: j.disfrazNombre ? { id: j.disfrazNombre, nombre: j.disfrazNombre } : null,
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

  return (
    <View style={styles.container} {...panHandlers}>
      <Canvas camera={{ position: [4, 4, 7], fov: 50 }}>
        <color attach="background" args={["#F7F3EC"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <meshStandardMaterial color="#DCD3B8" />
        </mesh>

        {jugadores.map((j) => (
          <AvatarModel
            key={j.sessionId}
            config={avatarConfigDeJugador(j)}
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
