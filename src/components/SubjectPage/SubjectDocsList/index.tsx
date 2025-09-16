// src/pages/SubjectDocsList.tsx
import { useMemo, useState } from "react";
import type { DocumentDTO } from "@/services/document";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DocThumbnail from "@/components/DocThumbnail";

type Props = {
  title?: string;
  docs: DocumentDTO[];
  loading?: boolean;
  onOpen: (doc: DocumentDTO) => void;
};

type SortKey = "date" | "rating";

export default function SubjectDocsList({
  title = "Lecture notes",
  docs,
  loading = false,
  onOpen,
}: Props) {
  const [sort, setSort] = useState<SortKey>("date");
  const [visible, setVisible] = useState<number>(10); // hiển thị ban đầu
  const STEP = 8;

  const sorted = useMemo(() => {
    const arr = [...(docs ?? [])];
    if (sort === "date") {
      arr.sort((a, b) => {
        const ta = new Date(a.uploadTime ?? 0).getTime();
        const tb = new Date(b.uploadTime ?? 0).getTime();
        return tb - ta; // mới nhất trước
      });
    } else {
      // rating – nếu có upvoteCount thì dùng, không có thì = 0
      arr.sort((a: any, b: any) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0));
    }
    return arr;
  }, [docs, sort]);

  const show = sorted.slice(0, visible);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      {/* header */}
      <div className="mb-3 flex items-center gap-6">
        <h2 className="text-xl font-semibold">{title}</h2>

        <div className="flex items-center gap-6 text-sm">
          <button
            className={`relative pb-1 ${
              sort === "date" ? "text-sky-600 font-medium" : "text-slate-600"
            }`}
            onClick={() => setSort("date")}
          >
            Date
            {sort === "date" && (
              <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-sky-600 rounded-full" />
            )}
          </button>

          <button
            className={`relative pb-1 ${
              sort === "rating" ? "text-sky-600 font-medium" : "text-slate-600"
            }`}
            onClick={() => setSort("rating")}
          >
            Rating
            {sort === "rating" && (
              <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-sky-600 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[110px] rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-sm text-slate-500">Chưa có tài liệu.</div>
      ) : (
        <>
          <div className="space-y-3">
            {show.map((d) => (
              <div
                key={d.documentId}
                className="flex items-center gap-4 rounded-2xl p-3 hover:bg-slate-50 transition"
              >
                {/* Thumbnail PDF */}
                <DocThumbnail
                  docId={d.documentId}
                  className="h-16 w-20 rounded-lg object-cover"
                  width={220}
                />

                {/* Info */}
                <div className="flex-1">
                  <button
                    onClick={() => onOpen(d)}
                    className="text-blue-700 hover:underline font-medium text-left"
                    title={d.title}
                  >
                    {d.title || "Untitled"}
                  </button>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {d.subjectName ? `${d.subjectName} • ${d.userName}` : d.userName}
                  </div>
                </div>

                {/* Actions (tuỳ bạn thêm sau) */}
                {/* <div className="flex items-center gap-2">
                  ...
                </div> */}
              </div>
            ))}
          </div>

          {/* footer buttons */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible < docs.length && (
              <button
                onClick={() => setVisible((v) => Math.min(v + STEP, docs.length))}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Show {Math.min(STEP, docs.length - visible)} more documents
                <ExpandMoreIcon fontSize="small" />
              </button>
            )}

            {visible < docs.length && (
              <button
                onClick={() => setVisible(docs.length)}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Show all {docs.length} documents
                <ExpandMoreIcon fontSize="small" />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
