import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { colors, fonts, gradients } from "../lib/theme";
import Sala3D from "../three/Sala3D";
import type { EnvironmentId } from "../three/Environment";
import MovementPad from "../components/MovementPad";
import RotationPad from "../components/RotationPad";
import AccesorioAjustePanel from "../components/AccesorioAjustePanel";
import AparienciaPanel from "../components/AparienciaPanel";
import EnvironmentPicker from "../components/EnvironmentPicker";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  ACCESORIO_TRANSFORM_DEFAULT,
  APARIENCIA_DEFAULT,
  CAPA_TRANSFORM_DEFAULT,
  type AccesorioTransform,
  type AvatarApariencia,
  type AvatarCategoria,
  type AvatarConfig,
  type AvatarItem,
} from "../lib/types";

type CatalogoPorCategoria = Record<AvatarCategoria, AvatarItem[]>;
type Tab = AvatarCategoria | "apariencia";

const CATEGORIAS: { key: AvatarCategoria; label: string; opcional: boolean }[] = [
  { key: "capa", label: "Capa", opcional: false },
  { key: "disfraz", label: "Disfraz", opcional: true },
  { key: "accesorio", label: "Accesorio", opcional: true },
];

// "Capa" queda reservada a curador/super_admin: es la identidad de
// sanador/héroe del curador, no algo que el cliente elige. El cliente arma
// su look entero con "Disfraz" + "Accesorio".
function tabsParaRol(esCurador: boolean): { key: Tab; label: string }[] {
  const categorias = esCurador ? CATEGORIAS : CATEGORIAS.filter((c) => c.key !== "capa");
  return [...categorias, { key: "apariencia", label: "Apariencia" }];
}

// A partir de este ancho se muestra el panel de edición al costado de la
// escena 3D (como un creador de personaje clásico); por debajo, apilado
// arriba/abajo, para no dejar el avatar apretado en pantallas angostas.
const UMBRAL_LAYOUT_LATERAL = 700;
const ANCHO_PANEL_LATERAL = 320;

function opcionesConNinguno(items: AvatarItem[], opcional: boolean) {
  return opcional ? [null, ...items] : items;
}

export default function AvatarEditorScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, refreshProfile } = useAuth();
  const { width } = useWindowDimensions();
  const layoutLateral = width >= UMBRAL_LAYOUT_LATERAL;
  const esCurador = profile?.role === "curador" || profile?.role === "super_admin";
  const tabs = useMemo(() => tabsParaRol(esCurador), [esCurador]);

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
  const [tabActiva, setTabActiva] = useState<Tab>(esCurador ? "capa" : "disfraz");
  const [posicion, setPosicion] = useState({ x: 0, z: 0 });
  const [rotacion, setRotacion] = useState(0);
  const [entorno, setEntorno] = useState<EnvironmentId>("noche");
  const [accesorioTransform, setAccesorioTransform] = useState<AccesorioTransform>(
    ACCESORIO_TRANSFORM_DEFAULT
  );
  const [capaTransform, setCapaTransform] = useState<AccesorioTransform>(CAPA_TRANSFORM_DEFAULT);
  const [apariencia, setApariencia] = useState<AvatarApariencia>(APARIENCIA_DEFAULT);

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
      setAccesorioTransform(inicial?.accesorioTransform ?? ACCESORIO_TRANSFORM_DEFAULT);
      setCapaTransform(inicial?.capaTransform ?? CAPA_TRANSFORM_DEFAULT);
      setApariencia(inicial?.apariencia ?? APARIENCIA_DEFAULT);
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
        ? {
            id: seleccion.accesorio.id,
            nombre: seleccion.accesorio.nombre,
            model_url: seleccion.accesorio.model_url,
          }
        : null,
      accesorioTransform,
      capaTransform,
      apariencia,
    }),
    [seleccion, accesorioTransform, capaTransform, apariencia]
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

      // El cuerpo renderizado usa disfraz.model_url si existe, si no
      // capa.model_url (ver AvatarModel) — así que con un disfraz elegido,
      // cambiar de capa no se nota en nada. Elegir una capa limpia el
      // disfraz para que se vea de una.
      setSeleccion((prev) => ({
        ...prev,
        [categoria]: opciones[siguiente],
        ...(categoria === "capa" ? { disfraz: null } : {}),
      }));
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

  function girar(deltaRadianes: number) {
    setRotacion((prev) => prev + deltaRadianes);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, layoutLateral && styles.containerLateral]}>
      <View style={styles.escena3d}>
        <Sala3D
          avatarConfig={avatarConfigActual}
          avatarPosition={posicion}
          avatarRotation={rotacion}
          environment={entorno}
        />

        <EnvironmentPicker value={entorno} onChange={setEntorno} />

        <View style={styles.movementOverlay}>
          <MovementPad onMove={mover} />
        </View>

        <View style={styles.rotationOverlay}>
          <RotationPad onGirar={girar} />
        </View>
      </View>

      <ScrollView
        style={[styles.panel, layoutLateral ? styles.panelLateral : styles.panelInferior]}
        contentContainerStyle={styles.panelContenido}
      >
        <View style={styles.tabs}>
          {tabs.map(({ key, label }) => {
            const activa = tabActiva === key;
            return (
              <Pressable
                key={key}
                style={[styles.tab, activa && styles.tabActiva]}
                onPress={() => setTabActiva(key)}
              >
                <Text style={[styles.tabTexto, activa && styles.tabTextoActivo]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {tabActiva === "apariencia" ? (
          <AparienciaPanel value={apariencia} onChange={setApariencia} />
        ) : (
          <>
            <View style={styles.selectorRow}>
              <Pressable style={styles.arrow} onPress={() => ciclar(tabActiva, -1)}>
                <Text style={styles.arrowText}>◀</Text>
              </Pressable>
              <View style={styles.selectorLabel}>
                <Text style={styles.selectorNombre}>
                  {seleccion[tabActiva]?.nombre ?? "Ninguno"}
                </Text>
              </View>
              <Pressable style={styles.arrow} onPress={() => ciclar(tabActiva, 1)}>
                <Text style={styles.arrowText}>▶</Text>
              </Pressable>
            </View>

            {tabActiva === "accesorio" && seleccion.accesorio ? (
              <AccesorioAjustePanel transform={accesorioTransform} onChange={setAccesorioTransform} />
            ) : null}

            {tabActiva === "capa" && seleccion.capa ? (
              <AccesorioAjustePanel
                transform={capaTransform}
                onChange={setCapaTransform}
                titulo="Ajustar capa"
                valorDefecto={CAPA_TRANSFORM_DEFAULT}
              />
            ) : null}
          </>
        )}

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
      </ScrollView>
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
  containerLateral: {
    flexDirection: "row",
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
  rotationOverlay: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  panel: {
    backgroundColor: colors.surface,
  },
  panelInferior: {
    maxHeight: "48%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  panelLateral: {
    width: ANCHO_PANEL_LATERAL,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  panelContenido: {
    padding: 16,
  },
  tabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActiva: {
    borderColor: colors.primarySoft,
    borderWidth: 2,
  },
  tabTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextoActivo: {
    color: colors.text,
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
  selectorNombre: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
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
