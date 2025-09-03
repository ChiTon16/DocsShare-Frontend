// src/services/catalog.ts
import { axiosInstance } from "@/utils/AxiosInterceptor"; // file axios bạn vừa gửi

export type School = { id: number; name: string };
export type Major  = { id: number; name: string; schoolId?: number };

export async function getSchools(): Promise<School[]> {
  const res = await axiosInstance.get<School[]>("/schools");
  return res.data;
}

export async function getMajors(): Promise<Major[]> {
    const res = await axiosInstance.get<Major[]>("/majors");
    return res.data;
}
