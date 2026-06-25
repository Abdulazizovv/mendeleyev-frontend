'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet, CheckCircle2, AlertCircle, ClipboardList,
  TrendingUp, Calendar, Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/translations';

export default function TeacherFinancePage() {
  const { currentBranch, user } = useAuth();

  const balance     = currentBranch?.balance ?? null;
  const salary      = currentBranch?.salary  ?? null;
  const salaryType  = (currentBranch as any)?.salary_type as string | null ?? null;
  const isPositive  = (balance ?? 0) >= 0;

  const salaryTypeLabel: Record<string, string> = {
    fixed:      'Belgilangan oylik',
    percentage: 'Foiz asosida',
    per_lesson: 'Dars başiga',
    hourly:     'Soatlik',
  };

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Moliyaviy holat</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : "O'qituvchi"} · maosh va balans
        </p>
      </div>

      {/* Balance card */}
      {balance !== null && (
        <Card className={`shadow-sm border-2 ${isPositive ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                  {isPositive ? 'Joriy balans' : 'Qarzdorlik'}
                </p>
                <p className={`text-4xl font-bold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                  {isPositive ? '+' : '-'}{formatCurrency(Math.abs(balance))}
                </p>
              </div>
              {isPositive
                ? <CheckCircle2 className="w-14 h-14 text-green-300" />
                : <AlertCircle  className="w-14 h-14 text-red-300"   />
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary card */}
      {salary !== null && (
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Maosh ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {salaryType ? salaryTypeLabel[salaryType] ?? 'Oylik maosh' : 'Oylik maosh'}
                </p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(salary)}</p>
              </div>
              <Wallet className="w-10 h-10 text-blue-300" />
            </div>

            {salaryType && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                Hisoblash turi: <span className="font-medium text-gray-700">{salaryTypeLabel[salaryType] ?? salaryType}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No data */}
      {balance === null && salary === null && (
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">Moliyaviy ma'lumot mavjud emas</p>
            <p className="text-gray-300 text-xs mt-1">Administrator bilan bog'laning</p>
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          To'lovlar va tranzaksiyalar tarixi uchun filial administratori bilan bog'laning.
          Maosh hisob-kitobi har oyning oxirida amalga oshiriladi.
        </p>
      </div>
    </div>
  );
}
