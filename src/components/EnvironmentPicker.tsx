import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ENTORNOS, type EnvironmentId } from "../three/Environment";
import { colors } from "../lib/theme";
import { useHorizontalDragScroll } from "../lib/useHorizontalDragScroll";

interface Props {
  value: EnvironmentId;
  onChange: (id: EnvironmentId) => void;
}

export default function EnvironmentPicker({ value, onChange }: Props) {
  const scrollRef = useHorizontalDragScroll();
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.contenido}
    >
      {ENTORNOS.map((entorno) => {
        const activo = entorno.id === value;
        return (
          <Pressable
            key={entorno.id}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => onChange(entorno.id)}
          >
            <View style={[styles.punto, { backgroundColor: entorno.color }]} />
            <Text style={[styles.texto, activo && styles.textoActivo]}>{entorno.label}</Text>
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
