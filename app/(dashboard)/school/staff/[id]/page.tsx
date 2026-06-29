"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi, financeApi } from "@/lib/api";
import {
	StaffMemberDetail,
	UpdateStaffRequest,
	ChangeBalanceRequest,
	BalanceTransaction,
	EMPLOYMENT_TYPE_LABELS,
	transactionTypeLabels,
	paymentMethodLabels,
} from "@/types/staff";
import type { CashRegister } from "@/types/finance";
import type { EmploymentType, TransactionType, PaymentMethod } from "@/types/staff";
import { formatCurrency, formatRelativeDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
	Table,
	TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Edit, Wallet, Calendar, DollarSign,
  FileText, Phone, Mail, Briefcase, MapPin,
  Archive, RotateCcw, Loader2, User,
  Gift, AlertCircle, Plus, TrendingUp, TrendingDown,
  Upload, Trash2, AlertTriangle, FileCheck, Activity,
  BookOpen, CheckCircle, Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StaffDocument, StaffActivityLog, StaffBalanceStats } from "@/types/staff";
import { staffDocumentTypeLabels } from "@/types/staff";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Small helpers ─────────────────────────────────────────────────────────────

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

function formatActivityDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatSalary(n: number | undefined) {
  if (!n) return "";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function SalaryInput({ value, onChange }: { value: number | undefined; onChange: (val: number) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const cursorPos = el.selectionStart ?? 0;
    const oldVal = el.value;
    const digitsBeforeCursor = oldVal.slice(0, cursorPos).replace(/\D/g, "").length;
    const rawDigits = el.value.replace(/\D/g, "");
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    onChange(num);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const newFormatted = formatSalary(num);
      let digitCount = 0;
      let newPos = newFormatted.length;
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) digitCount++;
        if (digitCount === digitsBeforeCursor) { newPos = i + 1; break; }
      }
      inputRef.current.setSelectionRange(newPos, newPos);
    });
  };
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={formatSalary(value)}
        onChange={handleChange}
        placeholder="5 000 000"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pr-14 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">so&apos;m</span>
    </div>
  );
}

const ROLES_CONFIG = [
  { value: "teacher", label: "O'qituvchi" },
  { value: "branch_admin", label: "Filial admini" },
  { value: "other", label: "Boshqa" },
];

const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  teacher:      { bg: "bg-blue-100",   text: "text-blue-700" },
  branch_admin: { bg: "bg-purple-100", text: "text-purple-700" },
  other:        { bg: "bg-slate-100",  text: "text-slate-600" },
};

// ── Balance operation mode ────────────────────────────────────────────────────
type BalanceMode = "topup" | "bonus" | "fine";
type BalanceTxType = ChangeBalanceRequest["transaction_type"];

const BALANCE_MODE_CONFIG: Record<BalanceMode, {
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
  buttonColor: string;
  defaultType: BalanceTxType;
  availableTypes: { value: BalanceTxType; label: string }[];
  isCredit: boolean;
}> = {
  topup: {
    title: "Balans to'ldirish",
    description: "Xodim balansiga pul qo'shish",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    defaultType: "adjustment",
    availableTypes: [
      { value: "salary_accrual", label: "Oylik maosh hisoblash" },
      { value: "advance", label: "Avans berish" },
      { value: "adjustment", label: "To'g'rilash (manual)" },
      { value: "other", label: "Boshqa kirim" },
    ],
    isCredit: true,
  },
  bonus: {
    title: "Bonus berish",
    description: "Xodimga mukofot puli qo'shish",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    buttonColor: "bg-amber-500 hover:bg-amber-600",
    defaultType: "bonus",
    availableTypes: [{ value: "bonus", label: "Bonus" }],
    isCredit: true,
  },
  fine: {
    title: "Jarima solish",
    description: "Xodim balansidan jarima ayirish",
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    buttonColor: "bg-red-600 hover:bg-red-700",
    defaultType: "fine",
    availableTypes: [
      { value: "fine", label: "Jarima" },
      { value: "deduction", label: "Ushlab qolish" },
    ],
    isCredit: false,
  },
};

// ── Info row helper ────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-none">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

