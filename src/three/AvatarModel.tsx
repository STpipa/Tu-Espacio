import React, { Suspense, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as clonarConEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  ACCESORIO_TRANSFORM_DEFAULT,
  APARIENCIA_DEFAULT,
  CAPA_TRANSFORM_DEFAULT,
  type AccesorioTransform,
  type AvatarApariencia,
  type AvatarConfig,
  type AvatarSeleccion,
} from "../lib/types";
import { colorParaNombre } from "./avatarVisuals";

interface Props {
  config: AvatarConfig;
  position: [number, number, number];
  // Hacia dónde mira el avatar (radianes, eje Y). 0 = orientación original
  // del modelo.
  rotation?: number;
}

// Tinte/opacidad/brillo sobre todos los materiales del modelo — clona cada
// material primero (si no, dos avatares con el mismo modelo comparten
// material y uno le pinta el color al otro). `color` tiñe multiplicando
// sobre la textura existente (no la reemplaza), es el comportamiento
// estándar de `material.color` en three.js cuando hay un `map`.
function aplicarApariencia(escena: THREE.Object3D, apariencia: AvatarApariencia) {
  const { color, opacidad, brillo } = apariencia;
  if (!color && opacidad >= 1 && brillo <= 0) return;

  escena.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materiales = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) =>
      (m as THREE.MeshStandardMaterial).clone()
    );
    mesh.material = materiales.length === 1 ? materiales[0] : materiales;
    for (const mat of materiales) {
      if (color) mat.color.set(color);
      mat.transparent = opacidad < 1;
      mat.opacity = opacidad;
      if (brillo > 0) {
        mat.emissive = new THREE.Color(color ?? mat.color);
        mat.emissiveIntensity = brillo;
      }
    }
  });
}

// Placeholder mientras no haya (o falle la carga de) un modelo .glb real:
// una cápsula + cabeza esférica, coloreada de forma determinística según
// el nombre de la capa/disfraz elegido.
function CuerpoPlaceholder({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#F1C6A0" />
      </mesh>
    </>
  );
}

function CuerpoModeloReal({ url, apariencia }: { url: string; apariencia: AvatarApariencia }) {
  const gltf = useLoader(GLTFLoader, url);
  // Clonado: si dos avatares usan el mismo modelo, cada uno necesita su
  // propia instancia de escena (three.js no permite un Object3D con dos
  // padres). OJO: el `.clone(true)` genérico de Object3D NO clona bien
  // los huesos de un modelo con esqueleto (los packs de itch.io vienen
  // riggeados) — el mesh queda atado a los huesos ORIGINALES, que nunca se
  // mueven ni rotan, así que el cuerpo se ve "pegado" en su lugar aunque
  // el grupo padre se mueva o gire (el accesorio, sin huesos, sí se
  // clona bien y por eso se movía solo). `SkeletonUtils.clone` remapea los
  // huesos a la copia clonada correctamente.
  const escena = useMemo(() => {
    const clon = clonarConEsqueleto(gltf.scene);
    aplicarApariencia(clon, apariencia);
    return clon;
  }, [gltf, apariencia]);
  return <primitive object={escena} />;
}

// Los modelos .glb tardan en bajar de Supabase Storage y a veces pueden
// fallar (URL rota, sin conexión). Suspense cubre la espera; este boundary
// (tiene que ser de clase, React no ofrece uno funcional) cubre el error,
// así una falla de un avatar puntual nunca tira abajo la sala 3D entera.
class LimiteDeError extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { fallo: boolean }
> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.fallo ? this.props.fallback : this.props.children;
  }
}

function AccesorioPlaceholder({ color, transform }: { color: string; transform: AccesorioTransform }) {
  return (
    <mesh
      position={transform.offset}
      rotation={[0, transform.rotacionY, 0]}
      scale={transform.escala}
      castShadow
    >
      <boxGeometry args={[0.12, 0.5, 0.12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function AccesorioModeloReal({
  url,
  transform,
  apariencia,
}: {
  url: string;
  transform: AccesorioTransform;
  apariencia: AvatarApariencia;
}) {
  const gltf = useLoader(GLTFLoader, url);
  // Mismo motivo que en CuerpoModeloReal — por las dudas de que algún
  // accesorio venga riggeado en vez de ser un mesh estático simple.
  const escena = useMemo(() => {
    const clon = clonarConEsqueleto(gltf.scene);
    aplicarApariencia(clon, apariencia);
    return clon;
  }, [gltf, apariencia]);
  return (
    <group
      position={transform.offset}
      rotation={[0, transform.rotacionY, 0]}
      scale={transform.escala}
    >
      <primitive object={escena} />
    </group>
  );
}

// Un anexo (capa o accesorio): un modelo aparte que se dibuja junto al
// cuerpo con su propio offset/rotación/escala, en vez de reemplazarlo. La
// capa dejó de ser una piel alternativa del cuerpo (eso tapaba el disfraz
// elegido, o al revés) y pasó a comportarse igual que un accesorio — se
// puede usar junto con cualquier disfraz.
function Anexo({
  seleccion,
  transform,
  apariencia,
}: {
  seleccion: AvatarSeleccion;
  transform: AccesorioTransform;
  apariencia: AvatarApariencia;
}) {
  if (!seleccion) return null;
  const color = colorParaNombre(seleccion.nombre);
  if (!seleccion.model_url) {
    return <AccesorioPlaceholder color={color} transform={transform} />;
  }
  return (
    <LimiteDeError fallback={<AccesorioPlaceholder color={color} transform={transform} />}>
      <Suspense fallback={<AccesorioPlaceholder color={color} transform={transform} />}>
        <AccesorioModeloReal url={seleccion.model_url} transform={transform} apariencia={apariencia} />
      </Suspense>
    </LimiteDeError>
  );
}

export default function AvatarModel({ config, position, rotation = 0 }: Props) {
  const cuerpoNombre = config.disfraz?.nombre ?? "Traje Clásico";
  const colorCuerpo = colorParaNombre(cuerpoNombre);
  const modelUrl = config.disfraz?.model_url ?? null;
  // Merge con el default por si el config guardado es viejo y no trae `escala`.
  const capaTransform = { ...CAPA_TRANSFORM_DEFAULT, ...(config.capaTransform ?? {}) };
  const accesorioTransform = { ...ACCESORIO_TRANSFORM_DEFAULT, ...(config.accesorioTransform ?? {}) };
  const apariencia = config.apariencia ?? APARIENCIA_DEFAULT;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {modelUrl ? (
        <LimiteDeError fallback={<CuerpoPlaceholder color={colorCuerpo} />}>
          <Suspense fallback={<CuerpoPlaceholder color={colorCuerpo} />}>
            <CuerpoModeloReal url={modelUrl} apariencia={apariencia} />
          </Suspense>
        </LimiteDeError>
      ) : (
        <CuerpoPlaceholder color={colorCuerpo} />
      )}

      <Anexo seleccion={config.capa} transform={capaTransform} apariencia={apariencia} />
      <Anexo seleccion={config.accesorio} transform={accesorioTransform} apariencia={apariencia} />
    </group>
  );
}
