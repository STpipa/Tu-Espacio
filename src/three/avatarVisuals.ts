// Paleta de relleno: hasta que haya modelos .glb reales en Supabase Storage,
// cada nombre de avatar/accesorio se pinta con un color determinístico.
const PALETTE = [
  "#4F7A5C",
  "#B3543E",
  "#C9A25E",
  "#3C6E91",
  "#7A4E9E",
  "#5C8AA6",
  "#8C5A3C",
  "#6E8C3C",
];

export function colorParaNombre(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
