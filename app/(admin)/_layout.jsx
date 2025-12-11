import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function AdminLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerShown: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        }
      }}>

        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon:({color, size}) =>(
              <Ionicons name="home-outline" size={size} color={color}/>
            ),
          }}
        />    
        
        <Tabs.Screen
    name="add-event"
    options={{ href: null }}  // ❌ sembunyikan
  />

  <Tabs.Screen
    name="edit-event/[id]"
    options={{ href: null }}  // ❌ sembunyikan
  />

  <Tabs.Screen
    name="event-participants/[id]"
    options={{ href: null }}  // ❌ sembunyikan
  />

    </Tabs>
  );
}
