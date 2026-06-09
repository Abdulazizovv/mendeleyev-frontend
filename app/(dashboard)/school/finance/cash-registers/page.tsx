"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import type { CashRegister, CreateCashRegisterRequest, Transaction } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Edit, Trash2, Wallet, MapPin,
  TrendingUp, TrendingDown, ArrowRightLeft,
  Banknote, CreditCard, RefreshCw,
  MoreHorizontal, Star, ArrowUpRight, ArrowDownRight,
  Building2, SlidersHorizontal, ChevronLeft, ChevronRight,
  MessageSquare, ChevronDown,
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

// arrow for type column: ↓ = money coming IN (income), ↑ = money going OUT (expense)
const TX_ARROW: Record<string, { arrow: string; cls: string }> = {
  income:   { arrow: "↓", cls: "text-emerald-600 font-bold" },
  payment:  { arrow: "↓", cls: "text-emerald-600 font-bold" },
  expense:  { arrow: "↑", cls: "text-rose-600 font-bold"    },
  salary:   { arrow: "↑", cls: "text-rose-600 font-bold"    },
  transfer: { arrow: "⇄", cls: "text-slate-500 font-bold"   },
  refund:   { arrow: "↺", cls: "text-amber-600 font-bold"   },
};
const TX_LABEL: Record<string, string> = {
  income: "Kirim", expense: "Chiqim", transfer: "Transfer",
  payment: "To'lov", salary: "Maosh", refund: "Qaytarish",
};
const STATUS_LABEL: Record<string, string> = {
  completed: "Bajarilgan", pending: "Kutilmoqda", cancelled: "Bekor", failed: "Xato",
};
const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-400", pending: "bg-amber-400",
  cancelled: "bg-slate-300",   failed: "bg-rose-400",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }
