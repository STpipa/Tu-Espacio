import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Audio from "expo-audio";
import * as Notifications from "expo-notifications";

// En react-native-web, Alert.alert es un no-op (no muestra nada ni llama
// a los botones), así que la Promise de abajo nunca se resolvía en web y
// quedaba todo colgado esperando un botón que nunca se apreta. Con
// window.confirm se resuelve al toque, sincrónico, como en cualquier web.
function pedirConfirmacion(titulo: string, mensaje: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }

  return new Promise((resolve) => {
    Alert.alert(titulo, mensaje, [
      { text: "Ahora no", style: "cancel", onPress: () => resolve(false) },
      { text: "Continuar", onPress: () => resolve(true) },
    ]);
  });
}

export async function pedirPermisoGaleria(): Promise<boolean> {
  const confirmo = await pedirConfirmacion(
    "Acceso a tus fotos",
    "Tu Espacio necesita acceder a tu galería para que puedas elegir una foto de perfil. Solo se usa la imagen que elijas."
  );
  if (!confirmo) return false;

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

export async function pedirPermisoCamara(): Promise<boolean> {
  const confirmo = await pedirConfirmacion(
    "Acceso a tu cámara",
    "Tu Espacio necesita acceder a tu cámara para que puedas sacarte una foto de perfil en el momento."
  );
  if (!confirmo) return false;

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === "granted";
}

export async function pedirPermisoMicrofono(): Promise<boolean> {
  const confirmo = await pedirConfirmacion(
    "Acceso a tu micrófono",
    "Las salas en vivo usan tu micrófono para que los demás participantes te escuchen."
  );
  if (!confirmo) return false;

  const { status } = await Audio.requestRecordingPermissionsAsync();
  return status === "granted";
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const confirmo = await pedirConfirmacion(
    "Avisos de citas",
    "Activá las notificaciones para recibir avisos de tus próximas sesiones guiadas. Podés desactivarlas cuando quieras desde los ajustes del sistema."
  );
  if (!confirmo) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}
