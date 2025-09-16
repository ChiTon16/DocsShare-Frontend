export type CommentResponse = {
    commentId: number;
    content: string;
    postedAt: string;
    userId: number | null;
    userName: string | null;
    documentId: number | null;
    documentTitle: string | null;
    parentId: number | null;
    replyCount: number;
    userAvatarUrl?: string | null;
  };
  
  export type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  
  export type CreateCommentRequest = {
    documentId: number;
    content: string;
    parentId?: number | null;
  };
  