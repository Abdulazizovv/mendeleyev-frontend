"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { CreateTransactionRequest, PaymentMethod } from "@/types/finance";

type TxType = "income" | "expense";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: TxType;
}

const TODAY = new Date().toISOString().split("T")[0];

function parseAmount(val: string): number {
  return parseInt(val.replace(/\D/g, ""), 10) || 0;
}

function displayAmount(val: string): string {
  const n = parseAmount(val);
  return n ? n.toLocaleString("ru-RU") : "";
}

export function TransactionModal({
  open,
  onClose,
  onSuccess,
  defaultType = "income",
}: TransactionModalProps) {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [txType, setTxType] = useState<TxType>(defaultType);
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [txDate, setTxDate] = useState(TODAY);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTxType(defaultType);
    setAmountRaw("");
    setCategoryId("");
    setDescription("");
    setTxDate(TODAY);
    setPaymentMethod("cash");
  }, [open, defaultType]);

  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId && open,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-modal", txType],
    queryFn: () => financeApi.getCategories({ type: txType, is_active: true }),
    enabled: open,
  });

  const cashRegisters = cashRegistersData?.results || [];
  const categories = categoriesData?.results || [];

  useEffect(() => {
    if (cashRegisters.length > 0 && !cashRegisterId) {
      setCashRegisterId(cashRegisters[0].id);
    }
  }, [cashRegisters, cashRegisterId]);

  useEffect(() => {
    setCategoryId("");
  }, [txType]);

  const mutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      financeApi.createTransaction(data),
    onSuccess: () => {
      toast.success(
        txType === "income"
          ? "Kirim muvaffaqiyatli qo'shildi"
          : "Chiqim muvaffaqiyatli qo'shildi"
      );
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Xatolik yuz berdi"
      );
    },
  });

  const amount = parseAmount(amountRaw);
  const isIncome = txType === "income";
  const canSubmit = !!cashRegisterId && amount > 0 && !mutation.isPending;

  // Tanlangan kassa balansi
  const selectedRegister = cashRegisters.find((r) => r.id === cashRegisterId);
  const currentBalance = selectedRegister ? Number(selectedRegister.balance) : null;
  const balanceAfter =
    currentBalance !== null
      ? isIncome
        ? currentBalance + amount
        : currentBalance - amount
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashRegisterId) return toast.error("Kassani tanlang");
    if (!amount) return toast.error("Summani kiriting");
    mutation.mutate({
      branch: branchId!,
      transaction_type: txType,
      cash_register: cashRegisterId,
      category: categoryId || undefined,
      amount,
      payment_method: paymentMethod,
      transaction_date: txDate,
      description: description || undefined,
    } as CreateTransactionRequest);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm p-0 flex flex-col overflow-hidden"
      >
        {/* Rangli sarlavha */}
        <div
          className={cn(
            "px-5 pt-6 pb-5 shrink-0 transition-colors",
            isIncome ? "bg-green-600" : "bg-red-600"
          )}
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white/70 text-sm font-medium">
              Yangi tranzaksiya
            </SheetTitle>
          </SheetHeader>

          {/* Type toggle */}
          <div className="flex gap-2 mb-4">
            {(["income", "expense"] as TxType[]).map((t) => {
              const active = txType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    active
                      ? "bg-white border-white text-gray-800"
                      : "bg-transparent border-white/40 text-white hover:border-white/70"
                  )}
                >
                  {t === "income" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {t === "income" ? "Kirim" : "Chiqim"}
                </button>
              );
            })}
          </div>

          {/* Summa kiritish */}
          <div className="flex items-baseline gap-2">
            <span className="text-white/50 text-2xl font-bold">
              {isIncome ? "+" : "−"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={displayAmount(amountRaw)}
              onChange={(e) => setAmountRaw(e.target.value.replace(/\D/g, ""))}
              className="bg-transparent text-white placeholder-white/30 text-3xl font-bold outline-none w-full min-w-0"
            />
            <span className="text-white/50 text-sm shrink-0">so&apos;m</span>
          </div>
        </div>

        {/* Kassa balansi preview */}
        {currentBalance !== null && amount > 0 && (
          <div className="mx-5 mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 shrink-0">
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Kassa balansi</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-600">{formatCurrency(currentBalance)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span
                className={cn(
                  balanceAfter !== null && balanceAfter < 0
                    ? "text-red-600"
                    : isIncome
                    ? "text-green-700"
                    : "text-orange-600"
                )}
              >
                {formatCurrency(balanceAfter ?? 0)}
              </span>
            </div>
            {balanceAfter !== null && balanceAfter < 0 && (
              <p className="text-xs text-red-500 mt-1">
                ⚠ Kassada yetarli mablag&apos; yo&apos;q
              </p>
            )}
          </div>
        )}

        {/* Forma */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        >
          {/* Kassa */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">
              Kassa <span className="text-red-500">*</span>
            </Label>
            <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Kassani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {cashRegisters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-1.5">
                      {r.name}
                      <span className="text-xs text-gray-400">
                        ({Number(r.balance).toLocaleString("ru-RU")} so&apos;m)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kategoriya + To'lov usuli */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Kategoriya</Label>
              <Select
                value={categoryId || "none"}
                onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kategoriyasiz</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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

          {/* Sana */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To&apos;lov sanasi</Label>
            <Input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Izoh */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Izoh (ixtiyoriy)</Label>
            <Input
              placeholder="Qo'shimcha ma'lumot..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "w-full h-10 font-semibold mt-2",
              isIncome
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-1.5" />
                {isIncome ? "Kirim qo'shish" : "Chiqim qo'shish"}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
