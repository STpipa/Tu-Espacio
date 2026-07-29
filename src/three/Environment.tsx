import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Starfield from "./Starfield";

export type EnvironmentId = "noche" | "paraiso" | "infierno" | "tierra" | "mar";

export const ENTORNOS: { id: EnvironmentId; label: string; color: string }[] = [
  { id: "noche", label: "Noche constelar", color: "#9D5CFF" },
  { id: "paraiso", label: "Paraíso", color: "#FFD873" },
  { id: "infierno", label: "Infierno", color: "#FF5C3D" },
  { id: "tierra", label: "Tierra", color: "#6FCB6F" },
  { id: "mar", label: "Bajo el mar", color: "#3DBFD9" },
];

interface EnvProps {
  size: number;
}

// ---------- Partículas genéricas (embers, burbujas, brillos) ----------
// Reutilizable entre entornos: un chorro de puntos que sube y se reinicia
// abajo al llegar arriba del todo, como el Starfield pero vertical.
function Particulas({
  count,
  radio,
  altura,
  velocidad,
  color,
  tamano,
  opacidad,
}: {
  count: number;
  radio: number;
  altura: number;
  velocidad: number;
  color: string;
  tamano: number;
  opacidad: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const { posiciones, velocidades } = useMemo(() => {
    const posiciones = new Float32Array(count * 3);
    const velocidades = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      posiciones[i * 3] = (Math.random() - 0.5) * radio * 2;
      posiciones[i * 3 + 1] = Math.random() * altura;
      posiciones[i * 3 + 2] = (Math.random() - 0.5) * radio * 2;
      velocidades[i] = velocidad * (0.6 + Math.random() * 0.8);
    }
    return { posiciones, velocidades };
  }, [count, radio, altura, velocidad]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + velocidades[i] * delta;
      if (y > altura) y = 0;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={tamano}
        transparent
        opacity={opacidad}
        sizeAttenuation
      />
    </points>
  );
}

// ---------- Nubes (Tierra / Paraíso) ----------
function Nube({
  x,
  y,
  z,
  escala,
  velocidad,
  limite,
}: {
  x: number;
  y: number;
  z: number;
  escala: number;
  velocidad: number;
  limite: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += velocidad * delta;
    if (ref.current.position.x > limite) ref.current.position.x = -limite;
  });
  return (
    <group ref={ref} position={[x, y, z]} scale={escala}>
      {[
        [0, 0, 0, 0.6],
        [0.55, 0.08, 0, 0.45],
        [-0.55, 0.05, 0.05, 0.4],
      ].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]}>
          <sphereGeometry args={[r, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Cielo({ cantidad, limite }: { cantidad: number; limite: number }) {
  const nubes = useMemo(
    () =>
      Array.from({ length: cantidad }).map(() => ({
        x: (Math.random() - 0.5) * limite * 2,
        y: 4 + Math.random() * 2.5,
        z: -3 - Math.random() * 6,
        escala: 0.8 + Math.random() * 1.1,
        velocidad: 0.15 + Math.random() * 0.2,
      })),
    [cantidad, limite]
  );
  return (
    <>
      {nubes.map((n, i) => (
        <Nube key={i} {...n} limite={limite} />
      ))}
    </>
  );
}

// ---------- Palmeras (Paraíso) ----------
function Palmera({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 2, 6]} />
        <meshStandardMaterial color="#8B5E3C" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0, 2.05, 0]}
          rotation={[0.5, (i / 5) * Math.PI * 2, 0]}
        >
          <coneGeometry args={[0.18, 1.1, 4]} />
          <meshStandardMaterial color="#3FA34D" />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Peces de colores (Bajo el mar) ----------
const COLORES_PEZ = ["#FF6F61", "#FFD166", "#06D6A0", "#4CC9F0", "#EF476F", "#F4A261"];

