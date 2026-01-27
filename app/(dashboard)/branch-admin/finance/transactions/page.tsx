"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Receipt,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRANSACTION_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/types/finance";
import CreateIncomeModal from "@/components/finance/transactions/CreateIncomeModal";
import CreateExpenseModal from "@/components/finance/transactions/CreateExpenseModal";
import { ExportModal } from "@/components/finance/ExportModal";

export default function TransactionsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cashRegisterFilter, setCashRegisterFilter] = useState<string>("all");
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch cash registers for filter
  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const cashRegisters = cashRegistersData?.results || [];

  // Fetch transactions
  const { data: transactionsData, isLoading, refetch } = useQuery({
    queryKey: ["transactions", branchId, searchQuery, typeFilter, statusFilter, cashRegisterFilter],
    queryFn: () =>
      financeApi.getTransactions({
        branch_id: branchId,
        search: searchQuery || undefined,
        transaction_type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        cash_register: cashRegisterFilter !== "all" ? cashRegisterFilter : undefined,
        ordering: "-transaction_date",
      }),
    enabled: !!branchId,
  });

  const transactions = transactionsData?.results || [];

  // Calculate summary
  const summary = transactions.reduce(
    (acc, transaction) => {
      if (transaction.status === "completed") {
        if (transaction.transaction_type === "income" || transaction.transaction_type === "payment") {
          acc.totalIncome += transaction.amount;
        } else if (transaction.transaction_type === "expense" || transaction.transaction_type === "salary") {
          acc.totalExpense += transaction.amount;
        }
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    if (type === "income" || type === "payment") {
      return "text-green-600";
    } else if (type === "expense" || type === "salary") {
      return "text-red-600";
    }
    return "text-gray-600";
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tranzaksiyalar
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Barcha moliyaviy operatsiyalar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExpenseModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-200"
          >
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-red-600">Chiqim</span>
          </Button>
          <Button
            onClick={() => setIsIncomeModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <TrendingUp className="w-4 h-4" />
            Kirim
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Jami Kirim</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Jami Chiqim</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpense)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Sof Balans</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.totalIncome - summary.totalExpense)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={cashRegisterFilter} onValueChange={setCashRegisterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kassa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kassalar</SelectItem>
                {cashRegisters.map((register) => (
                  <SelectItem key={register.id} value={register.id.toString()}>
                    {register.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="income">Kirim</SelectItem>
                <SelectItem value="expense">Chiqim</SelectItem>
                <SelectItem value="payment">To&apos;lov</SelectItem>
                <SelectItem value="salary">Maosh</SelectItem>
                <SelectItem value="transfer">O&apos;tkazma</SelectItem>
                <SelectItem value="refund">Qaytarish</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="completed">Bajarilgan</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Eksport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Tranzaksiyalar ro&apos;yxati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-4">Yuklanmoqda...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Hech qanday tranzaksiya topilmadi</p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setIsIncomeModalOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  Kirim qo&apos;shish
                </Button>
                <Button
                  onClick={() => setIsExpenseModalOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  Chiqim qo&apos;shish
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Kassa</TableHead>
                    <TableHead>To&apos;lov usuli</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">
                        {new Date(transaction.transaction_date).toLocaleDateString(
                          "uz-UZ"
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getTypeColor(transaction.transaction_type)}`}>
                          {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {transaction.category_name || "-"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {transaction.cash_register_name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {PAYMENT_METHOD_LABELS[transaction.payment_method]}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {transaction.description || "-"}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${getTypeColor(transaction.transaction_type)}`}>
                        {(transaction.transaction_type === "income" || transaction.transaction_type === "payment") ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(transaction.status)}
                        >
                          {transaction.status_display}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateIncomeModal
        open={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsIncomeModalOpen(false);
        }}
      />

      <CreateExpenseModal
        open={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsExpenseModalOpen(false);
        }}
      />

      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        exportType="transactions"
        defaultFilters={{
          transaction_type: typeFilter !== "all" ? typeFilter as import('@/types/finance').TransactionType : undefined,
          status: statusFilter !== "all" ? statusFilter as import('@/types/finance').TransactionStatus : undefined,
          cash_register: cashRegisterFilter !== "all" ? cashRegisterFilter : undefined,
          search: searchQuery || undefined,
        }}
      />
    </div>
  );
}
