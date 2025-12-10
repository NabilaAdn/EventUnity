import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../src/contexts/AuthContext"; // ⬅ penting!
import { useTheme } from "../../src/contexts/ThemeContext";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { login } = useAuth(); // ⬅ ambil fungsi login()
  const { theme, isDark, toggleTheme } = useTheme();
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      Toast.show({
        type: "error",
        text1: "⚠️ Field Kosong",
        text2: "Isi Email/Username dan Password Terlebih Dahulu!",
      });
      return;
    }

    setLoading(true);

    try {
      let emailToLogin = identifier.trim().toLowerCase();

      // 1️⃣ Jika login dengan USERNAME → cari email di profiles
      if (!identifier.includes("@")) {
        const cleanUsername = identifier.trim().toLowerCase();
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (profileErr || !profile) {
          Toast.show({
            type: "error",
            text1: "❌ Username tidak ditemukan",
            text2: "Pastikan username benar.",
          });
          return;
        }

        // gunakan email dummy berbasis username
        emailToLogin = profile.email;
      }

      // 2️⃣ Login ke Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: emailToLogin,
          password: password,
        });

      if (authError) {
        Toast.show({
          type: "error",
          text1: "❌ Gagal Login",
          text2:
            authError.message.includes("Invalid login credentials")
              ? "Password salah atau akun tidak ditemukan."
              : authError.message,
          position: "top",
        });
        return;
      }

      // 3️⃣ Ambil data profil
      const userId = authData.user.id;
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileErr) {
        Toast.show({
          type: "error",
          text1: "⚠️ Gagal memuat profil",
          text2: profileErr.message,
          position: "top",
        });
        return;
      }

      // 4️⃣ Simpan user di AuthContext
      await login(profile);

      Toast.show({
        type: "success",
        text1: `👋 Selamat datang, ${profile.username}!`,
        text2: `Login sebagai ${profile.role.toUpperCase()}.`,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "❌ Terjadi Kesalahan",
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  //     const res = await fetch("http://127.0.0.1:4000/api/auth/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ username, password }),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       if (data.message?.toLowerCase().includes("tidak ditemukan")) {
  //         Toast.show({
  //           type: "error",
  //           text1: "❌ Gagal Login",
  //           text2: "Username tidak ditemukan.",
  //           position: "top",
  //         });
  //       } else if (data.message?.toLowerCase().includes("password")) {
  //         Toast.show({
  //           type: "error",
  //           text1: "❌ Gagal Login",
  //           text2: "Password yang kamu masukkan salah.",
  //           position: "top",
  //         });
  //       } else {
  //         Toast.show({
  //           type: "error",
  //           text1: "⚠️ Error",
  //           text2: data.message || "Terjadi kesalahan saat login.",
  //           position: "top",
  //         });
  //       }
  //       return;
  //     }

  //     // 🔥 SIMPAN TOKEN + USER KE AUTHCONTEXT (PENTING BANGET)
  //     await login(data.token, data.user);

  //     // Tidak perlu router.replace()
  //     // AuthContext otomatis redirect ke halaman sesuai role
  //     Toast.show({
  //       type: "success",
  //       text1: `👋 Selamat datang, ${data.user.username}!`,
  //       text2: `Login sebagai ${data.user.role.toUpperCase()}.`,
  //       position: "top",
  //     });

  //   } catch (err) {
  //     Toast.show({
  //       type: "error",
  //       text1: "❌ Gagal Terhubung",
  //       text2: "Tidak dapat menghubungi server. Pastikan backend aktif.",
  //       position: "top",
  //     });
  //   }
  // };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
    <View style={{ flex: 1, justifyContent: "center", padding: 30 }}>
      {/* Dark Mode Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            position: "absolute",
            top: 50,
            right: 20,
            padding: 12,
            backgroundColor: theme.card,
            borderRadius: 12,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <MaterialIcons
            name={isDark ? "light-mode" : "dark-mode"}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
      
      {/* Header */}
        <View style={{ marginBottom: 40, alignItems: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.primaryLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <MaterialIcons name="event" size={40} color={theme.primary} />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: theme.text,
              marginBottom: 8,
            }}
          >
            Login
          </Text>
          <Text style={{ fontSize: 15, color: theme.textSecondary }}>
            Selamat datang kembali! 👋
          </Text>
        </View>

      {/* Username Input */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            E-mail / Username
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: 16,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialIcons
              name="person-outline"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Masukkan E-Mail / Username"
              placeholderTextColor={theme.textTertiary}
              value={identifier}
              onChangeText={setIdentifier}
              style={{
                flex: 1,
                paddingVertical: 16,
                fontSize: 15,
                color: theme.text,
              }}
            />
          </View>
        </View>

      {/* Password Input */}
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Password
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: 16,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Masukkan password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={{
                flex: 1,
                paddingVertical: 16,
                fontSize: 15,
                color: theme.text,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ padding: 4 }}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

      {/* Login Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 20,
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}
            >
              {loading ? "Loading..." : "Login"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      {/* Register Link */}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Belum punya akun?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text
              style={{
                color: theme.primary,
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              Daftar
            </Text>
          </TouchableOpacity>
        </View>

    </View>
    <Toast />
    </KeyboardAvoidingView>
  );
}
