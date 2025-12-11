import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Toast from "react-native-toast-message";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function AdminEvents() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
    const [showLogoutModal, setShowLogoutModal] = useState(false);


  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const isFocused = useIsFocused();

  const formatTime = (time) => {
    if (!time) return "-";
    const [h, m] = time.split(":");
    return `${h}:${m}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    const bulan = [
      "Januari","Februari","Maret","April","Mei","Juni",
      "Juli","Agustus","September","Oktober","November","Desember"
    ];
    return `${d} ${bulan[Number(m) - 1]} ${y}`;
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations (id)
        `)
        .order("event_date", { ascending: false });

      if (error) {
        console.error("Error loading events:", error);
        Toast.show({ 
          type: "error", 
          text1: "Gagal memuat event", 
          text2: error.message 
        });
        return;
      }

      // Ensure event_registrations is always an array
      const formattedData = (data || []).map(event => ({
        ...event,
        event_registrations: event.event_registrations || []
      }));

      setEvents(formattedData);
      setFilteredEvents(formattedData);
    } catch (err) {
      console.error("Unexpected error loading events:", err);
      Toast.show({ 
        type: "error", 
        text1: "Terjadi kesalahan",
        text2: "Tidak dapat memuat event" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      loadEvents();
    }
  }, [isFocused]);

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting event:", error);
        Toast.show({
          type: "error",
          text1: "Gagal menghapus",
          text2: error.message,
        });
        return;
      }

      Toast.show({ 
        type: "success", 
        text1: "Event berhasil dihapus", 
        position: "top" 
      });
      
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setFilteredEvents((prev) => prev.filter((e) => e.id !== id));
      setSelectedEvent(null);
    } catch (error) {
      console.error("Unexpected error deleting event:", error);
      Toast.show({
        type: "error",
        text1: "Gagal menghapus",
        text2: "Terjadi kesalahan tidak terduga",
      });
    }
  };

  const getCategoryStyle = (category) => {
    const cat = category || "Tanpa Kategori";
    return theme.categories?.[cat] || theme.categories?.["Tanpa Kategori"] || {
      bg: theme.card,
      text: theme.text,
      border: theme.border
    };
  };

  const categories = [
    "All",
    ...new Set(events.map((e) => e.category || "Tanpa Kategori")),
  ];

  useEffect(() => {
    let list = events;

    if (selectedCategory !== "All") {
      list = list.filter(
        (e) => (e.category || "Tanpa Kategori") === selectedCategory
      );
    }

    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(lower) ||
          (e.category || "Tanpa Kategori").toLowerCase().includes(lower) ||
          e.location?.toLowerCase().includes(lower)
      );
    }

    setFilteredEvents(list);
  }, [selectedCategory, events, searchQuery]);

  // Helper to get registration count safely
  const getRegistrationCount = (event) => {
    return Array.isArray(event?.event_registrations) 
      ? event.event_registrations.length 
      : 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 50,
          paddingBottom: 30,
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
        <View>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#FFFFFF" }}>
            Admin Panel
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
            Kelola semua event
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 20 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              padding: 10,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 12,
            }}
          >
            <MaterialIcons
              name={isDark ? "light-mode" : "dark-mode"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            style={{ padding: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12 }}
          >
            <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
            Memuat event...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20, marginTop: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* SEARCH BAR */}
          <View
            style={{
              backgroundColor: theme.card,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: searchQuery ? theme.primary : theme.border,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: searchQuery ? 0.2 : 0.08,
              shadowRadius: 8,
              elevation: searchQuery ? 6 : 3,
            }}
          >
            <View
              style={{
                backgroundColor: theme.primaryLight,
                padding: 8,
                borderRadius: 10,
                marginRight: 12,
              }}
            >
              <MaterialIcons 
                name="search" 
                size={22} 
                color={theme.primary}
              />
            </View>
            
            <TextInput
              placeholder="Cari event berdasarkan judul..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                color: theme.text,
                fontSize: 15,
                fontWeight: "500",
              }}
            />
            
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={{
                  backgroundColor: theme.border,
                  padding: 6,
                  borderRadius: 8,
                  marginLeft: 8,
                }}
              >
                <MaterialIcons 
                  name="close" 
                  size={18} 
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* CATEGORY FILTER */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {categories.map((cat) => {
              const catStyle = cat !== "All" ? getCategoryStyle(cat) : null;
              const isSelected = selectedCategory === cat;
              
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    backgroundColor: isSelected 
                      ? (catStyle?.bg || theme.primary) 
                      : theme.card,
                    borderRadius: 20,
                    marginRight: 10,
                    borderWidth: 1,
                    borderColor: isSelected 
                      ? (catStyle?.border || theme.primary) 
                      : theme.border,
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected 
                        ? (catStyle?.text || "#FFFFFF") 
                        : theme.text,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* EVENT LIST TITLE */}
          <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 15 }}>
            <MaterialIcons name="confirmation-number" size={18} /> Event Tersedia ({filteredEvents.length})
          </Text>

          {/* EMPTY STATE */}
          {filteredEvents.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Ionicons
                name="calendar-outline"
                size={80}
                color={theme.textTertiary}
              />
              <Text
                style={{
                  color: theme.textSecondary,
                  marginTop: 16,
                  fontSize: 16,
                }}
              >
                {searchQuery || selectedCategory !== "All"
                  ? "Tidak ada event yang cocok"
                  : "Belum ada event"}
              </Text>
            </View>
          )}

          {/* EVENT CARDS */}
          {filteredEvents.map((item) => {
            const catStyle = getCategoryStyle(item.category);
            const registrationCount = getRegistrationCount(item);
            
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedEvent(item)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: theme.card,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text
                    style={{
                      backgroundColor: catStyle.bg,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      color: catStyle.text,
                      fontWeight: "700",
                      fontSize: 12,
                      borderWidth: 1,
                      borderColor: catStyle.border,
                    }}
                  >
                    {item.category || "Tanpa Kategori"}
                  </Text>
                </View>

                <Text style={{ fontWeight: "bold", fontSize: 17, color: theme.text, marginBottom: 8 }}>
                  {item.title}
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <MaterialIcons name="event" size={16} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 6, color: theme.textSecondary, fontSize: 14 }}>
                    {formatDate(item.event_date)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <MaterialIcons name="access-time" size={16} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 6, color: theme.textSecondary, fontSize: 14 }}>
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="place" size={16} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 6, color: theme.textSecondary, fontSize: 14 }}>
                    {item.location}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <MaterialIcons name="people" size={16} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 6, color: theme.textSecondary, fontSize: 14 }}>
                    {registrationCount} / {item.max_participants} peserta
                  </Text>
                </View>

              </TouchableOpacity>
            );
          })}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* MODAL DETAIL */}
      <Modal visible={!!selectedEvent} transparent animationType="fade">
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
              borderRadius: 24,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 16,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "bold", color: theme.text, marginBottom: 12 }}>
              {selectedEvent?.title}
            </Text>

            {selectedEvent && (
              <Text
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: getCategoryStyle(selectedEvent.category).bg,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  color: getCategoryStyle(selectedEvent.category).text,
                  fontWeight: "700",
                  marginBottom: 16,
                  fontSize: 13,
                  borderWidth: 1,
                  borderColor: getCategoryStyle(selectedEvent.category).border,
                }}
              >
                {selectedEvent.category || "Tanpa Kategori"}
              </Text>
            )}

            <View style={{ backgroundColor: theme.borderLight, height: 1, marginBottom: 16 }} />

            <View style={{ gap: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    padding: 8,
                    borderRadius: 10,
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="event" size={20} color={theme.primary} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15 }}>
                  {formatDate(selectedEvent?.event_date)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    padding: 8,
                    borderRadius: 10,
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="access-time" size={20} color={theme.primary} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15 }}>
                  {formatTime(selectedEvent?.start_time)} - {formatTime(selectedEvent?.end_time)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    padding: 8,
                    borderRadius: 10,
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="place" size={20} color={theme.primary} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>
                  {selectedEvent?.location}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    padding: 8,
                    borderRadius: 10,
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="person" size={20} color={theme.primary} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>
                  {getRegistrationCount(selectedEvent)} / {selectedEvent?.max_participants} Peserta
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: theme.borderLight, height: 1, marginBottom: 16 }} />

            <Text style={{ color: theme.textSecondary, lineHeight: 22, marginBottom: 20 }}>
              {selectedEvent?.description || "Tidak ada deskripsi."}
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => {
                  const id = selectedEvent.id;
                  console.log("NAV => ", `/(admin)/edit-event/${id}`);
                  router.push(`/(admin)/edit-event/${id}`);
                  setSelectedEvent(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#ffaa00",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  Edit
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleDelete(selectedEvent.id)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#ff4444",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Hapus
                </Text>
              </Pressable>
            </View>

            <Pressable
  onPress={() => router.push(`/(admin)/event-participants/${selectedEvent.id}`)}
  style={{
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
  }}
>
  <Text
    style={{
      color: "#fff",
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
    }}
  >
    Lihat Peserta
  </Text>
</Pressable>


            <Pressable
              onPress={() => setSelectedEvent(null)}
              style={{
                marginTop: 12,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: theme.border,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Tutup
              </Text>
            </Pressable>

            
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
<Modal
  visible={showLogoutModal}
  transparent
  animationType="fade"
>
  <View style={{
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  }}>
    <View style={{
      width: "100%",
      backgroundColor: theme.card,
      padding: 25,
      borderRadius: 16,
      alignItems: "center",
    }}>
      <MaterialIcons name="logout" size={40} color={theme.primary} />

      <Text style={{
        fontSize: 18,
        fontWeight: "700",
        marginTop: 15,
        color: theme.text,
      }}>
        Konfirmasi Logout
      </Text>

      <Text style={{
        fontSize: 14,
        marginTop: 10,
        textAlign: "center",
        color: theme.textSecondary,
      }}>
        Apakah kamu yakin ingin keluar dari akun?
      </Text>

      {/* Buttons */}
      <View style={{ flexDirection: "row", marginTop: 25, gap: 12 }}>
        
        {/* Cancel */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(false)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 10,
            backgroundColor: theme.border,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "600" }}>Batal</Text>
        </TouchableOpacity>

        {/* Confirm Logout */}
        <TouchableOpacity
          onPress={async () => {
            setShowLogoutModal(false);
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 10,
            backgroundColor: theme.primary,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Logout</Text>
        </TouchableOpacity>

      </View>
    </View>
  </View>
</Modal>


      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: theme.primary, shadowColor: theme.primary },
        ]}
        onPress={() => router.push("/(admin)/add-event")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Toast position="top" topOffset={50} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 65,
    height: 65,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});