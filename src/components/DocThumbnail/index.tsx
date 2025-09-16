import React, { useEffect, useState } from "react";
import { getDocumentPdfBlob } from "@/services/document";
import { renderPdfFirstPageToDataUrl } from "@/utils/PdfThumb";

type Props = {
  docId: number;
  className?: string;        // ví dụ: "h-16 w-20 rounded-lg object-cover"
  width?: number;            // px, mặc định 160
};

const DocThumbnail: React.FC<Props> = ({ docId, className, width = 160 }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(false);
        const blob = await getDocumentPdfBlob(docId);
        const dataUrl = await renderPdfFirstPageToDataUrl(blob, width);
        if (alive) setSrc(dataUrl);
      } catch {
        if (alive) setErr(true);
      }
    })();
    return () => { alive = false; };
  }, [docId, width]);

  if (src) {
    return <img src={src} alt="" className={className ?? "h-16 w-20 rounded-lg object-cover"} />;
  }

  // Fallback khi đang load / lỗi
  return (
    <div className={["grid place-items-center bg-slate-200 text-xs text-slate-600",
                    className ?? "h-16 w-20 rounded-lg"].join(" ")}>
      {err ? "No preview" : "PDF"}
    </div>
  );
};

export default DocThumbnail;
