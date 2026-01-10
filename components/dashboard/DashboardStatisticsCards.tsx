import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/translations";
import type { DashboardStatistics } from "@/types";

interface DashboardStatisticsProps {
  statistics?: DashboardStatistics;
  isLoading?: boolean;
  branchType?: "school" | "training_center";
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "purple" | "green" | "orange" | "red";
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStatisticsCards({
  statistics,
  isLoading,
  branchType = "school",
}: DashboardStatisticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            <span>Ma'lumotlarni yuklashda xatolik yuz berdi</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const studentTerm = branchType === "training_center" ? "Talabalar" : "O'quvchilar";
  const hasDebt = statistics.students.with_debt > 0;

  return (
    <div className="space-y-6">
      {/* Branch Info */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{statistics.branch_name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {branchType === "training_center" ? "O'quv markazi" : "Maktab"}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={studentTerm}
          value={statistics.students.total}
          icon={<GraduationCap className="w-6 h-6" />}
          color="blue"
          subtitle={`${statistics.students.active} faol`}
        />
        <StatCard
          title="Xodimlar"
          value={statistics.staff.total}
          icon={<Users className="w-6 h-6" />}
          color="purple"
          subtitle={`${statistics.staff.teachers} o'qituvchi`}
        />
        <StatCard
          title="Bu hafta darslar"
          value={statistics.lessons.this_week}
          icon={<BookOpen className="w-6 h-6" />}
          color="green"
          subtitle={`${statistics.lessons.completed_today} bugun tugallandi`}
        />
        <StatCard
          title="Umumiy balans"
          value={formatCurrency(statistics.finance.total_balance)}
          icon={<DollarSign className="w-6 h-6" />}
          color={statistics.finance.total_balance >= 0 ? "green" : "red"}
          subtitle={`Shu oyda: ${formatCurrency(statistics.finance.this_month_income)}`}
        />
      </div>

      {/* Finance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Moliyaviy ma'lumot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Shu oyning kirim</p>
              <p className="text-xl font-bold text-green-600 mt-2">
                +{formatCurrency(statistics.finance.this_month_income)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Shu oyning xarajat</p>
              <p className="text-xl font-bold text-red-600 mt-2">
                -{formatCurrency(statistics.finance.this_month_expenses)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">So'nggi to'lovlar</p>
              <p className="text-xl font-bold text-blue-600 mt-2">
                {statistics.finance.recent_payments_count}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt Alert */}
      {hasDebt && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Qarz ma'lumoti</p>
                <p className="text-sm text-orange-800 mt-1">
                  {statistics.students.with_debt} ta {studentTerm.toLowerCase()} {formatCurrency(statistics.students.total_debt_amount)} miqdorda qarz qilgan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
