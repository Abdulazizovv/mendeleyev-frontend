"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, TrendingUp, TrendingDown, Wallet, Calendar, FileText,
  CreditCard, Hash, User, Building2, Info, AlertTriangle, XCircle,
  Clock, CheckCircle, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import { financeApi } from "@/lib/api/finance";
import { toast } from "sonner";
import type { Transaction } from "@/types/finance";

const TYPE_LABELS: Record<string, string> = {
  income: "Kirim",
  expense: "Chiqim",
  payment: "O'quvchi to'lovi",
  salary: "Maosh",
  refund: "Qaytarish",
  transfer: "O'tkazma",
};

const MONTH_NAMES: Record<string, string> = {
  "01": "Yanvar", "02": "Fevral", "03": "Mart", "04": "Aprel",
  "05": "May",    "06": "Iyun",   "07": "Iyul",  "08": "Avgust",
  "09": "Sentabr","10": "Oktabr", "11": "Noyabr","12": "Dekabr",
};

function fmtPeriodMonth(ym: string) {
  const [year, month] = ym.split("-");
  return `${MONTH_NAMES[month] ?? month} ${year}`;
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("uz-UZ", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const transactionId = params.id as string;
  const [cancelling, setCancelling] = useState(false);

  const { data: transaction, isLoading } = useQuery<Transaction>({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const response = await apiClient.get(`/school/finance/transactions/${transactionId}/`);
      return response.data;
    },
  });

  async function handleCancel() {
    setCancelling(true);
    try {
      await financeApi.cancelTransaction(transactionId);
      toast.success("Tranzaksiya bekor qilindi");
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["tx-summary"] });
      queryClient.invalidateQueries({ queryKey: ["register-method-balance"] });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tranzaksiya topilmadi</h2>
          <p className="text-gray-600 mb-4">Bunday tranzaksiya mavjud emas</p>
          <Button onClick={() => router.push("/school/finance/transactions")}>
            Orqaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const isCancelled = transaction.status === "cancelled";
  const isIncome = ["income", "payment", "refund"].includes(transaction.transaction_type);
  const typeLabel = TYPE_LABELS[transaction.transaction_type] ?? transaction.transaction_type_display;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/school/finance/transactions")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Tranzaksiya #{transaction.id}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Tranzaksiya tafsilotlari</p>
          </div>
        </div>
      </div>

      {/* Main Card - Amount & Type */}
      <Card className={`border-t-4 ${
        isCancelled ? "border-t-gray-400" : isIncome ? "border-t-green-500" : "border-t-red-500"
      }`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${
                isCancelled ? "bg-gray-100" : isIncome ? "bg-green-100" : "bg-red-100"
              }`}>
                {isCancelled
                  ? <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
                  : isIncome
                    ? <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                    : <TrendingDown className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                }
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Summa</p>
              <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${
                isCancelled ? "text-gray-400 line-through" : isIncome ? "text-green-600" : "text-red-600"
              }`}>
                {isIncome ? "+" : "−"}{formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Badge
                variant={isCancelled ? "secondary" : isIncome ? "default" : "destructive"}
                className="text-sm px-4 py-1"
              >
                {typeLabel}
              </Badge>
              <Badge
                variant={
                  transaction.status === "completed" ? "default"
                  : transaction.status === "pending" ? "secondary"
                  : "destructive"
                }
                className="text-sm px-4 py-1"
              >
                {transaction.status_display}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Asosiy Ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-500">Kassa</p>
                  <button
                    onClick={() => router.push(`/school/finance/cash-registers/${transaction.cash_register}`)}
                    className="text-sm sm:text-base font-medium text-blue-600 hover:underline mt-1 text-left"
                  >
                    {transaction.cash_register_name}
                  </button>
                </div>
              </div>

              {transaction.category_name && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Kategoriya</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                        {transaction.category_name}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {transaction.payment_method && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">To'lov usuli</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                        {transaction.payment_method_display}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Tranzaksiya sanasi</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                    {fmtDt(transaction.transaction_date)}
                  </p>
                </div>
              </div>

              {transaction.period_month && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-teal-100">
                      <Clock className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">To'lov oyi</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                        {fmtPeriodMonth(transaction.period_month)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {transaction.reference_number && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <Hash className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Referens raqami</p>
                      <p className="text-sm sm:text-base font-mono font-medium text-gray-900 mt-1">
                        {transaction.reference_number}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {transaction.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Izoh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {transaction.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Student / Employee Info */}
          {(transaction.student_profile || transaction.employee_membership) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {transaction.student_profile ? "O'quvchi" : "Xodim"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.student && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.student.full_name}</p>
                      {transaction.student.phone_number && (
                        <p className="text-sm text-gray-500">{transaction.student.phone_number}</p>
                      )}
                    </div>
                  </div>
                )}
                {transaction.employee && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.employee.full_name}</p>
                      {transaction.employee.phone_number && (
                        <p className="text-sm text-gray-500">{transaction.employee.phone_number}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Third party */}
          {transaction.third_party_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Uchinchi shaxs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base font-medium text-gray-900">
                  {transaction.third_party_name}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Qo'shimcha Ma'lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(transaction.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-3">
                      <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm font-medium text-gray-900 text-right">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Audit Ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Created by */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Yaratdi</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {transaction.created_by_info?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{fmtDt(transaction.created_at)}</p>
                </div>
              </div>

              {/* Updated by (only if different from created) */}
              {transaction.updated_by_info && transaction.updated_at !== transaction.created_at && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-50">
                      <Clock className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">O'zgartirdi</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {transaction.updated_by_info.full_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtDt(transaction.updated_at)}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Cancelled by */}
              {isCancelled && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-50">
                      <UserX className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Bekor qildi</p>
                      <p className="text-sm font-medium text-red-700 mt-0.5">
                        {transaction.cancelled_by_info?.full_name ?? "—"}
                      </p>
                      {transaction.cancelled_at && (
                        <p className="text-xs text-gray-500 mt-0.5">{fmtDt(transaction.cancelled_at)}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Section */}
      {!isCancelled && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Tranzaksiyani bekor qilish</p>
                  <p className="text-xs text-red-600 mt-1">
                    Bu amalni ortga qaytarib bo'lmaydi. Kassa balansi avtomatik teskari qaytariladi.
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0"
                    disabled={cancelling}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Bekor qilish
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Tranzaksiyani bekor qilishni tasdiqlang
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">
                        <strong>{formatCurrency(transaction.amount)}</strong> miqdoridagi tranzaksiyani bekor qilmoqchisiz.
                      </span>
                      <span className="block text-red-600 font-medium">
                        Diqqat: Bu amal ortga qaytarib bo'lmaydi!
                      </span>
                      <span className="block">
                        Kassa balansi avtomatik teskari qaytariladi.
                        {transaction.student_profile && " O'quvchi balansi ham teskari qaytariladi."}
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Yopish</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      disabled={cancelling}
                    >
                      {cancelling ? "Bekor qilinmoqda..." : "Ha, bekor qilaman"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
