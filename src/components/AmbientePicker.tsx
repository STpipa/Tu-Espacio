import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AMBIENTES, type AmbienteId } from "../lib/ambientes";
import { colors } from "../lib/theme";

interface Props {
  value: AmbienteId;
  onChange: (id: AmbienteId) => void;
}

// Picker de la sala en vivo: une los 5 Entornos "clásicos" con los 5 Campos
// que traen el motor de partículas reactivas (marcados con ✨) en una sola
// fila de chips, restringida al curador (ver SalaEnVivoScreen).
export default function AmbientePicker({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.contenido}
    >
      {AMBIENTES.map((ambiente) => {
        const activo = ambiente.id === value;
        return (
          <Pressable
            key={ambiente.id}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => onChange(ambiente.id)}
          >
            <View style={[styles.punto, { backgroundColor: ambiente.color }]} />
            <Text style={[styles.texto, activo && styles.textoActivo]}>
              {ambiente.conMotorDeParticulas ? "✨ " : ""}
              {ambiente.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
  },
  contenido: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(27,17,48,0.82)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActivo: {
    borderColor: colors.primarySoft,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  textoActivo: {
    color: colors.text,
  },
});
