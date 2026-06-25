"use client";

import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { roleToPath } from "@/lib/utils/roleMapping";
import { useAuthStore } from "@/lib/stores";
import { setCache, CACHE_KEYS, CACHE_EXPIRY } from "@/lib/utils/cache";
import { parseBackendError, SUCCESS_MESSAGES } from "@/lib/error-messages";
import { translateBranchType, translateRole } from "@/lib/translations";
import { toast } from "sonner";
import type { BranchType } from "@/types";

// ── Pure SVG icons — zero external component imports ─────────────────────────

const SVG_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IcoPhone({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.72a16 16 0 0 0 6.37 6.37l.96-.97a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IcoShield({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IcoLock({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IcoSparkles({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </svg>
  );
}
function IcoBuilding({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </svg>
  );
}
function IcoLoader({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function IcoArrowLeft({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
function IcoCheck({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}
function IcoEye({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IcoEyeOff({ cls }: { cls: string }) {
  return (
    <svg {...SVG_PROPS} className={cls}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function LogoMark({ size }: { size: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-11 h-11";
  return (
    <div className={`${dim} rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"
           strokeLinecap="round" strokeLinejoin="round"
           className={size === "sm" ? "w-4 h-4" : "w-6 h-6"}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    </div>
  );
}

// ── Step types & constants ────────────────────────────────────────────────────

type Step = "phone" | "otp" | "set-password" | "login" | "select-branch";

const STEP_TITLE: Record<Step, string> = {
  phone: "Xush kelibsiz!", otp: "Tasdiqlash",
  "set-password": "Parol yaratish", login: "Tizimga kirish",
  "select-branch": "Filial tanlang",
};

const STEP_STATIC_DESC: Partial<Record<Step, string>> = {
  phone: "Telefon raqamingizni kiriting",
  "set-password": "Xavfsiz parol o'rnating",
  login: "Ma'lumotlaringizni kiriting",
  "select-branch": "Qaysi filialga kirmoqchisiz?",
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const phoneRe     = /^\+998\d{9}$/;
const phoneSchema = z.object({ phone_number: z.string().regex(phoneRe, "Telefon raqami noto'g'ri formatda") });
const pwSchema    = z.object({ password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak") });
const loginSchema = z.object({
  phone_number: z.string().regex(phoneRe, "Telefon raqami noto'g'ri formatda"),
  password:     z.string().min(1, "Parol kiritilishi shart"),
});

// ── Reducer ───────────────────────────────────────────────────────────────────

interface S {
  step: Step;
  phone: string;        phoneErr: string;
  otpValue: string;     otpCooldown: number;
  password: string;     pwErr: string;
  confirmPw: string;    confirmPwErr: string;
  loginPhone: string;   loginPw: string;
  loginPhoneErr: string; loginPwErr: string;
  showPw: boolean;      showConfirmPw: boolean; showLoginPw: boolean;
  branches: any[];      loading: boolean;
}

const INIT: S = {
  step: "phone",
  phone: "", phoneErr: "",
  otpValue: "", otpCooldown: 0,
  password: "", pwErr: "",
  confirmPw: "", confirmPwErr: "",
  loginPhone: "", loginPw: "",
  loginPhoneErr: "", loginPwErr: "",
  showPw: false, showConfirmPw: false, showLoginPw: false,
  branches: [], loading: false,
};

function reducer(s: S, a: { type: "P"; patch: Partial<S> } | { type: "TICK" }): S {
  return a.type === "TICK" ? { ...s, otpCooldown: s.otpCooldown - 1 } : { ...s, ...a.patch };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component — zero external React component imports
// ═══════════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser, setMeData } = useAuthStore();
  const [s, dispatch] = React.useReducer(reducer, INIT);
  const set = (patch: Partial<S>) => dispatch({ type: "P", patch });

  React.useEffect(() => {
    const check = () => {
      const { isAuthenticated, currentBranch } = useAuthStore.getState();
      if (isAuthenticated && currentBranch) {
        router.replace(`/${roleToPath(currentBranch.role, currentBranch.branch_type as BranchType)}`);
      }
    };
    if (useAuthStore.persist.hasHydrated()) check();
    else {
      const unsub = useAuthStore.persist.onFinishHydration(() => { check(); unsub(); });
    }
  }, [router]);

  React.useEffect(() => {
    if (s.otpCooldown <= 0) return;
    const t = setTimeout(() => dispatch({ type: "TICK" }), 1000);
    return () => clearTimeout(t);
  }, [s.otpCooldown]);

  const doLogin = async (phone: string, pw: string, branchId?: string) => {
    const resp = await authApi.login({
      phone_number: phone, password: pw,
      ...(branchId ? { branch_id: branchId } : {}),
    });
    if (!("access" in resp && resp.access)) return;
    setTokens(resp.access, resp.refresh);
    setUser(resp.user);
    const me = await authApi.getMe();
    setCache(CACHE_KEYS.USER_DATA, me, CACHE_EXPIRY.USER_PROFILE);
    setMeData(me);
    const b = me.current_branch;
    if (b && typeof document !== "undefined") {
      document.cookie = `auth-role-path=/${roleToPath(b.role, b.branch_type as BranchType)}; path=/; max-age=2592000; SameSite=Lax`;
    }
    router.push(`/${roleToPath(me.current_branch?.role ?? "student", me.current_branch?.branch_type)}`);
  };

  const handleCheckPhone = async () => {
    const r = phoneSchema.safeParse({ phone_number: s.phone });
    const err = r.success ? "" : r.error.issues[0]?.message ?? "Xato";
    set({ phoneErr: err });
    if (err) return;
    try {
      set({ loading: true });
      const resp = await authApi.checkPhone({ phone_number: s.phone });
      if (resp.state === "NOT_FOUND") {
        toast.error("Telefon raqam ro'yxatdan o'tmagan", { description: "Administrator bilan bog'laning." });
      } else if (resp.state === "NOT_VERIFIED" || resp.state === "NEEDS_PASSWORD") {
        await authApi.requestOTP({ phone_number: s.phone });
        toast.success(SUCCESS_MESSAGES.otp_sent);
        set({ step: "otp", otpCooldown: 60 });
      } else if (resp.state === "READY") {
        set({ step: "login", loginPhone: s.phone });
      }
    } catch (e: any) { toast.error(parseBackendError(e)); }
    finally { set({ loading: false }); }
  };

  const handleVerifyOTP = async () => {
    if (s.otpValue.length !== 6) return;
    try {
      set({ loading: true });
      await authApi.confirmOTP({ phone_number: s.phone, code: s.otpValue });
      toast.success(SUCCESS_MESSAGES.otp_verified);
      set({ step: "set-password", otpValue: "" });
    } catch (e: any) { toast.error(parseBackendError(e)); }
    finally { set({ loading: false }); }
  };

  const handleResendOTP = async () => {
    if (s.otpCooldown > 0) return;
    try {
      set({ loading: true });
      await authApi.requestOTP({ phone_number: s.phone });
      toast.success(SUCCESS_MESSAGES.otp_sent);
      set({ otpCooldown: 60 });
    } catch (e: any) { toast.error(parseBackendError(e)); }
    finally { set({ loading: false }); }
  };

  const handleSetPassword = async () => {
    const r   = pwSchema.safeParse({ password: s.password });
    const pwE = r.success ? "" : r.error.issues[0]?.message ?? "Xato";
    const cfE = s.password !== s.confirmPw ? "Parollar bir xil emas" : "";
    set({ pwErr: pwE, confirmPwErr: cfE });
    if (pwE || cfE) return;
    try {
      set({ loading: true });
      await authApi.setPassword({ phone_number: s.phone, password: s.password });
      toast.success(SUCCESS_MESSAGES.password_set);
      set({ step: "login", loginPhone: s.phone, loginPw: s.password });
    } catch (e: any) { toast.error(parseBackendError(e)); }
    finally { set({ loading: false }); }
  };

  const handleLogin = async () => {
    const r = loginSchema.safeParse({ phone_number: s.loginPhone, password: s.loginPw });
    if (!r.success) {
      const issues = r.error.issues;
      set({
        loginPhoneErr: issues.find((i) => i.path[0] === "phone_number")?.message ?? "",
        loginPwErr:    issues.find((i) => i.path[0] === "password")?.message ?? "",
      });
      return;
    }
    set({ loginPhoneErr: "", loginPwErr: "" });
    try {
      set({ loading: true });
      const resp = await authApi.login({ phone_number: s.loginPhone, password: s.loginPw });
      if (resp.state === "MULTI_BRANCH") {
        toast.info("Filialni tanlang", { description: "Siz bir nechta filialga a'zosiz." });
        set({ branches: resp.branches, step: "select-branch" });
      } else if (resp.state === "NO_BRANCH") {
        toast.error("Sizda faol filial yo'q", { description: "Administrator bilan bog'laning." });
      } else if ("access" in resp && resp.access) {
        await doLogin(s.loginPhone, s.loginPw);
        toast.success(SUCCESS_MESSAGES.login_success);
      }
    } catch (e: any) { toast.error(parseBackendError(e)); }
    finally { set({ loading: false }); }
  };

  const handleSelectBranch = async (branchId: string) => {
    try {
      set({ loading: true });
      await doLogin(s.loginPhone, s.loginPw, branchId);
      toast.success(SUCCESS_MESSAGES.login_success);
    } catch (e: any) { toast.error(parseBackendError(e)); }
    finally { set({ loading: false }); }
  };

  const goBack = () => {
    const prev: Partial<Record<Step, Step>> = {
      otp: "phone", "set-password": "otp", login: "phone", "select-branch": "login",
    };
    const p = prev[s.step];
    if (p) set({ step: p });
  };

  const stepDesc = s.step === "otp"
    ? `Kod ${s.phone} raqamiga yuborildi`
    : STEP_STATIC_DESC[s.step] ?? "";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">

      {/* Top-left logo */}
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <LogoMark size="sm" />
        <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Mendeleyev
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="p-8 shadow-xl rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60">

          {/* Step header */}
          <div className="mb-6">
            {s.step !== "phone" && (
              <button type="button" onClick={goBack}
                      className="mb-4 -ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <IcoArrowLeft cls="w-4 h-4" />
                Orqaga
              </button>
            )}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md text-white">
                {s.step === "phone"         && <IcoPhone    cls="w-5 h-5" />}
                {s.step === "otp"           && <IcoShield   cls="w-5 h-5" />}
                {s.step === "set-password"  && <IcoLock     cls="w-5 h-5" />}
                {s.step === "login"         && <IcoSparkles cls="w-5 h-5" />}
                {s.step === "select-branch" && <IcoBuilding cls="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-0.5">{STEP_TITLE[s.step]}</h2>
                <p className="text-sm text-gray-500">{stepDesc}</p>
              </div>
            </div>
          </div>

          {/* ── Phone ── */}
          {s.step === "phone" && (
            <form onSubmit={(e) => { e.preventDefault(); handleCheckPhone(); }} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telefon raqam</label>
                <PhoneInline value={s.phone} onChange={(v) => set({ phone: v, phoneErr: "" })} error={s.phoneErr} />
              </div>
              <Btn loading={s.loading} loadingText="Tekshirilmoqda...">
                Davom etish
              </Btn>
            </form>
          )}

          {/* ── OTP ── */}
          {s.step === "otp" && (
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }} className="space-y-5">
              <div className="space-y-3">
                <OTPInline value={s.otpValue} onChange={(v) => set({ otpValue: v })} disabled={s.loading} />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">Kod kelmadimi?</p>
                  <button type="button" onClick={handleResendOTP}
                          disabled={s.otpCooldown > 0 || s.loading}
                          className="text-blue-600 text-sm font-medium hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed">
                    {s.otpCooldown > 0 ? `Qayta yuborish (${s.otpCooldown}s)` : "Qayta yuborish"}
                  </button>
                </div>
              </div>
              <Btn loading={s.loading} loadingText="Tekshirilmoqda..." disabled={s.otpValue.length !== 6}>
                <IcoCheck cls="mr-2 h-5 w-5" /> Tasdiqlash
              </Btn>
            </form>
          )}

          {/* ── Set password ── */}
          {s.step === "set-password" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSetPassword(); }} className="space-y-5">
              <PwField label="Yangi parol" placeholder="Kamida 8 ta belgi"
                       value={s.password} onChange={(v) => set({ password: v, pwErr: "" })}
                       show={s.showPw} onToggle={() => set({ showPw: !s.showPw })} error={s.pwErr} />
              <PwField label="Parolni tasdiqlang" placeholder="Parolni qayta kiriting"
                       value={s.confirmPw} onChange={(v) => set({ confirmPw: v, confirmPwErr: "" })}
                       show={s.showConfirmPw} onToggle={() => set({ showConfirmPw: !s.showConfirmPw })} error={s.confirmPwErr} />
              <Btn loading={s.loading} loadingText="Saqlanmoqda...">
                <IcoLock cls="mr-2 h-5 w-5" /> Parolni saqlash
              </Btn>
            </form>
          )}

          {/* ── Login ── */}
          {s.step === "login" && (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telefon raqam</label>
                <PhoneInline value={s.loginPhone} onChange={(v) => set({ loginPhone: v, loginPhoneErr: "" })} error={s.loginPhoneErr} />
              </div>
              <PwField label="Parol" placeholder="Parolingizni kiriting"
                       value={s.loginPw} onChange={(v) => set({ loginPw: v, loginPwErr: "" })}
                       show={s.showLoginPw} onToggle={() => set({ showLoginPw: !s.showLoginPw })} error={s.loginPwErr} />
              <Btn loading={s.loading} loadingText="Kirilmoqda...">
                <IcoSparkles cls="mr-2 h-5 w-5" /> Tizimga kirish
              </Btn>
            </form>
          )}

          {/* ── Branch selection ── */}
          {s.step === "select-branch" && (
            <div className="space-y-3">
              {s.branches.map((branch) => (
                <button key={branch.branch_id} onClick={() => handleSelectBranch(branch.branch_id)}
                        disabled={s.loading}
                        className="w-full group p-4 text-left rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-all flex-shrink-0 text-blue-600 group-hover:text-white">
                      <IcoBuilding cls="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1 truncate">{branch.branch_name}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{translateRole(branch.role)}</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white border border-gray-200 text-gray-600">{translateBranchType(branch.branch_type)}</span>
                        {branch.title && <span className="text-xs text-gray-500">{branch.title}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Mendeleyev · IT Academy</p>
      </div>
    </div>
  );
}

// ── Inline helpers — only intrinsic HTML elements, no external imports ────────

function PhoneInline({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const digits = value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  return (
    <div>
      <div className={`flex h-12 rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${error ? "border-red-400" : "border-gray-200"}`}>
        <div className="flex items-center px-3 bg-gray-50 border-r border-gray-200 shrink-0 select-none">
          <span className="text-base font-semibold text-gray-700">+998</span>
        </div>
        <input type="tel" maxLength={9} autoComplete="tel-national"
               value={digits}
               onChange={(e) => onChange(`+998${e.target.value.replace(/\D/g, "").slice(0, 9)}`)}
               placeholder="XX XXX XX XX"
               className="flex-1 px-3 text-base bg-white focus:outline-none placeholder:text-gray-300 font-medium tracking-wide" />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function OTPInline({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const LEN = 6;
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const otp = Array.from({ length: LEN }, (_, i) => value[i] || "");

  const update = (next: string[]) => onChange(next.join(""));

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    if (val.length > 1) {
      val.slice(0, LEN).split("").forEach((c, j) => { if (i + j < LEN) next[i + j] = c; });
      update(next);
      refs.current[Math.min(i + val.length - 1, LEN - 1)]?.focus();
    } else {
      next[i] = val; update(next);
      if (val && i < LEN - 1) refs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...otp];
      if (otp[i]) { next[i] = ""; update(next); }
      else if (i > 0) { next[i - 1] = ""; update(next); refs.current[i - 1]?.focus(); }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text/plain").slice(0, LEN);
    if (!/^\d+$/.test(p)) return;
    update(Array.from({ length: LEN }, (_, j) => p[j] || ""));
    refs.current[Math.min(p.length - 1, LEN - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }}
               type="text" maxLength={1} value={d}
               onChange={(e) => handleChange(i, e.target.value)}
               onKeyDown={(e) => handleKeyDown(i, e)}
               onPaste={handlePaste}
               disabled={disabled}
               className="w-12 h-12 text-center text-lg font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 disabled:opacity-50" />
      ))}
    </div>
  );
}

function Btn({ children, loading, loadingText, disabled }: {
  children?: React.ReactNode;
  loading: boolean; loadingText: string;
  disabled?: boolean;
}) {
  return (
    <button type="submit" disabled={loading || disabled}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md rounded-lg flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
      {loading
        ? <><IcoLoader cls="mr-2 h-5 w-5 animate-spin" />{loadingText}</>
        : children}
    </button>
  );
}

function PwField({ label, placeholder, value, onChange, show, onToggle, error }: {
  label: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} placeholder={placeholder}
               value={value} onChange={(e) => onChange(e.target.value)}
               className="h-11 w-full pr-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
               autoComplete="off" />
        <button type="button" onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <IcoEyeOff cls="h-4 w-4" /> : <IcoEye cls="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
