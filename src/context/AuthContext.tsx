// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { axiosInstance } from "@/utils/AxiosInterceptor";
import { login as apiLogin, logout as apiLogout, type Me } from "@/services/auth";

type Ctx = {
  user: Me | null;
  authReady: boolean;        // ✅ đã check xong chưa
  fetchingUser: boolean;     // ✅ đang gọi /auth/me
  setUser?: (u: Me | null) => void;
  signIn: (p: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({
  user: null, authReady: false, fetchingUser: false,
  signIn: async () => {}, signOut: async () => {}
});
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);

  async function fetchMe() {
    setFetchingUser(true);
    try {
      const { data } = await axiosInstance.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setFetchingUser(false);
      setAuthReady(true);
    }
  }

  // Boot lần đầu: nếu có accessToken thì lấy /me, ngược lại đánh dấu đã sẵn sàng
  useEffect(() => {
    if (Cookies.get("accessToken")) fetchMe();
    else setAuthReady(true);
  }, []);

  // Đăng nhập: gọi login -> /me -> đánh dấu ready
  const signIn = async (payload: { email: string; password: string }) => {
    setAuthReady(false);
    await apiLogin(payload);
    await fetchMe(); // sau khi có token mới
  };

  // Đăng xuất
  const signOut = async () => {
    setAuthReady(false);
    setUser(null);
    await apiLogout({ redirectTo: "/login" });
  };

  return (
    <AuthCtx.Provider value={{ user, authReady, fetchingUser, setUser, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}
