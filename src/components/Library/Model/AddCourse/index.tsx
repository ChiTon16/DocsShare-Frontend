import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
  fetchSubjects,
  fetchFollowedSubjects,
  followSubject,
  unfollowSubject,
  type Subject,
} from "@/services/subject";

type Props = {
  userId: number;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void; // callback để reload "My courses" ở ngoài
};

export default function AddCoursesModal({ userId, open, onClose, onChanged }: Props) {
  const [all, setAll] = useState<Subject[]>([]);
  const [followed, setFollowed] = useState<Subject[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ===== Mount point cho portal =====
  const portalRoot = useMemo(() => {
    let el = document.getElementById("modal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "modal-root";
      document.body.appendChild(el);
    }
    return el;
  }, []);

  // ===== Khóa body scroll khi mở modal + ESC để đóng =====
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // ===== Load data khi mở =====
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [subjects, mine] = await Promise.all([
          fetchSubjects(),
          fetchFollowedSubjects(userId),
        ]);
        if (!cancelled) {
          setAll(subjects ?? []);
          setFollowed(mine ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const followedSet = useMemo(
    () => new Set(followed.map((s) => s.subjectId)),
    [followed]
  );

  // ===== Lọc theo tên / mã =====
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q)
    );
  }, [all, query]);

  // ===== Toggle follow (optimistic) =====
  const toggleFollow = async (s: Subject) => {
    const isFollowing = followedSet.has(s.subjectId);

    if (isFollowing) {
      // optimistic remove
      setFollowed((prev) => prev.filter((x) => x.subjectId !== s.subjectId));
      try {
        await unfollowSubject(s.subjectId, userId);
        onChanged?.();
      } catch {
        // rollback
        setFollowed((prev) => [...prev, s]);
      }
    } else {
      // optimistic add
      setFollowed((prev) => [...prev, s]);
      try {
        await followSubject(s.subjectId, userId);
        onChanged?.();
      } catch {
        // rollback
        setFollowed((prev) => prev.filter((x) => x.subjectId !== s.subjectId));
      }
    }
  };

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center bg-black/40 p-3 md:p-6"
      onClick={(e) => {
        // click nền để đóng
        if (e.target === containerRef.current) onClose();
      }}
      ref={containerRef}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Add courses to your library</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <SearchIcon className="text-slate-400" fontSize="small" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course name or code"
              className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* List */}
          <div className="mt-4 max-h-[60vh] overflow-auto">
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : err ? (
              <div className="text-sm text-red-600">{err}</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-slate-500">
                Không tìm thấy môn học phù hợp.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const isFollowing = followedSet.has(s.subjectId);
                  return (
                    <li
                      key={s.subjectId}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {s.name}{" "}
                          {s.code && (
                            <span className="text-slate-500">({s.code})</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFollow(s)}
                        className={
                          isFollowing
                            ? "rounded-full border px-4 py-1.5 text-sm bg-slate-100 border-slate-200 hover:bg-slate-200"
                            : "rounded-full border px-4 py-1.5 text-sm bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                        }
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render qua portal để tránh lỗi chồng lớp / z-index
  return createPortal(content, portalRoot);
}
