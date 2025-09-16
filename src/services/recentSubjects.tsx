import { axiosInstance } from "@/utils/AxiosInterceptor"; // dùng instance đã cấu hình sẵn

export type RecentSubjectItem = {
  subjectId: number;
  subjectName: string;
  subjectCode?: string | null;
  totalDocsInSubject: number;
  docsViewedByUser?: number;
  lastViewedAt?: string;
  following: boolean;
};

/** Lấy danh sách “Recently viewed” theo môn của user hiện tại (dựa vào JWT) */
export async function getRecentSubjects(size = 6): Promise<RecentSubjectItem[]> {
  const res = await axiosInstance.get<RecentSubjectItem[]>(`/recent-subjects?size=${size}`);
  return res.data ?? [];
}
