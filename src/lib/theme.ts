// Identidad "constelar": cielo violeta casi negro, acento lila, y un
// dorado ritual muy dosificado para marcar rol (curador/super_admin).
// Definida a partir del mockup aprobado por el usuario:
// https://claude.ai/code/artifact/f0ce44b7-011b-40e4-a32a-e1fe7c703070
export const colors = {
  background: "#0F0919",
  backgroundSoft: "#150E24",
  surface: "#1B1130",
  surfaceElevated: "#241A3D",
  primary: "#9D5CFF",
  primarySoft: "#D8B4FE",
  primaryDark: "#7C3AED",
  warm: "#E4B764",
  text: "#F4EEFF",
  textMuted: "#A698CC",
  textFaint: "#6F6390",
  border: "rgba(157, 92, 255, 0.24)",
  danger: "#FF6F91",
  success: "#6FE7C8",
  badge: "#E4B764",
  glow: "rgba(157, 92, 255, 0.45)",
};

export const gradients = {
  accent: [colors.primarySoft, colors.primary] as const,
  halo: [colors.warm, colors.primary, "transparent"] as const,
  ring: [colors.primary, colors.primarySoft, colors.success, colors.primary] as const,
};

export const fonts = {
  display: "Cinzel_600SemiBold",
};
