// src/pages/ChatRoomsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  createRoom,
  listMyRooms,
  listRooms,
  joinRoom,
  joinRoomByCode,
  type ChatRoom,
} from "@/services/chat";
import { useNavigate } from "react-router-dom";

const cx = (...s: Array<string | false | undefined>) => s.filter(Boolean).join(" ");

function genCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const RoomItem: React.FC<{ room: ChatRoom; onOpen: (r: ChatRoom) => void }> = ({ room, onOpen }) => (
  <button
    onClick={() => onOpen(room)}
    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 border border-slate-200/70 flex items-center gap-3"
  >
    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
      {room.name?.slice(0, 1)?.toUpperCase() || "R"}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate">{room.name || room.code}</div>
      <div className="text-[12px] text-slate-500">
        #{room.code} · {room.memberCount ?? 0} members
      </div>
    </div>
  </button>
);

const ChatRoomsPage: React.FC = () => {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // form create
  const [name, setName] = useState("");
  const [code, setCode] = useState(genCode());
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // join by code
  const [joinCode, setJoinCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  // search public rooms
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchRes, setSearchRes] = useState<ChatRoom[]>([]);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  // load my rooms
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        const data = await listMyRooms();
        if (!dead) setRooms(data);
      } catch (e: any) {
        if (!dead) setErr(e?.message || "Load rooms failed");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      !q
        ? rooms
        : rooms.filter(
            (r) =>
              r.name?.toLowerCase().includes(q.toLowerCase()) ||
              r.code?.toLowerCase().includes(q.toLowerCase())
          ),
    [rooms, q]
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Vui lòng nhập tên nhóm");
      return;
    }
    setErr(null);
    setCreating(true);
    try {
      const r = await createRoom({ name: name.trim(), code: code.trim() || undefined });
      setRooms((prev) => [r, ...prev]);
      navigate(`/chat/rooms/${r.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Tạo nhóm thất bại");
    } finally {
      setCreating(false);
    }
  }

  function openRoom(r: ChatRoom) {
    navigate(`/chat/rooms/${r.id}`);
  }

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    const c = joinCode.trim().toUpperCase();
    if (!c) return;
    setSearchErr(null);
    setErr(null);
    setJoiningCode(true);
    try {
      const r = await joinRoomByCode(c);
      setRooms((prev) => {
        if (prev.some((x) => x.id === r.id)) return prev;
        return [r, ...prev];
      });
      navigate(`/chat/rooms/${r.id}`);
    } catch (e: any) {
      setSearchErr(e?.response?.data?.message || e?.message || "Gia nhập bằng mã thất bại");
    } finally {
      setJoiningCode(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const s = searchQ.trim();
    if (!s) {
      setSearchRes([]);
      setSearchErr(null);
      return;
    }
    setSearching(true);
    setSearchErr(null);
    try {
      const found = await listRooms({ mine: false, q: s, page: 0, size: 20 });
      setSearchRes(found);
    } catch (e: any) {
      setSearchErr(e?.response?.data?.message || e?.message || "Tìm nhóm thất bại");
    } finally {
      setSearching(false);
    }
  }

  async function handleJoinRoomId(id: number) {
    setSearchErr(null);
    try {
      const r = await joinRoom(id);
      setRooms((prev) => {
        if (prev.some((x) => x.id === r.id)) return prev;
        return [r, ...prev];
      });
      navigate(`/chat/rooms/${r.id}`);
    } catch (e: any) {
      setSearchErr(e?.response?.data?.message || e?.message || "Tham gia nhóm thất bại");
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="mx-auto max-w-5xl py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nhóm chat</h1>
        </div>

        {/* Create room */}
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 font-medium">Tạo nhóm mới</div>
          <form onSubmit={handleCreate} className="p-5 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Tên nhóm</label>
              <input
                className="w-full h-11 px-3 rounded-xl border border-slate-300 outline-none focus:ring-2 ring-indigo-100"
                placeholder="VD: Lớp KTPM 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Mã nhóm (tùy chọn)</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 outline-none focus:ring-2 ring-indigo-100 uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  onClick={() => setCode(genCode())}
                  className="h-11 px-3 rounded-xl border border-slate-300 hover:bg-slate-50"
                >
                  Random
                </button>
              </div>
            </div>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className={cx(
                  "h-11 px-5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors",
                  creating && "opacity-60 cursor-not-allowed"
                )}
              >
                {creating ? "Đang tạo…" : "Tạo nhóm"}
              </button>
              {err && <div className="text-sm text-red-600">{err}</div>}
            </div>
          </form>
        </div>

        {/* Join by code + Search public rooms */}
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 font-medium">Gia nhập nhóm</div>

          <div className="p-5 grid gap-6 md:grid-cols-2">
            {/* Join by code */}
            <form onSubmit={handleJoinByCode} className="space-y-3">
              <div className="text-sm text-slate-600">Bằng mã mời</div>
              <div className="flex gap-2">
                <input
                  placeholder="Nhập mã nhóm (VD: NV4RMC)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 outline-none focus:ring-2 ring-indigo-100 uppercase"
                />
                <button
                  type="submit"
                  disabled={joiningCode}
                  className={cx(
                    "h-11 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors",
                    joiningCode && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {joiningCode ? "Đang nhập…" : "Tham gia"}
                </button>
              </div>
            </form>

            {/* Search rooms */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="text-sm text-slate-600">Tìm theo tên hoặc mã</div>
              <div className="flex gap-2">
                <input
                  placeholder="Nhập từ khoá…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 outline-none focus:ring-2 ring-indigo-100"
                />
                <button
                  type="submit"
                  className="h-11 px-4 rounded-xl border border-slate-300 hover:bg-slate-50"
                >
                  Tìm
                </button>
              </div>

              {/* Search results */}
              <div className="space-y-2">
                {searching ? (
                  <div className="text-slate-500">Đang tìm…</div>
                ) : searchRes.length === 0 ? (
                  <div className="text-slate-400 text-sm">Không có kết quả.</div>
                ) : (
                  <div className="space-y-2">
                    {searchRes.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.name || r.code}</div>
                          <div className="text-[12px] text-slate-500">
                            #{r.code} · {r.memberCount ?? 0} members
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinRoomId(r.id)}
                          className="h-9 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Tham gia
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {searchErr && <div className="text-sm text-red-600">{searchErr}</div>}
              </div>
            </form>
          </div>
        </div>

        {/* Rooms list (my rooms) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="font-medium">Danh sách nhóm của bạn</div>
            <input
              placeholder="Tìm theo tên hoặc mã…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 w-64 max-w-full px-3 rounded-xl border border-slate-300 outline-none focus:ring-2 ring-indigo-100"
            />
          </div>

          {loading ? (
            <div className="p-6 text-slate-500">Đang tải…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-500">Chưa có nhóm nào.</div>
          ) : (
            <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <RoomItem key={r.id} room={r} onOpen={openRoom} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomsPage;
