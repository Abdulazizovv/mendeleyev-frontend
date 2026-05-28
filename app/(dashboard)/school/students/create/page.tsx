"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import type { CreateStudentRequest, CreateStudentRelativeRequest, RelationshipType } from "@/lib/api";
import type { SubscriptionPlan, Discount } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/translations";

// ─── types ─────────────────────────────────────────────────────────────────

interface RelativeForm {
  relationship_type: RelationshipType;
  first_name: string;
  last_name: string;
  middle_name: string;
  phone_number: string;
  email: string;
  is_primary_contact: boolean;
  is_guardian: boolean;
  workplace: string;
  position: string;
  notes: string;
}

interface FormErrors {
  phone_number?: string;
  first_name?: string;
  [key: string]: string | undefined;
}

// ─── constants ─────────────────────────────────────────────────────────────

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  father:      "Otasi",
  mother:      "Onasi",
  brother:     "Akasi / Ukasi",
  sister:      "Opasi / Singlisi",
  grandfather: "Bobosi",
  grandmother: "Buvisi",
  uncle:       "Amakisi / Togasi",
  aunt:        "Ammasi / Xolasi",
  guardian:    "Vasiy",
  other:       "Boshqa",
};

const EMPTY_RELATIVE: RelativeForm = {
  relationship_type: "father",
  first_name: "", last_name: "", middle_name: "",
  phone_number: "", email: "",
  is_primary_contact: false, is_guardian: true,
  workplace: "", position: "", notes: "",
};

// Format only the 9-digit suffix after +998 → "90 123 45 67"
function formatPhoneSuffix(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

function toApiPhone(suffix: string): string {
  return "+998" + suffix.replace(/\D/g, "");
}

// ─── step indicator ─────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Shaxsiy",   icon: User           },
  { n: 2, label: "O'quv",     icon: GraduationCap  },
  { n: 3, label: "Yaqinlar",  icon: Users          },
  { n: 4, label: "Tasdiq",    icon: CheckCircle2   },
];

