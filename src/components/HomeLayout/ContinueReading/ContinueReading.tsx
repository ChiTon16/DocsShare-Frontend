import React, { useEffect, useRef, useState, useCallback } from "react";
import ReadingCard from "./ReadingCard";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "@/context/AuthContext";
import {
  getContinueReading,
  type ContinueItem,
  getThumbnailObjectUrl,
} from "@/services/reading";
import { openDocument } from "@/services/document"; // NEW
import { useNavigate } from "react-router-dom"; // NEW

const CARDS = 6;
const GAP = 20;

const ContinueReading: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { user, authReady, fetchingUser } = useAuth();
  const navigate = useNavigate(); // NEW

  const userId: number | null =
    (user as any)?.id ??
    (user as any)?.userId ??
    (user as any)?.uid ??
    null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});

  const scrollByOne = useCallback((dir: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const cardWidth = (el.clientWidth - GAP * (CARDS - 1)) / CARDS;
    const step = cardWidth + GAP;
    el.scrollBy({
      left: dir === "right" ? step : -step,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (!authReady || fetchingUser) return;

    if (!userId) {
      setItems([]);
      setThumbs({});
      setLoading(false);
      setErr(null);
      return;
    }

    (async () => {
      // revoke urls cũ
      Object.values(thumbs).forEach((u) => URL.revokeObjectURL(u));
      setThumbs({});

      try {
        setLoading(true);
        setErr(null);

        const list = await getContinueReading(userId);
        setItems(list);

        const urls: Record<number, string> = {};
        await Promise.all(
          list.map(async (it) => {
            try {
              const url = await getThumbnailObjectUrl(it.documentId, 1, 400);
              urls[it.documentId] = url;
            } catch {
              // bỏ qua lỗi từng thumbnail
            }
          }),
        );
        setThumbs(urls);
      } catch (e: any) {
        setErr(e?.message || "Load continue reading failed");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      Object.values(thumbs).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, fetchingUser, userId]);

  // NEW: click handler mở tài liệu (an toàn, không lệ thuộc viewerUrl từ server)
  // ✅ Nhận cả item để lấy lastPage/percent
  const handleOpen = useCallback(
    async (it: ContinueItem) => {
      try {
        const dto = await openDocument(it.documentId);
        // Ưu tiên đi thẳng bằng URL ?page=
        const page =
          typeof it.lastPage === "number" && it.lastPage > 0
            ? it.lastPage
            : undefined;

        // Khóa path theo docId, tự gắn ?page nếu có
        const path = page
          ? `/viewer/${it.documentId}?page=${page}`
          : `/viewer/${it.documentId}`;

        // Truyền thêm hint vào state để fallback nếu cần
        navigate(path, {
          state: {
            doc: {
              ...dto,
              id: it.documentId,
              lastPage: it.lastPage ?? null,
              percent: it.percent ?? null,
            },
          },
        });
      } catch (e: any) {
        setErr(e?.message || "Không mở được tài liệu");
      }
    },
    [navigate],
  );

  const skeletons = Array.from({ length: CARDS });

  return (
    <div className="relative w-full">
      <div className="flex justify-between items-center mb-3 pr-2">
        <h2 className="text-lg font-semibold">Continue reading</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scrollByOne("left")}
            className="text-blue-500 hover:text-blue-700 rounded-full p-1"
            aria-label="scroll-left"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => scrollByOne("right")}
            className="text-blue-500 hover:text-blue-700 rounded-full p-1"
            aria-label="scroll-right"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

      <div
        ref={viewportRef}
        className="overflow-x-auto w-full [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none]"
        style={
          {
            ["--cards" as any]: CARDS,
            ["--gap" as any]: `${GAP}px`,
          } as React.CSSProperties
        }
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        <div className="flex gap-[var(--gap)] no-scrollbar">
          {(loading ? skeletons : items).map((it: any, idx: number) => (
            <div
              key={loading ? `s-${idx}` : it.documentId}
              className="[scroll-snap-align:start] transition-[flex-basis] duration-300 ease-in-out"
              style={{
                flex: "0 0 calc((100% - (var(--cards) - 1) * var(--gap)) / var(--cards))",
              }}
            >
              {loading ? (
                <div className="h-80 w-full bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <div
                  role="button"
                  onClick={() => handleOpen(it)} // NEW
                  className="cursor-pointer"
                >
                  <ReadingCard
                    title={it.title}
                    category={`${it.percent ?? 0}% • page ${it.lastPage ?? 1}`}
                    imageUrl={thumbs[it.documentId]}
                  />
                </div>
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
