import React, { useEffect, useRef, useState, useCallback } from "react";
import ReadingCard from "./ReadingCard";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "@/context/AuthContext";
import { getContinueReading, type ContinueItem, getThumbnailObjectUrl } from "@/services/reading";

const CARDS = 6;
const GAP = 20;

const ContinueReading: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { user, authReady, fetchingUser } = useAuth();

  // Hỗ trợ nhiều key id khác nhau
  const userId: number | null =
    (user as any)?.id ??
    (user as any)?.userId ??
    (user as any)?.uid ??
    null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({}); // documentId -> objectURL

  const scrollByOne = useCallback((dir: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const cardWidth = (el.clientWidth - GAP * (CARDS - 1)) / CARDS;
    const step = cardWidth + GAP;
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    console.debug("[ContinueReading] user from context =", user);
  }, [user]);

  useEffect(() => {
    if (!authReady || fetchingUser) return;

    if (!userId) {
      setItems([]);
      setThumbs({});
      setLoading(false);
      setErr(null);
      console.warn("[ContinueReading] Missing userId from context");
      return;
    }

    (async () => {
      // cleanup URL cũ trước khi load mới
      Object.values(thumbs).forEach((u) => URL.revokeObjectURL(u));
      setThumbs({});

      try {
        setLoading(true);
        setErr(null);
        const list = await getContinueReading(userId);
        setItems(list);

        // tải song song ảnh thumb
        const urls: Record<number, string> = {};
        await Promise.all(
          list.map(async (it) => {
            try {
              const url = await getThumbnailObjectUrl(it.documentId, 1, 400);
              urls[it.documentId] = url;
            } catch (e) {
              console.warn("thumbnail error for doc", it.documentId, e);
            }
          })
        );

        setThumbs(urls);
      } catch (e: any) {
        console.error("[ContinueReading] load error:", e);
        setErr(e?.message || "Load continue reading failed");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();

    // cleanup khi unmount
    return () => {
      Object.values(thumbs).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, fetchingUser, userId]);

  const skeletons = Array.from({ length: CARDS });

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pr-2">
        <h2 className="text-lg font-semibold">Continue reading</h2>
        <div className="flex gap-2">
          <button onClick={() => scrollByOne("left")} className="text-blue-500 hover:text-blue-700 rounded-full p-1" aria-label="scroll-left">
            <ChevronLeftIcon />
          </button>
          <button onClick={() => scrollByOne("right")} className="text-blue-500 hover:text-blue-700 rounded-full p-1" aria-label="scroll-right">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

      <div
        ref={viewportRef}
        className="overflow-x-auto w-full [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ ["--cards" as any]: CARDS, ["--gap" as any]: `${GAP}px` }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        <div className="flex gap-[var(--gap)] no-scrollbar">
          {(loading ? skeletons : items).map((it: any, idx: number) => (
            <div
              key={loading ? `s-${idx}` : it.documentId}
              className="[scroll-snap-align:start] transition-[flex-basis] duration-300 ease-in-out"
              style={{
                flex: `0 0 calc((100% - (var(--cards) - 1) * var(--gap)) / var(--cards))`,
              }}
            >
              {loading ? (
                <div className="h-80 w-full bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <ReadingCard
                  title={it.title}
                  category={`${it.percent ?? 0}% • page ${it.lastPage ?? 1}`}
                  imageUrl={thumbs[it.documentId]} // object URL đã kèm token khi fetch
                />
              )}
            </div>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-500 mt-3">
            {userId ? "Chưa có mục đang đọc." : "Bạn chưa đăng nhập."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinueReading;
