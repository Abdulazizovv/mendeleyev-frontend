"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { cn, formatCurrency, fmtDate, fmtDateTime } from "@/lib/utils";
import type { Payment } from "@/types/finance";

interface Props {
  payment: Payment | null;
  onClose: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Naqd pul",
  card: "Plastik karta",
};

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Oylik",
  quarterly: "Choraklik",
  yearly: "Yillik",
  one_time: "Bir martalik",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <div className="text-sm font-medium text-gray-900 text-right break-words max-w-[180px]">
        {value}
      </div>
    </div>
  );
}

export function PaymentDetailSheet({ payment, onClose }: Props) {
  if (!payment) return null;

  const name =
    payment.student?.full_name || payment.student_name || "—";
  const hasDiscount = payment.discount_amount > 0;

  return (
    <Sheet
      open={!!payment}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Green header */}
        <div className="bg-green-600 px-5 pt-6 pb-5 shrink-0">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white/70 text-sm font-medium">
              To&apos;lov tafsiloti
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white/60 text-xs truncate">{name}</p>
              <p className="text-white font-bold text-2xl leading-tight">
                +{formatCurrency(payment.final_amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-500 text-white text-xs border-0 font-medium">
              Bajarilgan
            </Badge>
            <span className="text-white/50 text-xs">
              {fmtDate(payment.payment_date)}
            </span>
          </div>
        </div>

        {/* Amount breakdown */}
        {hasDiscount && (
          <div className="mx-5 mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 shrink-0">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
              Summa tafsiloti
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Asosiy</span>
                <span className="font-medium">{formatCurrency(payment.base_amount)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>
                  Chegirma
                  {payment.discount_name ? ` (${payment.discount_name})` : ""}
                </span>
                <span className="font-medium">
                  − {formatCurrency(payment.discount_amount)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-gray-200">
                <span>Jami</span>
                <span>{formatCurrency(payment.final_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Row label="O'quvchi" value={name} />
          <Row label="Abonement" value={payment.subscription_plan_name} />
          <Row
            label="Davr turi"
            value={PERIOD_LABELS[payment.period] || payment.period_display}
          />
          <Row
            label="Davr"
            value={`${fmtDate(payment.period_start)} — ${fmtDate(payment.period_end)}`}
          />
          <Row label="To'lov sanasi" value={fmtDate(payment.payment_date)} />
          <Row
            label="To'lov usuli"
            value={
              METHOD_LABELS[payment.payment_method] ||
              payment.payment_method_display
            }
          />
          {payment.branch_name && (
            <Row label="Filial" value={payment.branch_name} />
          )}
          <Row
            label="Yaratilgan vaqt"
            value={
              <span className="text-gray-500">{fmtDateTime(payment.created_at)}</span>
            }
          />
          {payment.notes && (
            <Row
              label="Izoh"
              value={<span className="text-gray-600">{payment.notes}</span>}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
