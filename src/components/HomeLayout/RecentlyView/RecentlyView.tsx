// src/components/RecentlyViewed/index.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import ViewedCard from "./ViewCard"; // = ReadingCard phiên bản cho “viewed”
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "@/context/AuthContext";
import { getRecentSubjects, type RecentSubjectItem } from "@/services/recentSubjects";
import { useNavigate } from "react-router-dom";

const CARDS = 6;
const GAP = 20;

const RecentlyViewed: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { user, authReady, fetchingUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RecentSubjectItem[]>([]);

  const scrollByOne = useCallback((dir: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const cardWidth = (el.clientWidth - GAP * (CARDS - 1)) / CARDS;
    const step = cardWidth + GAP;
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!authReady || fetchingUser) return;

    if (!user) {
      setItems([]);
      setLoading(false);
      setErr(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const list = await getRecentSubjects(CARDS);
        setItems(list);
      } catch (e: any) {
        setErr(e?.message || "Load recently viewed failed");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [authReady, fetchingUser, user]);

  const skeletons = Array.from({ length: CARDS });

  // helper: format “6,876 documents”
  const fmtDocs = (n?: number) =>
    typeof n === "number" ? `${n.toLocaleString()} documents` : "0 documents";

  const openSubject = (it: RecentSubjectItem) => {
    navigate(`/subjects/${it.subjectId}`, {
      state: { subjectName: it.subjectName, subjectCode: it.subjectCode },
    });
  };

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pr-2">
        <h2 className="text-lg font-semibold">Recently viewed</h2>
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
        style={{ ["--cards" as any]: CARDS, ["--gap" as any]: `${GAP}px` }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        <div className="flex gap-[var(--gap)] no-scrollbar">
          {(loading ? skeletons : items).map((it: any, idx: number) => (
            <div
              key={loading ? `s-${idx}` : it.subjectId}
              className="[scroll-snap-align:start] transition-[flex-basis] duration-300 ease-in-out"
              style={{
                flex: `0 0 calc((100% - (var(--cards) - 1) * var(--gap)) / var(--cards))`,
              }}
            >
              {loading ? (
                <div className="h-44 w-full bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open course ${it.subjectName}`}
                  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                  onClick={() => openSubject(it)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openSubject(it);
                    }
                  }}
                >
                  <ViewedCard
                    title={it.subjectName}
                    subtitle={it.subjectCode || undefined}
                    documents={fmtDocs(it.totalDocsInSubject)}
                    isFollowing={it.following}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className="text-sm text-gray-500 mt-3">
            {user ? "Chưa có môn nào bạn vừa xem." : "Bạn chưa đăng nhập."}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyViewed;
