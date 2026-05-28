"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn, formatCurrency, fmtDate, fmtDateTime } from "@/lib/utils";
import type { Transaction } from "@/types/finance";

interface Props {
  tx: Transaction | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  income: "Kirim",
  expense: "Chiqim",
  payment: "To'lov",
  salary: "Maosh",
  transfer: "O'tkazma",
  refund: "Qaytarish",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Naqd pul",
  card: "Karta",
  bank_transfer: "Bank o'tkazmasi",
  mobile_payment: "Mobil to'lov",
  other: "Boshqa",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed:  { label: "Bajarilgan",     cls: "bg-green-100 text-green-800" },
  pending:    { label: "Kutilmoqda",     cls: "bg-yellow-100 text-yellow-800" },
  cancelled:  { label: "Bekor qilingan", cls: "bg-gray-100 text-gray-600" },
  failed:     { label: "Xatolik",        cls: "bg-red-100 text-red-800" },
};

function isIncomeLike(type: string) {
  return type === "income" || type === "payment";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <div className="text-sm font-medium text-gray-900 text-right">{value}</div>
    </div>
  );
}

export function TransactionDetailSheet({ tx, onClose }: Props) {
  if (!tx) return null;

  const income = isIncomeLike(tx.transaction_type);
  const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.completed;
  const typeLabel = TYPE_LABELS[tx.transaction_type] || tx.transaction_type_display;

  const balanceBefore = tx.metadata?.balance_before;
  const balanceAfter = tx.metadata?.balance_after;
  const hasBalance = balanceBefore !== undefined && balanceAfter !== undefined;

  return (
    <Sheet open={!!tx} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">

        {/* Rangli header */}
        <div className={cn("px-5 pt-6 pb-5", income ? "bg-green-600" : "bg-red-600")}>
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white/70 text-sm font-medium">
              Tranzaksiya tafsiloti
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              {income
                ? <TrendingUp className="w-5 h-5 text-white" />
                : <TrendingDown className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="text-white/60 text-xs">{typeLabel}</p>
              <p className="text-white font-bold text-2xl leading-tight">
                {income ? "+" : "−"}{formatCurrency(tx.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs border-0 font-medium", statusCfg.cls)}>
              {statusCfg.label}
            </Badge>
            <span className="text-white/50 text-xs">{fmtDate(tx.transaction_date)}</span>
          </div>
        </div>

        {/* Kassa balansi o'zgarishi */}
        {hasBalance && (
          <div className="mx-5 mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
              Kassa balansi
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-gray-700">{formatCurrency(balanceBefore)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className={income ? "text-green-700" : "text-red-700"}>
                {formatCurrency(balanceAfter)}
              </span>
              <span className={cn(
                "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
                income ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {income ? "+" : "−"}{formatCurrency(tx.amount)}
              </span>
            </div>
          </div>
        )}

        {/* Ma'lumotlar ro'yxati */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Row label="Turi" value={typeLabel} />
          {tx.category_name && (
            <Row label="Kategoriya" value={tx.category_name} />
          )}
          <Row label="Kassa" value={tx.cash_register_name} />
          <Row
            label="To'lov usuli"
            value={METHOD_LABELS[tx.payment_method] || tx.payment_method_display}
          />
          <Row label="To'lov sanasi" value={fmtDate(tx.transaction_date)} />
          <Row
            label="Yaratilgan vaqt"
            value={<span className="text-gray-500">{fmtDateTime(tx.created_at)}</span>}
          />
          {tx.description && (
            <Row label="Izoh" value={<span className="text-gray-700">{tx.description}</span>} />
          )}
          {tx.reference_number && (
            <Row
              label="Referens"
              value={
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {tx.reference_number}
                </span>
              }
            />
          )}
          {tx.student && (
            <Row label="O'quvchi" value={tx.student.full_name} />
          )}
          {tx.employee && (
            <Row label="Xodim" value={tx.employee.full_name} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
