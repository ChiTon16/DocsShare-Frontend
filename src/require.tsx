// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth() {
  const { authReady } = useAuth();
  if (!authReady) return null; // hoặc spinner
  const hasToken = Boolean(Cookies.get("accessToken"));
  return hasToken ? <Outlet /> : <Navigate to="/auth" replace />;
}
