"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboardStatistics, useTodaysLessons } from "@/lib/hooks/dashboard";
import { formatCurrency } from "@/lib/translations";
import { getDashboardWidgets } from "@/lib/utils/branchType";
import type { BranchType } from "@/types/auth";
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
  FileText,
  Building2,
  CheckCircle2,
  Zap,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 17) return "Xayrli kun";
  if (h < 21) return "Xayrli kechki";
  return "Xayrli tun";
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("uz-UZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const LESSON_STATUS: Record<string, { label: string; cls: string }> = {
  planned: { label: "Rejada", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Davom etmoqda", cls: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Tugallandi", cls: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Bekor", cls: "bg-red-100 text-red-700" },
};

function fmt(t: string) {
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

// ── Quick action definition ───────────────────────────────────────────────────

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "O'quvchi qo'shish",   href: "/school/students",          icon: UserPlus,     color: "text-blue-600",   bg: "bg-blue-50 hover:bg-blue-100" },
  { label: "To'lov qabul qilish", href: "/school/finance/payments",  icon: CreditCard,   color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100" },
  { label: "Davomat belgilash",   href: "/school/attendance",        icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
  { label: "Baholar",             href: "/school/grades",            icon: Award,         color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100" },
  { label: "Jadval",              href: "/school/schedule",          icon: Calendar,      color: "text-pink-600",   bg: "bg-pink-50 hover:bg-pink-100" },
  { label: "Moliya hisoboti",     href: "/school/finance",           icon: BarChart3,     color: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100" },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; positive: boolean };
  href?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, href }: StatCardProps) {
  const inner = (
    <Card className={`transition-shadow ${href ? "hover:shadow-md cursor-pointer" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
            {trend.positive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-gray-400">o'tgan oyga nisbatan</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SchoolDashboard() {
  const { user, currentBranch } = useAuth();
  const branchTypeRaw = (currentBranch?.branch_type || "school") as BranchType;
  const branchTypeApi = branchTypeRaw === "center" ? "training_center" : branchTypeRaw;
  const studentLabel = branchTypeRaw === "school" ? "O'quvchilar" : "Talabalar";

  const { data: stats, isLoading: statsLoading } = useDashboardStatistics(branchTypeApi);
  const { data: lessonsRes, isLoading: lessonsLoading } = useTodaysLessons(currentBranch?.branch_id);

  const lessons = React.useMemo(() => {
    const list = lessonsRes?.results ?? [];
    return [...list].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [lessonsRes]);

  const debtAlert = stats && stats.students.with_debt > 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Welcome banner ── */}
      <div className="rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-sm mb-1">{getTodayLabel()}</p>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.first_name}! 👋
            </h1>
            <p className="text-blue-100 mt-1 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {currentBranch?.branch_name}
            </p>
          </div>

          {/* Quick lesson count chip */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{lessonsLoading ? "—" : lessons.length}</p>
            <p className="text-blue-100 text-xs mt-0.5">Bugungi dars</p>
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
              subtitle={`${stats.students.active} faol`}
              icon={GraduationCap}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              href="/school/students"
            />
            <StatCard
              title="Xodimlar"
              value={stats.staff.total}
              subtitle={`${stats.staff.teachers} o'qituvchi`}
              icon={Users}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              href="/school/staff"
            />
            <StatCard
              title="Bu hafta darslar"
              value={stats.lessons.this_week}
              subtitle={`${stats.lessons.completed_today} bugun tugallandi`}
              icon={BookOpen}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              href="/school/schedule"
            />
            <StatCard
              title="Oylik kirim"
              value={formatCurrency(stats.finance.this_month_income)}
              subtitle={`${stats.finance.recent_payments_count} ta to'lov`}
              icon={DollarSign}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              href="/school/finance"
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
                <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Finance + Debt row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Finance summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Moliyaviy xulosa
              </CardTitle>
              <Link href="/school/finance" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Batafsil <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : stats ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-gray-700">Shu oyning kirim</span>
                  </div>
                  <span className="font-bold text-emerald-700">+{formatCurrency(stats.finance.this_month_income)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2.5">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700">Shu oyning xarajat</span>
                  </div>
                  <span className="font-bold text-red-600">-{formatCurrency(stats.finance.this_month_expenses)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Umumiy balans</span>
                  </div>
                  <span className={`font-bold ${stats.finance.total_balance >= 0 ? "text-blue-700" : "text-red-600"}`}>
                    {formatCurrency(stats.finance.total_balance)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Ma'lumot mavjud emas</p>
            )}
          </CardContent>
        </Card>

        {/* Debt + students summary */}
        <Card>
          <CardHeader className="pb-3">
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
          <CardContent className="space-y-3">
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : stats ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Faol {studentLabel.toLowerCase()}</span>
                  </div>
                  <Badge className="bg-blue-600 text-white">{stats.students.active}</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">Jami xodimlar</span>
                  </div>
                  <Badge className="bg-purple-600 text-white">{stats.staff.total}</Badge>
                </div>
                {debtAlert ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <div>
                        <span className="text-sm text-gray-700 block">Qarzdor {studentLabel.toLowerCase()}</span>
                        <span className="text-xs text-orange-700">{formatCurrency(stats.students.total_debt_amount)} jami qarz</span>
                      </div>
                    </div>
                    <Badge className="bg-orange-500 text-white shrink-0">{stats.students.with_debt} ta</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">Qarzdor o'quvchi yo'q</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Ma'lumot mavjud emas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Today's lessons ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Bugungi darslar
              {!lessonsLoading && (
                <Badge variant="secondary" className="text-xs">{lessons.length}</Badge>
              )}
            </CardTitle>
            <Link href="/school/schedule" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Jadval <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {lessonsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 border rounded-xl">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Bugun darslar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const st = LESSON_STATUS[lesson.status] ?? LESSON_STATUS.planned;
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Lesson number */}
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {lesson.lesson_number}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {lesson.class_name || lesson.class_subject || "Dars"}
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
                        <p className="text-xs text-gray-600 mt-0.5 truncate">Mavzu: {lesson.topic}</p>
                      )}
                    </div>

                    {/* Status badge */}
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
