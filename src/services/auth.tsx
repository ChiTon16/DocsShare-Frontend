// src/services/auth.ts
import Cookies from "js-cookie";
import { axiosInstance } from "@/utils/AxiosInterceptor";

/* ===================== Types ===================== */
export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  roleId: number;
  schoolId?: number;
  majorId?: number;
  avatarFile?: File | null;
};

/* ===================== Helpers ===================== */
export function getAccessToken() {
  return Cookies.get("accessToken") ?? "";
}
export function getRefreshToken() {
  return Cookies.get("refreshToken") ?? "";
}

/** Gỡ header Authorization mặc định ở axios */
function removeAxiosAuthHeader() {
  try {
    // một số bundler cần truy cập an toàn
    const common = (axiosInstance.defaults.headers as any)?.common;
    if (common && "Authorization" in common) {
      delete common.Authorization;
    }
  } catch (e) {
    console.error("Ignored error:", e);
  }
}

/** Xoá cookie theo nhiều biến thể path/domain để chắc chắn sạch */
function removeCookieAllVariants(name: string) {
  // mặc định
  Cookies.remove(name);
  // path "/"
  Cookies.remove(name, { path: "/" });

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (!host) return;

  // ví dụ: app.sub.example.com -> thử .app.sub.example.com, .sub.example.com, .example.com
  const parts = host.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const domainDot = "." + parts.slice(i).join(".");
    const domainRaw = parts.slice(i).join(".");

    Cookies.remove(name, { path: "/", domain: domainDot });
    Cookies.remove(name, { path: "/", domain: domainRaw });
  }
}

/** Xoá toàn bộ token phía client */
export function clearClientTokens() {
  removeCookieAllVariants("accessToken");
  removeCookieAllVariants("refreshToken");
  try {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
  } catch (e) {
    console.error("Ignored error:", e);
  }
}

/* ===================== Auth APIs ===================== */
export async function login(payload: LoginPayload) {
  const res = await axiosInstance.post("/auth/login", payload);
  const data = res.data;

  if (!data || data.ok !== true) {
    throw new Error(data?.message || "Sai email hoặc mật khẩu");
  }

  if (data.token) {
    Cookies.set("accessToken", data.token, {
      expires: 1,
      path: "/",
      sameSite: "Lax",
      secure: location.protocol === "https:",
    });
    // gắn header mặc định cho các request tiếp theo
    (axiosInstance.defaults.headers as any).common = {
      ...(axiosInstance.defaults.headers as any).common,
      Authorization: `Bearer ${data.token}`,
    };
  }

  if (data.refreshToken) {
    Cookies.set("refreshToken", data.refreshToken, {
      expires: 7,
      path: "/",
      sameSite: "Lax",
      secure: location.protocol === "https:",
    });
  }

  return data;
}

export async function register(payload: RegisterPayload) {
  const { avatarFile, ...rest } = payload;

  const form = new FormData();
  form.append("data", new Blob([JSON.stringify(rest)], { type: "application/json" }));
  if (avatarFile) form.append("avatar", avatarFile);

  // để browser tự set boundary
  const { data } = await axiosInstance.post("/auth/register", form, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

export async function registerMultipart(payload: RegisterPayload, avatarFile?: File) {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (avatarFile) fd.append("avatar", avatarFile);
  const { data } = await axiosInstance.post("/auth/register", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/* ===================== Logout ===================== */
/**
 * Logout “chắc cú”:
 * 1) Gỡ Authorization header mặc định (tránh request sau vẫn gửi Bearer cũ)
 * 2) Gọi /auth/logout (để server xoá HttpOnly cookie nếu có)
 * 3) Xoá toàn bộ cookie access/refresh phía client
 * 4) Phát tín hiệu cross-tab + điều hướng
 */
export async function logout(opts?: { redirectTo?: string }) {
  const redirectTo = opts?.redirectTo ?? "/auth";

  // 1) gỡ header Bearer mặc định
  removeAxiosAuthHeader();

  // 2) gọi API server để huỷ phiên / xoá HttpOnly cookie (nếu backend dùng)
  try {
    // nếu backend yêu cầu refreshToken trong body, có thể truyền kèm:
    const rt = getRefreshToken();
    if (rt) {
      await axiosInstance.post("/auth/logout", { refreshToken: rt });
    } else {
      await axiosInstance.post("/auth/logout");
    }
  } catch (e) {
    console.error("Ignored error:", e);
  }

  // 3) xoá token phía client
  clearClientTokens();

  // 4) đồng bộ các tab khác + điều hướng
  try {
    localStorage.setItem("auth:logout", String(Date.now()));
  } catch (e) {
    console.error("Ignored error:", e);
  }

  if (typeof window !== "undefined") {
    window.location.replace(redirectTo);
  }
}
