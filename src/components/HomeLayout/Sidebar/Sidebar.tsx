// components/Sidebar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDropdownMenu } from "../Hook/useDropdownMenu";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import NotesIcon from "@mui/icons-material/Notes";
import ForumIcon from "@mui/icons-material/Forum";
import QuizIcon from "@mui/icons-material/Quiz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./Sidebar.css";

// ✅ EXISTING
import { useAuth } from "@/context/AuthContext";
import { getUserDocuments } from "@/services/document";

// ✅ NEW
import { getSchoolById } from "@/services/school";

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // dropdown
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setIsOpen, position, menuRef } = useDropdownMenu(buttonRef);
  const arrowTop = Math.max(8, Math.round(((buttonRef.current?.offsetHeight ?? 40) / 2) - 7));

  // user & uploads
  const { user } = useAuth();
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [loadingUploads, setLoadingUploads] = useState(false);

  // ✅ school name state
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // fetch uploads count
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.userId) return;
      try {
        setLoadingUploads(true);
        const docs = await getUserDocuments(user.userId);
        if (alive) setUploadCount(docs.length);
      } catch {
        if (alive) setUploadCount(0);
      } finally {
        if (alive) setLoadingUploads(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  // ✅ fetch school name by id from currentUser
  useEffect(() => {
    let alive = true;
    const abort = new AbortController();

    (async () => {
      const sid = user?.schoolId;
      if (!sid) {
        if (alive) setSchoolName(null);
        return;
      }
      try {
        setSchoolLoading(true);
        const data = await getSchoolById(Number(sid), abort.signal);
        if (alive) setSchoolName(data?.name || null);
      } catch {
        if (alive) setSchoolName(null);
      } finally {
        if (alive) setSchoolLoading(false);
      }
    })();

    return () => {
      alive = false;
      abort.abort();
    };
  }, [user?.schoolId]);

  // line hiển thị tên trường (ưu tiên tên fetch được)
  const schoolLine = useMemo(() => {
    if (schoolLoading) return "🏛 …";
    if (schoolName) return `🏛 ${schoolName}`;
    if (user?.schoolId) return `🏛 School #${user.schoolId}`;
    return "🏛 University";
  }, [schoolName, schoolLoading, user?.schoolId]);

  // tạm thời follower & upvote = 0
  const followerCount = 0;
  const upvoteCount = 0;

  const menuItems = [
    { label: "Home", icon: <HomeIcon />, path: "/home" },
    { label: "My Library", icon: <LibraryBooksIcon />, path: "/library" },
    { label: "AI Notes", icon: <NotesIcon />, badge: "★", path: "/notes" },
    { label: "Chat Box", icon: <ForumIcon />, badge: "★", path: "/chat" },
    { label: "AI Quiz", icon: <QuizIcon />, badge: "New", path: "/quiz" },
    { label: "Recent", icon: <AccessTimeIcon />, dropdown: true, path: "/recent" },
  ];

  return (
    <div className="relative group overflow-visible h-full">
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-4 top-6 z-20 inline-flex items-center justify-center w-8 h-8
             bg-white border border-gray-300 shadow rounded-full hover:bg-gray-100
             transition-colors duration-200 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      >
        {collapsed ? <ChevronRightIcon fontSize="medium" /> : <ChevronLeftIcon fontSize="medium" />}
      </button>

      {/* Frame */}
      <div className="h-full w-full bg-white border-r border-gray-300 shadow-sm flex flex-col justify-between overflow-y-auto">
        <div className="flex-1 overflow-y-auto [font-family:'DM_Sans',sans-serif]">
          <div className="flex flex-col items-center p-4">
            {/* Avatar + name + school (giữ UI cũ) */}
            <div className="mb-4 text-center">
              <img
                src={user?.avatarUrl || "https://i.pravatar.cc/40"}
                alt="avatar"
                className="w-10 h-10 rounded-full mx-auto"
              />
              {!collapsed && (
                <>
                  <h1 className="text-sm font-semibold mt-2">{user?.name || "User"}</h1>
                  <p className="text-xs text-blue-600 truncate">{schoolLine}</p>
                </>
              )}
            </div>

            {/* Stats (giữ UI cũ) */}
            {!collapsed && (
              <div className="flex justify-around text-center w-full text-sm mb-4">
                <div>
                  <p className="font-semibold text-black">{followerCount}</p>
                  <span className="text-gray-500">Followers</span>
                </div>
                <div>
                  <p className="font-semibold text-black">{loadingUploads ? "…" : uploadCount}</p>
                  <span className="text-gray-500">Uploads</span>
                </div>
                <div>
                  <p className="font-semibold text-black">{upvoteCount}</p>
                  <span className="text-gray-500">Upvotes</span>
                </div>
              </div>
            )}

            {/* New Button */}
            <div className="w-full mb-4 relative">
              <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-blue-500 hover:bg-blue-600 text-white rounded-full w-full px-4 py-2
                flex items-center justify-center transition-all duration-300 ${!collapsed ? "gap-2" : ""}`}
              >
                <AddIcon />
                {!collapsed && <span className="font-medium">New</span>}
              </button>
            </div>

            {/* Menu Items (giữ UI cũ) */}
            <nav className="flex flex-col items-start w-full gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-all hover:bg-blue-50 text-gray-800 relative ${
                    location.pathname === item.path ? "bg-blue-100 text-blue-600 font-semibold" : ""
                  } ${collapsed ? "justify-center" : "gap-3"}`}
                  title={collapsed ? item.label : ""}
                >
                  {item.icon}
                  <span
                    className={`text-sm transition-all duration-300 ${
                      collapsed ? "opacity-0 -translate-x-2 w-0 overflow-hidden" : "opacity-100 translate-x-0"
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge && !collapsed && (
                    <span
                      className={`ml-auto text-xs ${
                        item.badge === "New" ? "bg-pink-200 text-pink-800" : ""
                      } rounded-full px-2 py-0.5`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.dropdown && !collapsed && <ExpandMoreIcon fontSize="small" className="ml-auto" />}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="h-6" />
      </div>

      {/* Portal dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-[260px] dropdown-with-arrow"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              "--arrow-top": `${arrowTop}px`,
            } as React.CSSProperties}
          >
            <ul className="py-2 text-sm">
              <li
                className="flex items-start gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  navigate("/upload");
                  setIsOpen(false);
                }}
              >
                <span className="text-blue-400">☁️</span>
                <div>
                  <p className="font-medium text-gray-900">Upload</p>
                  <p className="text-xs text-gray-500">Contribute to the community</p>
                </div>
              </li>
              <li className="flex items-start gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <span className="text-purple-500">❓</span>
                <div>
                  <p className="font-medium text-gray-900">AI Question</p>
                  <p className="text-xs text-gray-500">Ask a study question</p>
                </div>
              </li>
              <li className="flex items-start gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <span className="text-pink-500">📝</span>
                <div>
                  <p className="font-medium text-gray-900">
                    AI Notes <span className="ml-1 text-[10px] px-1 bg-pink-100 text-pink-600 rounded">New</span>
                  </p>
                  <p className="text-xs text-gray-500">Summarize materials</p>
                </div>
              </li>
              <li className="flex items-start gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <span className="text-purple-700">📊</span>
                <div>
                  <p className="font-medium text-gray-900">
                    AI Quiz <span className="ml-1 text-[10px] px-1 bg-pink-100 text-pink-600 rounded">New</span>
                  </p>
                  <p className="text-xs text-gray-500">Create quizzes instantly</p>
                </div>
              </li>
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Sidebar;
