import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ACCESORIO_TRANSFORM_DEFAULT, type AccesorioTransform } from "../lib/types";
import { colors } from "../lib/theme";

interface Props {
  transform: AccesorioTransform;
  onChange: (transform: AccesorioTransform) => void;
  titulo?: string;
  valorDefecto?: AccesorioTransform;
}

const PASO_POSICION = 0.04;
const PASO_ROTACION = Math.PI / 12; // 15°
const PASO_ESCALA = 0.1;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// Botones para reubicar/escalar un modelo a mano (cada uno tiene un
// tamaño/pivote distinto — un único offset fijo para todos terminaba
// atravesando el cuerpo o tapando la cara según el modelo). Reusado tanto
// para accesorios como para la capa (ver AvatarEditorScreen), un modelo
// subido por el propio usuario rara vez cae ya centrado/escalado bien.
export default function AccesorioAjustePanel({
  transform,
  onChange,
  titulo = "Ajustar accesorio",
  valorDefecto = ACCESORIO_TRANSFORM_DEFAULT,
}: Props) {
  function moverEje(eje: 0 | 1 | 2, delta: number) {
    const offset: [number, number, number] = [...transform.offset];
    const limites: [number, number][] = [
      [-1.3, 1.3],
      [0, 2.2],
      [-1.3, 1.3],
    ];
    offset[eje] = clamp(offset[eje] + delta, limites[eje][0], limites[eje][1]);
    onChange({ ...transform, offset });
  }

  function girar(delta: number) {
    onChange({ ...transform, rotacionY: transform.rotacionY + delta });
  }

  function escalar(delta: number) {
    onChange({ ...transform, escala: clamp(transform.escala + delta, 0.2, 3) });
  }

  function reiniciar() {
    onChange({ ...valorDefecto });
  }

  return (
    <View style={styles.panel}>
      <View style={styles.filaTitulo}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Pressable onPress={reiniciar}>
          <Text style={styles.reiniciar}>Reiniciar</Text>
        </Pressable>
      </View>

      <View style={styles.filas}>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Izq / Der</Text>
          <Boton texto="◀" onPress={() => moverEje(0, -PASO_POSICION)} />
          <Boton texto="▶" onPress={() => moverEje(0, PASO_POSICION)} />
        </View>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Arriba / Abajo</Text>
          <Boton texto="▲" onPress={() => moverEje(1, PASO_POSICION)} />
          <Boton texto="▼" onPress={() => moverEje(1, -PASO_POSICION)} />
        </View>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Adelante / Atrás</Text>
          <Boton texto="◀" onPress={() => moverEje(2, -PASO_POSICION)} />
          <Boton texto="▶" onPress={() => moverEje(2, PASO_POSICION)} />
        </View>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Girar</Text>
          <Boton texto="↺" onPress={() => girar(-PASO_ROTACION)} />
          <Boton texto="↻" onPress={() => girar(PASO_ROTACION)} />
        </View>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Tamaño ({transform.escala.toFixed(1)}×)</Text>
          <Boton texto="−" onPress={() => escalar(-PASO_ESCALA)} />
          <Boton texto="+" onPress={() => escalar(PASO_ESCALA)} />
        </View>
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
  filas: {
    gap: 6,
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
