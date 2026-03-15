"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type components } from "@/app/types/api";

type User = components["schemas"]["UserResponse"];

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = await response.json().catch(() => ({
    detail: "Request failed",
  }));

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "Request failed");
  }

  return payload as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await fetchJson<User>("/api/auth/me");
      setUser(userData);
      setError(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await refreshUser();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        await fetchJson<{ access_token: string }>("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        await refreshUser();
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Login failed"
        );
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [refreshUser]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      setLoading(true);
      setError(null);

      try {
        await fetchJson<{ access_token: string }>("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: name || email.split("@")[0],
          }),
        });

        await refreshUser();
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Registration failed"
        );
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
