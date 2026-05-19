import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { getBackendUrl } from "../constants/config";

setBaseUrl(getBackendUrl());


export interface User {
  _id: string;
  name: string;
  email: string;
  role: "rider" | "driver";
  phone: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem("@chbaye7_token"),
          AsyncStorage.getItem("@chbaye7_user"),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser) as User);
        }
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const signIn = async (newToken: string, newUser: User) => {
    await Promise.all([
      AsyncStorage.setItem("@chbaye7_token", newToken),
      AsyncStorage.setItem("@chbaye7_user", JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await Promise.all([
      AsyncStorage.removeItem("@chbaye7_token"),
      AsyncStorage.removeItem("@chbaye7_user"),
    ]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
