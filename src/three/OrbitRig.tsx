import React from "react";
import { useFrame } from "@react-three/fiber";
import type { OrbitState } from "./useOrbitCamera";

export default function OrbitRig({
  orbitState,
}: {
  orbitState: React.MutableRefObject<OrbitState>;
}) {
  useFrame(({ camera }) => {
    const { azimuth, polar, radius } = orbitState.current;
    camera.position.set(
      radius * Math.sin(polar) * Math.sin(azimuth),
      radius * Math.cos(polar),
      radius * Math.sin(polar) * Math.cos(azimuth)
    );
    camera.lookAt(0, 1, 0);
  });
  return null;
}
