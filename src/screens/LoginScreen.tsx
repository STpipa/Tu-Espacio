import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, gradients } from "../lib/theme";
import ConstellationHero from "../three/ConstellationHero";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) {
      setErrorMsg("Completá email y contraseña.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const { error } =
      mode === "signIn"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
      return;
    }
    if (mode === "signUp") {
      setInfoMsg(
        "Cuenta creada. Si tu proyecto de Supabase pide confirmación por email, revisá tu bandeja de entrada."
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroStage}>
          <ConstellationHero />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>Constelaciones familiares</Text>
          <Text style={styles.title}>Tu Espacio</Text>
          <Text style={styles.tagline}>Donde cada vínculo se vuelve visible.</Text>
          <Text style={styles.subtitle}>
            {mode === "signIn" ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
            {infoMsg ? <Text style={styles.info}>{infoMsg}</Text> : null}

            <Pressable
              style={[styles.buttonWrap, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <LinearGradient
                colors={gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === "signIn" ? "Entrar" : "Crear cuenta"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                setErrorMsg(null);
                setInfoMsg(null);
                setMode(mode === "signIn" ? "signUp" : "signIn");
              }}
            >
              <Text style={styles.switchModeText}>
                {mode === "signIn"
                  ? "¿No tenés cuenta? Creá una"
                  : "¿Ya tenés cuenta? Iniciá sesión"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroStage: {
    width: "100%",
    height: 300,
  },
  body: {
    paddingHorizontal: 28,
    marginTop: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primarySoft,
    textAlign: "center",
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.text,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textFaint,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 32,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  buttonWrap: {
    borderRadius: 14,
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  switchModeText: {
    textAlign: "center",
    color: colors.primarySoft,
    marginTop: 8,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
  info: {
    color: colors.primarySoft,
    fontSize: 13,
    textAlign: "center",
  },
});
