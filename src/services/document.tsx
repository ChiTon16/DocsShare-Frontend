// src/services/document.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";

export type Document = {
  documentId: number;
  title: string;
  filePath: string;
  uploadTime: string;
  userId: number;
  userName: string;
  subjectId: number;
  subjectName: string;
};

export async function getUserDocuments(userId: number): Promise<Document[]> {
  const { data } = await axiosInstance.get<Document[]>(`/users/${userId}/documents`);
  return data;
}
