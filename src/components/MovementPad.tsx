import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

interface Props {
  onMove: (dx: number, dz: number) => void;
}

export default function MovementPad({ onMove }: Props) {
  return (
    <View style={styles.pad}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <Boton texto="▲" onPress={() => onMove(0, -1)} />
        <View style={styles.spacer} />
      </View>
      <View style={styles.row}>
        <Boton texto="◀" onPress={() => onMove(-1, 0)} />
        <View style={styles.spacer} />
        <Boton texto="▶" onPress={() => onMove(1, 0)} />
      </View>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <Boton texto="▼" onPress={() => onMove(0, 1)} />
        <View style={styles.spacer} />
      </View>
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
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
  spacer: {
    width: 44,
    height: 44,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  buttonText: {
    fontSize: 18,
    color: colors.primaryDark,
  },
});
