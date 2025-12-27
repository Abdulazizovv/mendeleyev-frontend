import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, ArrowDownCircle, Receipt, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecentPaymentsCardProps {
  payments: any[];
  studentId: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function RecentPaymentsCard({
  payments,
  studentId,
  formatCurrency,
  formatDate,
}: RecentPaymentsCardProps) {
  const router = useRouter();

  const getPaymentMethodBadge = (method: string) => {
    const styles: Record<string, string> = {
      cash: "bg-green-100 text-green-800 border-green-300",
      card: "bg-blue-100 text-blue-800 border-blue-300",
      bank_transfer: "bg-purple-100 text-purple-800 border-purple-300",
    };
    const labels: Record<string, string> = {
      cash: "Naqd",
      card: "Karta",
      bank_transfer: "Bank",
      click: "Click",
      payme: "Payme",
      monthly: "Oylik",
      quarterly: "Choraklik",
      yearly: "Yillik",
    };
    return {
      style: styles[method] || "bg-gray-100 text-gray-800 border-gray-300",
      label: labels[method] || method,
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Oxirgi To&apos;lov
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/branch-admin/finance/payments?search=${studentId}`
              )
            }
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Batafsil
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment: any) => {
              const methodBadge = getPaymentMethodBadge(payment.period || payment.payment_method || "");
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-all"
                  onClick={() =>
                    router.push(`/branch-admin/finance/payments/${payment.id}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowDownCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-green-700">
                        +{formatCurrency(payment.amount)} so&apos;m
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.date || payment.payment_date)}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={methodBadge.style}>
                    {payment.period_display || methodBadge.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>To&apos;lovlar yo&apos;q</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
