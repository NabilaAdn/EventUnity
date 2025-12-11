import { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function AdminProfile() {
  const { theme } = useTheme();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);


  // =============================
  // Load admin profile
  // =============================
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name,
        email: user.email,
        phone: data.phone,
        username: data.username,
      });
    }
    setLoading(false);
  };

  // =============================
  // Save profile
  // =============================
  const saveProfile = async () => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        username: profile.username,
      })
      .eq("id", user.id);

    // Email update → Supabase Auth
    if (profile.email !== user.email) {
      await supabase.auth.updateUser({ email: profile.email });
    }

    setSaving(false);
    alert("Profil berhasil diperbarui!");
  };


  const onCancelEdit = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelEdit = () => {
    setShowCancelConfirm(false);
    loadProfile();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Text style={{ color: theme.text }}>Memuat...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}
    >
      <Text
        style={{
          color: theme.text,
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 15,
        }}
      >
        Profil Admin
      </Text>

      {/* FORM */}
      {["full_name", "email", "phone", "username"].map((key) => (
        <View key={key} style={{ marginBottom: 15 }}>
          <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
            {key === "full_name"
              ? "Nama Lengkap"
              : key === "phone"
              ? "No HP"
              : key.charAt(0).toUpperCase() + key.slice(1)}
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.card,
              color: theme.text,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
            value={profile[key]}
            onChangeText={(t) => setProfile({ ...profile, [key]: t })}
          />
        </View>
      ))}

      {/* BUTTONS */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
        <TouchableOpacity
          onPress={onCancelEdit}
          style={{
            flex: 1,
            backgroundColor: theme.border,
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: theme.text, textAlign: "center" }}>
            Batal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveProfile}
          style={{
            flex: 1,
            backgroundColor: theme.primary,
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center" }}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================= */}
      {/* CANCEL CONFIRM MODAL */}
      {/* ======================= */}
      <Modal transparent visible={showCancelConfirm} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: theme.overlay,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.card,
              padding: 20,
              borderRadius: 15,
              width: "90%",
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: theme.text }}
            >
              Batalkan Perubahan?
            </Text>

            <Text
              style={{
                marginTop: 10,
                color: theme.textSecondary,
                marginBottom: 20,
              }}
            >
              Semua perubahan yang belum disimpan akan hilang.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowCancelConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: theme.border,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ textAlign: "center", color: theme.text }}>
                  Tidak
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmCancelEdit}
                style={{
                  flex: 1,
                  backgroundColor: theme.error,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ textAlign: "center", color: "#FFF" }}>
                  Ya, Batalkan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
