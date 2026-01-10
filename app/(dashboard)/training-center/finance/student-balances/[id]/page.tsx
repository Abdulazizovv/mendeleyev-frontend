"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Wallet,
  User,
  Clock,
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
} from "lucide-react";

export default function StudentBalanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const balanceId = params.id as string;

  // Fetch balance detail
  const { data: balance, isLoading } = useQuery({
    queryKey: ["student-balance", balanceId],
    queryFn: () => financeApi.getStudentBalance(balanceId),
    enabled: !!balanceId,
  });

  // Fetch student's payments
  const { data: paymentsData } = useQuery({
    queryKey: ["student-payments", balance?.student_profile],
    queryFn: () =>
      financeApi.getPayments({
        student_profile: balance?.student_profile,
        ordering: "-payment_date",
      }),
    enabled: !!balance?.student_profile,
  });

  const payments = paymentsData?.results || [];

  // Fetch student's transactions
  const { data: transactionsData } = useQuery({
    queryKey: ["student-transactions", balance?.student_profile],
    queryFn: () =>
      financeApi.getTransactions({
        search: balance?.student_personal_number,
        ordering: "-transaction_date",
      }),
    enabled: !!balance?.student_profile && !!balance?.student_personal_number,
  });

  const transactions = transactionsData?.results || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Balans topilmadi</p>
          <Button
            onClick={() => router.push("/branch-admin/finance/student-balances")}
            className="mt-4"
          >
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getBalanceBg = (amount: number) => {
    if (amount > 0) return "bg-green-100";
    if (amount < 0) return "bg-red-100";
    return "bg-gray-100";
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance/student-balances")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {balance.student_name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {balance.student_personal_number}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              router.push(`/branch-admin/finance/payments/create?student=${balance.student_profile}`)
            }
            className="gap-2"
          >
            <DollarSign className="w-4 h-4" />
            To&apos;lov Qabul Qilish
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className={`border-t-4 ${balance.balance >= 0 ? 'border-t-green-500' : 'border-t-red-500'}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Joriy Balans</p>
              <p className={`text-4xl sm:text-5xl font-bold ${getBalanceColor(balance.balance)}`}>
                {formatCurrency(balance.balance)}
              </p>
              {balance.notes && (
                <p className="text-sm text-gray-500 mt-3">{balance.notes}</p>
              )}
            </div>
            <div className={`p-4 sm:p-6 ${getBalanceBg(balance.balance)} rounded-lg`}>
              <Wallet className={`w-12 h-12 sm:w-16 sm:h-16 ${getBalanceColor(balance.balance)}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            O&apos;quvchi Ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">To&apos;liq Ism</p>
              <p className="font-semibold text-gray-900">{balance.student_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Shaxsiy Raqam</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {balance.student_personal_number}
              </code>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Yaratilgan</p>
              <p className="text-sm text-gray-900">
                {new Date(balance.created_at).toLocaleDateString("uz-UZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">So&apos;nggi Yangilanish</p>
              <p className="text-sm text-gray-900">
                {new Date(balance.updated_at).toLocaleDateString("uz-UZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                {new Date(balance.updated_at).toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            So&apos;nggi To&apos;lovlar
          </CardTitle>
          {payments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/branch-admin/finance/payments?student=${balance.student_profile}`)
              }
            >
              Barchasini Ko&apos;rish
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">To&apos;lovlar yo&apos;q</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Abonement</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>Davr</TableHead>
                    <TableHead>Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 5).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <p className="text-sm text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString("uz-UZ", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700 max-w-xs truncate">
                          {payment.subscription_plan_name}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-100 text-green-700">
                          {formatCurrency(payment.final_amount)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{payment.period_display}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/branch-admin/finance/payments/${payment.id}`)
                          }
                        >
                          Ko&apos;rish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            So&apos;nggi Tranzaksiyalar
          </CardTitle>
          {transactions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/branch-admin/finance/transactions?student=${balance.student_profile}`)
              }
            >
              Barchasini Ko&apos;rish
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tranzaksiyalar yo&apos;q</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <p className="text-sm text-gray-900">
                          {new Date(transaction.transaction_date).toLocaleDateString("uz-UZ", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700 max-w-xs truncate">
                          {transaction.description || "Tranzaksiya"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.transaction_type === "income" ? "default" : "secondary"}
                          className={
                            transaction.transaction_type === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {transaction.transaction_type === "income" ? (
                            <>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Kirim
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Chiqim
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            transaction.transaction_type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.transaction_type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/branch-admin/finance/transactions/${transaction.id}`)
                          }
                        >
                          Ko&apos;rish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
