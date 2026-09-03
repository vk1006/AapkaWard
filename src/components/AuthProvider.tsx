"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  locale: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();
    const next = data.user ?? (data.id ? data : null);
    const parsed: AuthUser | null =
      next && next.id
        ? {
            id: next.id,
            phone: next.phone,
            name: next.name ?? null,
            role: next.role,
            locale: next.locale,
          }
        : null;
    setUser(parsed);
    return parsed;
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, loading, setUser, refreshUser }),
    [user, loading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
