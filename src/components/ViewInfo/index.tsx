import React, { useEffect, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CommentService from "@/services/comment";
import type { CommentResponse } from "@/services/commentResponse"; // <== dùng DTO chung

type Props = {
  title: string;
  subjectName?: string;
  subjectDocsCount?: number;
  university?: string;
  academicYear?: string;
  uploaderName?: string;
  uploaderAvatarUrl?: string;
  uploaderSchool?: string;
  stats?: { followers?: number; uploads?: number; upvotes?: number };
  downloadUrl?: string | null;
  onBack?: () => void;
  onCollapsedChange?: (v: boolean) => void;
  documentId?: number;
};

const APP_HEADER_H = 10;

const LeftInfoPanel: React.FC<Props> = ({
  title,
  subjectName = "—",
  subjectDocsCount,
  university = "—",
  academicYear,
  uploaderName = "—",
  uploaderAvatarUrl,
  uploaderSchool,
  stats = {},
  downloadUrl,
  onBack,
  onCollapsedChange,
  documentId,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // ====== Comments state ======
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [cmtError, setCmtError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  // replies cache: parentId -> replies
  const [repliesByParent, setRepliesByParent] = useState<Record<number, CommentResponse[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<Record<number, boolean>>({});
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});

  // reply composer
  const [openReplyFor, setOpenReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  // menu 3 chấm (delete)
  const [menuFor, setMenuFor] = useState<number | null>(null);

  // Fetch roots
  useEffect(() => {
    if (!documentId) return;
    let mounted = true;
    (async () => {
      try {
        setCmtLoading(true);
        setCmtError(null);
        const data = await CommentService.listRoots(documentId, 0, 10);
        if (mounted) setComments(data.items ?? []);
      } catch (e: any) {
        if (mounted) setCmtError(e?.message || "Failed to load comments");
      } finally {
        if (mounted) setCmtLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [documentId]);

  // Post root
  const postComment = async () => {
    if (!documentId) {
      setCmtError("Thiếu documentId để gửi bình luận.");
      return;
    }
    if (!content.trim()) {
      setCmtError("Vui lòng nhập nội dung bình luận.");
      return;
    }
    setPosting(true);
    try {
      const created = await CommentService.create({ documentId, content: content.trim() });
      setComments((prev) => [...prev, created]);
      setContent("");
      setCmtError(null);
    } catch (e: any) {
      setCmtError(e?.message || "Cannot post comment");
    } finally {
      setPosting(false);
    }
  };

  // Toggle & load replies
  const toggleReplies = async (parentId: number) => {
    setExpandedParents((s) => ({ ...s, [parentId]: !s[parentId] }));
    const isOpen = expandedParents[parentId];
    if (isOpen) return; // đang mở -> bấm nữa sẽ đóng; không cần reload

    if (!repliesByParent[parentId]) {
      try {
        setRepliesLoading((m) => ({ ...m, [parentId]: true }));
        const data = await CommentService.listReplies(parentId, 0, 20);
        setRepliesByParent((m) => ({ ...m, [parentId]: data.items ?? [] }));
      } catch (e) {
        // bỏ qua
      } finally {
        setRepliesLoading((m) => ({ ...m, [parentId]: false }));
      }
    }
  };

  // Post reply
  const postReply = async (parentId: number) => {
    if (!documentId) {
      setCmtError("Thiếu documentId để gửi bình luận.");
      return;
    }
    if (!replyText.trim()) return;

    try {
      const created = await CommentService.create({
        documentId,
        parentId,
        content: replyText.trim(),
      });

      // Tăng replyCount + append vào danh sách replies
      setComments((prev) =>
        prev.map((c) => (c.commentId === parentId ? { ...c, replyCount: (c.replyCount ?? 0) + 1 } : c))
      );
      setRepliesByParent((m) => {
        const arr = m[parentId] ? [...m[parentId], created] : [created];
        return { ...m, [parentId]: arr };
      });
      setExpandedParents((s) => ({ ...s, [parentId]: true })); // ensure open
      setReplyText("");
      setOpenReplyFor(null);
    } catch (e: any) {
      alert(e?.message || "Reply failed");
    }
  };

  // Delete (root or reply)
  const deleteComment = async (commentId: number, parentId: number | null) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await CommentService.remove(commentId);

      if (parentId) {
        // xóa reply
        setRepliesByParent((m) => {
          const arr = (m[parentId] || []).filter((r) => r.commentId !== commentId);
          return { ...m, [parentId]: arr };
        });
        setComments((prev) =>
          prev.map((c) => (c.commentId === parentId ? { ...c, replyCount: Math.max(0, (c.replyCount ?? 1) - 1) } : c))
        );
      } else {
        // xóa root
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
        // dọn replies cache (nếu có)
        setRepliesByParent((m) => {
          const cp = { ...m };
          delete cp[commentId];
          return cp;
        });
      }
      setMenuFor(null);
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  const avatarUrl = (name?: string | null) =>
    "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(name || "User");

  return (
    <div className="relative group h-full">
      {/* Toggle */}
      <button
        onClick={() => {
          setCollapsed(!collapsed);
          onCollapsedChange?.(!collapsed);
        }}
        title={collapsed ? "Expand" : "Collapse"}
        className="absolute -right-4 top-6 z-20 inline-flex items-center justify-center w-8 h-8
                   bg-white border border-gray-300 shadow rounded-full hover:bg-gray-100
                   transition-opacity duration-200 opacity-0 pointer-events-none
                   group-hover:opacity-100 group-hover:pointer-events-auto"
      >
        {collapsed ? <ChevronRightIcon fontSize="medium" /> : <ChevronLeftIcon fontSize="medium" />}
      </button>

      <aside
        className={`shrink-0 bg-white border-r border-gray-300 shadow-sm flex flex-col transition-all duration-300 ease-in-out h-full min-h-0 ${
          collapsed ? "w-11 items-center" : "w-[340px]"
        }`}
      >
        {/* Spacer */}
        <div style={{ height: APP_HEADER_H }} className="shrink-0" />

        {/* Header */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} p-3 bg-white`}>
          {!collapsed ? (
            <>
              <button
                onClick={() => {
                  if (onBack) onBack();
                  else window.location.replace("/home");
                }}
                className="px-3 py-1 rounded-md hover:bg-[#3092fa]/10 cursor-pointer text-gray-700"
              >
                ← Back
              </button>
              <div className="w-8" />
            </>
          ) : (
            <div className="text-xs text-gray-500">Info</div>
          )}
        </div>

        {/* Title */}
        {!collapsed && (
          <div className="px-4">
            <h1 className="text-2xl font-bold leading-snug [font-family:'DM_Sans',sans-serif]">{title}</h1>
            <p className="mt-1 text-sm text-gray-600" />
          </div>
        )}

        {/* Body */}
        {!collapsed ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Info blocks (giữ nguyên)… */}

            {/* ====== COMMENTS SECTION ====== */}
            <section className="px-4 pt-6 pb-4">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Comments</h3>

              {/* Input root */}
              <div className="rounded-2xl border border-gray-200 p-3 shadow-sm">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full resize-y min-h-[84px] rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 px-3 py-2 text-sm"
                  placeholder="Comment or ask a question..."
                />
                <div className="flex items-center justify-between mt-3">
                  {cmtError && <div className="text-xs text-red-600">{cmtError}</div>}
                  <button
                    onClick={postComment}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600"
                    title="Post"
                  >
                    <span className="[transform:rotate(-15deg)]">➤</span>
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* List roots */}
              <div className="mt-4">
                {cmtLoading && <div className="text-sm text-gray-500">Loading comments…</div>}
                {cmtError && <div className="text-sm text-red-600">Error: {cmtError}</div>}
                {!cmtLoading && !cmtError && comments.length === 0 && (
                  <div className="text-sm text-gray-500">Be the first to comment.</div>
                )}

                <ul className="space-y-4">
                  {comments.map((c) => {
                    const isOpen = !!expandedParents[c.commentId];
                    const replies = repliesByParent[c.commentId] || [];
                    const loadingRep = !!repliesLoading[c.commentId];

                    return (
                      <li key={c.commentId} className="border border-gray-200 rounded-xl p-3">
                        <div className="flex items-start gap-3">
                          <img className="w-8 h-8 rounded-full ring-1 ring-gray-200" src={avatarUrl(c.userName)} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800">{c.userName ?? "User"}</span>
                                <span className="text-xs text-gray-500">{new Date(c.postedAt).toLocaleString()}</span>
                              </div>

                              {/* menu 3 chấm */}
                              <div className="relative">
                                <button
                                  className="w-8 h-8 grid place-items-center rounded-full hover:bg-gray-100"
                                  onClick={() => setMenuFor((v) => (v === c.commentId ? null : c.commentId))}
                                  title="More"
                                >
                                  <MoreVertIcon fontSize="small" />
                                </button>
                                {menuFor === c.commentId && (
                                  <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow z-10">
                                    <button
                                      className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50"
                                      onClick={() => deleteComment(c.commentId, null)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{c.content}</p>

                            {/* actions */}
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <button
                                className="text-gray-700 hover:underline"
                                onClick={() => setOpenReplyFor((v) => (v === c.commentId ? null : c.commentId))}
                              >
                                Reply
                              </button>

                              {c.replyCount > 0 && (
                                <button className="text-blue-600 hover:underline" onClick={() => toggleReplies(c.commentId)}>
                                  {isOpen ? "Hide replies" : `Show replies (${c.replyCount})`}
                                </button>
                              )}
                            </div>

                            {/* reply composer */}
                            {openReplyFor === c.commentId && (
                              <div className="mt-3 rounded-xl border border-gray-200 p-2">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="w-full resize-y min-h-[64px] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 px-3 py-2 text-sm"
                                  placeholder={`Reply to ${c.userName ?? "this comment"}...`}
                                />
                                <div className="flex justify-end mt-2 gap-2">
                                  <button
                                    className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-50"
                                    onClick={() => {
                                      setOpenReplyFor(null);
                                      setReplyText("");
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => postReply(c.commentId)}
                                    className="px-4 py-1.5 text-sm rounded-full text-white bg-blue-500 hover:bg-blue-600"
                                  >
                                    Post
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* replies list */}
                            {isOpen && (
                              <div className="mt-3 pl-3 border-l border-gray-200">
                                {loadingRep && <div className="text-xs text-gray-500">Loading replies…</div>}
                                {!loadingRep && replies.length === 0 && (
                                  <div className="text-xs text-gray-500">No replies yet.</div>
                                )}
                                <ul className="space-y-3">
                                  {replies.map((r) => (
                                    <li key={r.commentId} className="flex items-start gap-3">
                                      <img className="w-7 h-7 rounded-full ring-1 ring-gray-200" src={avatarUrl(r.userName)} />
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800">{r.userName ?? "User"}</span>
                                            <span className="text-xs text-gray-500">
                                              {new Date(r.postedAt).toLocaleString()}
                                            </span>
                                          </div>
                                          <div className="relative">
                                            <button
                                              className="w-7 h-7 grid place-items-center rounded-full hover:bg-gray-100"
                                              onClick={() => setMenuFor((v) => (v === r.commentId ? null : r.commentId))}
                                              title="More"
                                            >
                                              <MoreVertIcon fontSize="small" />
                                            </button>
                                            {menuFor === r.commentId && (
                                              <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow z-10">
                                                <button
                                                  className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50"
                                                  onClick={() => deleteComment(r.commentId, r.parentId)}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{r.content}</p>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
            {/* ====== /COMMENTS SECTION ====== */}
          </div>
        ) : (
          <div className="flex-1 min-h-0" aria-hidden />
        )}

        {/* Download */}
        {!collapsed && downloadUrl ? (
          <div className="px-4 py-4 mt-auto">
            <a
              href={downloadUrl}
              download
              className="w-full inline-flex items-center justify-center gap-2 rounded-full py-2 bg-green-500 text-white hover:bg-green-600"
            >
              <CloudDownloadIcon fontSize="small" /> Download
            </a>
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </aside>
    </div>
  );
};

export default LeftInfoPanel;
