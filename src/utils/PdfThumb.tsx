// src/utils/pdfThumb.ts
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

// Cấu hình worker cho Vite
GlobalWorkerOptions.workerSrc = workerSrc;

/** Render trang đầu PDF thành dataURL PNG */
export async function renderPdfFirstPageToDataUrl(
  pdfBlob: Blob,
  targetWidth = 220
): Promise<string> {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);
  const vp1 = page.getViewport({ scale: 1 });
  const scale = targetWidth / vp1.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL("image/png");

  // cleanup
  canvas.width = 0;
  canvas.height = 0;
  pdf.cleanup();
  loadingTask.destroy();

  return dataUrl;
}
