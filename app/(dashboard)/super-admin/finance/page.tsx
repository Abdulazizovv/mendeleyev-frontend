"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Building2,
  Eye, Lock, BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

function formatAmount(n: number) {
  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1) + " mlrd so'm";
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + " mln so'm";
  }
  return n.toLocaleString("uz-UZ") + " so'm";
}

function formatAmountFull(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

function SkeletonCard() {
  return <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />;
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  trend?: number;
  locked?: boolean;
}

function MetricCard({ label, value, icon: Icon, color, bg, border, trend, locked }: MetricCardProps) {
  return (
    <Card className={`border ${border} overflow-hidden`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            {locked ? (
              <Lock className="w-4 h-4 text-gray-400" />
            ) : (
              <Icon className={`w-4 h-4 ${color}`} />
            )}
          </div>
        </div>
        {locked ? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <span className="text-xs text-gray-400 italic">Maxfiy</span>
          </div>
        ) : (
          <>
            <p className={`text-xl font-bold ${color}`}>{formatAmount(value)}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(trend).toLocaleString()} so'm bu oy</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminFinancePage() {
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser === true;

  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const { data: branchesData } = useQuery({
    queryKey: ["superadmin", "branches-list"],
    queryFn: () => superadminApi.getBranches({ page_size: 200 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const branchParams = useMemo(
    () => (selectedBranch !== "all" ? { branch_id: selectedBranch } : {}),
    [selectedBranch]
  );

  const { data: finance, isLoading } = useQuery({
    queryKey: ["superadmin", "finance", selectedBranch],
    queryFn: () => superadminApi.getFinance(branchParams).then((r) => r.data),
    staleTime: 30_000,
  });

  const branches = branchesData?.results ?? [];
  const selectedBranchName = branches.find((b) => b.id === selectedBranch)?.name;

  const metricCards: MetricCardProps[] = [
    {
      label: "Jami kirim",
      value: finance?.total_income ?? 0,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      trend: finance?.monthly_income,
    },
    {
      label: "Jami chiqim",
      value: finance?.total_expense ?? 0,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      trend: finance?.monthly_expense ? -finance.monthly_expense : undefined,
    },
    {
      label: "Sof balans",
      value: finance?.net_balance ?? 0,
      icon: DollarSign,
      color: (finance?.net_balance ?? 0) >= 0 ? "text-blue-600" : "text-red-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Umumiy kassa",
      value: finance?.total_cash_balance ?? 0,
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      locked: !isSuperuser,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moliya</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBranchName
              ? `${selectedBranchName} filiali bo'yicha`
              : "Barcha filiallar bo'yicha moliyaviy ko'rsatkichlar"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Permission badge */}
          <div
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
              isSuperuser
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isSuperuser ? (
              <>
                <DollarSign className="w-3 h-3" />
                To'liq ruxsat
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Faqat ko'rish
              </>
            )}
          </div>

          {/* Branch selector */}
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-52">
              <Building2 className="w-4 h-4 text-gray-400 mr-2" />
              <SelectValue placeholder="Filial tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha filiallar</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : metricCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </div>

      {/* This month + Salary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly breakdown */}
        <Card className="border border-gray-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-base">Joriy oy ko'rsatkichlari</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : finance ? (
              <div className="space-y-3">
                {/* Income bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">Kirim</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatAmountFull(finance.monthly_income)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{
                        width: finance.monthly_income + finance.monthly_expense > 0
                          ? `${(finance.monthly_income / (finance.monthly_income + finance.monthly_expense)) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                {/* Expense bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-600">Chiqim</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {formatAmountFull(finance.monthly_expense)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{
                        width: finance.monthly_income + finance.monthly_expense > 0
                          ? `${(finance.monthly_expense / (finance.monthly_income + finance.monthly_expense)) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                {/* Net divider */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Sof foyda</span>
                  <span
                    className={`text-base font-bold ${
                      finance.monthly_net >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {finance.monthly_net >= 0 ? "+" : ""}
                    {formatAmountFull(finance.monthly_net)}
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Salary card */}
        <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-amber-800">Jami maoshlar</p>
            </div>
            {isLoading ? (
              <div className="h-8 bg-amber-100 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-amber-900">
                  {formatAmount(finance?.total_salary ?? 0)}
                </p>
                <p className="text-xs text-amber-600 mt-1">Barcha vaqt davomida to'langan</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch balances table */}
      {!isLoading && finance && finance.branch_balances.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <CardTitle className="text-base">Filiallar kassa balansi</CardTitle>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {finance.branch_balances.length} ta filial
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                      Filial
                    </th>
                    <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                      Kassa balansi
                    </th>
                    {isSuperuser && (
                      <th className="text-right py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                        Batafsil
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {finance.branch_balances.map((b, idx) => {
                    const maxBalance = Math.max(...finance.branch_balances.map((x) => Math.abs(x.balance)));
                    const widthPct = maxBalance > 0 ? (Math.abs(b.balance) / maxBalance) * 100 : 0;
                    return (
                      <tr
                        key={b.branch_id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          idx === finance.branch_balances.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{b.branch_name}</p>
                              {/* mini bar */}
                              <div className="mt-1 h-1 w-32 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${b.balance >= 0 ? "bg-green-400" : "bg-red-400"}`}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold ${
                              b.balance >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {b.balance >= 0 ? "+" : ""}
                            {formatAmountFull(b.balance)}
                          </span>
                        </td>
                        {isSuperuser && (
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/super-admin/branches/${b.branch_id}?tab=finance`}
                              className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                            >
                              Ko'rish
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-superuser info banner */}
      {!isSuperuser && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Eye className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Faqat ko'rish rejimi</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Moliyaviy ma'lumotlarni ko'rishingiz mumkin, ammo o'zgartirish uchun superuser huquqi talab etiladi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
