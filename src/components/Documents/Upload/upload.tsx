import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CloudUpload,
  Delete,
  Description,
  CheckCircle,
  Add,
  HelpOutline,
  Close,
  Replay,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { uploadDocument, createUploadController } from "@/services/upload";
import { fetchSubjects, type Subject } from "@/services/subject";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}
const fmtSize = (b: number) => {
  if (!+b) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(2))} ${s[i]}`;
};
const base = (n: string) => n.replace(/\.[^/.]+$/, "");

type Status = "queued" | "uploading" | "done" | "error" | "canceled";
type Row = {
  id: string;
  file: File;
  title: string;
  url?: string;
  progress: number;
  status: Status;
  error?: string;
  subjectId?: string; // bind with <select>
};

export default function StudocuUploader() {
  const { user, loading: userLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const controllers = useRef<Map<string, AbortController>>(new Map());
  const [drag, setDrag] = useState(false);

  type Step = "select" | "details" | "upload" | "done";
  const [step, setStep] = useState<Step>("select");
  const stepIdx = { select: 0, details: 1, upload: 2, done: 2 }[step];

  // subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsErr, setSubjectsErr] = useState<string | null>(null);
  const navigate = useNavigate();  // khởi tạo navigate

  useEffect(() => {
    console.log('userLoading=', userLoading, 'user=', user);
  }, [userLoading, user]);
  

  // load subjects at Details step
  useEffect(() => {
    if (step !== "details" || subjects.length) return;
    (async () => {
      try {
        setSubjectsLoading(true);
        setSubjectsErr(null);
        const data = await fetchSubjects();
        setSubjects(data ?? []);
      } catch (e: any) {
        setSubjectsErr(e?.response?.data?.message || e?.message || "Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    })();
  }, [step, subjects.length]);

  // Step 1: select files (no API yet)
  const onBrowse = () => inputRef.current?.click();
  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const items: Row[] = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${crypto.getRandomValues(new Uint32Array(1))[0]}`,
      file,
      title: base(file.name),
      progress: 0,
      status: "queued",
    }));
    setRows((prev) => [...prev, ...items]);
  };
  const removeRow = (id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setRows((p) => p.filter((r) => r.id !== id));
  };

  // Step 3: upload one file
  const startOne = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    const uid = user?.userId; // from auth context
    if (!uid) {
      setRows((p) =>
        p.map((r): Row => (r.id === id ? { ...r, status: "error", error: "Thiếu userId (chưa đăng nhập?)" } : r))
      );
      return;
    }

    const subjectIdNum =
      row.subjectId && /^\d+$/.test(row.subjectId) ? Number(row.subjectId) : undefined;
    if (!subjectIdNum) {
      setRows((p) =>
        p.map((r): Row => (r.id === id ? { ...r, status: "error", error: "Vui lòng chọn môn học hợp lệ." } : r))
      );
      return;
    }

    setRows((p) =>
      p.map((r): Row => (r.id === id ? { ...r, status: "uploading", error: undefined } : r))
    );

    const ctr = createUploadController();
    controllers.current.set(id, ctr);

    try {
      const res = await uploadDocument(
        { file: row.file, title: row.title, subjectId: subjectIdNum, userId: uid },
        {
          signal: ctr.signal,
          onProgress: (p) =>
            setRows((prev) => prev.map((r): Row => (r.id === id ? { ...r, progress: p } : r))),
        }
      );
      setRows((prev) =>
        prev.map((r): Row => (r.id === id ? { ...r, status: "done", progress: 100, url: res?.url } : r))
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Upload failed";
      setRows((prev) =>
        prev.map((r): Row =>
          r.id === id && r.status !== "canceled" ? { ...r, status: "error", error: msg } : r
        )
      );
    } finally {
      controllers.current.delete(id);
    }
  };

  // Start all uploads after validation
  const startAll = () => {
    if (userLoading) return; // wait user
    if (!user?.userId) {
      alert("Thiếu userId. Vui lòng đăng nhập lại.");
      return;
    }
    const missing = rows.filter((r) => !r.subjectId || !/^\d+$/.test(r.subjectId));
    if (missing.length) {
      alert("Vui lòng chọn môn học cho tất cả tài liệu trước khi upload.");
      return;
    }
    setStep("upload");
    rows
      .filter((r) => r.status === "queued" || r.status === "error")
      .forEach((r) => startOne(r.id));
  };

  const cancel = (id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setRows((p) => p.map((r): Row => (r.id === id ? { ...r, status: "canceled" } : r)));
  };
  const retry = (id: string) => {
    setRows((p) => p.map((r): Row => (r.id === id ? { ...r, progress: 0, status: "queued", error: undefined } : r)));
    startOne(id);
  };

  const overall = useMemo(
    () => (rows.length ? Math.round(rows.reduce((a, r) => a + r.progress, 0) / rows.length) : 0),
    [rows]
  );

  // auto switch upload -> done
  useEffect(() => {
    if (step === "upload" && rows.length > 0 && rows.every((r) => r.status === "done")) {
      setStep("done");
    }
  }, [step, rows]);

  // Giả sử rows là danh sách file đang upload
  const allFinished = rows.length > 0 && rows.every(
    (r) => r.status === "done" || r.status === "error"
  );

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-slate-900" />
          <span className="text-xl font-semibold text-slate-900">studocu</span>
        </div>
      </div>

      {/* Steps */}
      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="grid grid-cols-3 gap-6">
          {["Upload", "Details", "Done"].map((label, idx) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                    idx === stepIdx
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : idx < stepIdx
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                      : "border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {idx + 1}
                </div>
                <span
                  className={
                    idx === stepIdx ? "text-slate-900" : idx < stepIdx ? "text-emerald-700" : "text-slate-400"
                  }
                >
                  {label}
                </span>
              </div>
              <div className={cx("h-2 w-full rounded-full", idx <= stepIdx ? "bg-blue-100" : "bg-slate-200")}>
                {idx === 0 && step === "select" && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(overall, 10)}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    className="h-2 rounded-full bg-blue-500"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-8">
        {/* Step 1: select */}
        {step === "select" && (
          <>
            <div
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDrag(false);
                addFiles(e.dataTransfer.files);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!drag) setDrag(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDrag(false);
              }}
              className={cx(
                "relative flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-10 text-center",
                drag ? "border-blue-500 bg-blue-50" : "border-slate-200"
              )}
            >
              <div className="rounded-full bg-blue-50 p-3">
                <CloudUpload className="h-7 w-7 text-blue-600" />
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">Drag & Drop files</div>
              <div className="text-slate-500">Or if you prefer</div>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Browse my files
              </button>
              <div className="mt-1 text-xs text-slate-500">Supported files: pdf, doc, docx</div>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            <div className="mt-6 space-y-3">
              {rows.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Description className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-900">{it.file.name}</p>
                      <p className="shrink-0 text-xs text-slate-500">{fmtSize(it.file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(it.id)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Remove file"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={onBrowse}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Add className="h-4 w-4" /> Upload more
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => alert("This is a demo.")}
                >
                  <HelpOutline className="h-4 w-4" /> Help
                </button>
                <button
                  type="button"
                  onClick={() => rows.length && setStep("details")}
                  disabled={rows.length === 0 || userLoading || !user?.userId}
                  className={cx(
                    "rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm",
                    rows.length && !userLoading && user?.userId
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-400 cursor-not-allowed"
                  )}
                  title={!user?.userId ? "Bạn cần đăng nhập để tiếp tục" : undefined}
                >
                  Continue to Details
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: details */}
        {step === "details" && (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Document details</h3>

            {subjectsLoading && <p className="mt-3 text-sm text-slate-500">Loading subjects…</p>}
            {subjectsErr && <p className="mt-3 text-sm text-rose-600">{subjectsErr}</p>}

            <div className="mt-4 space-y-3">
              {rows.map((it) => (
                <div key={it.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 truncate">{it.file.name}</span>
                    <span className="text-xs text-slate-500">{fmtSize(it.file.size)}</span>
                  </div>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={it.title}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r): Row => (r.id === it.id ? { ...r, title: e.target.value } : r))
                        )
                      }
                      placeholder="Document title"
                    />

                    <select
                      value={it.subjectId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value || undefined;
                        setRows((prev) =>
                          prev.map((r): Row => (r.id === it.id ? { ...r, subjectId: val } : r))
                        );
                      }}
                      className={cx(
                        "rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2",
                        it.subjectId ? "border-slate-200 focus:ring-blue-400" : "border-rose-300 focus:ring-rose-400"
                      )}
                    >
                      <option key="__placeholder" value="">
                        -- Chọn môn học --
                      </option>
                      {subjects
                        .filter(Boolean)
                        .map((s, idx) => {
                          const sid = (s as any).subjectId ?? (s as any).id;
                          const key = sid != null ? String(sid) : `idx-${idx}`;
                          return (
                            <option key={key} value={sid != null ? String(sid) : ""}>
                              {(s as any).name ?? (s as any).code ?? `Subject ${idx + 1}`}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("select")}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={startAll}
                disabled={subjectsLoading || userLoading || !user?.userId}
                className={cx(
                  "rounded-full px-5 py-2 text-sm font-semibold text-white",
                  subjectsLoading || userLoading || !user?.userId
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                Start upload
              </button>
            </div>
          </div>
        )}

        {/* Step 3: upload */}
        {step === "upload" && (
          <>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Uploading…</h3>
              <div className="mt-4 space-y-3">
                {rows.map((it) => (
                  <div key={it.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Description className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-slate-900">{it.title}</p>
                        <span className="text-xs text-slate-500">{it.status}</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                        <div
                          className={cx(
                            "h-2 rounded-full",
                            it.status === "done" ? "bg-emerald-500" : it.status === "error" ? "bg-rose-500" : "bg-blue-500"
                          )}
                          style={{ width: `${it.progress}%` }}
                        />
                      </div>
                      {it.status === "error" && <div className="mt-1 text-xs text-rose-600">{it.error}</div>}
                    </div>

                    {it.status === "uploading" && (
                      <button
                        onClick={() => cancel(it.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        title="Cancel"
                      >
                        <Close className="h-5 w-5" />
                      </button>
                    )}
                    {it.status === "error" && (
                      <button
                        onClick={() => retry(it.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        title="Retry"
                      >
                        <Replay className="h-5 w-5" />
                      </button>
                    )}
                    {it.status === "done" && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">You can close this tab after all items are marked “done”.</p>
          </>
        )}

        {/* Step 4: done */}
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
      {step === "done" && (
        <>
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-3 text-lg font-semibold text-slate-900">
            Hoàn tất!
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Tài liệu của bạn đã được xử lý xong.
          </p>
        </>
      )}

      {allFinished && (
        <button
          onClick={() => navigate("/home")}
          className="mt-6 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Quay về Home
        </button>
      )}
    </div>
      </div>
    </div>
  );
}
