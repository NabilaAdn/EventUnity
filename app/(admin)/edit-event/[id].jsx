import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { formatDateForAPI, formatTime } from "../../../src/utils/helpers";

const CATEGORIES = ["Lomba", "Webinar", "Seminar", "Workshop", "Sidang Terbuka", "Seminar Proposal", "Seminar Kerja Praktik"];
const LOCATION = ["Ruang C Jurusan Informatika", "Ruang D Jurusan Informatika", "Ruang Sidang Jurusan Informatika", "Aula Fakultas Teknik", 
  "Auditorium Universitas Tanjungpura", "Gedung Konferensi Ruang Teater 1", "Gedung Konferensi Ruang Teater 2", "Gedung Konferensi Ruang Teater 3", "Gedung Konferensi Ruang E-Learning 5"];


export default function EditEvent() {
  const { id } = useLocalSearchParams(); // <-- ambil id event dari URL
  const router = useRouter();
  const { theme } = useTheme();

  // FORM STATES
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [eventDate, setEventDate] = useState(new Date(""));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [loading, setLoading] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);


  // -------------------------------------------------------------
  // 🔹 FETCH EVENT BASED ON ID
  // -------------------------------------------------------------
  const fetchEvent = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      Alert.alert("Error", "Gagal mengambil data event.");
      console.log(error);
      return;
    }

    // isi form berdasarkan data dari Supabase
    setTitle(data.title || "");
    setCategory(data.category || "");
    setEventDate(data.event_date ? new Date(data.event_date) : new Date());
    setStartTime(data.start_time || "");
    setEndTime(data.end_time || "");
    setLocation(data.location || "");
    setDescription(data.description || "");
    setMaxParticipants(String(data.max_participants || ""));

    setLoading(false);
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  // -------------------------------------------------------------
  // 🔹 UPDATE EVENT
  // -------------------------------------------------------------
  const handleSave = async () => {
    if (!title || !category || !eventDate || !startTime || !endTime || !location || !maxParticipants || !description) {
      Alert.alert("Peringatan", "Harap isi semua field wajib.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("events")
      .update({
        title,
        category,
        event_date: formatDateForAPI(eventDate),
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        location,
        description,
        max_participants: maxParticipants,
        updated_at: new Date(),
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.log(error);
      Alert.alert("Error", "Gagal memperbarui event.");
      return;
    }

    Alert.alert("Berhasil", "Event berhasil diperbarui!", [
      { text: "OK", onPress: () => router.replace("/(admin)") },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#FFFFFF" }}>
            Edit Event
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
            Perbarui detail event
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 10,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 12,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

          <View
        style={{
          backgroundColor: theme.card,
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* JUDUL EVENT */}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="font" theme={theme} label="Judul Event" />
          <StyledInput
            placeholder="Masukkan judul event"
            value={title}
            onChangeText={setTitle}
            theme={theme}
          />
        </View>

        {/*KATEGORI*/}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="puzzle-piece" theme={theme} label="Kategori Event" />

          {/* MOBILE DROPDOWN */}
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderColor: category ? theme.primary : theme.border,
              padding: 14,
              borderRadius: 12,
              backgroundColor: theme.background,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={() => setCategoryOpen(!categoryOpen)}
          >
            <Text style={{ color: theme.text, fontSize: 15 }}>
              {category || "Pilih kategori"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          {categoryOpen && (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                overflow: "hidden",
                marginTop: 8,
                backgroundColor: theme.card,
              }}
            >
              {CATEGORIES.map((cat, idx) => (
                <TouchableOpacity
                  key={cat}
                  style={{
                    padding: 14,
                    backgroundColor: theme.background,
                    borderBottomWidth: idx < CATEGORIES.length - 1 ? 1 : 0,
                    borderColor: theme.border,
                  }}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryOpen(false);
                  }}
                >
                  <Text style={{ color: theme.text }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* TANGGAL EVENT */}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="calendar" theme={theme} label="Tanggal Event" />
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderColor: eventDate ? theme.primary : theme.border,
              padding: 14,
              borderRadius: 12,
              backgroundColor: theme.background,
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.text, fontSize: 15 }}>
              {eventDate.toLocaleDateString("id-ID")}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              onChange={(e, selected) => {
                setShowDatePicker(false);
                if (selected) setEventDate(selected);
              }}
            />
          )}
        </View>

        {/* WAKTU EVENT */}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="clock-o" theme={theme} label="Waktu Event" />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    {/* START TIME */}
    <TouchableOpacity
      style={{
        flex: 1,
        borderWidth: 2,
        borderColor: startTime ? theme.primary : theme.border,
        padding: 14,
        borderRadius: 12,
        backgroundColor: theme.background,
      }}
      onPress={() => setShowStartPicker(true)}
    >
      <Text style={{ color: theme.text }}>
        {formatTime(startTime)}
      </Text>
    </TouchableOpacity>

    {/* STRIP "-" */}
    <Text
      style={{
        marginHorizontal: 10,
        marginVertical: 10,
        fontSize: 18,
        color: theme.text,
      }}
    >
      —
    </Text>

    {/* END TIME */}
    <TouchableOpacity
      style={{
        flex: 1,
        borderWidth: 2,
        borderColor: endTime ? theme.primary : theme.border,
        padding: 14,
        borderRadius: 12,
        backgroundColor: theme.background,
      }}
      onPress={() => setShowEndPicker(true)}
    >
      <Text style={{ color: theme.text }}>
        {formatTime(endTime)}
      </Text>
    </TouchableOpacity>
  </View>

  {/* START TIME PICKER */}
  {showStartPicker && (
    <DateTimePicker
      mode="time"
      value={new Date()}
      is24Hour={true}
      onChange={(event, selected) => {
        setShowStartPicker(false);
        if (selected) {
          const formatted = selected.toTimeString().slice(0, 5);
          setStartTime(formatted);
        }
      }}
    />
  )}

  {/* END TIME PICKER */}
  {showEndPicker && (
    <DateTimePicker
      mode="time"
      value={new Date()}
      is24Hour={true}
      onChange={(event, selected) => {
        setShowEndPicker(false);
        if (selected) {
          const formatted = selected.toTimeString().slice(0, 5);
          setEndTime(formatted);
        }
      }}
    />
  )}
        </View>

        {/*LOKASI*/}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="map" theme={theme} label="Lokasi Event" />

          {/* MOBILE DROPDOWN */}
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderColor: location ? theme.primary : theme.border,
              padding: 14,
              borderRadius: 12,
              backgroundColor: theme.background,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={() => setLocationOpen(!locationOpen)}
          >
            <Text style={{ color: theme.text, fontSize: 15 }}>
              {location || "Pilih kategori"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          {locationOpen && (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                overflow: "hidden",
                marginTop: 8,
                backgroundColor: theme.card,
              }}
            >
              {LOCATION.map((cat, idx) => (
                <TouchableOpacity
                  key={cat}
                  style={{
                    padding: 14,
                    backgroundColor: theme.background,
                    borderBottomWidth: idx < CATEGORIES.length - 1 ? 1 : 0,
                    borderColor: theme.border,
                  }}
                  onPress={() => {
                    setLocation(cat);
                    setLocationOpen(false);
                  }}
                >
                  <Text style={{ color: theme.text }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* DESKRIPSI */}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="leanpub" theme={theme} label="Deskripsi Event" />
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: description? theme.primary : theme.border,
              padding: 14,
              borderRadius: 12,
              backgroundColor: theme.background,
              color: theme.text,
              fontSize: 15,
              height: 120,
              textAlignVertical: "top",
            }}
            multiline
            placeholder="Masukkan deskripsi event"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* MAKS PESERTA */}
        <View style={{ marginBottom: 20 }}>
          <InputLabel icon="users" theme={theme} label="Maksimal Peserta" />
          <StyledInput
            placeholder="0"
            value={maxParticipants}
            keyboardType="numeric"
            onChangeText={setMaxParticipants}
            theme={theme}
          />
        </View>

        {/* BUTTONS */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.success,
                padding: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: theme.success,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleSave}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text
                style={{
                  textAlign: "center",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Simpan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.border,
                padding: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.back()}
            >
              <MaterialIcons name="close" size={20} color={theme.text} />
              <Text
                style={{
                  textAlign: "center",
                  color: theme.text,
                  fontWeight: "700",
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                Batal
              </Text>
            </TouchableOpacity>
          </View>
      </View>
      </ScrollView>    
      {/* <Toast position="top" topOffset={50} />   */}
    </View>
  );
}

// -------------------------------------------------------------
// 🔸 COMPONENT REUSABLE
// -------------------------------------------------------------
function InputLabel({ icon, label, theme }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View
        style={{
          backgroundColor: theme.primaryLight,
          padding: 6,
          borderRadius: 8,
          marginRight: 8,
        }}
      >
        <FontAwesome name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={{ fontWeight: "600", fontSize: 15, color: theme.text }}>
        {label}
      </Text>
    </View>
  );
}

function StyledInput(props) {
  const { theme } = useTheme();
  return (
    <TextInput
      {...props}
      style={{
        borderWidth: 2,
        borderColor: props.value ? theme.primary : theme.border,
        padding: 14,
        borderRadius: 12,
        backgroundColor: theme.background,
        color: theme.text,
        fontSize: 15,
      }}
      placeholderTextColor={theme.textSecondary}
    />
  );
}

function StyledTimeInput(props) {
  const { theme } = useTheme();
  return (
    <TextInput
      {...props}
      placeholder="HH:MM"
      style={{
        flex: 1,
        borderWidth: 2,
        borderColor: props.value ? theme.primary : theme.border,
        padding: 14,
        borderRadius: 12,
        backgroundColor: theme.background,
        color: theme.text,
        fontSize: 15,
      }}
      placeholderTextColor={theme.textSecondary}
    />
  );
}
