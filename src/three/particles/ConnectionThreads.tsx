import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleStore } from "./particleStore";
import { hiloFragmentShader, hiloVertexShader } from "./shaders";
import type { TipoVinculo } from "./types";

const COLOR_POR_VINCULO: Record<TipoVinculo, string> = {
  amor: "#F3C969",
  trauma: "#FF6F91",
  secreto: "#8C7FA6",
};

interface HiloProps {
  posA: [number, number, number];
  posB: [number, number, number];
  tipoVinculo: TipoVinculo;
}

// Un "hilo rojo" (o dorado, o gris según el vínculo) de partículas
// filamentosas viajando entre dos representantes: un tubo delgado con un
// shader que anima una franja de energía a lo largo de su longitud.
function Hilo({ posA, posB, tipoVinculo }: HiloProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const inicio = new THREE.Vector3(...posA);
    const fin = new THREE.Vector3(...posB);
    const medio = inicio.clone().lerp(fin, 0.5);
    medio.y += 0.35 + inicio.distanceTo(fin) * 0.08;
    const curva = new THREE.CatmullRomCurve3([inicio, medio, fin]);
    return new THREE.TubeGeometry(curva, 24, 0.025, 6, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posA[0], posA[1], posA[2], posB[0], posB[1], posB[2]]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const color = useMemo(() => new THREE.Color(COLOR_POR_VINCULO[tipoVinculo]), [tipoVinculo]);

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: color },
              uFlicker: { value: tipoVinculo === "secreto" ? 1 : 0 },
            },
            vertexShader: hiloVertexShader,
            fragmentShader: hiloFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </mesh>
  );
}

export default function ConnectionThreads() {
  const conexiones = useParticleStore((s) => s.conexiones);
  const representantes = useParticleStore((s) => s.representantes);

  return (
    <>
      {Object.values(conexiones).map((c) => {
        const a = representantes[c.idA];
        const b = representantes[c.idB];
        if (!a || !b) return null;
        return (
          <Hilo key={c.id} posA={a.position} posB={b.position} tipoVinculo={c.tipoVinculo} />
        );
      })}
    </>
  );
}
