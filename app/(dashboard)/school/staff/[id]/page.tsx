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
import {
  ArrowLeft,
  Edit,
  Wallet,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Info,
  Archive,
  RotateCcw,
  Loader2,
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

// ── FieldLabel ────────────────────────────────────────────────────────────────
function FieldLabel({ label, required, tip }: { label: string; required?: boolean; tip: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3 h-3 text-gray-300 cursor-help hover:text-gray-400 transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function formatPhoneDigits(d: string) {
  const s = d.slice(0, 9);
  if (s.length <= 2) return s;
  if (s.length <= 5) return `${s.slice(0, 2)} ${s.slice(2)}`;
  if (s.length <= 7) return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5)}`;
  return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5, 7)} ${s.slice(7)}`;
}

function PhoneInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const prefix = "+998";
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : "";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(prefix + digits);
  };
  return (
    <div className="flex h-9 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
      <span className="flex items-center px-3 text-gray-600 font-medium border-r border-input bg-muted/50 select-none shrink-0">+998</span>
      <input value={formatPhoneDigits(raw)} onChange={handleChange} placeholder="90 123 45 67" inputMode="numeric" className="flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground" />
    </div>
  );
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
      <input ref={inputRef} type="text" inputMode="numeric" value={formatSalary(value)} onChange={handleChange} placeholder="5 000 000" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pr-14 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">so&apos;m</span>
    </div>
  );
}

const ROLES_CONFIG = [
  { value: "teacher", label: "O'qituvchi" },
  { value: "branch_admin", label: "Filial admini" },
  { value: "other", label: "Boshqa" },
];

