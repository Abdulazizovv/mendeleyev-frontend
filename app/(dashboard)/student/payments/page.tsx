'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { financeApi } from '@/lib/api/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/translations';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

export default function StudentPaymentsPage() {
  const { currentBranch, user } = useAuth();
  const branchId    = currentBranch?.branch_id ?? '';
  const authBalance = currentBranch?.balance ?? null;

  // Try to get full balance record with transactions
  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ['student-balance-record', branchId],
    queryFn: () => financeApi.getStudentBalances({ branch_id: branchId }),
    enabled: !!branchId,
    retry: false,
  });

  const balanceRecord = balancesData?.results?.[0] ?? null;
  const balance = balanceRecord?.balance ?? authBalance ?? 0;

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['student-balance-transactions', balanceRecord?.id],
    queryFn: () => financeApi.getStudentBalanceTransactions(balanceRecord!.id, { branch_id: branchId, ordering: '-occurred_at' }),
    enabled: !!balanceRecord?.id,
    retry: false,
  });

  const isPositive = balance >= 0;
  const recentTx   = transactions.slice(0, 20);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Moliyaviy holat</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : 'O\'quvchi'} · balans va to'lovlar
        </p>
      </div>

      {/* Balance card */}
      {balancesLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : (
        <Card className={`shadow-sm border-2 ${isPositive ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                  {isPositive ? 'Joriy balans' : 'Qarzdorlik'}
                </p>
                <p className={`text-4xl font-bold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                  {isPositive ? '+' : '-'}{formatCurrency(Math.abs(balance))}
                </p>
                {balanceRecord && (
                  <p className="text-xs text-gray-400 mt-1">
                    Yangilangan: {formatDate(balanceRecord.updated_at)}
                  </p>
                )}
              </div>
              {isPositive ? (
                <CheckCircle2 className="w-14 h-14 text-green-300" />
              ) : (
                <AlertCircle className="w-14 h-14 text-red-300" />
              )}
            </div>

            {!isPositive && (
              <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  To'lov muddati o'tgan. Iltimos, filial kassasiga to'lov qiling.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      {!balancesLoading && transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            bg="bg-green-50"
            label="Jami kirim"
            value={formatCurrency(
              transactions.filter(t => t.transaction_type === 'credit').reduce((s, t) => s + t.amount, 0)
            )}
            color="text-green-700"
          />
          <SummaryCard
            icon={<TrendingDown className="w-5 h-5 text-red-600" />}
            bg="bg-red-50"
            label="Jami chiqim"
            value={formatCurrency(
              transactions.filter(t => t.transaction_type === 'debit').reduce((s, t) => s + t.amount, 0)
            )}
            color="text-red-700"
          />
        </div>
      )}

      {/* Transactions */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" /> Oxirgi tranzaksiyalar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : recentTx.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Tranzaksiyalar topilmadi</p>
              {!balanceRecord && (
                <p className="text-xs text-gray-300 mt-1">Ma'lumot mavjud emas</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    tx.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.transaction_type === 'credit'
                      ? <ArrowDownCircle className="w-5 h-5 text-green-600" />
                      : <ArrowUpCircle className="w-5 h-5 text-red-600" />
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.reason_display || tx.description || tx.transaction_type_display}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.occurred_at || tx.created_at)}</p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Balans: {formatCurrency(tx.new_balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon, bg, label, value, color,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-4">
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <div className={`text-lg font-bold ${color}`}>{value}</div>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
