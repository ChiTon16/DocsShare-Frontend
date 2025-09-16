// src/services/subject.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";
import type { DocumentDTO } from "@/services/document";

export type Subject = { subjectId: number; name: string; code?: string | null };
// DTO trending có thêm score
export type TrendingDoc = DocumentDTO & { score?: number };

export async function fetchSubjects(): Promise<Subject[]> {
  const res = await axiosInstance.get<Subject[]>("/subjects");
  return res.data ?? [];
}

export async function fetchSubjectById(id: number): Promise<Subject | null> {
  const list = await fetchSubjects();
  return list.find((s) => s.subjectId === id) ?? null;
}

export async function fetchSubjectDocuments(subjectId: number): Promise<DocumentDTO[]> {
  const res = await axiosInstance.get<DocumentDTO[]>(`/subjects/${subjectId}/documents`);
  return res.data ?? [];
}

/* Follow/Unfollow (đã chuẩn hoá theo phần trước) */
export async function fetchFollowedSubjects(userId: number): Promise<Subject[]> {
  const res = await axiosInstance.get<Subject[]>(`/users/${userId}/subjects`);
  return res.data ?? [];
}
export async function followSubject(subjectId: number, userId: number) {
  await axiosInstance.post(`/subjects/${subjectId}/follow`, null, { params: { userId } });
}
export async function unfollowSubject(subjectId: number, userId: number) {
  await axiosInstance.delete(`/subjects/${subjectId}/follow`, { params: { userId } });
}

export async function fetchSubjectStudentCount(subjectId: number): Promise<number> {
  const res = await axiosInstance.get<{ count: number }>(`/subjects/${subjectId}/followers/count`);
  return res.data?.count ?? 0;
}

export async function fetchSubjectTrending(
  subjectId: number,
  limit = 24,
  offset = 0,
  halfLifeHours = 48
): Promise<DocumentDTO[]> {
  const res = await axiosInstance.get<TrendingDoc[]>(
    `/subjects/${subjectId}/trending`,
    { params: { limit, offset, halfLifeHours } }
  );
  if (res.status >= 400) {
    throw new Error(`Trending failed: ${res.status}`);
  }
  return Array.isArray(res.data) ? res.data : [];
}