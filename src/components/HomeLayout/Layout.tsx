import AuthGate from "../AuthGate";
import Sidebar from "./Sidebar/Sidebar";

export default function Layout() {
  return (
    <AuthGate>
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        {/* Đây là phần nội dung chính */}
        <h1 className="text-2xl font-bold">Nội dung chính</h1>
        <p>
          Cuộn thử nội dung ở đây để kiểm tra scroll giữa sidebar và content.
        </p>
        {/* Dòng dưới để tạo nội dung cuộn dài */}
        <div className="h-[2000px] bg-gradient-to-b from-blue-100 to-blue-300 mt-4" />
      </div>
    </div>
    </AuthGate>
  );
}
