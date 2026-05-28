"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  Lock,
  BookOpen,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import type { StudentRelative, RelationshipType } from "@/types/school";
import type { StudentSubscription, SubscriptionPlan } from "@/types/finance";

// ── helpers ─────────────────────────────────────────────────────────────────

function fmtSuffix(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

function parseSuffix(phone?: string | null): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  const s = d.startsWith("998") ? d.slice(3) : d.startsWith("8") ? d.slice(1) : d;
  return fmtSuffix(s);
}

function toApiPhone(suffix: string): string {
  return "+998" + suffix.replace(/\D/g, "");
}

const VALID_GENDERS = ["male", "female", "other", "unspecified"] as const;
type GenderType = typeof VALID_GENDERS[number];

function normalizeGender(v: any): GenderType {
  const s = typeof v === "string" ? v.toLowerCase().trim() : "";
  return (VALID_GENDERS as readonly string[]).includes(s) ? (s as GenderType) : "unspecified";
}

const STATUS_OPTS = [
  { value: "active",      label: "Aktiv" },
  { value: "suspended",   label: "To'xtatilgan" },
  { value: "archived",    label: "Arxivlangan" },
  { value: "graduated",   label: "Bitirgan" },
  { value: "transferred", label: "Ko'chirilgan" },
] as const;

const STATUS_CLS: Record<string, string> = {
  active:      "bg-green-100 text-green-700 border-green-200",
  suspended:   "bg-red-100 text-red-700 border-red-200",
  archived:    "bg-gray-100 text-gray-600 border-gray-200",
  graduated:   "bg-blue-100 text-blue-700 border-blue-200",
  transferred: "bg-orange-100 text-orange-700 border-orange-200",
};

const RELATION_TYPES: { value: RelationshipType; label: string }[] = [
  { value: "father",      label: "Otasi" },
  { value: "mother",      label: "Onasi" },
  { value: "brother",     label: "Akasi/ukasi" },
  { value: "sister",      label: "Opasi/singlisi" },
  { value: "grandfather", label: "Bobosi" },
  { value: "grandmother", label: "Buvisi" },
  { value: "uncle",       label: "Amakisi/Tog'asi" },
  { value: "aunt",        label: "Xolasi/Teyzasi" },
  { value: "guardian",    label: "Vasiy" },
  { value: "other",       label: "Boshqa" },
];

