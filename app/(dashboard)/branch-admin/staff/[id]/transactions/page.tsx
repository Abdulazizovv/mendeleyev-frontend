"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/lib/api";
import type { BalanceTransaction, SalaryPayment, PaginatedResponse } from "@/types/staff";
import { formatCurrency, formatRelativeDateTime, formatRelativeDate, uzbekMonths } from "@/lib/utils";
import { transactionTypeLabels, paymentMethodLabels, salaryPaymentStatusLabels } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Search, X, ArrowDownLeft, ArrowUpRight, TrendingUp,
  CreditCard, Receipt, User,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TX_SIGN_COLOR: Record<string, string> = {
  salary_accrual: "text-emerald-600",
  bonus:          "text-emerald-600",
  other:          "text-emerald-600",
  deduction:      "text-red-600",
  advance:        "text-red-600",
  fine:           "text-red-600",
  adjustment:     "text-blue-600",
};

const TX_BG: Record<string, string> = {
  salary_accrual: "bg-emerald-50",
  bonus:          "bg-emerald-50",
  other:          "bg-blue-50",
  deduction:      "bg-red-50",
  advance:        "bg-orange-50",
  fine:           "bg-red-50",
  adjustment:     "bg-gray-50",
};

const PAY_STATUS_COLOR: Record<string, string> = {
  paid:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  partial:   "bg-blue-50 text-blue-700 border-blue-200",
};

