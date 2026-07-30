import "react-native-url-polyfill/auto";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copiá .env.example a .env y completá tus credenciales de Supabase."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Recomendado por Supabase para React Native: los timers de refresco
// automático no corren de forma confiable con la app en segundo plano, así
// que el token puede terminar vencido sin haberse renovado. Sin esto, una
// sesión que estuvo un rato en background (la app minimizada, el celular
// bloqueado) se quedaba con un token viejo y cualquier acción que lo usa
// directamente (como entrar a una sala de Colyseus) fallaba con "Sesión
// inválida o expirada" hasta cerrar y volver a abrir sesión a mano.
AppState.addEventListener("change", (estado) => {
  if (estado === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
