import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { colors, fonts, gradients } from "../lib/theme";
import { puedeCrearSala } from "../lib/monetizacion";
import { verificarSuscripcionActiva } from "../lib/revenuecat";
import FotoPerfil from "../components/FotoPerfil";
import PermisosCard from "../components/PermisosCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface Sala {
  id: string;
  codigo_acceso: string;
  estado: string;
  created_at: string;
}

function generarCodigoAcceso() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return codigo;
}

export default function CuradorScreen() {
  const { profile, signOut } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargarSalas = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("salas_3d")
      .select("id, codigo_acceso, estado, created_at")
      .eq("curador_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSalas(data as Sala[]);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    cargarSalas();
  }, [cargarSalas]);

  async function crearSala() {
    if (!profile) return;
    setCreating(true);
    setErrorMsg(null);

    const suscripcionActiva = await verificarSuscripcionActiva(profile.id);
    if (!puedeCrearSala(profile, suscripcionActiva)) {
      setCreating(false);
      setErrorMsg(
        "Necesitás una suscripción activa (o estar exento de pago) para crear salas."
      );
      return;
    }

    const { error } = await supabase.from("salas_3d").insert({
      curador_id: profile.id,
      codigo_acceso: generarCodigoAcceso(),
      estado: "esperando",
    });

    setCreating(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await cargarSalas();
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={salas}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <FotoPerfil />
            <View style={styles.headerTexto}>
              <Text style={styles.greeting}>Panel del curador</Text>
              <Text style={styles.email}>{profile?.email}</Text>
            </View>
            {profile?.role === "super_admin" ? (
              <LinearGradient
                colors={[colors.warm, "#F3D698"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>Super Admin</Text>
              </LinearGradient>
            ) : null}
          </View>

          <Pressable onPress={crearSala} disabled={creating}>
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.createButton, creating && styles.buttonDisabled]}
            >
              {creating ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.createButtonText}>+ Crear nueva sala</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.avatarButton}
            onPress={() => navigation.navigate("AvatarEditor")}
          >
            <Text style={styles.avatarButtonText}>
              🧑‍🎤 Personalizar mi avatar
            </Text>
          </Pressable>

          <Pressable
            style={styles.avatarButton}
            onPress={() => navigation.navigate("ParticleLab")}
          >
            <Text style={styles.avatarButtonText}>
              ✨ Laboratorio de partículas (demo)
            </Text>
          </Pressable>

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
          ) : null}
        </>
      }
      ListEmptyComponent={
        !loading ? (
          <Text style={styles.emptyText}>Todavía no creaste ninguna sala.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.salaCard}>
          <View style={styles.salaInfo}>
            <Text style={styles.salaCodigo}>{item.codigo_acceso}</Text>
            <View style={styles.salaEstadoPill}>
              <View style={styles.salaEstadoDot} />
              <Text style={styles.salaEstado}>{item.estado}</Text>
            </View>
          </View>
          <Pressable
            style={styles.entrarButton}
            onPress={() =>
              navigation.navigate("SalaEnVivo", { codigo: item.codigo_acceso })
            }
          >
            <Text style={styles.entrarButtonText}>Entrar</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <PermisosCard />
          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
  },
  headerTexto: {
    flex: 1,
  },
  greeting: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#2A1C07",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  createButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  salaCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salaInfo: {
    gap: 6,
  },
  salaCodigo: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.text,
  },
  salaEstadoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  salaEstadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textFaint,
  },
  salaEstado: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  avatarButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  avatarButtonText: {
    color: colors.primarySoft,
    fontWeight: "600",
  },
  entrarButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  entrarButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
  footer: {
    marginTop: 24,
    gap: 16,
  },
  signOutButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signOutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
});
