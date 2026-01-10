"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  RefreshCw,
} from "lucide-react";

export default function StudentBalancesPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [searchQuery, setSearchQuery] = useState("");
  const [ordering, setOrdering] = useState("-balance");

  // Fetch student balances
  const { data: balancesData, isLoading, refetch } = useQuery({
    queryKey: ["student-balances", branchId, searchQuery, ordering],
    queryFn: () =>
      financeApi.getStudentBalances({
        branch_id: branchId,
        search: searchQuery || undefined,
        ordering: ordering,
      }),
    enabled: !!branchId,
  });

  const balances = balancesData?.results || [];

  // Calculate summary statistics
  const summary = balances.reduce(
    (acc, balance) => {
      acc.totalBalance += balance.balance;
      if (balance.balance > 0) {
        acc.positiveCount += 1;
        acc.positiveBalance += balance.balance;
      } else if (balance.balance < 0) {
        acc.negativeCount += 1;
        acc.negativeBalance += balance.balance;
      } else {
        acc.zeroCount += 1;
      }
      return acc;
    },
    {
      totalBalance: 0,
      positiveCount: 0,
      positiveBalance: 0,
      negativeCount: 0,
      negativeBalance: 0,
      zeroCount: 0,
    }
  );

  const getBalanceBadge = (balance: number) => {
    if (balance > 0) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
          {formatCurrency(balance)}
        </Badge>
      );
    } else if (balance < 0) {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
          {formatCurrency(balance)}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        {formatCurrency(balance)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              O&apos;quvchilar Balanslari
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Barcha o&apos;quvchilar moliyaviy holati
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Eksport
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Umumiy Balans</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.totalBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {balances.length} ta o&apos;quvchi
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Ijobiy Balans</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(summary.positiveBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.positiveCount} ta o&apos;quvchi
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
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Salbiy Balans</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {formatCurrency(summary.negativeBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.negativeCount} ta o&apos;quvchi
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-gray-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Nol Balans</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600">
                  {summary.zeroCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ta o&apos;quvchi
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Ism yoki shaxsiy raqam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={ordering === "-balance" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrdering("-balance")}
                className="flex-1"
              >
                Balans ↓
              </Button>
              <Button
                variant={ordering === "balance" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrdering("balance")}
                className="flex-1"
              >
                Balans ↑
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={ordering === "student_name" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrdering("student_name")}
                className="flex-1"
              >
                Ism A-Z
              </Button>
              <Button
                variant={ordering === "-created_at" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrdering("-created_at")}
                className="flex-1"
              >
                Yangi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            O&apos;quvchilar Ro&apos;yxati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Yuklanmoqda...</p>
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">O&apos;quvchilar topilmadi</p>
              <p className="text-sm text-gray-400">
                Filtrlarni o&apos;zgartiring yoki yangi o&apos;quvchi qo&apos;shing
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">O&apos;quvchi</TableHead>
                    <TableHead className="whitespace-nowrap">Shaxsiy Raqam</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Balans</TableHead>
                    <TableHead className="whitespace-nowrap">Eslatma</TableHead>
                    <TableHead className="whitespace-nowrap">So&apos;nggi Yangilanish</TableHead>
                    <TableHead className="whitespace-nowrap">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow
                      key={balance.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <p className="font-medium text-gray-900">
                          {balance.student_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {balance.student_personal_number}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        {getBalanceBadge(balance.balance)}
                      </TableCell>
                      <TableCell>
                        {balance.notes ? (
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {balance.notes}
                          </p>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600">
                          {new Date(balance.updated_at).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(balance.updated_at).toLocaleTimeString("uz-UZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/branch-admin/finance/student-balances/${balance.id}`)
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

      {/* Pagination Info */}
      {balancesData && balancesData.count > balances.length && (
        <Card>
          <CardContent className="p-4 text-center text-sm text-gray-600">
            Ko&apos;rsatilgan: {balances.length} / {balancesData.count}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
