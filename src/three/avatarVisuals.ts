// Paleta de relleno: hasta que haya modelos .glb reales en Supabase Storage,
// cada nombre de avatar/accesorio se pinta con un color determinístico.
const PALETTE = [
  "#9D5CFF",
  "#4FD1C5",
  "#E4B764",
  "#FF6F91",
  "#7C83FD",
  "#6FE7C8",
  "#F2A65A",
  "#C77DFF",
];

export function colorParaNombre(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
