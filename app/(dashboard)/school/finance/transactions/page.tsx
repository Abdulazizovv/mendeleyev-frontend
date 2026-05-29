"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, fmtDateTime, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Receipt,
  Plus,
  X,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { TransactionModal } from "@/components/finance/transactions/TransactionModal";
import { TransactionDetailSheet } from "@/components/finance/transactions/TransactionDetailSheet";
import { ExportModal } from "@/components/finance/ExportModal";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import type { Transaction, TransactionType, CashRegister } from "@/types/finance";

// ── Transfer Dialog ───────────────────────────────────────────────────────────

function TransferDialog({
  open,
  onClose,
  cashRegisters,
  branchId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  cashRegisters: CashRegister[];
  branchId?: string;
  onSuccess: () => void;
}) {
  const [registerId, setRegisterId] = useState("");
  const [fromMethod, setFromMethod] = useState<"cash" | "card">("cash");
  const [rawAmount, setRawAmount] = useState("");
  const [desc, setDesc] = useState("");

  const toMethod: "cash" | "card" = fromMethod === "cash" ? "card" : "cash";
  const amountNum = parseInt(rawAmount, 10) || 0;

  const { data: methodBal, isFetching: balFetching } = useQuery({
    queryKey: ["register-method-balance", registerId],
    queryFn: () => financeApi.getRegisterMethodBalance(registerId),
    enabled: !!registerId,
    staleTime: 10_000,
  });

  const cashAvail  = methodBal?.cash_net ?? 0;
  const cardAvail  = methodBal?.card_net ?? 0;
  const fromAvail  = fromMethod === "cash" ? cashAvail : cardAvail;
  const toAvail    = toMethod   === "cash" ? cashAvail : cardAvail;
  const fromAfter  = fromAvail - amountNum;
  const toAfter    = toAvail   + amountNum;
  const isInsufficient = amountNum > 0 && fromAfter < 0;
  const canSubmit  = !!registerId && amountNum >= 1 && !isInsufficient;

  const mutation = useMutation({
    mutationFn: financeApi.internalTransfer,
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
      toast.success("Transfer muvaffaqiyatli amalga oshirildi");
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err));
    },
  });

  function resetForm() {
    setRegisterId("");
    setFromMethod("cash");
    setRawAmount("");
    setDesc("");
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRawAmount(e.target.value.replace(/\D/g, ""));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate({
      cash_register: registerId,
      from_method: fromMethod,
      to_method: toMethod,
      amount: amountNum,
      description: desc || undefined,
      branch_id: branchId,
    });
  }

  const showPreview = !!registerId && !balFetching && amountNum > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Ichki transfer</DialogTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                Kassadagi naqd ↔ plastik mablag&apos;ini o&apos;tkazish
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* ① Kassa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Kassa</Label>
            <Select value={registerId} onValueChange={v => { setRegisterId(v); setRawAmount(""); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Kassani tanlang..." />
              </SelectTrigger>
              <SelectContent>
                {cashRegisters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ② Yo'nalish — ikki karta + swap tugma */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Transfer yo&apos;nalishi</Label>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
              {/* Naqd pul kartasi */}
              <button
                type="button"
                onClick={() => setFromMethod("cash")}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150",
                  fromMethod === "cash"
                    ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                    : "border-gray-200 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    fromMethod === "cash" ? "text-amber-700" : "text-gray-500"
                  )}>
                    <Banknote className="w-3.5 h-3.5" />
                    Naqd pul
                  </div>
                  {fromMethod === "cash" && (
                    <span className="text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded-full font-semibold">
                      DAN
                    </span>
                  )}
                  {fromMethod !== "cash" && (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
                      GA
                    </span>
                  )}
                </div>
                {!registerId ? (
                  <p className="text-xs text-gray-400">—</p>
                ) : balFetching ? (
                  <div className="h-5 bg-amber-100 rounded animate-pulse w-20" />
                ) : (
                  <div>
                    <p className={cn(
                      "text-sm font-bold tabular-nums",
                      fromMethod === "cash" ? "text-amber-700" : "text-gray-600"
                    )}>
                      {formatCurrency(cashAvail)}
                    </p>
                    {showPreview && (
                      <p className={cn(
                        "text-xs tabular-nums font-medium mt-0.5",
                        fromMethod === "cash"
                          ? isInsufficient ? "text-red-500" : "text-red-400"
                          : "text-emerald-500"
                      )}>
                        → {formatCurrency(fromMethod === "cash" ? fromAfter : toAfter)}
                      </p>
                    )}
                  </div>
                )}
              </button>

              {/* Swap tugma (markazda) */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setFromMethod(toMethod)}
                  title="Yo'nalishni almashtirish"
                  className="w-8 h-8 rounded-full border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-all group"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              </div>

              {/* Plastik karta kartasi */}
              <button
                type="button"
                onClick={() => setFromMethod("card")}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150",
                  fromMethod === "card"
                    ? "border-purple-400 bg-purple-50 ring-2 ring-purple-200"
                    : "border-gray-200 bg-gray-50 hover:border-purple-200 hover:bg-purple-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    fromMethod === "card" ? "text-purple-700" : "text-gray-500"
                  )}>
                    <CreditCard className="w-3.5 h-3.5" />
                    Plastik
                  </div>
                  {fromMethod === "card" && (
                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                      DAN
                    </span>
                  )}
                  {fromMethod !== "card" && (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
                      GA
                    </span>
                  )}
                </div>
                {!registerId ? (
                  <p className="text-xs text-gray-400">—</p>
                ) : balFetching ? (
                  <div className="h-5 bg-purple-100 rounded animate-pulse w-20" />
                ) : (
                  <div>
                    <p className={cn(
                      "text-sm font-bold tabular-nums",
                      fromMethod === "card" ? "text-purple-700" : "text-gray-600"
                    )}>
                      {formatCurrency(cardAvail)}
                    </p>
                    {showPreview && (
                      <p className={cn(
                        "text-xs tabular-nums font-medium mt-0.5",
                        fromMethod === "card"
                          ? isInsufficient ? "text-red-500" : "text-red-400"
                          : "text-emerald-500"
                      )}>
                        → {formatCurrency(fromMethod === "card" ? fromAfter : toAfter)}
                      </p>
                    )}
                  </div>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              &quot;DAN&quot; belgili kartani bosib yo&apos;nalishni tanlang
            </p>
          </div>

          {/* ③ Summa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Summa</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={rawAmount ? Number(rawAmount).toLocaleString("ru-RU") : ""}
                onChange={handleAmountChange}
                className={cn(
                  "h-11 text-right text-base font-bold pr-14 tabular-nums",
                  isInsufficient ? "border-red-400 focus-visible:ring-red-300" : ""
                )}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                so&apos;m
              </span>
            </div>
            {isInsufficient && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="font-bold">!</span>
                {fromMethod === "cash" ? "Naqd pul" : "Plastik karta"}da yetarli mablag&apos; yo&apos;q.
                Mavjud: <span className="font-bold">{formatCurrency(fromAvail)}</span>
              </div>
            )}
          </div>

          {/* ④ Izoh */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">
              Izoh <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
            </Label>
            <Textarea
              placeholder="Transfer sababi yoki qo'shimcha ma'lumot..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="resize-none h-16 text-sm"
            />
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onClose(); resetForm(); }}
              className="flex-1 sm:flex-none"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || mutation.isPending}
              className="flex-1 sm:flex-none gap-2 bg-blue-600 hover:bg-blue-700 min-w-28"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  O&apos;tkazilmoqda...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Transfer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const TYPE_LABELS: Record<string, string> = {
  income: "Kirim",
  expense: "Chiqim",
  payment: "To'lov",
  salary: "Maosh",
  transfer: "O'tkazma",
  refund: "Qaytarish",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed: { label: "Bajarilgan", cls: "bg-green-100 text-green-800 border-green-200" },
  pending: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  cancelled: { label: "Bekor", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  failed: { label: "Xatolik", cls: "bg-red-100 text-red-800 border-red-200" },
};

function isIncomeLike(type: string) {
  return type === "income" || type === "payment";
}

function getQuickRange(key: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === "today") {
    const t = fmt(now);
    return { from: t, to: t };
  }
  if (key === "week") {
    const mon = new Date(now);
    mon.setDate(now.getDate() - now.getDay() + 1);
    return { from: fmt(mon), to: fmt(now) };
  }
  if (key === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(first), to: "" };
  }
  return { from: "", to: "" };
}

