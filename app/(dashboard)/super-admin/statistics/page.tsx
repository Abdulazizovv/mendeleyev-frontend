"use client";

import { useQuery } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, Users, GraduationCap, UserCog, LayoutDashboard,
  TrendingUp, School, BookOpen,
} from "lucide-react";

export default function SuperAdminStatisticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin", "statistics"],
    queryFn: () => superadminApi.getStatistics().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Statistika yuklanmadi</p>
      </div>
    );
  }

  const branchCards = [
    { label: "Jami filiallar", value: stats.branches.total, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Faol", value: stats.branches.active, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Maktablar", value: stats.branches.schools, icon: School, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "O'quv markazlar", value: stats.branches.centers, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const userCards = [
    { label: "Jami foydalanuvchilar", value: stats.users.total, icon: Users, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Super adminlar", value: stats.users.superadmins, icon: UserCog, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "O'qituvchilar", value: stats.users.teachers, icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "O'quvchilar", value: stats.users.students, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistika</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform bo'yicha umumiy ko'rsatkichlar</p>
      </div>

      {/* Bugungi qo'shimchalar */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-blue-100 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">Bugun yangi filiallar</p>
              <p className="text-2xl font-bold text-blue-800">{stats.today.new_branches}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-green-100 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600">Bugun yangi foydalanuvchilar</p>
              <p className="text-2xl font-bold text-green-800">{stats.today.new_users}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filiallar statistikasi */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Filiallar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {branchCards.map((card) => (
            <Card key={card.label} className="border border-gray-200">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-4.5 h-4.5 ${card.color}`} style={{ width: 18, height: 18 }} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filiallar holati taqsimoti */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filiallar holati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Faol", value: stats.branches.active, total: stats.branches.total, color: "bg-green-500" },
              { label: "Nofaol", value: stats.branches.inactive, total: stats.branches.total, color: "bg-gray-400" },
              { label: "Kutilmoqda", value: stats.branches.pending, total: stats.branches.total, color: "bg-yellow-400" },
              { label: "Arxivlangan", value: stats.branches.archived, total: stats.branches.total, color: "bg-red-400" },
            ].map((item) => {
              const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Foydalanuvchilar statistikasi */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Foydalanuvchilar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {userCards.map((card) => (
            <Card key={card.label} className="border border-gray-200">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-4.5 h-4.5 ${card.color}`} style={{ width: 18, height: 18 }} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top filiallar */}
      {stats.top_branches.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Eng ko'p o'quvchili filiallar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.top_branches.map((branch, idx) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                      <p className="text-xs text-gray-500">
                        {branch.type === "school" ? "Maktab" : "O'quv markazi"} · {branch.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">{branch.student_count} o'quvchi</p>
                    <p className="text-xs text-gray-500">{branch.staff_count} xodim</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
