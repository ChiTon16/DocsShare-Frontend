// src/components/AuthPage/AuthPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { login, register } from "@/services/auth";
import {
  getSchools,
  getMajors,
  type School,
  type Major,
} from "@/services/catalog";
import ComboBox from "../UI/combobox";
import Cookies from "js-cookie";
import type { CurrentUser } from "@/services/user";
import { axiosInstance } from "@/utils/AxiosInterceptor";

type Mode = "login" | "signup";
type LoginForm = { email: string; password: string };
type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  terms?: string;
  schoolId?: string;
  majorId?: string;
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  // Danh mục độc lập
  const [schools, setSchools] = useState<School[]>([]);
  const [majors, setMajorsState] = useState<Major[]>([]);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [majorLoading, setMajorLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // --- Avatar state & preview ---
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
  const f = e.target.files?.[0];
  if (!f) return;
  setAvatarFile(f);
  // Tạo URL tạm để xem trước
  const url = URL.createObjectURL(f);
  setAvatarPreview(url);
}

const handleLoginSuccess = (userData: CurrentUser) => {

  // Chuyển hướng tới trang home
  nav("/home");
};


// Giải phóng URL tạm khi đổi ảnh / unmount
useEffect(() => {
  return () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  };
}, [avatarPreview]);