function weekStartStr() {
  const d = new Date(); const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff);
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
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CashRegistersPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id ?? "";

  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [txModal, setTxModal] = useState<FlowType | null>(null);
  const [registerDialog, setRegisterDialog] = useState<"create" | "edit" | null>(null);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [form, setForm] = useState<Omit<CreateCashRegisterRequest, "branch">>({
    name: "", description: "", location: "", is_active: true,
  });

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
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId, ordering: "name" }),
    enabled: !!branchId,
  });
  const registers = registersData?.results ?? [];

  useEffect(() => {
    if (registers.length === 0 || selectedRegister) return;
    const r = registers.find((x) => x.id === primaryId)
      ?? registers.find((x) => x.is_active) ?? registers[0];
    setSelectedRegister(r);
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
  const summaryIncome = summaryTx.filter((tx) => ["income","payment"].includes(tx.transaction_type)).reduce((s, tx) => s + tx.amount, 0);
  const summaryExpense = summaryTx.filter((tx) => ["expense","salary"].includes(tx.transaction_type)).reduce((s, tx) => s + tx.amount, 0);
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
  const deleteMutation = useMutation({
    mutationFn: financeApi.deleteCashRegister,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cash-registers"] }); toast.success("Kassa o'chirildi"); setSelectedRegister(null); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  function markPrimary(id: string) { localStorage.setItem(primaryKey(branchId), id); setPrimaryId(id); toast.success("Asosiy kassa belgilandi"); }
  function openCreate() { setForm({ name: "", description: "", location: "", is_active: true }); setEditingRegister(null); setRegisterDialog("create"); }
  function openEdit(r: CashRegister) { setForm({ name: r.name, description: r.description ?? "", location: r.location ?? "", is_active: r.is_active }); setEditingRegister(r); setRegisterDialog("edit"); }
  function handleDelete(r: CashRegister) { if (!confirm(`"${r.name}" kassasini o'chirishni tasdiqlaysizmi?`)) return; deleteMutation.mutate(r.id); }
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
      <div className="w-[260px] shrink-0 flex flex-col h-full bg-white border-r border-slate-200">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Kassalar</span>
            </div>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-slate-500 hover:text-slate-900" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />Yangi
            </Button>
          </div>
          {!registersLoading && <p className="text-xs text-slate-400 ml-9">{registers.length} ta kassa</p>}
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
          {registersLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)
          ) : registers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-xs font-medium text-slate-500 mb-3">Kassalar yo'q</p>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={openCreate}>
                <Plus className="w-3 h-3 mr-1" />Kassa qo'shish
              </Button>
            </div>
          ) : (
            registers.map((r) => (
              <RegisterCard
                key={r.id} register={r}
                selected={selectedRegister?.id === r.id} primary={r.id === primaryId}
                onSelect={() => setSelectedRegister(r)}
                onEdit={() => openEdit(r)} onDelete={() => handleDelete(r)} onMarkPrimary={() => markPrimary(r.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
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
            {/* ── REGISTER HEADER ── */}
            <div className="bg-white border-b border-slate-200 px-5 py-3.5 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-base font-bold text-slate-900">{selectedRegister.name}</h2>
                    {selectedRegister.location && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{selectedRegister.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">
                      {formatCurrency(selectedRegister.balance)}
                    </span>
                    {methodBalance && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-2 py-0.5 font-medium">
                          <Banknote className="w-3 h-3" />{formatCurrency(methodBalance.cash_net)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-2 py-0.5 font-medium">
                          <CreditCard className="w-3 h-3" />{formatCurrency(methodBalance.card_net)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button onClick={() => setTxModal("income")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-sm">
                    <ArrowUpRight className="w-3.5 h-3.5" />Kirim
                  </Button>
                  <Button onClick={() => setTxModal("expense")} className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-8 text-sm">
                    <ArrowDownRight className="w-3.5 h-3.5" />Chiqim
                  </Button>
                  <Button onClick={() => setTxModal("transfer")} variant="outline" className="border-slate-200 gap-1.5 h-8 text-sm text-slate-600">
                    <ArrowRightLeft className="w-3.5 h-3.5" />Transfer
                  </Button>
                </div>
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
              <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="px-5 py-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Jami kirim{summaryTotal > SUMMARY_PAGE_SIZE ? " ≈" : ""}</p>
                  <p className="text-sm font-bold tabular-nums text-emerald-600">+{formatCurrency(summaryIncome)}</p>
                </div>
                <div className="px-5 py-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Jami chiqim{summaryTotal > SUMMARY_PAGE_SIZE ? " ≈" : ""}</p>
                  <p className="text-sm font-bold tabular-nums text-rose-600">−{formatCurrency(summaryExpense)}</p>
                </div>
                <div className="px-5 py-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Sof balans</p>
                  <p className={cn("text-sm font-bold tabular-nums", summaryNet >= 0 ? "text-slate-900" : "text-rose-600")}>
                    {summaryNet >= 0 ? "+" : "−"}{formatCurrency(Math.abs(summaryNet))}
                  </p>
                </div>
              </div>
            )}

            {/* ── TABLE ── */}
            <div className="flex-1 overflow-auto">
              {txLoading ? (
                <div className="p-5 space-y-2">
                  {[...Array(10)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}
                </div>
              ) : visibleTx.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-24">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                    <SlidersHorizontal className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Tranzaksiya topilmadi</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {txTypeFilter !== "all" || methodFilter !== "all"
                      ? "Filtrlarga mos tranzaksiya yo'q"
                      : "Bu davr uchun tranzaksiya mavjud emas"}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      {[
                        { label: "Sana",         align: "left"  },
                        { label: "Tur",          align: "left"  },
                        { label: "Kategoriya",   align: "left"  },
                        { label: "Mijoz",        align: "left"  },
                        { label: "Usul",         align: "left"  },
                        { label: "Summa",        align: "right" },
                        { label: "Holat",        align: "right" },
                      ].map(({ label, align }) => (
                        <th key={label} className={cn(
                          "py-2.5 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap border-b border-slate-200 bg-slate-50",
                          align === "right" ? "text-right" : "text-left"
                        )}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTx.map((tx, idx) => (
                      <TransactionTableRow key={tx.id} tx={tx} isEven={idx % 2 === 0} />
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
                    return pages.map((p, idx) =>
                      p === "..." ? (
                        <span key={`e${idx}`} className="text-xs text-slate-400 px-1">...</span>
                      ) : (
                        <button key={p} onClick={() => setServerPage(p as number)}
                          className={cn("w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                            serverPage === p ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>
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
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-700">Faol kassa</span>
            </label>
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
  onClient: (c: ClientFilter) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-5 py-0 shrink-0">
      <div className="flex items-center h-12 gap-0 overflow-x-auto scrollbar-none">

        {/* Date presets */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-slate-200 mr-3 h-full shrink-0">
          {(["today", "week", "month"] as const).map((p) => {
            const labels = { today: "Bugun", week: "Hafta", month: "Oy" };
            return (
              <button
                key={p}
                onClick={() => onPreset(p)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activePreset === p
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Custom date range */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200 mr-3 shrink-0">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFrom(e.target.value)}
            className={cn(
              "h-7 text-xs border rounded-lg px-2 text-slate-700 bg-white focus:outline-none focus:ring-1 transition-colors cursor-pointer",
              activePreset ? "border-slate-200" : "border-slate-400 ring-1 ring-slate-300"
            )}
          />
          <span className="text-slate-300 text-xs select-none">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateTo(e.target.value)}
            className={cn(
              "h-7 text-xs border rounded-lg px-2 text-slate-700 bg-white focus:outline-none focus:ring-1 transition-colors cursor-pointer",
              activePreset ? "border-slate-200" : "border-slate-400 ring-1 ring-slate-300"
            )}
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-slate-200 mr-3 shrink-0">
          {(["all", "income", "expense", "transfer"] as TxTypeFilter[]).map((t) => {
            const labels: Record<TxTypeFilter, string> = { all: "Hammasi", income: "↓ Kirim", expense: "↑ Chiqim", transfer: "Transfer" };
            const activeColors: Record<TxTypeFilter, string> = {
              all: "bg-slate-800 text-white",
              income: "bg-emerald-600 text-white",
              expense: "bg-rose-600 text-white",
              transfer: "bg-blue-600 text-white",
            };
            return (
              <button
                key={t}
                onClick={() => onTxType(t)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  txTypeFilter === t ? activeColors[t] : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Method filter */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-slate-200 mr-3 shrink-0">
          {(["all", "cash", "card"] as MethodFilter[]).map((m) => {
            const labels: Record<MethodFilter, string> = { all: "Hammasi", cash: "Naqd", card: "Plastik" };
            const MIcon = m === "cash" ? Banknote : m === "card" ? CreditCard : null;
            return (
              <button
                key={m}
                onClick={() => onMethod(m)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  methodFilter === m ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                {MIcon && <MIcon className="w-3 h-3" />}
                {labels[m]}
              </button>
            );
          })}
        </div>

        {/* Client filter */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-slate-200 mr-3 shrink-0">
          {(["all", "student", "employee", "third_party"] as ClientFilter[]).map((c) => {
            const labels: Record<ClientFilter, string> = {
              all: "Barchasi",
              student: "O'quvchi",
              employee: "Xodim",
              third_party: "3-shaxs",
            };
            return (
              <button
                key={c}
                onClick={() => onClient(c)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  clientFilter === c ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                {labels[c]}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Count + refresh */}
        <span className="text-xs text-slate-400 tabular-nums mr-3 shrink-0">{totalCount} ta</span>
        <button
          onClick={onRefresh}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Register Card ─────────────────────────────────────────────────────────────

function RegisterCard({ register, selected, primary, onSelect, onEdit, onDelete, onMarkPrimary }: {
  register: CashRegister; selected: boolean; primary: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void; onMarkPrimary: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-150 border group",
        selected ? "bg-slate-900 border-slate-900 shadow-md shadow-slate-900/20" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {primary
            ? <Star className={cn("w-3.5 h-3.5 shrink-0 fill-current", selected ? "text-amber-400" : "text-amber-500")} />
            : <span className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", register.is_active ? (selected ? "bg-emerald-400" : "bg-emerald-500") : (selected ? "bg-slate-500" : "bg-slate-300"))} />
          }
          <p className={cn("text-sm font-semibold truncate", selected ? "text-white" : "text-slate-800")}>{register.name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className={cn("w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100", selected ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100")}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-sm">
            {!primary && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkPrimary(); }}>
                  <Star className="w-3.5 h-3.5 mr-2 text-amber-500" />Asosiy qilib belgilash
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit className="w-3.5 h-3.5 mr-2" />Tahrirlash</DropdownMenuItem>
            <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-3.5 h-3.5 mr-2" />O'chirish</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {register.location && (
        <p className={cn("text-xs flex items-center gap-1 mb-2 truncate", selected ? "text-slate-500" : "text-slate-400")}>
          <MapPin className="w-3 h-3 shrink-0" />{register.location}
        </p>
      )}
      <div className={cn("pt-2 border-t", selected ? "border-slate-700" : "border-slate-100")}>
        <p className={cn("text-base font-bold tabular-nums", selected ? "text-white" : "text-slate-900")}>{formatCurrency(register.balance)}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className={cn("text-xs", selected ? "text-slate-500" : "text-slate-400")}>Umumiy balans</p>
          {primary && (
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", selected ? "bg-amber-400/20 text-amber-300" : "bg-amber-50 text-amber-600")}>Asosiy</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Transaction Table Row — minimal ──────────────────────────────────────────

function TransactionTableRow({ tx, isEven }: { tx: Transaction; isEven: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isIncome  = ["income", "payment"].includes(tx.transaction_type);
  const isExpense = ["expense", "salary"].includes(tx.transaction_type);
  const txArrow = TX_ARROW[tx.transaction_type] ?? { arrow: "•", cls: "text-slate-400" };
  const label = TX_LABEL[tx.transaction_type] ?? tx.transaction_type_display;
  const statusLabel = STATUS_LABEL[tx.status] ?? tx.status_display;
  const statusDot   = STATUS_DOT[tx.status]   ?? "bg-slate-300";
  const { date, time } = fmtDateTime(tx.transaction_date);
  const whoLabel = tx.student?.full_name ?? tx.employee?.full_name ?? tx.third_party_name ?? "—";
  const hasDescription = !!tx.description;

  return (
    <>
      <tr
        onClick={() => hasDescription && setExpanded((v) => !v)}
        className={cn(
          "group transition-colors border-b border-slate-200",
          isEven ? "bg-white" : "bg-slate-50/60",
          hasDescription ? "cursor-pointer hover:bg-blue-50/30" : "hover:bg-blue-50/20",
        )}
      >
        {/* Sana */}
        <td className="py-3 px-4 whitespace-nowrap">
          <p className="text-sm font-medium text-slate-700">{date}</p>
          <p className="text-xs text-slate-400">{time}</p>
        </td>

        {/* Tur — arrow + text */}
        <td className="py-3 px-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-base leading-none", txArrow.cls)}>{txArrow.arrow}</span>
            <span className="text-sm text-slate-600">{label}</span>
          </div>
        </td>

        {/* Kategoriya */}
        <td className="py-3 px-4 max-w-[160px]">
          <p className="text-sm text-slate-700 truncate">{tx.category_name ?? "—"}</p>
          {tx.period_month && <p className="text-xs text-slate-400">{tx.period_month}</p>}
        </td>

        {/* Mijoz */}
        <td className="py-3 px-4 max-w-[160px]">
          <p className="text-sm text-slate-600 truncate">{whoLabel}</p>
        </td>

        {/* Usul — plain text */}
        <td className="py-3 px-4 whitespace-nowrap">
          <span className="text-sm text-slate-500">
            {tx.payment_method === "card" ? "Plastik" : "Naqd"}
          </span>
        </td>

        {/* Summa — only amount has color */}
        <td className="py-3 px-4 text-right whitespace-nowrap">
          <p className={cn(
            "text-sm font-semibold tabular-nums",
            isIncome  ? "text-emerald-600" :
            isExpense ? "text-rose-600"    : "text-slate-500"
          )}>
            {isIncome ? "+" : isExpense ? "−" : ""}{formatCurrency(tx.amount)}
          </p>
        </td>

        {/* Holat — dot + text + note indicator */}
        <td className="py-3 px-4 whitespace-nowrap">
          <div className="flex items-center justify-end gap-2">
            {hasDescription && (
              <span className={cn(
                "w-4 h-4 rounded flex items-center justify-center transition-colors",
                expanded ? "text-slate-500" : "text-slate-300 group-hover:text-slate-400"
              )}>
                {expanded ? <ChevronDown className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot)} />
              <span className="text-sm text-slate-500">{statusLabel}</span>
            </div>
          </div>
        </td>
      </tr>

      {/* Description expand row */}
      {expanded && hasDescription && (
        <tr className={cn("border-b border-slate-200", isEven ? "bg-slate-50" : "bg-slate-100/50")}>
          <td colSpan={7} className="px-4 pb-3 pt-1">
            <div className="flex items-start gap-2 pl-3">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">{tx.description}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
