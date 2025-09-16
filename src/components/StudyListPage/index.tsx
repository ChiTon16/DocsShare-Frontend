// src/pages/StudyPlan/StudyPlanPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "@/context/AuthContext";
import {
  getMyPlans,
  getPlanItems,
  removeFromPlan,
  type StudyPlan,
  type StudyPlanItem,
} from "@/services/studyPlan";
import { openDocument } from "@/services/document";
import DocThumbnail from "@/components/DocThumbnail";

// ⛏️ default import SVG -> URL string
import folderUrl from "@/assets/svg/folder.svg";

export default function StudyPlanPage() {
  const { id } = useParams<{ id: string }>();
  const planId = useMemo(() => Number(id ?? 0), [id]);
  const navigate = useNavigate();
  const { authReady, user } = useAuth();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [items, setItems] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Tên hiển thị của user (fallback thông dụng)
  const displayUserName =
    (user as any)?.name ??
    (user as any)?.username ??
    (user as any)?.fullName ??
    "You";

  useEffect(() => {
    if (!planId) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const [plans, its] = await Promise.all([getMyPlans(), getPlanItems(planId)]);
        const found = (plans ?? []).find((p) => p.id === planId) || null;

        if (!alive) return;
        setPlan(found);
        setItems(Array.isArray(its) ? its : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [planId]);

  const filtered = useMemo(() => {
    const norm = (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
    const q = norm(query.trim());
    if (!q) return items;
    return items.filter((i) => {
      const title = norm(i.title || "");
      const subj = norm(i.subjectName || "");
      return title.includes(q) || subj.includes(q);
    });
  }, [items, query]);

  const openDoc = async (docId: number) => {
    try {
      const v = await openDocument(docId);
      if (v?.viewerUrl) window.open(v.viewerUrl, "_blank");
      else navigate(`/documents/${docId}`, { state: { doc: v } });
    } catch {
      navigate(`/documents/${docId}`);
    }
  };

  const onRemove = async (it: StudyPlanItem) => {
    const prev = items;
    setItems((s) => s.filter((x) => x.documentId !== it.documentId));
    try {
      await removeFromPlan(planId, it.documentId);
    } catch {
      setItems(prev); // rollback nếu lỗi
    }
  };

  if (!authReady) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <section className="bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-500 p-3 text-white">
                {/* ✅ Dùng <img> vì folderUrl là URL string */}
                <img src={folderUrl} alt="" className="h-8 w-8" />
              </div>
              <div>
                {/* "{Studylist name} by {User name}" */}
                <h1 className="text-2xl font-bold">
                  {(plan?.name || "Studylist") + " by " + displayUserName}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-700">
                  <div className="inline-flex items-center gap-2">
                    <DescriptionIcon fontSize="small" />
                    <span className="font-medium">
                      {items.length.toLocaleString()}
                    </span>
                    <span className="text-slate-500">documents</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search in studylist */}
            <div className="w-full max-w-md">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <SearchIcon className="text-slate-400" fontSize="small" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-slate-300 bg-white pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Find in ${plan?.name || "this studylist"}`}
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
                  ? `${filtered.length} / ${items.length} documents`
                  : `${items.length} documents`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">Không có tài liệu nào.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => (
              <div
                key={it.id ?? it.documentId}
                className="flex items-center gap-4 rounded-2xl p-3 hover:bg-slate-50 transition"
              >
                {/* THUMBNAIL */}
                <DocThumbnail docId={it.documentId} className="h-16 w-20 rounded-lg object-cover" />

                <div className="flex-1">
                  <button
                    onClick={() => openDoc(it.documentId)}
                    className="text-blue-700 hover:underline font-medium"
                  >
                    {it.title ?? "Untitled"}
                  </button>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {it.subjectName
                      ? `${it.subjectName} • ${it.userName ?? ""}`
                      : it.userName ?? ""}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button className="text-xs rounded-full border px-3 py-1 hover:bg-slate-100">
                      Flashcard
                    </button>
                    <button className="text-xs rounded-full border px-3 py-1 hover:bg-slate-100">
                      Quiz
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRemove(it)}
                    className="rounded-full border px-3 py-1 text-sm hover:bg-slate-100 text-slate-600"
                    title="Remove from studylist"
                  >
                    Remove
                  </button>
                  <div className="rounded-full border px-3 py-1 text-sm text-green-600 border-green-200">
                    Saved
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
