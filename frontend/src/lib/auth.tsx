import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

type User = {
  id: string;
  name: string;
  phone: string;
  role: "customer" | "vendor";
  business_name?: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  setUserAndToken: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch {
          await AsyncStorage.removeItem("token");
        }
      }
      setLoading(false);
    })();
  }, []);

  const setUserAndToken = async (token: string, u: User) => {
    await AsyncStorage.setItem("token", token);
    setUser(u);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, setUserAndToken, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
