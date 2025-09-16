import React, { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getChatHistory,
  sendChatMessage,
  type ChatMessageRes,
  getRoomDetail,
  getRoomMembers,
  type ChatRoomDetail,
  type ChatMember,
  leaveRoom,
  type LeaveRoomRes,
} from "@/services/chat";
import { useAuth } from "@/context/AuthContext";
import { useStompChat } from "@/components/HomeLayout/Hook/useStompChat";
import { LeaveModal } from "../Library/Model/LeaveModal";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";


const cx = (...s: Array<string | false | undefined>) =>
  s.filter(Boolean).join(" ");

const FallbackAvatar: React.FC<{ name?: string; size?: number }> = ({
  name,
  size = 36,
}) => (
  <div
    className="grid place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-slate-600 font-semibold shrink-0"
    style={{ width: size, height: size }}
    title={name || ""}
  >
    {(name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0] || "")
      .join("")
      .toUpperCase()}
  </div>
);

const MemberRow: React.FC<{ m: ChatMember }> = ({ m }) => (
  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
    {m.avatarUrl ? (
      <img
        src={m.avatarUrl}
        alt={m.userName || m.userEmail || ""}
        className="h-9 w-9 rounded-full object-cover shrink-0"
      />
    ) : (
      <FallbackAvatar name={m.userName || m.userEmail} size={36} />
    )}
    <div className="min-w-0">
      <div className="text-sm font-medium truncate">
        {m.userName || m.userEmail || "Member"}
      </div>
      {m.userEmail && (
        <div className="text-[12px] text-slate-500 truncate">{m.userEmail}</div>
      )}
    </div>
  </div>
);

type UiMsg = { id: number; sender: string; text: string; ts?: string };

