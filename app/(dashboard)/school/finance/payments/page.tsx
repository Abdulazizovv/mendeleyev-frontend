"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, cn, fmtDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  Banknote,
  Search,
  X,
  Download,
  Loader2,
  Users,
  Calendar,
  RefreshCw,
  BadgePercent,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { ExportModal } from "@/components/finance/ExportModal";
import { PaymentModal } from "@/components/finance/payments/PaymentModal";
import { PaymentDetailSheet } from "@/components/finance/payments/PaymentDetailSheet";
import type { Payment } from "@/types/finance";

const NOW = new Date();
const MONTH_START = new Date(NOW.getFullYear(), NOW.getMonth(), 1)
  .toISOString()
  .split("T")[0];

function getQuickRange(key: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (key === "today") return { from: today, to: today };
  if (key === "week") {
    const mon = new Date(now);
    mon.setDate(now.getDate() - now.getDay() + 1);
    return { from: fmt(mon), to: today };
  }
  if (key === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(first), to: "" };
  }
  return { from: "", to: "" };
}

export default function PaymentsPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(MONTH_START);
  const [dateTo, setDateTo] = useState("");
  const [activeQuick, setActiveQuick] = useState("month");
  const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "card">("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payments", branchId, search, dateFrom, dateTo, methodFilter],
    queryFn: () =>
      financeApi.getPayments({
        branch_id: branchId,
        search: search || undefined,
        payment_date_from: dateFrom || undefined,
        payment_date_to: dateTo || undefined,
        payment_method: methodFilter !== "all" ? methodFilter : undefined,
        ordering: "-payment_date",
      }),
    enabled: !!branchId,
  });

  const { data: statsData } = useQuery({
    queryKey: ["finance-statistics", branchId],
    queryFn: () => financeApi.getStatistics({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const payments = data?.results || [];
  const totalAmount = payments.reduce((s, p) => s + p.final_amount, 0);
  const totalDiscount = payments.reduce((s, p) => s + (p.discount_amount || 0), 0);
  const cashTotal = payments
    .filter((p) => p.payment_method === "cash")
    .reduce((s, p) => s + p.final_amount, 0);
  const cardTotal = payments
    .filter((p) => p.payment_method === "card")
    .reduce((s, p) => s + p.final_amount, 0);
  const cashCount = payments.filter((p) => p.payment_method === "cash").length;
  const cardCount = payments.filter((p) => p.payment_method === "card").length;

  const statRegisters = statsData?.registers ?? [];
  const totalCashAvail = statRegisters.reduce((s: number, r: any) => s + (r.cash_net || 0), 0);
  const totalCardAvail = statRegisters.reduce((s: number, r: any) => s + (r.card_net || 0), 0);

  function applyQuick(key: string) {
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
  }

  const hasFilter = !!(search || dateFrom || dateTo || methodFilter !== "all");

  function clearAll() {
    setSearch("");
    setDateFrom(MONTH_START);
    setDateTo("");
    setActiveQuick("month");
    setMethodFilter("all");
  }

  return (
    <div className="space-y-4 p-4 md:p-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">To&apos;lovlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            O&apos;quvchilar to&apos;lov tarixi
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
            size="sm"
            onClick={() => setPaymentOpen(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="w-3.5 h-3.5" />
            To&apos;lov qabul qilish
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
              <p className="text-xs text-gray-500">Jami</p>
              <p className="text-lg font-bold text-green-600 tabular-nums">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg shrink-0">
              <BadgePercent className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Chegirma</p>
              <p className="text-lg font-bold text-orange-600 tabular-nums">
                {formatCurrency(totalDiscount)}
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
              <p className="text-xs text-gray-500">Soni</p>
              <p className="text-lg font-bold text-blue-600">{payments.length}</p>
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
            <div className="text-right">
              <p className="text-xs text-gray-400">Mavjud</p>
              <p className="text-sm font-bold text-amber-700 tabular-nums">{formatCurrency(totalCashAvail)}</p>
            </div>
          </div>
          <p className="text-base font-semibold text-amber-600 tabular-nums">{formatCurrency(cashTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {cashCount} ta to'lov · {totalAmount > 0 ? Math.round((cashTotal / totalAmount) * 100) : 0}% ulushi
          </p>
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
            <div className="text-right">
              <p className="text-xs text-gray-400">Mavjud</p>
              <p className="text-sm font-bold text-purple-700 tabular-nums">{formatCurrency(totalCardAvail)}</p>
            </div>
          </div>
          <p className="text-base font-semibold text-purple-600 tabular-nums">{formatCurrency(cardTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {cardCount} ta to'lov · {totalAmount > 0 ? Math.round((cardTotal / totalAmount) * 100) : 0}% ulushi
          </p>
        </button>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="O'quvchi qidirish..."
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
                onClick={clearAll}
                className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Filtrlarni tozalash
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── List ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Ro&apos;yxat
            {!isLoading && (
              <span className="text-sm font-normal text-gray-400">
                ({payments.length} ta)
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Yuklanmoqda...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">To&apos;lovlar topilmadi</p>
              {hasFilter && (
                <button
                  onClick={clearAll}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((payment) => {
                const name =
                  payment.student?.full_name || payment.student_name || "—";
                const isCard = payment.payment_method === "card";
                const hasDiscount = payment.discount_amount > 0;

                return (
                  <div
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Method icon */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        isCard ? "bg-purple-100" : "bg-amber-100"
                      )}
                    >
                      {isCard ? (
                        <CreditCard className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Banknote className="w-4 h-4 text-amber-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {[
                          payment.subscription_plan_name,
                          fmtDateTime(payment.created_at),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    {/* Amount + badges */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                      <p className="text-sm font-bold text-green-600 tabular-nums">
                        +{formatCurrency(payment.final_amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        {hasDiscount && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-600 border-0 font-medium">
                            -{formatCurrency(payment.discount_amount)}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 font-medium",
                            isCard
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          )}
                        >
                          {isCard ? "Plastik" : "Naqd"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => refetch()}
      />

      <PaymentDetailSheet
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        exportType="payments"
        defaultFilters={{
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          search: search || undefined,
        }}
      />
    </div>
  );
}
