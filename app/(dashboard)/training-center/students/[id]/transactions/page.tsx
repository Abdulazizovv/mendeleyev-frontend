"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/translations";
import type { Transaction, Payment, PaginatedResponse, TransactionQueryParams, PaymentQueryParams } from "@/types/finance";
import { TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS } from "@/types/finance";
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
  ArrowLeft, Search, X, ArrowDownLeft, ArrowUpRight, RotateCcw,
  CreditCard, Receipt, Filter, User,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Naqd pul",
  card: "Plastik karta",
  transfer: "Bank o'tkazmasi",
  online: "Online",
};

const TX_TYPE_COLOR: Record<string, string> = {
  income:   "bg-emerald-50 text-emerald-700",
  payment:  "bg-blue-50 text-blue-700",
  refund:   "bg-amber-50 text-amber-700",
  expense:  "bg-red-50 text-red-700",
  transfer: "bg-gray-100 text-gray-700",
  salary:   "bg-purple-50 text-purple-700",
};

const TX_STATUS_COLOR: Record<string, string> = {
  completed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
  failed:     "bg-red-50 text-red-700 border-red-200",
};

function TxIcon({ type }: { type: string }) {
  if (type === "income" || type === "payment")
    return <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><ArrowDownLeft className="w-4 h-4 text-emerald-600" /></div>;
  if (type === "refund")
    return <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><RotateCcw className="w-4 h-4 text-amber-600" /></div>;
  return <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0"><ArrowUpRight className="w-4 h-4 text-red-500" /></div>;
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const studentId = params.id as string;

  const [activeTab, setActiveTab] = React.useState("transactions");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [filters, setFilters] = React.useState({
    transaction_type: "",
    payment_method: "",
    date_from: "",
    date_to: "",
    ordering: "-created_at",
  });

  const { data: student } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => schoolApi.getStudent(branchId!, studentId),
    enabled: !!branchId,
  });

  const { data: txData, isLoading: txLoading } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["student-transactions", studentId, filters, searchTerm],
    queryFn: () => financeApi.getTransactions({
      student_profile: studentId,
      search: searchTerm || undefined,
      transaction_type: filters.transaction_type || undefined,
      payment_method: filters.payment_method || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      ordering: filters.ordering,
    } as TransactionQueryParams),
    enabled: activeTab === "transactions",
  });

  const { data: payData, isLoading: payLoading } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ["student-payments", studentId, filters, searchTerm],
    queryFn: () => financeApi.getPayments({
      student_profile: studentId,
      search: searchTerm || undefined,
      payment_method: filters.payment_method || undefined,
      payment_date_from: filters.date_from || undefined,
      payment_date_to: filters.date_to || undefined,
    } as PaymentQueryParams),
    enabled: activeTab === "payments",
  });

  const clearFilters = () => {
    setFilters({ transaction_type: "", payment_method: "", date_from: "", date_to: "", ordering: "-created_at" });
    setSearchTerm("");
  };

  const hasFilters = !!(filters.transaction_type || filters.payment_method || filters.date_from || filters.date_to || searchTerm);

  const fullName = student
    ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ")
    : "";

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => router.push(`/training-center/students/${studentId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {fullName || "O'quvchi"}
          </button>
          <h1 className="text-xl font-bold text-gray-900">Tranzaksiyalar</h1>
          {student && (
            <p className="text-sm text-gray-500 mt-0.5">
              {student.phone_number}
              {student.current_class && ` · ${student.current_class.name}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 h-9 bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push(`/training-center/finance/payments/create?student=${studentId}`)}>
            <CreditCard className="w-3.5 h-3.5" />
            To&apos;lov
          </Button>
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
            To&apos;lovlar
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
                  <Label className="text-xs text-gray-500 mb-1.5 block">Turi</Label>
                  <Select value={filters.transaction_type || "all"} onValueChange={(v) => setFilters({ ...filters, transaction_type: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Hammasi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hammasi</SelectItem>
                      {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">To&apos;lov usuli</Label>
                  <Select value={filters.payment_method || "all"} onValueChange={(v) => setFilters({ ...filters, payment_method: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Hammasi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hammasi</SelectItem>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Kassa tranzaksiyalari
                </CardTitle>
                {txData && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tabular-nums">
                    {txData.count} ta
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {txLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : !txData || txData.results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Tranzaksiya topilmadi</p>
                  {hasFilters && <p className="text-xs text-gray-300 mt-1">Boshqa filtr tanlang yoki tozalang</p>}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {txData.results.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/80 rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <TxIcon type={tx.transaction_type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TX_TYPE_COLOR[tx.transaction_type] ?? "bg-gray-100 text-gray-600"}`}>
                            {tx.transaction_type_display}
                          </span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TX_STATUS_COLOR[tx.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                            {tx.status_display}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {tx.description || tx.category_name || tx.cash_register_name}
                          {" · "}{tx.payment_method_display}
                          {" · "}{formatDate(tx.created_at)}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${
                        tx.transaction_type === "income" || tx.transaction_type === "payment" || tx.transaction_type === "refund"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}>
                        {tx.transaction_type === "income" || tx.transaction_type === "payment" || tx.transaction_type === "refund" ? "+" : "−"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
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
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Abonement to&apos;lovlari
                </CardTitle>
                {payData && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tabular-nums">
                    {payData.count} ta
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {payLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : !payData || payData.results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">To&apos;lov topilmadi</p>
                  {hasFilters && <p className="text-xs text-gray-300 mt-1">Boshqa filtr tanlang yoki tozalang</p>}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {payData.results.map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay)}
                      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/80 rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{pay.subscription_plan_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {pay.payment_method_display}
                          {" · "}{formatDate(pay.payment_date)}
                          {pay.period_display && ` · ${pay.period_display}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">+{formatCurrency(pay.final_amount)}</p>
                        {pay.discount_amount > 0 && (
                          <p className="text-[11px] text-amber-600 mt-0.5">
                            -{formatCurrency(pay.discount_amount)} chegirma
                          </p>
                        )}
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
              <TxIcon type={selectedTx?.transaction_type ?? ""} />
              Tranzaksiya tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-0 mt-1">
              <DetailRow label="Turi" value={selectedTx.transaction_type_display} />
              <DetailRow label="Holati" value={selectedTx.status_display} />
              <DetailRow label="Miqdor" value={formatCurrency(selectedTx.amount)} />
              <DetailRow label="To'lov usuli" value={selectedTx.payment_method_display} />
              <DetailRow label="Kassa" value={selectedTx.cash_register_name} />
              <DetailRow label="Kategoriya" value={selectedTx.category_name} />
              <DetailRow label="Tavsif" value={selectedTx.description} />
              <DetailRow label="Referens" value={selectedTx.reference_number} />
              <DetailRow label="Sana" value={formatDateTime(selectedTx.created_at)} />
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
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              To&apos;lov tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-0 mt-1">
              <DetailRow label="Abonement" value={selectedPayment.subscription_plan_name} />
              <DetailRow label="Asosiy narx" value={formatCurrency(selectedPayment.base_amount)} />
              {selectedPayment.discount_amount > 0 && (
                <DetailRow label="Chegirma" value={`-${formatCurrency(selectedPayment.discount_amount)}`} />
              )}
              <DetailRow label="To'langan" value={formatCurrency(selectedPayment.final_amount)} />
              <DetailRow label="To'lov usuli" value={selectedPayment.payment_method_display} />
              <DetailRow label="Davr" value={selectedPayment.period_display} />
              <DetailRow label="To'lov sanasi" value={formatDate(selectedPayment.payment_date)} />
              {selectedPayment.period_start && selectedPayment.period_end && (
                <DetailRow label="Muddat" value={`${formatDate(selectedPayment.period_start)} — ${formatDate(selectedPayment.period_end)}`} />
              )}
              <DetailRow label="Qabul qilgan" value={selectedPayment.received_by_name ?? undefined} />
              <DetailRow label="Izoh" value={selectedPayment.notes} />
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
