import { axiosInstance } from "@/utils/AxiosInterceptor";
import type { CommentResponse, PageResponse, CreateCommentRequest } from "./commentResponse";

const CommentService = {
  listRoots: async (documentId: number, page = 0, size = 20) => {
    const { data } = await axiosInstance.get<PageResponse<CommentResponse>>(
      `/comments/document/${documentId}/roots`,
      { params: { page, size } }
    );
    return data;
  },

  listReplies: async (parentId: number, page = 0, size = 20) => {
    const { data } = await axiosInstance.get<PageResponse<CommentResponse>>(
      `/comments/${parentId}/replies`,
      { params: { page, size } }
    );
    return data;
  },

  create: async (payload: CreateCommentRequest) => {
    const { data } = await axiosInstance.post<CommentResponse>(`/comments`, payload);
    return data;
  },

  remove: async (commentId: number) => {
    await axiosInstance.delete(`/comments/${commentId}`);
  },
};

export default CommentService;
