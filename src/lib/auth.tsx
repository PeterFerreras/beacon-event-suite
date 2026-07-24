import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, type AuthUser, type UserRole } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (module: AppModule) => boolean;
};

export type AppModule = "dashboard" | "visitantes" | "registro" | "eventos" | "invitados" | "etiquetas" | "reportes" | "configuracion" | "usuarios" | "asistencia";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = window.localStorage.getItem("cf-auth-token");
  const rawUser = window.localStorage.getItem("cf-auth-user");
  if (!token || !rawUser) {
    window.localStorage.removeItem("cf-auth-token");
    window.localStorage.removeItem("cf-auth-user");
    return { token: null, user: null };
  }
  try {
    return { token, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    window.localStorage.removeItem("cf-auth-token");
    window.localStorage.removeItem("cf-auth-user");
    return { token: null, user: null };
  }
}

const accessByRole: Record<UserRole, AppModule[]> = {
  Administrador: ["dashboard", "visitantes", "registro", "eventos", "invitados", "etiquetas", "reportes", "configuracion", "usuarios", "asistencia"],
  "Gestor de eventos": ["dashboard", "eventos", "invitados", "etiquetas"],
  "Gestor de visitantes": ["dashboard", "visitantes", "registro", "etiquetas"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedSession] = useState(readStoredSession);
  const [token, setToken] = useState<string | null>(storedSession.token);
  const [user, setUser] = useState<AuthUser | null>(storedSession.user);
  const [loading, setLoading] = useState(!!storedSession.token);

  useEffect(() => {
    // Validate only the session that existed when the app opened. A successful
    // login already returns the current user and must not start a second request.
    if (!storedSession.token) {
      setLoading(false);
      return;
    }
    apiClient.me()
      .then((next) => {
        setUser(next);
        window.localStorage.setItem("cf-auth-user", JSON.stringify(next));
      })
      .catch(() => {
        window.localStorage.removeItem("cf-auth-token");
        window.localStorage.removeItem("cf-auth-user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [storedSession.token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    login: async (correo, password) => {
      const data = await apiClient.login({ correo, password });
      window.localStorage.setItem("cf-auth-token", data.token);
      window.localStorage.setItem("cf-auth-user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    },
    logout: async () => {
      try { await apiClient.logout(); } catch { /* La salida local sigue siendo válida. */ }
      window.localStorage.removeItem("cf-auth-token");
      window.localStorage.removeItem("cf-auth-user");
      setToken(null);
      setUser(null);
    },
    canAccess: (module) => !!user && (accessByRole[user.rol] ?? []).includes(module),
  }), [loading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function firstAllowedPath(user: AuthUser | null) {
  if (!user) return "/login";
  if (user.rol === "Gestor de visitantes") return "/dashboard";
  return "/dashboard";
}

export function moduleForPath(pathname: string): AppModule | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/visitantes")) return "visitantes";
  if (pathname.startsWith("/registro")) return "registro";
  if (pathname.startsWith("/eventos")) return "eventos";
  if (pathname.startsWith("/invitados")) return "invitados";
  if (pathname.startsWith("/etiquetas")) return "etiquetas";
  if (pathname.startsWith("/reportes")) return "reportes";
  if (pathname.startsWith("/configuracion")) return "configuracion";
  if (pathname.startsWith("/usuarios")) return "usuarios";
  if (pathname.startsWith("/asistencia")) return "asistencia";
  return null;
}
