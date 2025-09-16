import React, { useEffect, useRef, useState } from "react";
import type { RenderTask } from "pdfjs-dist/types/src/display/api";

type PDoc = import("pdfjs-dist").PDFDocumentProxy;
type PPage = import("pdfjs-dist").PDFPageProxy;

const CANVAS_MARGIN_ALL = 24; // m-6
const WRAPPER_MB = 24;        // mb-6

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const PageCanvas: React.FC<{
  pdf: PDoc;
  num: number;
  containerEl: HTMLElement | null;
  fitWidth: boolean;
  zoom: number;
  estCanvasHeight?: number | null;
  minZoom?: number;
  maxZoom?: number;
}> = ({
  pdf,
  num,
  containerEl,
  fitWidth,
  zoom,
  estCanvasHeight,
  minZoom = 0.1,
  maxZoom = 2.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(num <= 2);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    if (!containerEl || !wrapperRef.current) return;
    const io = new IntersectionObserver(([ent]) => setVisible(ent.isIntersecting), {
      root: containerEl,
      threshold: 0.05,
    });
    io.observe(wrapperRef.current);
    return () => io.disconnect();
  }, [containerEl]);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    let aborted = false;
    let pageObj: PPage | null = null;

    (async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }

      pageObj = await pdf.getPage(num);
      if (aborted) return;

      let scale = zoom;
      if (fitWidth && containerEl) {
        const vp1 = pageObj.getViewport({ scale: 1 });
        const cs = getComputedStyle(containerEl);
        const pl = parseFloat(cs.paddingLeft || "0");
        const pr = parseFloat(cs.paddingRight || "0");
        const W = containerEl.clientWidth - pl - pr;
        const sideGaps = CANVAS_MARGIN_ALL * 2;
        const avail = Math.max(0, W - sideGaps);
        scale = clamp(avail / vp1.width, minZoom, maxZoom);
      }

      const viewport = pageObj.getViewport({ scale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const task = pageObj.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error(err);
      } finally {
        renderTaskRef.current = null;
        try { pageObj?.cleanup?.(); } catch {}
      }
    })();

    return () => {
      aborted = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [pdf, num, containerEl, fitWidth, zoom, visible, minZoom, maxZoom]);

  const wrapperMinH = estCanvasHeight
    ? estCanvasHeight + CANVAS_MARGIN_ALL * 2
    : undefined;

  return (
    <div
      ref={wrapperRef}
      className="mb-6 bg-white shadow-2xl rounded-md overflow-hidden"
      data-page={num}
      style={wrapperMinH ? { minHeight: wrapperMinH } : undefined}
    >
      <canvas ref={canvasRef} className="block rounded-md m-6" />
    </div>
  );
};

export default PageCanvas;
export { CANVAS_MARGIN_ALL, WRAPPER_MB };