// Hàm xử lý khi người dùng chọn tệp hình ảnh
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string); // Lưu URL tạm thời vào avatarUrl
    };
    reader.readAsDataURL(file); // Đọc file và chuyển thành URL
  }
};


  // Nạp song song khi vào signup
  useEffect(() => {
    if (mode !== "signup") return;
    (async () => {
      try {
        setSchoolLoading(true);
        setMajorLoading(true);
        const [s, m] = await Promise.all([getSchools(), getMajors()]);
        setSchools(s || []);
        setMajorsState(m || []);
      } catch (e) {
        setFieldError(
          "Không tải được danh mục Trường/Ngành. Vui lòng thử lại."
        );
      } finally {
        setSchoolLoading(false);
        setMajorLoading(false);
      }
    })();
  }, [mode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
  
    setFieldError("");
    const formEl = e.currentTarget;
    const entries = Object.fromEntries(new FormData(formEl).entries());
  
    try {
      if (mode === "login") {
        const { email, password } = entries as unknown as LoginForm;
        if (!email?.trim() || !password) {
          setFieldError("Please enter email and password");
          pwRef.current?.focus();
          return;
        }
        setSubmitting(true);

        // DỌN SẠCH DẤU VẾT USER CŨ TRƯỚC KHI LOGIN (rất quan trọng)
try { delete (axiosInstance.defaults.headers as any)?.common?.Authorization; } catch {}
Cookies.remove("accessToken", { path: "/" });
Cookies.remove("refreshToken", { path: "/" }); // (tuỳ, khuyến nghị xoá luôn để tránh auto-refresh)

  
        // Thực hiện đăng nhập và nhận phản hồi (token, userData)
        const userData = await login({ email: email.trim(), password });
  
        handleLoginSuccess(userData);
  
        toast.success("Logged in!");
      } else {
        // Xử lý đăng ký tài khoản (sign-up) ở đây...
      }
    } catch (err) {
      if (err instanceof Error) {
        setFieldError(err.message || "Sai email hoặc mật khẩu");
        if (pwRef.current) {
          pwRef.current.value = "";
          pwRef.current.focus();
        }
        return;
      }
      const ax = err as AxiosError<{ message?: string; error?: string }>;
      const serverMsg = ax.response?.data?.message || ax.response?.data?.error;
      setFieldError(
        serverMsg || ax.response?.statusText || "Something went wrong"
      );
      if (pwRef.current) {
        pwRef.current.value = "";
        pwRef.current.focus();
      }
    } finally {
      setSubmitting(false);
    }
  }
  
  

  return (
    <main className="min-h-screen bg-[radial-gradient(60%_50%_at_100%_0%,rgba(16,185,129,0.08),transparent_60%),radial-gradient(60%_50%_at_0%_100%,rgba(16,185,129,0.06),transparent_60%)] px-3 md:px-6 py-10 md:py-16">
      <SuccessDialog
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setMode("login"); // bảo đảm đang ở tab Login
          setTimeout(() => emailRef.current?.focus(), 0); // focus vào ô email
        }}
      />
      <div className="mx-auto max-w-[1200px]">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left giữ nguyên */}
          <section className="order-2 md:order-1">
            <div className="rounded-[24px] md:rounded-[28px] bg-white border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,.08)] p-6 md:p-10">
              <p className="text-lg md:text-xl font-semibold text-gray-500">
                Welcome to
              </p>
              <h1 className="mt-1 text-[38px] leading-[1.05] md:text-[52px] font-extrabold text-[#1c1c1c]">
                Yudocs.
              </h1>
              <p className="mt-4 text-base md:text-lg text-gray-500 max-w-prose">
                {mode === "login"
                  ? "Log in to manage your documents, track progress and collaborate in real-time."
                  : "Create an account to build beautiful, professional documents with us."}
              </p>
              <div className="mt-8 relative">
                <div className="mx-auto aspect-[4/3] w-full max-w-[520px] rounded-[16px] border border-gray-200 overflow-hidden">
                  <div className="grid grid-rows-[auto_1fr_auto] h-full">
                    <div className="h-8 bg-gray-100 border-b border-gray-200 rounded-t-[16px]" />
                    <div className="p-6 flex gap-6">
                      <div className="shrink-0 w-20 h-20 rounded-full border-4 border-gray-200 grid place-items-center">
                        <div className="w-10 h-10 rounded-[6px] bg-emerald-600" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                        <div className="grid grid-cols-5 gap-2 pt-2">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-2 bg-gray-200 rounded" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-4 gap-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-8 bg-gray-200 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute -left-6 bottom-4 w-16 h-16 rounded-[40%] rotate-12 bg-emerald-200/70" />
                <div className="pointer-events-none absolute -right-5 bottom-6 w-14 h-24 rounded-[50%] -rotate-6 bg-emerald-300/70" />
              </div>
            </div>
          </section>

          {/* Right: Auth card */}
          <section className="order-1 md:order-2">
            <div className="rounded-[24px] md:rounded-[28px] bg-white border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,.08)] p-6 md:p-10">
              {/* Segmented control */}
              <div className="inline-flex rounded-[16px] p-1 bg-gray-100 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`h-12 px-5 md:px-6 rounded-[12px] text-sm md:text-base font-semibold transition ${
                    mode === "login"
                      ? "bg-white shadow-[0_6px_18px_rgba(0,0,0,.08)] border border-gray-200 text-[#1c1c1c]"
                      : "text-gray-500 hover:text-[#1c1c1c]"
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`h-12 px-5 md:px-6 rounded-[12px] text-sm md:text-base font-semibold transition ${
                    mode === "signup"
                      ? "bg-white shadow-[0_6px_18px_rgba(0,0,0,.08)] border border-gray-200 text-[#1c1c1c]"
                      : "text-gray-500 hover:text-[#1c1c1c]"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {/* Form */}
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="mt-2 w-full h-12 px-4 rounded-[14px] border border-gray-200 bg-white text-[#1c1c1c] placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  
                )}

{/* Avatar */}
{mode === "signup" && (
  <div>
    <label htmlFor="avatar" className="block text-sm font-semibold text-gray-700">
      Avatar
    </label>

    {/* Khu click chọn file */}
    <label
      htmlFor="avatar"
      className="mt-2 block w-full h-12 rounded-[14px] border border-gray-200 
                 bg-gray-100 grid place-items-center text-gray-500 cursor-pointer
                 hover:bg-gray-200/70"
    >
      {avatarFile ? "Đã chọn ảnh — bấm để đổi" : "Chọn tệp để tải lên"}
    </label>
    <input
      id="avatar"
      name="avatar"
      type="file"
      accept="image/*"
      onChange={handleAvatarChange}
      className="sr-only"
    />

    {/* Xem trước ảnh đã chọn */}
    {avatarPreview && (
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Xem trước</div>
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-white">
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        {/* Nếu muốn hiện tên file */}
        <p className="mt-2 text-xs text-gray-500 truncate">{avatarFile?.name}</p>
      </div>
    )}
  </div>
)}



                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@weebies.com"
                    className="mt-2 w-full h-12 px-4 rounded-[14px] border border-gray-200 bg-white text-[#1c1c1c] placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* School & Major – độc lập */}
                {mode === "signup" && (
                  <>
                    {/* Trường */}
                    <ComboBox
                      label="Trường"
                      name="schoolId"
                      required
                      value={selectedSchool}
                      onChange={setSelectedSchool}
                      items={schools.map((s) => ({
                        value: String(s.id),
                        label: s.name,
                        description: undefined,
                      }))}
                      placeholder="Tìm và chọn Trường"
                      disabled={schoolLoading}
                      loading={schoolLoading}
                    />

                    {/* Ngành */}
                    <ComboBox
                      label="Ngành"
                      name="majorId"
                      required
                      value={selectedMajor}
                      onChange={setSelectedMajor}
                      items={majors.map((m) => ({
                        value: String(m.id),
                        label: `${m.name}${m.code ? ` (${m.code})` : ""}`,
                        description: m.code ? `Mã: ${m.code}` : undefined,
                      }))}
                      placeholder="Tìm và chọn Ngành"
                      disabled={majorLoading}
                      loading={majorLoading}
                    />
                  </>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Password
                    </label>
                    {mode === "login" && (
                      <a
                        href="#"
                        className="text-sm font-semibold text-emerald-700 hover:underline"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="mt-2 relative">
                    <input
                      id="password"
                      name="password"
                      ref={pwRef}
                      type={showPw ? "text" : "password"}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      required
                      placeholder={
                        mode === "login"
                          ? "Your password"
                          : "Create a strong password"
                      }
                      className="w-full h-12 px-4 pr-12 rounded-[14px] border border-gray-200 bg-white text-[#1c1c1c] placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 h-full px-4 text-gray-500 hover:text-[#1c1c1c]"
                    >
                      {/* icon giữ nguyên */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M2.036 12.322C3.423 7.943 7.36 5 12 5c4.64 0 8.577 2.943 9.964 7.322-.24.756-.546 1.469-.91 2.128C19.723 17.457 16.04 20 12 20c-4.04 0-7.5-2.114-9.054-5.55a10.46 10.46 0 01-.91-2.128z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                  {fieldError && (
                    <p className="mt-2 text-sm text-red-600">{fieldError}</p>
                  )}
                </div>

                {mode === "signup" && (
                  <>
                    <div>
                      <label
                        htmlFor="confirm"
                        className="block text-sm font-semibold text-gray-700"
                      >
                        Confirm password
                      </label>
                      <input
                        id="confirm"
                        name="confirm"
                        type={showPw ? "text" : "password"}
                        required
                        placeholder="Re-enter your password"
                        className="mt-2 w-full h-12 px-4 rounded-[14px] border border-gray-200 bg-white text-[#1c1c1c] placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        I agree to the{" "}
                        <a
                          href="#"
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          Terms
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          Privacy Policy
                        </a>
                        .
                      </label>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (mode === "signup" && (schoolLoading || majorLoading))
                  }
                  className="w-full h-14 rounded-[18px] text-white text-lg md:text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_18px_36px_rgba(16,185,129,.35)] hover:shadow-[0_22px_44px_rgba(16,185,129,.45)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Please wait…"
                    : mode === "login"
                    ? "Continue"
                    : "Create account"}
                </button>

                <div className="relative">
                  <div className="my-6 h-px bg-gray-200" />
                  <p className="-mt-8 text-center text-xs text-gray-400">or</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="h-12 rounded-[14px] border border-gray-200 bg-white font-semibold text-[#1c1c1c] hover:bg-gray-50"
                  >
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    className="h-12 rounded-[14px] border border-gray-200 bg-white font-semibold text-[#1c1c1c] hover:bg-gray-50"
                  >
                    Continue with GitHub
                  </button>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  {mode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SuccessDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // click ra nền để đóng
    >
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,.18)] border border-black/5 p-6"
        onClick={(e) => e.stopPropagation()} // chặn nổi bọt
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          {/* icon check */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h3 className="text-xl font-extrabold text-[#1c1c1c] text-center">
          Tạo tài khoản thành công!
        </h3>
        <p className="mt-2 text-center text-gray-600">
          Bạn có thể đăng nhập ngay bây giờ bằng email và mật khẩu vừa đăng ký.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-[0_14px_28px_rgba(16,185,129,.35)] hover:shadow-[0_18px_36px_rgba(16,185,129,.45)]"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
}
