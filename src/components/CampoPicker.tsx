import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CAMPOS_AMBIENTALES } from "../three/particles/camposAmbientales";
import type { CampoId } from "../three/particles/types";
import { colors } from "../lib/theme";

interface Props {
  value: CampoId;
  onChange: (id: CampoId) => void;
}

export default function CampoPicker({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.contenido}
    >
      {CAMPOS_AMBIENTALES.map((campo) => {
        const activo = campo.id === value;
        return (
          <Pressable
            key={campo.id}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => onChange(campo.id)}
          >
            <View style={[styles.punto, { backgroundColor: campo.colorChip }]} />
            <Text style={[styles.texto, activo && styles.textoActivo]}>{campo.label}</Text>
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