export default function TransactionsPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("income");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [transferOpen, setTransferOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [registerFilter, setRegisterFilter] = useState("all");

  const [dateFrom, setDateFrom] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState("");
  const [activeQuick, setActiveQuick] = useState("month");

  const { data: registersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId,
  });
  const cashRegisters = registersData?.results || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["transactions", branchId, search, typeFilter, methodFilter, registerFilter, dateFrom, dateTo],
    queryFn: () =>
      financeApi.getTransactions({
        branch_id: branchId,
        search: search || undefined,
        transaction_type: typeFilter !== "all" ? typeFilter : undefined,
        payment_method: methodFilter !== "all" ? methodFilter : undefined,
        cash_register: registerFilter !== "all" ? registerFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        ordering: "-created_at",
        page_size: 500,
      }),
    enabled: !!branchId,
  });

  // Statistika: server-side aggregation (to'liq, paginatsiyadan qat'iy nazar)
  const { data: statsData } = useQuery({
    queryKey: ["tx-stats", branchId, dateFrom, dateTo],
    queryFn: () => financeApi.getStatistics({
      branch_id: branchId,
      start_date: dateFrom || undefined,
      end_date: dateTo || undefined,
    }),
    enabled: !!branchId,
  });

  const transactions = data?.results || [];

  // Summary: server-side statistikadan olinadi (to'liq va transfersiz)
  const summary = {
    income:      statsData?.summary?.total_income      ?? 0,
    expense:     statsData?.summary?.total_expense     ?? 0,
    cashIncome:  statsData?.summary?.cash_income       ?? 0,
    cashExpense: statsData?.summary?.cash_expense      ?? 0,
    cardIncome:  statsData?.summary?.card_income       ?? 0,
    cardExpense: statsData?.summary?.card_expense      ?? 0,
  };

  // Mavjud balans: registers dan (all-time, transfer hisoblab)
  const statRegisters = statsData?.registers ?? [];
  const totalCashAvail = statRegisters.reduce((s: number, r: any) => s + (r.cash_net || 0), 0);
  const totalCardAvail = statRegisters.reduce((s: number, r: any) => s + (r.card_net || 0), 0);

  const openModal = (type: "income" | "expense") => {
    setModalType(type);
    setModalOpen(true);
  };

  const applyQuick = (key: string) => {
    if (activeQuick === key) {
      setActiveQuick("");
      setDateFrom("");
      setDateTo("");
      return;
    }
    const r = getQuickRange(key);
    setDateFrom(r.from);
    setDateTo(r.to);
    setActiveQuick(key);
  };

  const clearFilters = () => {
    const n = new Date();
    setSearch("");
    setTypeFilter("all");
    setMethodFilter("all");
    setRegisterFilter("all");
    setDateFrom(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0]);
    setDateTo("");
    setActiveQuick("month");
  };

  const hasFilter = !!(search || typeFilter !== "all" || methodFilter !== "all" || registerFilter !== "all");

  return (
    <div className="space-y-4 p-4 md:p-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tranzaksiyalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Barcha moliyaviy operatsiyalar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransferOpen(true)}
            className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Transfer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("expense")}
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Chiqim
          </Button>
          <Button
            size="sm"
            onClick={() => openModal("income")}
            className="gap-1.5 bg-green-600 hover:bg-green-700"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Kirim
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg shrink-0">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Kirim</p>
              <p className="text-lg font-bold text-green-600 tabular-nums">
                {formatCurrency(summary.income)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Chiqim</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">
                {formatCurrency(summary.expense)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sof</p>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  summary.income - summary.expense >= 0 ? "text-blue-600" : "text-orange-600"
                )}
              >
                {formatCurrency(summary.income - summary.expense)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Naqd / Plastik breakdown ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMethodFilter(methodFilter === "cash" ? "all" : "cash")}
          className={cn(
            "text-left p-3.5 rounded-xl border transition-all",
            methodFilter === "cash"
              ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300"
              : "border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Naqd pul</span>
            </div>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              totalCashAvail >= 0 ? "text-amber-700" : "text-red-600"
            )}>
              {formatCurrency(totalCashAvail)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            <span className="text-gray-400">Kirim</span>
            <span className="font-medium text-emerald-700 tabular-nums text-right">
              +{formatCurrency(summary.cashIncome)}
            </span>
            <span className="text-gray-400">Chiqim</span>
            <span className="font-medium text-red-600 tabular-nums text-right">
              -{formatCurrency(summary.cashExpense)}
            </span>
          </div>
        </button>

        <button
          onClick={() => setMethodFilter(methodFilter === "card" ? "all" : "card")}
          className={cn(
            "text-left p-3.5 rounded-xl border transition-all",
            methodFilter === "card"
              ? "border-purple-400 bg-purple-50 ring-1 ring-purple-300"
              : "border-purple-200 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Plastik karta</span>
            </div>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              totalCardAvail >= 0 ? "text-purple-700" : "text-red-600"
            )}>
              {formatCurrency(totalCardAvail)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            <span className="text-gray-400">Kirim</span>
            <span className="font-medium text-emerald-700 tabular-nums text-right">
              +{formatCurrency(summary.cardIncome)}
            </span>
            <span className="text-gray-400">Chiqim</span>
            <span className="font-medium text-red-600 tabular-nums text-right">
              -{formatCurrency(summary.cardExpense)}
            </span>
          </div>
        </button>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
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

            {/* Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="income">Kirim</SelectItem>
                <SelectItem value="expense">Chiqim</SelectItem>
                <SelectItem value="payment">To&apos;lov</SelectItem>
                <SelectItem value="salary">Maosh</SelectItem>
                <SelectItem value="transfer">O&apos;tkazma</SelectItem>
                <SelectItem value="refund">Qaytarish</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment method */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="To'lov usuli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha usullar</SelectItem>
                <SelectItem value="cash">
                  <span className="flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5 text-amber-600" />
                    Naqd pul
                  </span>
                </SelectItem>
                <SelectItem value="card">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    Plastik karta
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Register */}
            <Select value={registerFilter} onValueChange={setRegisterFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Kassa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kassalar</SelectItem>
                {cashRegisters.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setActiveQuick(""); }}
              className="h-8 w-36 text-sm"
            />
            <span className="text-gray-400 text-sm">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setActiveQuick(""); }}
              className="h-8 w-36 text-sm"
            />
            <div className="flex gap-1 ml-1">
              {[
                { key: "today", label: "Bugun" },
                { key: "week", label: "Hafta" },
                { key: "month", label: "Oy" },
                { key: "all", label: "Barchasi" },
              ].map((q) => (
                <button
                  key={q.key}
                  onClick={() => applyQuick(q.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    activeQuick === q.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Filtrlarni tozalash
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Transaction list ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Ro&apos;yxat
            {!isLoading && (
              <span className="text-sm font-normal text-gray-400">
                ({transactions.length} ta)
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()} className="w-8 h-8">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Yuklanmoqda...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">Tranzaksiyalar topilmadi</p>
              {hasFilter && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Filtrlarni tozalash
                </button>
              )}
              {!hasFilter && (
                <div className="flex gap-2 justify-center mt-3">
                  <Button size="sm" variant="outline" onClick={() => openModal("income")} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Kirim
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openModal("expense")} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Chiqim
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => {
                const isTransfer = tx.transaction_type === "transfer";
                const income = !isTransfer && isIncomeLike(tx.transaction_type);
                const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.completed;
                const showStatus = tx.status !== "completed";
                const isCard = tx.payment_method === "card";

                // Transfer label: yangi format (from_method/to_method) va eski format (transfer_direction)
                const txFromMethod = tx.metadata?.from_method as string | undefined;
                const txToMethod   = tx.metadata?.to_method   as string | undefined;
                const txDir        = tx.metadata?.transfer_direction as string | undefined;
                const transferLabel = isTransfer
                  ? txFromMethod && txToMethod
                    ? `${txFromMethod === "cash" ? "Naqd" : "Plastik"} → ${txToMethod === "cash" ? "Naqd" : "Plastik"}`
                    : txDir === "in" ? "O'tkazma (kirim)" : "O'tkazma (chiqim)"
                  : null;

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Type indicator */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        isTransfer ? "bg-blue-100" : income ? "bg-green-100" : "bg-red-100"
                      )}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                      ) : income ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {isTransfer
                            ? transferLabel
                            : tx.category_name || TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                        </span>
                        {showStatus && (
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 shrink-0", statusCfg.cls)}
                          >
                            {statusCfg.label}
                          </Badge>
                        )}
                      </div>
                      {tx.description && (
                        <p className="text-xs text-gray-600 truncate mt-0.5">{tx.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {tx.cash_register_name} · {fmtDateTime(tx.created_at)}
                      </p>
                    </div>

                    {/* Amount + method badge */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                      <p
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          isTransfer ? "text-blue-600" : income ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {isTransfer ? "⇄ " : income ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 font-medium",
                          isCard
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        )}
                      >
                        <span className="flex items-center gap-0.5">
                          {isCard ? (
                            <CreditCard className="w-2.5 h-2.5" />
                          ) : (
                            <Banknote className="w-2.5 h-2.5" />
                          )}
                          {isCard ? "Plastik" : "Naqd"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Transfer dialog ── */}
      <TransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        cashRegisters={cashRegisters}
        branchId={branchId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["finance-statistics"] });
        }}
      />

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
        defaultType={modalType}
      />

      <TransactionDetailSheet
        tx={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        exportType="transactions"
        defaultFilters={{
          transaction_type: typeFilter !== "all" ? (typeFilter as TransactionType) : undefined,
          cash_register: registerFilter !== "all" ? registerFilter : undefined,
          search: search || undefined,
        }}
      />
    </div>
  );
}
