import React from "react";

type Props = {
  page: number;
  total: number;
  zoomPct: number; // 0..100
  fitWidth: boolean;
  show: boolean;
  pdfUrl?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFit: () => void;
  onHoverChange?: (v: boolean) => void;
};

const PdfFloatingControls: React.FC<Props> = ({
  page, total, zoomPct, fitWidth, show, pdfUrl,
  onPrev, onNext, onZoomIn, onZoomOut, onToggleFit,
  onHoverChange,
}) => {
  return (
    <div className="sticky bottom-6 left-0 right-0 z-30 pointer-events-none">
      <div className="w-full flex justify-center">
        <div
          className={`transition-opacity duration-200 ${
            show ? "opacity-100" : "opacity-0"
          } pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2 bg-gray-900/90 text-white shadow-xl`}
          onMouseEnter={() => onHoverChange?.(true)}
          onMouseLeave={() => onHoverChange?.(false)}
        >
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10" onClick={onPrev} title="Previous page">↑</button>
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10" onClick={onNext} title="Next page">↓</button>

          <div className="text-sm tabular-nums">
            {page} <span className="opacity-70">/ {total}</span>
          </div>

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10" onClick={onZoomOut} title="Zoom out">−</button>
          <div className="text-sm w-14 text-center tabular-nums">{zoomPct}%</div>
          <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10" onClick={onZoomIn} title="Zoom in">＋</button>

          <button
            className={`px-3 h-9 rounded-full text-sm ${fitWidth ? "bg-white text-gray-900" : "bg-white/10"}`}
            onClick={onToggleFit}
            title="Fit width"
          >
            Fit width
          </button>

          {pdfUrl && (
            <>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <a
                href={pdfUrl}
                download
                className="px-3 h-9 rounded-full bg-emerald-500 text-white text-sm hover:bg-emerald-600 grid place-items-center"
              >
                Download
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfFloatingControls;
