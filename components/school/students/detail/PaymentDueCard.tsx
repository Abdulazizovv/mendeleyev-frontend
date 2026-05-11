import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, CreditCard, AlertCircle, Wallet, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { financeApi } from "@/lib/api/finance";
import { formatDateUz } from "@/lib/translations";

interface PaymentDueCardProps {
  paymentDue: any;
  studentId: string;
  formatCurrency: (amount: number) => string;
  onChargeSuccess?: () => void;
}

export function PaymentDueCard({
  paymentDue,
  studentId,
  formatCurrency,
  onChargeSuccess,
}: PaymentDueCardProps) {
  const router = useRouter();
  const [chargingId, setChargingId] = useState<string | null>(null);

  if (!paymentDue || !paymentDue.has_subscription) return null;

  const isOverdue = paymentDue.subscriptions.some((s: any) => s.is_overdue);
  const totalAmount: number = paymentDue.total_amount ?? 0;
  const availableBalance: number = paymentDue.available_balance ?? 0;
  const netAmountDue: number = paymentDue.net_amount_due ?? Math.max(0, totalAmount - availableBalance);

  const handleForceCharge = async (subscriptionId: string) => {
    setChargingId(subscriptionId);
    try {
      await financeApi.chargeStudentSubscription(subscriptionId, true);
      onChargeSuccess?.();
    } catch {
      // silently ignore — user can retry
    } finally {
      setChargingId(null);
    }
  };

  return (
    <Card className={`border-2 ${isOverdue ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOverdue ? (
            <>
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-900">To&apos;lov Kerak!</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900">To&apos;lov Xulosa</span>
            </>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Yig'ish kerak */}
        <div className={`rounded-lg p-4 border-2 ${netAmountDue > 0 ? "bg-white border-red-300" : "bg-white border-green-300"}`}>
          <p className="text-sm text-gray-600 mb-1">Yig&apos;ish kerak</p>
          <p className={`text-3xl font-bold ${netAmountDue > 0 ? "text-red-700" : "text-green-600"}`}>
            {formatCurrency(netAmountDue)}
          </p>
          {netAmountDue === 0 && totalAmount > 0 && (
            <p className="text-xs text-green-600 mt-1">Balans yetarli — to&apos;lov kerak emas</p>
          )}
        </div>

        {/* Balans va majburiyat */}
        {(availableBalance > 0 || totalAmount > 0) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-3 border text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Mavjud balans</span>
              </div>
              <p className="text-sm font-bold text-blue-700">{formatCurrency(availableBalance)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Jami majburiyat</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Abonementlar */}
        <div className="space-y-3">
          {paymentDue.subscriptions.map((sub: any, idx: number) => {
            const debtMonths: number =
              sub.debt_months ??
              (sub.subscription_price > 0 ? Math.round(sub.debt_amount / sub.subscription_price) : 0);

            const canForceCharge =
              (sub.is_overdue || sub.debt_amount > 0) && availableBalance > 0 && sub.total_amount > 0;

            return (
              <div
                key={idx}
                className={`rounded-lg p-3 border ${sub.is_overdue ? "bg-red-100 border-red-300" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{sub.subscription_plan_name}</p>
                  {sub.is_overdue && (
                    <Badge className="bg-red-600 text-white text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Kechikkan
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Joriy oylik:</span>
                    <span className="font-medium">
                      {formatCurrency(sub.amount_after_discount ?? sub.current_amount)}
                    </span>
                  </div>

                  {sub.has_discount && sub.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Chegirma:</span>
                      <span className="font-medium">−{formatCurrency(sub.discount_amount)}</span>
                    </div>
                  )}

                  {sub.debt_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Qarz{debtMonths > 0 ? ` (${debtMonths} oy)` : ""}:</span>
                      <span className="font-medium">{formatCurrency(sub.debt_amount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Jami:</span>
                    <span className={sub.is_overdue ? "text-red-700" : "text-blue-700"}>
                      {formatCurrency(sub.total_amount)}
                    </span>
                  </div>

                  {sub.next_due_date && (
                    <p className="text-gray-400 pt-0.5">
                      Keyingi to&apos;lov: {formatDateUz(sub.next_due_date)}
                    </p>
                  )}
                </div>

                {canForceCharge && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 border-red-300 text-red-700 hover:bg-red-50 text-xs h-7"
                    disabled={chargingId === sub.subscription_id}
                    onClick={() => handleForceCharge(sub.subscription_id)}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {chargingId === sub.subscription_id
                      ? "Yechilyapti..."
                      : sub.debt_amount > 0
                      ? `Qarz + oylikni yechish (${formatCurrency(sub.total_amount)})`
                      : "Balansdan yechish"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Asosiy to'lov tugmasi */}
        {netAmountDue > 0 && (
          <Button
            className={`w-full ${isOverdue ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={() =>
              router.push(`/school/finance/payments/create?student=${studentId}&amount=${netAmountDue}`)
            }
          >
            <CreditCard className="w-4 h-4 mr-2" />
            To&apos;lov Qabul Qilish ({formatCurrency(netAmountDue)})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
