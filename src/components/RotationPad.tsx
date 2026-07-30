import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

interface Props {
  // Delta a sumar a la rotación actual (radianes) por cada toque. No
  // devuelve un valor absoluto para poder usarse tanto en un estado local
  // (editor) como enviando deltas a Colyseus (sala en vivo).
  onGirar: (deltaRadianes: number) => void;
}

const PASO_ROTACION = Math.PI / 10; // 18° por toque

// Antes esto era un dial que solo giraba arrastrando el dedo/mouse — se
// veía como un botón (ícono + "Girar") pero no respondía a un toque
// simple, así que tocarlo no hacía nada. Dos botones de toque, mismo
// patrón que MovementPad.
export default function RotationPad({ onGirar }: Props) {
  return (
    <View style={styles.pad}>
      <Boton texto="↺" onPress={() => onGirar(-PASO_ROTACION)} />
      <Boton texto="↻" onPress={() => onGirar(PASO_ROTACION)} />
    </View>
  );
}

function Boton({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  buttonText: {
    fontSize: 20,
    color: colors.primarySoft,
  },
});
