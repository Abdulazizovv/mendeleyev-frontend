"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffApi, financeApi } from "@/lib/api";
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
import { extractApiError } from "@/lib/error-messages";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/types/staff";
import {
  TrendingUp,
  Wallet,
  Gift,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

// ── Operation types ──────────────────────────────────────────────────────────

interface TxConfig {
  type: string;
  label: string;
  shortLabel: string;
  desc: string;
  icon: React.ElementType;
  headerBg: string;
  cardActive: string;
  btnClass: string;
  sign: "+" | "-";
  requiresCash: boolean;
}

const TX_TYPES: TxConfig[] = [
  {
    type: "salary_accrual",
    label: "Maosh hisoblash",
    shortLabel: "Hisoblash",
    desc: "Xodim balansiga maosh qo'shish",
    icon: TrendingUp,
    headerBg: "bg-emerald-600",
    cardActive: "border-emerald-400 bg-emerald-50 text-emerald-800",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    sign: "+",
    requiresCash: false,
  },
  {
    type: "deduction",
    label: "Maosh to'lash",
    shortLabel: "To'lash",
    desc: "Balansdan kassaga to'lash",
    icon: Wallet,
    headerBg: "bg-blue-600",
    cardActive: "border-blue-400 bg-blue-50 text-blue-800",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    sign: "-",
    requiresCash: true,
  },
  {
    type: "bonus",
    label: "Bonus",
    shortLabel: "Bonus",
    desc: "Rag'batlantirish bonusi",
    icon: Gift,
    headerBg: "bg-purple-600",
    cardActive: "border-purple-400 bg-purple-50 text-purple-800",
    btnClass: "bg-purple-600 hover:bg-purple-700 text-white",
    sign: "+",
    requiresCash: false,
  },
  {
    type: "advance",
    label: "Avans to'lash",
    shortLabel: "Avans",
    desc: "Oldindan to'lov (avans)",
    icon: Clock,
    headerBg: "bg-amber-600",
    cardActive: "border-amber-400 bg-amber-50 text-amber-800",
    btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
    sign: "-",
    requiresCash: true,
  },
  {
    type: "fine",
    label: "Jarima",
    shortLabel: "Jarima",
    desc: "Balansdan jarima ayirish",
    icon: AlertTriangle,
    headerBg: "bg-red-600",
    cardActive: "border-red-400 bg-red-50 text-red-800",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    sign: "-",
    requiresCash: false,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseAmt(v: string) {
  return parseInt(v.replace(/\D/g, ""), 10) || 0;
}
function displayAmt(v: string) {
  const n = parseAmt(v);
  return n ? n.toLocaleString("ru-RU") : "";
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface StaffTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember;
  branchId: string;
  defaultType?: string;
  onSuccess?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function StaffTransactionSheet({
  open,
  onClose,
  staff,
  branchId,
  defaultType = "salary_accrual",
  onSuccess,
}: StaffTransactionSheetProps) {
  const queryClient = useQueryClient();

  const [txType, setTxType] = useState(defaultType);
  const [amountRaw, setAmountRaw] = useState("");
  const [description, setDescription] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  const cfg = TX_TYPES.find((t) => t.type === txType) ?? TX_TYPES[0];
  const amount = parseAmt(amountRaw);
  const balanceAfter = cfg.sign === "+" ? staff.balance + amount : staff.balance - amount;
  const insufficient = cfg.sign === "-" && amount > 0 && amount > staff.balance;

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setTxType(defaultType);
    setAmountRaw("");
    setDescription("");
    setPaymentMethod("cash");
  }, [open, defaultType]);

  // Smart amount autofill
  useEffect(() => {
    if (!open) return;
    if (txType === "salary_accrual") {
      setAmountRaw(staff.monthly_salary > 0 ? String(staff.monthly_salary) : "");
    } else if (txType === "deduction") {
      const suggested = Math.min(Math.max(staff.balance, 0), staff.monthly_salary || 0);
      setAmountRaw(suggested > 0 ? String(suggested) : "");
    } else {
      setAmountRaw("");
    }
  }, [txType, open, staff.monthly_salary, staff.balance]);

  // Cash registers
  const { data: registersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId && open,
  });
  const cashRegisters = registersData?.results ?? [];

  useEffect(() => {
    if (cashRegisters.length > 0 && !cashRegisterId) {
      setCashRegisterId(cashRegisters[0].id);
    }
  }, [cashRegisters, cashRegisterId]);

  // Mutation
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      staffApi.changeBalance(staff.id, payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      if (cfg.requiresCash) {
        queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
      toast.success(`${cfg.label} muvaffaqiyatli amalga oshirildi`);
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => toast.error(extractApiError(err)),
  });

  const canSubmit =
    amount > 0 &&
    !mutation.isPending &&
    !insufficient &&
    (!cfg.requiresCash || !!cashRegisterId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate({
      transaction_type: txType,
      amount,
      description:
        description.trim() ||
        `${cfg.label} — ${new Date().toLocaleDateString("uz-UZ")}`,
      create_cash_transaction: cfg.requiresCash,
      ...(cfg.requiresCash && {
        cash_register_id: cashRegisterId,
        payment_method: paymentMethod,
      }),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm p-0 flex flex-col overflow-hidden"
      >
        {/* ── Colored header ─────────────────────────────────── */}
        <div
          className={cn(
            "px-5 pt-6 pb-5 shrink-0 transition-colors duration-200",
            cfg.headerBg
          )}
        >
          <SheetHeader className="mb-3">
            <SheetTitle className="text-white/70 text-xs font-medium uppercase tracking-wide">
              Xodim hisob-kitobi
            </SheetTitle>
          </SheetHeader>

          {/* Staff info */}
          <div className="mb-4">
            <p className="text-white font-bold text-lg leading-tight">{staff.full_name}</p>
            <p className="text-white/50 text-sm">{staff.role_display}</p>
          </div>

          {/* Amount input */}
          <div className="flex items-baseline gap-2">
            <span className="text-white/50 text-2xl font-bold">{cfg.sign}</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={displayAmt(amountRaw)}
              onChange={(e) => setAmountRaw(e.target.value.replace(/\D/g, ""))}
              className="bg-transparent text-white placeholder-white/30 text-3xl font-bold outline-none w-full min-w-0"
            />
            <span className="text-white/50 text-sm shrink-0">so&apos;m</span>
          </div>
        </div>

        {/* ── Balance preview ─────────────────────────────────── */}
        {amount > 0 && (
          <div className="mx-5 mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 shrink-0">
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Balans o&apos;zgarishi</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn(staff.balance < 0 ? "text-red-500" : "text-gray-600")}>
                {formatCurrency(staff.balance)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span
                className={cn(
                  insufficient ? "text-red-600" :
                  cfg.sign === "+" ? "text-emerald-700" : "text-gray-700"
                )}
              >
                {formatCurrency(balanceAfter)}
              </span>
            </div>
            {insufficient && (
              <p className="text-xs text-red-500 mt-1">
                ⚠ Balans yetarli emas
              </p>
            )}
          </div>
        )}

        {/* ── Form ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Type selector — 3+2 grid */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Operatsiya turi</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {TX_TYPES.slice(0, 3).map((t) => {
                const Icon = t.icon;
                const active = txType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setTxType(t.type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-center transition-all text-xs font-medium",
                      active
                        ? t.cardActive
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t.shortLabel}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TX_TYPES.slice(3).map((t) => {
                const Icon = t.icon;
                const active = txType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setTxType(t.type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-center transition-all text-xs font-medium",
                      active
                        ? t.cardActive
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Type description hint */}
            <p className="text-xs text-gray-400 text-center pt-0.5">{cfg.desc}</p>
          </div>

          {/* Monthly salary quick-fill */}
          {staff.monthly_salary > 0 && (txType === "salary_accrual" || txType === "deduction") && (
            <button
              type="button"
              onClick={() => setAmountRaw(String(staff.monthly_salary))}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-400 text-xs">Oylik maosh:</span>
              <span className="font-semibold text-gray-700 tabular-nums">
                {formatCurrency(staff.monthly_salary)}
              </span>
            </button>
          )}

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Izoh (ixtiyoriy)</Label>
            <Input
              placeholder={`${cfg.label}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Cash register + payment method (only when required) */}
          {cfg.requiresCash && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-medium text-gray-500">Kassadan chiqim</p>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">
                  Kassa <span className="text-red-500">*</span>
                </Label>
                <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
                  <SelectTrigger className="h-9 text-sm bg-white">
                    <SelectValue placeholder="Kassani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashRegisters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-1.5">
                          {r.name}
                          <span className="text-xs text-gray-400">
                            ({Number(r.balance).toLocaleString("ru-RU")})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To&apos;lov usuli</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "cash" | "card")}
                >
                  <SelectTrigger className="h-9 text-sm bg-white">
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

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn("w-full h-10 font-semibold mt-2", cfg.btnClass)}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-1.5" />
                {cfg.label}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