// ── sub-components ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function PhoneInput({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className={`flex ${error ? "ring-1 ring-red-400 rounded-lg" : ""}`}>
        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium select-none shrink-0">
          +998
        </span>
        <Input
          className={`rounded-l-none ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}`}
          placeholder="90 123 45 67"
          value={value}
          disabled={disabled}
          onChange={e => onChange?.(fmtSuffix(e.target.value))}
          inputMode="tel"
          maxLength={13}
        />
        {disabled && (
          <span className="inline-flex items-center px-3 border border-l-0 border-gray-200 bg-gray-50 rounded-r-lg">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const studentId = params.id as string;

  // ── queries ──────────────────────────────────────────────────────────────

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => schoolApi.getStudent(branchId!, studentId),
    enabled: !!branchId,
  });

  const { data: relatives = [], refetch: refetchRelatives } = useQuery({
    queryKey: ["student-relatives", studentId],
    queryFn: () => schoolApi.getStudentRelatives(studentId),
    enabled: !!studentId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn: () => schoolApi.getClasses(branchId!),
    enabled: !!branchId,
  });

  const { data: subscriptionPlansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId, is_active: true }),
    enabled: !!branchId,
  });
  const subscriptionPlans: SubscriptionPlan[] = subscriptionPlansData?.results ?? [];

  const { data: studentSubsData, refetch: refetchSubs } = useQuery({
    queryKey: ["student-subscriptions", studentId],
    queryFn: () => financeApi.getStudentSubscriptions({ student_profile: studentId, is_active: true }),
    enabled: !!studentId,
  });
  const studentSubscriptions: StudentSubscription[] = studentSubsData?.results ?? [];

  // ── form state ──────────────────────────────────────────────────────────

  const [firstName,          setFirstName]          = useState("");
  const [lastName,           setLastName]            = useState("");
  const [middleName,         setMiddleName]          = useState("");
  const [phoneSuffix,        setPhoneSuffix]         = useState(""); // read-only display
  const [email,              setEmail]               = useState("");
  const [gender,             setGender]              = useState<GenderType>("unspecified");
  const [dateOfBirth,        setDateOfBirth]         = useState("");
  const [address,            setAddress]             = useState("");
  const [status,             setStatus]              = useState<"active" | "archived" | "suspended" | "graduated" | "transferred">("active");
  const [classId,            setClassId]             = useState("");
  const [passportNumber,     setPassportNumber]      = useState("");
  const [nationality,        setNationality]         = useState("");
  const [passportIssuedDate, setPassportIssuedDate]  = useState("");
  const [passportExpiryDate, setPassportExpiryDate]  = useState("");
  const [birthCertificate,   setBirthCertificate]    = useState("");
  const [showDocs,           setShowDocs]            = useState(false);
  const [errors,             setErrors]              = useState<Record<string, string>>({});

  // relative dialog state
  const [relativeOpen,    setRelativeOpen]    = useState(false);
  const [editingRelative, setEditingRelative] = useState<StudentRelative | null>(null);
  const [relPhone,        setRelPhone]        = useState("");
  const [relForm,         setRelForm]         = useState({
    relationship_type: "father" as RelationshipType,
    first_name:        "",
    last_name:         "",
    middle_name:       "",
    email:             "",
    gender:            "male" as "male" | "female" | "other" | "unspecified",
    is_primary_contact: false,
    is_guardian:        false,
    workplace:          "",
    position:           "",
    notes:              "",
  });
  const [relShowMore, setRelShowMore] = useState(false);
  const [deleteRelativeId, setDeleteRelativeId] = useState<string | null>(null);

  // subscription dialog state
  const [subOpen,       setSubOpen]       = useState(false);
  const [editingSub,    setEditingSub]    = useState<StudentSubscription | null>(null);
  const [subForm,       setSubForm]       = useState({
    subscription_plan:   "",
    start_date:          "",
    next_payment_date:   "",
    notes:               "",
  });
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

  // ── seed form from student ──────────────────────────────────────────────

  useEffect(() => {
    if (!student) return;
    setFirstName(student.first_name || "");
    setLastName(student.last_name || "");
    setMiddleName(student.middle_name || "");
    setPhoneSuffix(parseSuffix(student.phone_number));
    setEmail(student.email || "");
    setGender(normalizeGender(student.gender));
    setDateOfBirth(student.date_of_birth || "");
    setAddress(student.address || "");
    setStatus((student.status as any) || "active");
    setClassId(student.current_class?.id || "");
    const af = student.additional_fields || {};
    setPassportNumber(af.passport_number || "");
    setNationality(af.nationality || "");
    setPassportIssuedDate(af.passport_issued_date || "");
    setPassportExpiryDate(af.passport_expiry_date || "");
    setBirthCertificate(student.birth_certificate || "");
  }, [student]);

  // ── mutations ───────────────────────────────────────────────────────────

  const updateMut = useMutation({
    mutationFn: (data: any) => schoolApi.updateStudent(branchId!, studentId, data),
    onSuccess: () => {
      toast.success("O'quvchi ma'lumotlari saqlandi");
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.push(`/school/students/${studentId}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Saqlashda xatolik");
    },
  });

  const transferMut = useMutation({
    mutationFn: ({ currentClassId, targetClassId, membershipId }: { currentClassId: string; targetClassId: string; membershipId: string }) =>
      schoolApi.transferStudent(currentClassId, membershipId, {
        target_class_id: targetClassId,
        notes: "Sinf o'zgartirildi",
      }),
    onSuccess: () => {
      toast.success("O'quvchi yangi sinfga ko'chirildi");
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Sinf o'zgartirishda xatolik");
    },
  });

  const addRelMut = useMutation({
    mutationFn: (data: any) => schoolApi.addStudentRelative(studentId, data),
    onSuccess: () => {
      toast.success("Yaqin qo'shildi");
      refetchRelatives();
      closeRelativeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const updateRelMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schoolApi.updateStudentRelative(studentId, id, data),
    onSuccess: () => {
      toast.success("Yaqin yangilandi");
      refetchRelatives();
      closeRelativeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const deleteRelMut = useMutation({
    mutationFn: (id: string) => schoolApi.deleteStudentRelative(studentId, id),
    onSuccess: () => {
      toast.success("Yaqin o'chirildi");
      setDeleteRelativeId(null);
      refetchRelatives();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const createSubMut = useMutation({
    mutationFn: (data: any) => financeApi.createStudentSubscription({
      student_profile: studentId,
      branch: branchId!,
      subscription_plan: data.subscription_plan,
      start_date: data.start_date,
      next_payment_date: data.next_payment_date,
      notes: data.notes || undefined,
    }),
    onSuccess: () => {
      toast.success("Abonement qo'shildi");
      refetchSubs();
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      closeSubDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const updateSubMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => financeApi.updateStudentSubscription(id, data),
    onSuccess: () => {
      toast.success("Abonement yangilandi");
      refetchSubs();
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      closeSubDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const deleteSubMut = useMutation({
    mutationFn: (id: string) => financeApi.deleteStudentSubscription(id),
    onSuccess: () => {
      toast.success("Abonement o'chirildi");
      setDeleteSubId(null);
      refetchSubs();
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Xatolik yuz berdi"),
  });

  // ── handlers ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Ism kiritilishi shart";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const additionalFields: Record<string, any> = {
      ...(student?.additional_fields || {}),
    };
    if (passportNumber)     additionalFields.passport_number      = passportNumber;
    if (nationality)        additionalFields.nationality           = nationality;
    if (passportIssuedDate) additionalFields.passport_issued_date  = passportIssuedDate;
    if (passportExpiryDate) additionalFields.passport_expiry_date  = passportExpiryDate;

    const updateData: any = {
      first_name:        firstName,
      last_name:         lastName  || undefined,
      middle_name:       middleName || undefined,
      email:             email     || undefined,
      gender:            gender !== "unspecified" ? gender : undefined,
      date_of_birth:     dateOfBirth || undefined,
      address:           address     || undefined,
      birth_certificate: birthCertificate || undefined,
      status,
      additional_fields: Object.keys(additionalFields).length > 0 ? additionalFields : undefined,
    };

    const currentClassId = student?.current_class?.id;
    const newClassId     = classId && classId !== "none" ? classId : null;
    const membershipId   = (student as any)?.membership_id || student?.id;

    if (currentClassId && newClassId && currentClassId !== newClassId && membershipId) {
      transferMut.mutate({ currentClassId, targetClassId: newClassId, membershipId });
      updateMut.mutate({ ...updateData, class_id: undefined });
      return;
    }
    if (!currentClassId && newClassId) {
      updateData.class_id = newClassId;
    } else if (currentClassId && !newClassId) {
      updateData.class_id = null;
    }

    updateMut.mutate(updateData);
  }

  // ── relative dialog ───────────────────────────────────────────────────────

  function openAddRelative() {
    setEditingRelative(null);
    setRelPhone("");
    setRelForm({
      relationship_type: "father",
      first_name: "", last_name: "", middle_name: "",
      email: "", gender: "male",
      is_primary_contact: false, is_guardian: false,
      workplace: "", position: "", notes: "",
    });
    setRelShowMore(false);
    setRelativeOpen(true);
  }

  function openEditRelative(rel: StudentRelative) {
    setEditingRelative(rel);
    setRelPhone(parseSuffix(rel.phone_number));
    setRelForm({
      relationship_type:  rel.relationship_type,
      first_name:         rel.first_name,
      last_name:          rel.last_name || "",
      middle_name:        rel.middle_name || "",
      email:              rel.email || "",
      gender:             rel.gender || "male",
      is_primary_contact: rel.is_primary_contact,
      is_guardian:        rel.is_guardian,
      workplace:          rel.workplace || "",
      position:           rel.position || "",
      notes:              rel.notes || "",
    });
    setRelShowMore(!!(rel.workplace || rel.position || rel.notes));
    setRelativeOpen(true);
  }

  function closeRelativeDialog() {
    setRelativeOpen(false);
    setEditingRelative(null);
    setRelShowMore(false);
  }

  function handleSaveRelative() {
    if (!relForm.first_name.trim()) {
      toast.error("Ism kiritilishi shart");
      return;
    }
    const data = {
      ...relForm,
      phone_number: relPhone ? toApiPhone(relPhone) : undefined,
    };
    if (editingRelative) {
      updateRelMut.mutate({ id: editingRelative.id, data });
    } else {
      addRelMut.mutate(data);
    }
  }

  // ── subscription dialog ───────────────────────────────────────────────────

  function openAddSub() {
    setEditingSub(null);
    setSubForm({ subscription_plan: "", start_date: "", next_payment_date: "", notes: "" });
    setSubOpen(true);
  }

  function openEditSub(sub: StudentSubscription) {
    setEditingSub(sub);
    setSubForm({
      subscription_plan: sub.subscription_plan as string,
      start_date:        sub.start_date,
      next_payment_date: sub.next_payment_date,
      notes:             sub.notes || "",
    });
    setSubOpen(true);
  }

  function closeSubDialog() {
    setSubOpen(false);
    setEditingSub(null);
  }

  function handleSaveSub() {
    if (!subForm.subscription_plan) { toast.error("Abonement rejasini tanlang"); return; }
    if (!subForm.start_date)        { toast.error("Boshlanish sanasini kiriting"); return; }
    if (!subForm.next_payment_date) { toast.error("Keyingi to'lov sanasini kiriting"); return; }

    if (editingSub) {
      updateSubMut.mutate({ id: editingSub.id, data: { next_payment_date: subForm.next_payment_date, notes: subForm.notes || undefined } });
    } else {
      createSubMut.mutate(subForm);
    }
  }

  // ── loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">O&apos;quvchi topilmadi</p>
        <Button variant="outline" onClick={() => router.push("/school/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
        </Button>
      </div>
    );
  }

  const statusLabel = STATUS_OPTS.find(s => s.value === status)?.label ?? status;
  const isSaving    = updateMut.isPending || transferMut.isPending;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/school/students/${studentId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {student.first_name} {student.last_name} — tahrirlash
          </h1>
          <p className="text-sm text-gray-500 truncate">{student.personal_number}</p>
        </div>
        <Badge className={`border text-xs hidden sm:inline-flex ${STATUS_CLS[status] ?? ""}`}>
          {statusLabel}
        </Badge>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Left column ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Asosiy ma'lumotlar */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Asosiy ma&apos;lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Ism" required error={errors.firstName}>
                    <Input
                      value={firstName}
                      onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: "" })); }}
                      placeholder="Ali"
                      className={errors.firstName ? "border-red-400" : ""}
                    />
                  </Field>
                  <Field label="Otasining ismi">
                    <Input
                      value={middleName}
                      onChange={e => setMiddleName(e.target.value)}
                      placeholder="Valiyevich"
                    />
                  </Field>
                  <Field label="Familiya">
                    <Input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Valiyev"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Jins">
                    <Select value={gender} onValueChange={v => setGender(normalizeGender(v))}>
                      <SelectTrigger><SelectValue placeholder="Jins tanlang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Erkak</SelectItem>
                        <SelectItem value="female">Ayol</SelectItem>
                        <SelectItem value="other">Boshqa</SelectItem>
                        <SelectItem value="unspecified">Belgilanmagan</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tug'ilgan sana">
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Ta'lim */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Ta&apos;lim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Holat">
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Sinf">
                    <Select value={classId || "none"} onValueChange={v => setClassId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Sinf tanlang" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sinfsiz</SelectItem>
                        {classes.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {student.current_class && classId && classId !== student.current_class.id && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        Joriy: {student.current_class.name} → ko&apos;chiriladi
                      </p>
                    )}
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Aloqa */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  Aloqa ma&apos;lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Telefon raqam"
                  hint="Telefon raqamni o'zgartirish uchun administrator bilan bog'laning"
                >
                  <PhoneInput value={phoneSuffix} disabled />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ali@example.com"
                        className="pl-9"
                      />
                    </div>
                  </Field>
                  <Field label="Manzil">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Toshkent, Yunusobod"
                        className="pl-9"
                      />
                    </div>
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Hujjatlar (collapsible) */}
            <Card className="border-gray-200">
              <button
                type="button"
                className="w-full px-5 py-3.5 flex items-center justify-between text-left"
                onClick={() => setShowDocs(v => !v)}
              >
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Hujjatlar
                  {(passportNumber || birthCertificate) && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                      {(passportNumber ? 1 : 0) + (birthCertificate ? 1 : 0)}
                    </span>
                  )}
                </span>
                {showDocs
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showDocs && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Pasport seriya va raqam">
                      <Input
                        value={passportNumber}
                        onChange={e => setPassportNumber(e.target.value)}
                        placeholder="AA1234567"
                        className="font-mono"
                      />
                    </Field>
                    <Field label="Millat">
                      <Input
                        value={nationality}
                        onChange={e => setNationality(e.target.value)}
                        placeholder="O'zbek"
                      />
                    </Field>
                    <Field label="Pasport berilgan sana">
                      <Input
                        type="date"
                        value={passportIssuedDate}
                        onChange={e => setPassportIssuedDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Pasport amal qilish muddati">
                      <Input
                        type="date"
                        value={passportExpiryDate}
                        onChange={e => setPassportExpiryDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Tug'ilganlik guvohnomasi">
                      <Input
                        value={birthCertificate}
                        onChange={e => setBirthCertificate(e.target.value)}
                        placeholder="I-AA 1234567"
                        className="font-mono"
                      />
                    </Field>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Yaqinlar */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    Yaqinlar
                    <span className="text-xs font-normal text-gray-400">({(relatives as StudentRelative[]).length})</span>
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    onClick={openAddRelative}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Qo&apos;shish
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(relatives as StudentRelative[]).length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Hech qanday yaqin qo&apos;shilmagan</p>
                    <button
                      type="button"
                      onClick={openAddRelative}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                    >
                      + Yaqin qo&apos;shish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(relatives as StudentRelative[]).map(rel => (
                      <div key={rel.id}>
                        {deleteRelativeId === rel.id ? (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="flex-1 text-sm text-red-700 font-medium">O&apos;chirishni tasdiqlaysizmi?</p>
                            <button
                              type="button"
                              onClick={() => deleteRelMut.mutate(rel.id)}
                              disabled={deleteRelMut.isPending}
                              className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteRelMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ha"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteRelativeId(null)}
                              className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              Yo&apos;q
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {rel.full_name}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                  {rel.relationship_type_display}
                                </span>
                                {rel.is_primary_contact && (
                                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
                                    Asosiy
                                  </span>
                                )}
                              </div>
                              {rel.phone_number && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  +998 {parseSuffix(rel.phone_number)}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditRelative(rel)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteRelativeId(rel.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Abonementlar */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-500" />
                    Abonementlar
                    <span className="text-xs font-normal text-gray-400">({studentSubscriptions.length})</span>
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    onClick={openAddSub}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Qo&apos;shish
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {studentSubscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Abonement yo&apos;q</p>
                    <button
                      type="button"
                      onClick={openAddSub}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                    >
                      + Abonement qo&apos;shish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentSubscriptions.map(sub => (
                      <div key={sub.id}>
                        {deleteSubId === sub.id ? (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="flex-1 text-sm text-red-700 font-medium">O&apos;chirishni tasdiqlaysizmi?</p>
                            <button
                              type="button"
                              onClick={() => deleteSubMut.mutate(sub.id)}
                              disabled={deleteSubMut.isPending}
                              className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteSubMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ha"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteSubId(null)}
                              className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              Yo&apos;q
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {sub.subscription_plan_name}
                                  </span>
                                  {sub.is_active && (
                                    <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
                                      Faol
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Keyingi to&apos;lov: {new Date(sub.next_payment_date).toLocaleDateString("uz-UZ")}
                                </p>
                                {sub.total_debt > 0 && (
                                  <p className="text-xs text-red-600 font-medium mt-0.5">
                                    Qarz: {new Intl.NumberFormat("uz-UZ").format(sub.total_debt)} so&apos;m
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditSub(sub)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteSubId(sub.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Sticky save footer ── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/school/students/${studentId}`)}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1.5" />
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[120px]"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saqlanmoqda...</>
              ) : (
                <><Save className="w-4 h-4 mr-1.5" />Saqlash</>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* ── Relative Dialog ── */}
      <Dialog open={relativeOpen} onOpenChange={v => !v && closeRelativeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingRelative ? "Yaqinni tahrirlash" : "Yaqin qo'shish"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Relationship + First name in one row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Munosabat" required>
                <Select
                  value={relForm.relationship_type}
                  onValueChange={v => setRelForm(p => ({ ...p, relationship_type: v as RelationshipType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ism" required>
                <Input
                  value={relForm.first_name}
                  onChange={e => setRelForm(p => ({ ...p, first_name: e.target.value }))}
                  placeholder="Olim"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Familiya">
                <Input
                  value={relForm.last_name}
                  onChange={e => setRelForm(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="Valiyev"
                />
              </Field>
              <Field label="Otasining ismi">
                <Input
                  value={relForm.middle_name}
                  onChange={e => setRelForm(p => ({ ...p, middle_name: e.target.value }))}
                  placeholder="Karimovich"
                />
              </Field>
            </div>

            <Field label="Telefon raqam">
              <PhoneInput value={relPhone} onChange={setRelPhone} />
            </Field>

            {/* Checkboxes */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={relForm.is_primary_contact}
                  onChange={e => setRelForm(p => ({ ...p, is_primary_contact: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Asosiy aloqa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={relForm.is_guardian}
                  onChange={e => setRelForm(p => ({ ...p, is_guardian: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Vasiy</span>
              </label>
            </div>

            {/* More fields toggle */}
            <button
              type="button"
              onClick={() => setRelShowMore(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
            >
              {relShowMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {relShowMore ? "Kamroq" : "Qo'shimcha maydonlar (ish joyi, lavozim...)"}
            </button>

            {relShowMore && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ish joyi">
                    <Input
                      value={relForm.workplace}
                      onChange={e => setRelForm(p => ({ ...p, workplace: e.target.value }))}
                      placeholder="Kompaniya nomi"
                    />
                  </Field>
                  <Field label="Lavozim">
                    <Input
                      value={relForm.position}
                      onChange={e => setRelForm(p => ({ ...p, position: e.target.value }))}
                      placeholder="Dasturchi"
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <Input
                    type="email"
                    value={relForm.email}
                    onChange={e => setRelForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="olim@example.com"
                  />
                </Field>
                <Field label="Izoh">
                  <Input
                    value={relForm.notes}
                    onChange={e => setRelForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Qo'shimcha ma'lumot"
                  />
                </Field>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeRelativeDialog}>
                Bekor qilish
              </Button>
              <Button
                type="button"
                onClick={handleSaveRelative}
                disabled={addRelMut.isPending || updateRelMut.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {(addRelMut.isPending || updateRelMut.isPending)
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saqlanmoqda...</>
                  : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Saqlash</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Subscription Dialog ── */}
      <Dialog open={subOpen} onOpenChange={v => !v && closeSubDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingSub ? "Abonementni tahrirlash" : "Yangi abonement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <Field label="Abonement rejasi" required>
              <Select
                value={subForm.subscription_plan}
                onValueChange={v => setSubForm(p => ({ ...p, subscription_plan: v }))}
                disabled={!!editingSub}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reja tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {new Intl.NumberFormat("uz-UZ").format(plan.price)} so&apos;m / {plan.period_display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingSub && <p className="text-xs text-gray-400 mt-1">Reja tahrir qilishda o&apos;zgartirib bo&apos;lmaydi</p>}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Boshlanish sanasi" required>
                <Input
                  type="date"
                  value={subForm.start_date}
                  onChange={e => setSubForm(p => ({ ...p, start_date: e.target.value }))}
                  disabled={!!editingSub}
                />
              </Field>
              <Field label="Keyingi to'lov" required>
                <Input
                  type="date"
                  value={subForm.next_payment_date}
                  onChange={e => setSubForm(p => ({ ...p, next_payment_date: e.target.value }))}
                />
              </Field>
            </div>

            <Field label="Izoh">
              <Input
                value={subForm.notes}
                onChange={e => setSubForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Qo'shimcha ma'lumot"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeSubDialog}>
                Bekor qilish
              </Button>
              <Button
                type="button"
                onClick={handleSaveSub}
                disabled={createSubMut.isPending || updateSubMut.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {(createSubMut.isPending || updateSubMut.isPending)
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saqlanmoqda...</>
                  : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Saqlash</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
