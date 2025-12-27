import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, Percent } from "lucide-react";

interface SubscriptionsCardProps {
  subscriptions: any[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function SubscriptionsCard({
  subscriptions,
  formatCurrency,
  formatDate,
}: SubscriptionsCardProps) {
  if (!subscriptions || subscriptions.length === 0) return null;

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Package className="w-5 h-5" />
          Abonementlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscriptions.map((subscription: any) => (
          <div
            key={subscription.id}
            className="bg-white rounded-lg p-3 border"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">
                {subscription.subscription_plan.name}
              </p>
              <Badge
                className={
                  subscription.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {subscription.is_active ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aktiv
                  </>
                ) : (
                  "Aktiv emas"
                )}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Narxi:</span>
                <span className="font-medium text-purple-700">
                  {formatCurrency(subscription.subscription_plan.price)} so&apos;m
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Davr:</span>
                <span className="font-medium">
                  {subscription.subscription_plan.period_display}
                </span>
              </div>
              {subscription.discount && (
                <div className="flex justify-between bg-orange-50 -mx-3 px-3 py-2 border-y border-orange-200">
                  <span className="text-orange-700 font-medium flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Chegirma:
                  </span>
                  <span className="font-bold text-orange-700">
                    {subscription.discount.discount_type === 'percentage' 
                      ? `${subscription.discount.discount_value}%`
                      : `${formatCurrency(subscription.discount.discount_value)} so'm`}
                  </span>
                </div>
              )}
              {subscription.start_date && (
                <div className="flex justify-between text-gray-600">
                  <span>Boshlanish:</span>
                  <span className="font-medium">
                    {formatDate(subscription.start_date)}
                  </span>
                </div>
              )}
              {subscription.next_payment_date && (
                <div className="flex justify-between text-gray-600">
                  <span>Keyingi to&apos;lov:</span>
                  <span className="font-medium">
                    {formatDate(subscription.next_payment_date)}
                  </span>
                </div>
              )}
              {subscription.total_debt > 0 && (
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="text-red-600 font-medium">Qarz:</span>
                  <span className="font-bold text-red-700">
                    {formatCurrency(subscription.total_debt)} so&apos;m
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
