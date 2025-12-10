import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import Toast from "react-native-toast-message";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../src/contexts/ThemeContext";

const HOLIDAYS = {
  "2025-01-01": "Tahun Baru Masehi",
  "2025-03-31": "Nyepi",
  "2025-04-18": "Wafat Isa Almasih",
  "2025-04-20": "Idul Fitri",
  "2025-04-21": "Cuti Bersama Idul Fitri",
  "2025-05-01": "Hari Buruh",
  "2025-05-29": "Kenaikan Isa Almasih",
  "2025-06-01": "Hari Lahir Pancasila",
  "2025-08-17": "Hari Kemerdekaan RI",
  "2025-11-01": "Libur Semester Ganjil",
  "2025-12-25": "Natal",
};

/* 🔥 FIX: SAFE PARSER — tidak pakai new Date() */
const extractDate = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val; // kalau sudah format YYYY-MM-DD
  
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
};

/* 🔥 FIX: Format tanggal tanpa Date() */
const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

// Helper format waktu hh:mm
const formatTime = (t) => (t ? t.substring(0, 5) : "-");

export default function UserCalendar() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [month, setMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper Style Kategori (Sama seperti Index)
  const getCategoryStyle = (category) => {
    const cat = category || "Tanpa Kategori";
    return theme.categories?.[cat] || theme.categories?.["Tanpa Kategori"] || {
      bg: theme.card,
      text: theme.text,
      border: theme.border
    };
  };

  const loadMyEvents = async (userId) => {
    if (!userId) {
      console.log("No user ID provided to loadMyEvents");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("event_registrations") // tabel pendaftaran event
        .select(`
          id,
          event:events (
          id,
          title,
          event_date,
          start_time,
          end_time,
          location,
          category,
          max_participants,
          description
        )
          
        `)
        .eq("user_id", userId);

      if (error) throw error;

      // Format ulang mengikuti struktur kode lama
      const formatted = data.map((r) => ({
        ...r.event,
        registration_id: r.id,
        start_date: r.event.event_date,
      }));

      setMyEvents(formatted);
    } catch (err) {
      console.error("Unexpected error loading events:", err);
      Toast.show({ 
        type: "error", 
        text1: "Terjadi kesalahan",
        text2: "Tidak dapat memuat event" 
      });
    }
  };

  // Load user and then load events
  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        try {
          setLoading(true);

          // Get user first
          const { data: { user: currentUser }, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error("Error getting user:", error);
            Toast.show({ 
              type: "error", 
              text1: "Gagal memuat data pengguna" 
            });
            setLoading(false);
            return;
          }

          if (!currentUser) {
            console.log("No user logged in");
            setLoading(false);
            return;
          }

          setUser(currentUser);
          
          // Load events after user is set
          await loadMyEvents(currentUser.id);
        } catch (err) {
          console.error("Unexpected error during initialization:", err);
          Toast.show({ 
            type: "error", 
            text1: "Terjadi kesalahan" 
          });
          setLoading(false);
        }
      };

      initialize();
    }, [])
  );

  /* ============================
      MARKED DATES
     ============================ */
  const marked = {};

  myEvents.forEach((ev) => {
    const date = ev.start_date;
    if (!date) return;

    if (!marked[date]) marked[date] = { dots: [] };
    // Cek duplikasi dot agar tidak menumpuk visualnya
    const hasDot = marked[date].dots.some(d => d.color === theme.primary);
    if (!hasDot) {
      marked[date].dots.push({ color: theme.primary });
    }

    if (date === selectedDate) {
      marked[date].selected = true;
      marked[date].selectedColor = theme.primary;
    }
  });

  Object.keys(HOLIDAYS).forEach((date) => {
    if (!marked[date]) marked[date] = { dots: [] };
    marked[date].dots.push({ color: theme.error });
  });

  /* ============================
      SUNDAY STYLING
     ============================ */
  const dateCursor = new Date(month.year, month.month - 1, 1);

  while (dateCursor.getMonth() === month.month - 1) {
    if (dateCursor.getDay() === 0) {
      const y = dateCursor.getFullYear();
      const m = String(dateCursor.getMonth() + 1).padStart(2, "0");
      const d = String(dateCursor.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;

      if (!marked[key]) marked[key] = {};
      marked[key].customStyles = {
        text: { color: theme.error, fontWeight: "bold" },
      };
    }
    dateCursor.setDate(dateCursor.getDate() + 1);
  }

  const eventsOfDay = selectedDate
    ? myEvents.filter((e) => e.start_date === selectedDate)
    : [];

  const selectedHoliday = selectedDate ? HOLIDAYS[selectedDate] : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style ={{
        flexDirection: "row",
        justifyContent:"space-between",
        alignItems: "center",
        marginBottom: 25,
        marginTop: 40
      }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 10,
            color: theme.text,
          }}
        >
          🗓️ Kalender Event
        </Text>

        <TouchableOpacity 
          onPress={toggleTheme}
          style={{
            padding: 10,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            elevation: 2,
          }}
        >
          <MaterialIcons
            name={isDark ? "light-mode" : "dark-mode"}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      {/* CALENDAR */}
      <Calendar
        markedDates={marked}
        markingType="multi-dot"
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={(m) => setMonth({ year: m.year, month: m.month })}
        theme={{
          calendarBackground: theme.card,
          textSectionTitleColor: theme.textSecondary,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: "#FFFFFF",
          todayTextColor: theme.primary,
          dayTextColor: theme.text,
          textDisabledColor: theme.textTertiary,
          arrowColor: theme.primary,
          monthTextColor: theme.text,
          textDayFontWeight: "400",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "600",
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
        }}
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.border,
          elevation: 3,
          marginBottom: 20,
        }}
      />

      {/* HOLIDAY INFO */}
      {selectedHoliday && (
        <View
          style={{
            backgroundColor: theme.errorLight,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.error,
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              color: theme.error,
              fontWeight: "bold",
              fontSize: 15,
            }}
          >
            📍 Libur Nasional: {selectedHoliday}
          </Text>
        </View>
      )}

      {/* EVENT LIST HEADER */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 10,
          color: theme.text,
        }}
      >
        {selectedDate
          ? `Event pada ${formatDate(selectedDate)}`
          : "Pilih tanggal"}
      </Text>

      {/* EVENT LIST ITEMS */}
      {eventsOfDay.length > 0 ? (
        eventsOfDay.map((ev) => (
          <TouchableOpacity
            key={ev.id}
            onPress={() => {
              setSelectedEvent(ev);
              setModalVisible(true);
            }}
            style={{
              backgroundColor: theme.card,
              padding: 15,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: 10,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 6,
              }}
            >
              {ev.title}
            </Text>

            <View
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.textSecondary}
              />
              <Text style={{ marginLeft: 6, color: theme.textSecondary }}>
                {/* Format waktu hh:mm */}
                {formatTime(ev.start_time)} - {formatTime(ev.end_time)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="location-outline"
                size={14}
                color={theme.textSecondary}
              />
              <Text style={{ marginLeft: 6, color: theme.textSecondary }}>
                {ev.location}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Ionicons
            name="calendar-outline"
            size={60}
            color={theme.textTertiary}
          />
          <Text
            style={{
              textAlign: "center",
              color: theme.textSecondary,
              marginTop: 16,
              fontSize: 15,
            }}
          >
            Tidak ada event di tanggal ini.
          </Text>
        </View>
      )}

      {/* MODAL DETAIL (Full Info Style) */}
      <Modal visible={modalVisible} transparent animationType="fade">
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
            {/* Header: Title & Close Button */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text }}>
                  {selectedEvent?.title}
                </Text>
              </View>
              
              {/* Tombol X di kanan atas */}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: theme.border,
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <>
                {/* Category Pill */}
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
                    fontSize: 12,
                    borderWidth: 1,
                    borderColor: getCategoryStyle(selectedEvent.category).border,
                  }}
                >
                  {selectedEvent.category || "Tanpa Kategori"}
                </Text>

                <View style={{ backgroundColor: theme.borderLight, height: 1, marginBottom: 16 }} />

                {/* Details Section */}
                <View style={{ gap: 12, marginBottom: 16 }}>
                  {/* Tanggal */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ backgroundColor: theme.primaryLight, padding: 8, borderRadius: 10, marginRight: 12 }}>
                      <MaterialIcons name="event" size={20} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 15 }}>
                      {formatDate(selectedEvent?.event_date)}
                    </Text>
                  </View>

                  {/* Waktu */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ backgroundColor: theme.primaryLight, padding: 8, borderRadius: 10, marginRight: 12 }}>
                      <MaterialIcons name="access-time" size={20} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 15 }}>
                      {formatTime(selectedEvent?.start_time)} - {formatTime(selectedEvent?.end_time)}
                    </Text>
                  </View>

                  {/* Lokasi */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ backgroundColor: theme.primaryLight, padding: 8, borderRadius: 10, marginRight: 12 }}>
                      <MaterialIcons name="place" size={20} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>
                      {selectedEvent?.location}
                    </Text>
                  </View>

                  {/* Harga (Jika ada) */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ backgroundColor: theme.primaryLight, padding: 8, borderRadius: 10, marginRight: 12 }}>
                      <MaterialIcons name="people" size={20} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>
                      Kuota: {selectedEvent?.max_participants} Peserta
                    </Text>
                  </View>
                </View>

                <View style={{ backgroundColor: theme.borderLight, height: 1, marginBottom: 16 }} />

                <Text style={{ color: theme.textSecondary, lineHeight: 22, marginBottom: 20 }}>
                  {selectedEvent.description || "Tidak ada deskripsi."}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}