// src/services/reading.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";

export type ContinueItem = {
  documentId: number;
  title: string;
  filePath: string;
  lastPage: number;
  percent: number;
  lastReadAt: string;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function getContinueReading(userId: number): Promise<ContinueItem[]> {
  const { data } = await axiosInstance.get<Page<ContinueItem>>(
    `/users/${userId}/reading/continue`
  );
  // Trả ra chỉ content để dễ dùng ở component
  return data.content ?? [];
}

export async function getThumbnailObjectUrl(
  documentId: number,
  page = 1,
  width = 400
): Promise<string> {
  const res = await axiosInstance.get(
    `/documents/${documentId}/thumbnail`,
    { params: { page, width }, responseType: "blob" }
  );
  return URL.createObjectURL(res.data); // nhớ revoke sau khi không dùng nữa
}
