// src/pages/Search/SearchPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  searchDocuments,
  type DocumentDTO,
  type PageResp,
  openDocument,
} from "@/services/document";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import SchoolIcon from "@mui/icons-material/School";
import FolderIcon from "@mui/icons-material/Folder";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DocThumbnail from "../DocThumbnail";

type SortKey = "uploadTime,desc" | "uploadTime,asc" | "title,asc" | "title,desc";

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const qInit = sp.get("q") || "";
  const page = Math.max(0, Number(sp.get("page") || 0));
  const size = Math.min(50, Number(sp.get("size") || 20));
  const sort = (sp.get("sort") as SortKey) || "uploadTime,desc";
  const subjectId = sp.get("subjectId");
  const schoolId = sp.get("schoolId");
  const year = sp.get("year");

  const [query, setQuery] = useState(qInit);
  const [resp, setResp] = useState<PageResp<DocumentDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasAnyFilter = !!(subjectId || schoolId || year);

  useEffect(() => setQuery(qInit), [qInit]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await searchDocuments({
          q: qInit,
          page,
          size,
          sort,
          subjectId: subjectId ? Number(subjectId) : undefined,
          schoolId: schoolId ? Number(schoolId) : undefined,
          year: year ? Number(year) : undefined,
        });
        if (alive) setResp(data);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Search failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [qInit, page, size, sort, subjectId, schoolId, year]);

  const changeParam = (k: string, v?: string) => {
    const next = new URLSearchParams(sp);
    if (!v) next.delete(k);
    else next.set(k, v);
    if (k !== "page") next.set("page", "0");
    setSp(next, { replace: true });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    if (qInit) next.set("q", qInit);
    setSp(next, { replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Replace trang hiện tại khi mở tài liệu
  const handleOpen = async (doc: DocumentDTO) => {
    try {
      const view = await openDocument(doc.documentId);

      if (view?.viewerUrl) {
        const isAbsolute = /^https?:\/\//i.test(view.viewerUrl);
        const sameOrigin = isAbsolute
          ? view.viewerUrl.startsWith(window.location.origin)
          : true;
        if (!sameOrigin) {
          window.location.replace(view.viewerUrl);
          return;
        }
        navigate(viewerPath(view.viewerUrl, doc.documentId), {
          state: { doc: view },
          replace: true,
        });
        return;
      }

      navigate(`/documents/${doc.documentId}`, { state: { doc: view }, replace: true });
    } catch {
      navigate(`/documents/${doc.documentId}`, { replace: true });
    }
  };

  function viewerPath(urlOrPath: string, id: number) {
    try {
      const u = new URL(urlOrPath, window.location.origin);
      if (u.pathname && u.pathname !== "/") return u.pathname + u.search + u.hash;
    } catch {
      /* not absolute, treat as path */
    }
    return `/documents/${id}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 pt-[32px]">
      {/* Sticky search bar nằm ngay dưới Topbar, không để top-0 để tránh “dư” */}
      <div className="sticky top-0 z-10">
        {/* Lớp full-bleed chỉ để nền tràn mép, không ảnh hưởng sticky */}
        <div className="-mx-4 md:-mx-6 lg:-mx-8 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="px-4 md:px-6 lg:px-8 py-4">
            <form onSubmit={submitSearch} className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for courses, quizzes, or documents"
                className="w-full rounded-full bg-slate-100 py-3 pl-12 pr-4 text-sm text-slate-700 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>

            {/* chips + sort */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">All</span>

                {schoolId && (
                  <Chip
                    icon={<SchoolIcon sx={{ fontSize: 16 }} />}
                    label={`University • #${schoolId}`}
                    onClear={() => changeParam("schoolId")}
                  />
                )}
                {subjectId && (
                  <Chip
                    icon={<FolderIcon sx={{ fontSize: 16 }} />}
                    label={`Subject • #${subjectId}`}
                    onClear={() => changeParam("subjectId")}
                  />
                )}
                {year && (
                  <Chip
                    icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                    label={`Year • ${year}`}
                    onClear={() => changeParam("year")}
                  />
                )}

                {hasAnyFilter && (
                  <button
                    className="ml-1 text-sm text-blue-600 hover:underline"
                    onClick={clearAll}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                  type="button"
                >
                  <TuneIcon sx={{ fontSize: 18 }} /> Filters
                </button>

                <select
                  value={sort}
                  onChange={(e) => changeParam("sort", e.target.value)}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="uploadTime,desc">Most recent</option>
                  <option value="uploadTime,asc">Oldest</option>
                  <option value="title,asc">Title A–Z</option>
                  <option value="title,desc">Title Z–A</option>
                </select>
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-100" />
        </div>
      </div>

      {/* Body */}
      <div className="py-5">
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!loading && !err && (
          <>
            {resp?.content.length ? (
              <ul className="space-y-3">
                {resp.content.map((d) => (
                  <li
                    key={d.documentId}
                    className="rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow
                               ring-1 ring-transparent hover:ring-slate-200"
                  >
                    <a
                      href={`/documents/${d.documentId}`}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey || (e as any).button === 1) return;
                        e.preventDefault();
                        handleOpen(d);
                      }}
                      className="flex gap-3 p-3"
                    >
                      <DocThumbnail
                        docId={d.documentId}
                        width={200}
                        className="h-[100px] w-[140px] rounded-xl object-cover bg-slate-100"
                      />

                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-base font-medium text-slate-900 hover:text-blue-700"
                          title={d.title}
                        >
                          {d.title}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <FolderIcon sx={{ fontSize: 14 }} /> {d.subjectName || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <SchoolIcon sx={{ fontSize: 14 }} /> {d.userName || "Uploader"}
                          </span>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No results found.</div>
            )}
          </>
        )}

        {!!resp?.totalPages && resp.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-200"
              disabled={page <= 0}
              onClick={() => changeParam("page", String(page - 1))}
            >
              Prev
            </button>
            <div className="text-sm text-slate-600">
              Page <span className="font-medium">{page + 1}</span> / {resp.totalPages}
            </div>
            <button
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-200"
              disabled={page + 1 >= resp.totalPages}
              onClick={() => changeParam("page", String(page + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Chip “ghost” – không border đậm, nền nhẹ */
function Chip({
  icon,
  label,
  onClear,
}: {
  icon?: React.ReactNode;
  label: string;
  onClear?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      {icon} {label}
      {onClear && (
        <button
          className="ml-1 rounded-full px-1 text-slate-400 hover:text-slate-600"
          onClick={onClear}
          aria-label="Clear"
        >
          ×
        </button>
      )}
    </span>
  );
}
