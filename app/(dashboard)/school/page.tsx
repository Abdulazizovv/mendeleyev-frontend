"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useDashboardStatistics,
  useTodaysLessons,
  useDashboardFinanceStats,
  useDashboardRecentTransactions,
} from "@/lib/hooks/dashboard";
import { formatCurrency, formatRelativeDate } from "@/lib/translations";
import type { BranchType } from "@/types/auth";
import type { Transaction } from "@/types/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  User,
  MapPin,
  ArrowRight,
  UserPlus,
  CreditCard,
  BarChart3,
  Calendar,
  ClipboardList,
  Award,
  Building2,
  CheckCircle2,
  Zap,
  Wallet,
  Banknote,
  RotateCcw,
  ArrowLeftRight,
  Receipt,
  CircleAlert,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UZ_DAYS = [
  "Yakshanba", "Dushanba", "Seshanba", "Chorshanba",
  "Payshanba", "Juma", "Shanba",
];
const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 17) return "Xayrli kun";
  if (h < 21) return "Xayrli kechki";
  return "Xayrli tun";
}

function getTodayLabel(): string {
  const d = new Date();
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${UZ_DAYS[d.getDay()]}`;
}

function getCurrentMonthLabel(): string {
  const d = new Date();
  return `${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const LESSON_STATUS: Record<string, { label: string; cls: string }> = {
  planned:     { label: "Rejada",        cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  in_progress: { label: "Davom etmoqda", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  completed:   { label: "Tugallandi",    cls: "bg-gray-100 text-gray-500 border border-gray-200" },
  cancelled:   { label: "Bekor",         cls: "bg-red-50 text-red-600 border border-red-200" },
};

const LESSON_STATUS_ORDER: Record<string, number> = {
  in_progress: 0, planned: 1, completed: 2, cancelled: 3,
};

function fmt(t: string) {
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

// Transaction type config
const TX_TYPE: Record<string, { label: string; icon: React.ElementType; iconCls: string; amountCls: string; sign: string }> = {
  income:   { label: "Kirim",     icon: TrendingUp,      iconCls: "text-emerald-600", amountCls: "text-emerald-700", sign: "+" },
  expense:  { label: "Chiqim",    icon: TrendingDown,    iconCls: "text-red-500",     amountCls: "text-red-600",     sign: "−" },
  payment:  { label: "To'lov",    icon: CreditCard,      iconCls: "text-blue-600",    amountCls: "text-blue-700",    sign: "+" },
  salary:   { label: "Maosh",     icon: Users,           iconCls: "text-orange-600",  amountCls: "text-orange-700",  sign: "−" },
  refund:   { label: "Qaytarish", icon: RotateCcw,       iconCls: "text-purple-600",  amountCls: "text-purple-700",  sign: "+" },
  transfer: { label: "O'tkazma",  icon: ArrowLeftRight,  iconCls: "text-gray-600",    amountCls: "text-gray-700",    sign: "" },
};

// ── Quick actions ─────────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  soon?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "O'quvchi qo'shish",   href: "/school/students",            icon: UserPlus,      color: "text-blue-600",    bg: "bg-blue-50 hover:bg-blue-100" },
  { label: "To'lov qabul qilish", href: "/school/finance/payments",    icon: CreditCard,    color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100" },
  { label: "Davomat belgilash",   href: "/school/attendance",          icon: ClipboardList, color: "text-purple-600",  bg: "bg-purple-50 hover:bg-purple-100", soon: true },
  { label: "Baholar",             href: "/school/grades",              icon: Award,         color: "text-orange-600",  bg: "bg-orange-50 hover:bg-orange-100", soon: true },
  { label: "Jadval",              href: "/school/schedule",            icon: Calendar,      color: "text-pink-600",    bg: "bg-pink-50 hover:bg-pink-100" },
  { label: "Moliya hisoboti",     href: "/school/finance/statistics",  icon: BarChart3,     color: "text-indigo-600",  bg: "bg-indigo-50 hover:bg-indigo-100" },
];

// ── Metric card (student stats) ───────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  accentCls: string;
  iconBg: string;
  iconColor: string;
  href?: string;
  badge?: { text: string; cls: string };
}

function MetricCard({ title, value, subtitle, icon: Icon, accentCls, iconBg, iconColor, href, badge }: MetricCardProps) {
  const inner = (
    <div className={`bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden h-full ${href ? "hover:ring-gray-200 hover:shadow-sm transition-all cursor-pointer" : ""}`}>
      <div className={`h-1 w-full ${accentCls}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          {badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-1.5">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

function MetricsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden">
            <Skeleton className="h-1 w-full rounded-none" />
            <div className="p-4">
              <Skeleton className="w-8 h-8 rounded-lg mb-3" />
              <Skeleton className="h-6 w-14 mb-1.5" />
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden">
        <div className="flex divide-x divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div>
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-3 w-16 mb-0.5" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: Transaction }) {
  const cfg = TX_TYPE[tx.transaction_type] ?? TX_TYPE.income;
  const TxIcon = cfg.icon;

  // Determine display name (student or employee or description)
  const name =
    tx.student?.full_name ||
    tx.employee?.full_name ||
    tx.category_name ||
    tx.description ||
    cfg.label;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0 border-gray-100">
      <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0`}>
        <TxIcon className={`w-4 h-4 ${cfg.iconCls}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-[11px] text-gray-400 leading-none mt-0.5">
          {cfg.label}
          {tx.category_name && tx.category_name !== name ? ` · ${tx.category_name}` : ""}
          {" · "}{formatRelativeDate(tx.transaction_date || tx.created_at)}
        </p>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${cfg.amountCls}`}>
        {cfg.sign}{formatCurrency(tx.amount)}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SchoolDashboard() {
  const { user, currentBranch } = useAuth();
  const branchId      = currentBranch?.branch_id;
  const branchTypeRaw = (currentBranch?.branch_type || "school") as BranchType;
  const branchTypeApi = branchTypeRaw === "center" ? "training_center" : branchTypeRaw;
  const studentLabel   = branchTypeRaw === "school" ? "O'quvchilar" : "Talabalar";
  const studentLabelLc = studentLabel.toLowerCase();

  const { data: stats, isLoading: statsLoading }     = useDashboardStatistics(branchTypeApi);
  const { data: lessonsRes, isLoading: lessonsLoading } = useTodaysLessons(branchId);
  const { data: finStats, isLoading: finLoading }    = useDashboardFinanceStats(branchId);
  const { data: txRes, isLoading: txLoading }        = useDashboardRecentTransactions(branchId);

  // Lessons
  const lessons = React.useMemo(() => {
    const list = lessonsRes?.results ?? [];
    return [...list].sort((a, b) => {
      const od = (LESSON_STATUS_ORDER[a.status] ?? 1) - (LESSON_STATUS_ORDER[b.status] ?? 1);
      return od !== 0 ? od : a.start_time.localeCompare(b.start_time);
    });
  }, [lessonsRes]);

  const completedCount  = lessons.filter((l) => l.status === "completed").length;
  const inProgressCount = lessons.filter((l) => l.status === "in_progress").length;
  const lessonProgress  = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Students
  const debtAlert   = !!stats && stats.students.with_debt > 0;
  const debtPercent = stats && stats.students.total > 0
    ? Math.round((stats.students.with_debt / stats.students.total) * 100)
    : 0;
  const paidPercent = 100 - debtPercent;

  // Finance (detailed — from financeApi.getStatistics)
  const fin     = finStats?.summary;
  const netBal  = fin ? fin.total_income - fin.total_expense : 0;
  const flowTot = fin ? fin.total_income + fin.total_expense : 0;
  const incRatio = flowTot > 0 ? Math.round((fin!.total_income / flowTot) * 100) : 50;

  // For stat card badges (from dashboard stats for quick reads)
  const statNetProfit = stats ? stats.finance.this_month_income - stats.finance.this_month_expenses : 0;

  const recentTx = txRes?.results ?? [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Welcome banner ── */}
      <div className="rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-sm mb-0.5">{getTodayLabel()}</p>
            <h1 className="text-2xl font-bold">{getGreeting()}, {user?.first_name}!</h1>
            <p className="text-blue-100 mt-1.5 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 opacity-80" />
              {currentBranch?.branch_name}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20 min-w-[88px]">
              <p className="text-2xl font-bold leading-none tabular-nums">
                {lessonsLoading ? "—" : lessons.length}
              </p>
              <p className="text-blue-100 text-xs mt-1">Bugungi dars</p>
              {!lessonsLoading && completedCount > 0 && (
                <p className="text-blue-200 text-[10px] mt-0.5">{completedCount} tugallandi</p>
              )}
            </div>
            {!statsLoading && stats && (
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20 min-w-[88px]">
                <p className="text-2xl font-bold leading-none tabular-nums">{stats.students.active}</p>
                <p className="text-blue-100 text-xs mt-1">Faol {studentLabelLc}</p>
                {stats.students.with_debt > 0 && (
                  <p className="text-orange-200 text-[10px] mt-0.5">{stats.students.with_debt} qarzdor</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Metrics ── */}
      {statsLoading ? (
        <MetricsSkeleton />
      ) : stats ? (
        <div className="space-y-3">
          {/* Student metrics — 3 cards */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title={studentLabel}
              value={stats.students.total}
              subtitle={`${stats.students.active} faol`}
              icon={GraduationCap}
              accentCls="bg-blue-500"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              href="/school/students"
            />
            <MetricCard
              title="Qarzdorlar"
              value={stats.students.with_debt}
              subtitle={formatCurrency(stats.students.total_debt_amount) + " qarz"}
              icon={CircleAlert}
              accentCls="bg-orange-400"
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              href="/school/students"
              badge={
                stats.students.with_debt > 0
                  ? { text: `${debtPercent}%`, cls: "bg-orange-50 text-orange-600" }
                  : { text: "Yo'q", cls: "bg-emerald-50 text-emerald-700" }
              }
            />
            <MetricCard
              title="Yangi (to'lovsiz)"
              value={stats.students.new_this_month ?? 0}
              subtitle="Abonement bor, to'lov yo'q"
              icon={UserPlus}
              accentCls="bg-teal-500"
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              href="/school/students"
            />
          </div>

          {/* Ops strip — staff / lessons / finance */}
          <div className="bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="flex divide-x divide-gray-100">
              <Link href="/school/staff" className="flex-1 flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors min-w-0">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 tabular-nums leading-none">{stats.staff.total}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Xodimlar</p>
                  <p className="text-[10px] text-gray-400 truncate">{stats.staff.teachers} o'qt · {stats.staff.admins} adm</p>
                </div>
              </Link>
              <Link href="/school/schedule" className="flex-1 flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors min-w-0">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 tabular-nums leading-none">{stats.lessons.today}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Bugungi darslar</p>
                  <p className="text-[10px] text-gray-400">{stats.lessons.completed_today} tugallandi</p>
                </div>
              </Link>
              <Link href="/school/finance" className="flex-1 flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors min-w-0">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 tabular-nums leading-none truncate">{formatCurrency(stats.finance.this_month_income)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Oylik kirim</p>
                  <p className="text-[10px] text-gray-400">{stats.finance.recent_payments_count} ta to'lov</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Quick actions ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Tezkor harakatlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border border-transparent ${
                  action.soon
                    ? "bg-gray-50 hover:bg-gray-100 opacity-75"
                    : `${action.bg} hover:border-gray-200`
                }`}
              >
                {action.soon && (
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full leading-none">
                    Tez orada
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <action.icon className={`w-5 h-5 ${action.soon ? "text-gray-400" : action.color}`} />
                </div>
                <span className={`text-xs font-medium text-center leading-tight ${action.soon ? "text-gray-400" : "text-gray-700"}`}>
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Dars jadvali (placeholder) ── */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Dars jadvali
            </CardTitle>
            <Link href="/school/schedule" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              To'liq jadval <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-3">
          <div className="border border-dashed border-amber-200 bg-amber-50/50 rounded-xl flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-lg">
              🚧
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900">Bu bo'lim ishlab chiqilmoqda</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tez orada bugungi darslar, vaqt jadvali va dars holatlari shu yerda ko'rinadi
              </p>
            </div>
            <Link
              href="/school/schedule"
              className="shrink-0 text-xs bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Jadvalga o'tish
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── Finance (full width) ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              Moliyaviy xulosa
              <span className="text-xs font-normal text-gray-400">({getCurrentMonthLabel()})</span>
            </CardTitle>
            <Link href="/school/finance" className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0">
              Batafsil <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {finLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : fin ? (
            <div className="space-y-4">

              {/* ── Top 4 metrics ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Kirim */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Jami kirim</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-800 tabular-nums leading-none">
                    +{formatCurrency(fin.total_income)}
                  </p>
                </div>

                {/* Chiqim */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-600">Jami chiqim</span>
                  </div>
                  <p className="text-lg font-bold text-red-700 tabular-nums leading-none">
                    −{formatCurrency(fin.total_expense)}
                  </p>
                </div>

                {/* Sof balans */}
                <div className={`rounded-xl p-3.5 border ${netBal >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {netBal >= 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      : <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
                    }
                    <span className={`text-xs font-medium ${netBal >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                      Sof balans
                    </span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums leading-none ${netBal >= 0 ? "text-blue-800" : "text-orange-700"}`}>
                    {netBal >= 0 ? `+${formatCurrency(netBal)}` : `−${formatCurrency(Math.abs(netBal))}`}
                  </p>
                </div>

                {/* To'lovlar */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">O'quvchi to'lovlari</span>
                  </div>
                  <p className="text-lg font-bold text-purple-800 tabular-nums leading-none">
                    {formatCurrency(fin.total_payments)}
                  </p>
                  <p className="text-[10px] text-purple-500 mt-0.5">{fin.payments_count} ta to'lov</p>
                </div>
              </div>

              {/* ── Kirim / Chiqim nisbati ── */}
              {flowTot > 0 && (
                <div>
                  <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${incRatio}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-emerald-600 font-medium">{incRatio}% kirim</span>
                    <span className="text-[10px] text-red-500 font-medium">{100 - incRatio}% chiqim</span>
                  </div>
                </div>
              )}

              {/* ── Balanslar ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Kassalar jami balansi</p>
                      <p className="text-[11px] text-gray-400">Barcha kassalar</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 tabular-nums shrink-0 ml-2">
                    {formatCurrency(fin.total_cash_balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-gray-500 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">O'quvchilar balansi</p>
                      <p className="text-[11px] text-gray-400">To'langan balanslar</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 tabular-nums shrink-0 ml-2">
                    {formatCurrency(fin.total_student_balance)}
                  </span>
                </div>
              </div>

              {/* ── So'nggi operatsiyalar ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-gray-500" />
                    So'nggi operatsiyalar
                    <span className="text-xs font-normal text-gray-400">({getCurrentMonthLabel()})</span>
                  </p>
                  <Link
                    href="/school/finance/transactions"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Barchasi <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {txLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex gap-3 items-center py-2 border-b border-gray-100">
                        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-3.5 w-32 mb-1" />
                          <Skeleton className="h-2.5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : recentTx.length === 0 ? (
                  <div className="text-center py-6">
                    <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Shu oyda operatsiyalar yo'q</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentTx.map((tx) => (
                      <TxRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Moliya ma'lumoti mavjud emas</p>
          )}
        </CardContent>
      </Card>

      {/* ── Student status ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
              {studentLabel} holati
            </CardTitle>
            <Link href="/school/students" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Batafsil <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">Jami {studentLabelLc}</p>
                      <p className="text-[11px] text-gray-400">{stats.students.active} faol</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white tabular-nums">{stats.students.total}</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">Jami xodimlar</p>
                      <p className="text-[11px] text-gray-400">{stats.staff.teachers} o'qituvchi · {stats.staff.admins} admin</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white tabular-nums">{stats.staff.total}</Badge>
                </div>
                {debtAlert ? (
                  <div className="px-4 py-3 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                        <p className="text-sm text-gray-700">Qarzdor {studentLabelLc}</p>
                      </div>
                      <Badge className="bg-orange-500 text-white tabular-nums shrink-0">{stats.students.with_debt} ta</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-200">
                      <span className="text-[11px] text-orange-600">Jami qarz summasi</span>
                      <span className="text-xs font-bold text-orange-700 tabular-nums">
                        {formatCurrency(stats.students.total_debt_amount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm text-emerald-700">Barcha {studentLabelLc} to'lovni amalga oshirgan</span>
                  </div>
                )}
              </div>

              {/* Payment progress */}
              {stats.students.total > 0 && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">To'lov holati</span>
                    <span className="text-[10px] text-gray-500">{paidPercent}% to'lagan</span>
                  </div>
                  <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Ma'lumot mavjud emas</p>
          )}
        </CardContent>
      </Card>

      {/* ── Today's lessons ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Bugungi darslar
              </CardTitle>
              {!lessonsLoading && lessons.length > 0 && (
                <>
                  <Badge variant="secondary" className="text-xs tabular-nums">{lessons.length} ta</Badge>
                  {inProgressCount > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      {inProgressCount} ta davom etmoqda
                    </span>
                  )}
                  {completedCount > 0 && (
                    <span className="text-xs text-gray-400">{completedCount} tugallandi</span>
                  )}
                </>
              )}
            </div>
            <Link href="/school/schedule" className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0">
              To'liq jadval <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!lessonsLoading && lessons.length > 0 && (
            <div className="mt-2.5">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${lessonProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{lessonProgress}% bajarildi</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {lessonsLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 border rounded-xl">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Bugun darslar rejalashtirilmagan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const st     = LESSON_STATUS[lesson.status] ?? LESSON_STATUS.planned;
                const isLive = lesson.status === "in_progress";
                const isDone = lesson.status === "completed";
                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isLive ? "border-emerald-200 bg-emerald-50/60"
                        : isDone ? "border-gray-100 bg-gray-50/50 opacity-70"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center shrink-0 tabular-nums ${
                      isLive ? "bg-emerald-600 text-white"
                        : isDone ? "bg-gray-200 text-gray-500"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {lesson.lesson_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {lesson.class_name || lesson.class_subject || "Dars"}
                        {lesson.subject_name && (
                          <span className="font-normal text-gray-400"> · {lesson.subject_name}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {fmt(lesson.start_time)} – {fmt(lesson.end_time)}
                        </span>
                        {lesson.teacher_name && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            {lesson.teacher_name}
                          </span>
                        )}
                        {lesson.room && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {lesson.room}
                          </span>
                        )}
                      </div>
                      {lesson.topic && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate italic">{lesson.topic}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
