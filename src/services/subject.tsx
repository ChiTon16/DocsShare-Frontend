import { axiosInstance } from "@/utils/AxiosInterceptor";

export type Subject = { subjectId: number; name: string };

export async function fetchSubjects(): Promise<Subject[]> {
  const res = await axiosInstance.get<Subject[]>("/subjects"); // -> /api/subjects vì baseURL đã có /api
  return res.data ?? [];
}
