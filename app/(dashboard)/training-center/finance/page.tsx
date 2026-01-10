"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  Receipt,
  BadgePercent,
  Building2,
  ArrowLeft,
  Calendar,
  PieChart,
} from "lucide-react";

export default function FinancePage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  // Fetch statistics
  const { data: statistics, isLoading } = useQuery({
    queryKey: ["finance-statistics", branchId],
    queryFn: () => financeApi.getStatistics({ branch_id: branchId }),
    enabled: !!branchId,
  });

  // Fetch cash registers
  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const cashRegisters = cashRegistersData?.results || [];
  const summary = statistics?.summary;
  const monthlyStats = statistics?.monthly_stats || [];

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Moliya Boshqaruvi
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              To&apos;liq moliya tizimi va hisobotlar
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/branch-admin/finance/transactions")}
            className="gap-2"
          >
            <Receipt className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tranzaksiyalar</span>
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/branch-admin/finance/payments")}
            className="gap-2"
          >
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">To&apos;lovlar</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-20 sm:h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Income */}
          <Card className="border-t-4 border-t-green-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                Jami Kirim
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.total_income || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Total Expense */}
          <Card className="border-t-4 border-t-red-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
                </div>
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                Jami Chiqim
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.total_expense || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card className="border-t-4 border-t-blue-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                Sof Balans
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.net_balance || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Total Payments */}
          <Card className="border-t-4 border-t-purple-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <CreditCard className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                Jami To&apos;lovlar
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.total_payments || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary?.payments_count || 0} ta to&apos;lov
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Statistics - Simple Table View */}
      {monthlyStats && monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Oylik Statistika
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Oy</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm font-semibold text-green-600">Kirim</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm font-semibold text-red-600">Chiqim</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm font-semibold text-blue-600">Balans</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.slice(0, 6).map((stat, index) => {
                    const balance = stat.income - stat.expense;
                    // Parse month - API returns ISO format: "2025-12-01T00:00:00+05:00"
                    const monthDate = new Date(stat.month);
                    
                    // O'zbekcha oy nomlari
                    const uzbekMonths = [
                      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
                      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
                    ];
                    
                    const monthName = uzbekMonths[monthDate.getMonth()];
                    const year = monthDate.getFullYear();
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 text-xs sm:text-sm font-medium">
                          {monthName} {year}
                        </td>
                        <td className="text-right py-3 px-2 text-xs sm:text-sm text-green-600 font-medium">
                          {formatCurrency(stat.income)}
                        </td>
                        <td className="text-right py-3 px-2 text-xs sm:text-sm text-red-600 font-medium">
                          {formatCurrency(stat.expense)}
                        </td>
                        <td className={`text-right py-3 px-2 text-xs sm:text-sm font-bold ${
                          balance >= 0 ? "text-blue-600" : "text-orange-600"
                        }`}>
                          {formatCurrency(balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 sm:gap-3">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          onClick={() => router.push("/branch-admin/finance/cash-registers")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Kassalar
                </p>
                <p className="text-xs text-gray-600">{cashRegisters.length} ta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          onClick={() => router.push("/branch-admin/finance/transactions")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Tranzaksiyalar
                </p>
                <p className="text-xs text-gray-600">Operatsiyalar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200"
          onClick={() => router.push("/branch-admin/finance/payments")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  To&apos;lovlar
                </p>
                <p className="text-xs text-gray-600">
                  {summary?.payments_count || 0} ta
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200"
          onClick={() => router.push("/branch-admin/finance/student-balances")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Balanslar
                </p>
                <p className="text-xs text-gray-600">O&apos;quvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
          onClick={() => router.push("/branch-admin/finance/categories")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Kategoriyalar
                </p>
                <p className="text-xs text-gray-600">Kirim/Chiqim</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200"
          onClick={() => router.push("/branch-admin/finance/subscription-plans")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-pink-600 rounded-lg">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Abonementlar
                </p>
                <p className="text-xs text-gray-600">Tariflar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
          onClick={() => router.push("/branch-admin/finance/discounts")}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-2 bg-orange-600 rounded-lg">
                <BadgePercent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                  Chegirmalar
                </p>
                <p className="text-xs text-gray-600">Takliflar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Registers & Student Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Cash Registers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Kassalar
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/branch-admin/finance/cash-registers")}
              className="text-xs sm:text-sm"
            >
              Barchasi
            </Button>
          </CardHeader>
          <CardContent>
            {cashRegisters.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4 text-xs sm:text-sm">
                  Hech qanday kassa topilmadi
                </p>
                <Button
                  onClick={() =>
                    router.push("/branch-admin/finance/cash-registers")
                  }
                  size="sm"
                >
                  Kassa yaratish
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {cashRegisters.slice(0, 5).map((register) => (
                  <div
                    key={register.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/branch-admin/finance/cash-registers/${register.id}`)
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          register.is_active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          {register.name}
                        </p>
                        {register.location && (
                          <p className="text-xs text-gray-500 truncate">
                            {register.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-gray-900 ml-2 flex-shrink-0">
                      {formatCurrency(register.balance)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Balances Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              O&apos;quvchilar Balansi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Jami balans
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    {formatCurrency(summary?.total_student_balance || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-600 rounded-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Kassadagi pul
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    {formatCurrency(summary?.total_cash_balance || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-600 rounded-lg">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
