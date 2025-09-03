import { axiosInstance } from '@/utils/AxiosInterceptor';
import Cookies from 'js-cookie';

// ==== Types ====
export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  name: string;
  password: string;
  roleId?: number;
  schoolId?: number;
  majorId?: number;
};

export type AuthResponse = {
  ok: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
  code?: string;
};

export type MeResponse = {
  email: string;
  name: string;
  role: string;
  school?: string;
  major?: string;
};

// ==== Helpers ====
function setTokens(d: AuthResponse) {
  if (d.token) Cookies.set('accessToken', d.token, { sameSite: 'Lax', path: '/' });
  if (d.refreshToken) Cookies.set('refreshToken', d.refreshToken, { sameSite: 'Lax', path: '/' });
}

// ==== API functions ====

// Đăng nhập
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // validateStatus để axios không throw khi 4xx/5xx
  const res = await axiosInstance.post<AuthResponse>('/auth/login', payload, {
    validateStatus: () => true,
  });

  const data = res.data;

  // Backend mới: luôn trả 200 + { ok: false } khi sai
  if (res.status === 200 && data && data.ok === false) {
    throw new Error(data.message || 'Sai email hoặc mật khẩu');
  }

  // Thành công
  if (res.status === 200 && data?.ok === true && data.token) {
    setTokens(data);
    return data;
  }

  // Các trường hợp khác coi như thất bại
  throw new Error(data?.message || 'Đăng nhập thất bại');
}

// Đăng ký
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await axiosInstance.post<AuthResponse>('/auth/register', payload, {
    validateStatus: () => true,
  });

  const data = res.data;

  if (res.status === 200 && data.ok === true && data.token) {
    setTokens(data);
    return data;
  }

  if (res.status === 200 && data.ok === false) {
    throw new Error(data.message || 'Đăng ký thất bại');
  }

  throw new Error('Đăng ký thất bại');
}

// Lấy thông tin người dùng hiện tại
export async function me(): Promise<MeResponse> {
  const res = await axiosInstance.get<MeResponse>('/me');
  return res.data;
}

// Logout local
export function logoutLocal(): void {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  window.location.href = '/login';
}
