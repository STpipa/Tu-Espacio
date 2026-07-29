import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Canvas } from "@react-three/fiber";
import { useOrbitCamera } from "../three/useOrbitCamera";
import OrbitRig from "../three/OrbitRig";
import CampoAmbientalRenderer from "../three/particles/CampoAmbientalRenderer";
import { useParticleStore } from "../three/particles/particleStore";
import { CAMPOS_AMBIENTALES, obtenerCampo } from "../three/particles/camposAmbientales";
import type { CampoId, TipoEnergia, TipoVinculo } from "../three/particles/types";
import CampoPicker from "../components/CampoPicker";
import MovementPad from "../components/MovementPad";
import { colors, fonts } from "../lib/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

const RADIO_FUERZA = 3.2;
const INTENSIDAD_FUERZA = 2.4;

const LABEL_TIPO: Record<TipoEnergia, string> = {
  atraccion: "Atracción",
  repulsion: "Repulsión",
  turbulencia: "Turbulencia",
};

const COLOR_TIPO: Record<TipoEnergia, string> = {
  atraccion: "#6FE7C8",
  repulsion: "#FF6F91",
  turbulencia: "#D8B4FE",
};

const LABEL_VINCULO: Record<TipoVinculo, string> = {
  amor: "Amor",
  trauma: "Trauma",
  secreto: "Secreto",
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function Representante({
  position,
  tipoEnergia,
}: {
  position: [number, number, number];
  tipoEnergia: TipoEnergia;
}) {
  const color = COLOR_TIPO[tipoEnergia];
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <pointLight color={color} intensity={0.9} distance={4} />
    </group>
  );
}

