import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentDueCardProps {
  paymentDue: any;
  studentId: string;
  formatCurrency: (amount: number) => string;
}

export function PaymentDueCard({
  paymentDue,
  studentId,
  formatCurrency,
}: PaymentDueCardProps) {
  const router = useRouter();

  if (!paymentDue || !paymentDue.has_subscription) return null;

  const isOverdue = paymentDue.subscriptions.some((s: any) => s.is_overdue);

  return (
    <Card
      className={`border-2 ${
        isOverdue
          ? "border-red-200 bg-red-50"
          : "border-blue-200 bg-blue-50"
      }`}
    >
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
        {/* Total Amount */}
        <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
          <p className="text-sm text-gray-600 mb-1">Jami to&apos;lov</p>
          <p className="text-3xl font-bold text-blue-700">
            {formatCurrency(paymentDue.total_amount)} so&apos;m
          </p>
        </div>

        {/* Subscriptions Breakdown */}
        <div className="space-y-3">
          {paymentDue.subscriptions.map((sub: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-lg p-3 border ${
                sub.is_overdue
                  ? "bg-red-100 border-red-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-sm">
                  {sub.subscription_plan_name}
                </p>
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
                    {formatCurrency(sub.current_amount)} so&apos;m
                  </span>
                </div>
                {sub.debt_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Qarz ({sub.overdue_months} oy):</span>
                    <span className="font-medium">
                      {formatCurrency(sub.debt_amount)} so&apos;m
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Jami:</span>
                  <span className={sub.is_overdue ? "text-red-700" : "text-blue-700"}>
                    {formatCurrency(sub.total_amount)} so&apos;m
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Payment Button */}
        <Button
          className={`w-full ${
            isOverdue
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={() =>
            router.push(
              `/branch-admin/finance/payments/create?student=${studentId}&amount=${paymentDue.total_amount}`
            )
          }
        >
          <CreditCard className="w-4 h-4 mr-2" />
          To&apos;lov Qabul Qilish ({formatCurrency(paymentDue.total_amount)} so&apos;m)
        </Button>
      </CardContent>
    </Card>
  );
}
