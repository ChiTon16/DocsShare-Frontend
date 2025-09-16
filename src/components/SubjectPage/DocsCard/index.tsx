// src/components/SubjectPage/DocsCard.tsx
import DescriptionIcon from "@mui/icons-material/Description";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { DocumentDTO } from "@/services/document";

export default function DocsCard({ doc, onOpen }: { doc: DocumentDTO; onOpen: (d: DocumentDTO)=>void }) {
  return (
    <div className="group w-full select-none">
      <div
        role="button"
        onClick={() => onOpen(doc)}
        className="relative w-full h-44 rounded-2xl ring-1 ring-slate-200/60 bg-slate-100 overflow-hidden"
      >
        <div className="flex h-full w-full items-center justify-center">
          <DescriptionIcon className="text-slate-400" fontSize="large" />
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(doc); }}
          className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-600 ring-1 ring-slate-200 hover:bg-white"
        >
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>

      <div className="mt-2">
        <div className="line-clamp-1 font-medium" title={doc.title}>{doc.title}</div>
        {doc.subjectName && (
          <div className="text-sm text-slate-500 line-clamp-1" title={doc.subjectName}>
            {doc.subjectName}
          </div>
        )}
      </div>
    </div>
  );
}
