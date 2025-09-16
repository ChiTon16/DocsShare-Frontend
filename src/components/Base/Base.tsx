// components/Base/Base.tsx
import { useState, useEffect } from "react";
import Header from "../HomeLayout/Header/Header";
import Sidebar from "../HomeLayout/Sidebar/Sidebar";
import AuthGate from "../AuthGate";
import { Outlet } from "react-router-dom";

function Base() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <AuthGate>
    <div className="h-screen flex flex-col">
      {/* Header */}
      {/* Header giữ nguyên: */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-white border-b border-gray-300">
        <Header />
      </div>

      {/* Dưới header: DÙNG TOẠ ĐỘ CỐ ĐỊNH, KHÔNG calc() */}
      <div
        className="fixed inset-x-0 bottom-0 top-[60px] grid [grid-template-columns:var(--sb)_minmax(0,1fr)] transition-[grid-template-columns] duration-300 ease-in-out"
        style={{
          ["--sb" as any]: isMobile ? "0px" : collapsed ? "72px" : "280px",
        }}
      >
        {!isMobile && (
          <div className="relative z-30 overflow-visible min-h-0">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          </div>
        )}

        {/* CỘT CONTENT: rất quan trọng => min-h-0 để không đội chiều cao */}
        <main
          id="app-content-scroll"            // 👈 thêm id
          className="relative z-10 min-w-0 min-h-0 overflow-y-auto bg-white font-[DM_Sans]"
        >
          <Outlet />
        </main>
      </div>
    </div>
    </AuthGate>
  );
}

export default Base;
