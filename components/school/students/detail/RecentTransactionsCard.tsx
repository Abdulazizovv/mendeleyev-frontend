import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle, Receipt, ExternalLink, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecentTransactionsCardProps {
  transactions: any[];
  studentId: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function RecentTransactionsCard({
  transactions,
  studentId,
  formatCurrency,
  formatDate,
}: RecentTransactionsCardProps) {
  const router = useRouter();

  const getTransactionIcon = (type: string) => {
    const incomeTypes = ["income", "payment", "deposit"];
    if (incomeTypes.includes(type)) {
      return <ArrowDownCircle className="w-5 h-5 text-green-600" />;
    }
    return <ArrowUpCircle className="w-5 h-5 text-red-600" />;
  };

  const getTransactionColor = (type: string) => {
    const incomeTypes = ["income", "payment", "deposit"];
    if (incomeTypes.includes(type)) {
      return "text-green-700";
    }
    return "text-red-700";
  };

  const getTransactionBg = (type: string) => {
    const incomeTypes = ["income", "payment", "deposit"];
    if (incomeTypes.includes(type)) {
      return "from-green-50 to-emerald-50 border-green-200";
    }
    return "from-red-50 to-rose-50 border-red-200";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      failed: "bg-gray-100 text-gray-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodBadge = (method: string) => {
    const styles: Record<string, string> = {
      cash: "bg-green-100 text-green-800 border-green-300",
      card: "bg-blue-100 text-blue-800 border-blue-300",
      bank_transfer: "bg-purple-100 text-purple-800 border-purple-300",
      mobile_payment: "bg-indigo-100 text-indigo-800 border-indigo-300",
    };
    return styles[method] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            So&apos;nggi Tranzaksiyalar
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/branch-admin/finance/transactions?student=${studentId}`
              )
            }
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Barchasi
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction: any) => {
              const incomeTypes = ["income", "payment", "deposit"];
              const isIncome = incomeTypes.includes(transaction.transaction_type);
              
              return (
                <div
                  key={transaction.id}
                  className={`p-4 bg-gradient-to-r ${getTransactionBg(
                    transaction.transaction_type
                  )} rounded-lg border cursor-pointer hover:shadow-md transition-all`}
                  onClick={() =>
                    router.push(`/branch-admin/finance/transactions/${transaction.id}`)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Icon and Details */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-lg ${getTransactionColor(transaction.transaction_type)}`}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.transaction_type_display} • {formatDate(transaction.transaction_date)}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {transaction.description}
                          </p>
                        )}
                        
                        {/* Category & Cash Register */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {transaction.category && (
                            <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded">
                              <Wallet className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">{transaction.category.name}</span>
                            </div>
                          )}
                          {transaction.cash_register && (
                            <div className="text-xs text-gray-500">
                              {transaction.cash_register.name}
                            </div>
                          )}
                        </div>

                        {/* Employee Info */}
                        {transaction.employee && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border border-gray-200">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={transaction.employee.avatar} />
                              <AvatarFallback className="text-xs">
                                {transaction.employee.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">
                                {transaction.employee.full_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.employee.role_display}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Badges */}
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <Badge className={getStatusBadge(transaction.status)}>
                        {transaction.status_display}
                      </Badge>
                      <Badge className={getPaymentMethodBadge(transaction.payment_method)}>
                        {transaction.payment_method_display}
                      </Badge>
                      {transaction.reference_number && (
                        <p className="text-xs text-gray-500 mt-1">
                          #{transaction.reference_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Tranzaksiyalar yo&apos;q</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
