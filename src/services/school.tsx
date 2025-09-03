// src/services/school.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";

export type SchoolDTO = {
  id: number;
  name: string;
  address?: string;
};

export async function getSchoolById(id: number, signal?: AbortSignal): Promise<SchoolDTO> {
  const { data } = await axiosInstance.get<SchoolDTO>(`/schools/${id}`, { signal });
  return data;
}
