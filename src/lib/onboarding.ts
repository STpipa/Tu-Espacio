import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE_ONBOARDING = "tu-espacio:onboarding-completado";

export async function getOnboardingCompletado(): Promise<boolean> {
  const valor = await AsyncStorage.getItem(CLAVE_ONBOARDING);
  return valor === "true";
}

export async function marcarOnboardingCompletado(): Promise<void> {
  await AsyncStorage.setItem(CLAVE_ONBOARDING, "true");
}
