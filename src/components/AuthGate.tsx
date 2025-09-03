// src/components/AuthGate.tsx
import { useEffect, useState } from "react";
import { axiosInstance } from "@/utils/AxiosInterceptor";
import { useAuth } from "@/context/AuthContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [ready, setReady] = useState(Boolean(user));

  useEffect(() => {
    if (user) { setReady(true); return; }
    (async () => {
      try {
        const { data } = await axiosInstance.get("/auth/me");
        setUser?.(data);
      } finally {
        setReady(true);
      }
    })();
  }, [user, setUser]);

  if (!ready) return null; // hoặc spinner
  return <>{children}</>;
}
