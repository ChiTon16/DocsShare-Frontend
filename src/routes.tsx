// routes.tsx
import { Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome/Welcome";
import Base from "./components/Base/Base";
import AuthPage from "./components/AuthPage/AuthPage";
import Upload from "./components/Documents/Upload/upload";
import RequireAuth from "./require";
// Pages hoặc components đại diện cho từng route
const Library = () => <div className="p-4">📚 My Library Page</div>;
const Notes = () => <div className="p-4">📝 AI Notes Page</div>;
const Ask = () => <div className="p-4">💬 Ask AI Page</div>;
const Quiz = () => <div className="p-4">❓ AI Quiz Page</div>;
const Recent = () => <div className="p-4">🕓 Recent Activity</div>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/home" element={<Base />} />
        <Route path="/library" element={<Library />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/recent" element={<Recent />} />
        <Route path="/upload" element={<Upload />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Welcome />} />
    </Routes>
  );
}
