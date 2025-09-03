// src/utils/AxiosInterceptor.ts
import axios from "axios";
import Cookies from "js-cookie";

export const baseUrl = import.meta.env.VITE_APP_API_URL as string;

export const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

/** ---- Phần mới: trạng thái logout + callback khi auth lỗi ---- */
let isRefreshing = false;
let waitQueue: Array<(t: string) => void> = [];

// Khi user ấn Logout, đặt cờ này = true để KHÔNG tự refresh nữa
let logoutInProgress = false;

// App có thể set callback để điều hướng về /login
let onAuthError: (() => void) | null = null;
export function setOnAuthError(cb: () => void) {
  onAuthError = cb;
}

/** Gọi hàm này TRƯỚC khi xoá cookie ở auth.ts */
export function markManualLogout() {
  logoutInProgress = true;

  // Xoá header mặc định của axios
  delete (axiosInstance.defaults.headers as any)?.common?.Authorization;

  // Huỷ mọi request đang chờ token refresh (nếu có)
  waitQueue = [];
}

/** Tiện: xoá access/refresh ở client */
export function clearClientTokens() {
  Cookies.remove("accessToken", { path: "/" });
  Cookies.remove("refreshToken", { path: "/" });
}

/** ---- Request interceptor ---- */
axiosInstance.interceptors.request.use((config) => {
  const url = (config.url ?? "") as string;

  // FormData -> để browser tự set boundary
  if (config.data instanceof FormData) {
    if (config.headers) delete (config.headers as any)["Content-Type"];
  } else {
    config.headers = config.headers || {};
    (config.headers as any)["Content-Type"] = "application/json";
  }

  // Bỏ Authorization cho 3 endpoint auth
  const noAuth =
    url.startsWith("/auth/login") ||
    url.startsWith("/auth/register") ||
    url.startsWith("/auth/refresh-token");

  if (noAuth) {
    if (config.headers) delete (config.headers as any).Authorization;
  } else {
    const token = Cookies.get("accessToken");
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      delete (config.headers as any).Authorization;
    }
  }
  return config;
});

/** ---- Response interceptor: tự refresh khi 401 (trừ khi đang logout) ---- */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error || {};
    const original = config || {};
    const url = (original.url ?? "") as string;

    // Nếu không có response, hoặc không phải 401, hoặc endpoint auth -> trả lỗi luôn
    if (
      !response ||
      response.status !== 401 ||
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/register") ||
      url.startsWith("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    // Nếu đang logout thủ công -> không refresh, dọn client, bắn callback
    if (logoutInProgress) {
      clearClientTokens();
      onAuthError?.();
      return Promise.reject(error);
    }

    // Đã thử refresh 1 lần cho request này rồi -> không thử lại nữa
    if ((original as any)._retry) {
      return Promise.reject(error);
    }
    (original as any)._retry = true;

    // Hàng đợi để tránh gọi refresh song song
    if (isRefreshing) {
      return new Promise((resolve) => {
        waitQueue.push((newToken) => {
          original.headers = original.headers || {};
          (original.headers as any).Authorization = `Bearer ${newToken}`;
          resolve(axiosInstance(original));
        });
      });
    }

    isRefreshing = true;
    try {
      // Server cấp token mới dựa trên refresh cookie (HttpOnly)
      const { data } = await axiosInstance.get("/auth/refresh-token");
      const newToken = data?.token;
      if (!newToken) throw new Error("No token in refresh response");

      Cookies.set("accessToken", newToken, {
        expires: 1,
        path: "/",
        sameSite: "Lax",
        secure: location.protocol === "https:",
      });

      // Cập nhật header mặc định cho các request sau
      (axiosInstance.defaults.headers as any).common = {
        ...(axiosInstance.defaults.headers as any).common,
        Authorization: `Bearer ${newToken}`,
      };

      // Chạy các request đang chờ
      waitQueue.forEach((cb) => cb(newToken));
      waitQueue = [];

      // Thử lại request gốc
      original.headers = original.headers || {};
      (original.headers as any).Authorization = `Bearer ${newToken}`;
      return axiosInstance(original);
    } catch (e) {
      // Refresh fail -> dọn client và báo app điều hướng
      clearClientTokens();
      delete (axiosInstance.defaults.headers as any)?.common?.Authorization;
      onAuthError?.();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
