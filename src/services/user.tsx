// src/services/user.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";
import axios from "axios";

export type CurrentUser = {
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  schoolId?: number;
  majorId?: number;
};

/**
 * Lấy thông tin người dùng hiện tại (đã đăng nhập).
 * - Sử dụng axiosInstance (tự gắn Bearer + auto refresh token)
 * - Nên gọi ở tầng service/context rồi truyền xuống UI
 *
 * @param signal AbortSignal (tùy chọn) để hủy request khi unmount
 */
export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  try {
    const { data } = await axiosInstance.get<CurrentUser>("/auth/me", { signal });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // chỉ ném lỗi lên trên cho UI xử lý
      throw new Error("UNAUTHENTICATED");
    }
    throw error;
  }
}

