import React, { useState, useEffect } from "react";
import { createPlan } from "@/services/studyPlan";
import { useToast } from "@/components/Toast/UseToast";

type Props = {
  open: boolean;
  onClose: () => void;
  /** gọi khi tạo thành công, trả về plan mới */
  onCreated?: (plan: { id: number; name: string }) => void;
  /** mặc định trống, có thể truyền sẵn name/desc khi dùng ở trang khác */
  defaultName?: string;
  defaultDescription?: string;
};

const CreateStudylistModal: React.FC<Props> = ({
  open,
  onClose,
  onCreated,
  defaultName = "",
  defaultDescription = "",
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState(defaultName);
  const [desc, setDesc] = useState(defaultDescription);
  const [busy, setBusy] = useState(false);

  // reset khi mở/đóng
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setDesc(defaultDescription);
    }
  }, [open, defaultName, defaultDescription]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      // Nếu API mới chỉ nhận name, mở rộng createPlan(name, description?)
      const p = await createPlan(name.trim());
      showToast({ message: `Đã tạo "${p.name}".`, variant: "success", duration: 3000 });
      onCreated?.(p);
      onClose();
    } catch (e) {
      showToast({ message: "Tạo studylist thất bại.", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-w-[92vw] p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Create a Studylist</h3>
            <p className="text-gray-500 text-sm mt-1">
              Tạo studylist mới để lưu tài liệu và sắp xếp việc học của bạn.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-grid place-items-center h-9 w-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-black transition"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Intro 3 cards (gợi ý) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-700 font-medium">Collect materials</p>
            <p className="text-xs text-gray-500 mt-1">Lưu tài liệu vào cùng một nơi.</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-700 font-medium">Memorise faster</p>
            <p className="text-xs text-gray-500 mt-1">Ôn tập hiệu quả với ghi chú.</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-700 font-medium">Practice quizzes</p>
            <p className="text-xs text-gray-500 mt-1">Luyện tập câu hỏi trắc nghiệm.</p>
          </div>
        </div>

        {/* Form */}
        <label className="text-sm font-medium text-gray-800">Studylist name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 mb-3 rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="e.g. Calculus Midterm"
          autoFocus
        />

        <label className="text-sm font-medium text-gray-800">Description</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          className="mt-1 rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-y w-full"
          placeholder="Short description for your studylist"
        />

        <div className="flex items-center justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={busy || !name.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create Studylist"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStudylistModal;
