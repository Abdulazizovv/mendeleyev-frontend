"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import type { CashRegister, CreateCashRegisterRequest, Transaction } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Edit, Wallet, MapPin, Banknote, CreditCard, RefreshCw,
  MoreHorizontal, Star, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  Building2, SlidersHorizontal, ChevronLeft, ChevronRight,
  Archive, ArchiveRestore, Eye, EyeOff, X,
  ExternalLink, Calendar, UserCircle, AlertTriangle,
  GraduationCap, Users, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import UnifiedTransactionModal from "@/components/finance/UnifiedTransactionModal";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type FlowType = "income" | "expense" | "transfer";
type TxTypeFilter = "all" | "income" | "expense" | "transfer";
type MethodFilter = "all" | "cash" | "card" | "bank";
type ClientFilter = "all" | "student" | "employee" | "third_party";
type StatusFilter = "all" | "completed" | "pending" | "cancelled";

const PAGE_SIZE = 25;
const SUMMARY_PAGE_SIZE = 500;

const UZ_MONTHS_SHORT = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];

const TX_COLORS: Record<string, { text: string; bg: string; arrow: string }> = {
  income:   { text: "text-emerald-600", bg: "bg-emerald-50", arrow: "↓" },
  payment:  { text: "text-emerald-600", bg: "bg-emerald-50", arrow: "↓" },
  expense:  { text: "text-rose-600",    bg: "bg-rose-50",    arrow: "↑" },
  salary:   { text: "text-rose-600",    bg: "bg-rose-50",    arrow: "↑" },
  transfer: { text: "text-slate-500",   bg: "bg-slate-50",   arrow: "⇄" },
  refund:   { text: "text-amber-600",   bg: "bg-amber-50",   arrow: "↺" },
};
const TX_LABEL: Record<string, string> = {
  income: "Kirim", expense: "Chiqim", transfer: "Transfer",
  payment: "To'lov", salary: "Maosh", refund: "Qaytarish",
};
const STATUS_LABEL: Record<string, string> = {
  completed: "Bajarilgan", pending: "Kutilmoqda", cancelled: "Bekor",
};
const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500", pending: "bg-amber-400",
  cancelled: "bg-slate-400",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }
