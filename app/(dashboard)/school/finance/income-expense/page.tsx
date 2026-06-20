"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp, TrendingDown, ArrowRightLeft, RotateCcw,
  Banknote, CreditCard, Building2, Calendar, Receipt,
  ChevronLeft, ChevronRight, User,
} from "lucide-react";
import { TransactionDetailSheet } from "@/components/finance/transactions/TransactionDetailSheet";
import type { Transaction } from "@/types/finance";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];

function monthStart(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}
function monthEnd(y: number, m: number) {
  const last = new Date(y, m + 1, 0).getDate();
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}
function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, {
  label: string; color: string; textCls: string; bgCls: string; borderCls: string;
  Icon: React.ElementType; sign: "+" | "−" | "⇄";
}> = {
  income:   { label: "Kirim",      color: "#10b981", textCls: "text-emerald-600", bgCls: "bg-emerald-50",  borderCls: "border-emerald-200", Icon: TrendingUp,     sign: "+" },
  payment:  { label: "To'lov",     color: "#059669", textCls: "text-emerald-700", bgCls: "bg-emerald-50",  borderCls: "border-emerald-200", Icon: TrendingUp,     sign: "+" },
  expense:  { label: "Chiqim",     color: "#f43f5e", textCls: "text-rose-600",    bgCls: "bg-rose-50",     borderCls: "border-rose-200",    Icon: TrendingDown,   sign: "−" },
  salary:   { label: "Maosh",      color: "#f59e0b", textCls: "text-amber-600",   bgCls: "bg-amber-50",    borderCls: "border-amber-200",   Icon: TrendingDown,   sign: "−" },
  transfer: { label: "O'tkazma",   color: "#3b82f6", textCls: "text-blue-600",    bgCls: "bg-blue-50",     borderCls: "border-blue-200",    Icon: ArrowRightLeft, sign: "⇄" },
  refund:   { label: "Qaytarish",  color: "#f97316", textCls: "text-orange-600",  bgCls: "bg-orange-50",   borderCls: "border-orange-200",  Icon: RotateCcw,      sign: "+" },
};

