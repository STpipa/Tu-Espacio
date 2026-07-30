import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APARIENCIA_DEFAULT, type AvatarApariencia } from "../lib/types";
import { colors } from "../lib/theme";

interface Props {
  value: AvatarApariencia;
  onChange: (value: AvatarApariencia) => void;
}

const COLORES: (string | null)[] = [
  null,
  "#FFFFFF",
  "#9D5CFF",
  "#6FE7C8",
  "#FF6F91",
  "#E4B764",
  "#3DBFD9",
  "#2A2A2A",
];

function clamp(v: number, min: number, max: number) {
  return Math.round(Math.min(max, Math.max(min, v)) * 100) / 100;
}

// Tinte de color + opacidad (fantasmas/ausentes) + brillo (figuras
// energéticas) — botones +/- en vez de sliders, mismo patrón que
// AccesorioAjustePanel, sin agregar ninguna librería de UI nueva.
export default function AparienciaPanel({ value, onChange }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>Apariencia</Text>
        <Pressable onPress={() => onChange({ ...APARIENCIA_DEFAULT })}>
          <Text style={styles.reiniciar}>Reiniciar</Text>
        </Pressable>
      </View>

      <View style={styles.filaColores}>
        {COLORES.map((c) => (
          <Pressable
            key={c ?? "ninguno"}
            onPress={() => onChange({ ...value, color: c })}
            style={[
              styles.swatch,
              { backgroundColor: c ?? colors.surface },
              value.color === c && styles.swatchActivo,
            ]}
          >
            {c === null ? <Text style={styles.swatchNinguno}>✕</Text> : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.fila}>
        <Text style={styles.etiqueta}>Opacidad ({value.opacidad.toFixed(2)})</Text>
        <Boton texto="−" onPress={() => onChange({ ...value, opacidad: clamp(value.opacidad - 0.1, 0.15, 1) })} />
        <Boton texto="+" onPress={() => onChange({ ...value, opacidad: clamp(value.opacidad + 0.1, 0.15, 1) })} />
      </View>
      <View style={styles.fila}>
        <Text style={styles.etiqueta}>Brillo ({value.brillo.toFixed(2)})</Text>
        <Boton texto="−" onPress={() => onChange({ ...value, brillo: clamp(value.brillo - 0.15, 0, 1) })} />
        <Boton texto="+" onPress={() => onChange({ ...value, brillo: clamp(value.brillo + 0.15, 0, 1) })} />
      </View>
    </View>
  );
}

function Boton({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={styles.boton} onPress={onPress}>
      <Text style={styles.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reiniciar: {
    fontSize: 12,
    color: colors.primarySoft,
  },
  filaColores: {
    flexDirection: "row",
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchActivo: {
    borderColor: colors.primarySoft,
  },
  swatchNinguno: {
    fontSize: 12,
    color: colors.textFaint,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  etiqueta: {
    flex: 1,
    fontSize: 12,
    color: colors.textFaint,
  },
  boton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: {
    fontSize: 14,
    color: colors.primarySoft,
  },
});