function SelectorTipoEnergia({
  value,
  onChange,
}: {
  value: TipoEnergia;
  onChange: (t: TipoEnergia) => void;
}) {
  return (
    <View style={styles.filaBotones}>
      {(Object.keys(LABEL_TIPO) as TipoEnergia[]).map((tipo) => (
        <Pressable
          key={tipo}
          style={[
            styles.botonChico,
            value === tipo && { borderColor: COLOR_TIPO[tipo], borderWidth: 2 },
          ]}
          onPress={() => onChange(tipo)}
        >
          <Text style={styles.botonChicoTexto}>{LABEL_TIPO[tipo]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Demo/laboratorio del motor de partículas reactivas: deja elegir un campo
// ambiental, mover uno o dos "representantes" (D-pad, mismo patrón que ya
// usa el editor de avatar y la sala en vivo — no drag-and-drop 3D real) y
// ver cómo las partículas reaccionan en tiempo real, además de conectarlos
// con un lazo de energía. Todavía no está integrado a la sala multiusuario
// real ni sincronizado por Colyseus: es la etapa 1 (el motor en sí).
export default function ParticleLabScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { orbitState, panHandlers, containerRef } = useOrbitCamera({
    azimuth: 0.5,
    polar: 1.0,
    radius: 8,
  });

  const addRepresentanteFuerza = useParticleStore((s) => s.addRepresentanteFuerza);
  const updateRepresentantePosition = useParticleStore((s) => s.updateRepresentantePosition);
  const removeRepresentanteFuerza = useParticleStore((s) => s.removeRepresentanteFuerza);
  const conectarRepresentantes = useParticleStore((s) => s.conectarRepresentantes);
  const desconectarRepresentantes = useParticleStore((s) => s.desconectarRepresentantes);
  const setCampoAmbiental = useParticleStore((s) => s.setCampoAmbiental);
  const campoActivo = useParticleStore((s) => s.campoActivo);

  const [campoId, setCampoId] = useState<CampoId>(CAMPOS_AMBIENTALES[0].id);
  const [posA, setPosA] = useState<[number, number, number]>([-1.6, 1.2, 0]);
  const [tipoA, setTipoA] = useState<TipoEnergia>("atraccion");
  const [hayB, setHayB] = useState(false);
  const [posB, setPosB] = useState<[number, number, number]>([1.6, 1.2, 0]);
  const [tipoB, setTipoB] = useState<TipoEnergia>("repulsion");
  const [conectados, setConectados] = useState(false);
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>("amor");

  useEffect(() => {
    setCampoAmbiental(obtenerCampo(campoId));
  }, [campoId, setCampoAmbiental]);

  useEffect(() => {
    addRepresentanteFuerza("rep-a", posA, tipoA, RADIO_FUERZA, INTENSIDAD_FUERZA);
    return () => removeRepresentanteFuerza("rep-a");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoA]);

  useEffect(() => {
    if (!hayB) {
      removeRepresentanteFuerza("rep-b");
      return;
    }
    addRepresentanteFuerza("rep-b", posB, tipoB, RADIO_FUERZA, INTENSIDAD_FUERZA);
    return () => removeRepresentanteFuerza("rep-b");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hayB, tipoB]);

  useEffect(() => {
    if (conectados && hayB) {
      conectarRepresentantes("rep-a", "rep-b", tipoVinculo);
    } else {
      desconectarRepresentantes("rep-a", "rep-b");
    }
  }, [conectados, hayB, tipoVinculo, conectarRepresentantes, desconectarRepresentantes]);

  useEffect(() => {
    return () => {
      removeRepresentanteFuerza("rep-a");
      removeRepresentanteFuerza("rep-b");
      desconectarRepresentantes("rep-a", "rep-b");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moverA(dx: number, dz: number) {
    setPosA((prev) => {
      const next: [number, number, number] = [
        clamp(prev[0] + dx * 0.5, -4.5, 4.5),
        prev[1],
        clamp(prev[2] + dz * 0.5, -4.5, 4.5),
      ];
      updateRepresentantePosition("rep-a", next);
      return next;
    });
  }

  function moverB(dx: number, dz: number) {
    setPosB((prev) => {
      const next: [number, number, number] = [
        clamp(prev[0] + dx * 0.5, -4.5, 4.5),
        prev[1],
        clamp(prev[2] + dz * 0.5, -4.5, 4.5),
      ];
      updateRepresentantePosition("rep-b", next);
      return next;
    });
  }

  const campo = campoActivo ?? obtenerCampo(campoId);

  return (
    <View style={styles.container}>
      <View style={styles.escena3d}>
        <View ref={containerRef} style={StyleSheet.absoluteFill} {...panHandlers}>
          <Canvas camera={{ position: [4, 4, 8], fov: 50 }}>
            <CampoAmbientalRenderer campo={campo} size={12} />
            <Representante position={posA} tipoEnergia={tipoA} />
            {hayB ? <Representante position={posB} tipoEnergia={tipoB} /> : null}
            <OrbitRig orbitState={orbitState} />
          </Canvas>
        </View>

        <CampoPicker value={campoId} onChange={setCampoId} />
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContenido}>
        <Text style={styles.titulo}>Laboratorio de partículas (demo)</Text>
        <Text style={styles.subtitulo}>
          Todavía no está conectado a la sala real — es para probar el motor.
        </Text>

        <Text style={styles.seccion}>Representante A</Text>
        <SelectorTipoEnergia value={tipoA} onChange={setTipoA} />
        <View style={styles.filaPad}>
          <MovementPad onMove={moverA} />
        </View>

        {!hayB ? (
          <Pressable style={styles.botonSecundario} onPress={() => setHayB(true)}>
            <Text style={styles.botonSecundarioTexto}>+ Agregar representante B</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.seccion}>Representante B</Text>
            <SelectorTipoEnergia value={tipoB} onChange={setTipoB} />
            <View style={styles.filaPad}>
              <MovementPad onMove={moverB} />
            </View>

            <Pressable
              style={[styles.botonSecundario, conectados && styles.botonConectado]}
              onPress={() => setConectados((v) => !v)}
            >
              <Text style={styles.botonSecundarioTexto}>
                {conectados ? "🔗 Desconectar A ↔ B" : "🔗 Conectar A ↔ B"}
              </Text>
            </Pressable>

            {conectados ? (
              <View style={styles.filaBotones}>
                {(Object.keys(LABEL_VINCULO) as TipoVinculo[]).map((tipo) => (
                  <Pressable
                    key={tipo}
                    style={[styles.botonChico, tipoVinculo === tipo && styles.botonChicoActivo]}
                    onPress={() => setTipoVinculo(tipo)}
                  >
                    <Text style={styles.botonChicoTexto}>{LABEL_VINCULO[tipo]}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Pressable style={styles.quitarB} onPress={() => setHayB(false)}>
              <Text style={styles.quitarBTexto}>Quitar representante B</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
      </ScrollView>
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
  panel: {
    maxHeight: 340,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  panelContenido: {
    padding: 16,
    gap: 10,
  },
  titulo: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: -4,
  },
  seccion: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textFaint,
    marginTop: 6,
  },
  filaBotones: {
    flexDirection: "row",
    gap: 8,
  },
  filaPad: {
    alignItems: "center",
    paddingVertical: 4,
  },
  botonChico: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 8,
    alignItems: "center",
  },
  botonChicoActivo: {
    borderColor: colors.primarySoft,
    borderWidth: 2,
  },
  botonChicoTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  botonSecundario: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  botonConectado: {
    borderColor: colors.success,
  },
  botonSecundarioTexto: {
    color: colors.primarySoft,
    fontWeight: "600",
  },
  quitarB: {
    alignItems: "center",
    paddingVertical: 8,
  },
  quitarBTexto: {
    color: colors.danger,
    fontSize: 13,
  },
  backText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
});
