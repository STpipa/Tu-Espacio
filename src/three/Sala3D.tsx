import React from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@react-three/fiber";
import AvatarModel from "./AvatarModel";
import OrbitRig from "./OrbitRig";
import { useOrbitCamera } from "./useOrbitCamera";
import type { AvatarConfig } from "../lib/types";

interface Props {
  avatarConfig: AvatarConfig;
  avatarPosition: { x: number; z: number };
}

export default function Sala3D({ avatarConfig, avatarPosition }: Props) {
  const { orbitState, panHandlers } = useOrbitCamera({
    azimuth: 0.6,
    polar: 1.0,
    radius: 6,
  });

  return (
    <View style={styles.container} {...panHandlers}>
      <Canvas camera={{ position: [4, 4, 6], fov: 50 }}>
        <color attach="background" args={["#F7F3EC"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#DCD3B8" />
        </mesh>

        <AvatarModel
          config={avatarConfig}
          position={[avatarPosition.x, 0, avatarPosition.z]}
        />

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
