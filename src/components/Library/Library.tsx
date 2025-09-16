import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Topbar from "./Topbar";
import HeroPanel from "./HeroPanel";
import Section from "./Section";
import ListItem from "./ListItem";
import { fetchFollowedSubjects, type Subject } from "@/services/subject";
import { useAuth } from "@/context/AuthContext";
import {
  getUserDocuments,
  openDocument,
  type DocumentDTO,
} from "@/services/document";

// 👇 NEW
import {
  getMyPlans,
  type StudyPlan,
} from "@/services/studyPlan";
import CreateStudylistModal from "@/components/Models/CreateStudylistModal"; // modal đã tách
import AddCoursesModal from "./Model/AddCourse";

/** Lấy userId từ object Me (phòng khi backend đặt tên khác nhau) */
function resolveUserId(me: any | null | undefined): number {
  if (!me) return 0;
  return Number(me.userId ?? me.id ?? me.uid ?? me.user_id ?? me.sub ?? 0);
}

export default function Library() {
  const navigate = useNavigate();
  const { user, authReady, fetchingUser } = useAuth();
  const userId = useMemo(() => resolveUserId(user), [user]);

  const [docs, setDocs] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [courses, setCourses] = useState<Subject[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesErr, setCoursesErr] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  // 👇 NEW: StudyPlans state
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansErr, setPlansErr] = useState<string | null>(null);
  const [openCreatePlan, setOpenCreatePlan] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!authReady || fetchingUser || !userId) {
      if (mounted) setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserDocuments(userId);
        if (mounted) setDocs(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (mounted)
          setError(e?.response?.statusText || e?.message || "Load uploads failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [authReady, fetchingUser, userId]);

  const handleOpen = async (doc: DocumentDTO) => {
    try {
      const view = await openDocument(doc.documentId);
      if (view?.viewerUrl) window.open(view.viewerUrl, "_blank");
      else navigate(`/documents/${doc.documentId}`, { state: { doc: view } });
    } catch {
      navigate(`/documents/${doc.documentId}`);
    }
  };

  const handleOpenCourse = (c: Subject) => {
    navigate(`/subjects/${c.subjectId}`, { state: { course: c } });
  };

  useEffect(() => {
    if (!authReady || fetchingUser || !userId) return;
    (async () => {
      try {
        setCoursesLoading(true);
        const mine = await fetchFollowedSubjects(userId);
        setCourses(mine);
      } catch (e: any) {
        setCoursesErr(e?.message || "Load courses failed");
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, [authReady, fetchingUser, userId]);

  // 👇 NEW: load StudyPlans từ API
  useEffect(() => {
    if (!authReady || fetchingUser || !userId) return;
    (async () => {
      try {
        setPlansLoading(true);
        setPlansErr(null);
        const mine = await getMyPlans(); // backend trả study plans của user hiện tại
        setPlans(mine ?? []);
      } catch (e: any) {
        setPlansErr(e?.message || "Load studylists failed");
      } finally {
        setPlansLoading(false);
      }
    })();
  }, [authReady, fetchingUser, userId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />
      <main className="pb-20">
      <HeroPanel onStartStudyPlan={() => setOpenCreatePlan(true)} />

        <Section title="My uploads">
          {!authReady || fetchingUser ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : !user ? (
            <div className="text-sm text-amber-600">Bạn chưa đăng nhập. Hãy đăng nhập để xem tài liệu đã upload.</div>
          ) : loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : error ? (
            <div className="text-sm text-red-600">Không tải được tài liệu: {error}</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-slate-500">Bạn chưa upload tài liệu nào.</div>
          ) : (
            <div className="space-y-1">
              {docs.map((d) => (
                <ListItem
                  key={d.documentId}
                  title={d.title}
                  subtitle={d.subjectName ? `${d.subjectName} • ${d.userName}` : d.userName}
                  icon="doc"
                  onClick={() => handleOpen(d)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* 👇 NEW: My StudyLists (render từ API + nút mở modal tạo) */}
        <Section title="My StudyLists">
          {plansLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : plansErr ? (
            <div className="text-sm text-red-600">{plansErr}</div>
          ) : plans.length === 0 ? (
            <div className="text-sm text-slate-500">Bạn chưa có studylist nào.</div>
          ) : (
            <div className="space-y-1">
              {plans.map((p) => (
                <ListItem
                  key={p.id}
                  title={p.name}
                  icon="folder"
                  to={`/study-plans/${p.id}`}
                />
              ))}
            </div>
          )}

          <button
            className="mt-4 inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100"
            onClick={() => setOpenCreatePlan(true)}
          >
            + New Studylist
          </button>

          {/* Modal tạo plan: tạo xong chèn vào danh sách ngay */}
          <CreateStudylistModal
            open={openCreatePlan}
            onClose={() => setOpenCreatePlan(false)}
            onCreated={(p) => {
              setPlans((prev) => [{ id: p.id, name: p.name }, ...prev]); // thêm lên đầu (tuỳ UX)
              setOpenCreatePlan(false);
            }}
          />
        </Section>

        {/* My courses */}
        <Section title="My courses">
          {coursesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : coursesErr ? (
            <div className="text-sm text-red-600">{coursesErr}</div>
          ) : courses.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa theo dõi môn nào.</div>
          ) : (
            <div className="space-y-1">
              {courses.map((c) => (
                <ListItem
                  key={c.subjectId}
                  title={c.name}
                  icon="course"
                  to={`/subjects/${c.subjectId}`} // sửa lại path nhất quán
                  onClick={() => handleOpenCourse(c)}
                />
              ))}
            </div>
          )}

          <button
            className="mt-4 inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100"
            onClick={() => setOpenModal(true)}
          >
            + Add Courses
          </button>
        </Section>

        {/* Modal add/remove courses */}
        <AddCoursesModal
          userId={userId}
          open={openModal}
          onClose={() => setOpenModal(false)}
          onChanged={async () => {
            const mine = await fetchFollowedSubjects(userId);
            setCourses(mine);
          }}
        />
      </main>
    </div>
  );
}
