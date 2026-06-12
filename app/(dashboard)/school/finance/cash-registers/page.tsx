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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Edit, Wallet, MapPin, Banknote, CreditCard, RefreshCw,
  MoreHorizontal, Star, ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  Building2, SlidersHorizontal, ChevronLeft, ChevronRight,
  Archive, ArchiveRestore, Eye, EyeOff, X,
  ExternalLink, Calendar, UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import UnifiedTransactionModal from "@/components/finance/UnifiedTransactionModal";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type FlowType = "income" | "expense" | "transfer";
type TxTypeFilter = "all" | "income" | "expense" | "transfer";
type MethodFilter = "all" | "cash" | "card";
type ClientFilter = "all" | "student" | "employee" | "third_party";

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
  completed: "Bajarilgan", pending: "Kutilmoqda", cancelled: "Bekor", failed: "Xato",
};
const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500", pending: "bg-amber-400",
  cancelled: "bg-slate-400",   failed: "bg-rose-500",
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
    ordering: "-transaction_date",
  }), [selectedRegister?.id, dateFrom, dateTo, txTypeFilter, methodFilter, clientFilter]);

  useEffect(() => { setServerPage(1); }, [dateFrom, dateTo, txTypeFilter, methodFilter, clientFilter, selectedRegister?.id]);

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
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                        <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 leading-none mb-1">Jami balans</p>
                          <p className="text-sm font-bold text-slate-900 tabular-nums leading-none">
                            {hideBalance ? "••••••" : formatCurrency(selectedRegister.balance)}
                          </p>
                        </div>
                      </div>
                      {/* Cash */}
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                        <Banknote className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-amber-600 leading-none mb-1">Naqd</p>
                          <p className="text-sm font-bold text-amber-800 tabular-nums leading-none">
                            {hideBalance ? "••••••" : formatCurrency(methodBalance?.cash_net ?? 0)}
                          </p>
                        </div>
                      </div>
                      {/* Card */}
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
                        <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-blue-600 leading-none mb-1">Plastik</p>
                          <p className="text-sm font-bold text-blue-800 tabular-nums leading-none">
                            {hideBalance ? "••••••" : formatCurrency(methodBalance?.card_net ?? 0)}
                          </p>
                        </div>
                      </div>
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
                clientFilter={clientFilter} totalCount={totalCount}
                onDateFrom={(v) => { setDateFrom(v); setActivePreset(null); }}
                onDateTo={(v) => { setDateTo(v); setActivePreset(null); }}
                onPreset={applyPreset}
                onTxType={setTxTypeFilter}
                onMethod={setMethodFilter}
                onClient={setClientFilter}
                onRefresh={() => { refetchTx(); queryClient.invalidateQueries({ queryKey: ["tx-summary"] }); }}
              />

              {/* ── SUMMARY BAR ── */}
              {summaryTx.length > 0 && (
                <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white border-b border-slate-200 shrink-0">
                  <div className="px-5 py-2">
                    <p className="text-[10px] text-slate-400 mb-0.5">Kirim{summaryTotal > SUMMARY_PAGE_SIZE ? " ≈" : ""}</p>
                    <p className="text-sm font-bold tabular-nums text-emerald-600">+{formatCurrency(summaryIncome)}</p>
                  </div>
                  <div className="px-5 py-2">
                    <p className="text-[10px] text-slate-400 mb-0.5">Chiqim{summaryTotal > SUMMARY_PAGE_SIZE ? " ≈" : ""}</p>
                    <p className="text-sm font-bold tabular-nums text-rose-600">−{formatCurrency(summaryExpense)}</p>
                  </div>
                  <div className="px-5 py-2">
                    <p className="text-[10px] text-slate-400 mb-0.5">Sof</p>
                    <p className={cn("text-sm font-bold tabular-nums", summaryNet >= 0 ? "text-slate-800" : "text-rose-600")}>
                      {summaryNet >= 0 ? "+" : "−"}{formatCurrency(Math.abs(summaryNet))}
                    </p>
                  </div>
                </div>
              )}

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
                        <th className="py-3 pl-4 pr-4 text-xs font-semibold text-slate-400 text-left whitespace-nowrap w-[110px] border-l-[3px] border-l-transparent">Sana</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 text-left w-[110px]">Tur</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 text-left">Tranzaksiya</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 text-left w-[180px]">Mijoz</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 text-right whitespace-nowrap w-[150px]">Summa</th>
                        <th className="py-3 pl-4 pr-5 text-xs font-semibold text-slate-400 text-center w-[52px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTx.map((tx, idx) => (
                        <TxRow
                          key={tx.id} tx={tx}
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
              <TxDetailPanel tx={activeTx} onClose={() => setActiveTx(null)} />
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

