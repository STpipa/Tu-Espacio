import React, { Suspense, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ACCESORIO_TRANSFORM_DEFAULT, type AccesorioTransform, type AvatarConfig } from "../lib/types";
import { colorParaNombre } from "./avatarVisuals";

interface Props {
  config: AvatarConfig;
  position: [number, number, number];
  // Hacia dónde mira el avatar (radianes, eje Y). 0 = orientación original
  // del modelo.
  rotation?: number;
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

function CuerpoModeloReal({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  // Clonado: si dos avatares usan el mismo modelo, cada uno necesita su
  // propia instancia de escena (three.js no permite un Object3D con dos padres).
  const escena = useMemo(() => gltf.scene.clone(true), [gltf]);
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
    <mesh position={transform.offset} rotation={[0, transform.rotacionY, 0]} castShadow>
      <boxGeometry args={[0.12, 0.5, 0.12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function AccesorioModeloReal({ url, transform }: { url: string; transform: AccesorioTransform }) {
  const gltf = useLoader(GLTFLoader, url);
  const escena = useMemo(() => gltf.scene.clone(true), [gltf]);
  return (
    <group position={transform.offset} rotation={[0, transform.rotacionY, 0]}>
      <primitive object={escena} />
    </group>
  );
}

export default function AvatarModel({ config, position, rotation = 0 }: Props) {
  const cuerpoNombre = config.disfraz?.nombre ?? config.capa?.nombre ?? "Traje Clásico";
  const colorCuerpo = colorParaNombre(cuerpoNombre);
  const modelUrl = config.disfraz?.model_url ?? config.capa?.model_url ?? null;
  const accesorioTransform = config.accesorioTransform ?? ACCESORIO_TRANSFORM_DEFAULT;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {modelUrl ? (
        <LimiteDeError fallback={<CuerpoPlaceholder color={colorCuerpo} />}>
          <Suspense fallback={<CuerpoPlaceholder color={colorCuerpo} />}>
            <CuerpoModeloReal url={modelUrl} />
          </Suspense>
        </LimiteDeError>
      ) : (
        <CuerpoPlaceholder color={colorCuerpo} />
      )}

      {config.accesorio ? (
        config.accesorio.model_url ? (
          <LimiteDeError
            fallback={
              <AccesorioPlaceholder
                color={colorParaNombre(config.accesorio.nombre)}
                transform={accesorioTransform}
              />
            }
          >
            <Suspense
              fallback={
                <AccesorioPlaceholder
                  color={colorParaNombre(config.accesorio.nombre)}
                  transform={accesorioTransform}
                />
              }
            >
              <AccesorioModeloReal url={config.accesorio.model_url} transform={accesorioTransform} />
            </Suspense>
          </LimiteDeError>
        ) : (
          <AccesorioPlaceholder
            color={colorParaNombre(config.accesorio.nombre)}
            transform={accesorioTransform}
          />
        )
      ) : null}
    </group>
  );
}
