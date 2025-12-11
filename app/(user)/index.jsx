import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function UserHome() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [userRegisteredEvents, setUserRegisteredEvents] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [selectedFilters, setSelectedFilters] = useState({
    category: "All",
    time: null,
    status: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const scaleAnim = new Animated.Value(1);
  const isFocused = useIsFocused();

  const getCategoryStyle = (category) => {
    const cat = category || "Tanpa Kategori";
    return theme.categories[cat] || theme.categories["Tanpa Kategori"];
  };

  const loadUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) console.log(error);
  else setUser(user);
};

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
          *,
          event_registrations (id)
        `)
      .order("event_date", { ascending: false });

    // Ensure event_registrations is always an array
      const formattedData = (data || []).map(event => ({
        ...event,
        event_registrations: event.event_registrations || []
      }));
      if (error) console.log(error);
    else {
      setEvents(data);
      setFilteredEvents(data);
    }
    setLoading(false);
  };

  const loadUserRegistrations = async () => {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id);

    if (error) console.log(error);
    else {
      const ids = data.map(r => r.event_id);
      setUserRegisteredEvents(ids);
    }
  };


  useEffect(() => {
  loadUser();
}, []);

useEffect(() => {
  if (isFocused && user?.id) {
    loadEvents();
    loadUserRegistrations();
  }
}, [isFocused, user]);

  const formatTime = (t) => (t ? t.substring(0, 5) : "-");
  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // Gabungkan semua filter jadi satu
  const filterCategories = {
    "Kategori": ["All", ...new Set(events.map((e) => e.category || "Tanpa Kategori"))],
    "Waktu": ["Hari Ini", "Besok", "Minggu Ini", "Bulan Ini"],
    "Status": ["Terdaftar", "Belum Terdaftar"],
  };

  useEffect(() => {
    let list = events;
    const now = new Date();

    // Filter berdasarkan kategori
    if (selectedFilters.category !== "All") {
      list = list.filter(
        (e) => (e.category || "Tanpa Kategori") === selectedFilters.category
      );
    }

    // Filter berdasarkan waktu
    if (selectedFilters.time === "Hari Ini") {
      list = list.filter(
        (e) => new Date(e.event_date).toDateString() === now.toDateString()
      );
    }

    if (selectedFilters.time === "Besok") {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      list = list.filter(
        (e) => new Date(e.event_date).toDateString() === tmr.toDateString()
      );
    }

    if (selectedFilters.time === "Minggu Ini") {
      const start = new Date(now);
      const end = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      end.setDate(start.getDate() + 6);
      list = list.filter((e) => {
        const d = new Date(e.event_date);
        return d >= start && d <= end;
      });
    }

    if (selectedFilters.time === "Bulan Ini") {
      const m = now.getMonth();
      const y = now.getFullYear();
      list = list.filter((e) => {
        const d = new Date(e.event_date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
    }

    // Filter berdasarkan status registrasi
    if (selectedFilters.status === "Terdaftar") {
      list = list.filter((e) => userRegisteredEvents.includes(e.id));
    }

    if (selectedFilters.status === "Belum Terdaftar") {
      list = list.filter((e) => !userRegisteredEvents.includes(e.id));
    }

    // Filter search
    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(lower) ||
          (e.category || "Tanpa Kategori").toLowerCase().includes(lower) ||
          e.location.toLowerCase().includes(lower)
      );
    }

    setFilteredEvents(list);
  }, [selectedFilters, events, searchQuery, userRegisteredEvents]);

  const handleRegister = async () => {
  if (!selectedEvent || !user?.id) return;

  // Cek apakah user sudah terdaftar
  if (userRegisteredEvents.includes(selectedEvent.id)) {
    Toast.show({
      type: "info",
      text1: "Kamu sudah terdaftar di event ini",
    });
    return;
  }

  setRegistering(true);

  // Ambil data event + jumlah peserta
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("max_participants, event_registrations ( id )")
    .eq("id", selectedEvent.id)
    .single();

  if (eventError) {
    console.log(eventError);
    Toast.show({ type: "error", text1: "Gagal memuat data event" });
    setRegistering(false);
    return;
  }

  const count = event.event_registrations?.length || 0;

  if (count >= event.max_participants) {
    Toast.show({
      type: "error",
      text1: "Kuota penuh! Tidak bisa daftar lagi.",
    });
    setRegistering(false);
    return;
  }

  // Insert registrasi
  const { error } = await supabase
    .from("event_registrations")
    .insert({
      user_id: user.id,
      event_id: selectedEvent.id,
    });

  if (error) {
    Toast.show({ type: "error", text1: "Gagal daftar event" });
  } else {
    Toast.show({ type: "success", text1: "Berhasil daftar!" });
    setUserRegisteredEvents((prev) => [...prev, selectedEvent.id]);
  }

  setRegistering(false);
};



  const handleCardPress = (item) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setSelectedEvent(item);
  };

  // Fungsi untuk mendapatkan style filter
  const getFilterStyle = (filter, filterType) => {
    let isSelected = false;
    
    if (filterType === "Kategori") {
      isSelected = selectedFilters.category === filter;
    } else if (filterType === "Waktu") {
      isSelected = selectedFilters.time === filter;
    } else if (filterType === "Status") {
      isSelected = selectedFilters.status === filter;
    }

    // Style untuk "All"
    if (filter === "All") {
      return {
        bg: isSelected ? theme.primary : theme.card,
        text: isSelected ? "#FFFFFF" : theme.text,
        border: isSelected ? theme.primary : theme.border,
      };
    }

    // Style untuk waktu (Hari Ini, Besok, dll)
    if (["Hari Ini", "Besok", "Minggu Ini", "Bulan Ini"].includes(filter)) {
      return {
        bg: isSelected ? theme.success : theme.card,
        text: isSelected ? "#FFFFFF" : theme.text,
        border: isSelected ? theme.success : theme.border,
      };
    }

    // Style untuk status registrasi
    if (filter === "Terdaftar") {
      return {
        bg: isSelected ? theme.success : theme.card,
        text: isSelected ? "#FFFFFF" : theme.text,
        border: isSelected ? theme.success : theme.border,
      };
    }

    if (filter === "Belum Terdaftar") {
      return {
        bg: isSelected ? "#ff6b6b" : theme.card,
        text: isSelected ? "#FFFFFF" : theme.text,
        border: isSelected ? "#ff6b6b" : theme.border,
      };
    }

    // Style untuk kategori
    const catStyle = getCategoryStyle(filter);
    return {
      bg: isSelected ? catStyle.bg : theme.card,
      text: isSelected ? catStyle.text : theme.text,
      border: isSelected ? catStyle.border : theme.border,
    };
  };

  // Fungsi untuk handle filter selection
  const handleFilterSelect = (filter, filterType) => {
    if (filterType === "Kategori") {
      setSelectedFilters(prev => ({ ...prev, category: filter }));
    } else if (filterType === "Waktu") {
      setSelectedFilters(prev => ({ 
        ...prev, 
        time: prev.time === filter ? null : filter 
      }));
    } else if (filterType === "Status") {
      setSelectedFilters(prev => ({ 
        ...prev, 
        status: prev.status === filter ? null : filter 
      }));
    }
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedFilters.category !== "All") count++;
    if (selectedFilters.time) count++;
    if (selectedFilters.status) count++;
    return count;
  };

  // Get active filters display text
  const getActiveFiltersText = () => {
    const active = [];
    if (selectedFilters.category !== "All") active.push(selectedFilters.category);
    if (selectedFilters.time) active.push(selectedFilters.time);
    if (selectedFilters.status) active.push(selectedFilters.status);
    
    if (active.length === 0) return "Semua Event";
    return active.join(" • ");
  };

  const getRegistrationCount = (event) => {
    return Array.isArray(event?.event_registrations) 
      ? event.event_registrations.length 
      : 0;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
     
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20,
          paddingTop: 50, paddingBottom: 30, backgroundColor: theme.primary, borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3, shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#FFFFFF" }}>
            EVENITY
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
            Welcome back👋
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

        {/* FILTER COMPACT */}
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              backgroundColor: theme.card,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: getActiveFiltersCount() > 0 ? theme.primary : theme.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  backgroundColor: theme.primaryLight,
                  padding: 8,
                  borderRadius: 10,
                  marginRight: 12,
                }}
              >
                <MaterialIcons 
                  name="filter-list" 
                  size={22} 
                  color={theme.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    Filter Aktif
                  </Text>
                  {getActiveFiltersCount() > 0 && (
                    <View
                      style={{
                        backgroundColor: theme.primary,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: "#FFFFFF", fontWeight: "700" }}>
                        {getActiveFiltersCount()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text 
                  style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getActiveFiltersText()}
                </Text>
              </View>
            </View>
            
            <MaterialIcons 
              name={showFilterMenu ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color={theme.text}
            />
          </TouchableOpacity>

          {/* FILTER MENU DROPDOWN */}
          {showFilterMenu && (
            <View
              style={{
                backgroundColor: theme.card,
                marginTop: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 12,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {Object.entries(filterCategories).map(([category, filters], index) => (
                <View key={category} style={{ marginBottom: index < 2 ? 16 : 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ 
                      fontSize: 13, 
                      fontWeight: "700", 
                      color: theme.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}>
                      {category}
                    </Text>
                    
                    {/* Clear button untuk Waktu dan Status */}
                    {category === "Waktu" && selectedFilters.time && (
                      <TouchableOpacity
                        onPress={() => setSelectedFilters(prev => ({ ...prev, time: null }))}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: theme.border,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: "600" }}>
                          Reset
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {category === "Status" && selectedFilters.status && (
                      <TouchableOpacity
                        onPress={() => setSelectedFilters(prev => ({ ...prev, status: null }))}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: theme.border,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: "600" }}>
                          Reset
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {filters.map((filter) => {
                      const style = getFilterStyle(filter, category);
                      let isSelected = false;
                      
                      if (category === "Kategori") {
                        isSelected = selectedFilters.category === filter;
                      } else if (category === "Waktu") {
                        isSelected = selectedFilters.time === filter;
                      } else if (category === "Status") {
                        isSelected = selectedFilters.status === filter;
                      }
                      
                      return (
                        <TouchableOpacity
                          key={filter}
                          onPress={() => handleFilterSelect(filter, category)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            backgroundColor: style.bg,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: style.border,
                          }}
                        >
                          <Text
                            style={{
                              color: style.text,
                              fontWeight: isSelected ? "700" : "600",
                              fontSize: 13,
                            }}
                          >
                            {filter}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Reset All Button */}
              {getActiveFiltersCount() > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedFilters({ category: "All", time: null, status: null });
                    setShowFilterMenu(false);
                  }}
                  style={{
                    marginTop: 16,
                    paddingVertical: 12,
                    backgroundColor: theme.primary,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <MaterialIcons name="clear-all" size={20} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                    Reset Semua Filter
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* EVENT LIST */}
        <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 15 }}>
          <MaterialIcons name="confirmation-number" size={18} /> Event Tersedia ({filteredEvents.length})
        </Text>

        {filteredEvents.map((item) => {
          const catStyle = getCategoryStyle(item.category);
          
          return (
            <Animated.View key={item.id} style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                onPress={() => handleCardPress(item)}
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

                  {userRegisteredEvents.includes(item.id) && (
                    <View
                      style={{
                        backgroundColor: theme.successLight,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MaterialIcons name="check-circle" size={14} color={theme.success} />
                      <Text style={{ color: theme.success, fontWeight: "600", fontSize: 11 }}>
                        Terdaftar
                      </Text>
                    </View>
                  )}
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

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="person" size={16} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 6, color: theme.textSecondary, fontSize: 14 }}>
                    {getRegistrationCount(item)} / {item.max_participants} peserta
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>

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
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>
                  {getRegistrationCount(selectedEvent)} / {selectedEvent?.max_participants} peserta
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: theme.borderLight, height: 1, marginBottom: 16 }} />

            <Text style={{ color: theme.textSecondary, lineHeight: 22, marginBottom: 20 }}>
              {selectedEvent?.description}
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                disabled={registering || userRegisteredEvents.includes(selectedEvent?.id)}
                onPress={handleRegister}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: userRegisteredEvents.includes(selectedEvent?.id)
                    ? theme.textTertiary
                    : theme.success,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {userRegisteredEvents.includes(selectedEvent?.id)
                    ? "✓ Terdaftar"
                    : registering
                    ? "Loading..."
                    : "Daftar"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedEvent(null)}
                style={{
                  flex: 1,
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


      <Toast />
    </View>
  );
}