"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi, schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import {
  Search,
  X,
  CheckCircle,
  Loader2,
  ArrowRight,
  User,
  Calendar,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { CreatePaymentRequest, PaymentMethod, PeriodType } from "@/types/finance";

const TODAY = new Date().toISOString().split("T")[0];

function parseAmt(val: string): number {
  return parseInt(val.replace(/\D/g, ""), 10) || 0;
}
function displayAmt(n: number): string {
  return n ? n.toLocaleString("ru-RU") : "";
}

/** "2026-06-01" → { start: "2026-06-01", end: "2026-06-30" } */
function monthBounds(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // oxirgi kun
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/** period_start/end ni davr turiga qarab hisoblash */
function periodBounds(
  yearMonth: string,
  period: PeriodType
): { start: string; end: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  let end: Date;
  if (period === "quarterly") end = new Date(y, m + 2, 0);
  else if (period === "semester") end = new Date(y, m + 5, 0);
  else if (period === "yearly") end = new Date(y + 1, m - 1, 0);
  else end = new Date(y, m, 0); // monthly default
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/** "2026-06-01" → "Iyun 2026" */
const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];
function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${UZ_MONTHS[m - 1]} ${y}`;
}

/** Hozirgi oydan boshlab N ta oy ro'yxati */
function buildMonthOptions(fromDate: string, count = 6): string[] {
  const [y, m] = fromDate.split("-").map(Number);
  const options: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(y, m - 1 + i, 1);
    options.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return options;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({ open, onClose, onSuccess }: Props) {
  const { currentBranch, user } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const receivedByName =
    user
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.phone_number
      : "";

  const [step, setStep] = useState<"student" | "form">("student");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountId, setDiscountId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(TODAY.slice(0, 7)); // "YYYY-MM"
  const [amountRaw, setAmountRaw] = useState("");
  const [isAmountEdited, setIsAmountEdited] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("student");
    setSearch("");
    setSelectedStudentId("");
    setSubscriptionPlanId("");
    setAmountRaw("");
    setIsAmountEdited(false);
    setDiscountId("");
    setSelectedMonth(TODAY.slice(0, 7));
    setNotes("");
  }, [open]);

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students-payment-modal", branchId, search],
    queryFn: () =>
      schoolApi.getStudents(branchId!, {
        search: search || undefined,
        page: 1,
        page_size: 25,
      }),
    enabled: !!branchId && open && step === "student",
    staleTime: 30_000,
  });
  const students = studentsData?.results ?? [];

  const { data: selectedStudent } = useQuery({
    queryKey: ["student-payment-modal", selectedStudentId],
    queryFn: () => schoolApi.getStudent(branchId!, selectedStudentId),
    enabled: !!branchId && !!selectedStudentId,
  });

  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId }),
    enabled: !!branchId && open,
  });
  const plans = plansData?.results ?? [];

  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId && open,
  });
  const cashRegisters = cashRegistersData?.results ?? [];

  const { data: discountsData } = useQuery({
    queryKey: ["discounts", branchId],
    queryFn: () => financeApi.getDiscounts({ branch_id: branchId }),
    enabled: !!branchId && open,
  });
  const discounts = discountsData?.results ?? [];

  useEffect(() => {
    if (cashRegisters.length > 0 && !cashRegisterId) {
      setCashRegisterId(cashRegisters[0].id);
    }
  }, [cashRegisters, cashRegisterId]);

  // O'quvchi tanlanganda aktiv abonementdan avtomatik to'ldirish
  const lastFilledRef = useRef("");
  useEffect(() => {
    if (!selectedStudent) return;
    if (lastFilledRef.current === selectedStudent.id) return;
    lastFilledRef.current = selectedStudent.id;
    const active = (selectedStudent.subscriptions as any[])?.find((s) => s.is_active);
    if (active) {
      setSubscriptionPlanId(String(active.subscription_plan.id));
      setDiscountId(active.discount ? String(active.discount.id) : "");
      // Keyingi to'lov oyi — default qilib qo'yish
      if (active.next_payment_date) {
        setSelectedMonth(active.next_payment_date.slice(0, 7));
      }
    } else {
      setSubscriptionPlanId("");
      setDiscountId("");
      setSelectedMonth(TODAY.slice(0, 7));
    }
  }, [selectedStudent]);

  const selectedPlan = plans.find((p) => p.id === subscriptionPlanId);
  const planPrice = selectedPlan?.price ?? 0;
  const period: PeriodType = (selectedPlan?.period as PeriodType) ?? "monthly";
  const baseAmount = isAmountEdited ? parseAmt(amountRaw) : planPrice;

  useEffect(() => {
    if (!isAmountEdited && planPrice > 0) {
      setAmountRaw(String(planPrice));
    }
  }, [subscriptionPlanId, isAmountEdited, planPrice]);

  const selectedDiscount = discounts.find((d) => d.id === discountId);
  const discountAmount = selectedDiscount
    ? selectedDiscount.discount_type === "percentage"
      ? Math.round((baseAmount * selectedDiscount.amount) / 100)
      : selectedDiscount.amount
    : 0;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  const bal = (selectedStudent as any)?.balance?.balance ?? 0;
  const balanceAfter = bal + finalAmount;

  // Aktiv abonementning next_payment_date si yoki bugundan oy opsiyalari
  const activeSubscription = (selectedStudent?.subscriptions as any[])?.find((s) => s.is_active);
  const fromDate = activeSubscription?.next_payment_date
    ? activeSubscription.next_payment_date.slice(0, 7)
    : TODAY.slice(0, 7);
  const monthOptions = buildMonthOptions(fromDate, 6);

  const { start: periodStart, end: periodEnd } = periodBounds(selectedMonth, period);

  const mutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => financeApi.createPayment(data),
    onSuccess: () => {
      toast.success("To'lov muvaffaqiyatli saqlandi");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student-balances"] });
      queryClient.invalidateQueries({ queryKey: ["student-payment-modal"] });
      queryClient.invalidateQueries({ queryKey: ["finance-statistics"] });
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(extractApiError(error));
    },
  });

  const handleSelectStudent = (id: string) => {
    lastFilledRef.current = "";
    setSelectedStudentId(id);
    setSubscriptionPlanId("");
    setDiscountId("");
    setAmountRaw("");
    setIsAmountEdited(false);
    setStep("form");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error("O'quvchini tanlang");
    if (!subscriptionPlanId) return toast.error("Abonement rejasini tanlang");
    if (!cashRegisterId) return toast.error("Kassani tanlang");
    if (!branchId) return toast.error("Filial topilmadi");
    if (finalAmount <= 0) return toast.error("Summa 0 dan katta bo'lishi kerak");

    mutation.mutate({
      student_profile: selectedStudentId,
      branch: branchId,
      subscription_plan: subscriptionPlanId,
      base_amount: baseAmount,
      discount: discountId || undefined,
      payment_method: paymentMethod,
      period,
      payment_date: TODAY,
      period_start: periodStart,
      period_end: periodEnd,
      cash_register: cashRegisterId,
      notes: notes || undefined,
    });
  };

  const canSubmit =
    !!selectedStudentId &&
    !!subscriptionPlanId &&
    !!cashRegisterId &&
    finalAmount > 0 &&
    !mutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-600 px-5 pt-6 pb-5 shrink-0">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-white/70 text-sm font-medium">
              To&apos;lov qabul qilish
            </SheetTitle>
          </SheetHeader>

          {step === "form" && selectedStudent ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-11 h-11 border-2 border-white/30 shrink-0">
                <AvatarImage src={(selectedStudent as any).avatar_url || undefined} />
                <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                  {(selectedStudent as any).first_name?.[0]}
                  {(selectedStudent as any).last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base leading-tight truncate">
                  {(selectedStudent as any).full_name}
                </p>
                <p className="text-white/60 text-xs mt-0.5">
                  {(selectedStudent as any).personal_number}
                  {(selectedStudent as any).current_class &&
                    ` · ${(selectedStudent as any).current_class.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("student");
                  setSelectedStudentId("");
                  lastFilledRef.current = "";
                }}
                className="text-white/50 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-white font-bold text-xl">O&apos;quvchini tanlang</p>
          )}
        </div>

        {/* Step 1: O'quvchi qidirish */}
        {step === "student" && (
          <div className="flex-1 flex flex-col overflow-hidden px-5 py-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                autoFocus
                placeholder="Ism yoki shaxsiy raqam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg divide-y">
              {studentsLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Yuklanmoqda...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  {search ? "Topilmadi" : "O'quvchilar yo'q"}
                </div>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={s.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{s.personal_number}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: To'lov formasi */}
        {step === "form" && (
          <>
            {/* Balans ko'rinishi */}
            <div className="mx-5 mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 shrink-0">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">O&apos;quvchi balansi</p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn(bal >= 0 ? "text-green-700" : "text-red-600")}>
                  {bal > 0 ? "+" : ""}{formatCurrency(bal)}
                </span>
                {finalAmount > 0 && (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className={cn(balanceAfter >= 0 ? "text-green-700" : "text-orange-600")}>
                      +{formatCurrency(balanceAfter)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
            >
              {/* Abonement */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">
                  Abonement <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={subscriptionPlanId}
                  onValueChange={(v) => {
                    setSubscriptionPlanId(v);
                    if (!isAmountEdited) setAmountRaw("");
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} — {formatCurrency(plan.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qaysi oyga to'lov */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Qaysi oyga to&apos;lov <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((ym) => (
                      <SelectItem key={ym} value={ym}>
                        {formatYearMonth(ym)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400">
                  Davr: {periodStart} — {periodEnd}
                </p>
              </div>

              {/* Summa + Chegirma */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    Summa <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={displayAmt(baseAmount)}
                      onChange={(e) => {
                        setAmountRaw(e.target.value.replace(/\D/g, ""));
                        setIsAmountEdited(true);
                      }}
                      placeholder="0"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      so&apos;m
                    </span>
                  </div>
                  {isAmountEdited && selectedPlan && (
                    <button
                      type="button"
                      onClick={() => { setAmountRaw(""); setIsAmountEdited(false); }}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      ← Standart ({formatCurrency(planPrice)})
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Chegirma</Label>
                  <Select
                    value={discountId || "none"}
                    onValueChange={(v) => setDiscountId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Yo'q" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yo&apos;q</SelectItem>
                      {discounts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.discount_display})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kassa + Usul */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    Kassa <span className="text-red-500">*</span>
                  </Label>
                  <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tanlang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cashRegisters.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">To&apos;lov usuli</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Naqd pul</SelectItem>
                      <SelectItem value="card">Plastik karta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Qabul qiluvchi (avtomatik) + To'lov sanasi */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Qabul qiluvchi
                  </Label>
                  <div className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-700 truncate">
                    {receivedByName || "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">To&apos;lov sanasi</Label>
                  <div className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-700">
                    {TODAY}
                  </div>
                </div>
              </div>

              {/* Izoh */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Izoh (ixtiyoriy)</Label>
                <Input
                  placeholder="Qo'shimcha ma'lumot..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Xulosa */}
              {finalAmount > 0 && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Asosiy summa</span>
                    <span className="font-medium">{formatCurrency(baseAmount)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Chegirma</span>
                      <span className="font-medium">− {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-blue-900 pt-1.5 border-t border-blue-200">
                    <span>Jami to&apos;lov</span>
                    <span>{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
              )}

              {/* Saqlash */}
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-10 font-semibold bg-blue-600 hover:bg-blue-700 mt-2"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    To&apos;lovni saqlash
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