const METHOD_CFG: Record<string, { label: string; Icon: React.ElementType; cls: string }> = {
  cash: { label: "Naqd",    Icon: Banknote,   cls: "bg-amber-50 text-amber-700 border-amber-200"     },
  card: { label: "Plastik", Icon: CreditCard, cls: "bg-blue-50 text-blue-700 border-blue-200"        },
  bank: { label: "Bank",    Icon: Building2,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const UZ_MONTH_NAMES: Record<string, string> = {
  "01":"Yanvar","02":"Fevral","03":"Mart","04":"Aprel",
  "05":"May","06":"Iyun","07":"Iyul","08":"Avgust",
  "09":"Sentabr","10":"Oktabr","11":"Noyabr","12":"Dekabr",
};

// Kategoriya diagrammasi uchun rang palitasi
const CAT_PALETTE = [
  "#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444",
  "#06b6d4","#f97316","#84cc16","#ec4899","#6366f1",
  "#14b8a6","#a855f7","#eab308","#64748b","#0ea5e9",
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-semibold text-slate-800">{name}</span>
      </div>
      <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(value)}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncomeExpensePage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const dateFrom = monthStart(viewYear, viewMonth);
  const dateTo   = monthEnd(viewYear, viewMonth);

  const { data, isLoading } = useQuery({
    queryKey: ["income-expense", branchId, dateFrom, dateTo],
    queryFn: () => financeApi.getTransactions({
      branch_id: branchId,
      date_from: dateFrom,
      date_to: dateTo,
      status: "completed",
      page_size: 1000,
      ordering: "-transaction_date",
    } as any),
    enabled: !!branchId,
  });

  const allTx: Transaction[] = useMemo(() => (data as any)?.results ?? [], [data]);

  // Tur bo'yicha guruh
  const byType = useMemo(() => {
    const map: Record<string, { total: number; txs: Transaction[] }> = {};
    for (const tx of allTx) {
      const t = tx.transaction_type;
      if (!map[t]) map[t] = { total: 0, txs: [] };
      map[t].total += tx.amount;
      map[t].txs.push(tx);
    }
    return map;
  }, [allTx]);

  // Tur → kategoriya guruh ("" = kategoriyasiz)
  const byTypeAndCategory = useMemo(() => {
    const result: Record<string, Record<string, { total: number; txs: Transaction[] }>> = {};
    for (const tx of allTx) {
      const t = tx.transaction_type;
      const cat = tx.category_name ?? "";
      if (!result[t]) result[t] = {};
      if (!result[t][cat]) result[t][cat] = { total: 0, txs: [] };
      result[t][cat].total += tx.amount;
      result[t][cat].txs.push(tx);
    }
    return result;
  }, [allTx]);

  // Kategoriyalari bor turlar
  const typesWithCategories = useMemo(() => {
    const s = new Set<string>();
    for (const [type, cats] of Object.entries(byTypeAndCategory)) {
      if (Object.keys(cats).some(k => k !== "")) s.add(type);
    }
    return s;
  }, [byTypeAndCategory]);

  // Jami kirим / chiqim
  const totalIncome = useMemo(() =>
    allTx.filter(t => ["income","payment","refund"].includes(t.transaction_type))
         .reduce((s, t) => s + t.amount, 0), [allTx]);

  const totalExpense = useMemo(() =>
    allTx.filter(t => ["expense","salary"].includes(t.transaction_type))
         .reduce((s, t) => s + t.amount, 0), [allTx]);

  // Diagramma ma'lumotlari — tur tanlanganda kategoriyalar ko'rsatiladi
  const activeChartData = useMemo(() => {
    if (!selectedType) {
      return Object.entries(byType)
        .filter(([type]) => type !== "transfer")
        .map(([type, { total }]) => ({
          name: TYPE_CFG[type]?.label ?? type,
          value: total,
          key: type,
          color: TYPE_CFG[type]?.color ?? "#94a3b8",
        }))
        .sort((a, b) => b.value - a.value);
    }
    // Tanlangan turning kategoriya bo'yicha taqsimoti
    const cats = byTypeAndCategory[selectedType] ?? {};
    const named = Object.entries(cats)
      .filter(([cat]) => cat !== "")
      .sort((a, b) => b[1].total - a[1].total);
    const uncategorised = cats[""]?.total ?? 0;

    const items = named.map(([cat, { total }], i) => ({
      name: cat,
      value: total,
      key: cat,
      color: CAT_PALETTE[i % CAT_PALETTE.length],
    }));
    if (uncategorised > 0) {
      items.push({ name: "Boshqa", value: uncategorised, key: "", color: "#94a3b8" });
    }
    return items;
  }, [selectedType, byType, byTypeAndCategory]);

  // Ko'rsatiladigan tranzaksiyalar (View 3)
  const shownTxs = useMemo(() => {
    if (!selectedType) return allTx;
    if (selectedCategory !== null) {
      return byTypeAndCategory[selectedType]?.[selectedCategory]?.txs ?? [];
    }
    if (!typesWithCategories.has(selectedType)) {
      return byType[selectedType]?.txs ?? [];
    }
    return [];
  }, [selectedType, selectedCategory, byTypeAndCategory, byType, allTx, typesWithCategories]);

  function selectType(type: string) {
    setSelectedType(type);
    setSelectedCategory(null);
  }

  function goBackFromCategories() {
    setSelectedType(null);
    setSelectedCategory(null);
  }

  function goBackFromTransactions() {
    if (selectedType && typesWithCategories.has(selectedType)) {
      setSelectedCategory(null);
    } else {
      setSelectedType(null);
      setSelectedCategory(null);
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedType(null);
    setSelectedCategory(null);
  }
  function nextMonth() {
    const isCurrent = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    if (isCurrent) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedType(null);
    setSelectedCategory(null);
  }
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // Diagramma uchun jami qiymat (foiz hisoblash)
  const chartTotal = activeChartData.reduce((s, e) => s + e.value, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Kirim-Chiqim</h1>
            <p className="text-xs text-slate-400 mt-0.5">Bajarilgan tranzaksiyalar tahlili</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-800 px-3 min-w-[130px] text-center">
              {UZ_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                isCurrentMonth
                  ? "text-slate-300 cursor-not-allowed"
                  : "hover:bg-white hover:shadow-sm text-slate-500"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Skeleton className="rounded-2xl h-full min-h-[500px]" />
          <Skeleton className="rounded-2xl h-full" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

          {/* ── LEFT: Summary + Dynamic Chart ── */}
          <div className="flex flex-col gap-4 overflow-y-auto">

            {/* Jami kartalar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-emerald-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Jami kirim</span>
                </div>
                <p className="text-xl font-black text-emerald-600 tabular-nums">
                  +{formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-rose-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Jami chiqim</span>
                </div>
                <p className="text-xl font-black text-rose-600 tabular-nums">
                  −{formatCurrency(totalExpense)}
                </p>
              </div>
            </div>

            {/* Sof natija */}
            <div className={cn(
              "rounded-xl border p-4 text-center",
              totalIncome - totalExpense >= 0
                ? "bg-emerald-50 border-emerald-100"
                : "bg-rose-50 border-rose-100"
            )}>
              <p className="text-xs font-medium text-slate-500 mb-1">Sof natija</p>
              <p className={cn(
                "text-2xl font-black tabular-nums",
                totalIncome - totalExpense >= 0 ? "text-emerald-700" : "text-rose-700"
              )}>
                {totalIncome - totalExpense >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(totalIncome - totalExpense))}
              </p>
            </div>

            {/* Dinamik diagramma */}
            {activeChartData.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                {/* Diagramma sarlavhasi */}
                <div className="flex items-center gap-2 mb-3">
                  {selectedType && (
                    <button
                      onClick={goBackFromCategories}
                      className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex-1">
                    {selectedType
                      ? `${TYPE_CFG[selectedType]?.label ?? selectedType} · taqsimot`
                      : "Taqsimot"}
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={activeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={82}
                      paddingAngle={2}
                      dataKey="value"
                      onClick={(entry: any) => {
                        if (!selectedType) {
                          // Tur tanlash
                          selectType(entry.key);
                        } else {
                          // Kategoriya tanlash → View 3
                          setSelectedCategory(entry.key);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {activeChartData.map((entry) => {
                        const isActive = selectedType
                          ? selectedCategory === null || selectedCategory === entry.key
                          : !selectedType || selectedType === entry.key;
                        return (
                          <Cell
                            key={entry.key}
                            fill={entry.color}
                            opacity={isActive ? 1 : 0.35}
                            stroke={selectedCategory === entry.key ? "#1e293b" : "transparent"}
                            strokeWidth={selectedCategory === entry.key ? 2 : 0}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="space-y-1.5 mt-2">
                  {activeChartData.map((entry) => {
                    const p = chartTotal > 0 ? Math.round((entry.value / chartTotal) * 100) : 0;
                    const isActive = selectedCategory === null || selectedCategory === entry.key;
                    return (
                      <button
                        key={entry.key}
                        onClick={() => {
                          if (!selectedType) {
                            selectType(entry.key);
                          } else {
                            setSelectedCategory(selectedCategory === entry.key ? null : entry.key);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left",
                          !isActive && "opacity-40",
                          selectedCategory === entry.key
                            ? "bg-slate-100 ring-1 ring-slate-300"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.color }} />
                        <span className="text-xs font-medium text-slate-700 flex-1 truncate">{entry.name}</span>
                        <span className="text-[11px] text-slate-400">{p}%</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          {formatCurrency(entry.value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex-1">
                <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Bu oy tranzaksiya mavjud emas</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: 3 bosqichli navigatsiya ── */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">

            {/* ── View 1: Tranzaksiya guruhlari ── */}
            {!selectedType && (
              <>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">Tranzaksiya guruhlari</span>
                  <span className="text-xs text-slate-400">({allTx.length} ta)</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {Object.entries(byType).length === 0 ? (
                    <div className="py-16 text-center">
                      <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Bu oy tranzaksiya yo'q</p>
                    </div>
                  ) : (
                    Object.entries(byType)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([type, { total, txs }]) => {
                        const cfg = TYPE_CFG[type];
                        if (!cfg) return null;
                        const hasCats = typesWithCategories.has(type);
                        return (
                          <button
                            key={type}
                            onClick={() => selectType(type)}
                            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left group"
                          >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bgCls)}>
                              <cfg.Icon className={cn("w-5 h-5", cfg.textCls)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {hasCats
                                  ? `${Object.keys(byTypeAndCategory[type] ?? {}).filter(k => k !== "").length} tur · ${txs.length} ta`
                                  : `${txs.length} ta tranzaksiya`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn("text-sm font-bold tabular-nums", cfg.textCls)}>
                                {cfg.sign}{formatCurrency(total)}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                          </button>
                        );
                      })
                  )}
                </div>
              </>
            )}

            {/* ── View 2: Tranzaksiya turlari (kategoriyalar) ── */}
            {selectedType && typesWithCategories.has(selectedType) && selectedCategory === null && (
              <>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
                  <button
                    onClick={goBackFromCategories}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: TYPE_CFG[selectedType]?.color }}
                  />
                  <span className="text-sm font-semibold text-slate-800 flex-1">
                    {TYPE_CFG[selectedType]?.label} · Tranzaksiya turlari
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {byType[selectedType]?.txs.length ?? 0} ta
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {Object.entries(byTypeAndCategory[selectedType] ?? {})
                    .filter(([cat]) => cat !== "")
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([cat, { total, txs }], i) => {
                      const cfg = TYPE_CFG[selectedType];
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left group"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: CAT_PALETTE[i % CAT_PALETTE.length] + "20" }}
                          >
                            <cfg.Icon
                              className="w-5 h-5"
                              style={{ color: CAT_PALETTE[i % CAT_PALETTE.length] }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{cat}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{txs.length} ta tranzaksiya</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("text-sm font-bold tabular-nums", cfg?.textCls)}>
                              {cfg?.sign}{formatCurrency(total)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                        </button>
                      );
                    })}
                  {(byTypeAndCategory[selectedType]?.[""]?.txs.length ?? 0) > 0 && (
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
                        <Receipt className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Boshqa</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {byTypeAndCategory[selectedType]?.[""]?.txs.length ?? 0} ta tranzaksiya
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums text-slate-600">
                          {formatCurrency(byTypeAndCategory[selectedType]?.[""]?.total ?? 0)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── View 3: Tranzaksiyalar (jadval) ── */}
            {selectedType && (!typesWithCategories.has(selectedType) || selectedCategory !== null) && (
              <>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
                  <button
                    onClick={goBackFromTransactions}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: TYPE_CFG[selectedType]?.color }}
                  />
                  <span className="text-sm font-semibold text-slate-800 flex-1 truncate">
                    {selectedCategory !== null && selectedCategory !== ""
                      ? selectedCategory
                      : selectedCategory === ""
                        ? "Boshqa"
                        : TYPE_CFG[selectedType]?.label}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {shownTxs.length} ta · {TYPE_CFG[selectedType]?.sign}{formatCurrency(
                      selectedCategory !== null
                        ? (byTypeAndCategory[selectedType]?.[selectedCategory]?.total ?? 0)
                        : (byType[selectedType]?.total ?? 0)
                    )}
                  </span>
                </div>

                {shownTxs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Tranzaksiya yo'q</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Sana</th>
                          <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Tur</th>
                          <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Shaxs</th>
                          <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Usul</th>
                          <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Izoh</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">Summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownTxs.map((tx) => (
                          <TxTableRow key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

      <TransactionDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}

// ── Jadval qatori ─────────────────────────────────────────────────────────────

function TxTableRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const cfg  = TYPE_CFG[tx.transaction_type] ?? TYPE_CFG.income;
  const mCfg = METHOD_CFG[tx.payment_method];

  const periods: string[] = (tx.period_months?.length ?? 0) > 0
    ? (tx.period_months as string[])
    : tx.period_month ? [tx.period_month] : [];

  const person = tx.student?.full_name ?? tx.employee?.full_name ?? null;

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      {/* Sana */}
      <td className="px-4 py-2.5 whitespace-nowrap">
        <span className="text-xs text-slate-500">{fmtDate(tx.transaction_date)}</span>
      </td>

      {/* Tur / Kategoriya */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", cfg.bgCls)}>
            <cfg.Icon className={cn("w-3 h-3", cfg.textCls)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate max-w-[120px]">
              {tx.category_name ?? cfg.label}
            </p>
            {periods.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {periods.slice(0, 2).map((ym) => (
                  <span key={ym} className="text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-px rounded">
                    {UZ_MONTH_NAMES[ym.split("-")[1]] ?? ym}
                  </span>
                ))}
                {periods.length > 2 && (
                  <span className="text-[9px] text-slate-400">+{periods.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Shaxs */}
      <td className="px-3 py-2.5">
        {person ? (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 truncate max-w-[110px]">{person}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Usul */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        {mCfg ? (
          <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium border px-1.5 py-0.5 rounded-full", mCfg.cls)}>
            <mCfg.Icon className="w-2.5 h-2.5" />
            {mCfg.label}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Izoh */}
      <td className="px-3 py-2.5">
        {tx.description ? (
          <span className="text-xs text-slate-500 truncate max-w-[150px] block" title={tx.description}>
            {tx.description}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Summa */}
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        <span className={cn("text-sm font-bold tabular-nums", cfg.textCls)}>
          {cfg.sign}{formatCurrency(tx.amount)}
        </span>
      </td>
    </tr>
  );
}
