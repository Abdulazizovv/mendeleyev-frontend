"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, RefreshCw,
  ArrowRight, Banknote, CreditCard, BarChart3,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UZ_MONTHS_SHORT = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
const NOW = new Date();
const MONTH_START = new Date(NOW.getFullYear(), NOW.getMonth(), 1).toISOString().split("T")[0];
const CURRENT_MONTH = `${UZ_MONTHS[NOW.getMonth()]} ${NOW.getFullYear()}`;

function fmtMonth(iso: string) {
  const d = new Date(iso);
  return `${UZ_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
function fmtShort(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
}
function sign(n: number) { return n >= 0 ? "+" : ""; }

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center justify-between gap-3 mb-0.5">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: e.color }} />
            {e.name}
          </span>
          <span className="font-bold tabular-nums" style={{ color: e.color }}>
            {formatCurrency(e.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────

interface MetricProps {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  valueCls?: string;
}
function Metric({ label, value, sub, icon: Icon, iconBg, iconColor, valueCls = "text-gray-900" }: MetricProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 min-w-0">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-bold tabular-nums leading-none ${valueCls}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Category bar ──────────────────────────────────────────────────────────────

function CatBar({ name, total, maxTotal, color }: { name: string; total: number; maxTotal: number; color: string }) {
  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 truncate max-w-[55%]">{name}</span>
        <span className={`font-semibold tabular-nums ${color}`}>{formatCurrency(total)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color === "text-emerald-600" ? "#10b981" : "#ef4444" }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinanceStatisticsPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const [period, setPeriod] = useState<"month" | "all">("month");
  const startDate = period === "month" ? MONTH_START : undefined;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["finance-statistics-full", branchId, startDate],
    queryFn: () => financeApi.getStatistics({ branch_id: branchId, start_date: startDate }),
    enabled: !!branchId,
  });

  const s = data?.summary;
  const byMethod = data?.by_payment_method ?? {};
  const registers = data?.registers ?? [];
  const topIncome = data?.top_income_categories ?? [];
  const topExpense = data?.top_expense_categories ?? [];

  const monthlyData = (data?.monthly_stats ?? []).map(m => ({
    name: fmtMonth(m.month),
    Kirim: m.income ?? 0,
    Chiqim: m.expense ?? 0,
  }));

  // Payment methods
  const cashTotal = (byMethod.cash?.income ?? 0) + (byMethod.cash?.expense ?? 0);
  const cardTotal = (byMethod.card?.income ?? 0) + (byMethod.card?.expense ?? 0);
  const methodTotal = cashTotal + cardTotal || 1;
  const cashPct = Math.round((cashTotal / methodTotal) * 100);
  const cardPct = 100 - cashPct;

  // Kassalar total
  const kassaTotal = registers.reduce((acc, r) => acc + (r.balance ?? 0), 0);
  const kassaMax = Math.max(...registers.map(r => r.balance ?? 0), 1);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Moliya hisoboti</h1>
          <p className="text-xs text-gray-400 mt-0.5">{currentBranch?.branch_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["month", "all"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "month" ? CURRENT_MONTH : "Barcha vaqt"}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className={`p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors ${isFetching ? "animate-spin" : ""}`}
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/school/finance" className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0">
            Moliya <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Summary strip ── */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex divide-x divide-gray-100">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-1 flex items-center gap-3 px-5 py-4">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : s ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap divide-x divide-gray-100">
              <div className="flex-1 min-w-[140px]">
                <Metric
                  label="Jami kirim" value={formatCurrency(s.total_income)}
                  sub={`${s.payments_count} ta to'lov`}
                  icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600"
                  valueCls="text-emerald-700"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Metric
                  label="Jami chiqim" value={formatCurrency(s.total_expense)}
                  icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-500"
                  valueCls="text-red-600"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Metric
                  label="Sof balans"
                  value={`${sign(s.net_balance)}${formatCurrency(s.net_balance)}`}
                  icon={BarChart3}
                  iconBg={s.net_balance >= 0 ? "bg-blue-50" : "bg-orange-50"}
                  iconColor={s.net_balance >= 0 ? "text-blue-600" : "text-orange-500"}
                  valueCls={s.net_balance >= 0 ? "text-blue-700" : "text-orange-600"}
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Metric
                  label="Kassalar balansi" value={formatCurrency(s.total_cash_balance)}
                  sub={`${registers.length} ta kassa`}
                  icon={Wallet} iconBg="bg-purple-50" iconColor="text-purple-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Oylik grafik ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Oylik kirim va chiqim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : monthlyData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">
              Ma'lumot mavjud emas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={12} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="Kirim" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Chiqim" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Kassalar + To'lov usullari ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Kassalar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                Kassalar
              </CardTitle>
              {s && (
                <span className="text-xs font-semibold text-gray-500">
                  Jami: <span className="text-gray-900">{formatCurrency(kassaTotal)}</span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : registers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Kassalar yo'q</p>
            ) : (
              <div className="space-y-2.5">
                {registers.map(r => {
                  const pct = kassaMax > 0 ? Math.round(((r.balance ?? 0) / kassaMax) * 100) : 0;
                  return (
                    <div key={r.id} className="p-3.5 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                          {r.location && <p className="text-[11px] text-gray-400">{r.location}</p>}
                        </div>
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(r.balance ?? 0)}</p>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* To'lov usullari */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              To'lov usullari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : !s ? null : (
              <div className="space-y-3">
                {/* Naqd */}
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">Naqd pul</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 tabular-nums">{cashPct}%</span>
                  </div>
                  <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${cashPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-amber-700">
                    <span>Kirim: <b className="tabular-nums">{formatCurrency(s.cash_income)}</b></span>
                    <span>Chiqim: <b className="tabular-nums">{formatCurrency(s.cash_expense)}</b></span>
                    <span>Sof: <b className={`tabular-nums ${s.cash_net >= 0 ? "" : "text-red-600"}`}>{sign(s.cash_net)}{formatCurrency(s.cash_net)}</b></span>
                  </div>
                </div>

                {/* Plastik */}
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-800">Plastik karta</span>
                    </div>
                    <span className="text-xs font-bold text-purple-700 tabular-nums">{cardPct}%</span>
                  </div>
                  <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${cardPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-700">
                    <span>Kirim: <b className="tabular-nums">{formatCurrency(s.card_income)}</b></span>
                    <span>Chiqim: <b className="tabular-nums">{formatCurrency(s.card_expense)}</b></span>
                    <span>Sof: <b className={`tabular-nums ${s.card_net >= 0 ? "" : "text-red-600"}`}>{sign(s.card_net)}{formatCurrency(s.card_net)}</b></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Kategoriyalar ── */}
      {(topIncome.length > 0 || topExpense.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Kirim kategoriyalari */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Kirim kategoriyalari
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topIncome.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Kategoriyalar yo'q</p>
              ) : (
                <div className="space-y-3">
                  {topIncome.slice(0, 5).map((c, i) => (
                    <CatBar key={i} name={c.category__name} total={c.total} maxTotal={topIncome[0]?.total ?? 1} color="text-emerald-600" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chiqim kategoriyalari */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Chiqim kategoriyalari
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topExpense.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Kategoriyalar yo'q</p>
              ) : (
                <div className="space-y-3">
                  {topExpense.slice(0, 5).map((c, i) => (
                    <CatBar key={i} name={c.category__name} total={c.total} maxTotal={topExpense[0]?.total ?? 1} color="text-red-500" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