export default function StaffDetailPage() {
  const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const staffId = params.id as string;
	const todayIso = React.useMemo(() => new Date().toISOString().split("T")[0], []);
	const currentYear = React.useMemo(() => new Date().getFullYear(), []);
	const currentMonth = React.useMemo(() => new Date().getMonth() + 1, []);

  // Dialog States
  const [editDialog, setEditDialog] = React.useState(false);
  const [terminateDialog, setTerminateDialog] = React.useState(false);
  const [balanceDialog, setBalanceDialog] = React.useState(false);
  const [salaryAccrualDialog, setSalaryAccrualDialog] = React.useState(false);
  const [paySalaryDialog, setPaySalaryDialog] = React.useState(false);
  const [monthlySummaryDialog, setMonthlySummaryDialog] = React.useState(false);
  const [transactionDetailDialog, setTransactionDetailDialog] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<BalanceTransaction | null>(null);

  // Selected month/year for salary operations
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);

  // Form States
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

  const [salaryAccrualForm, setSalaryAccrualForm] = React.useState({
    amount: 0,
    description: "",
    reference: "",
  });

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

  // Reset form functions
  const resetEditForm = () => setEditForm({});
  const resetBalanceForm = () => setBalanceForm({
    transaction_type: "bonus",
    amount: 0,
    description: "",
    create_cash_transaction: false,
    cash_register_id: "",
    payment_method: "cash",
    reference: "",
  });
	const resetSalaryAccrualForm = () => setSalaryAccrualForm({ amount: 0, description: "", reference: "" });
	const resetPaySalaryForm = () => setPaySalaryForm({
		amount: 0,
		payment_date: todayIso,
		payment_method: "cash",
		payment_type: "salary",
		cash_register_id: "",
		notes: "",
		reference_number: "",
	});

  // Queries
  const {
    data: staff,
    isLoading,
    error,
  } = useQuery<StaffMemberDetail>({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.getStaffMember(staffId),
    enabled: !!staffId,
  });

  // Get cash registers for the branch
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
			const byCode = await financeApi.getCategories({
				type: "expense",
				is_active: true,
				search: "salary",
			});
			if (byCode?.results?.length) return byCode;
			return financeApi.getCategories({
				type: "expense",
				is_active: true,
				search: "maosh",
			});
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
      resetEditForm();
      toast.success("Xodim muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Xodimni yangilashda xatolik");
    },
  });

	const deleteStaffMutation = useMutation({
		mutationFn: () => staffApi.deleteStaff(staffId),
		onSuccess: () => {
			toast.success("Xodim muvaffaqiyatli o'chirildi");
			router.push("/school/staff");
		},
		onError: () => {
			toast.error("Xodimni o'chirishda xatolik");
		},
	});

  const terminateMutation = useMutation({
    mutationFn: () => staffApi.terminateStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Xodim arxivlandi");
    },
    onError: () => toast.error("Arxivlashda xatolik yuz berdi"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => staffApi.reactivateStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Xodim qayta faollashtirildi");
    },
    onError: () => toast.error("Faollashtirishda xatolik yuz berdi"),
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
      const errorMsg = error?.response?.data?.error || 
                       error?.response?.data?.cash_register_id?.[0] ||
                       "Balansni yangilashda xatolik";
      toast.error(errorMsg);
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
		onError: (error: any) => {
			toast.error(error?.response?.data?.error || "Maosh hisoblashda xatolik");
		},
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
				metadata: {
					staff_membership_id: staffId,
					month: request.month,
					payment_type: paySalaryForm.payment_type,
					staff_name: staff.full_name,
				},
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
					const msg =
						data?.error ||
						data?.category?.[0] ||
						data?.cash_register?.[0] ||
						data?.amount?.[0] ||
						"Kassadan pul chiqarishda xatolik";
					setCashOutError(msg);
					toast.error("Maosh to'landi, lekin kassa chiqimi yozilmadi");
				},
			});
		},
		onError: (error: any) => {
			setPendingCashOut(null);
			setCashOutError(null);
			const data = error?.response?.data;
			const msg =
				data?.error ||
				data?.month?.[0] ||
				data?.amount?.[0] ||
				data?.payment_date?.[0] ||
				"Maosh to'lashda xatolik";
			toast.error(msg);
		},
	});

	// Handlers
  const openEditDialog = () => {
    if (staff) {
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
    }
  };

  const openBalanceDialog = () => {
    setBalanceDialog(true);
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

  const openMonthlySummaryDialog = () => {
    setMonthlySummaryDialog(true);
    refetchMonthlySummary();
  };

  const handleDelete = () => {
    if (window.confirm("Rostdan ham bu xodimni o'chirmoqchimisiz?")) {
      deleteStaffMutation.mutate();
    }
  };

  const handleTerminate = () => setTerminateDialog(true);
  const confirmTerminate = () => {
    terminateMutation.mutate(undefined, { onSuccess: () => setTerminateDialog(false) });
  };

  const handleReactivate = () => {
    reactivateMutation.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffMutation.mutate(editForm as UpdateStaffRequest);
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (balanceForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    
    // Validate description
    if (!balanceForm.description.trim()) {
      toast.error("Tavsif kiritish majburiy");
      return;
    }
    
    // Validate cash register when creating cash transaction
    if (balanceForm.create_cash_transaction && !balanceForm.cash_register_id) {
      toast.error("Kassa tanlash majburiy");
      return;
    }
    
    addBalanceMutation.mutate(balanceForm);
  };

  const handleSalaryAccrualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salaryAccrualForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    if (!salaryAccrualForm.description.trim()) {
      toast.error("Tavsif kiritilishi shart");
      return;
    }
    addSalaryAccrualMutation.mutate(salaryAccrualForm);
  };

	const handlePaySalarySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (pendingCashOut) {
			toast.error("Kassa chiqimi yakunlanmagan. Avval qayta urinib ko'ring yoki oynani yoping.");
			return;
		}
		if (paySalaryForm.amount <= 0) {
			toast.error("Miqdor 0 dan katta bo'lishi kerak");
			return;
		}
		if (staff && paySalaryForm.amount > staff.balance) {
			toast.error("Balansdan ortiq to'lov qilish mumkin emas");
			return;
		}
		if (!paySalaryForm.cash_register_id) {
			toast.error("Kassa tanlash majburiy");
			return;
		}

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
			const outstanding = payMonthSummary
				? Math.max(payMonthSummary.total_accrued - payMonthSummary.total_paid, 0)
				: 0;
		const calculated =
			calculatedSalary?.success && typeof calculatedSalary.total_amount === "number"
				? calculatedSalary.total_amount
				: 0;
		const base =
			outstanding > 0 ? outstanding : calculated > 0 ? calculated : staff.monthly_salary || 0;
		const suggested = Math.min(Math.max(base, 0), Math.max(staff.balance, 0));
		setPaySalaryForm((prev) => ({ ...prev, amount: suggested }));
	}, [
		paySalaryDialog,
		staff,
		payAmountTouched,
		payMonthSummary?.total_accrued,
		payMonthSummary?.total_paid,
		calculatedSalary?.success,
			calculatedSalary?.total_amount,
		]);

		React.useEffect(() => {
			if (!paySalaryDialog) {
				setPendingCashOut(null);
				setCashOutError(null);
				return;
			}
			if (!paySalaryForm.cash_register_id && cashRegisters.length === 1) {
				setPaySalaryForm((prev) => ({ ...prev, cash_register_id: cashRegisters[0]?.id || "" }));
			}
			if (!paySalaryForm.reference_number) {
				const suffix =
					typeof globalThis.crypto?.randomUUID === "function"
						? globalThis.crypto.randomUUID().slice(0, 8)
						: String(Date.now()).slice(-8);
				setPaySalaryForm((prev) => ({
					...prev,
					reference_number: `SAL-${selectedYear}${String(selectedMonth).padStart(2, "0")}-${suffix}`,
				}));
			}
		}, [
			paySalaryDialog,
			cashRegisters.length,
			paySalaryForm.cash_register_id,
			paySalaryForm.reference_number,
			selectedYear,
			selectedMonth,
		]);

  // Loading and Error States
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

	if (error || !staff) {
		return (
			<div className="container mx-auto py-6 px-4">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<p className="text-red-600 text-lg mb-4">Xodim topilmadi</p>
						<Button onClick={() => router.push("/school/staff")}>
							Orqaga qaytish
						</Button>
					</div>
				</div>
      </div>
    );
  }

  const isArchived = !!staff.termination_date;
  const avatarLetters = staff.full_name
    .split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
  const roleColorMap: Record<string, string> = {
    teacher: "bg-blue-100 text-blue-700",
    branch_admin: "bg-purple-100 text-purple-700",
    other: "bg-slate-100 text-slate-600",
  };
  const avatarColor = roleColorMap[staff.role] ?? "bg-indigo-100 text-indigo-700";

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-4">

      {/* ── Top navigation bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/school/staff")}
          className="gap-1.5 text-gray-500 -ml-2 h-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Xodimlar
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={openEditDialog}>
            <Edit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tahrirlash</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={openMonthlySummaryDialog}>
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xulosa</span>
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 h-8" onClick={openPaySalaryDialog}>
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Maosh to&apos;lash</span>
          </Button>
          {isArchived ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 border-green-200 text-green-700 hover:bg-green-50"
              onClick={handleReactivate}
              disabled={reactivateMutation.isPending}
            >
              {reactivateMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RotateCcw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Qaytarish</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={handleTerminate}
              disabled={terminateMutation.isPending}
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Arxivlash</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Profile card ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${avatarColor} flex items-center justify-center text-lg font-bold shrink-0`}>
              {avatarLetters}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 justify-between flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{staff.full_name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {staff.role_display}
                    {staff.role_ref_name && ` · ${staff.role_ref_name}`}
                    {staff.title && ` · ${staff.title}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isArchived ? (
                    <Badge className="bg-orange-50 text-orange-700 border border-orange-200 font-medium text-xs">
                      Arxivlangan
                    </Badge>
                  ) : (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium text-xs">
                      Faol
                    </Badge>
                  )}
                  {staff.balance < 0 && (
                    <Badge variant="destructive" className="text-xs">Qarzdor</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-sm text-gray-500">
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

      {/* ── Key metrics ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Joriy balans</p>
            <p className={`text-lg font-bold tabular-nums ${staff.balance < 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatCurrency(staff.balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Oylik maosh</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">
              {formatCurrency(staff.monthly_salary || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Ish turi</p>
            <p className="text-sm font-semibold text-gray-900">
              {staff.employment_type ? EMPLOYMENT_TYPE_LABELS[staff.employment_type] : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Ish muddati</p>
            <p className="text-sm font-semibold text-gray-900">
              {staff.days_employed != null ? `${staff.days_employed} kun` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Details Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* Ma'lumotlar kartasi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Ma&apos;lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Telefon</p>
                  <p className="text-sm font-medium truncate">{staff.phone_number}</p>
                </div>
              </div>
              {staff.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium truncate">{staff.email}</p>
                  </div>
                </div>
              )}
              {staff.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Manzil</p>
                    <p className="text-sm font-medium">{staff.address}</p>
                  </div>
                </div>
              )}
              {staff.emergency_contact && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Favqulodda aloqa</p>
                    <p className="text-sm font-medium">{staff.emergency_contact}</p>
                  </div>
                </div>
              )}
              {(staff.passport_serial || staff.passport_number) && (
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Pasport</p>
                    <p className="text-sm font-medium">
                      {staff.passport_serial} {staff.passport_number}
                    </p>
                  </div>
                </div>
              )}
              {staff.termination_date && (
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Arxivlangan sana</p>
                    <p className="text-sm font-medium text-orange-600">
                      {new Date(staff.termination_date).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Moliya */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Moliya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-sm text-gray-500">Oylik maosh</span>
                <span className="text-sm font-semibold">{formatCurrency(staff.monthly_salary || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-500">Joriy balans</span>
                <span className={`text-sm font-semibold ${staff.balance < 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(staff.balance)}
                </span>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={openBalanceDialog} className="w-full gap-2 h-8 text-xs">
                  <Wallet className="w-3.5 h-3.5" />
                  Tranzaksiya qo&apos;shish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Oxirgi tranzaksiyalar</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-blue-600"
                  onClick={() => router.push(`/school/staff/${staffId}/transactions`)}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Barchasini ko&apos;rish
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {staff.recent_transactions && staff.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/60">
                        <TableHead className="text-xs">Sana</TableHead>
                        <TableHead className="text-xs">Turi</TableHead>
                        <TableHead className="text-xs text-right">Miqdor</TableHead>
                        <TableHead className="text-xs text-right">Balans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.recent_transactions.slice(0, 8).map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setTransactionDetailDialog(true);
                          }}
                        >
                          <TableCell className="whitespace-nowrap text-xs text-gray-500">
                            {formatRelativeDateTime(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                              {transaction.transaction_type_display}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right text-sm font-semibold tabular-nums ${
                            transaction.balance_change >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.balance_change >= 0 ? "+" : ""}
                            {formatCurrency(transaction.balance_change)}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-gray-600">
                            {formatCurrency(transaction.new_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Tranzaksiyalar yo&apos;q</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Arxivlash tasdiqlash dialogi */}
      <Dialog open={terminateDialog} onOpenChange={setTerminateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-orange-500" />
              Xodimni arxivlash
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{staff?.full_name}</span> ni
              arxivlamoqchimisiz? Arxivlangan xodim asosiy ro&apos;yxatda ko&apos;rsatilmaydi,
              lekin ma&apos;lumotlar saqlanib qoladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTerminateDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={confirmTerminate}
              disabled={terminateMutation.isPending}
            >
              {terminateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Ha, arxivlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      <Sheet open={editDialog} onOpenChange={setEditDialog}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-5 shrink-0 bg-indigo-600">
            <SheetHeader>
              <SheetTitle className="text-white font-semibold text-lg">Xodimni tahrirlash</SheetTitle>
              <SheetDescription className="text-white/60 text-sm">{staff?.full_name}</SheetDescription>
            </SheetHeader>
          </div>

          <TooltipProvider delayDuration={300}>
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* Foydalanuvchi */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Foydalanuvchi</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel label="Ism" required tip="Xodimning ismi." />
                      <Input value={editForm.first_name ?? ""} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} placeholder="Ali" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Familiya" required tip="Xodimning familiyasi." />
                      <Input value={editForm.last_name ?? ""} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} placeholder="Valiyev" className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Email" tip="Ixtiyoriy. Xodimning elektron pochta manzili." />
                    <Input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" className="h-9 text-sm" />
                  </div>
                  <div className="rounded-md bg-gray-50 border px-3 py-2.5 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Telefon (o&apos;zgartirib bo&apos;lmaydi)</p>
                      <p className="text-sm font-medium text-gray-700">{staff?.phone_number}</p>
                    </div>
                  </div>
                </section>

                {/* Rol va lavozim */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rol va lavozim</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel label="Rol turi" required tip="Xodimning tizimda bajaradigan asosiy vazifasi." />
                      <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES_CONFIG.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Maxsus rol" required={editForm.role === "other"} tip={`"Boshqa" xodim uchun maxsus rol. Sozlamalar > Rollar bo'limida boshqariladi.`} />
                      <Select value={editForm.role_ref_id ?? "none"} onValueChange={(v) => setEditForm({ ...editForm, role_ref_id: v === "none" ? undefined : v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo&apos;q</SelectItem>
                          {rolesData.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel label="Lavozim" tip="Xodimning rasmiy lavozimi. Masalan: Katta o'qituvchi." />
                      <Input value={editForm.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Katta o'qituvchi" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Ish turi" tip="To'liq stavka, yarim stavka yoki soatlik ish tartibi." />
                      <Select value={editForm.employment_type} onValueChange={(v) => setEditForm({ ...editForm, employment_type: v as EmploymentType })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Maosh */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Maosh</p>
                  <div className="space-y-1">
                    <FieldLabel label="Oylik maosh (so'm)" tip="Xodimning asosiy oylik maoshi so'mda. Moliya hisobotlarida ishlatiladi." />
                    <SalaryInput value={editForm.monthly_salary} onChange={(val) => setEditForm({ ...editForm, monthly_salary: val })} />
                  </div>
                </section>

                {/* Shaxsiy ma'lumotlar */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Shaxsiy ma&apos;lumotlar</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel label="Pasport ser." tip="O'zbekiston pasportining 2 ta seriya harfi. Masalan: AA, AB." />
                      <Input value={editForm.passport_serial ?? ""} onChange={(e) => setEditForm({ ...editForm, passport_serial: e.target.value.toUpperCase() })} placeholder="AA" maxLength={2} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel label="Pasport raqami" tip="Pasportning 7 xonali raqami." />
                      <Input value={editForm.passport_number ?? ""} onChange={(e) => setEditForm({ ...editForm, passport_number: e.target.value })} placeholder="1234567" maxLength={7} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Manzil" tip="Xodimning yashash manzili. Ixtiyoriy." />
                    <Textarea value={editForm.address ?? ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Yashash manzili" rows={2} className="text-sm resize-none" />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel label="Favqulodda aloqa" tip="Favqulodda holatlarda bog'lanish uchun aloqa raqami." />
                    <Input value={editForm.emergency_contact ?? ""} onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })} placeholder="+998 90 000 00 00" className="h-9 text-sm" />
                  </div>
                </section>
              </div>

              {/* Footer */}
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

      {/* Part 2: Balance Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Balans Tranzaksiyasi</DialogTitle>
            <DialogDescription>
              Xodim balansini o&apos;zgartirish va kassa bilan integratsiya
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBalanceSubmit}>
            <div className="space-y-6 py-4">
              {/* Current Balance Info */}
              {staff && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Joriy balans</p>
                      <p className={`font-bold text-2xl ${staff.balance < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(staff.balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Oylik maosh</p>
                      <p className="font-semibold text-lg text-gray-800">
                        {formatCurrency(staff.monthly_salary || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Type */}
              <div className="space-y-3">
                <Label htmlFor="transaction_type">
                  Tranzaksiya turi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={balanceForm.transaction_type}
                  onValueChange={(value: any) =>
                    setBalanceForm({ ...balanceForm, transaction_type: value })
                  }
                >
                  <SelectTrigger id="transaction_type">
                    <SelectValue placeholder="Tranzaksiya turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary_accrual">Oylik hisoblash</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                    <SelectItem value="deduction">Balansdan chiqarish</SelectItem>
                    <SelectItem value="advance">Avans berish</SelectItem>
                    <SelectItem value="fine">Jarima</SelectItem>
                    <SelectItem value="adjustment">To&apos;g&apos;rilash</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Contextual Help */}
                {balanceForm.transaction_type && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      {balanceForm.transaction_type === "salary_accrual" && (
                        <><strong>Oylik hisoblash:</strong> Xodim balansiga oylik maosh qo&apos;shiladi. Kassa ta&apos;siri yo&apos;q.</>
                      )}
                      {balanceForm.transaction_type === "bonus" && (
                        <><strong>Bonus:</strong> Xodim balansiga bonus qo&apos;shiladi (yutuq, rag&apos;batlantirish). Kassa ta&apos;siri yo&apos;q.</>
                      )}
                      {balanceForm.transaction_type === "other" && (
                        <><strong>Boshqa qo&apos;shimcha:</strong> Xodim balansiga boshqa turdagi qo&apos;shimcha pul. Kassa ta&apos;siri yo&apos;q.</>
                      )}
                      {balanceForm.transaction_type === "deduction" && (
                        <><strong>Balansdan chiqarish:</strong> Xodim balansidan pul ayiriladi va kassadan to&apos;lov amalga oshiriladi (maosh to&apos;lash).</>
                      )}
                      {balanceForm.transaction_type === "advance" && (
                        <><strong>Avans berish:</strong> Xodim balansidan avans sifatida pul ayiriladi va kassadan chiqim qilinadi.</>
                      )}
                      {balanceForm.transaction_type === "fine" && (
                        <><strong>Jarima:</strong> Xodim balansidan jarima sifatida pul ayiriladi va kassadan chiqim qilinadi.</>
                      )}
                      {balanceForm.transaction_type === "adjustment" && (
                        <><strong>To&apos;g&apos;rilash:</strong> Xodim balansidan to&apos;g&apos;rilash uchun pul ayiriladi va kassadan chiqim qilinadi.</>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={balanceForm.amount || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                    setBalanceForm({ ...balanceForm, amount: value });
                  }}
                  min="1"
                  required
                  placeholder="Masalan: 3500000"
                  className="text-lg font-medium"
                />
                <p className="text-xs text-gray-500">
                  Istalgan musbat butun son kiritishingiz mumkin
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Tavsif <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={balanceForm.description}
                  onChange={(e) => setBalanceForm({ ...balanceForm, description: e.target.value })}
                  rows={3}
                  required
                  placeholder="Tranzaksiya haqida qisqacha ma'lumot kiriting..."
                />
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference">Referens raqami (ixtiyoriy)</Label>
                <Input
                  id="reference"
                  value={balanceForm.reference}
                  onChange={(e) => setBalanceForm({ ...balanceForm, reference: e.target.value })}
                  placeholder="Masalan: SAL-2024-12"
                />
              </div>

              {/* Cash Transaction Section */}
              <div className="border-t pt-4">
                <div className="flex items-start space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="create_cash_transaction"
                    checked={balanceForm.create_cash_transaction}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, create_cash_transaction: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="create_cash_transaction" className="cursor-pointer">
                      Kassadan pul chiqarish
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Belgilansa, tanlangan kassadan avtomatik pul chiqimi amalga oshiriladi
                    </p>
                  </div>
                </div>

                {balanceForm.create_cash_transaction && (
                  <div className="space-y-4 ml-6 pl-4 border-l-2 border-blue-200">
                    {/* Cash Register Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="cash_register_id">
                        Kassa <span className="text-red-500">*</span>
                      </Label>
                      {cashRegisters.length > 0 ? (
                        <Select
                          value={balanceForm.cash_register_id}
                          onValueChange={(value) =>
                            setBalanceForm({ ...balanceForm, cash_register_id: value })
                          }
                        >
                          <SelectTrigger id="cash_register_id">
                            <SelectValue placeholder="Kassani tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {cashRegisters.map((register) => (
                              <SelectItem key={register.id} value={register.id}>
                                {register.name} ({formatCurrency(register.balance)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-red-600">
                          Filialda faol kassa topilmadi. Avval kassa yarating.
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">To&apos;lov usuli</Label>
                      <Select
                        value={balanceForm.payment_method}
                        onValueChange={(value: any) =>
                          setBalanceForm({ ...balanceForm, payment_method: value })
                        }
                      >
                        <SelectTrigger id="payment_method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Naqd pul</SelectItem>
                          <SelectItem value="card">Plastik karta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBalanceDialog(false)}>
                Bekor qilish
              </Button>
              <Button 
                type="submit" 
                disabled={addBalanceMutation.isPending || (balanceForm.create_cash_transaction && cashRegisters.length === 0)}
              >
                {addBalanceMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 3: Salary Accrual Dialog */}
      <Dialog open={salaryAccrualDialog} onOpenChange={setSalaryAccrualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maosh Hisoblash</DialogTitle>
            <DialogDescription>
              Xodim balansiga maosh qo&apos;shish
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalaryAccrualSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accrual_amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accrual_amount"
                  type="number"
                  value={salaryAccrualForm.amount}
                  onChange={(e) =>
                    setSalaryAccrualForm({ ...salaryAccrualForm, amount: parseInt(e.target.value) || 0 })
                  }
                  step="100000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accrual_description">
                  Tavsif <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accrual_description"
                  value={salaryAccrualForm.description}
                  onChange={(e) =>
                    setSalaryAccrualForm({ ...salaryAccrualForm, description: e.target.value })
                  }
                  placeholder="Dekabr oyi maoshi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accrual_reference">Referens raqami</Label>
                <Input
                  id="accrual_reference"
                  value={salaryAccrualForm.reference}
                  onChange={(e) =>
                    setSalaryAccrualForm({ ...salaryAccrualForm, reference: e.target.value })
                  }
                  placeholder="SAL-2024-12"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSalaryAccrualDialog(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={addSalaryAccrualMutation.isPending}>
                {addSalaryAccrualMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Hisoblash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 4: Pay Salary Dialog */}
      <Dialog open={paySalaryDialog} onOpenChange={setPaySalaryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maosh To&apos;lash</DialogTitle>
            <DialogDescription>
              Xodim balansidan maosh to&apos;lovi va kassadan chiqim yozuvi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaySalarySubmit}>
            <div className="space-y-4 py-4">
              {/* Balance Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Joriy balans:</span>
                  <span className={`text-xl font-bold ${staff.balance < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(staff.balance)}
                  </span>
                </div>
                {staff.balance <= 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Balansda mablag&apos; yo&apos;q
                  </p>
                )}
              </div>

              {/* Month Selection */}
              <div className="space-y-2">
                <Label>
                  To&apos;lov oyi <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
					<Select
						value={String(selectedMonth)}
						onValueChange={(value) => {
							setPayAmountTouched(false);
							setSelectedMonth(parseInt(value));
						}}
					>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
											{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
												const isFutureMonth =
													selectedYear === currentYear && month > currentMonth;
												return (
													<SelectItem key={month} value={String(month)} disabled={isFutureMonth}>
														{uzbekMonths[month - 1]}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
					<Select
						value={String(selectedYear)}
						onValueChange={(value) => {
							setPayAmountTouched(false);
							setSelectedYear(parseInt(value));
						}}
					>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
				</div>
			</div>

			{/* Payment Type */}
			<div className="space-y-2">
				<Label htmlFor="pay_type">To&apos;lov turi</Label>
				<Select
					value={paySalaryForm.payment_type}
					onValueChange={(value) =>
						setPaySalaryForm({ ...paySalaryForm, payment_type: value as SalaryPaymentType })
					}
				>
					<SelectTrigger id="pay_type">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(salaryPaymentTypeLabels).map(([key, label]) => (
							<SelectItem key={key} value={key}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

				{/* Amount */}
				<div className="space-y-2">
					<Label htmlFor="pay_amount">
						To&apos;lov miqdori <span className="text-red-500">*</span>
					</Label>
					<CurrencyInput
						id="pay_amount"
						value={paySalaryForm.amount}
						onValueChange={(amount) => {
							setPayAmountTouched(true);
							setPaySalaryForm({ ...paySalaryForm, amount });
						}}
						max={staff.balance > 0 ? staff.balance : 0}
						required
						placeholder="0"
					/>
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>Maksimal: {formatCurrency(staff.balance > 0 ? staff.balance : 0)}</span>
						<span>Tanlandi: {formatCurrency(paySalaryForm.amount)}</span>
					</div>
				</div>

				{/* Cash Register (required for cash-out) */}
				<div className="space-y-2">
					<Label htmlFor="pay_cash_register">
						Kassa <span className="text-red-500">*</span>
					</Label>
					{cashRegisters.length > 0 ? (
						<Select
							value={paySalaryForm.cash_register_id || "none"}
							onValueChange={(value) =>
								setPaySalaryForm({ ...paySalaryForm, cash_register_id: value === "none" ? "" : value })
							}
						>
							<SelectTrigger id="pay_cash_register">
								<SelectValue placeholder="Kassani tanlang" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Tanlanmagan</SelectItem>
								{cashRegisters.map((register: CashRegister) => (
									<SelectItem key={register.id} value={register.id}>
										{register.name} ({formatCurrency(register.balance)})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<p className="text-sm text-red-600">
							Filialda faol kassa topilmadi. Avval kassa yarating.
						</p>
					)}
					{selectedCashRegister && paySalaryForm.amount > selectedCashRegister.balance ? (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
							<p className="font-medium">Kassa balansi yetarli emas</p>
							<p className="mt-0.5">
								Kassada: {formatCurrency(selectedCashRegister.balance)} • Yetishmaydi:{" "}
								{formatCurrency(paySalaryForm.amount - selectedCashRegister.balance)}
							</p>
						</div>
					) : selectedCashRegister ? (
						<p className="text-xs text-muted-foreground">
							Kassadan chiqim: {formatCurrency(paySalaryForm.amount)} • Qoladi:{" "}
							{formatCurrency(selectedCashRegister.balance - paySalaryForm.amount)}
						</p>
					) : null}
				</div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="pay_date">
                  To&apos;lov sanasi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={paySalaryForm.payment_date}
                  onChange={(e) =>
                    setPaySalaryForm({ ...paySalaryForm, payment_date: e.target.value })
                  }
									max={todayIso}
									required
								/>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="pay_method">
                  To&apos;lov usuli <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={paySalaryForm.payment_method}
                  onValueChange={(value) =>
                    setPaySalaryForm({ ...paySalaryForm, payment_method: value as PaymentMethod })
                  }
                >
	                  <SelectTrigger id="pay_method">
	                    <SelectValue />
	                  </SelectTrigger>
	                  <SelectContent>
	                    {Object.entries(paymentMethodLabels).map(([key, label]) => (
	                      <SelectItem key={key} value={key}>
	                        {label}
	                      </SelectItem>
	                    ))}
	                  </SelectContent>
	                </Select>
	              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="pay_reference">Referens raqami</Label>
                <Input
                  id="pay_reference"
                  value={paySalaryForm.reference_number}
                  onChange={(e) =>
                    setPaySalaryForm({ ...paySalaryForm, reference_number: e.target.value })
                  }
                  placeholder="PAY-2024-12-001"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="pay_notes">Izoh</Label>
                <Textarea
                  id="pay_notes"
                  value={paySalaryForm.notes}
                  onChange={(e) => setPaySalaryForm({ ...paySalaryForm, notes: e.target.value })}
                  rows={2}
	                  placeholder="Dekabr oyi to'lovi"
	                />
	              </div>
	            </div>

	            {cashOutError && (
	              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
	                <p className="font-medium">Kassa chiqimi yozilmadi</p>
	                <p className="mt-1">{cashOutError}</p>
	              </div>
	            )}
	
	            <DialogFooter>
	              <Button type="button" variant="outline" onClick={() => setPaySalaryDialog(false)}>
	                Bekor qilish
	              </Button>
	              {pendingCashOut && cashOutError ? (
	                <Button
	                  type="button"
	                  onClick={() =>
	                    pendingCashOut &&
	                    createSalaryCashOutMutation.mutate(pendingCashOut, {
	                      onSuccess: () => {
	                        queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
	                        setPendingCashOut(null);
	                        setPaySalaryDialog(false);
	                        resetPaySalaryForm();
	                        toast.success("Kassa chiqimi yozildi");
	                      },
	                      onError: (error: any) => {
	                        const data = error?.response?.data;
	                        const msg =
	                          data?.error ||
	                          data?.category?.[0] ||
	                          data?.cash_register?.[0] ||
	                          data?.amount?.[0] ||
	                          "Kassadan pul chiqarishda xatolik";
	                        setCashOutError(msg);
	                      },
	                    })
	                  }
	                  disabled={createSalaryCashOutMutation.isPending}
	                >
	                  {createSalaryCashOutMutation.isPending && (
	                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
	                  )}
	                  Kassa chiqimini qayta yozish
	                </Button>
	              ) : (
	                <Button
	                  type="submit"
	                  disabled={
	                    paySalaryNewMutation.isPending ||
	                    createSalaryCashOutMutation.isPending ||
	                    staff.balance <= 0 ||
	                    cashRegisters.length === 0 ||
	                    !paySalaryForm.cash_register_id ||
	                    (!!selectedCashRegister && paySalaryForm.amount > selectedCashRegister.balance)
	                  }
	                >
	                  {paySalaryNewMutation.isPending && (
	                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
	                  )}
	                  To&apos;lash
	                </Button>
	              )}
	            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 5: Monthly Summary Dialog */}
      <Dialog open={monthlySummaryDialog} onOpenChange={setMonthlySummaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oylik Xulosa</DialogTitle>
            <DialogDescription>
              {selectedYear}-{String(selectedMonth).padStart(2, "0")} oy uchun ma&apos;lumotlar
            </DialogDescription>
          </DialogHeader>
          {monthlySummary ? (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Jami hisoblangan:</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(monthlySummary.total_accrued)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">Jami to&apos;langan:</span>
                  <span className="font-semibold text-red-700">
                    {formatCurrency(monthlySummary.total_paid)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Balans o&apos;zgarishi:</span>
                  <span className={`font-semibold ${
                    monthlySummary.balance_change < 0 ? "text-red-700" : "text-blue-700"
                  }`}>
                    {formatCurrency(monthlySummary.balance_change)}
                  </span>
                </div>
              </div>

              <hr />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tranzaksiyalar:</span>
                  <span className="font-medium">{monthlySummary.transactions_count} ta</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To&apos;lovlar:</span>
                  <span className="font-medium">{monthlySummary.payments_count} ta</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Ma&apos;lumotlar yuklanmoqda...
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setMonthlySummaryDialog(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={transactionDetailDialog} onOpenChange={setTransactionDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tranzaksiya Tafsilotlari</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Header with Type Badge and Date */}
              <div className="flex items-center justify-between pb-4 border-b">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {selectedTransaction.transaction_type_display}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeDateTime(selectedTransaction.created_at)}
                </span>
              </div>

              {/* Staff Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Xodim Ma&apos;lumotlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ism</p>
                    <p className="font-medium">{selectedTransaction.staff_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                    <p className="font-medium">{selectedTransaction.staff_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Lavozim</p>
                    <p className="font-medium">{selectedTransaction.staff_role}</p>
                  </div>
                </div>
              </div>

              {/* Amount Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Moliyaviy Ma&apos;lumotlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Miqdor</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Balans o&apos;zgarishi</p>
                    <p
                      className={`font-bold text-lg ${
                        selectedTransaction.balance_change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTransaction.balance_change >= 0 ? "+" : ""}
                      {formatCurrency(selectedTransaction.balance_change)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avvalgi balans</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.previous_balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Yangi balans</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.new_balance)}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Qo&apos;shimcha Ma&apos;lumotlar
                </h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                  {selectedTransaction.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tavsif</p>
                      <p className="font-medium">{selectedTransaction.description}</p>
                    </div>
                  )}
                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referens raqami</p>
                      <p className="font-medium font-mono text-sm">{selectedTransaction.reference}</p>
                    </div>
                  )}
                  {selectedTransaction.salary_payment_id && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Maosh to&apos;lovi ID</p>
                        <p className="font-medium font-mono text-sm">{selectedTransaction.salary_payment_id}</p>
                      </div>
                      {selectedTransaction.salary_payment_month && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Maosh oyi</p>
                          <p className="font-medium">
                            {(() => {
                              const date = new Date(selectedTransaction.salary_payment_month);
                              const year = date.getFullYear();
                              const month = date.getMonth();
                              return `${uzbekMonths[month]} ${year}`;
                            })()}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Processed By */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Qayd Qilgan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ism</p>
                    <p className="font-medium">{selectedTransaction.processed_by_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                    <p className="font-medium">{selectedTransaction.processed_by_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDetailDialog(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
