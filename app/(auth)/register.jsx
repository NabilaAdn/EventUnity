import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../src/contexts/ThemeContext";

import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../lib/supabase";

const ADMIN_SECRET = "EVENTMATE2025";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [phone_number, setPhone] = useState("");
  const [work, setWork] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const handleRegister = async () => {
    if (!name || !username || !password || !email || !phone_number || !gender || !work) {
      Toast.show({
        type: "error",
        text1: "⚠️ Field Kosong",
        text2: "Isi Semua Field!",
      });
      
      return;
    }

    const role = adminCode.trim() === ADMIN_SECRET ? "admin" : "user";
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // const inputCode = (adminCode || "").trim().toLowerCase();
    // const validCode = ADMIN_SECRET.toLowerCase();
    
    //Tentukan Role
    try {
      // 1️⃣ Register ke Supabase Auth (password disimpan aman)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password.trim(),
        options: {
          data: {
            role,
            username: cleanUsername,
            name,
            gender,
            phone_number,
            work,
          },
        },
      });

      if (authError) {
        Toast.show({
          type: "error",
          text1: "❌ Gagal Register",
          text2: authError.message,
        });
        return;
      }
      // console.log("User session:", authData.session);
      // console.log("User object:", authData.user);

      // console.log("Admin code:", adminCode);
      // console.log("Role result:", role);

      // 2. LOGIN otomatis (WAJIB)
      // await supabase.auth.signInWithPassword({
      //   email: cleanEmail,
      //   password: password.trim(),
      // });

      // // 3. Ambil session
      // const {
      //   data: { session },
      // } = await supabase.auth.getSession();

      // console.log("Session setelah login:", session);

      // Jika masih null → RLS pasti menolak
      // if (!session) {
      //   throw new Error("Tidak ada session aktif setelah login.");
      // }

      // const userId = authData.user.id;
      // console.log("Registered user ID:", userId);

      // 2️⃣ Masukkan data ke tabel profiles
      // const { error: profileErr } = await supabase.from("profiles").insert([
      //   {
      //     id: userId,
      //     name: name.trim(),
      //     gender,
      //     phone_number: phone_number.trim(),
      //     work,
      //     role,
      //     email: cleanEmail,
      //     username: cleanUsername,
      //   },
      // ]);

      // if (profileErr) throw profileErr;

      Toast.show({
        type: "success",
        text1: role === "admin" ? "👑 Akun Admin Dibuat!" : "🎉 Akun User Dibuat!",
        text2: "Silakan login untuk melanjutkan.",
      });

      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "❌ Gagal Mendaftar",
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingLeft: 30, paddingRight: 30, paddingBottom: 70, paddingTop: 70 }}
        showsVerticalScrollIndicator={false}>
      
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
        <View style={{ marginBottom: 32, alignItems: "center", marginTop: 20 }}>
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
            <MaterialIcons name="person-add" size={40} color={theme.primary} />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: theme.text,
              marginBottom: 8,
            }}
          >
            Create Account
          </Text>
          <Text style={{ fontSize: 15, color: theme.textSecondary }}>
            Daftar untuk memulai! 🎉
          </Text>
        </View>
      
      {/* Name Input */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Nama Lengkap
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
              name="badge"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 15,
                color: theme.text,
              }}
            />
          </View>
        </View>

      {/* Jenis Kelamin Input */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: theme.text,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Jenis Kelamin
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
            marginBottom: 16,
          }}
        >
          <MaterialIcons
            name="work-outline"
            size={20}
            color={theme.textSecondary}
            style={{ marginRight: 12 }}
          />

          <Picker
            selectedValue={gender}
            onValueChange={(val) => setGender(val)}
            style={{
              flex: 1,
              height: 52,
              color: theme.text,
            }}
            dropdownIconColor={theme.textSecondary} // untuk Android
          >
            <Picker.Item label="Pilih Jenis Kelamin Anda" value="" />
            <Picker.Item label="Laki-laki" value="Laki-laki" />
            <Picker.Item label="Perempuan" value="Perempuan" />
          </Picker>
        </View>

      {/* Nomor Telepon Input */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Nomor Telepon
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
              placeholder="Masukkan Nomor Telepon"
              placeholderTextColor={theme.textTertiary}
              value={phone_number}
              onChangeText={setPhone}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 15,
                color: theme.text,
              }}
            />
          </View>
        </View>

      {/* Pekerjaan Input */}
        <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Pekerjaan
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
              marginBottom: 16,
            }}
          >
            <MaterialIcons
              name="work-outline"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 12 }}
            />

            <Picker
              selectedValue={work}
              onValueChange={(val) => setWork(val)}
              style={{
                flex: 1,
                height: 52,
                color: theme.text,
              }}
              dropdownIconColor={theme.textSecondary} // untuk Android
            >
              <Picker.Item label="Pilih Pekerjaan Anda" value="" />
              <Picker.Item label="Pelajar" value="Pelajar" />
              <Picker.Item label="Mahasiswa" value="Mahasiswa" />
              <Picker.Item label="Dosen" value="Dosen" />
              <Picker.Item label="Staff Akademik" value="Staff Akademik" />
              <Picker.Item label="Lainnya" value="Lainnya" />
            </Picker>
          </View>

      {/* E-Mail Input */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            E-Mail
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
              placeholder="Masukkan E-Mail"
              placeholderTextColor={theme.textTertiary}
              value={email}
              onChangeText={setEmail}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 15,
                color: theme.text,
              }}
            />
          </View>
        </View>

      {/* Username Input */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Username
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
              placeholder="Masukkan username"
              placeholderTextColor={theme.textTertiary}
              value={username}
              onChangeText={setUsername}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 15,
                color: theme.text,
              }}
            />
          </View>
        </View>

      {/* Password Input */}
        <View style={{ marginBottom: 16 }}>
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
                paddingVertical: 14,
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

      {/* Admin Code Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.text,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Kode Admin (Opsional)
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
              name="admin-panel-settings"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="Kosongkan jika user biasa"
              placeholderTextColor={theme.textTertiary}
              value={adminCode}
              onChangeText={setAdminCode}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 15,
                color: theme.text,
              }}
            />
          </View>
        </View>

      {/* Register Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleRegister}
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
              {loading ? "Loading..." : "Create Account"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      {/* Login Link */}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Sudah punya akun?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text
              style={{
                color: theme.primary,
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
    </ScrollView>
    <Toast />
    </KeyboardAvoidingView>
  );
}