// Integración con RevenueCat — todavía NO conectada a un SDK real.
//
// Para activarla de verdad hace falta:
//   1. Crear una cuenta gratis en revenuecat.com y un proyecto para esta app.
//   2. `npx expo install react-native-purchases` — es un módulo NATIVO, así
//      que a partir de instalarlo `expo start` con Expo Go deja de alcanzar
//      para probar la app: hace falta un dev client propio (`expo prebuild`
//      + EAS Build, o un build local con Android Studio/Xcode).
//   3. Configurar un entitlement (ej. "curador_pro") en el dashboard de
//      RevenueCat y reemplazar el cuerpo de `verificarSuscripcionActiva`
//      por una llamada real a `Purchases.getCustomerInfo()`.
//
// Mientras tanto, esta función siempre devuelve `false`: el único bypass
// de pago disponible hoy es `exento_pago` o `role === 'super_admin'`.
export async function verificarSuscripcionActiva(_userId: string): Promise<boolean> {
  return false;
}
