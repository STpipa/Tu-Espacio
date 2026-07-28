import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";
import { pedirPermisoMicrofono, pedirPermisoNotificaciones } from "../lib/permisos";

type EstadoPermiso = "sin_pedir" | "concedido" | "denegado";

function Fila({
  titulo,
  descripcion,
  estado,
  onActivar,
}: {
  titulo: string;
  descripcion: string;
  estado: EstadoPermiso;
  onActivar: () => void;
}) {
  return (
    <View style={styles.fila}>
      <View style={styles.filaTexto}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.filaDescripcion}>{descripcion}</Text>
      </View>
      {estado === "concedido" ? (
        <Text style={styles.estadoOk}>Activado ✓</Text>
      ) : (
        <Pressable style={styles.boton} onPress={onActivar}>
          <Text style={styles.botonTexto}>
            {estado === "denegado" ? "Reintentar" : "Activar"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function PermisosCard() {
  const [microfono, setMicrofono] = useState<EstadoPermiso>("sin_pedir");
  const [notificaciones, setNotificaciones] = useState<EstadoPermiso>("sin_pedir");

  async function activarMicrofono() {
    const concedido = await pedirPermisoMicrofono();
    setMicrofono(concedido ? "concedido" : "denegado");
  }

  async function activarNotificaciones() {
    const concedido = await pedirPermisoNotificaciones();
    setNotificaciones(concedido ? "concedido" : "denegado");
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Permisos</Text>
      <Fila
        titulo="🎙️ Micrófono"
        descripcion="Para el audio de las salas en vivo (próximamente)."
        estado={microfono}
        onActivar={activarMicrofono}
      />
      <Fila
        titulo="🔔 Notificaciones"
        descripcion="Avisos de tus próximas sesiones (próximamente)."
        estado={notificaciones}
        onActivar={activarNotificaciones}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 12,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  filaTexto: {
    flex: 1,
    paddingRight: 12,
  },
  filaTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  filaDescripcion: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  boton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  botonTexto: {
    color: colors.primaryDark,
    fontWeight: "600",
    fontSize: 12,
  },
  estadoOk: {
    color: colors.primaryDark,
    fontWeight: "600",
    fontSize: 12,
  },
});
