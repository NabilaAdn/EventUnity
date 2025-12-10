"use client";
import { useRouter } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // profile (NOT Supabase user)
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 📌 Restore session + load profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;

      if (session?.user?.id) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    // 📌 Listen perubahan user
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user?.id) {
          await loadProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📌 Load profile dari tabel profiles
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUser(data);

      // 🔥 Redirect langsung sesuai role (auto)
      if (data.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(user)");
      }
    }
  }

  // 📌 Login (DIPANGGIL dari login.jsx)
  const login = async (profile) => {
    setUser(profile);

    profile.role === "admin"
      ? router.replace("/(admin)")
      : router.replace("/(user)");
  };

  // 📌 Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
