import React from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@react-three/fiber";
import AvatarModel from "./AvatarModel";
import OrbitRig from "./OrbitRig";
import Environment, { type EnvironmentId } from "./Environment";
import { useOrbitCamera } from "./useOrbitCamera";
import type { AvatarConfig } from "../lib/types";

interface Props {
  avatarConfig: AvatarConfig;
  avatarPosition: { x: number; z: number };
  avatarRotation?: number;
  environment: EnvironmentId;
}

export default function Sala3D({
  avatarConfig,
  avatarPosition,
  avatarRotation = 0,
  environment,
}: Props) {
  const { orbitState, panHandlers, containerRef } = useOrbitCamera({
    azimuth: 0.6,
    polar: 1.0,
    radius: 6,
  });

  return (
    <View ref={containerRef} style={styles.container} {...panHandlers}>
      <Canvas camera={{ position: [4, 4, 6], fov: 50 }}>
        <Environment id={environment} size={12} />

        <AvatarModel
          config={avatarConfig}
          position={[avatarPosition.x, 0, avatarPosition.z]}
          rotation={avatarRotation}
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
