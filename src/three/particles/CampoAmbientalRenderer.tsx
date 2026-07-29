import React, { useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleStore } from "./particleStore";
import ParticleSystemManager from "./ParticleSystemManager";
import ConnectionThreads from "./ConnectionThreads";
import type { CampoAmbientalConfig } from "./types";

interface Props {
  campo: CampoAmbientalConfig;
  size?: number;
}

const DURACION_TRANSICION = 2; // segundos, pedido explícito del prompt original
const ID_FUERZA_CAMPO = "__campo_central__";

// Menos partículas en celular: la simulación corre en CPU (ver
// ParticleSystemManager) y un teléfono gama media no sostiene 60fps con la
// misma cantidad que una desktop.
const PARTICULAS_POR_DEFECTO = Platform.OS === "web" ? 7000 : 2500;

interface Snapshot {
  fondo: THREE.Color;
  niebla: THREE.Color;
  near: number;
  far: number;
  luzAmb: THREE.Color;
  intAmb: number;
  luzDir: THREE.Color;
  intDir: number;
}

function snapshotDeCampo(campo: CampoAmbientalConfig): Snapshot {
  return {
    fondo: new THREE.Color(campo.fondo),
    niebla: new THREE.Color(campo.niebla.color),
    near: campo.niebla.near,
    far: campo.niebla.far,
    luzAmb: new THREE.Color(campo.luzAmbiente.color),
    intAmb: campo.luzAmbiente.intensidad,
    luzDir: new THREE.Color(campo.luzDireccional.color),
    intDir: campo.luzDireccional.intensidad,
  };
}

function lerpSnapshot(a: Snapshot, b: Snapshot, k: number): Snapshot {
  return {
    fondo: a.fondo.clone().lerp(b.fondo, k),
    niebla: a.niebla.clone().lerp(b.niebla, k),
    near: THREE.MathUtils.lerp(a.near, b.near, k),
    far: THREE.MathUtils.lerp(a.far, b.far, k),
    luzAmb: a.luzAmb.clone().lerp(b.luzAmb, k),
    intAmb: THREE.MathUtils.lerp(a.intAmb, b.intAmb, k),
    luzDir: a.luzDir.clone().lerp(b.luzDir, k),
    intDir: THREE.MathUtils.lerp(a.intDir, b.intDir, k),
  };
}

// ---------- Piso: grilla deformada (Horizonte de agujero negro) ----------
function PisoGrilla({ size, color }: { size: number; color: string }) {
  const geometria = useMemo(() => {
    const segmentos = 44;
    const geo = new THREE.PlaneGeometry(size, size, segmentos, segmentos);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);
      const y = -3.4 * (1.4 / (d + 1.4));
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, [size]);

  return (
    <mesh geometry={geometria}>
      <meshBasicMaterial color={color} wireframe transparent opacity={0.55} />
    </mesh>
  );
}

// ---------- Piso: grietas brillantes (Infierno / Submundo) ----------
function PisoAgrietado({ size, colorBase }: { size: number; colorBase: string }) {
  const luzRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (luzRef.current) {
      luzRef.current.intensity = 0.8 + Math.sin(clock.getElapsedTime() * 3.2) * 0.25;
    }
  });
  const grietas = useMemo(
    () =>
      Array.from({ length: 7 }).map(() => ({
        x: (Math.random() - 0.5) * size * 0.7,
        z: (Math.random() - 0.5) * size * 0.7,
        rot: Math.random() * Math.PI,
        largo: 1.4 + Math.random() * 2.4,
      })),
    [size]
  );
  return (
    <>
      <pointLight ref={luzRef} position={[0, 3, 0]} color="#FF5C3D" intensity={0.9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={colorBase} />
      </mesh>
      {grietas.map((g, i) => (
        <mesh key={i} position={[g.x, 0.01, g.z]} rotation={[-Math.PI / 2, 0, g.rot]}>
          <planeGeometry args={[0.2, g.largo]} />
          <meshStandardMaterial color="#FF7A45" emissive="#FF4400" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  );
}

function Piso({ campo, size }: { campo: CampoAmbientalConfig; size: number }) {
  switch (campo.piso.tipo) {
    case "reflectante":
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size, size]} />
          <meshStandardMaterial color={campo.piso.color} metalness={0.55} roughness={0.2} />
        </mesh>
      );
    case "grilla":
      return <PisoGrilla size={size} color={campo.piso.color} />;
    case "agrietado":
      return <PisoAgrietado size={size} colorBase={campo.piso.color} />;
    default:
      return null;
  }
}

