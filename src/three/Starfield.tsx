import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  count?: number;
  radius?: number;
  // "dome": estrellas por encima del piso (salas). "sphere": estrellas
  // repartidas alrededor del origen en todas direcciones (hero del login).
  mode?: "dome" | "sphere";
}

export default function Starfield({ count = 400, radius = 22, mode = "dome" }: Props) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.55 + Math.random() * 0.45);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] =
        mode === "dome" ? Math.abs(r * Math.cos(phi) * 0.6) + 1.5 : r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count, radius, mode]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#D8B4FE"
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.75}
      />
    </points>
  );
}
