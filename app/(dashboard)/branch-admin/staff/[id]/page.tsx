"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi, financeApi } from "@/lib/api";
import {
	StaffMemberDetail,
	UpdateStaffRequest,
	ChangeBalanceRequest,
	AddSalaryAccrualRequest,
	PaySalaryNewRequest,
	MonthlySummaryResponse,
	CalculateSalaryResponse,
	BalanceTransaction,
	EMPLOYMENT_TYPE_LABELS,
	transactionTypeLabels,
	paymentMethodLabels,
	salaryPaymentTypeLabels,
} from "@/types/staff";
import type { CashRegister, CreateTransactionRequest, FinanceCategory } from "@/types/finance";
import type { EmploymentType, TransactionType, PaymentMethod, SalaryPaymentType } from "@/types/staff";
import { formatCurrency, formatRelativeDateTime, uzbekMonths } from "@/lib/utils";
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
  ArrowLeft, Edit, Wallet, CreditCard, Calendar, DollarSign,
  FileText, TrendingUp, Phone, Mail, Briefcase, MapPin,
  Archive, RotateCcw, Loader2, User, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffDetailPage() {
  const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const staffId = params.id as string;
	const todayIso = React.useMemo(() => new Date().toISOString().split("T")[0], []);
	const currentYear = React.useMemo(() => new Date().getFullYear(), []);
	const currentMonth = React.useMemo(() => new Date().getMonth() + 1, []);

  // Dialog states
  const [editDialog, setEditDialog] = React.useState(false);
  const [terminateDialog, setTerminateDialog] = React.useState(false);
  const [balanceDialog, setBalanceDialog] = React.useState(false);
  const [salaryAccrualDialog, setSalaryAccrualDialog] = React.useState(false);
  const [paySalaryDialog, setPaySalaryDialog] = React.useState(false);
  const [monthlySummaryDialog, setMonthlySummaryDialog] = React.useState(false);
  const [transactionDetailDialog, setTransactionDetailDialog] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<BalanceTransaction | null>(null);

  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);

  // Form states
  const [editForm, setEditForm] = React.useState<Partial<UpdateStaffRequest>>({});
  const [balanceForm, setBalanceForm] = React.useState<ChangeBalanceRequest>({
    transaction_type: "bonus",
    amount: 0,
    description: "",
    create_cash_transaction: false,
    cash_register_id: "",
    payment_method: "cash",
    reference: "",
  });
  const [salaryAccrualForm, setSalaryAccrualForm] = React.useState({ amount: 0, description: "", reference: "" });
	const [paySalaryForm, setPaySalaryForm] = React.useState({
		amount: 0,
		payment_date: todayIso,
		payment_method: "cash" as PaymentMethod,
		payment_type: "salary" as SalaryPaymentType,
		cash_register_id: "",
		notes: "",
		reference_number: "",
	});
	const [payAmountTouched, setPayAmountTouched] = React.useState(false);
	const [pendingCashOut, setPendingCashOut] = React.useState<CreateTransactionRequest | null>(null);
	const [cashOutError, setCashOutError] = React.useState<string | null>(null);

  // Reset helpers
  const resetBalanceForm = () => setBalanceForm({ transaction_type: "bonus", amount: 0, description: "", create_cash_transaction: false, cash_register_id: "", payment_method: "cash", reference: "" });
	const resetSalaryAccrualForm = () => setSalaryAccrualForm({ amount: 0, description: "", reference: "" });
	const resetPaySalaryForm = () => setPaySalaryForm({ amount: 0, payment_date: todayIso, payment_method: "cash", payment_type: "salary", cash_register_id: "", notes: "", reference_number: "" });

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
	const selectedCashRegister = React.useMemo(
		() => cashRegisters.find((r: CashRegister) => r.id === paySalaryForm.cash_register_id),
		[cashRegisters, paySalaryForm.cash_register_id]
	);

	const { data: monthlySummary, refetch: refetchMonthlySummary } = useQuery<MonthlySummaryResponse>({
		queryKey: ["monthly-summary", staffId, selectedYear, selectedMonth],
		queryFn: () => staffApi.getMonthlySummary(staffId, { year: selectedYear, month: selectedMonth }),
		enabled: false,
	});

	const { data: payMonthSummary } = useQuery<MonthlySummaryResponse>({
		queryKey: ["monthly-summary", "pay", staffId, selectedYear, selectedMonth],
		queryFn: () => staffApi.getMonthlySummary(staffId, { year: selectedYear, month: selectedMonth }),
		enabled: paySalaryDialog && !!staffId,
	});

	const { data: calculatedSalary } = useQuery<CalculateSalaryResponse>({
		queryKey: ["calculate-salary", staffId, selectedYear, selectedMonth],
		queryFn: () => staffApi.calculateSalary(staffId, { year: selectedYear, month: selectedMonth }),
		enabled: paySalaryDialog && !!staffId,
	});

	const { data: salaryCategories } = useQuery({
		queryKey: ["finance-categories", "salary", staff?.branch],
		queryFn: async () => {
			const byCode = await financeApi.getCategories({ type: "expense", is_active: true, search: "salary" });
			if (byCode?.results?.length) return byCode;
			return financeApi.getCategories({ type: "expense", is_active: true, search: "maosh" });
		},
		enabled: paySalaryDialog && !!staff?.branch,
	});

	const salaryCategory: FinanceCategory | undefined =
		salaryCategories?.results?.find((c) => c.code === "salary") ||
		salaryCategories?.results?.[0];

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
		onSuccess: () => { toast.success("Xodim o'chirildi"); router.push("/branch-admin/staff"); },
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

  const addBalanceMutation = useMutation({
    mutationFn: (data: ChangeBalanceRequest) => staffApi.changeBalance(staffId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setBalanceDialog(false);
      resetBalanceForm();
      const message = response.cash_transaction_id
        ? `Balans yangilandi. Kassadan ${formatCurrency(response.previous_balance - response.new_balance)} chiqarildi.`
        : "Balans muvaffaqiyatli yangilandi";
      toast.success(message);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.response?.data?.cash_register_id?.[0] || "Balansni yangilashda xatolik";
      toast.error(msg);
    },
  });

	const addSalaryAccrualMutation = useMutation({
		mutationFn: (data: AddSalaryAccrualRequest) => staffApi.addSalaryAccrual(staffId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
			setSalaryAccrualDialog(false);
			resetSalaryAccrualForm();
			toast.success("Maosh muvaffaqiyatli hisoblandi");
		},
		onError: (error: any) => toast.error(error?.response?.data?.error || "Maosh hisoblashda xatolik"),
	});

	const createSalaryCashOutMutation = useMutation({
		mutationFn: (data: CreateTransactionRequest) => financeApi.createTransaction(data),
	});

	const paySalaryNewMutation = useMutation({
		mutationFn: (data: PaySalaryNewRequest) => staffApi.paySalaryNew(staffId, data),
		onSuccess: (_staffResponse, request) => {
			queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
			if (!staff?.branch || !paySalaryForm.cash_register_id) {
				toast.error("Maosh to'landi, lekin kassa tanlanmagani uchun chiqim yozilmadi");
				return;
			}
			const cashOutPayload: CreateTransactionRequest = {
				branch: staff.branch,
				cash_register: paySalaryForm.cash_register_id,
				transaction_type: "salary",
				category: salaryCategory?.id,
				amount: paySalaryForm.amount,
				payment_method: paySalaryForm.payment_method as "cash" | "card",
				description: `${salaryPaymentTypeLabels[paySalaryForm.payment_type]} • ${staff.full_name} • ${uzbekMonths[selectedMonth - 1]} ${selectedYear}`,
				reference_number: paySalaryForm.reference_number || undefined,
				employee_membership: staffId,
				transaction_date: `${paySalaryForm.payment_date}T00:00:00Z`,
				metadata: { staff_membership_id: staffId, month: request.month, payment_type: paySalaryForm.payment_type, staff_name: staff.full_name },
			};
			setPendingCashOut(cashOutPayload);
			setCashOutError(null);
			createSalaryCashOutMutation.mutate(cashOutPayload, {
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
					setPendingCashOut(null);
					setPaySalaryDialog(false);
					resetPaySalaryForm();
					toast.success("Maosh to'landi va kassadan pul chiqarildi");
				},
				onError: (error: any) => {
					const data = error?.response?.data;
					const msg = data?.error || data?.category?.[0] || data?.cash_register?.[0] || data?.amount?.[0] || "Kassadan pul chiqarishda xatolik";
					setCashOutError(msg);
					toast.error("Maosh to'landi, lekin kassa chiqimi yozilmadi");
				},
			});
		},
		onError: (error: any) => {
			setPendingCashOut(null);
			setCashOutError(null);
			const data = error?.response?.data;
			const msg = data?.error || data?.month?.[0] || data?.amount?.[0] || data?.payment_date?.[0] || "Maosh to'lashda xatolik";
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

  const openSalaryAccrualDialog = () => {
    if (staff) {
      setSalaryAccrualForm({
        amount: staff.monthly_salary || 0,
        description: `${uzbekMonths[selectedMonth - 1]} ${selectedYear} oyi maoshi`,
        reference: "",
      });
    }
    setSalaryAccrualDialog(true);
  };

	const openPaySalaryDialog = () => {
		setPayAmountTouched(false);
		setPendingCashOut(null);
		setCashOutError(null);
		resetPaySalaryForm();
		setPaySalaryDialog(true);
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

  const handleSalaryAccrualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salaryAccrualForm.amount <= 0) { toast.error("Miqdor 0 dan katta bo'lishi kerak"); return; }
    if (!salaryAccrualForm.description.trim()) { toast.error("Tavsif kiritilishi shart"); return; }
    addSalaryAccrualMutation.mutate(salaryAccrualForm);
  };

	const handlePaySalarySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (pendingCashOut) { toast.error("Kassa chiqimi yakunlanmagan. Avval qayta urinib ko'ring."); return; }
		if (paySalaryForm.amount <= 0) { toast.error("Miqdor 0 dan katta bo'lishi kerak"); return; }
		if (staff && paySalaryForm.amount > staff.balance) { toast.error("Balansdan ortiq to'lov qilish mumkin emas"); return; }
		if (!paySalaryForm.cash_register_id) { toast.error("Kassa tanlash majburiy"); return; }
		if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
			toast.error("Kelajak oyi uchun to'lov qilish mumkin emas");
			return;
		}
		const month = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
		paySalaryNewMutation.mutate({
			amount: paySalaryForm.amount,
			payment_date: paySalaryForm.payment_date,
			payment_method: paySalaryForm.payment_method,
			payment_type: paySalaryForm.payment_type,
			notes: paySalaryForm.notes,
			reference_number: paySalaryForm.reference_number,
			month,
		});
	};

	React.useEffect(() => {
		if (!paySalaryDialog || !staff || payAmountTouched) return;
		const outstanding = payMonthSummary ? Math.max(payMonthSummary.total_accrued - payMonthSummary.total_paid, 0) : 0;
		const calculated = calculatedSalary?.success && typeof calculatedSalary.total_amount === "number" ? calculatedSalary.total_amount : 0;
		const base = outstanding > 0 ? outstanding : calculated > 0 ? calculated : staff.monthly_salary || 0;
		const suggested = Math.min(Math.max(base, 0), Math.max(staff.balance, 0));
		setPaySalaryForm((prev) => ({ ...prev, amount: suggested }));
	}, [paySalaryDialog, staff, payAmountTouched, payMonthSummary?.total_accrued, payMonthSummary?.total_paid, calculatedSalary?.success, calculatedSalary?.total_amount]);

	React.useEffect(() => {
		if (!paySalaryDialog) { setPendingCashOut(null); setCashOutError(null); return; }
		if (!paySalaryForm.cash_register_id && cashRegisters.length === 1) {
			setPaySalaryForm((prev) => ({ ...prev, cash_register_id: cashRegisters[0]?.id || "" }));
		}
		if (!paySalaryForm.reference_number) {
			const suffix = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID().slice(0, 8) : String(Date.now()).slice(-8);
			setPaySalaryForm((prev) => ({ ...prev, reference_number: `SAL-${selectedYear}${String(selectedMonth).padStart(2, "0")}-${suffix}` }));
		}
	}, [paySalaryDialog, cashRegisters.length, paySalaryForm.cash_register_id, paySalaryForm.reference_number, selectedYear, selectedMonth]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-24 rounded-lg" />)}
          </div>
        </div>
        <Skeleton className="h-[88px] w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
        <Button variant="outline" size="sm" onClick={() => router.push("/branch-admin/staff")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Orqaga
        </Button>
      </div>
    );
  }

  const isArchived = !!staff.termination_date;
  const roleStyle = ROLE_COLOR[staff.role] ?? { bg: "bg-indigo-100", text: "text-indigo-700" };
  const avatarLetters = staff.full_name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Top nav */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => router.push("/branch-admin/staff")}
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
          <Button variant="outline" size="sm" className="gap-1.5 h-9 border-gray-200" onClick={() => { setMonthlySummaryDialog(true); refetchMonthlySummary(); }}>
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xulosa</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 border-violet-200 text-violet-700 hover:bg-violet-50" onClick={openSalaryAccrualDialog}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hisoblash</span>
          </Button>
          <Button size="sm" className="gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700" onClick={openPaySalaryDialog}>
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Maosh to&apos;lash</span>
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
                {staff.balance < 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                    Qarzdor
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
            <p className={`text-lg font-bold mt-1 tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-gray-900"}`}>
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

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="space-y-4">

          {/* Personal info */}
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Ma&apos;lumotlar</CardTitle>
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

          {/* Salary management */}
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Moliya</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Oylik maosh</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(staff.monthly_salary || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Joriy balans</span>
                <span className={`text-sm font-semibold ${staff.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(staff.balance)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs border-gray-200"
                  onClick={() => setBalanceDialog(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tranzaksiya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                  onClick={openSalaryAccrualDialog}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Hisoblash
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
                <CardTitle className="text-sm font-semibold text-gray-700">Oxirgi tranzaksiyalar</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => router.push(`/branch-admin/staff/${staffId}/transactions`)}
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
                        <TableHead className="text-xs font-medium text-gray-500 text-right">Miqdor</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 text-right pr-4">Balans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.recent_transactions.slice(0, 8).map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                          onClick={() => { setSelectedTransaction(transaction); setTransactionDetailDialog(true); }}
                        >
                          <TableCell className="text-xs text-gray-500 pl-4 whitespace-nowrap">
                            {formatRelativeDateTime(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              {transaction.transaction_type_display}
                            </span>
                          </TableCell>
                          <TableCell className={`text-right text-sm font-semibold tabular-nums pr-2 ${
                            transaction.balance_change >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}>
                            {transaction.balance_change >= 0 ? "+" : ""}{formatCurrency(transaction.balance_change)}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-gray-500 pr-4">
                            {formatCurrency(transaction.new_balance)}
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
                  <p className="text-xs text-gray-300 mt-1">Maosh yoki balans operatsiyalari bu yerda ko&apos;rinadi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Balance dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              Balans tranzaksiyasi
            </DialogTitle>
            <DialogDescription className="text-sm">
              Xodim balansini o&apos;zgartirish
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBalanceSubmit} className="space-y-4 pt-2">
            {/* Current balance */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-sm text-gray-500">Joriy balans</span>
              <span className={`text-base font-bold tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {formatCurrency(staff.balance)}
              </span>
            </div>

            {/* Transaction type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Tranzaksiya turi <span className="text-red-500">*</span></Label>
              <Select value={balanceForm.transaction_type} onValueChange={(v: any) => setBalanceForm({ ...balanceForm, transaction_type: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary_accrual">Oylik hisoblash</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="other">Boshqa kirim</SelectItem>
                  <SelectItem value="deduction">Balansdan chiqarish</SelectItem>
                  <SelectItem value="advance">Avans berish</SelectItem>
                  <SelectItem value="fine">Jarima</SelectItem>
                  <SelectItem value="adjustment">To&apos;g&apos;rilash</SelectItem>
                </SelectContent>
              </Select>
              {balanceForm.transaction_type && (
                <p className="text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                  {balanceForm.transaction_type === "salary_accrual" && "Xodim balansiga oylik maosh qo'shiladi."}
                  {balanceForm.transaction_type === "bonus" && "Xodim balansiga bonus qo'shiladi."}
                  {balanceForm.transaction_type === "other" && "Boshqa turdagi qo'shimcha mablag'."}
                  {balanceForm.transaction_type === "deduction" && "Xodim balansidan pul ayiriladi."}
                  {balanceForm.transaction_type === "advance" && "Xodimga avans sifatida pul beriladi."}
                  {balanceForm.transaction_type === "fine" && "Xodim balansidan jarima ayiriladi."}
                  {balanceForm.transaction_type === "adjustment" && "Balansni to'g'rilash."}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Miqdor (so&apos;m) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={balanceForm.amount || ""}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                min="1"
                required
                placeholder="5 000 000"
                className="h-9 text-sm font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Tavsif <span className="text-red-500">*</span></Label>
              <Textarea
                value={balanceForm.description}
                onChange={(e) => setBalanceForm({ ...balanceForm, description: e.target.value })}
                rows={2}
                required
                placeholder="Tranzaksiya haqida qisqacha ma'lumot..."
                className="text-sm resize-none"
              />
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Referens raqami (ixtiyoriy)</Label>
              <Input value={balanceForm.reference} onChange={(e) => setBalanceForm({ ...balanceForm, reference: e.target.value })} placeholder="SAL-2024-12" className="h-9 text-sm" />
            </div>

            {/* Cash transaction toggle */}
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
                          {cashRegisters.map((r) => (
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

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBalanceDialog(false)}>Bekor qilish</Button>
              <Button type="submit" disabled={addBalanceMutation.isPending || (balanceForm.create_cash_transaction && cashRegisters.length === 0)}>
                {addBalanceMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Salary accrual dialog */}
      <Dialog open={salaryAccrualDialog} onOpenChange={setSalaryAccrualDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              Maosh hisoblash
            </DialogTitle>
            <DialogDescription className="text-sm">
              Xodim balansiga maosh qo&apos;shish
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalaryAccrualSubmit} className="space-y-4 pt-2">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-sm text-gray-500">Belgilangan maosh</span>
              <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(staff.monthly_salary || 0)}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Miqdor (so&apos;m) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={salaryAccrualForm.amount || ""}
                onChange={(e) => setSalaryAccrualForm({ ...salaryAccrualForm, amount: parseInt(e.target.value) || 0 })}
                step="100000"
                required
                placeholder={formatSalary(staff.monthly_salary)}
                className="h-9 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Tavsif <span className="text-red-500">*</span></Label>
              <Input
                value={salaryAccrualForm.description}
                onChange={(e) => setSalaryAccrualForm({ ...salaryAccrualForm, description: e.target.value })}
                placeholder="Dekabr oyi maoshi"
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Referens raqami (ixtiyoriy)</Label>
              <Input
                value={salaryAccrualForm.reference}
                onChange={(e) => setSalaryAccrualForm({ ...salaryAccrualForm, reference: e.target.value })}
                placeholder="SAL-2024-12"
                className="h-9 text-sm"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSalaryAccrualDialog(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={addSalaryAccrualMutation.isPending}>
                {addSalaryAccrualMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Hisoblash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay salary dialog */}
      <Dialog open={paySalaryDialog} onOpenChange={setPaySalaryDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              Maosh to&apos;lash
            </DialogTitle>
            <DialogDescription className="text-sm">
              Xodim balansidan maosh to&apos;lovi va kassa chiqimi
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaySalarySubmit} className="space-y-4 pt-2">
            {/* Balance info */}
            <div className={`rounded-xl px-4 py-3 border ${staff.balance <= 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Joriy balans</span>
                <span className={`text-base font-bold tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(staff.balance)}
                </span>
              </div>
              {staff.balance <= 0 && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Balansda mablag&apos; yo&apos;q
                </p>
              )}
            </div>

            {/* Month selection */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">To&apos;lov oyi <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={String(selectedMonth)} onValueChange={(v) => { setPayAmountTouched(false); setSelectedMonth(parseInt(v)); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)} disabled={selectedYear === currentYear && m > currentMonth}>
                        {uzbekMonths[m - 1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(v) => { setPayAmountTouched(false); setSelectedYear(parseInt(v)); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">To&apos;lov turi</Label>
              <Select value={paySalaryForm.payment_type} onValueChange={(v) => setPaySalaryForm({ ...paySalaryForm, payment_type: v as SalaryPaymentType })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(salaryPaymentTypeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">To&apos;lov miqdori <span className="text-red-500">*</span></Label>
              <CurrencyInput
                value={paySalaryForm.amount}
                onValueChange={(amount) => { setPayAmountTouched(true); setPaySalaryForm({ ...paySalaryForm, amount }); }}
                max={staff.balance > 0 ? staff.balance : 0}
                required
                placeholder="0"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Maksimal: {formatCurrency(Math.max(staff.balance, 0))}</span>
                <span className="font-medium">{formatCurrency(paySalaryForm.amount)}</span>
              </div>
            </div>

            {/* Cash register */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Kassa <span className="text-red-500">*</span></Label>
              {cashRegisters.length > 0 ? (
                <>
                  <Select
                    value={paySalaryForm.cash_register_id || "none"}
                    onValueChange={(v) => setPaySalaryForm({ ...paySalaryForm, cash_register_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Kassani tanlang" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanlanmagan</SelectItem>
                      {cashRegisters.map((r: CashRegister) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({formatCurrency(r.balance)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCashRegister && paySalaryForm.amount > selectedCashRegister.balance ? (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <p className="font-medium">Kassa balansi yetarli emas</p>
                      <p className="mt-0.5 text-red-600">
                        Kassada: {formatCurrency(selectedCashRegister.balance)} · Yetishmaydi: {formatCurrency(paySalaryForm.amount - selectedCashRegister.balance)}
                      </p>
                    </div>
                  ) : selectedCashRegister ? (
                    <p className="text-xs text-gray-400">
                      Chiqimdan keyin qoladi: {formatCurrency(selectedCashRegister.balance - paySalaryForm.amount)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-red-600">Filialda faol kassa topilmadi.</p>
              )}
            </div>

            {/* Payment date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">To&apos;lov sanasi <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={paySalaryForm.payment_date}
                onChange={(e) => setPaySalaryForm({ ...paySalaryForm, payment_date: e.target.value })}
                max={todayIso}
                required
                className="h-9 text-sm"
              />
            </div>

            {/* Payment method */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">To&apos;lov usuli <span className="text-red-500">*</span></Label>
              <Select value={paySalaryForm.payment_method} onValueChange={(v) => setPaySalaryForm({ ...paySalaryForm, payment_method: v as PaymentMethod })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Reference & notes (collapsed section) */}
            <details className="group">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                Qo&apos;shimcha maydonlar (ixtiyoriy)
              </summary>
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Referens raqami</Label>
                  <Input value={paySalaryForm.reference_number} onChange={(e) => setPaySalaryForm({ ...paySalaryForm, reference_number: e.target.value })} placeholder="PAY-2024-12-001" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Izoh</Label>
                  <Textarea value={paySalaryForm.notes} onChange={(e) => setPaySalaryForm({ ...paySalaryForm, notes: e.target.value })} rows={2} placeholder="Dekabr oyi to'lovi" className="text-sm resize-none" />
                </div>
              </div>
            </details>

            {cashOutError && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium">Kassa chiqimi yozilmadi</p>
                <p className="mt-1 text-xs">{cashOutError}</p>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPaySalaryDialog(false)}>Bekor qilish</Button>
              {pendingCashOut && cashOutError ? (
                <Button
                  type="button"
                  onClick={() => pendingCashOut && createSalaryCashOutMutation.mutate(pendingCashOut, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
                      setPendingCashOut(null);
                      setPaySalaryDialog(false);
                      resetPaySalaryForm();
                      toast.success("Kassa chiqimi yozildi");
                    },
                    onError: (error: any) => {
                      const data = error?.response?.data;
                      setCashOutError(data?.error || data?.category?.[0] || data?.cash_register?.[0] || data?.amount?.[0] || "Xatolik");
                    },
                  })}
                  disabled={createSalaryCashOutMutation.isPending}
                >
                  {createSalaryCashOutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  Kassa chiqimini qayta yozish
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    paySalaryNewMutation.isPending ||
                    createSalaryCashOutMutation.isPending ||
                    staff.balance <= 0 ||
                    cashRegisters.length === 0 ||
                    !paySalaryForm.cash_register_id ||
                    (!!selectedCashRegister && paySalaryForm.amount > selectedCashRegister.balance)
                  }
                >
                  {paySalaryNewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  To&apos;lash
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Monthly summary dialog */}
      <Dialog open={monthlySummaryDialog} onOpenChange={setMonthlySummaryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              Oylik xulosa
            </DialogTitle>
            <DialogDescription className="text-sm">
              {uzbekMonths[selectedMonth - 1]} {selectedYear} oyi
            </DialogDescription>
          </DialogHeader>

          {monthlySummary ? (
            <div className="space-y-3 pt-2">
              <div className="grid gap-2">
                <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Jami hisoblangan</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(monthlySummary.total_accrued)}</span>
                </div>
                <div className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Jami to&apos;langan</span>
                  <span className="font-bold text-red-700 tabular-nums">{formatCurrency(monthlySummary.total_paid)}</span>
                </div>
                <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Balans o&apos;zgarishi</span>
                  <span className={`font-bold tabular-nums ${monthlySummary.balance_change < 0 ? "text-red-700" : "text-blue-700"}`}>
                    {formatCurrency(monthlySummary.balance_change)}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tranzaksiyalar</span>
                  <span className="font-semibold text-gray-800">{monthlySummary.transactions_count} ta</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To&apos;lovlar</span>
                  <span className="font-semibold text-gray-800">{monthlySummary.payments_count} ta</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Yuklanmoqda...</p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" className="w-full" onClick={() => setMonthlySummaryDialog(false)}>Yopish</Button>
          </DialogFooter>
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {selectedTransaction.transaction_type_display}
                </span>
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

              {/* Extra info */}
              {(selectedTransaction.description || selectedTransaction.reference) && (
                <div className="space-y-2.5 border-t border-gray-100 pt-4">
                  {selectedTransaction.description && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tavsif</p>
                      <p className="text-sm text-gray-800 mt-1">{selectedTransaction.description}</p>
                    </div>
                  )}
                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Referens</p>
                      <p className="text-sm font-mono text-gray-700 mt-1">{selectedTransaction.reference}</p>
                    </div>
                  )}
                  {selectedTransaction.salary_payment_month && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Maosh oyi</p>
                      <p className="text-sm text-gray-800 mt-1">
                        {(() => {
                          const d = new Date(selectedTransaction.salary_payment_month);
                          return `${uzbekMonths[d.getMonth()]} ${d.getFullYear()}`;
                        })()}
                      </p>
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
    </div>
  );
}
