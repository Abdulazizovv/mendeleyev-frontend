"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  Search,
  Calendar,
  CreditCard,
  User,
  Users,
  Wallet,
  Receipt,
  CheckCircle,
  AlertCircle,
  X,
  Percent,
  TrendingUp,
  Loader2,
} from "lucide-react";
import type { CreatePaymentRequest, PeriodType, PaymentMethod } from "@/types/finance";
import type { Student } from "@/types/school";

export default function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  // Form state
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [discountId, setDiscountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [periodStart, setPeriodStart] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isAmountEdited, setIsAmountEdited] = useState(false);

  // Refs for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Get student ID from URL params
  useEffect(() => {
    const studentId = searchParams.get('student');
    if (studentId) {
      setSelectedStudentId(studentId);
    }
  }, [searchParams]);

  // Fetch students with infinite scroll (ordered by balance ascending)
  const {
    data: studentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: studentsLoading,
  } = useInfiniteQuery({
    queryKey: ["students-infinite", branchId, studentSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await schoolApi.getStudents(branchId!, {
        search: studentSearch || undefined,
        page: pageParam,
        page_size: 20,
        ordering: "balance__balance", // Ascending order (smallest balance first)
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      const page = url.searchParams.get('page');
      return page ? parseInt(page) : undefined;
    },
    initialPageParam: 1,
    enabled: !!branchId,
  });

  // Flatten all pages into single array
  const allStudents = studentsData?.pages.flatMap(page => page.results) || [];

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch selected student details
  const { data: selectedStudent, isLoading: studentLoading } = useQuery({
    queryKey: ["student", selectedStudentId],
    queryFn: () => schoolApi.getStudent(branchId!, selectedStudentId),
    enabled: !!branchId && !!selectedStudentId,
  });

  // Fetch subscription plans
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn: () =>
      financeApi.getSubscriptionPlans({
        branch_id: branchId,
      }),
    enabled: !!branchId,
  });

  const plans = plansData?.results || [];

  // Fetch cash registers
  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () =>
      financeApi.getCashRegisters({
        branch_id: branchId,
      }),
    enabled: !!branchId,
  });

  const cashRegisters = cashRegistersData?.results || [];

  // Fetch discounts
  const { data: discountsData } = useQuery({
    queryKey: ["discounts", branchId],
    queryFn: () =>
      financeApi.getDiscounts({
        branch_id: branchId,
      }),
    enabled: !!branchId,
  });

  const discounts = discountsData?.results || [];

  // Auto-select first cash register
  useEffect(() => {
    if (cashRegisters.length > 0 && !cashRegisterId) {
      setCashRegisterId(cashRegisters[0].id);
    }
  }, [cashRegisters, cashRegisterId]);

  // Calculate period end based on period type
  useEffect(() => {
    if (!periodStart) return;

    const startDate = new Date(periodStart);
    let endDate = new Date(startDate);

    switch (period) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "yearly":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate = startDate;
        break;
    }

    endDate.setDate(endDate.getDate() - 1);
    setPeriodEnd(endDate.toISOString().split("T")[0]);
  }, [periodStart, period]);

  // Auto-fill subscription and discount when student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    
    // Only auto-fill if both are empty (to avoid overwriting user selections)
    if (subscriptionPlanId || discountId) return;

    // Get active subscription
    const activeSubscription = selectedStudent.subscriptions?.find(sub => sub.is_active);
    
    if (activeSubscription) {
      // Set subscription plan
      setSubscriptionPlanId(activeSubscription.subscription_plan.id);
      
      // Set discount if exists
      if (activeSubscription.discount) {
        setDiscountId(activeSubscription.discount.id);
      }
    }
  }, [selectedStudent]); // Only depend on selectedStudent to avoid infinite loops

  // Get base amount from subscription plan
  const selectedPlan = plans.find((p) => p.id === subscriptionPlanId);
  const baseAmount = customAmount ?? (selectedPlan?.price || 0);

  // Calculate discount and final amount
  const selectedDiscount = discounts.find((d) => d.id === discountId);
  const discountAmount = selectedDiscount
    ? selectedDiscount.discount_type === "percentage"
      ? (baseAmount * selectedDiscount.amount) / 100
      : selectedDiscount.amount
    : 0;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => financeApi.createPayment(data),
    onSuccess: () => {
      toast.success("To'lov muvaffaqiyatli yaratildi!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["students-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      router.push("/branch-admin/finance/payments");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail || "To'lov yaratishda xatolik yuz berdi"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error("O'quvchini tanlang");
      return;
    }

    if (!subscriptionPlanId) {
      toast.error("Abonement rejasini tanlang");
      return;
    }

    if (!cashRegisterId) {
      toast.error("Kassani tanlang");
      return;
    }

    if (!branchId) {
      toast.error("Filial topilmadi");
      return;
    }

    if (baseAmount <= 0) {
      toast.error("Summa 0 dan katta bo'lishi kerak");
      return;
    }

    const paymentData: CreatePaymentRequest = {
      student_profile: selectedStudentId,
      branch: branchId,
      subscription_plan: subscriptionPlanId,
      base_amount: baseAmount,
      discount: discountId || undefined,
      payment_method: paymentMethod,
      period: period,
      payment_date: paymentDate,
      period_start: periodStart,
      period_end: periodEnd,
      cash_register: cashRegisterId,
      notes: notes || undefined,
    };

    createPaymentMutation.mutate(paymentData);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    // Reset subscription and discount to allow auto-fill
    setSubscriptionPlanId("");
    setDiscountId("");
    setCustomAmount(null);
    setIsAmountEdited(false);
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, ''), 10);
    if (!isNaN(numValue)) {
      setCustomAmount(numValue);
      setIsAmountEdited(true);
    }
  };

  const resetToDefaultAmount = () => {
    setCustomAmount(null);
    setIsAmountEdited(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance/payments")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              To&apos;lov Qabul Qilish
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Yangi to&apos;lov yaratish va qabul qilish
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Student List */}
            <div className="space-y-6">
              {/* Students List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    O&apos;quvchilar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Qidirish..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Students List with Infinite Scroll */}
                  <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
                    {studentsLoading && allStudents.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Yuklanmoqda...</p>
                      </div>
                    ) : allStudents.length > 0 ? (
                      <>
                        {allStudents.map((student) => (
                          <div
                            key={student.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                              selectedStudentId === student.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                            }`}
                            onClick={() => handleStudentSelect(student.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={student.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                                  {student.first_name[0]}{student.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                  {student.first_name} {student.last_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-600 truncate">
                                    {student.personal_number}
                                  </span>
                                  {student.current_class && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {student.current_class.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Infinite Scroll Trigger */}
                        <div ref={observerTarget} className="p-4 text-center">
                          {isFetchingNextPage ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm text-gray-600">Yuklanmoqda...</span>
                            </div>
                          ) : hasNextPage ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchNextPage()}
                            >
                              Ko&apos;proq yuklash
                            </Button>
                          ) : allStudents.length > 0 ? (
                            <p className="text-xs text-gray-500">Barchasi yuklandi</p>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">O&apos;quvchi topilmadi</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Selected Student & Payment Details */}
            <div className="space-y-6">
              {selectedStudentId ? (
                <>
                  {/* Selected Student Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Tanlangan O&apos;quvchi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentLoading ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                        </div>
                      ) : selectedStudent ? (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={selectedStudent.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {selectedStudent.full_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-600">
                                    {selectedStudent.personal_number}
                                  </span>
                                  {selectedStudent.current_class && (
                                    <Badge variant="outline" className="text-xs">
                                      {selectedStudent.current_class.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedStudentId("");
                                setSubscriptionPlanId("");
                                setDiscountId("");
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Financial Info */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                                <Wallet className="w-3 h-3" />
                                Balans
                              </div>
                              <p className={`text-base font-bold ${
                                (selectedStudent.balance?.balance || 0) >= 0 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {(selectedStudent.balance?.balance || 0) >= 0 ? '+' : ''}
                                {formatCurrency(selectedStudent.balance?.balance || 0)}
                              </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                                <TrendingUp className="w-3 h-3" />
                                To&apos;lovlar
                              </div>
                              <p className="text-base font-bold text-blue-600">
                                {formatCurrency(
                                  selectedStudent.balance?.transactions_summary?.total_income || 0
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Recent Transactions */}
                          {selectedStudent.recent_transactions && 
                           selectedStudent.recent_transactions.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Receipt className="w-3 h-3" />
                                So&apos;nggi tranzaksiyalar
                              </p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedStudent.recent_transactions.slice(0, 3).map((tx) => (
                                  <div key={tx.id} className="bg-gray-50 rounded p-2 text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-gray-600 truncate">
                                        {tx.transaction_type_display}
                                      </span>
                                      <span className={`font-semibold ${
                                        tx.transaction_type === 'payment' || tx.transaction_type === 'income'
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }`}>
                                        {tx.transaction_type === 'payment' || tx.transaction_type === 'income' ? '+' : '-'}
                                        {formatCurrency(tx.amount)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {new Date(tx.transaction_date).toLocaleDateString('uz-UZ', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  {/* Payment Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        To&apos;lov Ma&apos;lumotlari
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="subscription-plan">
                            Abonement <span className="text-red-500">*</span>
                          </Label>
                          <Select value={subscriptionPlanId} onValueChange={(value) => {
                            setSubscriptionPlanId(value);
                            resetToDefaultAmount();
                          }}>
                            <SelectTrigger id="subscription-plan">
                              <SelectValue placeholder="Tanlang..." />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} - {formatCurrency(plan.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedStudent?.subscriptions?.find(s => s.is_active) && (
                            <p className="text-xs text-gray-500">
                              ✓ Aktiv abonementdan avtomatik to&apos;ldirildi
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discount">
                            Chegirma
                          </Label>
                          <Select 
                            value={discountId || "none"} 
                            onValueChange={(value) => setDiscountId(value === "none" ? "" : value)}
                          >
                            <SelectTrigger id="discount">
                              <SelectValue placeholder="Chegirma yo'q" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Chegirma yo&apos;q</SelectItem>
                              {discounts.map((disc) => (
                                <SelectItem key={disc.id} value={disc.id}>
                                  <div className="flex items-center gap-2">
                                    <Percent className="w-3 h-3" />
                                    {disc.name} - {disc.discount_display}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">
                            Summa <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="amount"
                              type="text"
                              value={baseAmount.toLocaleString('uz-UZ')}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className="pr-20"
                            />
                            {isAmountEdited && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={resetToDefaultAmount}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-xs h-7"
                              >
                                Qaytarish
                              </Button>
                            )}
                          </div>
                          {selectedPlan && !isAmountEdited && (
                            <p className="text-xs text-gray-500">
                              Default: {formatCurrency(selectedPlan.price)}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="period">
                            Davr <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={period}
                            onValueChange={(value) => setPeriod(value as PeriodType)}
                          >
                            <SelectTrigger id="period">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Oylik</SelectItem>
                              <SelectItem value="quarterly">Choraklik</SelectItem>
                              <SelectItem value="yearly">Yillik</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment-method">
                            To&apos;lov usuli <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                          >
                            <SelectTrigger id="payment-method">
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

                        <div className="space-y-2">
                          <Label htmlFor="cash-register">
                            Kassa <span className="text-red-500">*</span>
                          </Label>
                          <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
                            <SelectTrigger id="cash-register">
                              <SelectValue placeholder="Tanlang..." />
                            </SelectTrigger>
                            <SelectContent>
                              {cashRegisters.map((register) => (
                                <SelectItem key={register.id} value={register.id}>
                                  {register.name} ({formatCurrency(register.balance)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="payment-date">
                              To&apos;lov sanasi <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="payment-date"
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="period-start">
                              Davr boshlanishi <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="period-start"
                              type="date"
                              value={periodStart}
                              onChange={(e) => setPeriodStart(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="period-end">
                            Davr tugashi
                          </Label>
                          <Input
                            id="period-end"
                            type="date"
                            value={periodEnd}
                            readOnly
                            className="bg-gray-50"
                          />
                          <p className="text-xs text-gray-500">
                            Avtomatik hisoblanadi
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Eslatmalar</Label>
                          <Input
                            id="notes"
                            placeholder="Ixtiyoriy..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      O&apos;quvchini tanlang
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Chap tarafdan o&apos;quvchini tanlang yoki qidiring ma'lumotlar shu joyda ko&apos;rinadi
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <Card className="sticky top-6 border-2 border-blue-200">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    To&apos;lov Xulosasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Asosiy summa:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(baseAmount)}
                      </span>
                    </div>

                    {selectedDiscount && discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm p-2 bg-orange-50 rounded">
                        <span className="text-orange-700 font-medium flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Chegirma ({selectedDiscount.discount_display}):
                        </span>
                        <span className="font-bold text-orange-600">
                          -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="border-t-2 border-blue-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">
                          Jami to&apos;lov:
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(finalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={
                      !selectedStudentId ||
                      !subscriptionPlanId ||
                      !cashRegisterId ||
                      baseAmount <= 0 ||
                      createPaymentMutation.isPending
                    }
                  >
                    {createPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        To&apos;lovni Saqlash
                      </>
                    )}
                  </Button>

                  {selectedStudentId && subscriptionPlanId && cashRegisterId && (
                    <div className="pt-4 border-t space-y-2 text-xs text-gray-600">
                      <p className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-600" />
                        Tranzaksiya avtomatik yaratiladi
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-600" />
                        O&apos;quvchi balansi yangilanadi
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-600" />
                        Kassa balansi o&apos;zgaradi
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