function StepBar({ current, onGoTo }: { current: number; onGoTo: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done   = current > step.n;
        const active = current === step.n;
        const Icon   = step.icon;
        return (
          <React.Fragment key={step.n}>
            <button
              onClick={() => done && onGoTo(step.n)}
              disabled={!done}
              className={`flex flex-col items-center gap-1 flex-1 group ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done   ? "bg-green-500 text-white"
                : active ? "bg-blue-600 text-white ring-4 ring-blue-100"
                :          "bg-gray-100 text-gray-400"}`}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block
                ${active ? "text-blue-700" : done ? "text-green-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 transition-colors ${current > step.n ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── field wrapper ──────────────────────────────────────────────────────────

function Field({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required
          ? <span className="text-red-500 ml-0.5">*</span>
          : <span className="text-gray-400 text-xs ml-1">(ixtiyoriy)</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── section header ─────────────────────────────────────────────────────────

function Section({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
  );
}

// ─── main component ─────────────────────────────────────────────────────────

export default function CreateStudentPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [step, setStep] = React.useState(1);
  const [errors, setErrors] = React.useState<FormErrors>({});

  // ── Step 1: personal ──────────────────────────────────────────────────────
  const [phone,       setPhone]       = React.useState("");
  const [firstName,   setFirstName]   = React.useState("");
  const [lastName,    setLastName]    = React.useState("");
  const [middleName,  setMiddleName]  = React.useState("");
  const [gender,      setGender]      = React.useState<"male" | "female">("male");
  const [dob,         setDob]         = React.useState("");
  const [address,     setAddress]     = React.useState("");
  const [passport,    setPassport]    = React.useState("");
  const [showPass,    setShowPass]    = React.useState(false);
  const [password,    setPassword]    = React.useState("Student123!");

  // ── Step 2: academic ──────────────────────────────────────────────────────
  const [classId,        setClassId]        = React.useState("none");
  const [planId,         setPlanId]         = React.useState("none");
  const [discountId,     setDiscountId]     = React.useState("none");
  const [planStartDate,  setPlanStartDate]  = React.useState("");
  const [planNextDate,   setPlanNextDate]   = React.useState("");

  // ── Step 3: relatives ─────────────────────────────────────────────────────
  const [relatives,    setRelatives]    = React.useState<RelativeForm[]>([]);
  const [relForm,      setRelForm]      = React.useState<RelativeForm>(EMPTY_RELATIVE);
  const [addingRel,    setAddingRel]    = React.useState(false);
  const [relErrors,    setRelErrors]    = React.useState<Partial<RelativeForm>>({});

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn: () => schoolApi.getClasses(branchId!, { is_active: true }),
    enabled: !!branchId,
  });

  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId, is_active: true }),
    enabled: !!branchId,
  });
  const plans: SubscriptionPlan[] = plansData?.results ?? [];

  const { data: discountsData } = useQuery({
    queryKey: ["discounts", branchId],
    queryFn: () => financeApi.getDiscounts({ branch_id: branchId, is_active: true }),
    enabled: !!branchId,
  });
  const discounts: Discount[] = discountsData?.results ?? [];

  const selectedPlan    = plans.find(p => p.id === planId);
  const selectedDiscount = discounts.find(d => d.id === discountId);
  const selectedClass   = classes.find(c => c.id === classId);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: CreateStudentRequest & Record<string, unknown>) =>
      schoolApi.createStudent(data as CreateStudentRequest),
    onSuccess: (data) => {
      toast.success("O'quvchi muvaffaqiyatli yaratildi!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.push(`/school/students/${data.id}`);
    },
    onError: (err: { response?: { data?: { message?: string; detail?: string; phone_number?: string[] } } }) => {
      const d = err?.response?.data;
      const msg = d?.phone_number?.[0] ?? d?.message ?? d?.detail ?? "Xatolik yuz berdi";
      toast.error(msg);
    },
  });

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const e: FormErrors = {};
    if (!phone.trim())
      e.phone_number = "Telefon raqam majburiy";
    else if (phone.replace(/\D/g, "").length < 9)
      e.phone_number = "9 ta raqam kiriting";
    if (!firstName.trim())
      e.first_name = "Ism majburiy";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateRelForm(): boolean {
    const e: Partial<RelativeForm> = {};
    if (!relForm.first_name.trim()) e.first_name = "Ism majburiy" as never;
    if (!relForm.last_name.trim())  e.last_name  = "Familiya majburiy" as never;
    setRelErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handlePhoneChange(raw: string) {
    setPhone(formatPhoneSuffix(raw));
    if (errors.phone_number) setErrors(prev => ({ ...prev, phone_number: undefined }));
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  }

  function addRelative() {
    if (!validateRelForm()) return;
    setRelatives(prev => [...prev, relForm]);
    setRelForm(EMPTY_RELATIVE);
    setAddingRel(false);
    setRelErrors({});
  }

  function removeRelative(i: number) {
    setRelatives(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    const payload: CreateStudentRequest & Record<string, unknown> = {
      phone_number:    toApiPhone(phone),
      first_name:      firstName.trim(),
      last_name:       lastName.trim() || undefined,
      middle_name:     middleName.trim() || undefined,
      password,
      gender,
      status:          "active",
      date_of_birth:   dob || undefined,
      address:         address.trim() || undefined,
      birth_certificate: passport.trim() || undefined,
      branch_id:       branchId,
      class_id:        classId !== "none" ? classId : undefined,
      relatives:       relatives.length > 0
        ? relatives.map(r => ({
            relationship_type: r.relationship_type,
            first_name:        r.first_name.trim(),
            last_name:         r.last_name.trim(),
            middle_name:       r.middle_name || undefined,
            phone_number:      r.phone_number || undefined,
            email:             r.email || undefined,
            is_primary_contact: r.is_primary_contact,
            is_guardian:        r.is_guardian,
            workplace:         r.workplace || undefined,
            position:          r.position  || undefined,
            notes:             r.notes     || undefined,
          }) satisfies CreateStudentRelativeRequest)
        : undefined,
      // subscription fields (accepted by backend even if not in type)
      ...(planId !== "none" && {
        subscription_plan_id:             planId,
        discount_id:                      discountId !== "none" ? discountId : undefined,
        subscription_start_date:          planStartDate || undefined,
        subscription_next_payment_date:   planNextDate  || undefined,
      }),
    };
    mutation.mutate(payload);
  }

  // ─── computed ──────────────────────────────────────────────────────────────

  const step1Valid = !!firstName.trim() && phone.replace(/\D/g, "").length === 9;

  const primaryContact = relatives.find(r => r.is_primary_contact);

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-32 sm:pb-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0"
            onClick={() => router.push("/school/students")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Yangi O'quvchi</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {STEPS[step - 1].label} — {step}/{STEPS.length} qadam
            </p>
          </div>
        </div>

        {/* Step bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <StepBar current={step} onGoTo={setStep} />
        </div>

        {/* ── STEP 1: Personal ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
            <Section title="Asosiy ma'lumotlar" icon={User} />

            {/* Phone + First name side by side on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefon raqam" required error={errors.phone_number}
                hint="90 123 45 67">
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium select-none shrink-0">
                    +998
                  </span>
                  <Input
                    className={`rounded-l-none ${errors.phone_number ? "border-red-400 focus:ring-red-200" : ""}`}
                    placeholder="90 123 45 67"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    inputMode="tel"
                    maxLength={13}
                  />
                </div>
              </Field>

              <Field label="Ism" required error={errors.first_name}>
                <Input
                  className={errors.first_name ? "border-red-400" : ""}
                  placeholder="Ali"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, first_name: undefined })); }}
                />
              </Field>

              <Field label="Familiya">
                <Input placeholder="Valiyev" value={lastName}
                  onChange={e => setLastName(e.target.value)} />
              </Field>

              <Field label="Otasining ismi">
                <Input placeholder="Olim o'g'li" value={middleName}
                  onChange={e => setMiddleName(e.target.value)} />
              </Field>

              <Field label="Jins">
                <Select value={gender} onValueChange={v => setGender(v as "male" | "female")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">O'g'il bola</SelectItem>
                    <SelectItem value="female">Qiz bola</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Tug'ilgan sana">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input type="date" className="pl-9" value={dob}
                    onChange={e => setDob(e.target.value)} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-gray-50">
              <Field label="Pasport / ID raqam" hint="Shaxsni tasdiqlash uchun">
                <Input placeholder="AB1234567" value={passport}
                  onChange={e => setPassport(e.target.value)} />
              </Field>

              <Field label="Kirish paroli" hint="O'quvchi akkauntiga kirish uchun">
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>

            <Field label="Manzil">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  placeholder="Toshkent sh., Chilonzor tumani, ..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="pl-9 resize-none min-h-[70px]"
                  rows={2}
                />
              </div>
            </Field>
          </div>
        )}

        {/* ── STEP 2: Academic ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
              <Section title="O'quv ma'lumotlari" icon={BookOpen} />

              <Field label="Sinf" hint="O'quvchi qaysi sinfda o'qiydi">
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sinf tanlanmagan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sinfsiz</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.academic_year_name && (
                          <span className="text-gray-400 ml-2">· {cls.academic_year_name}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
              <Section title="Abonement" icon={CreditCard} />

              <Field label="Oylik to'lov rejasi" hint="Abonement bo'lmasa keyinroq qo'shish mumkin">
                <Select value={planId} onValueChange={v => { setPlanId(v); if (v === "none") setDiscountId("none"); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Abonement tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Abonomentsiz</SelectItem>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span>{p.name}</span>
                        <span className="text-gray-400 ml-2">· {formatCurrency(p.price)}/{p.period_display}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {planId !== "none" && selectedPlan && (
                <>
                  {/* Plan summary card */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-900 text-sm">{selectedPlan.name}</p>
                      <p className="text-xs text-blue-600">
                        {formatCurrency(selectedPlan.price)} / {selectedPlan.period_display}
                        {selectedPlan.grade_level_range && ` · ${selectedPlan.grade_level_range}`}
                      </p>
                    </div>
                    {selectedDiscount && (
                      <div className="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        -{selectedDiscount.discount_display}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Chegirma">
                      <Select value={discountId} onValueChange={setDiscountId}>
                        <SelectTrigger><SelectValue placeholder="Chegirmasiz" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chegirmasiz</SelectItem>
                          {discounts.map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} · {d.discount_display}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Boshlanish sanasi" hint="Bo'sh qoldirilsa bugungi sana">
                      <Input type="date" value={planStartDate}
                        onChange={e => setPlanStartDate(e.target.value)} />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Keyingi to'lov sanasi" hint="Bo'sh = avtomatik hisoblanadi">
                        <Input type="date" value={planNextDate}
                          onChange={e => setPlanNextDate(e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Abonement yaratiladi, lekin to'lov hali qilinmaydi. To'lov keyinchalik moliya bo'limidan amalga oshiriladi.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Relatives ── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Added relatives */}
            {relatives.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Qo'shilgan yaqinlar ({relatives.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {relatives.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {r.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {RELATIONSHIP_LABELS[r.relationship_type]}
                          {r.phone_number && ` · ${r.phone_number}`}
                          {r.is_primary_contact && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                              Asosiy
                            </span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => removeRelative(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add relative form */}
            {addingRel ? (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Section title="Yangi yaqin ma'lumotlari" icon={Users} />
                  <button onClick={() => { setAddingRel(false); setRelErrors({}); }}
                    className="text-gray-400 hover:text-gray-600 p-1">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Qarindoshlik turi">
                    <Select value={relForm.relationship_type}
                      onValueChange={v => setRelForm(p => ({ ...p, relationship_type: v as RelationshipType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(RELATIONSHIP_LABELS) as [RelationshipType, string][]).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Telefon">
                    <Input placeholder="+998 90 123 45 67" value={relForm.phone_number}
                      inputMode="tel"
                      onChange={e => setRelForm(p => ({ ...p, phone_number: e.target.value }))} />
                  </Field>

                  <Field label="Ism" required error={relErrors.first_name as string | undefined}>
                    <Input
                      className={relErrors.first_name ? "border-red-400" : ""}
                      placeholder="Kamoliddin"
                      value={relForm.first_name}
                      onChange={e => { setRelForm(p => ({ ...p, first_name: e.target.value })); setRelErrors(p => ({ ...p, first_name: undefined })); }}
                    />
                  </Field>

                  <Field label="Familiya" required error={relErrors.last_name as string | undefined}>
                    <Input
                      className={relErrors.last_name ? "border-red-400" : ""}
                      placeholder="Valiyev"
                      value={relForm.last_name}
                      onChange={e => { setRelForm(p => ({ ...p, last_name: e.target.value })); setRelErrors(p => ({ ...p, last_name: undefined })); }}
                    />
                  </Field>

                  <Field label="Ish joyi">
                    <Input placeholder="Toshkent maktabi" value={relForm.workplace}
                      onChange={e => setRelForm(p => ({ ...p, workplace: e.target.value }))} />
                  </Field>

                  <Field label="Lavozimi">
                    <Input placeholder="O'qituvchi" value={relForm.position}
                      onChange={e => setRelForm(p => ({ ...p, position: e.target.value }))} />
                  </Field>
                </div>

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600"
                      checked={relForm.is_primary_contact}
                      onChange={e => setRelForm(p => ({ ...p, is_primary_contact: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Asosiy aloqa shaxsi</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600"
                      checked={relForm.is_guardian}
                      onChange={e => setRelForm(p => ({ ...p, is_guardian: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Vasiy</span>
                  </label>
                </div>

                <Button onClick={addRelative} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Check className="w-4 h-4 mr-2" /> Yaqinni qo'shish
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setAddingRel(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Yaqin qo'shish
              </button>
            )}

            {relatives.length === 0 && !addingRel && (
              <p className="text-center text-xs text-gray-400 -mt-2">
                Keyinroq ham qo'shish mumkin
              </p>
            )}
          </div>
        )}

        {/* ── STEP 4: Confirmation ── */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Personal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Shaxsiy ma'lumotlar</h3>
                <button onClick={() => setStep(1)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Tahrirlash
                </button>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                {[
                  { label: "Ism",         value: `${firstName} ${middleName} ${lastName}`.trim() },
                  { label: "Telefon",     value: phone ? `+998 ${phone}` : "—" },
                  { label: "Jins",        value: gender === "male" ? "O'g'il" : "Qiz" },
                  { label: "Tug'ilgan",   value: dob ? format(new Date(dob), "dd MMM yyyy", { locale: uz }) : "—" },
                  { label: "Manzil",      value: address || "—" },
                  { label: "Pasport",     value: passport || "—" },
                ].map(row => (
                  <div key={row.label}>
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">O'quv ma'lumotlari</h3>
                <button onClick={() => setStep(2)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Tahrirlash
                </button>
              </div>
              <div className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Sinf:</span>
                  <span className="font-medium">{selectedClass?.name ?? "Tanlanmagan"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Abonement:</span>
                  <span className="font-medium">
                    {selectedPlan
                      ? `${selectedPlan.name} · ${formatCurrency(selectedPlan.price)}`
                      : "Yo'q"}
                  </span>
                </div>
                {selectedDiscount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Chegirma:</span>
                    <span className="font-medium text-green-600">{selectedDiscount.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Relatives */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  Yaqinlar {relatives.length > 0 && `(${relatives.length})`}
                </h3>
                <button onClick={() => setStep(3)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Tahrirlash
                </button>
              </div>
              {relatives.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">Yaqin qo'shilmagan</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {relatives.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {r.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {RELATIONSHIP_LABELS[r.relationship_type]}
                          {r.phone_number && ` · ${r.phone_number}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                O'quvchi yaratilgandan so'ng avtomatik ravishda foydalanuvchi akkaunti va moliyaviy balans yaratiladi.
              </span>
            </div>
          </div>
        )}

        {/* ── Navigation (desktop) ── */}
        <div className="hidden sm:flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => step === 1 ? router.push("/school/students") : setStep(s => s - 1)}
            disabled={mutation.isPending}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? "Bekor qilish" : "Orqaga"}
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={step === 1 && !step1Valid}
              className="bg-blue-600 hover:bg-blue-700">
              Keyingi <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={mutation.isPending}
              className="bg-green-600 hover:bg-green-700 min-w-[160px]">
              {mutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Yaratilmoqda...</>
                : <><CheckCircle2 className="w-4 h-4 mr-2" />O'quvchi yaratish</>}
            </Button>
          )}
        </div>
      </div>

      {/* ── Navigation (mobile sticky) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-50">
        <Button variant="outline" className="flex-1"
          onClick={() => step === 1 ? router.push("/school/students") : setStep(s => s - 1)}
          disabled={mutation.isPending}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {step === 1 ? "Bekor" : "Orqaga"}
        </Button>

        {step < 4 ? (
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleNext} disabled={step === 1 && !step1Valid}>
            Keyingi <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Yaratilmoqda...</>
              : <><CheckCircle2 className="w-4 h-4 mr-1" />Yaratish</>}
          </Button>
        )}
      </div>
    </div>
  );
}
