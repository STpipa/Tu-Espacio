import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../lib/theme";

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
      <Text style={styles.title}>Tu Espacio</Text>
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
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "signIn" ? "Entrar" : "Crear cuenta"}
            </Text>
          )}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primaryDark,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 32,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  switchModeText: {
    textAlign: "center",
    color: colors.primary,
    marginTop: 8,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
  info: {
    color: colors.primaryDark,
    fontSize: 13,
    textAlign: "center",
  },
});
