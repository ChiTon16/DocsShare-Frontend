// src/pdfjs-setup.ts
import * as pdfjs from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

// bắt buộc cho pdf.js
(pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

export default pdfjs;
