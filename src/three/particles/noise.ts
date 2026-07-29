// Ruido pseudo-orgánico liviano para la turbulencia de las partículas.
// A propósito NO es Simplex/Perlin "de verdad" (esos algoritmos son fáciles
// de portar mal a mano y un bug ahí es difícil de notar a simple vista) —
// es una suma de senos/cosenos con frecuencias/fases distintas por eje, que
// da un campo continuo y suave con la misma sensación visual de caos
// orgánico, y es más barato de calcular por partícula por frame. Devuelve
// un valor aproximado en [-1, 1].
export function ruido3D(x: number, y: number, z: number, t: number): number {
  return (
    (Math.sin(x * 1.7 + t * 0.6) * Math.cos(y * 1.3 - t * 0.4) +
      Math.sin(y * 2.1 - t * 0.5) * Math.cos(z * 1.9 + t * 0.3) +
      Math.sin(z * 1.5 + t * 0.7) * Math.cos(x * 2.3 - t * 0.2)) /
    3
  );
}
