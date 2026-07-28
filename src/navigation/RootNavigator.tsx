import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import ClienteScreen from "../screens/ClienteScreen";
import CuradorScreen from "../screens/CuradorScreen";
import LoadingScreen from "../screens/LoadingScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import AvatarEditorScreen from "../screens/AvatarEditorScreen";
import SalaEnVivoScreen from "../screens/SalaEnVivoScreen";
import { colors } from "../lib/theme";
import { getOnboardingCompletado } from "../lib/onboarding";

export type RootStackParamList = {
  Login: undefined;
  Loading: undefined;
  Cliente: undefined;
  Curador: undefined;
  AvatarEditor: undefined;
  SalaEnVivo: { codigo: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primaryDark,
};

// Ojo: React Navigation resuelve las rutas inspeccionando los hijos de
// <Stack.Group>/<Stack.Navigator> de forma estática, así que las pantallas
// compartidas van como un array de <Stack.Screen> directo (no un componente
// envoltorio, que no funciona con este mecanismo).
function pantallasComunes() {
  return [
    <Stack.Screen
      key="AvatarEditor"
      name="AvatarEditor"
      component={AvatarEditorScreen}
      options={{ ...headerOptions, title: "Tu avatar" }}
    />,
    <Stack.Screen
      key="SalaEnVivo"
      name="SalaEnVivo"
      component={SalaEnVivoScreen}
      options={{ ...headerOptions, title: "Sala en vivo" }}
    />,
  ];
}

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const [onboardingCompletado, setOnboardingCompletado] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    getOnboardingCompletado().then(setOnboardingCompletado);
  }, []);

  if (onboardingCompletado === null) {
    return <LoadingScreen />;
  }

  if (!onboardingCompletado) {
    return <OnboardingScreen onFinish={() => setOnboardingCompletado(true)} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !profile ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : profile.role === "cliente" ? (
          <Stack.Group>
            <Stack.Screen name="Cliente" component={ClienteScreen} />
            {pantallasComunes()}
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Curador" component={CuradorScreen} />
            {pantallasComunes()}
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
