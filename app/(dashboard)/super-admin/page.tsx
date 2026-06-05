"use client";

import { useQuery } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import {
  Building2, Users, GraduationCap, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, Archive, ArrowUpRight,
  BookOpen, DollarSign, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  archived: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Faol", inactive: "Nofaol", pending: "Kutilmoqda", archived: "Arxivlangan",
};
const TYPE_LABELS: Record<string, string> = { school: "Maktab", center: "O'quv markazi" };

function SkeletonCard() {
  return <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />;
}

function StatCard({
  title, value, subtitle, icon: Icon, color, bg, href, trend,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href?: string;
  trend?: { value: number; label: string };
}) {
  const content = (
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 leading-none">
            {typeof value === "number" ? value.toLocaleString("uz-UZ") : value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0 ml-3`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {href && (
        <div className="flex items-center gap-1 mt-4 text-xs text-blue-600 font-medium group-hover:gap-2 transition-all">
          Ko'rish
          <ArrowUpRight className="w-3 h-3" />
        </div>
      )}
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
          {content}
        </Card>
      </Link>
    );
  }

  return <Card className="border border-gray-200">{content}</Card>;
}

function ProgressBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin", "statistics"],
    queryFn: () => superadminApi.getStatistics().then((r) => r.data),
  });

  const { data: recentBranches } = useQuery({
    queryKey: ["superadmin", "branches", "recent"],
    queryFn: () =>
      superadminApi.getBranches({ page_size: 8, ordering: "-created_at" }).then((r) => r.data),
  });

  const { data: finance } = useQuery({
    queryKey: ["superadmin", "finance", "summary"],
    queryFn: () => superadminApi.getFinance().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const totalBranches = stats?.branches.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platformaning umumiy holati va boshqaruv</p>
        </div>
        {stats?.today && (
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <div className="text-sm">
              <span className="text-blue-800 font-semibold">Bugun: </span>
              <span className="text-blue-600">+{stats.today.new_branches} filial, +{stats.today.new_users} foydalanuvchi</span>
            </div>
          </div>
        )}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jami filiallar"
          value={stats?.branches.total ?? 0}
          subtitle={`${stats?.branches.active ?? 0} ta faol`}
          icon={Building2}
          color="text-blue-600"
          bg="bg-blue-50"
          href="/super-admin/branches"
          trend={{ value: stats?.today.new_branches ?? 0, label: "bugun" }}
        />
        <StatCard
          title="Foydalanuvchilar"
          value={stats?.users.total ?? 0}
          subtitle={`${stats?.users.teachers ?? 0} o'qituvchi`}
          icon={Users}
          color="text-purple-600"
          bg="bg-purple-50"
          href="/super-admin/users"
          trend={{ value: stats?.today.new_users ?? 0, label: "bugun" }}
        />
        <StatCard
          title="O'quvchilar"
          value={stats?.users.students ?? 0}
          subtitle="Barcha filiallarda"
          icon={GraduationCap}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          title="Joriy oy daromad"
          value={finance ? `${(finance.monthly_income / 1_000_000).toFixed(1)}M` : "—"}
          subtitle={finance ? `Chiqim: ${(finance.monthly_expense / 1_000_000).toFixed(1)}M so'm` : "Yuklanmoqda"}
          icon={DollarSign}
          color="text-green-600"
          bg="bg-green-50"
          href="/super-admin/finance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch breakdown */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Filiallar taqsimoti</CardTitle>
              <Link href="/super-admin/branches" className="text-xs text-blue-600 hover:underline">
                Barchasi →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Maktablar", value: stats?.branches.schools ?? 0, color: "bg-blue-500", icon: Building2, iconColor: "text-blue-600" },
              { label: "O'quv markazlari", value: stats?.branches.centers ?? 0, color: "bg-indigo-500", icon: BookOpen, iconColor: "text-indigo-600" },
              { label: "Kutilmoqda", value: stats?.branches.pending ?? 0, color: "bg-yellow-400", icon: Clock, iconColor: "text-yellow-600" },
              { label: "Nofaol", value: stats?.branches.inactive ?? 0, color: "bg-gray-400", icon: XCircle, iconColor: "text-gray-500" },
              { label: "Arxivlangan", value: stats?.branches.archived ?? 0, color: "bg-red-400", icon: Archive, iconColor: "text-red-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
                <ProgressBar value={item.value} max={totalBranches} color={item.color} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User distribution */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Foydalanuvchilar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Super adminlar", value: stats?.users.superadmins ?? 0, color: "bg-red-100 text-red-700" },
              { label: "Filial adminlari", value: stats?.users.branch_admins ?? 0, color: "bg-orange-100 text-orange-700" },
              { label: "O'qituvchilar", value: stats?.users.teachers ?? 0, color: "bg-blue-100 text-blue-700" },
              { label: "O'quvchilar", value: stats?.users.students ?? 0, color: "bg-green-100 text-green-700" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${item.color}`}>
                  {item.value.toLocaleString("uz-UZ")}
                </span>
              </div>
            ))}
            <div className="pt-2 flex items-center gap-2 text-xs text-green-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Bugun yangi: +{stats?.today.new_users ?? 0} foydalanuvchi</span>
            </div>
          </CardContent>
        </Card>

        {/* Finance summary */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Moliya xulasasi</CardTitle>
              <Link href="/super-admin/finance" className="text-xs text-blue-600 hover:underline">
                Batafsil →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {finance ? (
              <>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Jami kirim</span>
                  <span className="text-sm font-semibold text-green-600">
                    {(finance.total_income / 1_000_000).toFixed(2)}M so'm
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Jami chiqim</span>
                  <span className="text-sm font-semibold text-red-600">
                    {(finance.total_expense / 1_000_000).toFixed(2)}M so'm
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">Kassa balansi</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {(finance.total_cash_balance / 1_000_000).toFixed(2)}M so'm
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Sof balans</span>
                  <span className={`text-sm font-bold ${finance.net_balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {(finance.net_balance / 1_000_000).toFixed(2)}M so'm
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top branches + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top branches by students */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Eng faol filiallar</CardTitle>
              <span className="text-xs text-gray-400">O'quvchilar bo'yicha</span>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.top_branches?.length ? (
              <div className="space-y-1">
                {stats.top_branches.slice(0, 6).map((b, i) => (
                  <Link
                    key={b.id}
                    href={`/super-admin/branches/${b.id}`}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 group transition-colors"
                  >
                    <span className="w-6 text-center text-xs font-bold text-gray-400">#{i + 1}</span>
                    <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {b.name}
                      </p>
                      <p className="text-xs text-gray-400">{TYPE_LABELS[b.type] ?? b.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{b.student_count}</p>
                      <p className="text-[10px] text-gray-400">o'quvchi</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>

        {/* Recent branches */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Oxirgi qo'shilgan</CardTitle>
              <Link href="/super-admin/branches" className="text-xs text-blue-600 hover:underline">
                Barchasi →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBranches?.results?.length ? (
              <div className="space-y-1">
                {recentBranches.results.map((branch) => (
                  <Link
                    key={branch.id}
                    href={`/super-admin/branches/${branch.id}`}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 group transition-colors"
                  >
                    <div className="w-7 h-7 bg-indigo-50 rounded-md flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {branch.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {TYPE_LABELS[branch.type]} · {branch.student_count} o'quvchi
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[branch.status]}`}>
                      {STATUS_LABELS[branch.status]}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Filiallar yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
