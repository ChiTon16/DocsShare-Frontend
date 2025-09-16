// routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./components/Welcome/Welcome";
import Base from "./components/Base/Base";
import AuthPage from "./components/AuthPage/AuthPage";
import Upload from "./components/Documents/Upload/upload";
import RequireAuth from "./require";
import PdfPreview from "./components/PdfView";
import Home from "./components/HomeLayout/Home/Home";
import Library from "./components/Library/Library";
import SubjectPage from "./components/SubjectPage";
import StudyPlanPage from "./components/StudyListPage";
import SearchPage from "./components/SearchPage";
import ChatRoomsPage from "./components/ChatRoomsPage";
import ChatRoomPage from "./components/ChatRoomPage";

// Demo pages
const Notes = () => <div className="p-4">📝 AI Notes Page</div>;
const Ask = () => <div className="p-4">💬 Ask AI Page</div>;
const Quiz = () => <div className="p-4">❓ AI Quiz Page</div>;
const Recent = () => <div className="p-4">🕓 Recent Activity</div>;

export default function AppRoutes() {
  return (
    <Routes>
      {/* Các route yêu cầu login */}
      <Route element={<RequireAuth />}>
        {/* Layout giữ nguyên Header + Sidebar */}
        <Route element={<Base />}>
          <Route path="/home" element={<div className="p-4"><Home /></div>} />
          <Route path="/library" element={<Library />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/viewer/:id" element={<PdfPreview />} />
          <Route path="/subjects/:id" element={<SubjectPage />} />
          <Route path="/study-plans/:id" element={<StudyPlanPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/chat" element={<ChatRoomsPage />} />
          <Route path="/chat/rooms/:roomId" element={<ChatRoomPage />} />
        </Route>
      </Route>

      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Welcome />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
