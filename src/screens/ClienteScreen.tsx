import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, gradients } from "../lib/theme";
import {
  LIMITE_SESIONES_GRATIS_POR_MES,
  contarSesionesEsteMes,
  puedeUnirseComoCliente,
} from "../lib/monetizacion";
import FotoPerfil from "../components/FotoPerfil";
import PermisosCard from "../components/PermisosCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

export default function ClienteScreen() {
  const { profile, signOut } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);
  const [sesionesUsadas, setSesionesUsadas] = useState<number | null>(null);

  const cargarSesionesUsadas = useCallback(async () => {
    if (!profile) return;
    try {
      const usadas = await contarSesionesEsteMes(profile.id);
      setSesionesUsadas(usadas);
    } catch {
      setSesionesUsadas(null);
    }
  }, [profile]);

  useEffect(() => {
    cargarSesionesUsadas();
  }, [cargarSesionesUsadas]);

  async function unirseASala() {
    const limpio = codigo.trim().toUpperCase();
    if (!limpio || !profile) return;

    setVerificando(true);
    setErrorAcceso(null);

    const resultado = await puedeUnirseComoCliente(profile);

    setVerificando(false);

    if (!resultado.permitido) {
      setErrorAcceso(resultado.motivo ?? "No podés unirte ahora.");
      return;
    }
    navigation.navigate("SalaEnVivo", { codigo: limpio });
  }

  const sinLimite = profile?.role === "super_admin" || profile?.exento_pago;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <FotoPerfil />
        <View style={styles.headerTexto}>
          <Text style={styles.greeting}>Hola 🌿</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Unite a una sala</Text>
        <Text style={styles.cardBody}>
          Pedile el código de acceso a tu curador y entrá a la sesión en
          vivo.
        </Text>
        {!sinLimite && sesionesUsadas !== null ? (
          <Text style={styles.limiteTexto}>
            Sesiones usadas este mes: {sesionesUsadas}/
            {LIMITE_SESIONES_GRATIS_POR_MES}
          </Text>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder="Código de sala"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          value={codigo}
          onChangeText={setCodigo}
        />
        {errorAcceso ? <Text style={styles.error}>{errorAcceso}</Text> : null}
        <Pressable
          style={[styles.avatarButtonWrap, verificando && styles.buttonDisabled]}
          onPress={unirseASala}
          disabled={verificando}
        >
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.avatarButton}
          >
            {verificando ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.avatarButtonText}>Unirme</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tu espacio te espera</Text>
        <Text style={styles.cardBody}>
          Personalizá tu avatar antes de entrar a una sala.
        </Text>
        <Pressable
          style={styles.avatarButtonSecundario}
          onPress={() => navigation.navigate("AvatarEditor")}
        >
          <Text style={styles.avatarButtonSecundarioText}>
            🧑‍🎤 Personalizar mi avatar
          </Text>
        </Pressable>
      </View>

      <PermisosCard />

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
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
    fontSize: 24,
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  limiteTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primarySoft,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
    letterSpacing: 2,
  },
  avatarButtonWrap: {
    marginTop: 12,
    borderRadius: 12,
  },
  avatarButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  avatarButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  avatarButtonSecundario: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  avatarButtonSecundarioText: {
    color: colors.primarySoft,
    fontWeight: "600",
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
    marginTop: 8,
  },
});
