import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  getPdfObjectUrl,
  getDocumentMeta,
  type DocumentDTO,
  getUserDocuments,
  openDocument,
  upsertReadingProgress,
  upsertReadingProgressBeacon,
} from "@/services/document";
import { getUserById, type UserDTO } from "@/services/user";
import { getSchoolById } from "@/services/school";
import LeftInfoPanel from "../ViewInfo";
import Footer from "../Footer/Footer";

import LikeDislikeBar, { type LikeState } from "@/components/LikeDislikeBar";
import PdfFloatingControls from "@/components/PdfFloatingControl";

import { getRatingSummary, setRating } from "@/services/rating";
import SaveToStudylistModal from "@/components/SaveToStudylistModal";
import {
  getMyPlans,
  type StudyPlan,
  isDocumentSaved,
  hydrateContains,
} from "@/services/studyPlan";

// ---------- react-pdf ----------
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { pdfjs } from "react-pdf";
// (Giữ nguyên workerSrc của bạn – không áp dụng cách 1)
pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

// ---------- constants ----------
const APP_HEADER_H = 13;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;

// khớp với tailwind hiện tại
const CANVAS_MARGIN_ALL = 24;
const WRAPPER_MB = 24;
const WRAP_PY = 24;

// ---------- utils ----------
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function getInnerWidth(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const pl = parseFloat(cs.paddingLeft || "0");
  const pr = parseFloat(cs.paddingRight || "0");
  return el.clientWidth - pl - pr;
}

const PdfPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const idNum = Number(id);
  const location = useLocation();
  const navigate = useNavigate();
  const st = (location.state as { doc?: Partial<DocumentDTO> })?.doc;

  const [title, setTitle] = useState(st?.title || "Document");
  const [subjectName, setSubjectName] = useState<string>(st?.subjectName ?? "—");
  const [uploaderId, setUploaderId] = useState<number | null>(st?.userId ?? null);
  const [uploaderName, setUploaderName] = useState<string>(st?.userName ?? "—");
  const [uploaderAvatarUrl, setUploaderAvatarUrl] = useState<string | undefined>(undefined);
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState<string>("—");
  const [uploadCount, setUploadCount] = useState<number>(0);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [total, setTotal] = useState(1);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pagesWrapRef = useRef<HTMLDivElement>(null);

  // like/dislike
  const [likes, setLikes] = useState(75);
  const [dislikes, setDislikes] = useState(9);
  const [userAction, setUserAction] = useState<LikeState>(null);

  // đã lưu vào Study Plan chưa
  const [saved, setSaved] = useState(false);

  // resume từ server khi open
  const [resumePageFromServer, setResumePageFromServer] = useState<number | null>(null);
  const [resumePercentFromServer, setResumePercentFromServer] = useState<number | null>(null);

  // ước lượng chiều cao 1 page block
  const [estCanvasHeight, setEstCanvasHeight] = useState<number | null>(null);

  // bề rộng container
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // đã pre-scroll chưa
  const didPreScrollRef = useRef(false);

  // --- Save modal state ---
  const [saveOpen, setSaveOpen] = useState(false);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Set<number>>(new Set());
  const [loadingPlans, setLoadingPlans] = useState(false);

  // mở modal & load lists
  const openSaveModal = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    setSaveOpen(true);
    setLoadingPlans(true);
    try {
      let lists = await getMyPlans();
      lists = await hydrateContains(lists, idNum);
      setPlans(lists);

      const pre = new Set<number>();
      lists.forEach((l) => l.contains && pre.add(l.id));
      setSelectedPlans(pre);
    } catch (e) {
      console.error("getMyPlans/hydrate error", e);
    } finally {
      setLoadingPlans(false);
    }
  }, [idNum]);

  useEffect(() => {
    setSaved(selectedPlans.size > 0);
  }, [selectedPlans]);

  // check saved
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!Number.isFinite(idNum)) return;
      try {
        const { saved } = await isDocumentSaved(idNum);
        if (!cancel) setSaved(saved);
      } catch (e) {
        console.warn("check saved error", e);
        if (!cancel) setSaved(false);
      }
    })();
    return () => { cancel = true; };
  }, [idNum]);

  // rating initial
  useEffect(() => {
    if (!Number.isFinite(idNum)) return;
    (async () => {
      try {
        const r = await getRatingSummary(idNum);
        setLikes(r.upvotes || 0);
        setDislikes(r.downvotes || 0);
        setUserAction(r.myRating === 1 ? "like" : r.myRating === -1 ? "dislike" : null);
      } catch (e) {
        console.warn("getRatingSummary error", e);
      }
    })();
  }, [idNum]);

  // ---------- Like / Dislike ----------
  const handleLike = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    const prev = { likes, dislikes, userAction };
    let nextLikes = likes, nextDislikes = dislikes;
    let nextAction: LikeState = userAction;

    if (userAction === "like") {
      nextLikes = Math.max(0, likes - 1);
      nextAction = null;
    } else {
      nextLikes = likes + 1;
      if (userAction === "dislike") nextDislikes = Math.max(0, dislikes - 1);
      nextAction = "like";
    }
    setLikes(nextLikes); setDislikes(nextDislikes); setUserAction(nextAction);

    try {
      const action: "up" | "down" | "clear" = nextAction === "like" ? "up" : "clear";
      const r = await setRating(idNum, action);
      setLikes(r.upvotes || 0);
      setDislikes(r.downvotes || 0);
      setUserAction(r.myRating === 1 ? "like" : r.myRating === -1 ? "dislike" : null);
    } catch (e) {
      console.error("setRating like error", e);
      setLikes(prev.likes); setDislikes(prev.dislikes); setUserAction(prev.userAction);
    }
  }, [idNum, likes, dislikes, userAction]);

  const handleDislike = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    const prev = { likes, dislikes, userAction };
    let nextLikes = likes, nextDislikes = dislikes;
    let nextAction: LikeState = userAction;

    if (userAction === "dislike") {
      nextDislikes = Math.max(0, dislikes - 1);
      nextAction = null;
    } else {
      nextDislikes = dislikes + 1;
      if (userAction === "like") nextLikes = Math.max(0, likes - 1);
      nextAction = "dislike";
    }
    setLikes(nextLikes); setDislikes(nextDislikes); setUserAction(nextAction);

    try {
      const action: "up" | "down" | "clear" = nextAction === "dislike" ? "down" : "clear";
      const r = await setRating(idNum, action);
      setLikes(r.upvotes || 0);
      setDislikes(r.downvotes || 0);
      setUserAction(r.myRating === 1 ? "like" : r.myRating === -1 ? "dislike" : null);
    } catch (e) {
      console.error("setRating dislike error", e);
      setLikes(prev.likes); setDislikes(prev.dislikes); setUserAction(prev.userAction);
    }
  }, [idNum, likes, dislikes, userAction]);

  // ---------- init: open -> last page/percent ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!Number.isFinite(idNum)) return;
      try {
        const dto = await openDocument(idNum);
        if (!alive) return;
        setResumePageFromServer(typeof dto.lastPage === "number" ? dto.lastPage : null);
        setResumePercentFromServer(typeof dto.percent === "number" ? dto.percent : null);
      } catch {}
    })();
    return () => { alive = false; };
  }, [idNum]);

  // ---------- load meta + pdfUrl ----------
  useEffect(() => {
    let alive = true;
    let revoke: string | null = null;
    (async () => {
      if (!idNum) {
        if (alive) { setErr("Missing id"); setLoading(false); }
        return;
      }
      try {
        if (alive) { setLoading(true); }
        try {
          const meta = await getDocumentMeta(idNum);
          if (!alive) return;
          setTitle(meta.title || "Document");
          setSubjectName(meta.subjectName || "—");
          if (typeof meta.userId === "number") setUploaderId(meta.userId);
          if (meta.userName) setUploaderName(meta.userName);
        } catch {}
        const url = await getPdfObjectUrl(idNum);
        if (!alive) { URL.revokeObjectURL(url); return; }
        revoke = url;
        setPdfUrl(url);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Không tải được PDF");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [idNum]);

  // ---------- uploader + school ----------
  useEffect(() => {
    let alive = true;
    if (!uploaderId) return;
    (async () => {
      try {
        const u: UserDTO = await getUserById(uploaderId);
        if (!alive) return;
        if (u?.name) setUploaderName(u.name);
        setUploaderAvatarUrl(u?.avatarUrl || undefined);
        if (typeof u?.schoolId === "number") setSchoolId(u.schoolId);
        try {
          const docs = await getUserDocuments(uploaderId);
          if (alive) setUploadCount(docs.length);
        } catch { if (alive) setUploadCount(0); }
      } catch {}
    })();
    return () => { alive = false; };
  }, [uploaderId]);

  useEffect(() => {
    let alive = true;
    if (!schoolId) { setSchoolName("—"); return; }
    (async () => {
      try {
        const sc = await getSchoolById(Number(schoolId));
        if (alive) setSchoolName(sc?.name || "—");
      } catch { if (alive) setSchoolName("—"); }
    })();
    return () => { alive = false; };
  }, [schoolId]);

  // ---------- container width watcher ----------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(getInnerWidth(el)));
    ro.observe(el);
    setContainerWidth(getInnerWidth(el));
    return () => ro.disconnect();
  }, []);

  // ---------- current page detection ----------
  const getCurrentPageNow = useCallback((): number | null => {
    const sc = containerRef.current, wrap = pagesWrapRef.current;
    if (!sc || !wrap) return null;
    const midY = sc.getBoundingClientRect().top + sc.clientHeight / 2;
    const pages = wrap.querySelectorAll<HTMLElement>("[data-page]");
    if (!pages || pages.length === 0) return null;
    let best = 1, bestDist = Infinity;
    pages.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(midY - mid);
      const pn = Number(el.dataset.page || "1");
      if (dist < bestDist) { bestDist = dist; best = pn; }
    });
    return best;
  }, []);

  useEffect(() => {
    const sc = containerRef.current;
    if (!sc) return;
    const onScroll = () => {
      const p = getCurrentPageNow();
      if (p != null) setPage(p);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => sc.removeEventListener("scroll", onScroll);
  }, [getCurrentPageNow, total]);

  // ---------- pre-position ----------
  const urlPageParam = new URLSearchParams(location.search).get("page");
  const hintedPageFromState =
    (st as any)?.lastPage ?? (st as any)?.continuePage ?? (st as any)?.currentPage ?? null;
  const percentFromState = (st as any)?.percent ?? (st as any)?.progress ?? null;

  useEffect(() => {
    const sc = containerRef.current;
    if (!sc || total <= 0 || !estCanvasHeight || didPreScrollRef.current) return;

    let targetPage: number | null = null;
    if (urlPageParam && !Number.isNaN(+urlPageParam)) {
      targetPage = clamp(parseInt(urlPageParam, 10), 1, total);
    } else if (typeof hintedPageFromState === "number") {
      targetPage = clamp(hintedPageFromState, 1, total);
    } else if (typeof resumePageFromServer === "number") {
      targetPage = clamp(resumePageFromServer, 1, total);
    } else if (typeof percentFromState === "number") {
      const p = Math.max(0, Math.min(100, percentFromState));
      targetPage = clamp(Math.max(1, Math.round((p / 100) * total)), 1, total);
    } else if (typeof resumePercentFromServer === "number") {
      const p = Math.max(0, Math.min(100, resumePercentFromServer));
      targetPage = clamp(Math.max(1, Math.round((p / 100) * total)), 1, total);
    }

    if (!targetPage) { didPreScrollRef.current = true; return; }

    const pageBlock = (estCanvasHeight ?? 0) + CANVAS_MARGIN_ALL * 2;
    const offset = WRAP_PY + (targetPage - 1) * (pageBlock + WRAPPER_MB);
    sc.scrollTop = Math.max(0, offset - 12);
    didPreScrollRef.current = true;
  }, [
    total, estCanvasHeight, urlPageParam, hintedPageFromState,
    percentFromState, resumePageFromServer, resumePercentFromServer,
  ]);

  // ---------- Zoom / Fit ----------
  const onZoomIn = () => {
    setFitWidth(false);
    setZoom((z) => clamp(+(z + ZOOM_STEP).toFixed(2), MIN_ZOOM, MAX_ZOOM));
  };
  const onZoomOut = () => {
    setFitWidth(false);
    setZoom((z) => clamp(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM, MAX_ZOOM));
  };

  // ---------- Save progress ----------
  const lastSavedAtRef = useRef<number>(Date.now());
  const sendProgress = useCallback(
    (pOverride?: number, mode: "page" | "unload" = "page") => {
      if (!Number.isFinite(idNum) || total <= 0) return;
      const current = pOverride ?? getCurrentPageNow() ?? page;
      const safePage = clamp(current, 1, total);
      const percent = Math.min(100, Math.round((safePage / total) * 100));
      const now = Date.now();
      const deltaSec = Math.max(0, Math.floor((now - lastSavedAtRef.current) / 1000));
      lastSavedAtRef.current = now;
      const payload = {
        documentId: idNum,
        lastPage: safePage,
        percent,
        sessionReadSeconds: deltaSec || undefined,
      };
      if (mode === "unload") upsertReadingProgressBeacon(payload);
      else upsertReadingProgress(payload).catch(() => {});
    },
    [idNum, total, page, getCurrentPageNow]
  );

  const sendProgressRef = useRef(sendProgress);
  useEffect(() => { sendProgressRef.current = sendProgress; }, [sendProgress]);

  // save khi đóng tab/đổi trang (browser events)
  useEffect(() => {
    const onUnload = () => { sendProgressRef.current(undefined, "unload"); };
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
  }, []);

  // save khi unmount route (SPA)
  useEffect(() => {
    return () => {
      try {
        sendProgressRef.current(undefined, "page");
      } catch (e) {
        console.error("saveProgress error", e);
      }
    };
  }, []);

  // debounce save khi scroll đổi trang
  const saveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!Number.isFinite(idNum) || total <= 0) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveTimerRef.current = window.setTimeout(() => {
      sendProgressRef.current(page, "page");
    }, 800);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [page, idNum, total]);

  // ---------- Prev/Next ----------
  const scrollToPage = useCallback((target: number) => {
    const sc = containerRef.current;
    if (!sc) return;
    const el = pagesWrapRef.current?.querySelector<HTMLElement>(`[data-page="${target}"]`);
    if (!el) return;
    const scRect = sc.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    sc.scrollTo({ top: sc.scrollTop + elRect.top - scRect.top - 12, behavior: "smooth" });
  }, []);
  const onPrev = () => { const t = clamp(page - 1, 1, total); scrollToPage(t); sendProgress(t); };
  const onNext = () => { const t = clamp(page + 1, 1, total); scrollToPage(t); sendProgress(t); };

  // ---------- Hover controls ----------
  const [isHoveringDoc, setIsHoveringDoc] = useState(false);
  const [isHoveringCtrls, setIsHoveringCtrls] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rootEl = containerRef.current, target = footerRef.current;
    if (!rootEl || !target) return;
    const io = new IntersectionObserver(([ent]) => setFooterInView(ent.isIntersecting), {
      root: rootEl, threshold: 0.01, rootMargin: "0px 0px 80px 0px",
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);
  const showControls = (isHoveringDoc || isHoveringCtrls) && !footerInView && !loading && !err;

  // ---------- Back ----------
const handleBack = async () => {
  // lưu tiến trình trước khi rời trang
  const current = getCurrentPageNow() ?? page;
  const safePage = clamp(current, 1, total);
  const percent = Math.min(100, Math.round((safePage / total) * 100));
  try {
    await upsertReadingProgress({
      documentId: idNum,
      lastPage: safePage,
      percent,
      sessionReadSeconds: 0,
    });
  } catch {}

  // quay lại trang trước nếu có lịch sử; nếu không thì về /home
  // window.history.length > 1 hoạt động tốt trong SPA
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate("/home", { replace: true });
  }
};


  // ---------- width tính cho mỗi trang ----------
  const sideGaps = CANVAS_MARGIN_ALL * 2;
  const avail = Math.max(0, containerWidth - sideGaps);
  const pageWidth = Math.max(0, Math.floor((fitWidth ? 1 : zoom) * avail));

  return (
    <div className="flex flex-1 min-h-0 h-full bg-gray-50 overflow-hidden">
      <LeftInfoPanel
        title={title}
        subjectName={subjectName}
        university={schoolName || "—"}
        onCollapsedChange={() => {}}
        academicYear={"2023/2024"}
        uploaderName={uploaderName}
        uploaderAvatarUrl={uploaderAvatarUrl}
        uploaderSchool={schoolName}
        stats={{ followers: 0, uploads: uploadCount, upvotes: 0 }}
        downloadUrl={pdfUrl}
        onBack={handleBack}
        documentId={Number.isFinite(idNum) ? idNum : undefined}
      />

      <main className="flex-1 min-h-0 flex flex-col overflow-x-hidden">
        <div style={{ height: APP_HEADER_H }} className="shrink-0" />
        <div className="sticky top-0 z-10 flex items-center justify-between h-12 px-4 border-b bg-white/90 backdrop-blur">
          <div className="font-semibold truncate">{title}</div>
        </div>

        {/* Like / Dislike */}
        <LikeDislikeBar
          likes={likes}
          dislikes={dislikes}
          userAction={userAction}
          onLike={handleLike}
          onDislike={handleDislike}
          onSave={openSaveModal}
          saved={saved}
          className="border-b"
        />

        <div
          ref={containerRef}
          className="relative flex-1 min-h-0 overflow-x-hidden bg-gray-100 px-4 md:px-8"
          onMouseEnter={() => setIsHoveringDoc(true)}
          onMouseLeave={() => setIsHoveringDoc(false)}
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          {loading && (
            <div className="h-full grid place-items-center text-gray-500">Loading PDF…</div>
          )}
          {err && !loading && (
            <div className="h-full grid place-items-center text-red-600">{err}</div>
          )}

          {/* Guard: chỉ render khi sẵn sàng → giảm race getPage() */}
          {!loading && !err && pdfUrl && total > 0 && (
            <div className="py-6">
              <div ref={pagesWrapRef} className="mx-auto">
                <Document
                  key={pdfUrl} // ép remount worker khi file đổi  ✅
                  file={pdfUrl}
                  onLoadSuccess={({ numPages }) => setTotal(numPages)} // có guard alive ở effect trên
                  loading={<div className="text-gray-500 grid place-items-center h-40">Loading PDF…</div>}
                  error={<div className="text-red-600 grid place-items-center h-40">Không tải được PDF</div>}
                >
                  {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
                    <div key={n} className="mb-6 bg-white shadow-2xl rounded-md overflow-hidden" data-page={n}>
                      <div className="m-6">
                        <Page
                          pageNumber={n}
                          renderTextLayer
                          renderAnnotationLayer
                          width={pageWidth || undefined}
                          onRenderSuccess={() => {
                            // đo chiều cao trang 1 một lần
                            if (!estCanvasHeight && n === 1) {
                              const el = pagesWrapRef.current?.querySelector<HTMLElement>(`[data-page="1"]`);
                              if (el) {
                                const rect = el.getBoundingClientRect();
                                setEstCanvasHeight(Math.max(0, Math.floor(rect.height - CANVAS_MARGIN_ALL * 2)));
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </Document>
              </div>
            </div>
          )}

          {/* spacer để tránh controls đè nội dung */}
          <div className="sticky bottom-0 left-0 right-0 h-24 pointer-events-auto" />

          <PdfFloatingControls
            page={page}
            total={total}
            zoomPct={Math.round(zoom * 100)}
            fitWidth={fitWidth}
            show={showControls}
            pdfUrl={pdfUrl}
            onPrev={onPrev}
            onNext={onNext}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onToggleFit={() => setFitWidth((f) => !f)}
            onHoverChange={(v) => setIsHoveringCtrls(v)}
          />

          <div ref={footerRef}>
            <Footer />
          </div>
        </div>

        <SaveToStudylistModal
          open={saveOpen}
          onClose={() => setSaveOpen(false)}
          plans={plans}
          selected={selectedPlans}
          onLocalSelectChange={(next) => setSelectedPlans(next)}
          documentId={idNum}
          loadingPlans={loadingPlans}
        />
      </main>
    </div>
  );
};

export default PdfPreview;
