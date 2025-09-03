import { useRef, useEffect, useState, useCallback } from "react";
import ViewedCard from "./ViewCard";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const recentlyViewedItems = [
  { title: "English", documents: "6,876 documents", isFollowing: true },
  { title: "Triết học Mác – Lê nin", subtitle: "POLI1304", documents: "1,008 documents", isFollowing: false },
  { title: "English", documents: "6,876 documents", isFollowing: true },
  { title: "Triết học Mác – Lê nin", subtitle: "POLI1304", documents: "1,008 documents", isFollowing: false },
  { title: "English", documents: "6,876 documents", isFollowing: true },
  { title: "Triết học Mác – Lê nin", subtitle: "POLI1304", documents: "1,008 documents", isFollowing: false },
  { title: "English", documents: "6,876 documents", isFollowing: true },
  { title: "Triết học Mác – Lê nin", subtitle: "POLI1304", documents: "1,008 documents", isFollowing: false },
];

const CARDS = 6;     // số card hiển thị cùng lúc
const GAP = 20;      // khoảng cách giữa các card (px)

const RecentlyViewed = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanLeft(scrollLeft > 0);
    // +1 để tránh lỗi làm tròn
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    updateArrows();
    const onScroll = () => updateArrows();
    const ro = new ResizeObserver(updateArrows);
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateArrows]);

  const scrollByOne = (dir: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const cardWidth = (el.clientWidth - GAP * (CARDS - 1)) / CARDS;
    const step = cardWidth + GAP;
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pr-2">
        <h2 className="text-lg font-semibold">Recently viewed</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scrollByOne("left")}
            className="text-blue-500 hover:text-blue-700 rounded-full p-1 disabled:text-gray-300"
            disabled={!canLeft}
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => scrollByOne("right")}
            className="text-blue-500 hover:text-blue-700 rounded-full p-1 disabled:text-gray-300"
            disabled={!canRight}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="
          overflow-x-auto w-full
          [scroll-snap-type:x_mandatory]
          [scrollbar-width:none] [-ms-overflow-style:none]
        "
        style={{ ["--cards" as any]: CARDS, ["--gap" as any]: `${GAP}px` }}
      >
        {/* Ẩn scrollbar webkit */}
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        {/* Track */}
        <div className="flex gap-[var(--gap)] no-scrollbar">
          {recentlyViewedItems.map((item, idx) => (
            <div
              key={idx}
              className="
                [scroll-snap-align:start]
                transition-[flex-basis] duration-300 ease-in-out
              "
              style={{
                flex: `0 0 calc((100% - (var(--cards) - 1) * var(--gap)) / var(--cards))`,
              }}
            >
              <ViewedCard
                title={item.title}
                subtitle={item.subtitle}
                documents={item.documents}
                isFollowing={item.isFollowing}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentlyViewed;
