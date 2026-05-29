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
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "O'quvchi qo'shish",   href: "/school/students",         icon: UserPlus,      color: "text-blue-600",    bg: "bg-blue-50 hover:bg-blue-100" },
  { label: "To'lov qabul qilish", href: "/school/finance/payments", icon: CreditCard,    color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100" },
  { label: "Davomat belgilash",   href: "/school/attendance",       icon: ClipboardList, color: "text-purple-600",  bg: "bg-purple-50 hover:bg-purple-100" },
  { label: "Baholar",             href: "/school/grades",           icon: Award,         color: "text-orange-600",  bg: "bg-orange-50 hover:bg-orange-100" },
  { label: "Jadval",              href: "/school/schedule",         icon: Calendar,      color: "text-pink-600",    bg: "bg-pink-50 hover:bg-pink-100" },
  { label: "Moliya hisoboti",     href: "/school/finance",          icon: BarChart3,     color: "text-indigo-600",  bg: "bg-indigo-50 hover:bg-indigo-100" },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href?: string;
  badge?: { text: string; cls: string };
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, href, badge }: StatCardProps) {
  const inner = (
    <Card className={`transition-all duration-200 h-full ${href ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {badge && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1.5">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{subtitle}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-20 mb-1.5" />
        <Skeleton className="h-3 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
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

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              title={studentLabel}
              value={stats.students.total}
              subtitle={`${stats.students.active} faol · ${stats.students.with_debt} qarzdor`}
              icon={GraduationCap}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              href="/school/students"
              badge={
                stats.students.with_debt > 0
                  ? { text: `${debtPercent}% qarz`, cls: "bg-orange-100 text-orange-700" }
                  : { text: "Qarz yo'q", cls: "bg-emerald-100 text-emerald-700" }
              }
            />
            <StatCard
              title="Xodimlar"
              value={stats.staff.total}
              subtitle={`${stats.staff.teachers} o'qituvchi · ${stats.staff.admins} admin`}
              icon={Users}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              href="/school/staff"
            />
            <StatCard
              title="Bugungi darslar"
              value={stats.lessons.today}
              subtitle={`${stats.lessons.completed_today} tugallandi · ${stats.lessons.this_week} bu hafta`}
              icon={BookOpen}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              href="/school/schedule"
              badge={
                stats.lessons.today > 0
                  ? { text: `${Math.round((stats.lessons.completed_today / stats.lessons.today) * 100)}%`, cls: "bg-blue-100 text-blue-700" }
                  : undefined
              }
            />
            <StatCard
              title="Oylik kirim"
              value={formatCurrency(stats.finance.this_month_income)}
              subtitle={`${stats.finance.recent_payments_count} ta to'lov · ${getCurrentMonthLabel()}`}
              icon={Banknote}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              href="/school/finance"
              badge={
                statNetProfit >= 0
                  ? { text: `+${formatCurrency(statNetProfit)}`, cls: "bg-emerald-100 text-emerald-700" }
                  : { text: formatCurrency(statNetProfit), cls: "bg-red-100 text-red-700" }
              }
            />
          </>
        ) : null}
      </div>

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
                className={`flex flex-col items-center gap-2 p-3 rounded-xl ${action.bg} transition-colors border border-transparent hover:border-gray-200`}
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{action.label}</span>
              </Link>
            ))}
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
