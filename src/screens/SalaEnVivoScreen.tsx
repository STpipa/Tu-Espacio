import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { useSalaRoom } from "../hooks/useSalaRoom";
import SalaMultiplayer3D from "../three/SalaMultiplayer3D";
import type { AmbienteId } from "../lib/ambientes";
import MovementPad from "../components/MovementPad";
import RotationPad from "../components/RotationPad";
import AmbientePicker from "../components/AmbientePicker";
import { colors } from "../lib/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

export default function SalaEnVivoScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SalaEnVivo">>();
  const { profile } = useAuth();
  const { conectando, error, jugadores, miSessionId, ambiente, mover, moderar, cambiarAmbiente } =
    useSalaRoom(route.params.codigo);

  // Plegado por defecto: la barra de jugadores/moderación ocupaba una
  // franja fija abajo de toda la pantalla incluso cuando nadie la estaba
  // usando. Mismo patrón que el panel de ajuste del editor de avatar.
  const [panelAbierto, setPanelAbierto] = useState(false);
  const listaJugadores = useMemo(() => Object.values(jugadores), [jugadores]);
  const yo = miSessionId ? jugadores[miSessionId] : undefined;
  const soyModerador = profile?.role === "curador" || profile?.role === "super_admin";
  const otros = listaJugadores.filter((j) => j.sessionId !== miSessionId);

  function mimover(dx: number, dz: number) {
    if (!yo || yo.congelado) return;
    const nuevoX = Math.max(-5, Math.min(5, yo.x + dx * 0.6));
    const nuevoZ = Math.max(-5, Math.min(5, yo.z + dz * 0.6));
    mover(nuevoX, nuevoZ, yo.rotY);
  }

  // Ref en vez de yo.rotY: un drag dispara muchos eventos antes de que el
  // eco del server actualice el estado, así que leer yo.rotY en cada uno
  // parte siempre de la misma base vieja y no acumula.
  const miRotacionRef = useRef<number | null>(null);
  function mirotar(deltaRadianes: number) {
    if (!yo || yo.congelado) return;
    if (miRotacionRef.current === null) miRotacionRef.current = yo.rotY;
    miRotacionRef.current += deltaRadianes;
    mover(yo.x, yo.z, miRotacionRef.current);
  }

  function confirmarExpulsar(sessionId: string, email: string) {
    // Alert.alert es un no-op en react-native-web (no dispara ningún
    // botón), así que ahí usamos window.confirm en su lugar.
    if (Platform.OS === "web") {
      if (window.confirm(`¿Expulsar a ${email} de la sala?`)) {
        moderar("expulsar", sessionId);
      }
      return;
    }

    Alert.alert("Expulsar", `¿Expulsar a ${email} de la sala?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Expulsar",
        style: "destructive",
        onPress: () => moderar("expulsar", sessionId),
      },
    ]);
  }

  if (conectando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.mutedText}>Conectando a la sala…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.escena3d}>
        <SalaMultiplayer3D
          jugadores={listaJugadores}
          ambiente={ambiente as AmbienteId}
        />

        {soyModerador ? (
          <AmbientePicker
            value={ambiente as AmbienteId}
            onChange={cambiarAmbiente}
          />
        ) : null}

        <View style={styles.movementOverlay}>
          <MovementPad onMove={mimover} />
        </View>

        <View style={styles.rotationOverlay}>
          <RotationPad onGirar={mirotar} />
        </View>

        {yo?.congelado ? (
          <View style={[styles.avisoOverlay, { top: 56 }]}>
            <Text style={styles.avisoTexto}>🥶 Te congeló el curador</Text>
          </View>
        ) : null}
        {yo?.silenciado ? (
          <View style={[styles.avisoOverlay, { top: 90 }]}>
            <Text style={styles.avisoTexto}>🔇 Estás silenciado</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Pressable
          style={styles.panelHeader}
          onPress={() => setPanelAbierto((v) => !v)}
        >
          <Text style={styles.panelTitulo}>
            En la sala ({listaJugadores.length})
          </Text>
          <Text style={styles.caret}>{panelAbierto ? "▾" : "▴"}</Text>
        </Pressable>

        {panelAbierto ? (
          <ScrollView style={styles.lista}>
            {otros.length === 0 ? (
              <Text style={styles.mutedText}>Sos el único acá por ahora.</Text>
            ) : (
              otros.map((j) => (
                <View key={j.sessionId} style={styles.jugadorRow}>
                  <View style={styles.jugadorInfo}>
                    <Text style={styles.jugadorEmail}>{j.email}</Text>
                    <Text style={styles.jugadorRole}>
                      {j.role}
                      {j.congelado ? " · congelado" : ""}
                      {j.silenciado ? " · silenciado" : ""}
                    </Text>
                  </View>
                  {soyModerador ? (
                    <View style={styles.acciones}>
                      <Pressable
                        style={styles.accionBoton}
                        onPress={() =>
                          moderar(j.congelado ? "descongelar" : "congelar", j.sessionId)
                        }
                      >
                        <Text style={styles.accionTexto}>
                          {j.congelado ? "❄️➡️" : "❄️"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.accionBoton}
                        onPress={() =>
                          moderar(j.silenciado ? "habilitar" : "silenciar", j.sessionId)
                        }
                      >
                        <Text style={styles.accionTexto}>
                          {j.silenciado ? "🔇➡️" : "🔇"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.accionBoton}
                        onPress={() =>
                          moderar("teletransportar", j.sessionId, { x: 0, z: 0 })
                        }
                      >
                        <Text style={styles.accionTexto}>🎯</Text>
                      </Pressable>
                      <Pressable
                        style={styles.accionBoton}
                        onPress={() => confirmarExpulsar(j.sessionId, j.email)}
                      >
                        <Text style={styles.accionTexto}>🚪</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  escena3d: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  movementOverlay: {
    position: "absolute",
    left: 16,
    bottom: 16,
  },
  rotationOverlay: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  avisoOverlay: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avisoTexto: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 13,
  },
  panel: {
    maxHeight: 220,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  panelTitulo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textFaint,
  },
  caret: {
    color: colors.primarySoft,
    fontSize: 12,
  },
  lista: {
    maxHeight: 140,
  },
  jugadorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  jugadorRole: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  acciones: {
    flexDirection: "row",
    gap: 6,
  },
  accionBoton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  accionTexto: {
    fontSize: 14,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  mutedText: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    fontSize: 15,
  },
});
