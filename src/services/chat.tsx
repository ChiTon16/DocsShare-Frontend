// src/services/chat.ts
import axiosInstance from "@/utils/AxiosInterceptor";

export type ChatRoom = {
  id: number;
  code: string;
  name: string;
  memberCount?: number;
  createdAt?: string;
};

export type ChatMessageRes = {
  id: number;
  roomId: number;
  senderEmail: string;
  type: "TEXT" | "IMAGE" | string;
  content: string;
  parentId?: number | null;
  createdAt: string;
};

export type ChatRoomDetail = {
  id: number;
  code: string;
  name: string;
  createdAt?: string;
  memberCount?: number | null;
};

export type ChatMember = {
  id?: number;
  userId?: number;
  userEmail?: string;
  userName?: string;
  avatarUrl?: string;
  joinedAt?: string;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

/** ====== ROOMS ====== */

// Lấy các phòng mà mình là thành viên (hoặc tất cả nếu BE không lọc)
export async function listMyRooms(q = "", page = 0, size = 50) {
  const { data } = await axiosInstance.get<Page<ChatRoom>>("/chat/rooms", {
    params: { mine: true, q, page, size },
  });
  // nếu backend không phân trang thì data có thể là array:
  return Array.isArray(data) ? (data as ChatRoom[]) : (data.content || []);
}

// Tạo phòng mới (BE của bạn từng hỗ trợ cả JSON body và query param)
export async function createRoom(payload: { name: string; code?: string }) {
  try {
    const { data } = await axiosInstance.post<ChatRoom>("/chat/rooms", payload);
    return data;
  } catch {
    const { data } = await axiosInstance.post<ChatRoom>("/chat/rooms", null, {
      params: { name: payload.name, code: payload.code },
    });
    return data;
  }
}

/** ====== MESSAGES (để sau vẫn dùng) ====== */
export async function getChatHistory(roomId: number | string, page = 0, size = 50) {
  const { data } = await axiosInstance.get<Page<ChatMessageRes>>(
    `/chat/rooms/${roomId}/history`,
    { params: { page, size } }
  );
  return Array.isArray(data) ? data as any : [...(data.content || [])].reverse();
}

export async function sendChatMessage(
  roomId: number | string,
  body: { type?: string; content: string; parentId?: number | null }
) {
  const { data } = await axiosInstance.post<ChatMessageRes>(
    `/chat/rooms/${roomId}/messages`,
    body
  );
  return data;
}

// --- SEARCH ROOMS (mine? q? page/size?) ---
export async function listRooms(params?: {
  mine?: boolean;
  q?: string;
  page?: number;
  size?: number;
}): Promise<ChatRoom[]> {
  const res = await axiosInstance.get("/chat/rooms", {
    params: {
      mine: params?.mine ?? false,
      q: params?.q ?? "",
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  // BE trả Page<ChatRoomRes> => lấy content, nếu BE trả array thì rơi về res.data
  return Array.isArray(res.data) ? res.data : res.data?.content ?? [];
}

// --- JOIN BY CODE ---
export async function joinRoomByCode(code: string): Promise<ChatRoom> {
  const res = await axiosInstance.post("/chat/rooms/join-by-code", { code });
  return res.data;
}

// --- JOIN BY ID ---
export async function joinRoom(roomId: number): Promise<ChatRoom> {
  const res = await axiosInstance.post(`/chat/rooms/${roomId}/join`);
  return res.data;
}

/** Lấy thông tin phòng */
export async function getRoomDetail(roomId: string | number): Promise<ChatRoomDetail> {
  const { data } = await axiosInstance.get(`/chat/rooms/${roomId}`);
  return data;
}

/** Lấy danh sách thành viên phòng */
export async function getRoomMembers(roomId: string | number): Promise<ChatMember[]> {
  const { data } = await axiosInstance.get(`/chat/rooms/${roomId}/members`);
  return data?.content ?? data ?? [];
}

export type LeaveRoomRes = {
  roomId: number;
  removed: boolean;
  remaining: number;
  roomDeleted: boolean;
};

// Rời nhóm (backend đã có DELETE /api/chat/rooms/{roomId}/members/me)
export async function leaveRoom(roomId: string | number): Promise<LeaveRoomRes> {
  const { data } = await axiosInstance.delete(`/chat/rooms/${roomId}/members/me`);
  return data;
}