function Pez({
  radio,
  altura,
  velocidad,
  fase,
  color,
}: {
  radio: number;
  altura: number;
  velocidad: number;
  fase: number;
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * velocidad + fase;
    ref.current.position.set(
      Math.cos(t) * radio,
      altura + Math.sin(t * 2.3) * 0.15,
      Math.sin(t) * radio
    );
    ref.current.rotation.y = -t + Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <mesh scale={[1, 0.55, 0.4]} castShadow>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.13, 0.2, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Cardumen({ cantidad = 10 }: { cantidad?: number }) {
  const peces = useMemo(
    () =>
      Array.from({ length: cantidad }).map((_, i) => ({
        radio: 1.8 + Math.random() * 4,
        altura: 0.6 + Math.random() * 2.4,
        velocidad: 0.22 + Math.random() * 0.35,
        fase: Math.random() * Math.PI * 2,
        color: COLORES_PEZ[i % COLORES_PEZ.length],
      })),
    [cantidad]
  );
  return (
    <>
      {peces.map((p, i) => (
        <Pez key={i} {...p} />
      ))}
    </>
  );
}

// ---------- Grietas de lava (Infierno) ----------
function Lava({ size }: { size: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.intensity = 0.9 + Math.sin(clock.getElapsedTime() * 3) * 0.25;
  });
  const grietas = useMemo(
    () =>
      Array.from({ length: 6 }).map(() => ({
        x: (Math.random() - 0.5) * size * 0.7,
        z: (Math.random() - 0.5) * size * 0.7,
        rot: Math.random() * Math.PI,
        largo: 1.5 + Math.random() * 2.5,
      })),
    [size]
  );
  return (
    <>
      <pointLight ref={ref} position={[0, 3, 0]} color="#FF5C3D" intensity={1} />
      {grietas.map((g, i) => (
        <mesh
          key={i}
          position={[g.x, 0.02, g.z]}
          rotation={[-Math.PI / 2, 0, g.rot]}
        >
          <planeGeometry args={[0.25, g.largo]} />
          <meshStandardMaterial color="#FF7A45" emissive="#FF4400" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  );
}

// ---------- Los 5 entornos ----------
function NocheEnv({ size }: EnvProps) {
  return (
    <>
      <color attach="background" args={["#0F0919"]} />
      <fog attach="fog" args={["#0F0919", 12, 30]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
      <pointLight position={[0, 4, 0]} intensity={0.6} color="#9D5CFF" />
      <Starfield />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#1B1130" />
      </mesh>
    </>
  );
}

function ParaisoEnv({ size }: EnvProps) {
  return (
    <>
      <color attach="background" args={["#BFEAFF"]} />
      <fog attach="fog" args={["#DFF4FF", 16, 34]} />
      <ambientLight intensity={0.85} color="#FFF6DD" />
      <directionalLight position={[6, 9, 4]} intensity={1.1} color="#FFE9B0" castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#F4E3A1" />
      </mesh>
      <Palmera x={-4} z={-3} />
      <Palmera x={4.2} z={-2} />
      <Palmera x={-3} z={3.5} />
      <Cielo cantidad={4} limite={size / 2} />
      <Particulas
        count={60}
        radio={size / 2.2}
        altura={5}
        velocidad={0.25}
        color="#FFE9A8"
        tamano={0.06}
        opacidad={0.8}
      />
    </>
  );
}

function InfiernoEnv({ size }: EnvProps) {
  return (
    <>
      <color attach="background" args={["#1A0503"]} />
      <fog attach="fog" args={["#2B0705", 8, 24]} />
      <ambientLight intensity={0.4} color="#FF6A3D" />
      <directionalLight position={[3, 6, -4]} intensity={0.6} color="#FF3B1F" />
      <Lava size={size} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#231311" />
      </mesh>
      <Particulas
        count={90}
        radio={size / 2.2}
        altura={4.5}
        velocidad={0.5}
        color="#FF7A3D"
        tamano={0.05}
        opacidad={0.85}
      />
    </>
  );
}

function TierraEnv({ size }: EnvProps) {
  return (
    <>
      <color attach="background" args={["#9FD3F5"]} />
      <fog attach="fog" args={["#BEE4FA", 18, 36]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 10, 5]} intensity={1.15} color="#FFFCEF" castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#5FAE5C" />
      </mesh>
      <Cielo cantidad={5} limite={size / 2} />
    </>
  );
}

function MarEnv({ size }: EnvProps) {
  return (
    <>
      <color attach="background" args={["#043A52"]} />
      <fog attach="fog" args={["#0B5A7A", 9, 26]} />
      <ambientLight intensity={0.65} color="#BEEFFF" />
      <directionalLight position={[2, 10, 2]} intensity={0.7} color="#CFF6FF" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#D8C48A" />
      </mesh>
      <Cardumen cantidad={11} />
      <Particulas
        count={70}
        radio={size / 2.2}
        altura={5}
        velocidad={0.35}
        color="#EAFBFF"
        tamano={0.04}
        opacidad={0.6}
      />
    </>
  );
}

export default function Environment({ id, size }: { id: EnvironmentId; size: number }) {
  switch (id) {
    case "paraiso":
      return <ParaisoEnv size={size} />;
    case "infierno":
      return <InfiernoEnv size={size} />;
    case "tierra":
      return <TierraEnv size={size} />;
    case "mar":
      return <MarEnv size={size} />;
    default:
      return <NocheEnv size={size} />;
  }
}
