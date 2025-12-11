import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../src/contexts/ThemeContext";

export default function EventParticipants() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [participants, setParticipants] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("title")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error loading event details:", error);
        return;
      }

      setEventTitle(data?.title || "Event");
    } catch (err) {
      console.error("Unexpected error loading event details:", err);
    }
  };

  const loadParticipants = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          created_at,
          profiles (
      id,
      name,
      email, phone_number,
    )
        `)
        .eq("event_id", id)
        .order("created_at", { ascending: true });

        console.log(JSON.stringify(data, null, 2))
        console.log("RAW DATA:", data)

      if (error) {
        console.error("Error loading participants:", error);
        Toast.show({
          type: "error",
          text1: "Gagal memuat peserta",
          text2: error.message,
        });
        return;
      }

      // Filter out participants with null profiles (deleted users)
      const validParticipants = (data || []).filter(p => p.profiles !== null);

      // Log if there are orphaned registrations
      const orphanedCount = (data || []).length - validParticipants.length;
      if (orphanedCount > 0) {
        console.log(`Found ${orphanedCount} orphaned registration(s) (user deleted)`);
      }

      setParticipants(validParticipants);
    } catch (err) {
      console.error("Unexpected error loading participants:", err);
      Toast.show({
        type: "error",
        text1: "Terjadi kesalahan",
        text2: "Tidak dapat memuat peserta",
      });
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (id) {
      loadEventDetails();
      loadParticipants();
    }
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 50,
          paddingBottom: 20,
          backgroundColor: theme.primary,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 10,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 12,
            marginRight: 15,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#FFFFFF" }}>
            Daftar Peserta
          </Text>
          {eventTitle && (
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
              {eventTitle}
            </Text>
          )}
        </View>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
            {participants.length}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, marginTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
              Memuat peserta...
            </Text>
          </View>
        ) : participants.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons
              name="people-outline"
              size={80}
              color={theme.textTertiary}
            />
            <Text
              style={{
                color: theme.textSecondary,
                marginTop: 16,
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Belum ada peserta yang mendaftar untuk event ini
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 15,
              }}
            >
              📋 Total {participants.length} Peserta
            </Text>

            {participants.map((p, index) => (
              <View
                key={p.id}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: theme.card,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Number Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: theme.primaryLight,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>

                {/* User Info */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View
                    style={{
                      backgroundColor: theme.primary,
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>
                      {(p.profiles?.name || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginRight: 40 }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: theme.text,
                        marginBottom: 4,
                      }}
                    >
                      {p.profiles?.name || "Nama tidak tersedia"}
                    </Text>

                    {p.profiles?.username && (
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: 13,
                          marginBottom: 2,
                        }}
                      >
                        @{p.profiles.username}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Email */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="email"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: theme.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {p.profiles?.email || "Email tidak tersedia"}
                  </Text>
                </View>

                {/* No Telepon */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="phone"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: theme.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {p.profiles?.phone_number || "Nomor Telepon tidak tersedia"}
                  </Text>
                </View>

                {/* Registration Date */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons
                    name="access-time"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: theme.textSecondary,
                      fontSize: 13,
                    }}
                  >
                    Daftar: {formatDate(p.created_at)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      <Toast />
    </View>
  );
}