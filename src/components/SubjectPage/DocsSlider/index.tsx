// src/pages/DocsSlider.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { DocumentDTO } from "@/services/document";
import ReadingCard from "@/components/HomeLayout/ContinueReading/ReadingCard";
import { getDocumentPdfBlob } from "@/services/document";
import { renderPdfFirstPageToDataUrl } from "@/utils/PdfThumb";

type Props = {
  title?: string;
  docs: DocumentDTO[];
  loading?: boolean;
  onOpen: (doc: DocumentDTO) => void;
  hasAnyDocs?: boolean;
  emptyText?: string;
  noMatchText?: string;
  perPage?: number; // mặc định 6 (số thẻ hiển thị mỗi viewport)
};

const GAP = 20; // px

/** Item con: render ReadingCard + tự fetch thumbnail PDF -> imageUrl */
const DocReadingCardItem: React.FC<{
  doc: DocumentDTO;
  onOpen: (doc: DocumentDTO) => void;
  thumbWidth?: number;
}> = ({ doc, onOpen, thumbWidth = 320 }) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const blob = await getDocumentPdfBlob(doc.documentId);
        const url = await renderPdfFirstPageToDataUrl(blob, thumbWidth);
        if (alive) setImgUrl(url);
      } catch {
        if (alive) setImgUrl(undefined); // ReadingCard sẽ fallback icon PDF
      }
    })();
    return () => {
      alive = false;
    };
  }, [doc.documentId, thumbWidth]);

  const category = doc.subjectName ? `${doc.subjectName} • ${doc.userName}` : doc.userName;

  return (
    <div role="button" className="cursor-pointer" onClick={() => onOpen(doc)} title={doc.title}>
      <ReadingCard title={doc.title || "Untitled"} category={category || ""} imageUrl={imgUrl} />
    </div>
  );
};

const DocsSlider: React.FC<Props> = ({
  title = "Trending",
  docs,
  loading = false,
  onOpen,
  hasAnyDocs = true,
  emptyText = "Chưa có tài liệu trong môn này.",
  noMatchText = "Không tìm thấy tài liệu phù hợp.",
  perPage = 6,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const recomputeNav = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const eps = 1;
    setCanPrev(scrollLeft > eps);
    setCanNext(scrollLeft + clientWidth < scrollWidth - eps);
  }, []);

  useEffect(() => {
    recomputeNav();
    const el = viewportRef.current;
    if (!el) return;

    const onScroll = () => recomputeNav();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => recomputeNav());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [docs.length, perPage, recomputeNav]);

  const scrollByOne = useCallback(
    (dir: "left" | "right") => {
      const el = viewportRef.current;
      if (!el) return;
      const cardWidth = (el.clientWidth - GAP * (perPage - 1)) / perPage;
      const step = cardWidth + GAP;
      el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
    },
    [perPage]
  );

  const skeletons = useMemo(() => Array.from({ length: Math.max(perPage, 1) }), [perPage]);

  return (
    <section className="mx-auto w-full px-4 py-6 select-none">
      <div className="flex items-center justify-between mb-3 pr-2">
        <h2 className="text-xl font-semibold">{title}</h2>

        <div className="flex gap-2">
          <button
            onClick={() => scrollByOne("left")}
            disabled={!canPrev}
            className={`rounded-full p-1 ${
              canPrev ? "text-blue-600 hover:bg-slate-50 ring-1 ring-slate-200" : "text-slate-300 cursor-not-allowed"
            }`}
            aria-label="scroll-left"
            type="button"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => scrollByOne("right")}
            disabled={!canNext}
            className={`rounded-full p-1 ${
              canNext ? "text-blue-600 hover:bg-slate-50 ring-1 ring-slate-200" : "text-slate-300 cursor-not-allowed"
            }`}
            aria-label="scroll-right"
            type="button"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {!loading && !hasAnyDocs ? (
        <div className="mt-2 text-sm text-slate-500">{emptyText}</div>
      ) : !loading && hasAnyDocs && docs.length === 0 ? (
        <div className="mt-2 text-sm text-slate-500">{noMatchText}</div>
      ) : (
        <>
          <div
            ref={viewportRef}
            className="overflow-x-auto w-full [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none]"
            style={{ ["--cards" as any]: perPage, ["--gap" as any]: `${GAP}px` }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

            <div className="flex gap-[var(--gap)] no-scrollbar">
              {(loading ? skeletons : docs).map((it: any, idx: number) => {
                const d = it as DocumentDTO;
                return (
                  <div
                    key={loading ? `s-${idx}` : d.documentId}
                    className="[scroll-snap-align:start] transition-[flex-basis] duration-300 ease-in-out"
                    style={{
                      flex: `0 0 calc((100% - (var(--cards) - 1) * var(--gap)) / var(--cards))`,
                    }}
                  >
                    {loading ? (
                      <div className="h-80 w-full bg-gray-100 rounded-xl animate-pulse" />
                    ) : (
                      <DocReadingCardItem doc={d} onOpen={onOpen} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!loading && docs.length === 0 && (
            <div className="text-sm text-gray-500 mt-3">{noMatchText}</div>
          )}
        </>
      )}
    </section>
  );
};

export default DocsSlider;
