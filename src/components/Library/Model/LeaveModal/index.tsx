const cx = (...s: Array<string | false | undefined>) => 
    s.filter(Boolean).join(" ");

export const LeaveModal: React.FC<{
    roomName: string;
    memberCount: number;
    leaving: boolean;
    error: string | null;
    onCancel: () => void;
    onConfirm: () => void;
  }> = ({ roomName, memberCount, leaving, error, onCancel, onConfirm }) => {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
        <div className="absolute inset-0 grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="font-semibold">Leave “{roomName}”?</div>
              <button
                onClick={onCancel}
                className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>
  
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                Bạn sẽ rời khỏi phòng này. {memberCount > 0 ? `Hiện có ${memberCount} thành viên.` : ""}
              </p>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
            </div>
  
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="h-10 px-4 rounded-xl border border-slate-300 hover:bg-slate-50"
                disabled={leaving}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={cx(
                  "h-10 px-4 rounded-xl text-white",
                  leaving ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                )}
                disabled={leaving}
              >
                {leaving ? "Leaving…" : "Leave room"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  