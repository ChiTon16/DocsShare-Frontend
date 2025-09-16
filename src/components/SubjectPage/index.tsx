// src/pages/CoursePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
// ❌ Bỏ FolderIcon MUI
// import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import QuizIcon from "@mui/icons-material/Quiz";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "@/context/AuthContext";
import { openDocument, type DocumentDTO } from "@/services/document";
import {
  fetchSubjectById,
  fetchSubjectDocuments,
  fetchFollowedSubjects,
  followSubject,
  unfollowSubject,
  type Subject,
  fetchSubjectStudentCount,
  fetchSubjectTrending,
  type TrendingDoc,
} from "@/services/subject";
import DocsSlider from "./DocsSlider";
import SubjectDocsList from "./SubjectDocsList";

// ✅ SVG của bạn -> URL string
import folderUrl from "@/assets/svg/course.svg";

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const subjectId = Number(id || 0);

  const { user } = useAuth();
  const userId = useMemo(() => Number(user?.userId ?? user?.id ?? 0), [user]);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [docs, setDocs] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [students, setStudents] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [followBusy, setFollowBusy] = useState(false);
  const [allDocs, setAllDocs] = useState<DocumentDTO[]>([]);
  const [allLoading, setAllLoading] = useState<boolean>(true);

  const HIGH_SCORE = 0.5;
  const MIN_TRENDING = 3;

  // tải TẤT CẢ tài liệu của môn (độc lập với trending)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAllLoading(true);
        const list = await fetchSubjectDocuments(subjectId);
        if (alive) setAllDocs(Array.isArray(list) ? list : []);
      } catch {
        if (alive) setAllDocs([]);
      } finally {
        if (alive) setAllLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [subjectId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [s, d] = await Promise.all([
        fetchSubjectById(subjectId),
        fetchSubjectDocuments(subjectId),
      ]);
      if (!mounted) return;
      setSubject(s);
      setDocs(d ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [subjectId]);

  // kiểm tra đang follow chưa
  useEffect(() => {
    if (!userId || !subjectId) return;
    (async () => {
      const mine = await fetchFollowedSubjects(userId);
      setIsFollowing(mine.some((x) => x.subjectId === subjectId));
    })();
  }, [userId, subjectId]);

  const toggleFollow = async () => {
    if (!userId || !subjectId || followBusy) return;
    setFollowBusy(true);

    const next = !isFollowing;
    const delta = next ? 1 : -1;

    // Optimistic
    setIsFollowing(next);
    setStudents((n) => Math.max(0, (n ?? 0) + delta));

    try {
      if (next) await followSubject(subjectId, userId);
      else await unfollowSubject(subjectId, userId);
      fetchSubjectStudentCount(subjectId)
        .then((n) => setStudents(n ?? 0))
        .catch(() => {});
    } catch {
      setIsFollowing(!next);
      setStudents((n) => Math.max(0, (n ?? 0) - delta));
    } finally {
      setFollowBusy(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [s, trending] = await Promise.all([
        fetchSubjectById(subjectId),
        fetchSubjectTrending(subjectId, 24, 0),
      ]);
      if (!mounted) return;
      setSubject(s);
      setDocs(trending ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [subjectId]);

  // Đếm số học sinh của môn (followers)
  useEffect(() => {
    if (!subjectId) return;
    let alive = true;
    (async () => {
      try {
        const n = await fetchSubjectStudentCount(subjectId);
        if (alive) setStudents(n ?? 0);
      } catch {
        if (alive) setStudents(0);
      }
    })();
    return () => { alive = false; };
  }, [subjectId]);

  const displayDocs = useMemo(() => {
    const all = (docs as TrendingDoc[]) ?? [];
    if (all.length === 0) return [];
    const high = all.filter((d) => (d.score ?? 0) >= HIGH_SCORE);
    if (high.length >= MIN_TRENDING) return high;
    const taken = new Set(high.map((d) => d.documentId));
    const rest = all.filter((d) => !taken.has(d.documentId));
    const need = Math.min(MIN_TRENDING, all.length);
    return [...high, ...rest].slice(0, need);
  }, [docs]);

  const handleOpenDoc = async (doc: DocumentDTO) => {
    try {
      const view = await openDocument(doc.documentId);
      if (view.viewerUrl) window.open(view.viewerUrl, "_blank");
    } catch {
      // ignore
    }
  };

  const normalize = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filteredDocs = useMemo(() => {
    if (!query.trim()) return docs;
    const q = normalize(query.trim());
    return docs.filter((d) => {
      const title = normalize(d.title || "");
      const subj = normalize(d.subjectName || "");
      const path = normalize(d.filePath || "");
      return title.includes(q) || subj.includes(q) || path.includes(q);
    });
  }, [docs, query]);

  const docsCount = docs.length;

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <section className="bg-green-50">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-green-500 p-3 text-white">
                {/* ✅ Dùng SVG custom như ảnh */}
                <img src={folderUrl} alt="" className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {subject?.name || "Course"}
                  {subject?.code ? (
                    <span className="text-slate-600"> ({subject.code})</span>
                  ) : null}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-700">
                  <div className="inline-flex items-center gap-2">
                    <DescriptionIcon fontSize="small" />
                    <span className="font-medium">
                      {docsCount.toLocaleString()}
                    </span>
                    <span className="text-slate-500">documents</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <HelpOutlineIcon fontSize="small" />
                    <span className="font-medium">14</span>
                    <span className="text-slate-500">questions</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <QuizIcon fontSize="small" />
                    <span className="font-medium">49</span>
                    <span className="text-slate-500">quizzes</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <GroupIcon fontSize="small" />
                    <span className="font-medium">
                      {students.toLocaleString()}
                    </span>
                    <span className="text-slate-500">students</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={toggleFollow}
                    disabled={followBusy}
                    className={`rounded-full px-4 py-2 text-sm ring-1 ${
                      followBusy
                        ? "opacity-60 cursor-not-allowed"
                        : isFollowing
                        ? "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        : "bg-blue-600 text-white ring-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>

                  <button className="rounded-full bg-indigo-50 px-4 py-2 text-sm text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100">
                    Summarize your notes
                  </button>
                </div>
              </div>
            </div>

            {/* Search in course */}
            <div className="w-full max-w-md">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <SearchIcon className="text-slate-400" fontSize="small" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-slate-300 bg-white pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Find in ${subject?.name || "this course"}`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute inset-y-0 right-2 my-1 rounded-full px-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {query
                  ? `${filteredDocs.length} / ${docsCount} documents`
                  : `${docsCount} documents`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <DocsSlider
        title="Trending"
        docs={displayDocs}
        loading={loading}
        onOpen={handleOpenDoc}
        hasAnyDocs={docs.length > 0}
        emptyText="Chưa có tài liệu trong môn này."
        noMatchText="Không có tài liệu đủ điểm cao."
        perPage={6}
      />

      <SubjectDocsList
        title="Lecture notes"
        docs={allDocs}
        loading={allLoading}
        onOpen={handleOpenDoc}
      />
    </div>
  );
}
