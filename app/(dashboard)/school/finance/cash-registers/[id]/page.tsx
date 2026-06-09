"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import UnifiedTransactionModal from "@/components/finance/UnifiedTransactionModal";
import type { CashRegister, Transaction } from "@/types/finance";

type ModalType = "income" | "expense" | "transfer" | null;

const TYPE_ICON: Record<string, React.ReactNode> = {
  income: <TrendingUp className="w-4 h-4 text-green-600" />,
  expense: <TrendingDown className="w-4 h-4 text-red-600" />,
  payment: <TrendingUp className="w-4 h-4 text-green-600" />,
  salary: <TrendingDown className="w-4 h-4 text-orange-600" />,
  transfer: <ArrowRightLeft className="w-4 h-4 text-blue-600" />,
  refund: <TrendingDown className="w-4 h-4 text-yellow-600" />,
};
const TYPE_COLOR: Record<string, string> = {
  income: "bg-green-50",
  expense: "bg-red-50",
  payment: "bg-green-50",
  salary: "bg-orange-50",
  transfer: "bg-blue-50",
  refund: "bg-yellow-50",
};
const AMOUNT_COLOR: Record<string, string> = {
  income: "text-green-600",
  expense: "text-red-600",
  payment: "text-green-600",
  salary: "text-orange-600",
  transfer: "text-blue-600",
  refund: "text-yellow-600",
};
const AMOUNT_PREFIX: Record<string, string> = {
  income: "+",
  expense: "-",
  payment: "+",
  salary: "-",
  transfer: "↔",
  refund: "-",
};

export default function CashRegisterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const registerId = params.id as string;
  const branchId = currentBranch?.branch_id ?? "";

  const [modalType, setModalType] = useState<ModalType>(null);
  const [txPage, setTxPage] = useState(1);

  const { data: cashRegister, isLoading: loadingRegister, refetch: refetchRegister } = useQuery<CashRegister>({
    queryKey: ["cash-register", registerId],
    queryFn: () => financeApi.getCashRegister(registerId),
  });

  const { data: txData, isLoading: loadingTx, refetch: refetchTx } = useQuery({
    queryKey: ["cash-register-transactions", registerId, txPage],
    queryFn: () => financeApi.getTransactions({
      cash_register: registerId,
      ordering: "-transaction_date",
      page: txPage,
      page_size: 20,
    }),
  });

  const transactions: Transaction[] = txData?.results ?? [];
  const txTotal = txData?.count ?? 0;
  const totalPages = Math.ceil(txTotal / 20);

  function handleSuccess() {
    refetchRegister();
    refetchTx();
  }

  if (loadingRegister) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (!cashRegister) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-3">
        <p className="text-gray-500">Kassa topilmadi</p>
        <Button variant="outline" onClick={() => router.push("/school/finance")}>Orqaga</Button>
      </div>
    );
  }

  return (
    <>
      {/* Back header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => router.push("/school/finance")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Orqaga
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{cashRegister.name}</h1>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={handleSuccess}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-0 h-[calc(100vh-120px)]">

        {/* ─── LEFT PANEL ─── */}
        <div className="w-72 shrink-0 border-r bg-white flex flex-col overflow-y-auto">
          {/* Balance card */}
          <div className="p-5 border-b">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Balans</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(cashRegister.balance)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={cashRegister.is_active ? "default" : "secondary"} className="text-xs">
                {cashRegister.is_active ? (
                  <><CheckCircle className="w-3 h-3 mr-1" />Faol</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" />Nofaol</>
                )}
              </Badge>
              {cashRegister.location && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{cashRegister.location}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Amallar</p>

            <button
              onClick={() => setModalType("income")}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3.5 text-left hover:bg-green-100 hover:border-green-300 transition-all group"
            >
              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Kirim</p>
                <p className="text-xs text-green-600">Pul qabul qilish</p>
              </div>
            </button>

            <button
              onClick={() => setModalType("expense")}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3.5 text-left hover:bg-red-100 hover:border-red-300 transition-all group"
            >
              <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm">Chiqim</p>
                <p className="text-xs text-red-600">Pul chiqarish</p>
              </div>
            </button>

            <button
              onClick={() => setModalType("transfer")}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3.5 text-left hover:bg-blue-100 hover:border-blue-300 transition-all group"
            >
              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-800 text-sm">Transfer</p>
                <p className="text-xs text-blue-600">Naqd ↔ Karta</p>
              </div>
            </button>
          </div>

          {/* Summary numbers */}
          <div className="p-4 border-t mt-auto space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Statistika</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tranzaksiyalar</span>
              <span className="font-semibold">{txTotal}</span>
            </div>
            {cashRegister.description && (
              <p className="text-xs text-gray-400 leading-relaxed">{cashRegister.description}</p>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* List header */}
          <div className="px-5 py-3 bg-white border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Barcha tranzaksiyalar</h2>
            <span className="text-xs text-gray-400">{txTotal} ta</span>
          </div>

          {/* Transaction list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingTx ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Wallet className="w-12 h-12 mb-3 text-gray-200" />
                <p className="text-sm">Tranzaksiyalar mavjud emas</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => router.push(`/school/finance/transactions/${tx.id}`)}
                  className="flex items-start gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${TYPE_COLOR[tx.transaction_type] ?? "bg-gray-50"}`}>
                    {TYPE_ICON[tx.transaction_type] ?? <Wallet className="w-4 h-4 text-gray-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tx.category_name || tx.transaction_type_display || "Tranzaksiya"}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{tx.description}</p>
                        )}
                        {(tx.student || tx.employee) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tx.student?.full_name ?? tx.employee?.full_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${AMOUNT_COLOR[tx.transaction_type] ?? "text-gray-700"}`}>
                          {AMOUNT_PREFIX[tx.transaction_type] ?? ""}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(tx.transaction_date).toLocaleDateString("uz-UZ", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant={
                          tx.status === "completed" ? "default"
                          : tx.status === "pending" ? "secondary"
                          : "destructive"
                        }
                        className="text-xs h-5"
                      >
                        {tx.status_display}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {tx.payment_method_display}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 bg-white border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                disabled={txPage === 1}
              >
                ‹ Oldingi
              </Button>
              <span className="text-sm text-gray-500">{txPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))}
                disabled={txPage === totalPages}
              >
                Keyingi ›
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Unified transaction modal */}
      {modalType && modalType !== "transfer" && cashRegister && branchId && (
        <UnifiedTransactionModal
          type={modalType}
          cashRegister={cashRegister}
          branchId={branchId}
          isOpen={true}
          onClose={() => setModalType(null)}
          onSuccess={handleSuccess}
        />
      )}
      {modalType === "transfer" && cashRegister && branchId && (
        <UnifiedTransactionModal
          type="transfer"
          cashRegister={cashRegister}
          branchId={branchId}
          isOpen={true}
          onClose={() => setModalType(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
