import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../lib/theme";

export default function ClienteScreen() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>Hola 🌿</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tu espacio te espera</Text>
        <Text style={styles.cardBody}>
          Acá vas a poder unirte a las salas 3D de constelaciones familiares y
          ver tus próximas sesiones guiadas en vivo. Esta vista se completa en
          los próximos pasos del proyecto.
        </Text>
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
