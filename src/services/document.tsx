// src/services/document.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";

/* ===================== Types ===================== */

export type DocumentDTO = {
  documentId: number;
  title: string;
  filePath: string;
  uploadTime: string;
  userId: number;
  userName: string;
  subjectId: number;
  subjectName: string;
};

export type DocumentViewDTO = {
  documentId: number;
  title: string;
  filePath: string;
  uploadTime: string | null;
  userId: number | null;
  userName: string | null;
  subjectId: number | null;
  subjectName: string | null;
  lastPage: number | null;
  percent: number | null;
  lastViewedAt: string | null;
  totalPages: number | null;
  viewerUrl: string;
};

export type ProgressUpsertPayload = {
  documentId: number;
  lastPage?: number;
  percent?: number;
  sessionReadSeconds?: number;
};

/** NEW: Trang hoá kết quả */
export type PageResp<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
};

/* ===================== Helpers ===================== */

// đọc cookie nhanh gọn
function readCookie(name: string): string {
  const m = document.cookie.split("; ").find((x) => x.startsWith(name + "="));
  return m ? decodeURIComponent(m.split("=", 2)[1]) : "";
}

// Lấy baseURL từ axiosInstance
function buildApiUrl(path: string): string {
  const base = (axiosInstance.defaults.baseURL || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

// Có token không? (Bearer từ axios header hoặc accessToken cookie)
function hasAuthToken(): { has: boolean; authHeader: string } {
  const headerAuth =
    (axiosInstance.defaults.headers?.common as any)?.Authorization ||
    (axiosInstance.defaults.headers as any)?.Authorization ||
    "";

  // Nếu bạn đang lưu accessToken ở cookie (non-HttpOnly)
  const cookieToken = readCookie("accessToken");

  if (headerAuth) return { has: true, authHeader: headerAuth };
  if (cookieToken) return { has: true, authHeader: `Bearer ${cookieToken}` };
  return { has: false, authHeader: "" };
}

/* ===================== Document APIs ===================== */

export async function getUserDocuments(userId: number): Promise<DocumentDTO[]> {
  const { data } = await axiosInstance.get<DocumentDTO[]>(`/users/${userId}/documents`);
  return data;
}

export async function openDocument(docId: number): Promise<DocumentViewDTO> {
  const { data } = await axiosInstance.post<DocumentViewDTO>(`/documents/${docId}/open`);
  return data;
}

export async function getDocumentMeta(id: number): Promise<DocumentDTO> {
  const { data } = await axiosInstance.get<DocumentDTO>(`/documents/${id}`);
  return data;
}

/** Lấy PDF (có header Authorization) và trả về object URL để nhúng */
export async function getPdfObjectUrl(docId: number): Promise<string> {
  const res = await axiosInstance.get(`/documents/${docId}/pdf`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

/** NEW: URL thumbnail từ BE (page & width tùy chọn) */
export function getDocumentThumbnailUrl(docId: number, opts?: { page?: number; width?: number }) {
  const page = opts?.page ?? 1;
  const width = opts?.width ?? 400;
  return buildApiUrl(`/documents/${docId}/thumbnail?page=${page}&width=${width}`);
}

/** NEW: Tìm kiếm documents (phân trang + sort + filters) */
export async function searchDocuments(params: {
  q?: string;
  subjectId?: number;
  uploaderId?: number;
  schoolId?: number;
  year?: number;
  page?: number;     // 0-based
  size?: number;     // mặc định 20
  sort?: string;     // ví dụ: 'uploadTime,desc' | 'title,asc'
}): Promise<PageResp<DocumentDTO>> {
  const { data } = await axiosInstance.get<PageResp<DocumentDTO>>("/documents/search", {
    params,
  });
  return data;
}

/* ===================== Reading progress ===================== */

/**
 * Lưu tiến độ bình thường (khi app đang mở).
 * - Bỏ qua nếu chưa đăng nhập để tránh 403 noise.
 * - validateStatus để axios không throw → đỡ log đỏ ở console.
 */
export async function upsertReadingProgress(payload: ProgressUpsertPayload): Promise<void> {
  const { has } = hasAuthToken();
  if (!has) return; // guest → không gửi

  await axiosInstance.post("/recent-views/upsert", payload, {
    validateStatus: (s) => s >= 200 && s < 500,
  });
}

/**
 * Lưu tiến độ khi đóng tab/chuyển trang.
 * - Không dùng sendBeacon thuần (không gắn được Authorization) → dùng fetch keepalive.
 * - Gửi kèm Authorization (nếu có) + cookie + CSRF.
 * - Nếu chưa đăng nhập thì bỏ qua.
 */
export function upsertReadingProgressBeacon(
  payload: ProgressUpsertPayload
): Promise<Response | void> {
  const { has, authHeader } = hasAuthToken();
  if (!has) return Promise.resolve(); // guest → bỏ qua

  const url = buildApiUrl("/recent-views/upsert");
  const xsrf = readCookie("XSRF-TOKEN"); // nếu Spring Security bật CSRF cho cookie

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: authHeader,
  };
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

  return fetch(url, {
    method: "POST",
    keepalive: true,
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  }).catch(() => {
    // nuốt lỗi để không spam console lúc unload
  });
}

// Lấy blob PDF (tái dùng cho thumbnail)
export async function getDocumentPdfBlob(docId: number): Promise<Blob> {
  const res = await axiosInstance.get(`/documents/${docId}/pdf`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

/* Alias nếu cần dùng lại */
export type UserDocDTO = DocumentDTO;
