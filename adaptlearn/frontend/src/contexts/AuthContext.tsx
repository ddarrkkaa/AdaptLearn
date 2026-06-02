import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: "student" | "teacher" | "admin";
  subject: string | null;
  class_id: number | null;
  student_id: number | null;
  approved: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    client
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem("token"); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await client.post("/api/auth/login", { username, password });
    localStorage.setItem("token", data.access_token);
    setUser({
      id: data.user_id,
      username,
      full_name: data.full_name,
      role: data.role,
      subject: data.subject ?? null,
      class_id: data.class_id ?? null,
      student_id: data.student_id ?? null,
      approved: data.approved ?? false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
