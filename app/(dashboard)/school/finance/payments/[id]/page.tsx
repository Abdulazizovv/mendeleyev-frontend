"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  DollarSign,
  User,
  CreditCard,
  Calendar,
  Building2,
  BadgePercent,
  FileText,
  Receipt,
  Clock,
} from "lucide-react";

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;

  // Fetch payment detail
  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => financeApi.getPayment(paymentId),
    enabled: !!paymentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">To&apos;lov topilmadi</p>
          <Button
            onClick={() => router.push("/branch-admin/finance/payments")}
            className="mt-4"
          >
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Naqd",
      card: "Karta",
      bank_transfer: "Bank o'tkazmasi",
      mobile_payment: "Mobil to'lov",
    };
    return labels[method] || method;
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      monthly: "Oylik",
      quarterly: "Choraklik",
      yearly: "Yillik",
      one_time: "Bir martalik",
    };
    return labels[period] || period;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance/payments")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              To&apos;lov Ma&apos;lumotlari
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              To&apos;lov #{payment.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/branch-admin/finance/transactions/${payment.transaction}`)}
          >
            <Receipt className="w-4 h-4" />
            Tranzaksiyani Ko&apos;rish
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Asosiy Summa</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(payment.base_amount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {payment.discount_amount > 0 && (
          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Chegirma</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {formatCurrency(payment.discount_amount)}
                  </p>
                  {payment.discount_name && (
                    <p className="text-xs text-gray-500 mt-1">{payment.discount_name}</p>
                  )}
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BadgePercent className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Jami To&apos;lov</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(payment.final_amount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              O&apos;quvchi Ma&apos;lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">To&apos;liq Ism</p>
                <p className="font-semibold text-gray-900">{payment.student_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Shaxsiy Raqam</p>
                  <p className="font-medium text-gray-900">{payment.student_personal_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Filial</p>
                  <p className="font-medium text-gray-900">{payment.branch_name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              Abonement va To&apos;lov
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Abonement Rejasi</p>
                <p className="font-medium text-gray-900">{payment.subscription_plan_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">To&apos;lov Usuli</p>
                  <Badge variant="outline" className="mt-1">
                    {getPaymentMethodLabel(payment.payment_method)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Davr</p>
                  <Badge variant="secondary" className="mt-1">
                    {getPeriodLabel(payment.period)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Sanalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">To&apos;lov Sanasi</p>
                <p className="font-medium text-gray-900">
                  {new Date(payment.payment_date).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {new Date(payment.payment_date).toLocaleTimeString("uz-UZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Davr Boshlanishi</p>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.period_start).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Davr Tugashi</p>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.period_end).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              Tizim Ma&apos;lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tranzaksiya ID</p>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    {payment.transaction.slice(0, 8)}...
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      router.push(`/branch-admin/finance/transactions/${payment.transaction}`)
                    }
                  >
                    Ko&apos;rish
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Yaratilgan</p>
                  <p className="text-sm text-gray-900">
                    {new Date(payment.created_at).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {new Date(payment.created_at).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Yangilangan</p>
                  <p className="text-sm text-gray-900">
                    {new Date(payment.updated_at).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {new Date(payment.updated_at).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {payment.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Eslatmalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{payment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Amount Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            Summa Tafsilotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Asosiy summa:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(payment.base_amount)}
              </span>
            </div>

            {payment.discount_amount > 0 && (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">
                    Chegirma {payment.discount_name && `(${payment.discount_name})`}:
                  </span>
                  <span className="font-semibold text-lg text-orange-600">
                    -{formatCurrency(payment.discount_amount)}
                  </span>
                </div>
                <div className="border-t pt-2" />
              </>
            )}

            <div className="flex justify-between items-center py-2 bg-blue-50 px-4 rounded-lg">
              <span className="font-semibold text-gray-900">Jami to&apos;langan summa:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(payment.final_amount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