// ── Field label with tooltip ───────────────────────────────────────────────────
function FieldLabel({ label, required, tip }: { label: string; required?: boolean; tip?: string }) {
  if (!tip) {
    return (
      <Label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-3 h-3 rounded-full border border-gray-300 text-gray-400 text-[9px] flex items-center justify-center cursor-help hover:border-gray-400 transition-colors select-none">?</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">{tip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

// Transaction type badge colors
function TxTypeBadge({ type, label }: { type: TransactionType; label: string }) {
  const colors: Partial<Record<TransactionType, string>> = {
    lesson_salary:  "bg-blue-50 text-blue-700 border-blue-100",
    salary_accrual: "bg-indigo-50 text-indigo-700 border-indigo-100",
    bonus:          "bg-amber-50 text-amber-700 border-amber-100",
    fine:           "bg-red-50 text-red-700 border-red-100",
    deduction:      "bg-red-50 text-red-600 border-red-100",
    advance:        "bg-purple-50 text-purple-700 border-purple-100",
    adjustment:     "bg-gray-100 text-gray-600 border-gray-200",
  };
  const cls = colors[type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffDetailPage() {
  const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const staffId = params.id as string;

  // Tab — persisted in URL (?tab=info|documents|activity)
  const activeTab = searchParams.get("tab") ?? "info";
  const setActiveTab = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Doc upload dialog & form states
  const [docUploadDialog, setDocUploadDialog] = React.useState(false);
  const [docUploadName, setDocUploadName] = React.useState("");
  const [docUploadType, setDocUploadType] = React.useState("other");
  const [docUploadFile, setDocUploadFile] = React.useState<File | null>(null);
  const [docUploadNotes, setDocUploadNotes] = React.useState("");

  // Dialog states
  const [editDialog, setEditDialog] = React.useState(false);
  const [terminateDialog, setTerminateDialog] = React.useState(false);
  const [balanceDialog, setBalanceDialog] = React.useState(false);
  const [balanceMode, setBalanceMode] = React.useState<BalanceMode>("topup");
  const [transactionDetailDialog, setTransactionDetailDialog] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<BalanceTransaction | null>(null);

  // Form states
  const [editForm, setEditForm] = React.useState<Partial<UpdateStaffRequest>>({});
  const [balanceForm, setBalanceForm] = React.useState<ChangeBalanceRequest>({
    transaction_type: "adjustment",
    amount: 0,
    description: "",
    create_cash_transaction: false,
    cash_register_id: "",
    payment_method: "cash",
    reference: "",
  });

  const resetBalanceForm = (mode: BalanceMode) => {
    const cfg = BALANCE_MODE_CONFIG[mode];
    setBalanceForm({
      transaction_type: cfg.defaultType as ChangeBalanceRequest["transaction_type"],
      amount: 0,
      description: "",
      create_cash_transaction: false,
      cash_register_id: "",
      payment_method: "cash",
      reference: "",
    });
  };

  const openBalanceDialog = (mode: BalanceMode) => {
    setBalanceMode(mode);
    resetBalanceForm(mode);
    setBalanceDialog(true);
  };

  // Queries
  const { data: staff, isLoading, error } = useQuery<StaffMemberDetail>({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.getStaffMember(staffId),
    enabled: !!staffId,
  });

  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", staff?.branch],
    queryFn: () => financeApi.getCashRegisters({ branch_id: staff?.branch }),
    enabled: !!staff?.branch,
  });

  const { data: rolesData = [] } = useQuery({
    queryKey: ["roles", staff?.branch],
    queryFn: () => staffApi.getRoles(staff!.branch),
    enabled: !!staff?.branch,
  });

	const cashRegisters = cashRegistersData?.results || [];

  const { data: documents = [], refetch: refetchDocs } = useQuery<StaffDocument[]>({
    queryKey: ["staff-documents", staffId],
    queryFn: () => staffApi.getDocuments(staffId),
    enabled: !!staffId,
  });

  const [activityPage, setActivityPage] = React.useState(1);
  const [accumulatedLogs, setAccumulatedLogs] = React.useState<StaffActivityLog[]>([]);
  const activitySentinelRef = React.useRef<HTMLDivElement>(null);
  const { data: activityData, isLoading: activityLoading, isFetching: activityFetching } = useQuery({
    queryKey: ["staff-activity", staffId, activityPage],
    queryFn: () => staffApi.getActivity(staffId, { page: activityPage }),
    enabled: !!staffId && activeTab === "activity",
  });
  React.useEffect(() => {
    if (!activityData?.results) return;
    if (activityPage === 1) {
      setAccumulatedLogs(activityData.results);
    } else {
      setAccumulatedLogs(prev => [...prev, ...activityData.results]);
    }
  }, [activityData, activityPage]);
  React.useEffect(() => {
    if (activeTab === "activity") { setActivityPage(1); setAccumulatedLogs([]); }
  }, [activeTab, staffId]);
  const activityTotal = activityData?.count ?? 0;
  const activityHasMore = accumulatedLogs.length < activityTotal;

  // Infinite scroll: load next page when sentinel enters viewport
  React.useEffect(() => {
    const sentinel = activitySentinelRef.current;
    if (!sentinel || !activityHasMore || activityFetching) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setActivityPage(p => p + 1); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activityHasMore, activityFetching, accumulatedLogs.length]);

  const { data: balanceStats } = useQuery<StaffBalanceStats>({
    queryKey: ["staff-balance-stats", staffId],
    queryFn: () => staffApi.getBalanceStats(staffId),
    enabled: !!staffId,
  });

  // Mutations
  const updateStaffMutation = useMutation({
    mutationFn: (data: UpdateStaffRequest) => staffApi.updateStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setEditDialog(false);
      setEditForm({});
      toast.success("Xodim muvaffaqiyatli yangilandi");
    },
    onError: () => toast.error("Xodimni yangilashda xatolik"),
  });

	const deleteStaffMutation = useMutation({
		mutationFn: () => staffApi.deleteStaff(staffId),
		onSuccess: () => { toast.success("Xodim o'chirildi"); router.push("/school/staff"); },
		onError: () => toast.error("O'chirishda xatolik"),
	});

  const terminateMutation = useMutation({
    mutationFn: () => staffApi.terminateStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Xodim arxivlandi");
    },
    onError: () => toast.error("Arxivlashda xatolik"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => staffApi.reactivateStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Xodim qayta faollashtirildi");
    },
    onError: () => toast.error("Faollashtirishda xatolik"),
  });

  const uploadDocMutation = useMutation({
    mutationFn: (fd: FormData) => staffApi.uploadDocument(staffId, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-documents", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-activity", staffId] });
      setDocUploadDialog(false);
      setDocUploadName("");
      setDocUploadType("other");
      setDocUploadFile(null);
      setDocUploadNotes("");
      toast.success("Hujjat muvaffaqiyatli yuklandi");
    },
    onError: () => toast.error("Hujjat yuklashda xatolik"),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => staffApi.deleteDocument(staffId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-documents", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-activity", staffId] });
      toast.success("Hujjat o'chirildi");
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const addBalanceMutation = useMutation({
    mutationFn: (data: ChangeBalanceRequest) => staffApi.changeBalance(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setBalanceDialog(false);
      const cfg = BALANCE_MODE_CONFIG[balanceMode];
      toast.success(`${cfg.title} muvaffaqiyatli amalga oshirildi`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.response?.data?.cash_register_id?.[0] || "Xatolik yuz berdi";
      toast.error(msg);
    },
  });

  // Handlers
  const openEditDialog = () => {
    if (!staff) return;
    setEditForm({
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email ?? "",
      role: staff.role,
      role_ref_id: staff.role_ref_id,
      title: staff.title ?? "",
      employment_type: staff.employment_type,
      monthly_salary: staff.monthly_salary,
      passport_serial: staff.passport_serial ?? "",
      passport_number: staff.passport_number ?? "",
      address: staff.address ?? "",
      emergency_contact: staff.emergency_contact ?? "",
    });
    setEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffMutation.mutate(editForm as UpdateStaffRequest);
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (balanceForm.amount <= 0) { toast.error("Miqdor 0 dan katta bo'lishi kerak"); return; }
    if (!balanceForm.description.trim()) { toast.error("Tavsif kiritish majburiy"); return; }
    if (balanceForm.create_cash_transaction && !balanceForm.cash_register_id) { toast.error("Kassa tanlash majburiy"); return; }
    addBalanceMutation.mutate(balanceForm);
  };

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUploadFile) { toast.error("Fayl tanlang"); return; }
    if (!docUploadName.trim()) { toast.error("Hujjat nomi kiriting"); return; }
    const fd = new FormData();
    fd.append("file", docUploadFile);
    fd.append("name", docUploadName.trim());
    fd.append("document_type", docUploadType);
    fd.append("notes", docUploadNotes.trim());
    uploadDocMutation.mutate(fd);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <div className="flex gap-2">
            {[1,2].map(i => <Skeleton key={i} className="h-9 w-24 rounded-lg" />)}
          </div>
        </div>
        <Skeleton className="h-[88px] w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2">
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <User className="w-7 h-7 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">Xodim topilmadi</p>
          <p className="text-sm text-gray-400 mt-1">Bu profil mavjud emas yoki o&apos;chirilgan</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/school/staff")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Orqaga
        </Button>
      </div>
    );
  }

  const isArchived = !!staff.termination_date;
  const roleStyle = ROLE_COLOR[staff.role] ?? { bg: "bg-indigo-100", text: "text-indigo-700" };
  const avatarLetters = staff.full_name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
  const balanceCfg = BALANCE_MODE_CONFIG[balanceMode];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Top nav */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => router.push("/school/staff")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Xodimlar
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 h-9 border-gray-200" onClick={openEditDialog}>
            <Edit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tahrirlash</span>
          </Button>
          {isArchived ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
            >
              {reactivateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Qaytarish</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => setTerminateDialog(true)}
              disabled={terminateMutation.isPending}
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Arxivlash</span>
            </Button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <Card className="border-gray-200 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${roleStyle.bg} ${roleStyle.text} flex items-center justify-center text-lg font-bold shrink-0`}>
              {avatarLetters}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{staff.full_name}</h1>
                {isArchived ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Arxivlangan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Faol
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {staff.role_display}
                {staff.role_ref_name && ` · ${staff.role_ref_name}`}
                {staff.title && ` · ${staff.title}`}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {staff.phone_number}
                </span>
                {staff.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {staff.email}
                  </span>
                )}
                {staff.hire_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(staff.hire_date).toLocaleDateString("uz-UZ")} dan
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Joriy balans</p>
            <p className={`text-lg font-bold mt-1 tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(staff.balance)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{staff.balance < 0 ? "Qarz bor" : staff.balance > 0 ? "To'lanishi kerak" : "Balans nol"}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Oylik maosh</p>
            <p className="text-lg font-bold mt-1 text-gray-900 tabular-nums">{formatCurrency(staff.monthly_salary || 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Belgilangan</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Ish turi</p>
            <p className="text-sm font-semibold mt-1 text-gray-900">
              {staff.employment_type ? EMPLOYMENT_TYPE_LABELS[staff.employment_type] : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Bandlik holati</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Ish muddati</p>
            <p className="text-lg font-bold mt-1 text-gray-900">
              {staff.days_employed != null ? `${staff.days_employed}` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{staff.days_employed != null ? "kun" : ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance stats mini-row */}
      {balanceStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Jami bonus</p>
              <p className="text-base font-bold text-amber-700 tabular-nums">{formatCurrency(balanceStats.bonus.total)}</p>
              <p className="text-xs text-amber-500">{balanceStats.bonus.count} ta</p>
            </div>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">Jami jarima</p>
              <p className="text-base font-bold text-red-700 tabular-nums">{formatCurrency(balanceStats.fine.total)}</p>
              <p className="text-xs text-red-400">{balanceStats.fine.count} ta</p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Dars maoshi</p>
              <p className="text-base font-bold text-blue-700 tabular-nums">{formatCurrency(balanceStats.lesson_salary.total)}</p>
              <p className="text-xs text-blue-400">{balanceStats.lesson_salary.count} ta</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 bg-gray-100/80 rounded-xl p-1 gap-0.5">
          <TabsTrigger value="info" className="h-7 rounded-lg text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Ma&apos;lumotlar
          </TabsTrigger>
          <TabsTrigger value="documents" className="h-7 rounded-lg text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Hujjatlar {documents.length > 0 && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{documents.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="h-7 rounded-lg text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Faoliyat
          </TabsTrigger>
        </TabsList>

        {/* ── Ma'lumotlar tab ─────────────────────────────────────────── */}
        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left column */}
            <div className="space-y-4">

              {/* Personal info */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-5 pt-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Shaxsiy ma&apos;lumotlar</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="space-y-0">
                    <InfoRow icon={Phone} label="Telefon" value={staff.phone_number} />
                    <InfoRow icon={Mail} label="Email" value={staff.email} />
                    <InfoRow icon={MapPin} label="Manzil" value={staff.address} />
                    <InfoRow icon={Phone} label="Favqulodda aloqa" value={staff.emergency_contact} />
                    {(staff.passport_serial || staff.passport_number) && (
                      <InfoRow icon={Briefcase} label="Pasport" value={`${staff.passport_serial ?? ""} ${staff.passport_number ?? ""}`.trim()} />
                    )}
                    {staff.termination_date && (
                      <InfoRow icon={Archive} label="Arxivlangan sana" value={new Date(staff.termination_date).toLocaleDateString("uz-UZ")} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Balance actions */}
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-5 pt-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Balans operatsiyalari</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Joriy balans</span>
                    <span className={`text-sm font-bold tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(staff.balance)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-9 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => openBalanceDialog("topup")}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Balans to&apos;ldirish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-9 text-sm border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => openBalanceDialog("bonus")}
                    >
                      <Gift className="w-4 h-4" />
                      Bonus berish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-9 text-sm border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => openBalanceDialog("fine")}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Jarima solish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Transactions */}
            <div className="lg:col-span-2">
              <Card className="border-gray-200 shadow-none">
                <CardHeader className="px-5 pt-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-gray-700">Tranzaksiyalar tarixi</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => router.push(`/school/staff/${staffId}/transactions`)}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Barchasini ko&apos;rish
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  {staff.recent_transactions && staff.recent_transactions.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="text-xs font-medium text-gray-500 pl-4">Sana</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Turi</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500">Tavsif</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500 text-right">Miqdor</TableHead>
                            <TableHead className="text-xs font-medium text-gray-500 text-right pr-4">Balans</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staff.recent_transactions.map((tx) => (
                            <TableRow
                              key={tx.id}
                              className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                              onClick={() => { setSelectedTransaction(tx); setTransactionDetailDialog(true); }}
                            >
                              <TableCell className="text-xs text-gray-500 pl-4 whitespace-nowrap">
                                {formatRelativeDateTime(tx.created_at)}
                              </TableCell>
                              <TableCell>
                                <TxTypeBadge
                                  type={tx.transaction_type as TransactionType}
                                  label={transactionTypeLabels[tx.transaction_type as TransactionType] ?? tx.transaction_type_display}
                                />
                              </TableCell>
                              <TableCell className="max-w-[160px]">
                                {tx.description ? (
                                  <span className="text-xs text-gray-500 line-clamp-2">{tx.description}</span>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </TableCell>
                              <TableCell className={`text-right text-sm font-semibold tabular-nums pr-2 ${
                                tx.balance_change >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}>
                                {tx.balance_change >= 0 ? "+" : ""}{formatCurrency(tx.balance_change)}
                              </TableCell>
                              <TableCell className="text-right text-sm tabular-nums text-gray-500 pr-4">
                                {formatCurrency(tx.new_balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">Tranzaksiyalar yo&apos;q</p>
                      <p className="text-xs text-gray-300 mt-1">Balans operatsiyalari bu yerda ko&apos;rinadi</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Hujjatlar tab ──────────────────────────────────────────── */}
        <TabsContent value="documents" className="mt-4">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Hujjatlar</CardTitle>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    setDocUploadName("");
                    setDocUploadType("other");
                    setDocUploadFile(null);
                    setDocUploadNotes("");
                    setDocUploadDialog(true);
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Hujjat yuklash
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {documents.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Hujjatlar yo&apos;q</p>
                  <p className="text-xs text-gray-300 mt-1">Yuqoridagi tugma orqali yuklang</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{doc.document_type_display}</span>
                          {doc.uploaded_by_name && (
                            <span className="text-xs text-gray-300">· {doc.uploaded_by_name}</span>
                          )}
                          <span className="text-xs text-gray-300">· {new Date(doc.created_at).toLocaleDateString("uz-UZ")}</span>
                        </div>
                        {doc.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={doc.file_url || doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteDocMutation.mutate(doc.id)}
                          disabled={deleteDocMutation.isPending}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-colors"
                        >
                          {deleteDocMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Faoliyat tab ───────────────────────────────────────────── */}
        <TabsContent value="activity" className="mt-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Faoliyat jurnali</span>
              {activityTotal > 0 && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activityTotal}</span>
              )}
            </div>

            {activityLoading && accumulatedLogs.length === 0 ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : accumulatedLogs.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Faoliyat yozuvlari yo&apos;q</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {accumulatedLogs.map((log, idx) => {
                    const ICON_CFG: Record<string, { Icon: React.ElementType; cls: string }> = {
                      created:         { Icon: CheckCircle, cls: "bg-emerald-100 text-emerald-600" },
                      updated:         { Icon: Edit,        cls: "bg-blue-100 text-blue-600" },
                      terminated:      { Icon: Archive,     cls: "bg-orange-100 text-orange-600" },
                      reactivated:     { Icon: RotateCcw,   cls: "bg-emerald-100 text-emerald-600" },
                      balance_change:  { Icon: Wallet,      cls: "bg-indigo-100 text-indigo-600" },
                      document_add:    { Icon: FileCheck,   cls: "bg-purple-100 text-purple-600" },
                      document_delete: { Icon: Trash2,      cls: "bg-red-100 text-red-500" },
                      salary_paid:     { Icon: DollarSign,  cls: "bg-amber-100 text-amber-600" },
                      note:            { Icon: FileText,    cls: "bg-gray-100 text-gray-500" },
                    };
                    const cfg = ICON_CFG[log.action_type] ?? { Icon: Activity, cls: "bg-gray-100 text-gray-500" };
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.cls}`}>
                            <cfg.Icon className="w-3.5 h-3.5" />
                          </div>
                          {idx < accumulatedLogs.length - 1 && (
                            <div className="w-0.5 h-full min-h-[8px] bg-gray-100 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-400">
                              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                              {formatActivityDate(log.created_at)}
                            </span>
                            {log.performed_by_name && (
                              <span className="text-[10px] text-gray-400">· {log.performed_by_name}</span>
                            )}
                            <span className="text-[10px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full">
                              {log.action_type_display}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={activitySentinelRef} className="h-1" />
                {activityFetching && accumulatedLogs.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Yuklanmoqda...
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}

      {/* Archive confirm */}
      <Dialog open={terminateDialog} onOpenChange={setTerminateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Archive className="w-4.5 h-4.5 text-orange-600" style={{ width: 18, height: 18 }} />
              </div>
              Xodimni arxivlash
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed pt-1">
              <span className="font-semibold text-gray-800">{staff.full_name}</span> arxivlanadimi?
              Arxivlangan xodim asosiy ro&apos;yxatda ko&apos;rsatilmaydi, ma&apos;lumotlar saqlanib qoladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setTerminateDialog(false)}>Bekor qilish</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => terminateMutation.mutate(undefined, { onSuccess: () => setTerminateDialog(false) })}
              disabled={terminateMutation.isPending}
            >
              {terminateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Ha, arxivlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit sheet */}
      <Sheet open={editDialog} onOpenChange={setEditDialog}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-5 shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600">
            <SheetHeader>
              <SheetTitle className="text-white font-semibold text-lg">Xodimni tahrirlash</SheetTitle>
              <SheetDescription className="text-white/60 text-sm">{staff.full_name}</SheetDescription>
            </SheetHeader>
          </div>

          <TooltipProvider delayDuration={300}>
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                <section className="space-y-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Foydalanuvchi</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FieldLabel label="Ism" required tip="Xodimning ismi." />
                      <Input value={editForm.first_name ?? ""} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} placeholder="Ali" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel label="Familiya" required tip="Xodimning familiyasi." />
                      <Input value={editForm.last_name ?? ""} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} placeholder="Valiyev" className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Email" tip="Ixtiyoriy. Elektron pochta manzili." />
                    <Input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" className="h-9 text-sm" />
                  </div>
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-400">Telefon (o&apos;zgartirib bo&apos;lmaydi)</p>
                      <p className="text-sm font-medium text-gray-700">{staff.phone_number}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Rol va lavozim</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FieldLabel label="Rol turi" required tip="Tizimda bajaradigan asosiy vazifa." />
                      <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES_CONFIG.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel label="Maxsus rol" tip="Sozlamalar > Rollar bo'limida boshqariladi." />
                      <Select value={editForm.role_ref_id ?? "none"} onValueChange={(v) => setEditForm({ ...editForm, role_ref_id: v === "none" ? undefined : v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo&apos;q</SelectItem>
                          {(rolesData as any[]).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FieldLabel label="Lavozim" tip="Rasmiy lavozim. Masalan: Katta o'qituvchi." />
                      <Input value={editForm.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Katta o'qituvchi" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel label="Ish turi" tip="To'liq stavka, yarim stavka yoki soatlik." />
                      <Select value={editForm.employment_type} onValueChange={(v) => setEditForm({ ...editForm, employment_type: v as EmploymentType })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Maosh</p>
                  <div className="space-y-1.5">
                    <FieldLabel label="Oylik maosh (so'm)" tip="Asosiy oylik maosh so'mda." />
                    <SalaryInput value={editForm.monthly_salary} onChange={(val) => setEditForm({ ...editForm, monthly_salary: val })} />
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Shaxsiy ma&apos;lumotlar</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FieldLabel label="Pasport ser." tip="2 ta seriya harfi. Masalan: AA." />
                      <Input value={editForm.passport_serial ?? ""} onChange={(e) => setEditForm({ ...editForm, passport_serial: e.target.value.toUpperCase() })} placeholder="AA" maxLength={2} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel label="Pasport raqami" tip="7 xonali raqam." />
                      <Input value={editForm.passport_number ?? ""} onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })} placeholder="1234567" maxLength={7} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Manzil" tip="Yashash manzili. Ixtiyoriy." />
                    <Textarea value={editForm.address ?? ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Yashash manzili" rows={2} className="text-sm resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Favqulodda aloqa" tip="Favqulodda holatlarda bog'lanish raqami." />
                    <Input value={editForm.emergency_contact ?? ""} onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })} placeholder="+998 90 000 00 00" className="h-9 text-sm" />
                  </div>
                </section>
              </div>

              <div className="border-t px-6 py-4 flex items-center justify-end gap-2 bg-gray-50 shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditDialog(false)}>Bekor qilish</Button>
                <Button type="submit" size="sm" disabled={updateStaffMutation.isPending}>
                  {updateStaffMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  Saqlash
                </Button>
              </div>
            </form>
          </TooltipProvider>
        </SheetContent>
      </Sheet>

      {/* Balance operation dialog (topup / bonus / fine) */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className={`w-8 h-8 rounded-lg ${balanceCfg.iconBg} flex items-center justify-center`}>
                {balanceMode === "topup" && <TrendingUp className={`w-4 h-4 ${balanceCfg.iconColor}`} />}
                {balanceMode === "bonus" && <Gift className={`w-4 h-4 ${balanceCfg.iconColor}`} />}
                {balanceMode === "fine" && <TrendingDown className={`w-4 h-4 ${balanceCfg.iconColor}`} />}
              </div>
              {balanceCfg.title}
            </DialogTitle>
            <DialogDescription className="text-sm">{balanceCfg.description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBalanceSubmit} className="space-y-4 pt-2">
            {/* Current balance */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-sm text-gray-500">Joriy balans</span>
              <span className={`text-base font-bold tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {formatCurrency(staff.balance)}
              </span>
            </div>

            {/* Transaction type (only show if multiple options) */}
            {balanceCfg.availableTypes.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Tur <span className="text-red-500">*</span></Label>
                <Select
                  value={balanceForm.transaction_type}
                  onValueChange={(v) => setBalanceForm({ ...balanceForm, transaction_type: v as BalanceTxType })}
                >
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {balanceCfg.availableTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Miqdor (so&apos;m) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={balanceForm.amount || ""}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                min="1"
                required
                placeholder="500 000"
                className="h-9 text-sm font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">
                {balanceMode === "bonus" ? "Bonus sababi" : balanceMode === "fine" ? "Jarima sababi" : "Izoh"}
                <span className="text-red-500"> *</span>
              </Label>
              <Textarea
                value={balanceForm.description}
                onChange={(e) => setBalanceForm({ ...balanceForm, description: e.target.value })}
                rows={2}
                required
                placeholder={
                  balanceMode === "bonus" ? "Yangi yil uchun, yubiley uchun..."
                  : balanceMode === "fine" ? "Kechikish, qoidabuzarlik..."
                  : "Izoh..."
                }
                className="text-sm resize-none"
              />
            </div>

            {/* Payout from cash (only for fine/deduction — removes from cash register) */}
            {balanceCfg.isCredit && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={balanceForm.create_cash_transaction}
                    onChange={(e) => setBalanceForm({ ...balanceForm, create_cash_transaction: e.target.checked })}
                    className="mt-1 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Kassadan pul chiqarish</p>
                    <p className="text-xs text-gray-400 mt-0.5">Belgilansa, tanlangan kassadan avtomatik chiqim amalga oshiriladi</p>
                  </div>
                </label>

                {balanceForm.create_cash_transaction && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-100 ml-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Kassa <span className="text-red-500">*</span></Label>
                      {cashRegisters.length > 0 ? (
                        <Select value={balanceForm.cash_register_id} onValueChange={(v) => setBalanceForm({ ...balanceForm, cash_register_id: v })}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Kassani tanlang" /></SelectTrigger>
                          <SelectContent>
                            {cashRegisters.map((r: CashRegister) => (
                              <SelectItem key={r.id} value={r.id}>{r.name} ({formatCurrency(r.balance)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-red-600">Filialda faol kassa topilmadi.</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">To&apos;lov usuli</Label>
                      <Select value={balanceForm.payment_method} onValueChange={(v: any) => setBalanceForm({ ...balanceForm, payment_method: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Naqd pul</SelectItem>
                          <SelectItem value="card">Plastik karta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBalanceDialog(false)}>Bekor qilish</Button>
              <Button
                type="submit"
                className={balanceCfg.buttonColor}
                disabled={addBalanceMutation.isPending || (balanceForm.create_cash_transaction && cashRegisters.length === 0)}
              >
                {addBalanceMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {balanceCfg.title}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction detail dialog */}
      <Dialog open={transactionDetailDialog} onOpenChange={setTransactionDetailDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Tranzaksiya tafsilotlari</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <TxTypeBadge
                  type={selectedTransaction.transaction_type as TransactionType}
                  label={transactionTypeLabels[selectedTransaction.transaction_type as TransactionType] ?? selectedTransaction.transaction_type_display}
                />
                <span className="text-xs text-gray-400">{formatRelativeDateTime(selectedTransaction.created_at)}</span>
              </div>

              {/* Amount section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Miqdor</p>
                  <p className="text-lg font-bold text-gray-900 mt-1 tabular-nums">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Balans o&apos;zgarishi</p>
                  <p className={`text-lg font-bold mt-1 tabular-nums ${selectedTransaction.balance_change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {selectedTransaction.balance_change >= 0 ? "+" : ""}{formatCurrency(selectedTransaction.balance_change)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Avvalgi balans</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1 tabular-nums">{formatCurrency(selectedTransaction.previous_balance)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Yangi balans</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1 tabular-nums">{formatCurrency(selectedTransaction.new_balance)}</p>
                </div>
              </div>

              {/* Description & reference */}
              {(selectedTransaction.description || selectedTransaction.reference) && (
                <div className="space-y-2.5 border-t border-gray-100 pt-4">
                  {selectedTransaction.description && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tavsif</p>
                      <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{selectedTransaction.description}</p>
                    </div>
                  )}
                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Referens</p>
                      <p className="text-sm font-mono text-gray-700 mt-1">{selectedTransaction.reference}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Processed by */}
              {selectedTransaction.processed_by_name && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Qayd qilgan</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{selectedTransaction.processed_by_name}</p>
                      {selectedTransaction.processed_by_phone && (
                        <p className="text-xs text-gray-500 mt-0.5">{selectedTransaction.processed_by_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button variant="outline" className="w-full" onClick={() => setTransactionDetailDialog(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document upload dialog */}
      <Dialog open={docUploadDialog} onOpenChange={setDocUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-gray-600" />
              </div>
              Hujjat yuklash
            </DialogTitle>
            <DialogDescription className="text-sm">{staff.full_name} uchun hujjat</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDocUpload} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Hujjat nomi <span className="text-red-500">*</span></Label>
              <Input
                value={docUploadName}
                onChange={(e) => setDocUploadName(e.target.value)}
                placeholder="Masalan: Pasport nusxasi"
                className="h-9 text-sm"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Hujjat turi</Label>
              <Select value={docUploadType} onValueChange={setDocUploadType}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(staffDocumentTypeLabels).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Fayl <span className="text-red-500">*</span></Label>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => setDocUploadFile(e.target.files?.[0] ?? null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <div className={`h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl text-sm transition-colors ${
                  docUploadFile ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  {docUploadFile ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      <span className="text-blue-700 font-medium text-xs truncate max-w-[280px] px-2">{docUploadFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 text-xs">Fayl tanlash uchun bosing</span>
                    </>
                  )}
                </div>
              </label>
              <p className="text-[11px] text-gray-400">PDF, JPG, PNG, DOC — 10MB gacha</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Izoh (ixtiyoriy)</Label>
              <Input
                value={docUploadNotes}
                onChange={(e) => setDocUploadNotes(e.target.value)}
                placeholder="Qo'shimcha ma'lumot..."
                className="h-9 text-sm"
              />
            </div>

            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setDocUploadDialog(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" size="sm" disabled={uploadDocMutation.isPending || !docUploadFile}>
                {uploadDocMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Upload className="w-4 h-4 mr-1.5" />
                )}
                Yuklash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
