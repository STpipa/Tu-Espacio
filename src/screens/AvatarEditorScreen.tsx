import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { colors, gradients } from "../lib/theme";
import Sala3D from "../three/Sala3D";
import MovementPad from "../components/MovementPad";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { AvatarCategoria, AvatarConfig, AvatarItem } from "../lib/types";

type CatalogoPorCategoria = Record<AvatarCategoria, AvatarItem[]>;

const CATEGORIAS: { key: AvatarCategoria; label: string; opcional: boolean }[] = [
  { key: "capa", label: "Capa", opcional: false },
  { key: "disfraz", label: "Disfraz", opcional: true },
  { key: "accesorio", label: "Accesorio", opcional: true },
];

function opcionesConNinguno(items: AvatarItem[], opcional: boolean) {
  return opcional ? [null, ...items] : items;
}

export default function AvatarEditorScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, refreshProfile } = useAuth();

  const [catalogo, setCatalogo] = useState<CatalogoPorCategoria>({
    capa: [],
    disfraz: [],
    accesorio: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<AvatarConfig>({
    capa: null,
    disfraz: null,
    accesorio: null,
  });
  const [posicion, setPosicion] = useState({ x: 0, z: 0 });

  useEffect(() => {
    let isMounted = true;

    async function cargarCatalogo() {
      const { data, error } = await supabase
        .from("catalogo_avatares")
        .select("id, nombre, categoria, model_url, es_premium")
        .order("nombre");

      if (!isMounted) return;

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      const items = data as AvatarItem[];
      const agrupado: CatalogoPorCategoria = { capa: [], disfraz: [], accesorio: [] };
      for (const item of items) {
        agrupado[item.categoria].push(item);
      }
      setCatalogo(agrupado);

      const inicial = profile?.avatar_config;
      setSeleccion({
        capa:
          agrupado.capa.find((i) => i.id === inicial?.capa?.id) ??
          agrupado.capa[0] ??
          null,
        disfraz: agrupado.disfraz.find((i) => i.id === inicial?.disfraz?.id) ?? null,
        accesorio:
          agrupado.accesorio.find((i) => i.id === inicial?.accesorio?.id) ?? null,
      });
      setLoading(false);
    }

    cargarCatalogo();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avatarConfigActual: AvatarConfig = useMemo(
    () => ({
      capa: seleccion.capa
        ? { id: seleccion.capa.id, nombre: seleccion.capa.nombre, model_url: seleccion.capa.model_url }
        : null,
      disfraz: seleccion.disfraz
        ? {
            id: seleccion.disfraz.id,
            nombre: seleccion.disfraz.nombre,
            model_url: seleccion.disfraz.model_url,
          }
        : null,
      accesorio: seleccion.accesorio
        ? { id: seleccion.accesorio.id, nombre: seleccion.accesorio.nombre }
        : null,
    }),
    [seleccion]
  );

  const ciclar = useCallback(
    (categoria: AvatarCategoria, direccion: 1 | -1) => {
      const opcional = CATEGORIAS.find((c) => c.key === categoria)!.opcional;
      const opciones = opcionesConNinguno(catalogo[categoria], opcional);
      if (opciones.length === 0) return;

      const actual = seleccion[categoria];
      const indiceActual = opciones.findIndex((o) => o?.id === actual?.id);
      const siguiente =
        (((indiceActual === -1 ? 0 : indiceActual) + direccion) % opciones.length +
          opciones.length) %
        opciones.length;

      setSeleccion((prev) => ({ ...prev, [categoria]: opciones[siguiente] }));
    },
    [catalogo, seleccion]
  );

  function alAzar() {
    setSeleccion({
      capa: catalogo.capa.length
        ? catalogo.capa[Math.floor(Math.random() * catalogo.capa.length)]
        : null,
      disfraz: elegirAlAzarConNinguno(catalogo.disfraz),
      accesorio: elegirAlAzarConNinguno(catalogo.accesorio),
    });
  }

  async function guardar() {
    if (!profile) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_config: avatarConfigActual })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await refreshProfile();
    setSavedMsg("Avatar guardado ✓");
  }

  function mover(dx: number, dz: number) {
    setPosicion((prev) => ({
      x: Math.max(-4, Math.min(4, prev.x + dx * 0.6)),
      z: Math.max(-4, Math.min(4, prev.z + dz * 0.6)),
    }));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.escena3d}>
        <Sala3D avatarConfig={avatarConfigActual} avatarPosition={posicion} />

        <View style={styles.movementOverlay}>
          <MovementPad onMove={mover} />
        </View>
      </View>

      <View style={styles.panel}>
        {CATEGORIAS.map(({ key, label }) => (
          <View key={key} style={styles.selectorRow}>
            <Pressable style={styles.arrow} onPress={() => ciclar(key, -1)}>
              <Text style={styles.arrowText}>◀</Text>
            </Pressable>
            <View style={styles.selectorLabel}>
              <Text style={styles.selectorCategoria}>{label}</Text>
              <Text style={styles.selectorNombre}>
                {seleccion[key]?.nombre ?? "Ninguno"}
              </Text>
            </View>
            <Pressable style={styles.arrow} onPress={() => ciclar(key, 1)}>
              <Text style={styles.arrowText}>▶</Text>
            </Pressable>
          </View>
        ))}

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        {savedMsg ? <Text style={styles.saved}>{savedMsg}</Text> : null}

        <View style={styles.buttonsRow}>
          <Pressable style={styles.secondaryButton} onPress={alAzar}>
            <Text style={styles.secondaryButtonText}>🎲 Al azar</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButtonWrap, saving && styles.buttonDisabled]}
            onPress={guardar}
            disabled={saving}
          >
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
      </View>
    </View>
  );
}

function elegirAlAzarConNinguno(items: AvatarItem[]) {
  const opciones: (AvatarItem | null)[] = [null, ...items];
  return opciones[Math.floor(Math.random() * opciones.length)];
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
  },
  movementOverlay: {
    position: "absolute",
    left: 16,
    bottom: 16,
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: colors.primarySoft,
    fontSize: 16,
  },
  selectorLabel: {
    flex: 1,
    alignItems: "center",
  },
  selectorCategoria: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectorNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.primarySoft,
    fontWeight: "600",
  },
  primaryButtonWrap: {
    flex: 1,
    borderRadius: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  backText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  saved: {
    color: colors.success,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
});
