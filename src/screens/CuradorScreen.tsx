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
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { puedeCrearSala } from "../lib/monetizacion";
import { verificarSuscripcionActiva } from "../lib/revenuecat";
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel del curador</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
        {profile?.role === "super_admin" ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Super Admin</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.createButton, creating && styles.buttonDisabled]}
        onPress={crearSala}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.createButtonText}>+ Crear nueva sala</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.avatarButton}
        onPress={() => navigation.navigate("AvatarEditor")}
      >
        <Text style={styles.avatarButtonText}>🧑‍🎤 Personalizar mi avatar</Text>
      </Pressable>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          style={styles.list}
          data={salas}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Todavía no creaste ninguna sala.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.salaCard}>
              <View>
                <Text style={styles.salaCodigo}>{item.codigo_acceso}</Text>
                <Text style={styles.salaEstado}>{item.estado}</Text>
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
        />
      )}

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.badge,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    marginTop: 16,
  },
  salaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salaCodigo: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.text,
  },
  salaEstado: {
    fontSize: 13,
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
    color: colors.primaryDark,
    fontWeight: "600",
  },
  entrarButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  entrarButtonText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
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
