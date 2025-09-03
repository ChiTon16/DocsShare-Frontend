// src/services/upload.ts
import { axiosInstance } from "@/utils/AxiosInterceptor";

export type UploadResp = { url?: string; message?: string };

export function createUploadController() {
  return new AbortController();
}

export async function uploadDocument(
  payload: { file: File; title: string; subjectId: number; userId: number | string; },
  opts: { signal?: AbortSignal; onProgress?: (p: number) => void } = {}
): Promise<UploadResp> {
  const form = new FormData();
  form.append("file", payload.file);                   // <-- "file"
  form.append("title", payload.title);                 // <-- "title"
  form.append("subjectId", String(payload.subjectId)); // <-- "subjectId"
  form.append("userId", String(payload.userId));       // <-- "userId"

  const res = await axiosInstance.post<UploadResp>("/upload", form, {
    signal: opts.signal,
    withCredentials: true,
    onUploadProgress: (e) => {
      if (!e.total) return;
      opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    },
  });
  return res.data;
}
