"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CreditCard,
  Loader2,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn, formatCurrency, fmtDateTime } from "@/lib/utils";
import type { StudentBalance, Payment } from "@/types/finance";

interface Props {
  balance: StudentBalance | null;
  onClose: () => void;
  onPaymentClick?: (payment: Payment) => void;
  onAddPayment?: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  bank_transfer: "Bank",
  mobile_payment: "Mobil",
  other: "Boshqa",
};

const TX_TYPE_LABEL: Record<string, string> = {
  income: "Kirim",
  expense: "Chiqim",
  payment: "To'lov",
  salary: "Maosh",
  transfer: "O'tkazma",
  refund: "Qaytarish",
};

function isIncomeLike(type: string) {
  return type === "income" || type === "payment";
}

type Tab = "payments" | "transactions";

export function BalanceDetailSheet({
  balance,
  onClose,
  onPaymentClick,
  onAddPayment,
}: Props) {
  const [tab, setTab] = useState<Tab>("payments");

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["balance-detail-payments", balance?.student_profile],
    queryFn: () =>
      financeApi.getPayments({
        student_profile: balance!.student_profile,
        ordering: "-payment_date",
      }),
    enabled: !!balance?.student_profile,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["balance-detail-transactions", balance?.student_profile],
    queryFn: () =>
      financeApi.getTransactions({
        student_profile: balance!.student_profile,
        ordering: "-transaction_date",
      }),
    enabled: !!balance?.student_profile,
  });

  if (!balance) return null;

  const payments = paymentsData?.results?.slice(0, 15) ?? [];
  const transactions = txData?.results?.slice(0, 15) ?? [];
  const pos = balance.balance > 0;
  const neg = balance.balance < 0;

  return (
    <Sheet
      open={!!balance}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Colored header */}
        <div
          className={cn(
            "px-5 pt-6 pb-5 shrink-0",
            pos ? "bg-green-600" : neg ? "bg-red-600" : "bg-gray-500"
          )}
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white/70 text-sm font-medium">
              O&apos;quvchi balansi
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-white/30 shrink-0">
              <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                {getInitials(balance.student_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight truncate">
                {balance.student_name}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {balance.student_personal_number}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl px-4 py-3">
            <p className="text-white/60 text-xs mb-1">Joriy balans</p>
            <p className="text-white font-bold text-3xl">
              {pos && "+"}
              {formatCurrency(balance.balance)}
            </p>
          </div>
        </div>

        {/* Action */}
        {onAddPayment && (
          <div className="px-5 py-3 border-b border-gray-100 shrink-0">
            <Button
              onClick={onAddPayment}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4" />
              To&apos;lov qabul qilish
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setTab("payments")}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === "payments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            To&apos;lovlar
            {payments.length > 0 && (
              <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">
                {payments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("transactions")}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === "transactions"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            Tranzaksiyalar
            {transactions.length > 0 && (
              <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">
                {transactions.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Payments tab */}
          {tab === "payments" && (
            <>
              {paymentsLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Yuklanmoqda...</span>
                </div>
              ) : payments.length === 0 ? (
                <div className="py-12 text-center">
                  <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">To&apos;lovlar yo&apos;q</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => onPaymentClick?.(p)}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 transition-colors",
                        onPaymentClick
                          ? "hover:bg-gray-50 cursor-pointer"
                          : "cursor-default"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.subscription_plan_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {[
                            METHOD_LABEL[p.payment_method],
                            fmtDateTime(p.created_at),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600 shrink-0">
                        +{formatCurrency(p.final_amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Transactions tab */}
          {tab === "transactions" && (
            <>
              {txLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Yuklanmoqda...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Tranzaksiyalar yo&apos;q</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const income = isIncomeLike(tx.transaction_type);
                    return (
                      <li
                        key={tx.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            income ? "bg-green-100" : "bg-red-100"
                          )}
                        >
                          {income ? (
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {tx.category_name ||
                              TX_TYPE_LABEL[tx.transaction_type] ||
                              tx.transaction_type}
                          </p>
                          <p className="text-xs text-gray-400">
                            {fmtDateTime(tx.created_at)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold shrink-0",
                            income ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {income ? "+" : "−"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
