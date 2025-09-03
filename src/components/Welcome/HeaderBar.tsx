import { useEffect, useState } from "react";
import logo from "../../assets/images/icons/logo-docs.png";

export default function HeaderBar() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12); // cuộn quá 12px thì đổi màu
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        solid ? "bg-white shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1200px] h-16 md:h-20 px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Yudocs logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
          <span className="text-xl md:text-2xl font-extrabold text-[#2b2b2b]">
            Yudocs
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 text-[#2b2b2b]/80 font-medium">
          <a className="hover:text-[#2b2b2b] transition" href="#">About</a>
          <a className="hover:text-[#2b2b2b] transition" href="#">Projects</a>
          <a className="hover:text-[#2b2b2b] transition" href="#">Pricing</a>
        </nav>

        {/* Login */}
        <a
          href="/auth"
          className="inline-flex items-center justify-center h-10 px-5 rounded-full
                     bg-emerald-600 text-white font-semibold shadow-[0_8px_24px_rgba(16,185,129,.35)]
                     hover:brightness-110 transition"
        >
          Login/Sign Up
        </a>
      </div>
    </header>
  );
}
