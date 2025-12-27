import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowDownCircle, ArrowUpCircle, CreditCard, Receipt, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentBalanceCardProps {
  balance: any;
  studentId: string;
  formatCurrency: (amount: number) => string;
  getBalanceColor: (amount: number) => string;
  getBalanceBg: (amount: number) => string;
}

export function StudentBalanceCard({
  balance,
  studentId,
  formatCurrency,
  getBalanceColor,
  getBalanceBg,
}: StudentBalanceCardProps) {
  const router = useRouter();

  return (
    <Card className={`border-2 shadow-lg ${getBalanceBg(balance?.balance || 0)}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Balans
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/branch-admin/finance/student-balances?search=${balance?.student_personal_number}`
              )
            }
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">Joriy Balans</p>
            <p className={`text-5xl font-bold ${getBalanceColor(balance?.balance || 0)}`}>
              {balance?.balance !== undefined ? (
                <>
                  {balance.balance > 0 && "+"}
                  {formatCurrency(balance.balance)} so&apos;m
                </>
              ) : (
                "0 so'm"
              )}
            </p>
            {balance?.balance !== undefined && (
              <p className="text-xs text-gray-500 mt-2">
                {balance.balance > 0
                  ? "O'quvchida ortiqcha mablag' mavjud"
                  : balance.balance < 0
                  ? "O'quvchida qarz mavjud"
                  : "Balans nol"}
              </p>
            )}
          </div>

          {balance && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <ArrowDownCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Jami to&apos;lovlar</span>
                </div>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(balance?.transactions_summary?.total_income || balance?.payments_summary?.total_payments || 0)}
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <ArrowUpCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Jami xarajat</span>
                </div>
                <p className="text-lg font-bold text-red-700">
                  {formatCurrency(balance?.transactions_summary?.total_expense || 0)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() =>
                router.push(
                  `/branch-admin/finance/payments/create?student=${studentId}`
                )
              }
            >
              <CreditCard className="w-4 h-4 mr-2" />
              To&apos;lov
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                router.push(
                  `/branch-admin/finance/transactions?student=${studentId}`
                )
              }
            >
              <Receipt className="w-4 h-4 mr-2" />
              Tarix
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