function weekStartStr() {
  const d = new Date(); const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return mon.toISOString().split("T")[0];
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function primaryKey(branchId: string) { return `finance_primary_${branchId}`; }
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: `${String(d.getDate()).padStart(2, "0")} ${UZ_MONTHS_SHORT[d.getMonth()]}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    full: d.toLocaleString("uz-UZ"),
  };
}
function isIncome(type: string) { return ["income", "payment"].includes(type); }
function isExpense(type: string) { return ["expense", "salary"].includes(type); }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CashRegistersPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id ?? "";

  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [txModal, setTxModal] = useState<FlowType | null>(null);
  const [registerDialog, setRegisterDialog] = useState<"create" | "edit" | null>(null);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [form, setForm] = useState<Omit<CreateCashRegisterRequest, "branch">>({
    name: "", description: "", location: "", is_active: true,
  });
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>(todayStr);
  const [dateTo, setDateTo]     = useState<string>(todayStr);
  const [activePreset, setActivePreset] = useState<"today" | "week" | "month" | null>("today");
  const [txTypeFilter, setTxTypeFilter] = useState<TxTypeFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [serverPage, setServerPage] = useState(1);

  useEffect(() => {
    if (branchId) setPrimaryId(localStorage.getItem(primaryKey(branchId)) ?? "");
  }, [branchId]);

  const { data: registersData, isLoading: registersLoading } = useQuery({
    queryKey: ["cash-registers", branchId, showArchived],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId, ordering: "name", is_active: !showArchived }),
    enabled: !!branchId,
  });
  const registers = registersData?.results ?? [];

  useEffect(() => { setSelectedRegister(null); }, [showArchived]);

  useEffect(() => {
    if (registers.length === 0 || selectedRegister) return;
    const r = registers.find((x) => x.id === primaryId) ?? registers[0];
    setSelectedRegister(r ?? null);
  }, [registers, primaryId]);

  const refreshSelected = useCallback(() => {
    if (!selectedRegister) return;
    financeApi.getCashRegister(selectedRegister.id).then(setSelectedRegister).catch(() => {});
  }, [selectedRegister]);

  const { data: methodBalance } = useQuery({
    queryKey: ["register-method-balance", selectedRegister?.id],
    queryFn: () => financeApi.getRegisterMethodBalance(selectedRegister!.id),
    enabled: !!selectedRegister,
    refetchInterval: 60_000,
  });

  const sharedParams = useMemo(() => ({
    cash_register: selectedRegister?.id,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    transaction_type: txTypeFilter !== "all" ? txTypeFilter : undefined,
    payment_method: methodFilter !== "all" ? methodFilter : undefined,
    client_filter: clientFilter !== "all" ? clientFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    ordering: "-transaction_date",
  }), [selectedRegister?.id, dateFrom, dateTo, txTypeFilter, methodFilter, clientFilter, statusFilter]);

  useEffect(() => { setServerPage(1); }, [dateFrom, dateTo, txTypeFilter, methodFilter, clientFilter, statusFilter, selectedRegister?.id]);

  const { data: summaryData } = useQuery({
    queryKey: ["tx-summary", sharedParams],
    queryFn: () => financeApi.getTransactions({ ...sharedParams, page_size: SUMMARY_PAGE_SIZE }),
    enabled: !!selectedRegister,
  });

  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ["cash-register-transactions", sharedParams, serverPage],
    queryFn: () => financeApi.getTransactions({ ...sharedParams, page: serverPage, page_size: PAGE_SIZE }),
    enabled: !!selectedRegister,
  });

  const visibleTx = txData?.results ?? [];
  const totalCount = txData?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const summaryTx = summaryData?.results ?? [];
  const summaryTotal = summaryData?.count ?? 0;
  const summaryIncome = summaryTx.filter((tx) => isIncome(tx.transaction_type)).reduce((s, tx) => s + tx.amount, 0);
  const summaryExpense = summaryTx.filter((tx) => isExpense(tx.transaction_type)).reduce((s, tx) => s + tx.amount, 0);
  const summaryNet = summaryIncome - summaryExpense;

  function applyPreset(preset: "today" | "week" | "month") {
    const from = preset === "today" ? todayStr() : preset === "week" ? weekStartStr() : monthStartStr();
    setDateFrom(from); setDateTo(todayStr()); setActivePreset(preset);
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: CreateCashRegisterRequest) => financeApi.createCashRegister(d),
    onSuccess: (created) => { queryClient.invalidateQueries({ queryKey: ["cash-registers"] }); toast.success("Kassa yaratildi"); setRegisterDialog(null); setSelectedRegister(created); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCashRegisterRequest> }) => financeApi.updateCashRegister(id, data),
    onSuccess: (updated) => { queryClient.invalidateQueries({ queryKey: ["cash-registers"] }); toast.success("Kassa yangilandi"); setRegisterDialog(null); if (selectedRegister?.id === updated.id) setSelectedRegister(updated); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const archiveMutation = useMutation({
    mutationFn: (id: string) => financeApi.updateCashRegister(id, { is_active: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cash-registers"] }); toast.success("Kassa arxivlandi"); setSelectedRegister(null); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const restoreMutation = useMutation({
    mutationFn: (id: string) => financeApi.updateCashRegister(id, { is_active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cash-registers"] }); toast.success("Kassa tiklandi"); setSelectedRegister(null); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  function markPrimary(id: string) { localStorage.setItem(primaryKey(branchId), id); setPrimaryId(id); toast.success("Asosiy kassa belgilandi"); }
  function openCreate() { setForm({ name: "", description: "", location: "", is_active: true }); setEditingRegister(null); setRegisterDialog("create"); }
  function openEdit(r: CashRegister) { setForm({ name: r.name, description: r.description ?? "", location: r.location ?? "", is_active: r.is_active }); setEditingRegister(r); setRegisterDialog("edit"); }
  function handleArchive(r: CashRegister) { if (!confirm(`"${r.name}" kassasini arxivlashni tasdiqlaysizmi?`)) return; archiveMutation.mutate(r.id); }
  function handleRestore(r: CashRegister) { restoreMutation.mutate(r.id); }
  function handleSave() {
    if (!form.name.trim()) return;
    if (registerDialog === "edit" && editingRegister) updateMutation.mutate({ id: editingRegister.id, data: { ...form, branch: branchId } });
    else createMutation.mutate({ ...form, branch: branchId });
  }
  function onTxSuccess() {
    queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
    queryClient.invalidateQueries({ queryKey: ["cash-register-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["tx-summary"] });
    queryClient.invalidateQueries({ queryKey: ["register-method-balance"] });
    refreshSelected();
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* ── LEFT PANEL ── */}
      <div className="w-[300px] shrink-0 flex flex-col h-full bg-white border-r border-slate-200">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {showArchived ? "Arxiv kassalar" : "Kassalar"}
              </span>
            </div>
            <button
              onClick={() => setHideBalance((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={hideBalance ? "Summani ko'rsatish" : "Summani yashirish"}
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!showArchived && (
            <Button
              className="w-full h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-sm"
              onClick={openCreate}
            >
              <Plus className="w-3.5 h-3.5" />
              Yangi kassa qo'shish
            </Button>
          )}

          {!registersLoading && (
            <p className="text-xs text-slate-400">{registers.length} ta kassa</p>
          )}
        </div>

        {/* Register list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
          {registersLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)
          ) : registers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-xs font-medium text-slate-500 mb-3">
                {showArchived ? "Arxiv kassalar yo'q" : "Kassalar yo'q"}
              </p>
            </div>
          ) : (
            registers.map((r) => (
              <RegisterCard
                key={r.id} register={r}
                selected={selectedRegister?.id === r.id} primary={r.id === primaryId}
                hideBalance={hideBalance}
                onSelect={() => setSelectedRegister(r)}
                onEdit={() => openEdit(r)}
                onArchive={() => handleArchive(r)}
                onRestore={() => handleRestore(r)}
                onMarkPrimary={() => markPrimary(r.id)}
                onIncome={() => { setSelectedRegister(r); setTxModal("income"); }}
                onExpense={() => { setSelectedRegister(r); setTxModal("expense"); }}
              />
            ))
          )}
        </div>

        {/* Archive toggle — bottom */}
        <div className="border-t border-slate-100 p-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors",
              showArchived
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <Archive className="w-3.5 h-3.5 shrink-0" />
            {showArchived ? "Faol kassalarga qaytish" : "Arxiv kassalarni ko'rish"}
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex h-full overflow-hidden">
        {!selectedRegister ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Wallet className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-600 mb-1">Kassani tanlang</p>
              <p className="text-sm text-slate-400">Chap tomondagi kassani bosing</p>
            </div>
          </div>
        ) : (
          <>
            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* ── REGISTER HEADER ── */}
              <div className="bg-white border-b border-slate-200 px-5 py-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-base font-bold text-slate-900">{selectedRegister.name}</h2>
                      {selectedRegister.location && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5 shrink-0">
                          <MapPin className="w-3 h-3" />{selectedRegister.location}
                        </span>
                      )}
                      {!selectedRegister.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium shrink-0">
                          Arxiv
                        </span>
                      )}
                    </div>

                    {/* Balance cards */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Total balance */}
                      {/* Total */}
                      <button
                        onClick={() => setMethodFilter("all")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all",
                          methodFilter === "all"
                            ? "bg-slate-800 border-slate-700 ring-2 ring-slate-400"
                            : "bg-slate-50 border-slate-200 hover:border-slate-400"
                        )}
                      >
                        <Wallet className={cn("w-4 h-4 shrink-0", methodFilter === "all" ? "text-white" : "text-slate-400")} />
                        <div>
                          <p className={cn("text-[10px] leading-none mb-1", methodFilter === "all" ? "text-slate-300" : "text-slate-400")}>Jami balans</p>
                          <p className={cn("text-sm font-bold tabular-nums leading-none", methodFilter === "all" ? "text-white" : "text-slate-900")}>
                            {hideBalance ? "••••••" : formatCurrency(selectedRegister.balance)}
                          </p>
                        </div>
                      </button>
                      {/* Cash */}
                      <button
                        onClick={() => setMethodFilter(methodFilter === "cash" ? "all" : "cash")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all",
                          methodFilter === "cash"
                            ? "bg-amber-500 border-amber-400 ring-2 ring-amber-300"
                            : "bg-amber-50 border-amber-200 hover:border-amber-400"
                        )}
                      >
                        <Banknote className={cn("w-4 h-4 shrink-0", methodFilter === "cash" ? "text-white" : "text-amber-500")} />
                        <div>
                          <p className={cn("text-[10px] leading-none mb-1", methodFilter === "cash" ? "text-amber-100" : "text-amber-600")}>Naqd</p>
                          <p className={cn("text-sm font-bold tabular-nums leading-none", methodFilter === "cash" ? "text-white" : "text-amber-800")}>
                            {hideBalance ? "••••••" : formatCurrency(methodBalance?.cash_net ?? 0)}
                          </p>
                        </div>
                      </button>
                      {/* Card */}
                      <button
                        onClick={() => setMethodFilter(methodFilter === "card" ? "all" : "card")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all",
                          methodFilter === "card"
                            ? "bg-blue-600 border-blue-500 ring-2 ring-blue-300"
                            : "bg-blue-50 border-blue-200 hover:border-blue-400"
                        )}
                      >
                        <CreditCard className={cn("w-4 h-4 shrink-0", methodFilter === "card" ? "text-white" : "text-blue-500")} />
                        <div>
                          <p className={cn("text-[10px] leading-none mb-1", methodFilter === "card" ? "text-blue-100" : "text-blue-600")}>Plastik</p>
                          <p className={cn("text-sm font-bold tabular-nums leading-none", methodFilter === "card" ? "text-white" : "text-blue-800")}>
                            {hideBalance ? "••••••" : formatCurrency(methodBalance?.card_net ?? 0)}
                          </p>
                        </div>
                      </button>
                      {/* Bank */}
                      <button
                        onClick={() => setMethodFilter(methodFilter === "bank" ? "all" : "bank")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all",
                          methodFilter === "bank"
                            ? "bg-emerald-600 border-emerald-500 ring-2 ring-emerald-300"
                            : "bg-emerald-50 border-emerald-200 hover:border-emerald-400"
                        )}
                      >
                        <Building2 className={cn("w-4 h-4 shrink-0", methodFilter === "bank" ? "text-white" : "text-emerald-600")} />
                        <div>
                          <p className={cn("text-[10px] leading-none mb-1", methodFilter === "bank" ? "text-emerald-100" : "text-emerald-700")}>Bank</p>
                          <p className={cn("text-sm font-bold tabular-nums leading-none", methodFilter === "bank" ? "text-white" : "text-emerald-800")}>
                            {hideBalance ? "••••••" : formatCurrency(methodBalance?.bank_net ?? 0)}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {selectedRegister.is_active && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button onClick={() => setTxModal("income")} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9">
                        <ArrowUpRight className="w-3.5 h-3.5" />Kirim
                      </Button>
                      <Button onClick={() => setTxModal("expense")} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-9">
                        <ArrowDownRight className="w-3.5 h-3.5" />Chiqim
                      </Button>
                      <Button onClick={() => setTxModal("transfer")} size="sm" variant="outline" className="border-slate-200 gap-1.5 h-9 text-slate-600">
                        <ArrowRightLeft className="w-3.5 h-3.5" />Transfer
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── FILTER BAR ── */}
              <FilterBar
                dateFrom={dateFrom} dateTo={dateTo} activePreset={activePreset}
                txTypeFilter={txTypeFilter} methodFilter={methodFilter}
                clientFilter={clientFilter} statusFilter={statusFilter} totalCount={totalCount}
                onDateFrom={(v) => { setDateFrom(v); setActivePreset(null); }}
                onDateTo={(v) => { setDateTo(v); setActivePreset(null); }}
                onPreset={applyPreset}
                onTxType={setTxTypeFilter}
                onMethod={setMethodFilter}
                onClient={setClientFilter}
                onStatus={setStatusFilter}
                onRefresh={() => { refetchTx(); queryClient.invalidateQueries({ queryKey: ["tx-summary"] }); }}
              />

              {/* ── SUMMARY BAR ── */}
              <div className="flex items-center gap-4 px-5 py-2 bg-white border-b border-slate-100 shrink-0">
                <span className="text-xs text-slate-400 font-medium tabular-nums">{totalCount} ta tranzaksiya</span>
                <div className="flex-1" />
                {summaryTx.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Kirim{summaryTotal > SUMMARY_PAGE_SIZE ? " ≈" : ""}:</span>
                      <span className="text-sm font-bold tabular-nums text-emerald-600">+{formatCurrency(summaryIncome)}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Chiqim{summaryTotal > SUMMARY_PAGE_SIZE ? " ≈" : ""}:</span>
                      <span className="text-sm font-bold tabular-nums text-rose-600">−{formatCurrency(summaryExpense)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ── TABLE ── */}
              <div className="flex-1 overflow-auto">
                {txLoading ? (
                  <div className="p-5 space-y-2">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />)}
                  </div>
                ) : visibleTx.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                      <SlidersHorizontal className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Tranzaksiya topilmadi</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {txTypeFilter !== "all" || methodFilter !== "all" ? "Filtrlarga mos tranzaksiya yo'q" : "Bu davr uchun tranzaksiya mavjud emas"}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-2.5 pl-4 pr-2 text-xs font-semibold text-slate-400 text-center w-10">#</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-left whitespace-nowrap">Sana va vaqt</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-left">Mijoz</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-left">Izoh</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-left whitespace-nowrap">Tranzaksiya turi</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-right whitespace-nowrap">Miqdori</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-left whitespace-nowrap">To'lov usuli</th>
                        <th className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-center whitespace-nowrap">Holati</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTx.map((tx, idx) => (
                        <TxRow
                          key={tx.id} tx={tx} index={(serverPage - 1) * PAGE_SIZE + idx + 1}
                          active={activeTx?.id === tx.id}
                          onSelect={() => setActiveTx(activeTx?.id === tx.id ? null : tx)}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── PAGINATION ── */}
              {pageCount > 1 && (
                <div className="border-t border-slate-200 bg-white px-5 py-2.5 flex items-center justify-between shrink-0">
                  <p className="text-xs text-slate-500">
                    {((serverPage - 1) * PAGE_SIZE) + 1}–{Math.min(serverPage * PAGE_SIZE, totalCount)} / {totalCount} ta
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setServerPage((p) => Math.max(1, p - 1))} disabled={serverPage <= 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {(() => {
                      const pages: (number | "...")[] = [];
                      if (pageCount <= 7) { for (let i = 1; i <= pageCount; i++) pages.push(i); }
                      else {
                        pages.push(1);
                        if (serverPage > 3) pages.push("...");
                        for (let i = Math.max(2, serverPage - 1); i <= Math.min(pageCount - 1, serverPage + 1); i++) pages.push(i);
                        if (serverPage < pageCount - 2) pages.push("...");
                        pages.push(pageCount);
                      }
                      return pages.map((p, i) =>
                        p === "..." ? (
                          <span key={`e${i}`} className="text-xs text-slate-400 px-1">...</span>
                        ) : (
                          <button key={p} onClick={() => setServerPage(p as number)}
                            className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                              serverPage === p ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>
                            {p}
                          </button>
                        )
                      );
                    })()}
                    <button onClick={() => setServerPage((p) => Math.min(pageCount, p + 1))} disabled={serverPage >= pageCount}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── TX DETAIL PANEL ── */}
            {activeTx && (
              <TxDetailPanel
                tx={activeTx}
                onClose={() => setActiveTx(null)}
                onCancelled={() => { setActiveTx(null); onTxSuccess(); }}
              />
            )}
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {txModal && selectedRegister && (
        <UnifiedTransactionModal
          type={txModal} cashRegister={selectedRegister} branchId={branchId}
          methodBalance={methodBalance}
          isOpen={!!txModal} onClose={() => setTxModal(null)} onSuccess={onTxSuccess}
        />
      )}

      <Dialog open={!!registerDialog} onOpenChange={(o) => !o && setRegisterDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{registerDialog === "edit" ? "Kassani tahrirlash" : "Yangi kassa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Kassa nomi <span className="text-rose-500">*</span></Label>
              <Input placeholder="Asosiy kassa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Manzil</Label>
              <Input placeholder="1-qavat, 101-xona" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Textarea placeholder="Qisqacha ma'lumot..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialog(null)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {registerDialog === "edit" ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Filter Bar helpers ────────────────────────────────────────────────────────

const CAL_DAYS_HEADER = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const CAL_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function buildCalDays(year: number, month: number): { date: string; inMonth: boolean }[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: string; inMonth: boolean }[] = [];
  for (let i = offset; i > 0; i--) cells.push({ date: isoDate(new Date(year, month, 1 - i)), inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: isoDate(new Date(year, month, d)), inMonth: true });
  let extra = 1;
  while (cells.length % 7 !== 0) cells.push({ date: isoDate(new Date(year, month + 1, extra++)), inMonth: false });
  return cells;
}
function fmtShortDate(s: string) {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${UZ_MONTHS_SHORT[m - 1]} ${y}`;
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({
  dateFrom, dateTo, activePreset, txTypeFilter, methodFilter, clientFilter, statusFilter, totalCount,
  onDateFrom, onDateTo, onPreset, onTxType, onMethod, onClient, onStatus, onRefresh,
}: {
  dateFrom: string; dateTo: string;
  activePreset: "today" | "week" | "month" | null;
  txTypeFilter: TxTypeFilter; methodFilter: MethodFilter; clientFilter: ClientFilter;
  statusFilter: StatusFilter; totalCount: number;
  onDateFrom: (v: string) => void; onDateTo: (v: string) => void;
  onPreset: (p: "today" | "week" | "month") => void;
  onTxType: (t: TxTypeFilter) => void; onMethod: (m: MethodFilter) => void;
  onClient: (c: ClientFilter) => void; onStatus: (s: StatusFilter) => void; onRefresh: () => void;
}) {
  const [calOpen, setCalOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calOpen) return;
    const h = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalOpen(false); setRangeStart(null); setHoverDate(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [calOpen]);

  const calDays = useMemo(() => buildCalDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const dateLabel = useMemo(() => {
    if (activePreset === "today") return "Bugun";
    if (activePreset === "week") return "Bu hafta";
    if (activePreset === "month") return "Bu oy";
    if (dateFrom === dateTo) return fmtShortDate(dateFrom);
    return `${fmtShortDate(dateFrom)} – ${fmtShortDate(dateTo)}`;
  }, [dateFrom, dateTo, activePreset]);

  function handleDayClick(d: string) {
    if (!rangeStart) {
      setRangeStart(d); onDateFrom(d); onDateTo(d);
    } else {
      const [a, b] = rangeStart <= d ? [rangeStart, d] : [d, rangeStart];
      onDateFrom(a); onDateTo(b);
      setRangeStart(null); setHoverDate(null); setCalOpen(false);
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Range display (including hover preview when first date selected)
  const effectiveTo = rangeStart ? (hoverDate ?? rangeStart) : dateTo;
  const [rangeL, rangeR] = rangeStart
    ? (rangeStart <= effectiveTo ? [rangeStart, effectiveTo] : [effectiveTo, rangeStart])
    : [dateFrom, dateTo];

  const today = todayStr();
  const hasExtraFilters = txTypeFilter !== "all" || methodFilter !== "all" || clientFilter !== "all" || statusFilter !== "all";

  const SEP = <div className="w-px h-4 bg-slate-200 shrink-0" />;
  const pillBase = "h-7 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap";

  return (
    <div className="bg-white border-b border-slate-200 shrink-0">

      {/* ── Row 1: date + type ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">

        {/* Date picker button + popover */}
        <div className="relative shrink-0" ref={calRef}>
          <button
            onClick={() => setCalOpen(v => !v)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-colors",
              calOpen
                ? "border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                : !activePreset
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {dateLabel}
          </button>

          {calOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-[268px] p-3 select-none">
              {/* Presets */}
              <div className="flex gap-1.5 mb-3">
                {(["today","week","month"] as const).map((p) => (
                  <button key={p}
                    onClick={() => { onPreset(p); setRangeStart(null); setHoverDate(null); setCalOpen(false); }}
                    className={cn(
                      "flex-1 h-7 rounded-lg text-xs font-semibold transition-colors",
                      activePreset === p ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}>
                    {{ today: "Bugun", week: "Bu hafta", month: "Bu oy" }[p]}
                  </button>
                ))}
              </div>

              {/* Month nav */}
              <div className="flex items-center justify-between mb-2 px-1">
                <button onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <span className="text-xs font-bold text-slate-800">
                  {CAL_MONTHS[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-0.5">
                {CAL_DAYS_HEADER.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calDays.map(({ date, inMonth }) => {
                  const day = parseInt(date.split("-")[2]);
                  const isStart = date === rangeL;
                  const isEnd   = date === rangeR;
                  const isSame  = rangeL === rangeR;
                  const inRange = date > rangeL && date < rangeR;
                  const isToday = date === today;

                  return (
                    <button
                      key={date}
                      onMouseEnter={() => rangeStart && setHoverDate(date)}
                      onMouseLeave={() => rangeStart && setHoverDate(null)}
                      onClick={() => handleDayClick(date)}
                      className={cn(
                        "h-8 text-xs font-medium transition-colors flex items-center justify-center",
                        !inMonth && "opacity-30",
                        isSame && isStart && "rounded-full bg-blue-600 text-white",
                        !isSame && isStart && "rounded-l-full bg-blue-600 text-white",
                        !isSame && isEnd   && "rounded-r-full bg-blue-600 text-white",
                        inRange && "bg-blue-100 text-blue-800",
                        !isStart && !isEnd && !inRange && isToday && "text-blue-600 font-bold",
                        !isStart && !isEnd && !inRange && !isToday && inMonth && "text-slate-700 hover:bg-slate-100 rounded-full",
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {rangeStart && (
                <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                  Tugash sanasini tanlang
                </p>
              )}
            </div>
          )}
        </div>

        {SEP}

        {/* Transaction type pills */}
        <div className="flex items-center gap-0.5 shrink-0">
          {([
            { v: "all",      label: "Barchasi",  ac: "bg-slate-800 text-white"    },
            { v: "income",   label: "↓ Kirim",   ac: "bg-emerald-600 text-white"  },
            { v: "expense",  label: "↑ Chiqim",  ac: "bg-rose-500 text-white"     },
            { v: "transfer", label: "⇄ Transfer",ac: "bg-slate-600 text-white"    },
          ] as const).map(({ v, label, ac }) => (
            <button key={v} onClick={() => onTxType(v as TxTypeFilter)}
              className={cn(pillBase, txTypeFilter === v ? ac : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {hasExtraFilters && (
          <button
            onClick={() => { onTxType("all"); onMethod("all"); onClient("all"); onStatus("all"); }}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
          >
            <X className="w-3 h-3" />Tozalash
          </button>
        )}

        <span className="text-xs text-slate-400 tabular-nums shrink-0 font-medium">{totalCount} ta</span>
        <button onClick={onRefresh}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Row 2: method + client + status ── */}
      <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto scrollbar-none">
        {/* To'lov usuli */}
        <div className="flex items-center gap-0.5 shrink-0">
          {([
            { v: "all",  label: "Hammasi", Icon: null },
            { v: "cash", label: "Naqd",    Icon: Banknote  },
            { v: "card", label: "Plastik", Icon: CreditCard },
            { v: "bank", label: "Bank",    Icon: Building2 },
          ] as const).map(({ v, label, Icon }) => (
            <button key={v} onClick={() => onMethod(v as MethodFilter)}
              className={cn(pillBase, "flex items-center gap-1",
                methodFilter === v ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")}>
              {Icon && <Icon className="w-3 h-3" />}{label}
            </button>
          ))}
        </div>

        {SEP}

        {/* Mijoz */}
        <div className="flex items-center gap-0.5 shrink-0">
          {([
            { v: "all",         label: "Barchasi"  },
            { v: "student",     label: "O'quvchi"  },
            { v: "employee",    label: "Xodim"     },
            { v: "third_party", label: "3-shaxs"   },
          ] as const).map(({ v, label }) => (
            <button key={v} onClick={() => onClient(v as ClientFilter)}
              className={cn(pillBase, clientFilter === v ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")}>
              {label}
            </button>
          ))}
        </div>

        {SEP}

        {/* Holat */}
        <div className="flex items-center gap-0.5 shrink-0">
          {([
            { v: "all",       label: "Barchasi",     ac: "bg-slate-700 text-white"    },
            { v: "completed", label: "✓ Bajarilgan", ac: "bg-emerald-600 text-white"  },
            { v: "pending",   label: "⏳ Kutilmoqda",ac: "bg-amber-500 text-white"    },
            { v: "cancelled", label: "✕ Bekor",      ac: "bg-slate-500 text-white"    },
          ] as const).map(({ v, label, ac }) => (
            <button key={v} onClick={() => onStatus(v as StatusFilter)}
              className={cn(pillBase, statusFilter === v ? ac : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Register Card ─────────────────────────────────────────────────────────────

function RegisterCard({ register, selected, primary, hideBalance, onSelect, onEdit, onArchive, onRestore, onMarkPrimary, onIncome, onExpense }: {
  register: CashRegister; selected: boolean; primary: boolean; hideBalance: boolean;
  onSelect: () => void; onEdit: () => void; onArchive: () => void; onRestore: () => void; onMarkPrimary: () => void;
  onIncome?: () => void; onExpense?: () => void;
}) {
  return (
    <div onClick={onSelect} className={cn(
      "relative rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-150 border group",
      selected ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-600/20" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
    )}>
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {primary
            ? <Star className={cn("w-3.5 h-3.5 shrink-0 fill-current", selected ? "text-yellow-300" : "text-amber-500")} />
            : <span className={cn("w-2 h-2 rounded-full shrink-0", register.is_active ? (selected ? "bg-white/70" : "bg-emerald-500") : (selected ? "bg-white/40" : "bg-slate-300"))} />
          }
          <p className={cn("text-sm font-semibold truncate", selected ? "text-white" : "text-slate-800")}>{register.name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className={cn("w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100", selected ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100")}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-sm">
            {register.is_active && !primary && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkPrimary(); }}>
                  <Star className="w-3.5 h-3.5 mr-2 text-amber-500" />Asosiy qilib belgilash
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {register.is_active && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit className="w-3.5 h-3.5 mr-2" />Tahrirlash</DropdownMenuItem>}
            {register.is_active ? (
              <DropdownMenuItem className="text-amber-600 focus:text-amber-600 focus:bg-amber-50" onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                <Archive className="w-3.5 h-3.5 mr-2" />Arxivlash
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-blue-600 focus:text-blue-600 focus:bg-blue-50" onClick={(e) => { e.stopPropagation(); onRestore(); }}>
                <ArchiveRestore className="w-3.5 h-3.5 mr-2" />Tiklash
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {register.location && (
        <p className={cn("text-xs flex items-center gap-1 mb-1.5 truncate", selected ? "text-blue-200" : "text-slate-400")}>
          <MapPin className="w-3 h-3 shrink-0" />{register.location}
        </p>
      )}

      <div className={cn("pt-2 border-t", selected ? "border-blue-500" : "border-slate-100")}>
        <p className={cn("text-base font-bold tabular-nums", selected ? "text-white" : "text-slate-900")}>
          {hideBalance ? "••••••" : formatCurrency(register.balance)}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className={cn("text-xs", selected ? "text-blue-200" : "text-slate-400")}>Balans</p>
          {primary && (
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", selected ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600")}>Asosiy</span>
          )}
        </div>
      </div>

      {register.is_active && (
        <div className={cn("flex gap-1.5 mt-2 pt-2 border-t", selected ? "border-blue-500" : "border-slate-100")}>
          <button
            onClick={(e) => { e.stopPropagation(); onIncome?.(); }}
            className={cn(
              "flex-1 h-6 rounded-md text-[11px] font-semibold transition-colors",
              selected ? "bg-white/15 text-white hover:bg-white/25" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            )}
          >
            + Kirim
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onExpense?.(); }}
            className={cn(
              "flex-1 h-6 rounded-md text-[11px] font-semibold transition-colors",
              selected ? "bg-white/15 text-white hover:bg-white/25" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
            )}
          >
            − Chiqim
          </button>
        </div>
      )}
    </div>
  );
}

// ── Transaction Table Row ─────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  pending:   { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-400"   },
  cancelled: { bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400"   },
};

function TxRow({ tx, index, active, onSelect }: {
  tx: Transaction; index: number; active: boolean; onSelect: () => void;
}) {
  const router = useRouter();
  const label = TX_LABEL[tx.transaction_type] ?? tx.transaction_type_display;
  const statusLabel = STATUS_LABEL[tx.status] ?? tx.status_display;
  const { date, time } = fmtDateTime(tx.transaction_date);
  const inc = isIncome(tx.transaction_type);
  const exp = isExpense(tx.transaction_type);
  const cancelled = tx.status === "cancelled";
  const whoLabel = tx.student?.full_name ?? tx.employee?.full_name ?? tx.third_party_name ?? null;
  const whoHref = tx.student
    ? `/school/students/${tx.student.id}`
    : tx.employee ? `/school/staff/${tx.employee.id}` : null;
  const statusStyle = STATUS_BADGE[tx.status] ?? { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };

  const periods: string[] = (tx.period_months?.length ?? 0) > 0
    ? (tx.period_months as string[])
    : tx.period_month ? [tx.period_month as string] : [];
  const noteText = tx.description
    ?? (tx.category_name
      ? `${tx.category_name}${periods.length > 0 ? " · " + periods.map(fmtPeriod).join(", ") : ""}`
      : null);

  return (
    <tr
      onClick={onSelect}
      className={cn(
        "group transition-colors cursor-pointer border-b border-slate-100",
        cancelled
          ? (active ? "bg-slate-100" : "bg-slate-50/70 hover:bg-slate-100/60")
          : (active ? "bg-blue-50/70" : "bg-white hover:bg-slate-50/80")
      )}
    >
      {/* # */}
      <td className="py-3 pl-4 pr-2 text-center">
        <span className="text-[11px] text-slate-300 tabular-nums font-mono">{index}</span>
      </td>

      {/* Sana va vaqt */}
      <td className="py-3 px-3 whitespace-nowrap">
        <p className={cn("text-xs font-medium leading-tight", cancelled ? "text-slate-400" : "text-slate-700")}>{date}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">{time}</p>
      </td>

      {/* Mijoz */}
      <td className="py-3 px-3">
        {whoLabel ? (
          whoHref ? (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(whoHref); }}
              className="text-xs font-medium text-slate-700 hover:text-blue-600 hover:underline truncate max-w-[130px] text-left block"
            >
              {whoLabel}
            </button>
          ) : (
            <p className="text-xs font-medium text-slate-700 truncate max-w-[130px]">{whoLabel}</p>
          )
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Izoh */}
      <td className="py-3 px-3">
        {noteText ? (
          <p className="text-xs text-slate-500 truncate max-w-[200px]">{noteText}</p>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Tranzaksiya turi */}
      <td className="py-3 px-3 whitespace-nowrap">
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
          cancelled ? "bg-slate-100 text-slate-400"
            : inc ? "bg-emerald-50 text-emerald-700"
            : exp ? "bg-rose-50 text-rose-700"
            : "bg-slate-100 text-slate-600"
        )}>
          {cancelled
            ? <X className="w-2.5 h-2.5" />
            : inc ? <ArrowDownRight className="w-2.5 h-2.5" />
            : exp ? <ArrowUpRight className="w-2.5 h-2.5" />
            : <ArrowRightLeft className="w-2.5 h-2.5" />}
          {label}
        </span>
      </td>

      {/* Miqdori */}
      <td className="py-3 px-3 text-right whitespace-nowrap">
        <p className={cn(
          "text-sm font-bold tabular-nums",
          cancelled ? "text-slate-400 line-through"
            : inc ? "text-emerald-600"
            : exp ? "text-rose-600"
            : "text-slate-700"
        )}>
          {inc ? "+" : exp ? "−" : ""}{formatCurrency(tx.amount)}
        </p>
      </td>

      {/* To'lov usuli */}
      <td className="py-3 px-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          {tx.payment_method === "card"
            ? <><CreditCard className="w-3 h-3 text-blue-400" />Plastik</>
            : tx.payment_method === "bank"
            ? <><Building2 className="w-3 h-3 text-emerald-500" />Bank</>
            : <><Banknote className="w-3 h-3 text-amber-500" />Naqd</>}
        </span>
      </td>

      {/* Holati */}
      <td className="py-3 px-3 text-center">
        <span
          className={cn("inline-block w-2 h-2 rounded-full", statusStyle.dot)}
          title={statusLabel}
        />
      </td>
    </tr>
  );
}

// ── Transaction Detail Panel ──────────────────────────────────────────────────

const PANEL_HDR: Record<string, string> = {
  income: "bg-emerald-600", payment: "bg-emerald-600",
  expense: "bg-rose-600",  salary: "bg-amber-600",
  transfer: "bg-blue-600", refund: "bg-orange-500",
};
const PANEL_ICON_BG: Record<string, string> = {
  income: "bg-emerald-500", payment: "bg-emerald-500",
  expense: "bg-rose-500",  salary: "bg-amber-500",
  transfer: "bg-blue-500", refund: "bg-orange-400",
};
const UZ_MONTH_NAMES: Record<string, string> = {
  "01":"Yanvar","02":"Fevral","03":"Mart","04":"Aprel",
  "05":"May","06":"Iyun","07":"Iyul","08":"Avgust",
  "09":"Sentabr","10":"Oktabr","11":"Noyabr","12":"Dekabr",
};
function fmtPeriod(ym: string) {
  const [y, m] = ym.split("-");
  return `${UZ_MONTH_NAMES[m] ?? m} ${y}`;
}

function TxDetailPanel({ tx, onClose, onCancelled }: {
  tx: Transaction; onClose: () => void; onCancelled?: () => void;
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const label  = TX_LABEL[tx.transaction_type] ?? tx.transaction_type_display;
  const inc    = isIncome(tx.transaction_type);
  const exp    = isExpense(tx.transaction_type);
  const hdr    = PANEL_HDR[tx.transaction_type] ?? "bg-slate-700";
  const iconBg = PANEL_ICON_BG[tx.transaction_type] ?? "bg-slate-600";
  const statusLabel = STATUS_LABEL[tx.status] ?? tx.status_display;
  const statusBadge = STATUS_BADGE[tx.status] ?? { bg: "bg-slate-100", text: "text-slate-500" };
  const { full, date: dStr, time: tStr } = fmtDateTime(tx.transaction_date);
  const isCancelled = tx.status === "cancelled";

  // Ko'p oylik yoki bitta oylik
  const periods: string[] =
    tx.period_months && tx.period_months.length > 0
      ? tx.period_months
      : tx.period_month ? [tx.period_month] : [];

  const whoHref = tx.student
    ? `/school/students/${tx.student.id}`
    : tx.employee ? `/school/staff/${tx.employee.id}` : null;

  async function handleCancel() {
    setCancelling(true);
    try {
      await financeApi.cancelTransaction(String(tx.id));
      toast.success("Tranzaksiya bekor qilindi");
      onCancelled?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Xatolik yuz berdi");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="w-[290px] shrink-0 border-l border-slate-200 flex flex-col h-full bg-slate-50 overflow-y-auto">

      {/* ── Colored header ── */}
      <div className={cn("relative px-4 pt-4 pb-5 shrink-0", hdr, isCancelled && "opacity-60")}>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest mb-3">Tranzaksiya</p>

        <div className="flex items-end gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            {inc
              ? <ArrowDownRight className="w-5 h-5 text-white" />
              : exp
              ? <ArrowUpRight className="w-5 h-5 text-white" />
              : <ArrowRightLeft className="w-5 h-5 text-white" />
            }
          </div>
          <div className="flex-1 min-w-0 pb-0.5">
            <p className="text-white/60 text-xs mb-0.5">{label}</p>
            <p className="text-white font-bold text-2xl leading-none tabular-nums">
              {inc ? "+" : exp ? "−" : ""}{formatCurrency(tx.amount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3.5">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full",
            statusBadge.bg, statusBadge.text
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[tx.status] ?? "bg-slate-400")} />
            {statusLabel}
          </span>
          <span className="text-white/40 text-[10px]">{dStr} · {tStr}</span>
        </div>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border-b border-red-100 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-red-700">Bekor qilingan</span>
            {tx.cancelled_by_info && (
              <span className="text-red-500"> · {tx.cancelled_by_info.full_name}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 p-3 space-y-3">

        {/* To'lov ma'lumotlari */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <DetailItem label="To'lov usuli">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
              tx.payment_method === "card" ? "bg-blue-50 text-blue-700" : tx.payment_method === "bank" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            )}>
              {tx.payment_method === "card"
                ? <><CreditCard className="w-3 h-3" />Plastik</>
                : tx.payment_method === "bank"
                ? <><Globe className="w-3 h-3" />Bank</>
                : <><Banknote className="w-3 h-3" />Naqd</>
              }
            </span>
          </DetailItem>

          {tx.category_name && (
            <DetailItem label="Kategoriya">
              <span className="text-xs font-medium text-slate-700">{tx.category_name}</span>
            </DetailItem>
          )}

          <DetailItem label="Sana">
            <span className="text-xs text-slate-700">{full}</span>
          </DetailItem>

          {tx.reference_number && (
            <DetailItem label="Referens">
              <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                {tx.reference_number}
              </span>
            </DetailItem>
          )}
        </div>

        {/* O'quvchi / Xodim */}
        {(tx.student || tx.employee || tx.third_party_name) && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            {tx.student && (
              <>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {whoHref ? (
                      <button
                        onClick={() => router.push(whoHref)}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 truncate max-w-full"
                      >
                        {tx.student.full_name}
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </button>
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 truncate">{tx.student.full_name}</p>
                    )}
                    {tx.student.personal_number && (
                      <p className="text-[10px] text-slate-400">#{tx.student.personal_number}</p>
                    )}
                  </div>
                  {tx.student.current_class && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">
                      {tx.student.current_class.name}
                    </span>
                  )}
                </div>

                {/* To'lov oylari */}
                {periods.length > 0 && (
                  <div className="px-3.5 py-2.5 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {periods.length > 1 ? "To'lov oylari" : "To'lov oyi"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {periods.map((ym) => (
                        <span
                          key={ym}
                          className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md"
                        >
                          {fmtPeriod(ym)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tx.employee && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {whoHref ? (
                    <button
                      onClick={() => router.push(whoHref)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {tx.employee.full_name}
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </button>
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 truncate">{tx.employee.full_name}</p>
                  )}
                  <p className="text-[10px] text-slate-400">{tx.employee.role_display}</p>
                </div>
              </div>
            )}

            {tx.third_party_name && !tx.student && !tx.employee && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xs font-semibold text-slate-800">{tx.third_party_name}</p>
              </div>
            )}
          </div>
        )}

        {/* Izoh */}
        {tx.description && (
          <div className="bg-white rounded-xl border border-slate-100 px-3.5 py-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Izoh</p>
            <p className="text-xs text-slate-600 leading-relaxed">{tx.description}</p>
          </div>
        )}

        {/* Audit */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          <AuditRow label="Yaratdi" user={tx.created_by_info} date={tx.created_at} />
          {isCancelled && tx.cancelled_by_info && (
            <AuditRow label="Bekor qildi" user={tx.cancelled_by_info} date={tx.cancelled_at ?? tx.updated_at} danger />
          )}
        </div>

        {/* Bekor qilish */}
        {!isCancelled && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={cancelling}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Bekor qilish
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Bekor qilishni tasdiqlang
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    <strong>{formatCurrency(tx.amount)}</strong> miqdoridagi tranzaksiyani bekor qilmoqchisiz.
                  </span>
                  <span className="block font-medium text-rose-600">
                    Bu amal ortga qaytarib bo'lmaydi. Kassa balansi teskari qaytariladi.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Yo'q</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
                >
                  {cancelling ? "Bekor qilinmoqda..." : "Ha, bekor qilaman"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function AuditRow({ label, user, date, danger }: {
  label: string;
  user?: { full_name: string; phone_number?: string } | null;
  date: string;
  danger?: boolean;
}) {
  const { date: d, time: t } = fmtDateTime(date);
  return (
    <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className={cn("text-[10px] mb-0.5", danger ? "text-red-400" : "text-slate-400")}>{label}</p>
        <p className={cn("text-xs font-medium leading-tight truncate max-w-[140px]", danger ? "text-red-700" : "text-slate-700")}>
          {user?.full_name ?? "—"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-medium text-slate-600">{d}</p>
        <p className="text-[10px] text-slate-400">{t}</p>
      </div>
    </div>
  );
}
