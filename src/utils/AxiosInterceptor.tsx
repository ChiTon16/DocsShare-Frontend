// src/utils/AxiosInterceptor.ts
import axios from "axios";
import Cookies from "js-cookie";

export const baseUrl = import.meta.env.VITE_APP_API_URL as string;

export const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

/** ================== Trạng thái & tiện ích ================== */
let isRefreshing = false;
let waitQueue: Array<(t: string) => void> = [];
let logoutInProgress = false;

let onAuthError: (() => void) | null = null;
export function setOnAuthError(cb: () => void) {
  onAuthError = cb;
}

/** Gọi hàm này TRƯỚC khi xoá cookie ở auth.ts */
export function markManualLogout() {
  logoutInProgress = true;
  delete (axiosInstance.defaults.headers as any)?.common?.Authorization;
  waitQueue = [];
}

/** Tiện: xoá access/refresh ở client */
export function clearClientTokens() {
  Cookies.remove("accessToken", { path: "/" });
  Cookies.remove("refreshToken", { path: "/" });
}

/** ================== Request Interceptor ================== */
axiosInstance.interceptors.request.use((config) => {
  const rawUrl = (config.url ?? "") as string;
  const url = rawUrl || "";
  const method = (config.method ?? "get").toString().toLowerCase();

  if (config.data instanceof FormData) {
    if (config.headers) delete (config.headers as any)["Content-Type"];
  } else if (["post", "put", "patch", "delete"].includes(method) && config.data != null) {
    config.headers = config.headers || {};
    (config.headers as any)["Content-Type"] = "application/json";
  } else if (config.headers) {
    delete (config.headers as any)["Content-Type"];
  }

  const isAuthEndpoint =
    url.startsWith("/auth/login") ||
    url.startsWith("/auth/register") ||
    url.startsWith("/auth/refresh-token") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh-token");

  if (isAuthEndpoint) {
    if (config.headers) delete (config.headers as any).Authorization;
  } else {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      delete (config.headers as any).Authorization;
    }
  }

  return config;
});

/** ================== Response Interceptor (Refresh) ================== */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error || {};
    const original = (config || {}) as any;
    const rawUrl = (original.url ?? "") as string;
    const url = rawUrl || "";

    // 1) Không có response (network) -> trả lỗi luôn
    if (!response) return Promise.reject(error);

    const status = response.status as number;

    // 2) Không refresh ở các endpoint auth
    const isAuthEndpoint =
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/register") ||
      url.startsWith("/auth/refresh-token") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh-token");

    if (isAuthEndpoint) return Promise.reject(error);

    // 3) Quyết định có thử refresh hay không
    // - Refresh nếu là 401
    // - Hoặc 403 nhưng request có Authorization (rất có thể token hết hạn) -> tránh nhầm 403 do thiếu quyền.
    const hadAuthHeader =
      !!original?.headers?.Authorization || !!Cookies.get("accessToken");

    const shouldTryRefresh =
      status === 401 || (status === 403 && hadAuthHeader);

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    // Nếu đang logout thủ công → không refresh
    if (logoutInProgress) {
      clearClientTokens();
      delete (axiosInstance.defaults.headers as any)?.common?.Authorization;
      onAuthError?.();
      return Promise.reject(error);
    }

    // Không thử lại quá 1 lần
    if (original._retry) return Promise.reject(error);
    original._retry = true;

    // 4) Nếu đang refresh -> xếp hàng đợi
    if (isRefreshing) {
      return new Promise((resolve) => {
        waitQueue.push((newToken: string) => {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(axiosInstance(original));
        });
      });
    }

    // 5) Bắt đầu refresh
    isRefreshing = true;
    try {
      // Gọi refresh bằng refresh cookie HttpOnly
      const { data } = await axiosInstance.get("/auth/refresh-token");
      const newToken: string | undefined = data?.accessToken ?? data?.token;
      if (!newToken) throw new Error("No access token in refresh response");

      // Lưu access token mới (nếu bạn lưu ở cookie non-HttpOnly)
      Cookies.set("accessToken", newToken, {
        expires: 1,
        path: "/",
        sameSite: "Lax",
        secure: location.protocol === "https:",
      });

      // Cập nhật default header
      (axiosInstance.defaults.headers as any).common = {
        ...(axiosInstance.defaults.headers as any).common,
        Authorization: `Bearer ${newToken}`,
      };

      // Giải phóng hàng đợi
      waitQueue.forEach((cb) => cb(newToken));
      waitQueue = [];

      // Thử lại request gốc
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(original);
    } catch (e) {
      // Refresh thất bại -> dọn token & báo app điều hướng login
      clearClientTokens();
      delete (axiosInstance.defaults.headers as any)?.common?.Authorization;
      onAuthError?.();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
