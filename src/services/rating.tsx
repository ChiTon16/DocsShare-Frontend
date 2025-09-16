import axiosInstance from "@/utils/AxiosInterceptor";

export type MyRating = 1 | -1 | 0 | null;
export type RatingSummary = {
  upvotes: number;
  downvotes: number;
  myRating: MyRating; // 1 | -1 | null
};

export async function getRatingSummary(documentId: number): Promise<RatingSummary> {
  const { data } = await axiosInstance.get(`/documents/${documentId}/rating`);
  // backend trả myRating=null khi anonymous
  return {
    upvotes: data.upvotes ?? 0,
    downvotes: data.downvotes ?? 0,
    myRating: typeof data.myRating === "number" ? (data.myRating as MyRating) : null,
  };
}

/** action: "up" | "down" | "clear" (backend đã hỗ trợ) */
export async function setRating(documentId: number, action: "up" | "down" | "clear"): Promise<RatingSummary> {
  const { data } = await axiosInstance.post(`/documents/${documentId}/rating`, { action });
  return {
    upvotes: data.upvotes ?? 0,
    downvotes: data.downvotes ?? 0,
    myRating: typeof data.myRating === "number" ? (data.myRating as MyRating) : null,
  };
}
