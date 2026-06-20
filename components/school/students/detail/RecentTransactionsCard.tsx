"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, ArrowRightLeft,
  Banknote, CreditCard, Building2,
  GraduationCap, Calendar, Receipt, ExternalLink,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentTransactionsCardProps {
  transactions: any[];
  studentId: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  /** school | branch-admin | training-center */
  role?: string;
}

const UZ_MONTH_NAMES: Record<string, string> = {
  "01":"Yanvar","02":"Fevral","03":"Mart","04":"Aprel",
  "05":"May","06":"Iyun","07":"Iyul","08":"Avgust",
  "09":"Sentabr","10":"Oktabr","11":"Noyabr","12":"Dekabr",
};
function fmtPeriod(ym: string) {
  const [y, m] = ym.split("-");
  return `${UZ_MONTH_NAMES[m] ?? m} ${y}`;
}

const TYPE_CFG: Record<string, { label: string; iconBg: string; iconCls: string; amtCls: string; sign: string }> = {
  income:   { label: "Kirim",     iconBg: "bg-emerald-100", iconCls: "text-emerald-600", amtCls: "text-emerald-600", sign: "+"  },
  payment:  { label: "To'lov",    iconBg: "bg-emerald-100", iconCls: "text-emerald-600", amtCls: "text-emerald-600", sign: "+"  },
  expense:  { label: "Chiqim",    iconBg: "bg-rose-100",    iconCls: "text-rose-600",    amtCls: "text-rose-600",    sign: "−"  },
  salary:   { label: "Maosh",     iconBg: "bg-amber-100",   iconCls: "text-amber-600",   amtCls: "text-amber-600",   sign: "−"  },
  transfer: { label: "O'tkazma",  iconBg: "bg-blue-100",    iconCls: "text-blue-600",    amtCls: "text-blue-600",    sign: "⇄" },
  refund:   { label: "Qaytarish", iconBg: "bg-orange-100",  iconCls: "text-orange-600",  amtCls: "text-orange-600",  sign: "+"  },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  completed: { label: "Bajarilgan",     cls: "bg-emerald-100 text-emerald-700" },
  pending:   { label: "Kutilmoqda",     cls: "bg-yellow-100 text-yellow-700"  },
  cancelled: { label: "Bekor qilingan", cls: "bg-slate-100 text-slate-500"    },
  failed:    { label: "Xatolik",        cls: "bg-red-100 text-red-700"        },
};

const METHOD_CFG: Record<string, { label: string; Icon: React.ElementType; cls: string }> = {
  cash: { label: "Naqd",    Icon: Banknote,   cls: "bg-amber-50 text-amber-700 border-amber-200"   },
  card: { label: "Plastik", Icon: CreditCard, cls: "bg-blue-50 text-blue-700 border-blue-200"      },
  bank: { label: "Bank",    Icon: Building2,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export function RecentTransactionsCard({
  transactions,
  studentId,
  formatCurrency,
  formatDate,
  role = "school",
}: RecentTransactionsCardProps) {
  const router = useRouter();

  const txListHref = `/${role}/finance/transactions?student=${studentId}`;

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Tranzaksiyalar yo'q</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">So'nggi tranzaksiyalar</span>
          <span className="text-xs text-slate-400">({transactions.length})</span>
        </div>
        <button
          onClick={() => router.push(txListHref)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          Barchasi
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {transactions.map((tx: any) => {
          const typeCfg = TYPE_CFG[tx.transaction_type] ?? TYPE_CFG.income;
          const statusCfg = STATUS_CFG[tx.status];
          const methodCfg = METHOD_CFG[tx.payment_method];
          const isCancelled = tx.status === "cancelled";

          // To'lov oylari
          const periods: string[] =
            tx.period_months && tx.period_months.length > 0
              ? tx.period_months
              : tx.period_month ? [tx.period_month] : [];

          const TypeIcon = tx.transaction_type === "transfer"
            ? ArrowRightLeft
            : ["income","payment","refund"].includes(tx.transaction_type)
            ? TrendingUp
            : TrendingDown;

          return (
            <div
              key={tx.id}
              onClick={() => router.push(`/${role}/finance/transactions/${tx.id}`)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors",
                isCancelled && "opacity-60"
              )}
            >
              {/* Icon */}
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", typeCfg.iconBg)}>
                <TypeIcon className={cn("w-4 h-4", typeCfg.iconCls)} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {tx.category?.name ?? typeCfg.label}
                  </span>
                  {isCancelled && (
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusCfg?.cls)}>
                      <UserX className="w-2.5 h-2.5 inline mr-0.5" />
                      {statusCfg?.label}
                    </span>
                  )}
                  {tx.status === "pending" && (
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusCfg?.cls)}>
                      {statusCfg?.label}
                    </span>
                  )}
                </div>

                {/* To'lov oylari chips */}
                {periods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    {periods.map((ym) => (
                      <span
                        key={ym}
                        className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded"
                      >
                        {fmtPeriod(ym)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">{formatDate(tx.transaction_date)}</span>
                  {tx.cash_register && (
                    <span className="text-[11px] text-slate-400">· {tx.cash_register.name}</span>
                  )}
                  {methodCfg && (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-medium border px-1.5 py-0.5 rounded-full",
                      methodCfg.cls
                    )}>
                      <methodCfg.Icon className="w-2.5 h-2.5" />
                      {methodCfg.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className={cn("text-sm font-bold tabular-nums", typeCfg.amtCls)}>
                  {typeCfg.sign}{formatCurrency(Math.abs(tx.amount))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
