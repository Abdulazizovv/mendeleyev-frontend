"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  GraduationCap,
  BarChart3,
  PieChartIcon,
  ArrowRight,
  Wallet,
  Users,
  RefreshCw,
} from "lucide-react";

// ── Uzbek formatters ──────────────────────────────────────────────────────────

const UZ_MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

function fmtMonth(isoStr: string): string {
  const d = new Date(isoStr);
  return `${UZ_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDay(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getDate()}-${UZ_MONTHS_SHORT[d.getMonth()]}`;
}

function fmtCurrencyShort(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
}

const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];
const NOW = new Date();
const MONTH_START = new Date(NOW.getFullYear(), NOW.getMonth(), 1).toISOString().split("T")[0];
const CURRENT_MONTH = `${UZ_MONTHS[NOW.getMonth()]} ${NOW.getFullYear()}`;

// ── Color palette ─────────────────────────────────────────────────────────────

const COLORS = {
  income: "#10b981",
  expense: "#ef4444",
  net: "#3b82f6",
  cash: "#f59e0b",
  card: "#8b5cf6",
};

const PIE_COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16"];

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title, value, subtitle, icon: Icon, iconBg, iconColor, trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend === "up" ? "bg-emerald-100 text-emerald-700"
              : trend === "down" ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
            }`}>
              {trend === "up" ? "▲ Daromad" : trend === "down" ? "▼ Zarar" : "Teng"}
            </span>
          )}
        </div>
        <p className="text-xl font-bold text-gray-900 tabular-nums leading-tight">{value}</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1.5">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
        <Skeleton className="h-6 w-32 mb-1.5" />
        <Skeleton className="h-3 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FinanceStatisticsPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const [period, setPeriod] = useState<"month" | "all">("month");

  const startDate = period === "month" ? MONTH_START : undefined;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["finance-statistics-full", branchId, startDate],
    queryFn: () => financeApi.getStatistics({ branch_id: branchId, start_date: startDate }),
    enabled: !!branchId,
  });

  const s = data?.summary;
  const byMethod = data?.by_payment_method ?? {};
  const byType = data?.by_transaction_type ?? {};
  const monthlyStats = (data?.monthly_stats ?? []).map(m => ({
    name: fmtMonth(m.month),
    Kirim: m.income ?? 0,
    Chiqim: m.expense ?? 0,
    Balans: (m.income ?? 0) - (m.expense ?? 0),
  }));
  const dailyStats = (data?.daily_stats ?? []).map(d => ({
    name: fmtDay(d.day),
    Kirim: d.income ?? 0,
    Chiqim: d.expense ?? 0,
  }));
  const topIncome = data?.top_income_categories ?? [];
  const topExpense = data?.top_expense_categories ?? [];
  const registers = data?.registers ?? [];

  // Pie chart data for payment method
  const methodPieData = Object.entries(byMethod).map(([key, val]) => ({
    name: val.label,
    value: val.income + val.expense,
    income: val.income,
    expense: val.expense,
  })).filter(d => d.value > 0);

  // Pie chart data for transaction type
  const typePieData = Object.entries(byType)
    .map(([, val]) => ({ name: val.label, value: val.total }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moliya Statistikasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentBranch?.branch_name} — professional hisobotlar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["month", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "month" ? `${CURRENT_MONTH}` : "Barcha vaqt"}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/school/finance"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Moliya <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [1,2,3,4].map(i => <CardSkeleton key={i} />)
        ) : s ? (
          <>
            <SummaryCard
              title="Jami kirim"
              value={formatCurrency(s.total_income)}
              subtitle={`${s.payments_count} ta to'lov`}
              icon={TrendingUp}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              trend="up"
            />
            <SummaryCard
              title="Jami chiqim"
              value={formatCurrency(s.total_expense)}
              icon={TrendingDown}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              trend="down"
            />
            <SummaryCard
              title="Sof balans"
              value={formatCurrency(s.net_balance)}
              subtitle={s.net_balance >= 0 ? "Musbat balans" : "Manfiy balans"}
              icon={BarChart3}
              iconBg={s.net_balance >= 0 ? "bg-blue-100" : "bg-orange-100"}
              iconColor={s.net_balance >= 0 ? "text-blue-600" : "text-orange-600"}
              trend={s.net_balance >= 0 ? "up" : "down"}
            />
            <SummaryCard
              title="O'quvchi to'lovlari"
              value={formatCurrency(s.total_payments)}
              subtitle={`${s.payments_count} ta to'lov`}
              icon={GraduationCap}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
            />
          </>
        ) : null}
      </div>

      {/* ── Naqd / Plastik summary strip ── */}
      {!isLoading && s && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Naqd */}
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Naqd pul</span>
                </div>
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                  {byMethod.cash?.count ?? 0} ta tranzaksiya
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Kirim</p>
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(s.cash_income)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Chiqim</p>
                  <p className="text-sm font-bold text-red-600 tabular-nums">{formatCurrency(s.cash_expense)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Sof</p>
                  <p className={`text-sm font-bold tabular-nums ${s.cash_net >= 0 ? "text-blue-700" : "text-red-600"}`}>
                    {s.cash_net >= 0 ? "+" : ""}{formatCurrency(s.cash_net)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Plastik */}
          <Card className="border-purple-200 bg-purple-50/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Plastik karta</span>
                </div>
                <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                  {byMethod.card?.count ?? 0} ta tranzaksiya
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Kirim</p>
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(s.card_income)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Chiqim</p>
                  <p className="text-sm font-bold text-red-600 tabular-nums">{formatCurrency(s.card_expense)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Sof</p>
                  <p className={`text-sm font-bold tabular-nums ${s.card_net >= 0 ? "text-blue-700" : "text-red-600"}`}>
                    {s.card_net >= 0 ? "+" : ""}{formatCurrency(s.card_net)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Kassalar holati ── */}
      {!isLoading && registers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-500" />
              Kassalar holati
              <span className="text-xs font-normal text-gray-400 ml-auto">Jami: {formatCurrency(s?.total_cash_balance ?? 0)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {registers.map(r => {
                const total = Math.abs(r.cash_net) + Math.abs(r.card_net) || 1;
                const cashPct = Math.round((Math.abs(r.cash_net) / total) * 100);
                const cardPct = 100 - cashPct;
                return (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                        {r.location && <p className="text-xs text-gray-400 mt-0.5">{r.location}</p>}
                      </div>
                      <p className="text-base font-bold text-gray-900 tabular-nums">{formatCurrency(r.balance)}</p>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                        <div className="bg-amber-400 rounded-l-full transition-all" style={{ width: `${cashPct}%` }} />
                        <div className="bg-purple-400 rounded-r-full transition-all" style={{ width: `${cardPct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-amber-700">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                          Naqd: {formatCurrency(r.cash_net)}
                        </span>
                        <span className="flex items-center gap-1 text-purple-700">
                          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                          Plastik: {formatCurrency(r.card_net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Oylik va kunlik ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Oylik bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Oylik kirim va chiqim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full rounded-xl" />
            ) : monthlyStats.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Ma'lumot mavjud emas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyStats} barSize={14} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtCurrencyShort} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Kirim" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chiqim" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* To'lov usullari pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-500" />
              To&apos;lov usullari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : methodPieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                Ma&apos;lumot mavjud emas
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={methodPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={60}
                      dataKey="value"
                      strokeWidth={2}
                    >
                      {methodPieData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.name === "Naqd pul" ? COLORS.cash : COLORS.card}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(Number(val))}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2">
                  {methodPieData.map((entry) => {
                    const color = entry.name === "Naqd pul" ? COLORS.cash : COLORS.card;
                    const total = methodPieData.reduce((acc, d) => acc + d.value, 0) || 1;
                    const pct = Math.round((entry.value / total) * 100);
                    return (
                      <div key={entry.name}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="flex items-center gap-1.5 text-gray-600">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                            {entry.name}
                          </span>
                          <span className="font-bold tabular-nums" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Kunlik trend ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            So'nggi 30 kunlik trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : dailyStats.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              Shu davrda ma'lumot yo'q
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmtCurrencyShort} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Kirim" stroke={COLORS.income} strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
                <Area type="monotone" dataKey="Chiqim" stroke={COLORS.expense} strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Tranzaksiya turlari + Kategoriyalar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tranzaksiya turlari — pie + table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-500" />
              Tranzaksiya turlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : typePieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Ma'lumot mavjud emas
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={typePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={60}
                      dataKey="value"
                      strokeWidth={2}
                    >
                      {typePieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {typePieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-gray-800">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kirim/Chiqim kategoriyalari */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Top kategoriyalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                {topIncome.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Kirim kategoriyalari</p>
                    {topIncome.slice(0, 4).map((c, i) => {
                      const pct = topIncome[0]?.total ? Math.round((c.total / topIncome[0].total) * 100) : 0;
                      return (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-gray-600 truncate max-w-[150px]">{c.category__name}</span>
                            <span className="font-bold text-emerald-700 tabular-nums shrink-0 ml-2">{formatCurrency(c.total)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {topExpense.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Chiqim kategoriyalari</p>
                    {topExpense.slice(0, 4).map((c, i) => {
                      const pct = topExpense[0]?.total ? Math.round((c.total / topExpense[0].total) * 100) : 0;
                      return (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-gray-600 truncate max-w-[150px]">{c.category__name}</span>
                            <span className="font-bold text-red-600 tabular-nums shrink-0 ml-2">{formatCurrency(c.total)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {topIncome.length === 0 && topExpense.length === 0 && (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    Kategoriyali tranzaksiyalar yo'q
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Oylik jadval ── */}
      {monthlyStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              Oylik moliya jadvali
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Oy</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-emerald-600 uppercase">Kirim</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-red-600 uppercase">Chiqim</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-blue-600 uppercase">Sof balans</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((row, i) => {
                    const bal = row.Balans;
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-5 font-medium text-gray-800">{row.name}</td>
                        <td className="text-right py-3 px-5 text-emerald-600 font-semibold tabular-nums">
                          +{formatCurrency(row.Kirim)}
                        </td>
                        <td className="text-right py-3 px-5 text-red-600 font-semibold tabular-nums">
                          −{formatCurrency(row.Chiqim)}
                        </td>
                        <td className={`text-right py-3 px-5 font-bold tabular-nums ${bal >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                          {bal >= 0 ? "+" : ""}{formatCurrency(bal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {monthlyStats.length > 1 && s && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="py-3 px-5 font-bold text-gray-800 text-xs uppercase">Jami</td>
                      <td className="text-right py-3 px-5 font-bold text-emerald-700 tabular-nums">
                        +{formatCurrency(s.total_income)}
                      </td>
                      <td className="text-right py-3 px-5 font-bold text-red-700 tabular-nums">
                        −{formatCurrency(s.total_expense)}
                      </td>
                      <td className={`text-right py-3 px-5 font-bold tabular-nums ${s.net_balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                        {s.net_balance >= 0 ? "+" : ""}{formatCurrency(s.net_balance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
