"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { financeApi, schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/translations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  CreditCard,
  User,
  Wallet,
  CheckCircle,
  X,
  Percent,
  Loader2,
  ChevronRight,
  Package,
  AlertCircle,
  Calendar,
  Banknote,
  Building2,
} from "lucide-react";
import type { CreatePaymentRequest, PeriodType, PaymentMethod } from "@/types/finance";

export default function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  // — State —
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [discountId, setDiscountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().split("T")[0]);
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isAmountEdited, setIsAmountEdited] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  // — URL param bootstrap —
  useEffect(() => {
    const studentId = searchParams.get("student");
    if (studentId) setSelectedStudentId(studentId);

    const amountParam = searchParams.get("amount");
    if (amountParam) {
      const parsed = parseInt(amountParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setCustomAmount(parsed);
        setIsAmountEdited(true);
      }
    }
  }, [searchParams]);

  // — Students infinite list —
  const {
    data: studentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: studentsLoading,
  } = useInfiniteQuery({
    queryKey: ["students-infinite", branchId, studentSearch],
    queryFn: async ({ pageParam = 1 }) =>
      schoolApi.getStudents(branchId!, {
        search: studentSearch || undefined,
        page: pageParam as number,
        page_size: 20,
        ordering: "balance__balance",
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      const page = url.searchParams.get("page");
      return page ? parseInt(page) : undefined;
    },
    initialPageParam: 1,
    enabled: !!branchId,
  });

  const allStudents = studentsData?.pages.flatMap((p) => p.results) ?? [];

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    const el = observerTarget.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // — Selected student details —
  const { data: selectedStudent, isLoading: studentLoading } = useQuery({
    queryKey: ["student", selectedStudentId],
    queryFn: () => schoolApi.getStudent(branchId!, selectedStudentId),
    enabled: !!branchId && !!selectedStudentId,
  });

  // — Reference data —
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId }),
    enabled: !!branchId,
  });
  const plans = plansData?.results ?? [];

  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId,
  });
  const cashRegisters = cashRegistersData?.results ?? [];

  const { data: discountsData } = useQuery({
    queryKey: ["discounts", branchId],
    queryFn: () => financeApi.getDiscounts({ branch_id: branchId }),
    enabled: !!branchId,
  });
  const discounts = discountsData?.results ?? [];

  // Auto-select first cash register
  useEffect(() => {
    if (cashRegisters.length > 0 && !cashRegisterId) setCashRegisterId(cashRegisters[0].id);
  }, [cashRegisters, cashRegisterId]);

  // Auto-fill subscription/discount from student's active subscription
  // Uses a ref to track which student was last auto-filled to avoid re-running on manual changes
  const lastAutoFilledStudentId = useRef<string>("");
  useEffect(() => {
    if (!selectedStudent) return;
    if (lastAutoFilledStudentId.current === selectedStudent.id) return;
    lastAutoFilledStudentId.current = selectedStudent.id;
    const active = (selectedStudent.subscriptions as any[])?.find((s) => s.is_active);
    if (active) {
      setSubscriptionPlanId(String(active.subscription_plan.id));
      setDiscountId(active.discount ? String(active.discount.id) : "");
    } else {
      setSubscriptionPlanId("");
      setDiscountId("");
    }
  }, [selectedStudent]);

  // Auto-calc period end
  useEffect(() => {
    if (!periodStart) return;
    const start = new Date(periodStart);
    const end = new Date(start);
    if (period === "monthly") end.setMonth(end.getMonth() + 1);
    else if (period === "quarterly") end.setMonth(end.getMonth() + 3);
    else if (period === "yearly") end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    setPeriodEnd(end.toISOString().split("T")[0]);
  }, [periodStart, period]);

  // — Derived —
  const selectedPlan = plans.find((p) => p.id === subscriptionPlanId);
  const baseAmount = customAmount ?? (selectedPlan?.price ?? 0);
  const selectedDiscount = discounts.find((d) => d.id === discountId);
  const discountAmount = selectedDiscount
    ? selectedDiscount.discount_type === "percentage"
      ? Math.round((baseAmount * selectedDiscount.amount) / 100)
      : selectedDiscount.amount
    : 0;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  const bal = selectedStudent?.balance?.balance ?? 0;
  const balanceAfter = bal + finalAmount;

  // — Mutation —
  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => financeApi.createPayment(data),
    onSuccess: () => {
      toast.success("To'lov muvaffaqiyatli saqlandi!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["students-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      router.push("/school/finance/payments");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "To'lov yaratishda xatolik yuz berdi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error("O'quvchini tanlang");
    if (!subscriptionPlanId) return toast.error("Abonement rejasini tanlang");
    if (!cashRegisterId) return toast.error("Kassani tanlang");
    if (!branchId) return toast.error("Filial topilmadi");
    if (baseAmount <= 0) return toast.error("Summa 0 dan katta bo'lishi kerak");

    createPaymentMutation.mutate({
      student_profile: selectedStudentId,
      branch: branchId,
      subscription_plan: subscriptionPlanId,
      base_amount: baseAmount,
      discount: discountId || undefined,
      payment_method: paymentMethod,
      period,
      payment_date: paymentDate,
      period_start: periodStart,
      period_end: periodEnd,
      cash_register: cashRegisterId,
      notes: notes || undefined,
    });
  };

  const handleSelectStudent = (id: string) => {
    // Reset auto-fill tracker so the new student's subscription gets applied
    lastAutoFilledStudentId.current = "";
    setSelectedStudentId(id);
    setSubscriptionPlanId("");
    setDiscountId("");
    if (!isAmountEdited) setCustomAmount(null);
  };

  const canSubmit =
    !!selectedStudentId &&
    !!subscriptionPlanId &&
    !!cashRegisterId &&
    baseAmount > 0 &&
    !createPaymentMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => router.push("/school/finance/payments")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">To&apos;lov Qabul Qilish</h1>
          <p className="text-sm text-gray-500">Yangi to&apos;lov yaratish</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Left: Student selector ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Selected student card */}
            {selectedStudentId ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  {studentLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3.5 bg-gray-200 rounded w-32 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                      </div>
                    </div>
                  ) : selectedStudent ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-white shadow">
                            <AvatarImage src={selectedStudent.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                              {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">
                              {selectedStudent.full_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {selectedStudent.personal_number}
                              {selectedStudent.current_class && ` · ${selectedStudent.current_class.name}`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            lastAutoFilledStudentId.current = "";
                            setSelectedStudentId("");
                            setSubscriptionPlanId("");
                            setDiscountId("");
                            setCustomAmount(null);
                            setIsAmountEdited(false);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Balance */}
                      <div className={`rounded-lg px-3 py-2 text-center ${bal >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                        <p className="text-xs text-gray-500 mb-0.5">Joriy balans</p>
                        <p className={`text-base font-bold ${bal >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {bal > 0 && "+"}{formatCurrency(bal)}
                        </p>
                      </div>

                      {/* Active subscription badge */}
                      {selectedStudent.subscriptions?.find((s: any) => s.is_active) && (
                        <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Aktiv abonement: <strong>
                              {selectedStudent.subscriptions.find((s: any) => s.is_active)?.subscription_plan?.name}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-gray-300">
                <CardContent className="p-4 text-center">
                  <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">O&apos;quvchi tanlanmagan</p>
                  <p className="text-xs text-gray-400 mt-1">Quyidan tanlang</p>
                </CardContent>
              </Card>
            )}

            {/* Student search & list — always visible */}
            <Card className="border-gray-200">
              <CardContent className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="O'quvchi qidirish..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                  {studentsLoading && allStudents.length === 0 ? (
                    <div className="p-6 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Yuklanmoqda...</p>
                    </div>
                  ) : allStudents.length > 0 ? (
                    <>
                      {allStudents.map((student) => {
                        const isSelected = selectedStudentId === student.id;
                        return (
                          <button
                            key={student.id}
                            type="button"
                            className={`w-full flex items-center gap-2.5 p-2.5 text-left transition-colors ${
                              isSelected
                                ? "bg-blue-50 border-l-2 border-l-blue-500"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => handleSelectStudent(student.id)}
                          >
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarImage src={student.avatar_url || undefined} />
                              <AvatarFallback className={`text-white text-xs font-semibold ${isSelected ? "bg-blue-600" : "bg-gray-400"}`}>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{student.personal_number}</p>
                            </div>
                            {isSelected && <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />}
                          </button>
                        );
                      })}
                      <div ref={observerTarget} className="p-2 text-center">
                        {isFetchingNextPage && (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Topilmadi</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Payment form + summary ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Payment form */}
            <Card className="border-gray-200">
              <CardContent className="p-5 space-y-4">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  To&apos;lov ma&apos;lumotlari
                </p>

                {/* Subscription plan */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">
                    Abonement <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={subscriptionPlanId}
                    onValueChange={(v) => {
                      setSubscriptionPlanId(v);
                      if (!isAmountEdited) setCustomAmount(null);
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tanlang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <span className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-purple-500" />
                            {plan.name} — {formatCurrency(plan.price)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudent?.subscriptions?.find((s: any) => s.is_active) && subscriptionPlanId && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Aktiv abonementdan avtomatik to&apos;ldirildi
                    </p>
                  )}
                </div>

                {/* Amount + Discount — 2 col */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">
                      Summa <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={baseAmount > 0 ? baseAmount.toLocaleString("ru-RU") : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          const n = parseInt(raw, 10);
                          setCustomAmount(isNaN(n) ? 0 : n);
                          setIsAmountEdited(true);
                        }}
                        placeholder="0"
                        className="h-9 text-sm pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">so&apos;m</span>
                    </div>
                    {isAmountEdited && selectedPlan && (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => { setCustomAmount(null); setIsAmountEdited(false); }}
                      >
                        Standartga qaytarish ({formatCurrency(selectedPlan.price)})
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Chegirma</Label>
                    <Select
                      value={discountId || "none"}
                      onValueChange={(v) => setDiscountId(v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Yo'q" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Chegirma yo&apos;q</SelectItem>
                        {discounts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            <span className="flex items-center gap-1.5">
                              <Percent className="w-3 h-3 text-orange-500" />
                              {d.name} ({d.discount_display})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment method + Period — 2 col */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Banknote className="w-3 h-3" /> To&apos;lov usuli <span className="text-red-500">*</span>
                    </Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Naqd pul</SelectItem>
                        <SelectItem value="card">Karta</SelectItem>
                        <SelectItem value="bank_transfer">Bank o&apos;tkazmasi</SelectItem>
                        <SelectItem value="mobile_payment">Mobil to&apos;lov</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Davr</Label>
                    <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Oylik</SelectItem>
                        <SelectItem value="quarterly">Choraklik</SelectItem>
                        <SelectItem value="yearly">Yillik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cash register */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Kassa <span className="text-red-500">*</span>
                  </Label>
                  <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Kassani tanlang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cashRegisters.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({formatCurrency(r.balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates — 2 col */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> To&apos;lov sanasi
                    </Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Davr boshlanishi</Label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Izoh (ixtiyoriy)</Label>
                  <Input
                    placeholder="..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary card */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold text-blue-900">To&apos;lov xulosasi</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Asosiy summa</span>
                    <span className="font-medium text-gray-900">{formatCurrency(baseAmount)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        Chegirma
                      </span>
                      <span className="font-medium">− {formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-base pt-2 border-t border-blue-200">
                    <span className="text-blue-900">Jami to&apos;lov</span>
                    <span className="text-blue-700">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>

                {/* Balance preview */}
                {selectedStudent && (
                  <div className="bg-white rounded-xl p-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Wallet className="w-4 h-4" />
                      To&apos;lovdan keyin balans
                    </div>
                    <span className={`font-bold ${balanceAfter >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {balanceAfter > 0 && "+"}{formatCurrency(balanceAfter)}
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-semibold"
                  disabled={!canSubmit}
                >
                  {createPaymentMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saqlanmoqda...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5 mr-2" />To&apos;lovni Saqlash</>
                  )}
                </Button>

                {!selectedStudentId && (
                  <p className="text-xs text-center text-gray-400">Avval o&apos;quvchini tanlang</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