// ── Filter Bar ────────────────────────────────────────────────────────────────

const FILTER_SEP = <div className="w-px h-5 bg-slate-200 shrink-0" />;

function FilterBar({
  dateFrom, dateTo, activePreset, txTypeFilter, methodFilter, clientFilter, totalCount,
  onDateFrom, onDateTo, onPreset, onTxType, onMethod, onClient, onRefresh,
}: {
  dateFrom: string; dateTo: string;
  activePreset: "today" | "week" | "month" | null;
  txTypeFilter: TxTypeFilter; methodFilter: MethodFilter; clientFilter: ClientFilter; totalCount: number;
  onDateFrom: (v: string) => void; onDateTo: (v: string) => void;
  onPreset: (p: "today" | "week" | "month") => void;
  onTxType: (t: TxTypeFilter) => void; onMethod: (m: MethodFilter) => void;
  onClient: (c: ClientFilter) => void; onRefresh: () => void;
}) {
  const customDateActive = !activePreset;

  return (
    <div className="bg-white border-b border-slate-200 shrink-0">
      <div className="flex items-center gap-3 px-5 py-2.5 overflow-x-auto scrollbar-none">

        {/* Segment: date presets */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPreset(p)}
              className={cn(
                "h-7 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                activePreset === p
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {{ today: "Bugun", week: "Hafta", month: "Oy" }[p]}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-colors shrink-0 cursor-pointer",
          customDateActive
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
        )}>
          <Calendar className={cn("w-3.5 h-3.5 shrink-0", customDateActive ? "text-blue-400" : "text-slate-400")} />
          <input
            type="date" value={dateFrom}
            onChange={(e) => onDateFrom(e.target.value)}
            className="bg-transparent border-none focus:outline-none w-[96px] cursor-pointer text-xs"
          />
          <span className={cn("select-none", customDateActive ? "text-blue-300" : "text-slate-300")}>–</span>
          <input
            type="date" value={dateTo}
            onChange={(e) => onDateTo(e.target.value)}
            className="bg-transparent border-none focus:outline-none w-[96px] cursor-pointer text-xs"
          />
        </div>

        {FILTER_SEP}

        {/* Transaction type */}
        <div className="flex items-center gap-1 shrink-0">
          {([
            { v: "all",      label: "Barchasi", cls: "bg-slate-800 text-white" },
            { v: "income",   label: "↓ Kirim",  cls: "bg-emerald-600 text-white" },
            { v: "expense",  label: "↑ Chiqim", cls: "bg-rose-500 text-white" },
            { v: "transfer", label: "⇄",        cls: "bg-slate-600 text-white" },
          ] as const).map(({ v, label, cls }) => (
            <button
              key={v}
              onClick={() => onTxType(v as TxTypeFilter)}
              className={cn(
                "h-7 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                txTypeFilter === v ? cls : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {FILTER_SEP}

        {/* Method */}
        <div className="flex items-center gap-1 shrink-0">
          {([
            { v: "all",  label: "Hammasi", icon: null },
            { v: "cash", label: "Naqd",    icon: Banknote },
            { v: "card", label: "Plastik", icon: CreditCard },
          ] as const).map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => onMethod(v as MethodFilter)}
              className={cn(
                "h-7 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap",
                methodFilter === v ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </button>
          ))}
        </div>

        {FILTER_SEP}

        {/* Client type */}
        <div className="flex items-center gap-1 shrink-0">
          {([
            { v: "all",         label: "Barchasi" },
            { v: "student",     label: "O'quvchi" },
            { v: "employee",    label: "Xodim" },
            { v: "third_party", label: "3-shaxs" },
          ] as const).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => onClient(v as ClientFilter)}
              className={cn(
                "h-7 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                clientFilter === v ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <span className="text-xs text-slate-400 tabular-nums shrink-0 font-medium">{totalCount} ta</span>
        <button
          onClick={onRefresh}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Register Card ─────────────────────────────────────────────────────────────

function RegisterCard({ register, selected, primary, hideBalance, onSelect, onEdit, onArchive, onRestore, onMarkPrimary }: {
  register: CashRegister; selected: boolean; primary: boolean; hideBalance: boolean;
  onSelect: () => void; onEdit: () => void; onArchive: () => void; onRestore: () => void; onMarkPrimary: () => void;
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
    </div>
  );
}

// ── Transaction Table Row ─────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  pending:   { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-400"   },
  cancelled: { bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400"   },
  failed:    { bg: "bg-rose-50",     text: "text-rose-600",    dot: "bg-rose-500"    },
};

function TxRow({ tx, active, onSelect }: {
  tx: Transaction; active: boolean; onSelect: () => void;
}) {
  const router = useRouter();
  const label = TX_LABEL[tx.transaction_type] ?? tx.transaction_type_display;
  const statusLabel = STATUS_LABEL[tx.status] ?? tx.status_display;
  const { date, time } = fmtDateTime(tx.transaction_date);
  const inc = isIncome(tx.transaction_type);
  const exp = isExpense(tx.transaction_type);
  const whoLabel = tx.student?.full_name ?? tx.employee?.full_name ?? tx.third_party_name ?? null;
  const whoHref = tx.student
    ? `/school/students/${tx.student.id}`
    : tx.employee ? `/school/staff/${tx.employee.id}` : null;
  const statusStyle = STATUS_BADGE[tx.status] ?? { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-300" };

  return (
    <tr
      onClick={onSelect}
      className={cn(
        "group transition-colors cursor-pointer",
        active ? "bg-blue-50/70" : "bg-white hover:bg-slate-50/80"
      )}
    >
      {/* Sana — with left accent border */}
      <td className={cn(
        "py-3.5 pl-4 pr-4 whitespace-nowrap border-b border-slate-100 border-l-[3px]",
        inc ? "border-l-emerald-400" : exp ? "border-l-rose-400" : "border-l-slate-300"
      )}>
        <p className="text-xs font-semibold text-slate-800 leading-tight">{date}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">{time}</p>
      </td>

      {/* Tur — type badge only */}
      <td className="py-3.5 px-4 border-b border-slate-100 whitespace-nowrap">
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
          inc
            ? "bg-emerald-100 text-emerald-700"
            : exp
            ? "bg-rose-100 text-rose-700"
            : "bg-slate-100 text-slate-600"
        )}>
          {inc
            ? <ArrowDownRight className="w-2.5 h-2.5" />
            : exp
            ? <ArrowUpRight className="w-2.5 h-2.5" />
            : <ArrowRightLeft className="w-2.5 h-2.5" />}
          {label}
        </span>
      </td>

      {/* Tranzaksiya — category + period + description */}
      <td className="py-3.5 px-4 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-700 truncate max-w-[220px] leading-tight">
          {tx.category_name ?? "—"}
          {tx.period_month && <span className="text-slate-400 font-normal"> · {tx.period_month}</span>}
        </p>
        {tx.description && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">{tx.description}</p>
        )}
      </td>

      {/* Mijoz */}
      <td className="py-3.5 px-4 border-b border-slate-100">
        {whoLabel ? (
          whoHref ? (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(whoHref); }}
              className="group/link flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-600 max-w-[160px] leading-tight"
            >
              <span className="truncate group-hover/link:underline">{whoLabel}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover/link:opacity-70 transition-opacity" />
            </button>
          ) : (
            <p className="text-xs font-medium text-slate-700 truncate max-w-[160px] leading-tight">{whoLabel}</p>
          )
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Summa + to'lov usuli */}
      <td className="py-3.5 px-4 text-right border-b border-slate-100 whitespace-nowrap">
        <p className={cn(
          "text-sm font-bold tabular-nums leading-tight",
          inc ? "text-emerald-600" : exp ? "text-rose-600" : "text-slate-700"
        )}>
          {inc ? "+" : exp ? "−" : ""}{formatCurrency(tx.amount)}
        </p>
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[10px] font-semibold mt-1",
          tx.payment_method === "card" ? "text-blue-500" : "text-amber-600"
        )}>
          {tx.payment_method === "card"
            ? <><CreditCard className="w-2.5 h-2.5" />Plastik</>
            : <><Banknote className="w-2.5 h-2.5" />Naqd</>}
        </span>
      </td>

      {/* Holat — dot indicator only */}
      <td className="py-3.5 pl-4 pr-5 text-center border-b border-slate-100">
        <span
          className={cn("inline-block w-2.5 h-2.5 rounded-full", statusStyle.dot)}
          title={statusLabel}
        />
      </td>
    </tr>
  );
}

// ── Transaction Detail Panel ──────────────────────────────────────────────────

function TxDetailPanel({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const router = useRouter();
  const colors = TX_COLORS[tx.transaction_type] ?? { text: "text-slate-500", bg: "bg-slate-50", arrow: "•" };
  const label = TX_LABEL[tx.transaction_type] ?? tx.transaction_type_display;
  const statusLabel = STATUS_LABEL[tx.status] ?? tx.status_display;
  const statusBadge = STATUS_BADGE[tx.status] ?? { bg: "bg-slate-100", text: "text-slate-500" };
  const { full } = fmtDateTime(tx.transaction_date);
  const inc = isIncome(tx.transaction_type);
  const exp = isExpense(tx.transaction_type);
  const whoLabel = tx.student?.full_name ?? tx.employee?.full_name ?? tx.third_party_name;
  const whoHref = tx.student
    ? `/school/students/${tx.student.id}`
    : tx.employee ? `/school/staff/${tx.employee.id}` : null;

  return (
    <div className="w-[280px] shrink-0 border-l border-slate-200 flex flex-col h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-800">Tranzaksiya</p>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Amount hero */}
      <div className={cn(
        "mx-4 mt-4 rounded-2xl p-5 text-center",
        inc ? "bg-emerald-50" : exp ? "bg-rose-50" : "bg-slate-50"
      )}>
        <p className={cn(
          "text-3xl font-bold tabular-nums leading-none",
          inc ? "text-emerald-600" : exp ? "text-rose-500" : "text-slate-700"
        )}>
          {inc ? "+" : exp ? "−" : ""}{formatCurrency(tx.amount)}
        </p>
        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-3",
          colors.text, colors.bg
        )}>
          {colors.arrow} {label}
        </span>
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-1">
        <DetailItem label="Holat">
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", statusBadge.bg, statusBadge.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[tx.status] ?? "bg-slate-300")} />
            {statusLabel}
          </span>
        </DetailItem>

        <DetailItem label="Sana">
          <span className="text-sm text-slate-700">{full}</span>
        </DetailItem>

        <DetailItem label="To'lov usuli">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            tx.payment_method === "card" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
          )}>
            {tx.payment_method === "card"
              ? <><CreditCard className="w-3 h-3" />Plastik karta</>
              : <><Banknote className="w-3 h-3" />Naqd pul</>
            }
          </span>
        </DetailItem>

        {tx.category_name && (
          <DetailItem label="Kategoriya">
            <span className="text-sm text-slate-700">{tx.category_name}</span>
          </DetailItem>
        )}

        {tx.period_month && (
          <DetailItem label="Davr">
            <span className="text-sm text-slate-700">{tx.period_month}</span>
          </DetailItem>
        )}

        {whoLabel && (
          <DetailItem label="Mijoz">
            {whoHref ? (
              <button
                onClick={() => router.push(whoHref)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {whoLabel}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </button>
            ) : (
              <span className="text-sm text-slate-700">{whoLabel}</span>
            )}
          </DetailItem>
        )}
      </div>

      {/* Description */}
      {tx.description && (
        <div className="mx-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Izoh</p>
            <p className="text-sm text-slate-600 leading-relaxed">{tx.description}</p>
          </div>
        </div>
      )}

      {/* Audit trail */}
      <div className="mx-4 mb-5">
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
            <UserCircle className="w-3 h-3 text-slate-400" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Faoliyat</p>
          </div>
          <AuditRow label="Yaratdi" user={tx.created_by_info} date={tx.created_at} />
          <AuditRow label="Yangiladi" user={tx.updated_by_info} date={tx.updated_at} />
        </div>
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

function AuditRow({ label, user, date }: {
  label: string;
  user?: { full_name: string; phone_number: string } | null;
  date: string;
}) {
  const { date: d, time: t } = fmtDateTime(date);
  return (
    <div className="px-3 py-2.5 flex items-start justify-between gap-2 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
        <p className="text-xs font-medium text-slate-700 leading-tight truncate max-w-[130px]">
          {user?.full_name ?? "—"}
        </p>
        {user && user.phone_number !== user.full_name && (
          <p className="text-[10px] text-slate-400 mt-0.5">{user.phone_number}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-medium text-slate-600">{d}</p>
        <p className="text-[10px] text-slate-400">{t}</p>
      </div>
    </div>
  );
}
