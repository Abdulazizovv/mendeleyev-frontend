"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
} from "lucide-react";
import { BalanceDetailSheet } from "@/components/finance/balances/BalanceDetailSheet";
import { PaymentDetailSheet } from "@/components/finance/payments/PaymentDetailSheet";
import { PaymentModal } from "@/components/finance/payments/PaymentModal";
import type { StudentBalance, Payment } from "@/types/finance";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function StudentBalancesPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<StudentBalance | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["student-balances", branchId, search, sortAsc],
    queryFn: () =>
      financeApi.getStudentBalances({
        branch_id: branchId,
        search: search || undefined,
        ordering: sortAsc ? "balance" : "-balance",
      }),
    enabled: !!branchId,
  });

  const balances = data?.results || [];

  const stats = balances.reduce(
    (acc, b) => {
      if (b.balance > 0) {
        acc.pos++;
        acc.posSum += b.balance;
      } else if (b.balance < 0) {
        acc.neg++;
        acc.negSum += b.balance;
      } else {
        acc.zero++;
      }
      return acc;
    },
    { pos: 0, posSum: 0, neg: 0, negSum: 0, zero: 0 }
  );

  function handleAddPayment() {
    setSelectedBalance(null);
    setPaymentOpen(true);
  }

  return (
    <>
      <div className="space-y-4 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              O&apos;quvchi balanslari
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {!isLoading && `${data?.count ?? balances.length} ta o'quvchi`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="w-8 h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
            <div className="p-1.5 bg-green-100 rounded-lg shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-green-600 font-medium">
                {stats.pos} ta ijobiy
              </p>
              <p className="text-sm font-bold text-green-700 truncate">
                {formatCurrency(stats.posSum)}
              </p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
            <div className="p-1.5 bg-red-100 rounded-lg shrink-0">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-red-600 font-medium">
                {stats.neg} ta salbiy
              </p>
              <p className="text-sm font-bold text-red-700 truncate">
                {formatCurrency(stats.negSum)}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg shrink-0">
              <Wallet className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                {stats.zero} ta nol
              </p>
              <p className="text-sm font-bold text-gray-600">Balansiz</p>
            </div>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Ism yoki shaxsiy raqam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3 h-9 text-xs font-medium rounded-lg border bg-white text-gray-600 border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            Balans {sortAsc ? "↑" : "↓"}
          </button>
        </div>

        {/* List */}
        <div className="bg-white border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Yuklanmoqda...</p>
            </div>
          ) : balances.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">O&apos;quvchilar topilmadi</p>
            </div>
          ) : (
            <div className="divide-y">
              {balances.map((b) => {
                const pos = b.balance > 0;
                const neg = b.balance < 0;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBalance(b)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold",
                          pos
                            ? "bg-green-100 text-green-700"
                            : neg
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {getInitials(b.student_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {b.student_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.student_personal_number}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "text-sm font-bold shrink-0",
                        pos
                          ? "text-green-600"
                          : neg
                          ? "text-red-600"
                          : "text-gray-400"
                      )}
                    >
                      {pos && "+"}
                      {formatCurrency(b.balance)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {data && data.count > balances.length && (
          <p className="text-center text-xs text-gray-400">
            Ko&apos;rsatilgan: {balances.length} / {data.count}
          </p>
        )}
      </div>

      <BalanceDetailSheet
        balance={selectedBalance}
        onClose={() => setSelectedBalance(null)}
        onPaymentClick={setSelectedPayment}
        onAddPayment={handleAddPayment}
      />

      <PaymentDetailSheet
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
}
