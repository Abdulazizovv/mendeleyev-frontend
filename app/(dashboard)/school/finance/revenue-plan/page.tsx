"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import type { RevenuePlanStudent, RevenuePlanStudentStatus, RevenuePlanStudentClass } from "@/types/finance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Wallet,
  ReceiptText,
  GraduationCap,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} ming`;
  return n.toLocaleString("uz-UZ");
}

function fmtFull(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── status sort order (overdue first) ──────────────────────
const STATUS_SORT: Record<RevenuePlanStudentStatus, number> = {
  overdue: 0,
  unpaid: 1,
  partial: 2,
  paid: 3,
};

// ── status badge ────────────────────────────────────────────
const STATUS_CFG: Record<
  RevenuePlanStudentStatus,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  paid: { label: "To'landi", color: "text-emerald-700", bg: "bg-emerald-50", Icon: CheckCircle2 },
  partial: { label: "Qisman", color: "text-amber-700", bg: "bg-amber-50", Icon: Clock },
  unpaid: { label: "To'lanmagan", color: "text-slate-600", bg: "bg-slate-100", Icon: AlertCircle },
  overdue: { label: "Muddati o'tgan", color: "text-red-700", bg: "bg-red-50", Icon: AlertCircle },
};

function StatusBadge({ status }: { status: RevenuePlanStudentStatus }) {
  const cfg = STATUS_CFG[status];
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── summary card ────────────────────────────────────────────
function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── custom bar tooltip ──────────────────────────────────────
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      <p className="text-indigo-600">{fmtFull(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────
export default function RevenuePlanPage() {
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RevenuePlanStudentStatus | "all">("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  const isCurrent = month === currentMonth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["revenue-plan", month],
    queryFn: () => financeApi.getRevenuePlan({ month }),
    staleTime: 60_000,
  });

  const uniqueClasses = useMemo<RevenuePlanStudentClass[]>(() => {
    if (!data?.students) return [];
    const map = new Map<string, RevenuePlanStudentClass>();
    data.students.forEach((s) => {
      if (s.student_class) map.set(s.student_class.name, s.student_class);
    });
    return [...map.values()].sort(
      (a, b) => a.grade_level - b.grade_level || a.name.localeCompare(b.name)
    );
  }, [data?.students]);

  const filteredStudents = useMemo<RevenuePlanStudent[]>(() => {
    if (!data?.students) return [];
    return data.students
      .filter((s) => {
        const matchSearch =
          !search || s.student_name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || s.status === statusFilter;
        const matchClass =
          classFilter === "all" || s.student_class?.name === classFilter;
        return matchSearch && matchStatus && matchClass;
      })
      .sort((a, b) => {
        const statusDiff = STATUS_SORT[a.status] - STATUS_SORT[b.status];
        if (statusDiff !== 0) return statusDiff;
        return a.student_name.localeCompare(b.student_name, "uz");
      });
  }, [data?.students, search, statusFilter, classFilter]);

  const summary = data?.summary;
  const history = data?.monthly_history ?? [];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">Tushum rejasi</span>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => prevMonth(m))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[110px] text-center">
            {data?.month_label ?? month}
          </span>
          <button
            onClick={() => setMonth((m) => nextMonth(m))}
            disabled={isCurrent}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isCurrent && (
            <button
              onClick={() => setMonth(currentMonth())}
              className="ml-2 text-xs text-indigo-600 hover:underline"
            >
              Joriy oy
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Yuklanmoqda...
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center h-40 text-red-500 text-sm gap-2">
            <AlertCircle className="w-4 h-4" /> Ma'lumot yuklanmadi
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard
                icon={Target}
                label="Reja (kutilayotgan)"
                value={fmt(summary?.expected ?? 0)}
                sub={fmtFull(summary?.expected ?? 0)}
                color="bg-indigo-100 text-indigo-600"
              />
              <SummaryCard
                icon={TrendingUp}
                label="Haqiqiy tushum"
                value={fmt(summary?.collected ?? 0)}
                sub={fmtFull(summary?.collected ?? 0)}
                color="bg-emerald-100 text-emerald-600"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Yig'ilmagan"
                value={fmt(summary?.uncollected ?? 0)}
                sub={fmtFull(summary?.uncollected ?? 0)}
                color="bg-amber-100 text-amber-600"
              />
              <SummaryCard
                icon={ReceiptText}
                label="Umumiy qarz"
                value={fmt(summary?.total_debt ?? 0)}
                sub={fmtFull(summary?.total_debt ?? 0)}
                color="bg-red-100 text-red-600"
              />
              <SummaryCard
                icon={Wallet}
                label="To'lov foizi"
                value={`${summary?.collection_rate ?? 0}%`}
                color="bg-violet-100 text-violet-600"
              />
              <SummaryCard
                icon={Users}
                label="Faol abonentlar"
                value={`${summary?.active_subscriptions ?? 0} ta`}
                color="bg-sky-100 text-sky-600"
              />
            </div>

            {/* ── Collection rate bar ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Bajarilish darajasi</span>
                <span className="text-sm font-bold text-slate-800">
                  {summary?.collection_rate ?? 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(summary?.collection_rate ?? 0, 100)}%`,
                    background:
                      (summary?.collection_rate ?? 0) >= 80
                        ? "#10b981"
                        : (summary?.collection_rate ?? 0) >= 50
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* ── Monthly history chart ── */}
            {history.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-600 mb-3">
                  So'nggi 12 oy bo'yicha tushum
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={history} barSize={22} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month_label"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => v.split(" ")[0]}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => fmt(v)}
                      width={55}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="collected" radius={[4, 4, 0, 0]}>
                      {history.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.is_current ? "#6366f1" : "#c7d2fe"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  Binafsha — joriy oy
                </p>
              </div>
            )}

            {/* ── Students table ── */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* table toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="O'quvchi qidirish..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                {/* Sinf filtri */}
                {uniqueClasses.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-slate-700"
                    >
                      <option value="all">Barcha sinflar</option>
                      {uniqueClasses.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Holat filtri */}
                <div className="flex gap-1 flex-wrap">
                  {(["all", "overdue", "unpaid", "partial", "paid"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                        statusFilter === st
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {st === "all"
                        ? "Barchasi"
                        : STATUS_CFG[st as RevenuePlanStudentStatus].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left font-medium">O'quvchi</th>
                      <th className="px-4 py-2.5 text-left font-medium">Tarif</th>
                      <th className="px-4 py-2.5 text-right font-medium">Reja</th>
                      <th className="px-4 py-2.5 text-right font-medium">To'langan</th>
                      <th className="px-4 py-2.5 text-right font-medium">Qarzdorlik</th>
                      <th className="px-4 py-2.5 text-right font-medium">Haqdorlik</th>
                      <th className="px-4 py-2.5 text-center font-medium">Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                          O'quvchilar topilmadi
                        </td>
                      </tr>
                    )}
                    {filteredStudents.map((s) => (
                      <tr
                        key={s.student_id}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{s.student_name}</p>
                          {s.student_class && (
                            <p className="text-xs text-slate-400">{s.student_class.name}-sinf</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <p>{s.plan_name}</p>
                          <p className="text-xs text-slate-400">{s.plan_period}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {s.expected.toLocaleString("uz-UZ")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-700">
                          {s.collected.toLocaleString("uz-UZ")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">
                          {s.debt > 0 ? s.debt.toLocaleString("uz-UZ") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          {s.credit > 0 ? s.credit.toLocaleString("uz-UZ") : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {filteredStudents.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200 text-xs font-semibold text-slate-600">
                        <td className="px-4 py-2.5" colSpan={2}>
                          Jami ({filteredStudents.length} ta)
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {filteredStudents
                            .reduce((a, s) => a + s.expected, 0)
                            .toLocaleString("uz-UZ")}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-700">
                          {filteredStudents
                            .reduce((a, s) => a + s.collected, 0)
                            .toLocaleString("uz-UZ")}
                        </td>
                        <td className="px-4 py-2.5 text-right text-red-600">
                          {filteredStudents
                            .reduce((a, s) => a + s.debt, 0)
                            .toLocaleString("uz-UZ")}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600">
                          {filteredStudents
                            .reduce((a, s) => a + s.credit, 0)
                            .toLocaleString("uz-UZ")}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
