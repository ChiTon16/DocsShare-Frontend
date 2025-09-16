import React, { useEffect, useState } from "react";
import { addToPlan, removeFromPlan, type StudyPlan } from "@/services/studyPlan";
import { useToast } from "@/components/Toast/UseToast";
import CreateStudylistModal from "@/components/Models/CreateStudylistModal";

type Props = {
  open: boolean;
  onClose: () => void;
  plans: StudyPlan[];                 // từ parent (load lần đầu)
  selected: Set<number>;
  onLocalSelectChange: (next: Set<number>) => void;
  documentId: number;
  loadingPlans?: boolean;
};

const SaveToStudylistModal: React.FC<Props> = ({
  open,
  onClose,
  plans,
  selected,
  onLocalSelectChange,
  documentId,
  loadingPlans,
}) => {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [openCreate, setOpenCreate] = useState(false);

  // 👉 local copy để có thể chèn plan mới ngay lập tức
  const [localPlans, setLocalPlans] = useState<StudyPlan[]>(plans);
  useEffect(() => {
    if (open) setLocalPlans(plans); // mỗi lần mở lại đồng bộ với props mới nhất
  }, [open, plans]);

  if (!open) return null;

  const toggle = async (plan: StudyPlan, nextChecked: boolean) => {
    const prev = new Set(selected);
    const next = new Set(selected);
    if (nextChecked) next.add(plan.id); else next.delete(plan.id);
    onLocalSelectChange(next);
    setBusy((s) => new Set(s).add(plan.id));
    try {
      if (nextChecked) {
        await addToPlan(plan.id, documentId);
        showToast({ message: `Đã thêm tài liệu vào ${plan.name}.`, href: `/study-plans/${plan.id}`, variant: "success", duration: 3500 });
      } else {
        await removeFromPlan(plan.id, documentId);
        showToast({ message: `Đã gỡ tài liệu khỏi ${plan.name}.`, href: `/study-plans/${plan.id}`, variant: "info", duration: 3000 });
      }
    } catch {
      onLocalSelectChange(prev);
      showToast({ message: "Không thể lưu thay đổi. Vui lòng thử lại.", variant: "error" });
    } finally {
      setBusy((s) => { const n = new Set(s); n.delete(plan.id); return n; });
    }
  };

  return (
    <>
      {/* Modal pick */}
      <div className="fixed inset-0 z-[9998] grid place-items-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-w-[92vw] p-6 md:p-7">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-2xl font-bold tracking-tight">Save to a Studylist</h3>
            <button onClick={onClose} className="inline-grid place-items-center h-9 w-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black transition" aria-label="Close">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {loadingPlans ? (
            <div className="text-gray-500 h-28 grid place-items-center">Loading…</div>
          ) : (
            <>
              <div className="space-y-2">
                {localPlans.map((p) => {
                  const checked = selected.has(p.id);
                  const disabled = busy.has(p.id);
                  return (
                    <label key={p.id} className={`group flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-gray-50 transition ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
                      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => toggle(p, e.target.checked)} />
                      <span className={["relative h-5 w-5 rounded-[6px] border-2 grid place-items-center","border-gray-300 transition-colors","peer-checked:bg-blue-600 peer-checked:border-blue-600","group-hover:ring-2 group-hover:ring-blue-100",].join(" ")}>
                        <svg viewBox="0 0 20 20" className="absolute inset-0 m-auto h-3.5 w-3.5 text-white opacity-0 scale-95 peer-checked:opacity-100 peer-checked:scale-100 transition" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-[15px] text-gray-800">{p.name}</span>
                      {disabled && (
                        <svg className="ml-auto h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
                          <path d="M21 12a9 9 0 00-9-9" strokeOpacity="0.9" />
                        </svg>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="mt-4">
                <button onClick={() => setOpenCreate(true)} className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-medium px-4 py-2 rounded-xl transition">
                  <span className="text-lg leading-none">+</span>
                  Create new Studylist
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal create */}
      <CreateStudylistModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={async (p) => {
          // 1) chèn plan mới vào danh sách hiển thị ngay
          setLocalPlans((prev) => {
            // tránh trùng nếu backend trả trùng id
            const filtered = prev.filter((x) => x.id !== p.id);
            return [{ id: p.id, name: p.name }, ...filtered]; // hoặc push cuối tuỳ UX
          });
          // 2) tick và add tài liệu hiện tại
          const next = new Set(selected);
          next.add(p.id);
          onLocalSelectChange(next);
          await addToPlan(p.id, documentId);
          // 3) đóng modal tạo → tự quay về modal chọn
          setOpenCreate(false);
        }}
      />
    </>
  );
};

export default SaveToStudylistModal;
