"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, fmtDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { TransactionModal } from "@/components/finance/transactions/TransactionModal";
import { TransactionDetailSheet } from "@/components/finance/transactions/TransactionDetailSheet";
import { ExportModal } from "@/components/finance/ExportModal";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types/finance";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("income");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
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
    queryKey: ["transactions", branchId, search, typeFilter, registerFilter, dateFrom, dateTo],
    queryFn: () =>
      financeApi.getTransactions({
        branch_id: branchId,
        search: search || undefined,
        transaction_type: typeFilter !== "all" ? typeFilter : undefined,
        cash_register: registerFilter !== "all" ? registerFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        ordering: "-created_at",
      } as any),
    enabled: !!branchId,
  });

  const transactions = data?.results || [];

  const summary = transactions.reduce(
    (acc, t) => {
      if (t.status !== "completed") return acc;
      if (isIncomeLike(t.transaction_type)) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

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
    setRegisterFilter("all");
    setDateFrom(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0]);
    setDateTo("");
    setActiveQuick("month");
  };

  const hasFilter = !!(search || typeFilter !== "all" || registerFilter !== "all");

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg shrink-0">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Kirim</p>
              <p className="text-lg font-bold text-green-600">
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
              <p className="text-lg font-bold text-red-600">
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
                  "text-lg font-bold",
                  summary.income - summary.expense >= 0
                    ? "text-blue-600"
                    : "text-orange-600"
                )}
              >
                {formatCurrency(summary.income - summary.expense)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Transaction list */}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="w-8 h-8"
          >
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
                const income = isIncomeLike(tx.transaction_type);
                const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.completed;
                const showStatus = tx.status !== "completed";

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        income ? "bg-green-100" : "bg-red-100"
                      )}
                    >
                      {income ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {tx.category_name || TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                        </span>
                        {showStatus && (
                          <Badge
                            variant="outline"
                            className={cn("text-xs px-1.5 py-0 shrink-0", statusCfg.cls)}
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

                    <p
                      className={cn(
                        "text-sm font-bold shrink-0",
                        income ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {income ? "+" : "−"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
