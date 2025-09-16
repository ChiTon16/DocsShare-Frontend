import DescriptionIcon from "@mui/icons-material/Description";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import clsx from "clsx";
import type { DocumentDTO } from "@/services/document";

type Props = {
  doc: DocumentDTO;
  onOpen: (doc: DocumentDTO) => void;
};

function academicYear(uploadTime?: string | null) {
  if (!uploadTime) return "";
  const d = new Date(uploadTime);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  // nếu từ tháng 6 trở đi coi là năm học y/(y+1); ngược lại (y-1)/y
  return m >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

export default function DocRow({ doc, onOpen }: Props) {
  const year = academicYear(doc.uploadTime);
  // nếu sau này DTO có pageCount, upvoteCount thì thay thế 2 dòng dưới
  const pages = (doc as any).pageCount as number | undefined;
  const ratingText =
    (doc as any).upvoteCount != null ? `${(doc as any).upvoteCount}%` : "None";

  return (
    <div
      role="button"
      onClick={() => onOpen(doc)}
      className={clsx(
        "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white",
        "px-4 py-3 hover:bg-slate-50 transition-colors"
      )}
    >
      {/* thumbnail placeholder */}
      <div className="h-[84px] w-[112px] rounded-xl bg-slate-100 grid place-items-center">
        <DescriptionIcon className="text-slate-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-sky-600 hover:underline">
          {doc.title}
        </div>
        <div className="mt-1 text-sm text-slate-500 flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <DescriptionIcon fontSize="inherit" className="text-slate-400" />
            {pages != null ? `${pages} pages` : "— pages"}
          </span>
        </div>
      </div>

      <div className="hidden sm:block w-32 text-sm text-slate-600">{year || "—"}</div>
      <div className="hidden sm:block w-24 text-sm text-slate-600">{ratingText}</div>

      <ChevronRightIcon className="text-slate-400" />
    </div>
  );
}
