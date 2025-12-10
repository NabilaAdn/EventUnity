import { Stack } from "expo-router";
import Toast from "react-native-toast-message"; // ⬅️ Tambahkan import ini
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider } from "../src/contexts/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
    <AuthProvider>
      {/* Stack navigasi utama */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>

      {/* Komponen Toast global */}
      <Toast
        position="top"
        visibilityTime={2000}
        autoHide
        bottomOffset={60}
      />
    </AuthProvider>
    </ThemeProvider>
  );
}
