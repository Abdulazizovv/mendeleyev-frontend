"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Building2,
  Calendar,
  Plus,
  ArrowRight,
  Package,
  BadgePercent,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];

const NOW = new Date();
const MONTH_START = new Date(NOW.getFullYear(), NOW.getMonth(), 1)
  .toISOString()
  .split("T")[0];
const CURRENT_MONTH_LABEL = `${UZ_MONTHS[NOW.getMonth()]} ${NOW.getFullYear()}`;

export default function FinancePage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const { data: statistics, isLoading } = useQuery({
    queryKey: ["finance-statistics", branchId, MONTH_START],
    queryFn: () => financeApi.getStatistics({ branch_id: branchId, start_date: MONTH_START }),
    enabled: !!branchId,
  });

  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: recentPaymentsData } = useQuery({
    queryKey: ["payments-recent", branchId],
    queryFn: () =>
      financeApi.getPayments({
        branch_id: branchId,
        ordering: "-payment_date",
        page_size: 6,
      }),
    enabled: !!branchId,
  });

  const cashRegisters = cashRegistersData?.results || [];
  const summary = statistics?.summary;
  const monthlyStats = statistics?.monthly_stats || [];
  const recentPayments = recentPaymentsData?.results || [];

  const statCards = [
    {
      label: "Kirim",
      value: summary?.total_income || 0,
      icon: TrendingUp,
      arrow: ArrowUpRight,
      color: "border-t-green-500",
      bg: "bg-green-100",
      iconColor: "text-green-600",
      arrowColor: "text-green-500",
    },
    {
      label: "Chiqim",
      value: summary?.total_expense || 0,
      icon: TrendingDown,
      arrow: ArrowDownRight,
      color: "border-t-red-500",
      bg: "bg-red-100",
      iconColor: "text-red-600",
      arrowColor: "text-red-500",
    },
    {
      label: "Sof Balans",
      value: summary?.net_balance || 0,
      icon: Wallet,
      arrow: BarChart3,
      color: "border-t-blue-500",
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      arrowColor: "text-blue-500",
    },
    {
      label: "To'lovlar",
      value: summary?.total_payments || 0,
      icon: DollarSign,
      arrow: CreditCard,
      color: "border-t-purple-500",
      bg: "bg-purple-100",
      iconColor: "text-purple-600",
      arrowColor: "text-purple-500",
      sub: `${summary?.payments_count || 0} ta to'lov`,
    },
  ];

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Moliya Boshqaruvi</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {currentBranch?.branch_name} — moliya hisobotlari
          </p>
        </div>
        <Button
          onClick={() => router.push("/school/finance/payments/create")}
          className="gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          To&apos;lov qabul qilish
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-gray-700">{CURRENT_MONTH_LABEL} statistikasi</p>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Shu oy</span>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className={`border-t-4 ${stat.color} hover:shadow-lg transition-all hover:-translate-y-0.5`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${stat.bg} rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <stat.arrow className={`w-4 h-4 ${stat.arrowColor}`} />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stat.value)}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Stats */}
        {monthlyStats.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Oylik Statistika
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-500 text-xs">OY</th>
                      <th className="text-right py-2.5 px-4 font-semibold text-green-600 text-xs">KIRIM</th>
                      <th className="text-right py-2.5 px-4 font-semibold text-red-600 text-xs">CHIQIM</th>
                      <th className="text-right py-2.5 px-4 font-semibold text-blue-600 text-xs">BALANS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.slice(0, 6).map((stat, i) => {
                      const d = new Date(stat.month);
                      const balance = stat.income - stat.expense;
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {UZ_MONTHS[d.getMonth()]} {d.getFullYear()}
                          </td>
                          <td className="text-right py-3 px-4 text-green-600 font-medium">
                            {formatCurrency(stat.income)}
                          </td>
                          <td className="text-right py-3 px-4 text-red-600 font-medium">
                            {formatCurrency(stat.expense)}
                          </td>
                          <td
                            className={`text-right py-3 px-4 font-bold ${
                              balance >= 0 ? "text-blue-600" : "text-orange-600"
                            }`}
                          >
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

        {/* Cash Registers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4" />
              Kassalar
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/school/finance/cash-registers")}
              className="text-xs gap-1 text-blue-600 hover:text-blue-700"
            >
              Barchasi
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {cashRegisters.length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">Kassa topilmadi</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/school/finance/cash-registers")}
                >
                  Kassa qo&apos;shish
                </Button>
              </div>
            ) : (
              cashRegisters.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/school/finance/cash-registers/${r.id}`)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${r.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                    <p className="font-medium text-sm text-gray-900 truncate">{r.name}</p>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 ml-2 shrink-0">
                    {formatCurrency(r.balance)}
                  </p>
                </div>
              ))
            )}

            {/* Student balance summary */}
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="text-xs text-gray-500">O&apos;quvchilar balansi</p>
                  <p className="font-bold text-gray-900">{formatCurrency(summary?.total_student_balance || 0)}</p>
                </div>
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div>
                  <p className="text-xs text-gray-500">Kassadagi jami</p>
                  <p className="font-bold text-gray-900">{formatCurrency(summary?.total_cash_balance || 0)}</p>
                </div>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="w-4 h-4" />
              So&apos;nggi To&apos;lovlar
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/school/finance/payments")}
              className="text-xs gap-1 text-blue-600 hover:text-blue-700"
            >
              Barchasi
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/school/finance/payments/${payment.id}`)}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                      {payment.student?.full_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2) || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.student?.full_name || payment.student_name || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {payment.subscription_plan_name} ·{" "}
                      {new Date(payment.payment_date).toLocaleDateString("uz-UZ", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(payment.final_amount)}</p>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 mt-0.5">
                      {payment.payment_method_display}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finance Config shortcuts */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Moliya sozlamalari
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Kassalar", href: "/school/finance/cash-registers", icon: Building2, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Abonement tariflari", href: "/school/finance/subscription-plans", icon: Package, color: "text-purple-600 bg-purple-50 border-purple-100" },
            { label: "Kategoriyalar", href: "/school/finance/categories", icon: BarChart3, color: "text-teal-600 bg-teal-50 border-teal-100" },
            { label: "Chegirmalar", href: "/school/finance/discounts", icon: BadgePercent, color: "text-orange-600 bg-orange-50 border-orange-100" },
          ].map((item) => (
            <Card
              key={item.href}
              className="cursor-pointer hover:shadow-md transition-all border hover:border-gray-300"
              onClick={() => router.push(item.href)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Boshqarish</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