// Renderiza un campo ambiental (fondo, niebla, luces y piso) con una
// transición suave de 2s entre uno y otro, y arma el motor de partículas +
// los hilos de conexión encima. También registra en el store la fuerza
// ambiental propia del campo (ej. la atracción central del agujero negro),
// si la tiene.
export default function CampoAmbientalRenderer({ campo, size = 12 }: Props) {
  const { scene } = useThree();
  const addRepresentanteFuerza = useParticleStore((s) => s.addRepresentanteFuerza);
  const removeRepresentanteFuerza = useParticleStore((s) => s.removeRepresentanteFuerza);

  const luzAmbRef = useRef<THREE.AmbientLight>(null);
  const luzDirRef = useRef<THREE.DirectionalLight>(null);

  const inicioRef = useRef<Snapshot>(snapshotDeCampo(campo));
  const finRef = useRef<Snapshot>(snapshotDeCampo(campo));
  const progresoRef = useRef(1);
  const mostradoRef = useRef<Snapshot>(snapshotDeCampo(campo));

  useEffect(() => {
    scene.fog = new THREE.Fog(
      mostradoRef.current.niebla.getHex(),
      mostradoRef.current.near,
      mostradoRef.current.far
    );
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useEffect(() => {
    inicioRef.current = mostradoRef.current;
    finRef.current = snapshotDeCampo(campo);
    progresoRef.current = 0;
  }, [campo]);

  useEffect(() => {
    const fc = campo.particulas.fuerzaCentral;
    if (fc) {
      addRepresentanteFuerza(ID_FUERZA_CAMPO, [0, 1.3, 0], fc.tipo, fc.radio, fc.intensidad);
    } else {
      removeRepresentanteFuerza(ID_FUERZA_CAMPO);
    }
  }, [campo, addRepresentanteFuerza, removeRepresentanteFuerza]);

  useEffect(() => () => removeRepresentanteFuerza(ID_FUERZA_CAMPO), [removeRepresentanteFuerza]);

  useFrame((_, delta) => {
    progresoRef.current = Math.min(1, progresoRef.current + delta / DURACION_TRANSICION);
    const actual = lerpSnapshot(inicioRef.current, finRef.current, progresoRef.current);
    mostradoRef.current = actual;

    scene.background = actual.fondo;
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(actual.niebla);
      scene.fog.near = actual.near;
      scene.fog.far = actual.far;
    }
    if (luzAmbRef.current) {
      luzAmbRef.current.color.copy(actual.luzAmb);
      luzAmbRef.current.intensity = actual.intAmb;
    }
    if (luzDirRef.current) {
      luzDirRef.current.color.copy(actual.luzDir);
      luzDirRef.current.intensity = actual.intDir;
    }
  });

  return (
    <>
      <ambientLight ref={luzAmbRef} />
      <directionalLight ref={luzDirRef} position={campo.luzDireccional.posicion} castShadow />

      <Piso campo={campo} size={size} />

      <ParticleSystemManager
        count={PARTICULAS_POR_DEFECTO}
        bounds={size / 2.2}
        colorBase={campo.particulas.color}
        tamanoBase={campo.particulas.tamano}
      />
      <ConnectionThreads />
    </>
  );
}
