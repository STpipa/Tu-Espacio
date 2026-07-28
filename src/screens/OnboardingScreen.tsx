import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, gradients } from "../lib/theme";
import { marcarOnboardingCompletado } from "../lib/onboarding";

interface Slide {
  emoji: string;
  titulo: string;
  texto: string;
}

const SLIDES: Slide[] = [
  {
    emoji: "🌿",
    titulo: "Sanación y Conexión",
    texto:
      "Un espacio pensado para las constelaciones familiares: cálido, contenido y guiado por profesionales.",
  },
  {
    emoji: "🌐",
    titulo: "Espacios 3D e Innovación",
    texto:
      "Entrá a salas 3D inmersivas con tu propio avatar y explorá el espacio junto a otros participantes.",
  },
  {
    emoji: "🔴",
    titulo: "Sesiones Guiadas en Vivo",
    texto:
      "Participá de sesiones en tiempo real, guiadas por tu curador, desde donde estés.",
  },
];

export default function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const [indice, setIndice] = useState(0);
  const esUltima = indice === SLIDES.length - 1;
  const slide = SLIDES[indice];

  async function terminar() {
    await marcarOnboardingCompletado();
    onFinish();
  }

  function siguiente() {
    if (esUltima) {
      terminar();
    } else {
      setIndice((i) => i + 1);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.omitir} onPress={terminar}>
        <Text style={styles.omitirTexto}>Omitir</Text>
      </Pressable>

      <View style={styles.contenido}>
        <View style={styles.emojiHalo}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.titulo}>{slide.titulo}</Text>
        <Text style={styles.texto}>{slide.texto}</Text>
      </View>

      <View style={styles.puntos}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.punto, i === indice && styles.puntoActivo]}
          />
        ))}
      </View>

      <Pressable onPress={siguiente}>
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.boton}
        >
          <Text style={styles.botonTexto}>
            {esUltima ? "Empezar" : "Siguiente"}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "space-between",
  },
  omitir: {
    alignSelf: "flex-end",
    paddingVertical: 8,
  },
  omitirTexto: {
    color: colors.textMuted,
    fontSize: 14,
  },
  contenido: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emojiHalo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
  },
  emoji: {
    fontSize: 56,
  },
  titulo: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
  },
  puntos: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  puntoActivo: {
    backgroundColor: colors.primary,
    width: 20,
  },
  boton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonTexto: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
});
