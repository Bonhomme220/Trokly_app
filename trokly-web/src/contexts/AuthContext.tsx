"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { User } from "@/lib/types";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/utils";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api
        .get("/auth/me")
        .then((res) => {
          setState({ user: res.data.user ?? res.data, token, loading: false });
        })
        .catch(() => {
          clearAuthToken();
          setState({ user: null, token: null, loading: false });
        });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  async function login(token: string) {
    setAuthToken(token);
    const res = await api.get("/auth/me");
    setState({ user: res.data.user ?? res.data, token, loading: false });
  }

  function logout() {
    api.post("/auth/logout").catch(() => {});
    clearAuthToken();
    setState({ user: null, token: null, loading: false });
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.user,
        hasRole: (role) => state.user?.roles?.includes(role) ?? false,
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
