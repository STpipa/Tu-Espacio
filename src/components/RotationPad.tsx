import React, { useRef } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

interface Props {
  // Se llama en cada movimiento del arrastre con el delta a sumar a la
  // rotación actual (radianes). No devuelve un valor absoluto para poder
  // usarse tanto en un estado local (editor) como enviando deltas a
  // Colyseus (sala en vivo).
  onGirar: (deltaRadianes: number) => void;
}

// Zona de arrastre separada del lienzo 3D (que ya usa el drag para orbitar
// la cámara) para girar al propio avatar 360° con el mouse/dedo sin que
// los dos gestos se pisen.
export default function RotationPad({ onGirar }: Props) {
  const ultimoX = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        ultimoX.current = evt.nativeEvent.pageX;
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.pageX;
        if (ultimoX.current != null) {
          const dx = x - ultimoX.current;
          onGirar(dx * 0.012);
        }
        ultimoX.current = x;
      },
      onPanResponderRelease: () => {
        ultimoX.current = null;
      },
      onPanResponderTerminate: () => {
        ultimoX.current = null;
      },
    })
  ).current;

  return (
    <View style={styles.pad} {...panResponder.panHandlers}>
      <Text style={styles.icono}>↻</Text>
      <Text style={styles.texto}>Girar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },
  icono: {
    fontSize: 18,
    color: colors.primarySoft,
  },
  texto: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
