"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { OTPInput } from "@/components/auth/OTPInput";
import { useAuth } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { roleToPath } from "@/lib/utils/roleMapping";
import { parseBackendError, SUCCESS_MESSAGES } from "@/lib/error-messages";
import { translateBranchType, translateRole } from "@/lib/translations";
import { toast } from "sonner";
import type { AuthState } from "@/types";
import { 
  Loader2, 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  Shield, 
  Users, 
  Sparkles,
  CheckCircle,
  Lock,
  Phone,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";

const phoneSchema = z.object({
  phone_number: z.string().regex(/^\+998\d{9}$/, "Telefon raqami noto'g'ri formatda"),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak"),
  confirmPassword: z.string().min(1, "Parolni takrorlang"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parollar bir xil emas",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  phone_number: z.string().regex(/^\+998\d{9}$/, "Telefon raqami noto'g'ri formatda"),
  password: z.string().min(1, "Parol kiritilishi shart"),
});

type Step = "phone" | "otp" | "set-password" | "login" | "select-branch";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = React.useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [authState, setAuthState] = React.useState<AuthState | null>(null);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [otpCooldown, setOtpCooldown] = React.useState(0);
  const [otpValue, setOtpValue] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone_number: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone_number: "", password: "" },
  });

  React.useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const handleCheckPhone = async (data: { phone_number: string }) => {
    try {
      setIsLoading(true);
      setPhoneNumber(data.phone_number);

      const response = await authApi.checkPhone({ phone_number: data.phone_number });
      console.log("CheckPhone response:", response);

      if (response.state === "NOT_FOUND") {
        toast.error("Telefon raqam ro'yxatdan o'tmagan", {
          description: "Administrator bilan bog'laning.",
        });
      } else if (response.state === "NOT_VERIFIED") {
        await authApi.requestOTP({ phone_number: data.phone_number });
        toast.success(SUCCESS_MESSAGES.otp_sent);
        setOtpCooldown(60);
        setStep("otp");
      } else if (response.state === "NEEDS_PASSWORD") {
        await authApi.requestOTP({ phone_number: data.phone_number });
        toast.success(SUCCESS_MESSAGES.otp_sent);
        setOtpCooldown(60);
        setStep("otp");
      } else if (response.state === "READY") {
        loginForm.setValue("phone_number", data.phone_number);
        setStep("login");
      }
    } catch (error: any) {
      console.error("CheckPhone error:", error);
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) return;
    
    try {
      setIsLoading(true);

      const response = await authApi.confirmOTP({ phone_number: phoneNumber, code: otpValue });
      console.log("OTP verify response:", response);

      toast.success(SUCCESS_MESSAGES.otp_verified);
      setStep("set-password");
      setOtpValue("");
    } catch (error: any) {
      console.error("OTP verify error:", error);
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCooldown > 0) return;

    try {
      setIsLoading(true);
      await authApi.requestOTP({ phone_number: phoneNumber });
      console.log("OTP resent");
      toast.success(SUCCESS_MESSAGES.otp_sent);
      setOtpCooldown(60);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (data: { password: string; confirmPassword: string }) => {
    try {
      setIsLoading(true);

      const response = await authApi.setPassword({ phone_number: phoneNumber, password: data.password });
      console.log("Set password response:", response);

      toast.success(SUCCESS_MESSAGES.password_set);
      loginForm.setValue("phone_number", phoneNumber);
      loginForm.setValue("password", data.password);
      setStep("login");
    } catch (error: any) {
      console.error("Set password error:", error);
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: { phone_number: string; password: string }) => {
    try {
      setIsLoading(true);

      const response = await authApi.login({ phone_number: data.phone_number, password: data.password });
      console.log("Login response:", response);

      if (response.state === "MULTI_BRANCH") {
        toast.info("Filialni tanlang", {
          description: "Siz bir nechta filialga a'zosiz.",
        });
        setBranches(response.branches);
        setStep("select-branch");
      } else if (response.state === "NO_BRANCH") {
        toast.error("Sizda faol filial yo'q", {
          description: "Administrator bilan bog'laning.",
        });
      } else if ("access" in response && response.access) {
        // Single branch - direct login success
        const result = await login({
          phone_number: data.phone_number,
          password: data.password,
        });
        
        if (result.success) {
          toast.success(SUCCESS_MESSAGES.login_success);
          
          // Redirect based on role and branch type
          const meData = await authApi.getMe();
          const role = meData.current_branch?.role || "student";
          const branchType = meData.current_branch?.branch_type;
          router.push(`/${roleToPath(role, branchType)}`);
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBranch = async (branchId: string) => {
    try {
      setIsLoading(true);

      const result = await login({
        phone_number: loginForm.getValues("phone_number"),
        password: loginForm.getValues("password"),
        branch_id: branchId,
      });

      if (result.success) {
        toast.success(SUCCESS_MESSAGES.login_success);
        
        // Redirect based on role and branch type
        const meData = await authApi.getMe();
        const role = meData.current_branch?.role || "student";
        const branchType = meData.current_branch?.branch_type;
        router.push(`/${roleToPath(role, branchType)}`);
      }
    } catch (error: any) {
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] relative">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{
                 backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                 backgroundSize: '50px 50px'
               }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-32 right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top Section */}
          <div>
            {/* Logo */}
            <div className="inline-flex items-center gap-3 mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl"></div>
                <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                  <GraduationCap className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Mendeleyev</h1>
                <p className="text-blue-100 text-sm font-medium">Education Management System</p>
              </div>
            </div>

            {/* Main Heading */}
            <div className="max-w-lg space-y-6 mb-16">
              <h2 className="text-5xl font-bold leading-tight">
                Ta'limni boshqarish
                <span className="block text-blue-200">oson va samarali</span>
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Zamonaviy texnologiyalar yordamida ta'lim jarayonini professional darajada boshqaring
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              <div className="group p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-11 h-11 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">Multi-filial</h3>
                <p className="text-sm text-blue-100 leading-relaxed">Bir nechta filial va markazlarni boshqarish</p>
              </div>

              <div className="group p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-11 h-11 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">Xavfsizlik</h3>
                <p className="text-sm text-blue-100 leading-relaxed">SMS tasdiqlash va shifrlangan ma'lumotlar</p>
              </div>

              <div className="group p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-11 h-11 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">Rol tizimi</h3>
                <p className="text-sm text-blue-100 leading-relaxed">Har bir rol uchun maxsus imkoniyatlar</p>
              </div>

              <div className="group p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-11 h-11 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">Tezkor</h3>
                <p className="text-sm text-blue-100 leading-relaxed">Real-time ma'lumotlar va hisobotlar</p>
              </div>
            </div>
          </div>

          {/* Bottom Section - Credits */}
          <div className="border-t border-white/20 pt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 mb-1">
                  Ishlab chiqildi <span className="font-semibold text-white">IT Academy</span> tomonidan
                </p>
                <p className="text-xs text-blue-200">© 2025 Barcha huquqlar himoyalangan</p>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-100">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mendeleyev
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">Ta'lim boshqaruv tizimi</p>
          </div>

          {/* Auth Card */}
          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
            {/* Header */}
            <div className="mb-6">
              {step !== "phone" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (step === "otp") setStep("phone");
                    else if (step === "set-password") setStep("otp");
                    else if (step === "login") setStep("phone");
                    else if (step === "select-branch") setStep("login");
                  }}
                  className="mb-4 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Orqaga
                </Button>
              )}
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {step === "phone" && <Phone className="w-6 h-6 text-white" />}
                  {step === "otp" && <Shield className="w-6 h-6 text-white" />}
                  {step === "set-password" && <Lock className="w-6 h-6 text-white" />}
                  {step === "login" && <Sparkles className="w-6 h-6 text-white" />}
                  {step === "select-branch" && <Building2 className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {step === "phone" && "Xush kelibsiz!"}
                    {step === "otp" && "Tasdiqlash"}
                    {step === "set-password" && "Parol yaratish"}
                    {step === "login" && "Tizimga kirish"}
                    {step === "select-branch" && "Filial tanlang"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {step === "phone" && "Telefon raqamingizni kiriting"}
                    {step === "otp" && `Kod ${phoneNumber} raqamiga yuborildi`}
                    {step === "set-password" && "Xavfsiz parol o'rnating"}
                    {step === "login" && "Ma'lumotlaringizni kiriting"}
                    {step === "select-branch" && "Qaysi filialga kirmoqchisiz?"}
                  </p>
                </div>
              </div>
            </div>

            {/* Forms */}
            <div className="space-y-5">
              {/* Phone Step */}
              {step === "phone" && (
                <form onSubmit={phoneForm.handleSubmit(handleCheckPhone)} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Telefon raqam</Label>
                    <PhoneInput
                      value={phoneForm.watch("phone_number")}
                      onChange={(value) => phoneForm.setValue("phone_number", value)}
                      error={phoneForm.formState.errors.phone_number?.message}
                      label=""
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/50" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Tekshirilmoqda...
                      </>
                    ) : (
                      "Davom etish"
                    )}
                  </Button>
                </form>
              )}

              {/* OTP Step */}
              {step === "otp" && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <OTPInput
                      value={otpValue}
                      onChange={setOtpValue}
                      disabled={isLoading}
                      label=""
                    />
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-3">Kod kelmadimi?</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleResendOTP}
                        disabled={otpCooldown > 0 || isLoading}
                        className="text-blue-600 font-medium"
                      >
                        {otpCooldown > 0 ? `Qayta yuborish (${otpCooldown}s)` : "Qayta yuborish"}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleVerifyOTP}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/50" 
                    disabled={isLoading || otpValue.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Tekshirilmoqda...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Tasdiqlash
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Set Password Step */}
              {step === "set-password" && (
                <form onSubmit={passwordForm.handleSubmit(handleSetPassword)} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Yangi parol</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Kamida 8 ta belgi"
                        className="h-11 pr-10"
                        autoComplete="off"
                        {...passwordForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.password.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Parol xavfsiz va esda qolarli bo'lishi kerak</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Parolni tasdiqlang</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Parolni qayta kiriting"
                        className="h-11 pr-10"
                        autoComplete="off"
                        {...passwordForm.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/50" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Parolni saqlash
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Login Step */}
              {step === "login" && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Telefon raqam</Label>
                    <PhoneInput
                      value={loginForm.watch("phone_number")}
                      onChange={(value) => loginForm.setValue("phone_number", value)}
                      error={loginForm.formState.errors.phone_number?.message}
                      label=""
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Parol</Label>
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Parolingizni kiriting"
                        className="h-11 pr-10"
                        autoComplete="off"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/50" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Kirilmoqda...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Tizimga kirish
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Branch Selection Step */}
              {step === "select-branch" && (
                <div className="space-y-3">
                  {branches.map((branch) => (
                    <button
                      key={branch.branch_id}
                      onClick={() => handleSelectBranch(branch.branch_id)}
                      disabled={isLoading}
                      className="w-full group p-4 text-left rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-500 group-hover:to-indigo-600 transition-all">
                          <Building2 className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{branch.branch_name}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {translateRole(branch.role)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {translateBranchType(branch.branch_type)}
                            </Badge>
                            {branch.title && (
                              <span className="text-xs text-gray-500">{branch.title}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-xs text-gray-500">
              Ishlab chiqildi <span className="font-semibold text-gray-700">IT Academy</span> tomonidan
            </p>
            <p className="text-xs text-gray-400 mt-1">© 2025 Barcha huquqlar himoyalangan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
