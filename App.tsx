import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from "@expo-google-fonts/cinzel";
import { AuthProvider } from "./src/contexts/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/lib/theme";

export default function App() {
  const [fontsLoaded] = useFonts({ Cinzel_600SemiBold, Cinzel_700Bold });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
