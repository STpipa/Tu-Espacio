export interface EstadoVoz {
  conectado: boolean;
  micHabilitado: boolean;
  error: string | null;
  alternarMic: () => void;
}

// Fallback nativo (iOS/Android): el SDK real de LiveKit para React Native
// (@livekit/react-native + @livekit/react-native-webrtc) son módulos
// nativos que rompen Expo Go — se agregan cuando llegue el momento de
// probar en celular. Metro resuelve `voz.web.ts` en vez de este archivo
// en la versión web (ver ese archivo para la implementación real).
// ponytail: stub sin conexión real, agregar el SDK nativo cuando se pruebe en celular.
export function useVoz(_codigoAcceso: string | undefined, _silenciadoPorModerador: boolean): EstadoVoz {
  return {
    conectado: false,
    micHabilitado: false,
    error: "El audio real todavía no está disponible en la app de celular.",
    alternarMic: () => {},
  };
}
