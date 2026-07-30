import React, { useState } from "react";
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
// Plegado por defecto: los ejes X/Y/Z + girar/tamaño entran en 2 filas de
// grilla en vez de 5 apiladas, y encima ocultas hasta que se tocan — mockup
// aprobado por el usuario: https://claude.ai/code/artifact/59570559
export default function AccesorioAjustePanel({
  transform,
  onChange,
  titulo = "Ajustar accesorio",
  valorDefecto = ACCESORIO_TRANSFORM_DEFAULT,
}: Props) {
  const [abierto, setAbierto] = useState(false);

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
    onChange({ ...transform, escala: clamp((transform.escala ?? 1) + delta, 0.2, 3) });
  }

  function reiniciar() {
    onChange({ ...valorDefecto });
  }

  return (
    <View style={styles.panel}>
      <Pressable style={styles.filaTitulo} onPress={() => setAbierto((v) => !v)}>
        <Text style={styles.titulo}>⚙ {titulo}</Text>
        <Text style={styles.caret}>{abierto ? "▴" : "▾"}</Text>
      </Pressable>

      {abierto ? (
        <View style={styles.cuerpo}>
          <Pressable onPress={reiniciar} style={styles.filaReiniciar}>
            <Text style={styles.reiniciar}>Reiniciar</Text>
          </Pressable>

          <View style={styles.grid3}>
            <Eje label="Izq/Der" iconoA="◀" iconoB="▶" onA={() => moverEje(0, -PASO_POSICION)} onB={() => moverEje(0, PASO_POSICION)} />
            <Eje label="Alto" iconoA="▲" iconoB="▼" onA={() => moverEje(1, PASO_POSICION)} onB={() => moverEje(1, -PASO_POSICION)} />
            <Eje label="Prof." iconoA="◀" iconoB="▶" onA={() => moverEje(2, -PASO_POSICION)} onB={() => moverEje(2, PASO_POSICION)} />
          </View>
          <View style={styles.grid2}>
            <Eje label="Girar" iconoA="↺" iconoB="↻" onA={() => girar(-PASO_ROTACION)} onB={() => girar(PASO_ROTACION)} />
            <Eje
              label={`Tamaño ${(transform.escala ?? 1).toFixed(1)}×`}
              iconoA="−"
              iconoB="+"
              onA={() => escalar(-PASO_ESCALA)}
              onB={() => escalar(PASO_ESCALA)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Eje({
  label,
  iconoA,
  iconoB,
  onA,
  onB,
}: {
  label: string;
  iconoA: string;
  iconoB: string;
  onA: () => void;
  onB: () => void;
}) {
  return (
    <View style={styles.celda}>
      <Text style={styles.celdaEtiqueta}>{label}</Text>
      <View style={styles.celdaPar}>
        <Boton texto={iconoA} onPress={onA} />
        <Boton texto={iconoB} onPress={onB} />
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
    marginTop: 8,
    overflow: "hidden",
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titulo: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  caret: {
    color: colors.primarySoft,
    fontSize: 12,
  },
  cuerpo: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  filaReiniciar: {
    alignItems: "flex-end",
  },
  reiniciar: {
    fontSize: 12,
    color: colors.primarySoft,
  },
  grid3: {
    flexDirection: "row",
    gap: 6,
  },
  grid2: {
    flexDirection: "row",
    gap: 6,
  },
  celda: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    gap: 6,
  },
  celdaEtiqueta: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textFaint,
    textTransform: "uppercase",
  },
  celdaPar: {
    flexDirection: "row",
    gap: 6,
  },
  boton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: {
    fontSize: 13,
    color: colors.primarySoft,
  },
});
