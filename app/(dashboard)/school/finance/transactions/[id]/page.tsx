"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown, Wallet, Calendar, FileText, CreditCard, Hash, User, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import apiClient from "@/lib/api/client";

interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  reference_number: string | null;
  transaction_date: string;
  status: "pending" | "completed" | "cancelled";
  metadata: Record<string, any> | null;
  cash_register: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  } | null;
  payment_method?: {
    id: number;
    name: string;
  } | null;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  created_by: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  // Tranzaksiya ma'lumotlarini olish
  const { data: transaction, isLoading } = useQuery<Transaction>({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const response = await apiClient.get(`/school/finance/transactions/${transactionId}/`);
      return response.data;
    },
  });

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

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tranzaksiya topilmadi</h2>
          <p className="text-gray-600 mb-4">Bunday tranzaksiya mavjud emas</p>
          <Button onClick={() => router.push("/branch-admin/finance/transactions")}>
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
            onClick={() => router.push("/branch-admin/finance/transactions")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Tranzaksiya #{transaction.id}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tranzaksiya tafsilotlari
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

      {/* Main Card - Amount & Type */}
      <Card className={`border-t-4 ${
        transaction.type === "income" ? "border-t-green-500" : "border-t-red-500"
      }`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${
                transaction.type === "income" ? "bg-green-100" : "bg-red-100"
              }`}>
                {transaction.type === "income" ? (
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                ) : (
                  <TrendingDown className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Summa</p>
              <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${
                transaction.type === "income" ? "text-green-600" : "text-red-600"
              }`}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            {/* Type & Status */}
            <div className="flex items-center justify-center gap-3">
              <Badge
                variant={transaction.type === "income" ? "default" : "destructive"}
                className="text-sm px-4 py-1"
              >
                {transaction.type === "income" ? "Kirim" : "Chiqim"}
              </Badge>
              <Badge
                variant={
                  transaction.status === "completed"
                    ? "default"
                    : transaction.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
                className="text-sm px-4 py-1"
              >
                {transaction.status === "completed" ? "Bajarildi" : 
                 transaction.status === "pending" ? "Kutilmoqda" : "Bekor qilindi"}
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
              {/* Cash Register */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-500">Kassa</p>
                  <button
                    onClick={() => router.push(`/branch-admin/finance/cash-registers/${transaction.cash_register.id}`)}
                    className="text-sm sm:text-base font-medium text-blue-600 hover:underline mt-1 text-left"
                  >
                    {transaction.cash_register.name}
                  </button>
                </div>
              </div>

              <Separator />

              {/* Category */}
              {transaction.category && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Kategoriya</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                        {transaction.category.name}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Payment Method */}
              {transaction.payment_method && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">To'lov usuli</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                        {transaction.payment_method.name}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Sana</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                    {new Date(transaction.transaction_date).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(transaction.transaction_date).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Reference Number */}
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

          {/* Description Card */}
          {transaction.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tavsif
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
          {/* Student/Employee Info */}
          {(transaction.student || transaction.employee) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {transaction.student ? "O'quvchi" : "Xodim"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.student && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.student.first_name} {transaction.student.last_name}
                      </p>
                      <p className="text-sm text-gray-500">ID: {transaction.student.id}</p>
                    </div>
                  </div>
                )}
                {transaction.employee && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.employee.first_name} {transaction.employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500">ID: {transaction.employee.id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
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
                      <p className="text-sm text-gray-500 capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-medium text-gray-900 text-right">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Tizim Ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Yaratdi</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                  {transaction.created_by.username}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Yaratilgan vaqt</p>
                <p className="text-sm sm:text-base text-gray-900 mt-1">
                  {new Date(transaction.created_at).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(transaction.created_at).toLocaleTimeString("uz-UZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Oxirgi o'zgarish</p>
                <p className="text-sm sm:text-base text-gray-900 mt-1">
                  {new Date(transaction.updated_at).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(transaction.updated_at).toLocaleTimeString("uz-UZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