const ChatRoomPage: React.FC = () => {
  const { roomId = "" } = useParams<{ roomId: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const myKey = (user as any)?.email || (user as any)?.username || "me";

  const [messages, setMessages] = React.useState<UiMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  // room meta + members
  const [room, setRoom] = React.useState<ChatRoomDetail | null>(null);
  const [members, setMembers] = React.useState<ChatMember[]>([]);
  const [rightOpen, setRightOpen] = React.useState(true);
  const [showLeave, setShowLeave] = React.useState(false); // 👈 NEW
  const [leaving, setLeaving] = React.useState(false); // 👈 NEW
  const [leaveErr, setLeaveErr] = React.useState<string | null>(null); // 👈 NEW

  // NEW: invite modal
  const [showInvite, setShowInvite] = React.useState(false);
  const inviteCode = room?.code || String(roomId);
  const inviteUrl =
    (typeof window !== "undefined" ? window.location.origin : "") +
    `/chat/rooms/${roomId}`;

  const seenIds = React.useRef<Set<number>>(new Set());

  const onStompMessage = useCallback((msg: ChatMessageRes) => {
    if (!msg || msg.id == null) return;
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages((prev) => [
      ...prev,
      {
        id: msg.id,
        sender: msg.senderEmail,
        text: msg.content,
        ts: toTime(msg.createdAt),
      },
    ]);
  }, []);

  const { connected, sendMessage } = useStompChat(roomId, onStompMessage);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [r, mems] = await Promise.all([
          getRoomDetail(roomId),
          getRoomMembers(roomId),
        ]);
        if (cancel) return;
        setRoom(r);
        setMembers(mems);
      } catch {
        if (!cancel)
          setRoom({
            id: Number(roomId),
            code: String(roomId),
            name: `Room #${roomId}`,
          });
      }
    })();
    return () => {
      cancel = true;
    };
  }, [roomId]);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const hist = await getChatHistory(roomId, 0, 50);
        const ordered = hist
          .slice()
          .sort(
            (a, b) =>
              new Date(a.createdAt || 0).getTime() -
              new Date(b.createdAt || 0).getTime()
          );
        if (cancel) return;
        const ui = ordered.map((m) => {
          seenIds.current.add(m.id);
          return {
            id: m.id,
            sender: m.senderEmail,
            text: m.content,
            ts: toTime(m.createdAt),
          };
        });
        setMessages(ui);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
      seenIds.current.clear();
    };
  }, [roomId]);

  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");

    try {
      if (connected) {
        sendMessage({ type: "TEXT", content: text });
      } else {
        const saved = await sendChatMessage(roomId, {
          type: "TEXT",
          content: text,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: saved.id,
            sender: saved.senderEmail,
            text: saved.content,
            ts: toTime(saved.createdAt),
          },
        ]);
      }
    } catch {
      setMessages((p) => [
        ...p,
        { id: Date.now(), sender: "system", text: "❌ Gửi tin thất bại." },
      ]);
    }
  }

  const onConfirmLeave = React.useCallback(async () => {
    if (!roomId) return;
    setLeaving(true);
    setLeaveErr(null);
    try {
      const res: LeaveRoomRes = await leaveRoom(roomId);
      // có thể tuỳ chỉnh toast tại đây nếu bạn có hook useToast
      // Ví dụ: showToast("Left the room successfully")
      // Điều hướng về danh sách phòng (điều chỉnh path theo app của bạn)
      nav("/chat"); // hoặc "/messages" hay "/chat/rooms"
    } catch (e: any) {
      setLeaveErr(
        e?.response?.data?.message || "Rời nhóm thất bại. Vui lòng thử lại."
      );
    } finally {
      setLeaving(false);
    }
  }, [roomId, nav]);

  const title = room?.name || `Room #${roomId}`;
  const memberCount = room?.memberCount ?? members.length;

  return (
    <div className="min-h-screen w-full bg-white">
      {/* TOP BAR */}
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => nav(-1)}
              className="mr-1 hidden sm:inline-flex text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100"
              title="Back"
            >
              ←
            </button>
            <FallbackAvatar name={title} size={32} />
            <div className="min-w-0">
              <div className="font-semibold leading-5 truncate">{title}</div>
              <div className="text-[12px] text-emerald-600 flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              type="button"
              onClick={() => setShowInvite(true)} // mở modal nhanh từ nút Call (giữ giao diện gọn)
              title="Invite"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V21a1 1 0 01-1 1C10.07 22 2 13.93 2 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.2 2.2z" />
              </svg>
              Call
            </button>
            <button
              className="h-9 w-9 grid place-items-center rounded-xl hover:bg-slate-100 text-slate-600"
              onClick={() => setRightOpen((v) => !v)}
              title="Toggle directory"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-6 px-4 py-4">
        {/* Chat column */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="h-[calc(100vh-8.5rem)] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loading ? (
                <div className="h-full grid place-items-center text-slate-500">
                  Đang tải…
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-3">
                  {messages.map((m) => {
                    const me = m.sender === myKey;
                    return (
                      <div
                        key={m.id}
                        className={cx(
                          "flex items-end gap-2",
                          me ? "justify-end" : "justify-start"
                        )}
                      >
                        {!me && <FallbackAvatar name={m.sender} size={28} />}
                        <div
                          className={cx(
                            "rounded-2xl px-3.5 py-2 text-[13px] leading-5 shadow-sm max-w-[75%]",
                            me
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-800"
                          )}
                        >
                          <div>{m.text}</div>
                          {m.ts && (
                            <div
                              className={cx(
                                "mt-1 text-[10px]",
                                me ? "text-indigo-100/80" : "text-slate-500/70"
                              )}
                            >
                              {m.ts}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={onSend}
              className="border-t border-slate-200 px-4 py-3 bg-white"
            >
              <div className="max-w-2xl mx-auto flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 outline-none focus:ring-2 ring-indigo-100"
                />
                <button
                  type="submit"
                  className="h-11 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Directory column */}
        <div
          className={cx(
            "col-span-12 lg:col-span-4 xl:col-span-3",
            rightOpen ? "block" : "hidden lg:block"
          )}
        >
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
  <div className="flex items-center justify-between">
    <div className="text-sm font-semibold">Directory</div>

    {/* Small Leave button in Directory header */}
    <button
  type="button"
  onClick={() => setShowLeave(true)}
  title="Leave this room"
  disabled={leaving}
  className={
    "inline-flex items-center gap-1 h-8 px-2 rounded-lg border text-[12px] " +
    (leaving
      ? "border-red-200 text-red-400 cursor-not-allowed"
      : "border-red-200 text-red-600 hover:bg-red-50")
  }
>
  <LogoutRoundedIcon fontSize="small" />
  {leaving ? "Leaving…" : "Leave"}
</button>
  </div>
</div>


            {/* NEW: Invite box */}
            <div className="px-4 pt-4">
              <div
                className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer"
                onClick={() => setShowInvite(true)}
                title="Mời bạn"
              >
                <div className="h-9 w-9 grid place-items-center rounded-full bg-indigo-600 text-white font-semibold">
                  +
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800">
                    Invite friends
                  </div>
                  <div className="text-[12px] text-slate-500 truncate">
                    {inviteUrl}
                  </div>
                </div>
                <div className="text-[12px] text-indigo-700 font-medium opacity-0 group-hover:opacity-100">
                  View code
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="px-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium text-slate-700">
                  Team Members
                </div>
                <span className="text-[12px] text-slate-500">
                  {memberCount}
                </span>
              </div>
              <div className="mt-2 space-y-1 max-h-[38vh] overflow-y-auto pr-1">
                {members.length === 0 ? (
                  <div className="text-sm text-slate-500 px-1 py-4">
                    Chưa có thành viên.
                  </div>
                ) : (
                  members.map((m) => (
                    <MemberRow key={m.userEmail || String(m.userId)} m={m} />
                  ))
                )}
              </div>
            </div>

            {/* Files placeholder */}
            <div className="mt-4 px-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium text-slate-700">
                  Files
                </div>
                <span className="text-[12px] text-slate-500">—</span>
              </div>
              <div className="mt-2 space-y-2 text-[13px] text-slate-500">
                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center">
                  Chưa có danh sách file. (Placeholder UI)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave room box */}
      <div className="mt-4 px-4 pb-5">
        <button
          type="button"
          onClick={() => setShowLeave(true)}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
          title="Leave this room"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 17l5-5-5-5v10z"></path>
            <path d="M4 4h6v2H6v12h4v2H4z"></path>
          </svg>
          Leave room
        </button>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <InviteModal
          code={inviteCode}
          url={inviteUrl}
          onClose={() => setShowInvite(false)}
        />
      )}

{showLeave && (
  <LeaveModal
    roomName={room?.name || `Room #${roomId}`}
    memberCount={memberCount}
    leaving={leaving}
    error={leaveErr}
    onCancel={() => { setShowLeave(false); setLeaveErr(null); }}
    onConfirm={onConfirmLeave}
  />
)}

    </div>
  );
};

export default ChatRoomPage;

function toTime(iso?: string) {
  try {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* ---------- Modal component (local) ---------- */
const InviteModal: React.FC<{
  code: string;
  url: string;
  onClose: () => void;
}> = ({ code, url, onClose }) => {
  const [copied, setCopied] = React.useState<"code" | "url" | null>(null);

  const copy = async (text: string, which: "code" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold">Invite to room</div>
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">
                Room code
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={code}
                  readOnly
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 font-mono"
                />
                <button
                  onClick={() => copy(code, "code")}
                  className="h-11 px-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {copied === "code" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">
                Invite link
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={url}
                  readOnly
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 bg-slate-50"
                />
                <button
                  onClick={() => copy(url, "url")}
                  className="h-11 px-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {copied === "url" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
