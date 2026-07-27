import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../lib/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

export default function ClienteScreen() {
  const { profile, signOut } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [codigo, setCodigo] = useState("");

  function unirseASala() {
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) return;
    navigation.navigate("SalaEnVivo", { codigo: limpio });
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>Hola 🌿</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Unite a una sala</Text>
        <Text style={styles.cardBody}>
          Pedile el código de acceso a tu curador y entrá a la sesión en
          vivo.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Código de sala"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          value={codigo}
          onChangeText={setCodigo}
        />
        <Pressable style={styles.avatarButton} onPress={unirseASala}>
          <Text style={styles.avatarButtonText}>Unirme</Text>
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
    justifyContent: "space-between",
    gap: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: 12,
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
  avatarButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  avatarButtonText: {
    color: colors.surface,
    fontWeight: "600",
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
    color: colors.primaryDark,
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
});
