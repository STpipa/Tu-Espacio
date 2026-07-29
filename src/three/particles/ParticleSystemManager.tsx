import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParticleStore } from "./particleStore";
import { ruido3D } from "./noise";
import { particulaFragmentShader, particulaVertexShader } from "./shaders";
import type { RepresentanteFuerza } from "./types";

interface Props {
  count?: number;
  bounds?: number;
  centro?: [number, number, number];
  colorBase?: string;
  tamanoBase?: number;
  opacidad?: number;
}

const AMORTIGUACION = 0.94;
const RETORNO_A_CASA = 0.045;
const FRECUENCIA_TURBULENCIA = 0.35;

// Simulación del enjambre de partículas en CPU (posición/velocidad/carga
// viven en Float32Array planos, sin pasar por React) + render en GPU vía un
// ShaderMaterial custom sobre un único `Points`. A esta escala (miles de
// partículas, no millones) esto es exactamente cómo se hacen estos sistemas
// en three.js en la práctica — un "compute shader" real (GPGPU con
// render-targets) recién se justifica en un orden de magnitud más de
// partículas, y WebGL1 (algunos celulares) ni lo soporta bien.
export default function ParticleSystemManager({
  count = 6000,
  bounds = 6,
  centro = [0, 1.3, 0],
  colorBase = "#B9A6FF",
  tamanoBase = 0.07,
  opacidad = 0.85,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { posiciones, colores, tamanos, cargasIniciales, velocidades, basePos, cargas } =
    useMemo(() => {
      const posiciones = new Float32Array(count * 3);
      const colores = new Float32Array(count * 3);
      const tamanos = new Float32Array(count);
      const cargasIniciales = new Float32Array(count);
      const velocidades = new Float32Array(count * 3);
      const basePos = new Float32Array(count * 3);
      const cargas = new Float32Array(count);
      const color = new THREE.Color(colorBase);

      for (let i = 0; i < count; i++) {
        // Distribución esférica pareja alrededor del centro del campo.
        const r = bounds * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = centro[0] + r * Math.sin(phi) * Math.cos(theta);
        const y = centro[1] + r * Math.cos(phi) * 0.6;
        const z = centro[2] + r * Math.sin(phi) * Math.sin(theta);

        posiciones[i * 3] = x;
        posiciones[i * 3 + 1] = y;
        posiciones[i * 3 + 2] = z;
        basePos[i * 3] = x;
        basePos[i * 3 + 1] = y;
        basePos[i * 3 + 2] = z;

        colores[i * 3] = color.r;
        colores[i * 3 + 1] = color.g;
        colores[i * 3 + 2] = color.b;

        tamanos[i] = tamanoBase * (0.6 + Math.random() * 0.8);
        cargasIniciales[i] = (Math.random() - 0.5) * 0.4;
        cargas[i] = cargasIniciales[i];
      }

      return { posiciones, colores, tamanos, cargasIniciales, velocidades, basePos, cargas };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, bounds, centro[0], centro[1], centro[2], colorBase, tamanoBase]);

  useFrame(({ clock }, delta) => {
    const points = pointsRef.current;
    const material = materialRef.current;
    if (!points || !material) return;

    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();
    const fuerzas: RepresentanteFuerza[] = Object.values(
      useParticleStore.getState().representantes
    );

    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const cargaAttr = points.geometry.attributes.aCarga as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      let px = posiciones[ix];
      let py = posiciones[ix + 1];
      let pz = posiciones[ix + 2];
      let vx = velocidades[ix];
      let vy = velocidades[ix + 1];
      let vz = velocidades[ix + 2];

      let fx = 0;
      let fy = 0;
      let fz = 0;
      let cargaObjetivo = cargasIniciales[i];

      for (const f of fuerzas) {
        const dx = px - f.position[0];
        const dy = py - f.position[1];
        const dz = pz - f.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
        if (dist >= f.radio) continue;

        const falloff = 1 - dist / f.radio;
        const fuerza = f.intensidad * falloff;

        if (f.tipoEnergia === "repulsion") {
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          // Vórtice: además de empujar hacia afuera, un componente
          // tangencial (perpendicular en el plano XZ) para que gire en
          // vez de simplemente dispersarse en línea recta.
          fx += nx * fuerza - nz * fuerza * 0.6;
          fy += ny * fuerza * 0.3;
          fz += nz * fuerza + nx * fuerza * 0.6;
          cargaObjetivo = -1;
        } else if (f.tipoEnergia === "atraccion") {
          fx += -dx * (fuerza / dist);
          fy += -dy * (fuerza / dist);
          fz += -dz * (fuerza / dist);
          cargaObjetivo = 1;
        } else {
          const n1 = ruido3D(
            px * FRECUENCIA_TURBULENCIA,
            py * FRECUENCIA_TURBULENCIA,
            pz * FRECUENCIA_TURBULENCIA,
            t
          );
          const n2 = ruido3D(
            px * FRECUENCIA_TURBULENCIA + 31.4,
            py * FRECUENCIA_TURBULENCIA - 12.1,
            pz * FRECUENCIA_TURBULENCIA + 7.7,
            t
          );
          const n3 = ruido3D(
            px * FRECUENCIA_TURBULENCIA - 5.2,
            py * FRECUENCIA_TURBULENCIA + 18.9,
            pz * FRECUENCIA_TURBULENCIA,
            t
          );
          fx += n1 * fuerza;
          fy += n3 * fuerza * 0.5;
          fz += n2 * fuerza;
          cargaObjetivo = 0;
        }
      }

      // Resorte suave de vuelta a la posición de origen: mantiene la nube
      // cohesionada en vez de dispersarse para siempre, sin necesidad de
      // "teletransportar" partículas al llegar a un límite.
      fx += (basePos[ix] - px) * RETORNO_A_CASA;
      fy += (basePos[ix + 1] - py) * RETORNO_A_CASA;
      fz += (basePos[ix + 2] - pz) * RETORNO_A_CASA;

      vx = (vx + fx * dt) * AMORTIGUACION;
      vy = (vy + fy * dt) * AMORTIGUACION;
      vz = (vz + fz * dt) * AMORTIGUACION;

      px += vx * dt;
      py += vy * dt;
      pz += vz * dt;

      posiciones[ix] = px;
      posiciones[ix + 1] = py;
      posiciones[ix + 2] = pz;
      velocidades[ix] = vx;
      velocidades[ix + 1] = vy;
      velocidades[ix + 2] = vz;

      cargas[i] += (cargaObjetivo - cargas[i]) * Math.min(1, dt * 1.5);

      posAttr.setXYZ(i, px, py, pz);
      cargaAttr.setX(i, cargas[i]);
    }

    posAttr.needsUpdate = true;
    cargaAttr.needsUpdate = true;
    material.uniforms.uTime.value = t;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colores, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[tamanos, 1]} />
        <bufferAttribute attach="attributes-aCarga" args={[cargas, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms: { uTime: { value: 0 }, uOpacidad: { value: opacidad } },
            vertexShader: particulaVertexShader,
            fragmentShader: particulaFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </points>
  );
}
