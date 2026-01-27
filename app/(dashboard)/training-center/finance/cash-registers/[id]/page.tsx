"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown, Wallet, MapPin, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { financeApi } from "@/lib/api";
import type { CashRegister, Transaction } from "@/types/finance";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export default function CashRegisterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const registerId = params.id as string;

  // Kassa ma'lumotlarini olish
  const { data: cashRegister, isLoading: isLoadingRegister } = useQuery<CashRegister>({
    queryKey: ["cash-register", registerId],
    queryFn: () => financeApi.getCashRegister(registerId),
  });

  // Oxirgi tranzaksiyalarni olish
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["cash-register-transactions", registerId],
    queryFn: () => financeApi.getTransactions({
      cash_register: registerId,
      ordering: "-transaction_date",
    }),
  });

  // Oylik statistikani olish (demo uchun hisoblash) - useMemo bilan optimize qilish
  const monthlyData: MonthlyData[] = useMemo(() => {
    if (!transactionsData?.results || transactionsData.results.length === 0) return [];
    
    const dataByMonth: Record<string, { income: number; expense: number }> = {};
    
    transactionsData.results.forEach((transaction: Transaction) => {
      const month = new Date(transaction.transaction_date).toLocaleDateString("uz-UZ", { 
        month: "short",
        year: "numeric" 
      });
      
      if (!dataByMonth[month]) {
        dataByMonth[month] = { income: 0, expense: 0 };
      }
      
      if (transaction.transaction_type === "income") {
        dataByMonth[month].income += parseFloat(transaction.amount.toString());
      } else if (transaction.transaction_type === "expense") {
        dataByMonth[month].expense += parseFloat(transaction.amount.toString());
      }
    });
    
    return Object.entries(dataByMonth).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }));
  }, [transactionsData?.results]);

  // Umumiy kirim va chiqimni hisoblash - useMemo bilan
  const { totalIncome, totalExpense } = useMemo(() => {
    if (!transactionsData?.results) return { totalIncome: 0, totalExpense: 0 };
    
    const income = transactionsData.results
      .filter((t: Transaction) => t.transaction_type === "income")
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0);
    
    const expense = transactionsData.results
      .filter((t: Transaction) => t.transaction_type === "expense")
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0);
    
    return { totalIncome: income, totalExpense: expense };
  }, [transactionsData?.results]);

  if (isLoadingRegister) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!cashRegister) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kassa topilmadi</h2>
          <p className="text-gray-600 mb-4">Bunday kassa mavjud emas</p>
          <Button onClick={() => router.push("/branch-admin/finance")}>
            Orqaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/branch-admin/finance")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {cashRegister.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Kassa tafsilotlari
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Tahrirlash</span>
            <span className="sm:hidden">Tahrirlash</span>
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Asosiy Ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${cashRegister.is_active ? "bg-green-100" : "bg-red-100"}`}>
                {cashRegister.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Holat</p>
                <Badge variant={cashRegister.is_active ? "default" : "destructive"} className="mt-1">
                  {cashRegister.is_active ? "Faol" : "Nofaol"}
                </Badge>
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Balans</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(cashRegister.balance)}
                </p>
              </div>
            </div>

            {/* Location */}
            {cashRegister.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Joylashuv</p>
                  <p className="text-sm sm:text-base text-gray-900 mt-1">
                    {cashRegister.location}
                  </p>
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Yaratilgan</p>
                <p className="text-sm sm:text-base text-gray-900 mt-1">
                  {new Date(cashRegister.created_at).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(cashRegister.created_at).toLocaleTimeString("uz-UZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {cashRegister.description && (
            <div className="pt-4 border-t">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">Ta'rif</p>
              <p className="text-sm sm:text-base text-gray-700">
                {cashRegister.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Umumiy Kirim</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Umumiy Chiqim</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Tranzaksiyalar</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                  {transactionsData?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Statistics - Simple View */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Oylik Statistika</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Oy</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm font-semibold text-green-600">Kirim</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm font-semibold text-red-600">Chiqim</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((stat, index) => {
                    // Format month from "2025 M12" to "Dekabr 2025"
                    const monthParts = stat.month.split(' ');
                    const formattedMonth = monthParts.length === 2 ? 
                      new Date(parseInt(monthParts[0]), parseInt(monthParts[1].replace('M', '')) - 1).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' }) : 
                      stat.month;
                    return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-xs sm:text-sm">{formattedMonth}</td>
                      <td className="text-right py-3 px-2 text-xs sm:text-sm text-green-600 font-medium">
                        {formatCurrency(stat.income)}
                      </td>
                      <td className="text-right py-3 px-2 text-xs sm:text-sm text-red-600 font-medium">
                        {formatCurrency(stat.expense)}
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Oxirgi Tranzaksiyalar</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/branch-admin/finance/transactions?cash_register=${registerId}`)}
          >
            Barchasi
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : Array.isArray(transactionsData?.results) && transactionsData.results.length > 0 ? (
            <div className="space-y-3">
              {transactionsData.results.slice(0, 5).map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => router.push(`/branch-admin/finance/transactions/${transaction.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      transaction.transaction_type === "income" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {transaction.transaction_type === "income" ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.category_name || transaction.description || "Tranzaksiya"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString("uz-UZ", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {" "}
                        {new Date(transaction.transaction_date).toLocaleTimeString("uz-UZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`text-sm font-bold ${
                      transaction.transaction_type === "income" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.transaction_type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : transaction.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs mt-1"
                    >
                      {transaction.status_display}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Tranzaksiyalar mavjud emas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
