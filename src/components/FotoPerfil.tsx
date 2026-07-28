import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { elegirYSubirFotoPerfil } from "../lib/fotoPerfil";
import { colors, gradients } from "../lib/theme";

export default function FotoPerfil() {
  const { profile, refreshProfile } = useAuth();
  const [subiendo, setSubiendo] = useState(false);

  async function elegirFoto() {
    if (!profile) return;
    setSubiendo(true);
    try {
      const url = await elegirYSubirFotoPerfil(profile.id);
      if (url) await refreshProfile();
    } catch (err) {
      Alert.alert(
        "No se pudo subir la foto",
        err instanceof Error ? err.message : "Intentá de nuevo más tarde."
      );
    } finally {
      setSubiendo(false);
    }
  }

  const inicial = profile?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <Pressable style={styles.container} onPress={elegirFoto} disabled={subiendo}>
      <LinearGradient
        colors={gradients.ring}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      >
        {subiendo ? (
          <View style={styles.circulo}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : profile?.foto_url ? (
          <Image source={{ uri: profile.foto_url }} style={styles.circulo} />
        ) : (
          <View style={styles.circulo}>
            <Text style={styles.inicial}>{inicial}</Text>
          </View>
        )}
      </LinearGradient>
      <Text style={styles.editarTexto}>Editar foto</Text>
    </Pressable>
  );
}

const TAMANO = 64;
const RING_PADDING = 3;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  ring: {
    width: TAMANO + RING_PADDING * 2,
    height: TAMANO + RING_PADDING * 2,
    borderRadius: (TAMANO + RING_PADDING * 2) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primarySoft,
  },
  editarTexto: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
