import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import ClienteScreen from "../screens/ClienteScreen";
import CuradorScreen from "../screens/CuradorScreen";
import LoadingScreen from "../screens/LoadingScreen";
import AvatarEditorScreen from "../screens/AvatarEditorScreen";
import { colors } from "../lib/theme";

export type RootStackParamList = {
  Login: undefined;
  Loading: undefined;
  Cliente: undefined;
  Curador: undefined;
  AvatarEditor: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

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
            <Stack.Screen
              name="AvatarEditor"
              component={AvatarEditorScreen}
              options={{
                headerShown: true,
                title: "Tu avatar",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.primaryDark,
              }}
            />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Curador" component={CuradorScreen} />
            <Stack.Screen
              name="AvatarEditor"
              component={AvatarEditorScreen}
              options={{
                headerShown: true,
                title: "Tu avatar",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.primaryDark,
              }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
