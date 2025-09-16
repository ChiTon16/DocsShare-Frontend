// src/components/Header.tsx
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/images/icons/logo-docs.png";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/services/auth";

const Header = () => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const isLoadingUser = loading;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) &&
          !menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const initials =
    isLoadingUser
      ? "" // đang load thì chưa hiển thị
      : (user?.name || user?.email || "U")
          .split(" ").filter(Boolean).slice(0, 2)
          .map(s => s[0]!.toUpperCase()).join("");

  return (
    <div className="sticky top-0 z-[1000] flex items-center justify-between w-full px-6 py-3 bg-white shadow-md">
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-[50px] w-[50px] object-contain mr-3 sm:h-10 sm:w-10" />
        <strong className="text-2xl font-bold text-[#2c3e50] sm:text-xl">yubeldocs</strong>
      </div>

      <div className="flex items-center gap-5 sm:gap-3 sm:text-sm flex-wrap justify-end">
        <span className="text-[#34495e] hover:text-[#3498db] cursor-pointer">Universities</span>
        <span className="text-[#34495e] hover:text-[#3498db] cursor-pointer">Upgrade</span>
        <span className="text-[#34495e] hover:text-[#3498db] cursor-pointer">
          <i className="bi bi-gear text-[1.2rem]" />
        </span>

        <div className="relative">
          <button
            ref={btnRef}
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-gray-50 border border-gray-200/70"
          >
            {/* Avatar / Skeleton */}
            <div className="h-8 w-8 rounded-full overflow-hidden bg-emerald-600/90 text-white grid place-items-center text-xs font-bold">
              {isLoadingUser ? (
                <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <i className={`bi bi-chevron-down text-[1.0rem] text-[#34495e] ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-[12px] py-2 z-[1100]"
            >
              <div className="px-3 pb-2 pt-2">
                <p className="text-sm font-semibold text-[#2c3e50]">
                  {isLoadingUser ? (
                    <span className="inline-block h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    user?.name || "User"
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isLoadingUser ? (
                    <span className="inline-block h-3 w-36 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    user?.email || ""
                  )}
                </p>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <MenuItem icon="person" label="Profile" onClick={() => setOpen(false)} />
              <MenuItem icon="sliders" label="Settings" onClick={() => setOpen(false)} />
              <MenuItem icon="credit-card" label="Billing" onClick={() => setOpen(false)} />
              <div className="h-px bg-gray-100 my-1" />
              <MenuItem
                icon="box-arrow-right"
                label="Sign out"
                danger
                onClick={() => logout({ redirectTo: "/auth" })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 ${
      danger ? "text-red-600 hover:bg-red-50" : "text-[#34495e]"
    }`}
  >
    <i className={`bi bi-${icon} text-base`} />
    <span className="truncate">{label}</span>
  </button>
);

export default Header;
