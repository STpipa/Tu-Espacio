import React from "react";
import type { AvatarConfig } from "../lib/types";
import { colorParaNombre } from "./avatarVisuals";

interface Props {
  config: AvatarConfig;
  position: [number, number, number];
}

// Representación placeholder (cápsula + accesorio) mientras no haya modelos
// .glb reales cargados en catalogo_avatares. El nombre de la capa/disfraz
// seleccionado define el color del cuerpo; el disfraz, si hay uno, manda
// sobre la capa base.
export default function AvatarModel({ config, position }: Props) {
  const cuerpoNombre = config.disfraz?.nombre ?? config.capa?.nombre ?? "Traje Clásico";
  const colorCuerpo = colorParaNombre(cuerpoNombre);

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
        <meshStandardMaterial color={colorCuerpo} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#F1C6A0" />
      </mesh>
      {config.accesorio ? (
        <mesh position={[0.55, 1.2, 0.1]} rotation={[0, 0, Math.PI / 5]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={colorParaNombre(config.accesorio.nombre)} />
        </mesh>
      ) : null}
    </group>
  );
}