function TxIcon({ type }: { type: string }) {
  const bg = TX_BG[type] ?? "bg-gray-50";
  const isPositive = ["salary_accrual", "bonus", "other"].includes(type);
  return (
    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      {isPositive
        ? <TrendingUp className="w-4 h-4 text-emerald-600" />
        : <ArrowUpRight className="w-4 h-4 text-red-500" />
      }
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

function formatMonthDisplay(monthStr?: string) {
  if (!monthStr) return "—";
  const d = new Date(monthStr);
  return `${uzbekMonths[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [activeTab, setActiveTab] = React.useState("transactions");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTx, setSelectedTx] = React.useState<BalanceTransaction | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<SalaryPayment | null>(null);
  const [filters, setFilters] = React.useState({
    transaction_type: "",
    payment_method: "",
    status: "",
    date_from: "",
    date_to: "",
    ordering: "-created_at",
  });

  const { data: staff } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.getStaffMember(staffId),
  });

  const { data: txData, isLoading: txLoading } = useQuery<PaginatedResponse<BalanceTransaction>>({
    queryKey: ["staff-transactions", staffId, filters, searchTerm],
    queryFn: async () => {
      const res = await staffApi.getTransactions({
        membership: staffId,
        search: searchTerm || undefined,
        ordering: filters.ordering,
        transaction_type: filters.transaction_type || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      });
      return res as any as PaginatedResponse<BalanceTransaction>;
    },
    enabled: activeTab === "transactions",
  });

  const { data: payData, isLoading: payLoading } = useQuery<PaginatedResponse<SalaryPayment>>({
    queryKey: ["staff-payments", staffId, filters, searchTerm],
    queryFn: async () => {
      const res = await staffApi.getPayments({
        membership: staffId,
        search: searchTerm || undefined,
        ordering: filters.ordering,
        payment_method: filters.payment_method || undefined,
        status: filters.status || undefined,
        payment_date_from: filters.date_from || undefined,
        payment_date_to: filters.date_to || undefined,
      });
      return res as any as PaginatedResponse<SalaryPayment>;
    },
    enabled: activeTab === "payments",
  });

  const clearFilters = () => {
    setFilters({ transaction_type: "", payment_method: "", status: "", date_from: "", date_to: "", ordering: "-created_at" });
    setSearchTerm("");
  };

  const hasFilters = !!(filters.transaction_type || filters.payment_method || filters.status || filters.date_from || filters.date_to || searchTerm);

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push(`/branch-admin/staff/${staffId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {staff?.full_name || "Xodim"}
          </button>
          <h1 className="text-xl font-bold text-gray-900">Tranzaksiyalar tarixi</h1>
          {staff && (
            <p className="text-sm text-gray-500 mt-0.5">
              {staff.phone_number} · {staff.role_display}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); clearFilters(); }}>
        <TabsList className="h-9">
          <TabsTrigger value="transactions" className="gap-1.5 text-sm">
            <Receipt className="w-3.5 h-3.5" />
            Tranzaksiyalar
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-sm">
            <CreditCard className="w-3.5 h-3.5" />
            Maosh to&apos;lovlari
          </TabsTrigger>
        </TabsList>

        {/* Filter bar */}
        <Card className="border-gray-200 shadow-none mt-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs text-gray-500 mb-1.5 block">Qidiruv</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder="Tavsif, referens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              {activeTab === "transactions" ? (
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Tranzaksiya turi</Label>
                  <Select value={filters.transaction_type || "all"} onValueChange={(v) => setFilters({ ...filters, transaction_type: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Hammasi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hammasi</SelectItem>
                      {Object.entries(transactionTypeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">To&apos;lov usuli</Label>
                    <Select value={filters.payment_method || "all"} onValueChange={(v) => setFilters({ ...filters, payment_method: v === "all" ? "" : v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Hammasi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hammasi</SelectItem>
                        {Object.entries(paymentMethodLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Holat</Label>
                    <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Hammasi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hammasi</SelectItem>
                        {Object.entries(salaryPaymentStatusLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">Sana oralig&apos;i</Label>
                <div className="flex gap-1.5">
                  <Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="h-9 text-sm flex-1" />
                  <Input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="h-9 text-sm flex-1" />
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <X className="w-3.5 h-3.5" />
                  Filtrlarni tozalash
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Balans tranzaksiyalari</CardTitle>
                {txData && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tabular-nums">
                    {txData.count} ta
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {txLoading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : !txData || txData.results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Tranzaksiya topilmadi</p>
                  {hasFilters && <p className="text-xs text-gray-300 mt-1">Boshqa filtr tanlang</p>}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {txData.results.map((tx) => {
                    const isPositive = tx.balance_change >= 0;
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/80 rounded-xl px-2 -mx-2 transition-colors"
                      >
                        <TxIcon type={tx.transaction_type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{tx.transaction_type_display}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {tx.description ? tx.description : "—"}
                            {" · "}{formatRelativeDateTime(tx.created_at)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                            {isPositive ? "+" : ""}{formatCurrency(tx.balance_change)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                            Balans: {formatCurrency(tx.new_balance)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments tab */}
        <TabsContent value="payments" className="mt-4">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Maosh to&apos;lovlari</CardTitle>
                {payData && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tabular-nums">
                    {payData.count} ta
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {payLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : !payData || payData.results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">To&apos;lovlar topilmadi</p>
                  {hasFilters && <p className="text-xs text-gray-300 mt-1">Boshqa filtr tanlang</p>}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {payData.results.map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay)}
                      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/80 rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">{pay.month_display}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                            PAY_STATUS_COLOR[pay.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                            {pay.status_display}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {pay.payment_method_display}
                          {" · "}{formatRelativeDate(pay.payment_date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(pay.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction detail dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(v) => !v && setSelectedTx(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              {selectedTx && <TxIcon type={selectedTx.transaction_type} />}
              Tranzaksiya tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-0 mt-1">
              {/* Amount highlight */}
              <div className={`rounded-xl px-4 py-3 mb-3 ${selectedTx.balance_change >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Balans o&apos;zgarishi</p>
                <p className={`text-xl font-bold mt-0.5 tabular-nums ${selectedTx.balance_change >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {selectedTx.balance_change >= 0 ? "+" : ""}{formatCurrency(selectedTx.balance_change)}
                </p>
              </div>
              <DetailRow label="Turi" value={selectedTx.transaction_type_display} />
              <DetailRow label="Miqdor" value={formatCurrency(selectedTx.amount)} />
              <DetailRow label="Avvalgi balans" value={formatCurrency(selectedTx.previous_balance)} />
              <DetailRow label="Yangi balans" value={formatCurrency(selectedTx.new_balance)} />
              <DetailRow label="Tavsif" value={selectedTx.description} />
              <DetailRow label="Referens" value={selectedTx.reference} />
              <DetailRow label="Sana" value={formatRelativeDateTime(selectedTx.created_at)} />
              <DetailRow label="Qayd qilgan" value={selectedTx.processed_by_name} />
              {selectedTx.salary_payment_month && (
                <DetailRow label="Maosh oyi" value={formatMonthDisplay(selectedTx.salary_payment_month)} />
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" className="w-full" onClick={() => setSelectedTx(null)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment detail dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(v) => !v && setSelectedPayment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              Maosh to&apos;lovi tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-0 mt-1">
              <div className="bg-emerald-50 rounded-xl px-4 py-3 mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">To&apos;langan</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5 tabular-nums">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <DetailRow label="Oy" value={formatMonthDisplay(selectedPayment.month)} />
              <DetailRow label="Oylik maosh" value={formatCurrency(selectedPayment.staff_monthly_salary)} />
              <DetailRow label="To'lov turi" value={(selectedPayment as any).payment_type_display} />
              <DetailRow label="To'lov usuli" value={selectedPayment.payment_method_display} />
              <DetailRow label="Holat" value={selectedPayment.status_display} />
              <DetailRow label="To'lov sanasi" value={formatRelativeDate(selectedPayment.payment_date)} />
              <DetailRow label="Referens" value={selectedPayment.reference_number} />
              <DetailRow label="Izoh" value={selectedPayment.notes} />
              <DetailRow label="Qayd qilgan" value={selectedPayment.processed_by_name} />
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" className="w-full" onClick={() => setSelectedPayment(null)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
