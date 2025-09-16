// src/services/studyPlan.ts
import axiosInstance from "@/utils/AxiosInterceptor";

export type StudyPlan = {
  id: number;
  name: string;
  contains?: boolean; // có thể chưa có -> sẽ tự gắn sau khi hydrate
};

export type StudyPlanItem = {
  id: number;
  documentId: number;
  title?: string;
  subjectName?: string;
  userName?: string;
  sortIndex?: number;
  note?: string | null;
};

// Giữ nguyên
export async function getMyPlans(docId?: number): Promise<StudyPlan[]> {
  const { data } = await axiosInstance.get("/study-plans", {
    params: docId ? { docId } : undefined,
  });
  return data as StudyPlan[];
}

// NEW: lấy items của một plan (khớp với ảnh Postman bạn gửi)
export async function getPlanItems(planId: number): Promise<StudyPlanItem[]> {
  const { data } = await axiosInstance.get(`/study-plans/${planId}/items`);
  return data as StudyPlanItem[];
}

/**
 * NEW: kiểm tra docId có nằm trong BẤT KỲ study plan nào của user không.
 * Trả về: saved + danh sách planIds chứa doc
 */
export async function isDocumentSaved(docId: number): Promise<{ saved: boolean; planIds: number[] }> {
  const plans = await getMyPlans(); // server chưa có contains -> gọi items để kiểm
  const planIdsContain: number[] = [];

  // fetch tuần tự để có thể short-circuit nếu muốn
  for (const p of plans) {
    try {
      const items = await getPlanItems(p.id);
      if (items.some((it) => it.documentId === docId)) {
        planIdsContain.push(p.id);
      }
    } catch {
      // bỏ qua lỗi plan lỗi đơn lẻ
    }
  }

  return { saved: planIdsContain.length > 0, planIds: planIdsContain };
}

/**
 * NEW: hydrate `contains` cho danh sách plans (phục vụ mở modal và tick sẵn)
 */
export async function hydrateContains(plans: StudyPlan[], docId: number): Promise<StudyPlan[]> {
  const result: StudyPlan[] = [];
  for (const p of plans) {
    try {
      const items = await getPlanItems(p.id);
      const has = items.some((it) => it.documentId === docId);
      result.push({ ...p, contains: has });
    } catch {
      result.push({ ...p, contains: false });
    }
  }
  return result;
}

// Giữ nguyên
export async function createPlan(name: string, description?: string): Promise<StudyPlan> {
  const { data } = await axiosInstance.post(
    "/study-plans",
    {}, // không gửi body
    {
      params: { name, description },
    }
  );
  return data as StudyPlan;
}

export async function addToPlan(planId: number, documentId: number, note?: string): Promise<void> {
  await axiosInstance.post(
    `/study-plans/${planId}/items/${documentId}`,
    {},
    { params: note ? { note } : undefined }
  );
}

// src/services/studyPlan.ts
export async function removeFromPlan(
  planId: number,
  documentId: number
): Promise<void> {
  // Đúng theo API: param trên URL, không gửi body
  await axiosInstance.delete(`/study-plans/${planId}/items/${documentId}`);
}

