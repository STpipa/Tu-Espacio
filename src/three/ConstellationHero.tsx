import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Starfield from "./Starfield";
import { colors } from "../lib/theme";

// Misma pose "constelar" (esqueleto de huesos abiertos, en acogida) que el
// mockup de identidad visual, pero ahora en 3D real vía three.js en vez de
// proyectada a mano sobre un canvas 2D.
const JOINTS: Record<string, [number, number, number]> = {
  head: [0, 1.6, 0],
  chest: [0, 0.95, 0],
  lShoulder: [-0.45, 0.9, 0.05],
  rShoulder: [0.45, 0.9, -0.05],
  lElbow: [-0.8, 0.5, 0.2],
  rElbow: [0.8, 0.5, -0.2],
  lHand: [-1.0, 0.05, 0.4],
  rHand: [1.0, 0.05, -0.4],
  hip: [0, 0.05, 0],
  lHip: [-0.28, 0.1, 0.03],
  rHip: [0.28, 0.1, -0.03],
  lKnee: [-0.32, -0.65, 0.12],
  rKnee: [0.32, -0.65, -0.12],
  lFoot: [-0.3, -1.35, 0.22],
  rFoot: [0.3, -1.35, -0.22],
};

const BONES: [string, string][] = [
  ["head", "chest"],
  ["chest", "lShoulder"],
  ["chest", "rShoulder"],
  ["lShoulder", "lElbow"],
  ["lElbow", "lHand"],
  ["rShoulder", "rElbow"],
  ["rElbow", "rHand"],
  ["chest", "hip"],
  ["hip", "lHip"],
  ["hip", "rHip"],
  ["lHip", "lKnee"],
  ["lKnee", "lFoot"],
  ["rHip", "rKnee"],
  ["rKnee", "rFoot"],
];

// Textura de un resplandor suave (círculo blanco que se desvanece hacia
// afuera), generada a mano con un DataTexture en vez de un <canvas> del DOM
// -no existe en el motor JS de React Native- para que funcione igual en
// web y en celular. Se tiñe con distintos colores vía la prop `color` del
// sprite, así una sola textura sirve para las dos capas del halo.
function crearTexturaResplandor(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const centro = (size - 1) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - centro) / centro;
      const dy = (y - centro) / centro;
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const alpha = Math.pow(Math.max(0, 1 - dist), 2.4);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(alpha * 255);
    }
  }

  const textura = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  textura.needsUpdate = true;
  textura.minFilter = THREE.LinearFilter;
  textura.magFilter = THREE.LinearFilter;
  return textura;
}

function Bone({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const positions = useMemo(() => new Float32Array([...from, ...to]), [from, to]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={colors.primarySoft} transparent opacity={0.7} />
    </line>
  );
}

function ConstellationFigure() {
  const group = useRef<THREE.Group>(null);
  const glow = useMemo(() => crearTexturaResplandor(), []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={group}>
      <sprite position={[0, 1.05, 0]} scale={[3.4, 3.4, 1]}>
        <spriteMaterial
          map={glow}
          color={colors.primary}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite position={[0, 1.05, 0]} scale={[1.4, 1.4, 1]}>
        <spriteMaterial
          map={glow}
          color={colors.warm}
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {BONES.map(([a, b]) => (
        <Bone key={`${a}-${b}`} from={JOINTS[a]} to={JOINTS[b]} />
      ))}

      {Object.entries(JOINTS).map(([key, pos]) => (
        <mesh key={key} position={pos}>
          <sphereGeometry args={[key === "head" ? 0.09 : 0.05, 10, 10]} />
          <meshBasicMaterial color={colors.text} />
        </mesh>
      ))}
    </group>
  );
}

// Encuadre explícito: sin esto, la cámara mira derecho por su eje -z y con
// la figura llegándole hasta y=1.6 (cabeza) la corta arriba del canvas.
function CameraAim({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

export default function ConstellationHero() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas camera={{ position: [0, 0.3, 4.9], fov: 40 }}>
        <color attach="background" args={[colors.background]} />
        <fog attach="fog" args={[colors.background, 6, 13]} />
        <ambientLight intensity={0.6} />
        <CameraAim target={[0, 0.25, 0]} />
        <Starfield count={220} radius={9} mode="sphere" />
        <ConstellationFigure />
      </Canvas>
    </View>
  );
}
