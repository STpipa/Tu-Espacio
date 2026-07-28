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
import { useAuth } from "../contexts/AuthContext";
import { elegirYSubirFotoPerfil } from "../lib/fotoPerfil";
import { colors } from "../lib/theme";

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
      <Text style={styles.editarTexto}>Editar foto</Text>
    </Pressable>
  );
}

const TAMANO = 64;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  circulo: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  editarTexto: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
