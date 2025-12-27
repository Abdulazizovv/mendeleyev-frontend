"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  DollarSign,
  Search,
  Download,
  CreditCard,
  Calendar,
  Users,
  X,
  Percent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  // Get filters from query params
  useEffect(() => {
    const student = searchParams.get('student');
    const search = searchParams.get('search');
    const start = searchParams.get('start_date');
    const end = searchParams.get('end_date');
    
    if (student) setStudentFilter(student);
    if (search) setSearchQuery(search);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  }, [searchParams]);

  // Fetch payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", branchId, searchQuery, startDate, endDate, studentFilter],
    queryFn: () =>
      financeApi.getPayments({
        branch_id: branchId,
        // Only use search if not using student_profile filter
        search: (!studentFilter && searchQuery) ? searchQuery : undefined,
        period_start: startDate || undefined,
        period_end: endDate || undefined,
        student_profile: studentFilter || undefined,
        ordering: "-payment_date",
      }),
    enabled: !!branchId,
  });

  const payments = paymentsData?.results || [];

  // Calculate summary
  const summary = payments.reduce(
    (acc, payment) => {
      acc.totalPayments += payment.final_amount;
      acc.totalDiscount += payment.discount_amount || 0;
      acc.totalBase += payment.base_amount;
      return acc;
    },
    { totalPayments: 0, totalDiscount: 0, totalBase: 0 }
  );

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

  const clearStudentFilter = () => {
    setStudentFilter("");
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('student');
    const newUrl = newParams.toString() 
      ? `/branch-admin/finance/payments?${newParams.toString()}`
      : '/branch-admin/finance/payments';
    router.push(newUrl);
  };

  const clearSearchQuery = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('search');
    const newUrl = newParams.toString() 
      ? `/branch-admin/finance/payments?${newParams.toString()}`
      : '/branch-admin/finance/payments';
    router.push(newUrl);
  };

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('start_date');
    newParams.delete('end_date');
    const newUrl = newParams.toString() 
      ? `/branch-admin/finance/payments?${newParams.toString()}`
      : '/branch-admin/finance/payments';
    router.push(newUrl);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStudentFilter("");
    router.push('/branch-admin/finance/payments');
  };

  const hasActiveFilters = searchQuery || startDate || endDate || studentFilter;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              To'lovlar
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              O'quvchilar to'lovlari
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push("/branch-admin/finance/payments/create")}
            className="gap-2"
          >
            <DollarSign className="w-4 h-4" />
            To'lov qabul qilish
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Jami To'lovlar</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.totalPayments)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Asosiy Summa</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalBase)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Chegirmalar</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.totalDiscount)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">To'lovlar Soni</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {payments.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-blue-900">Aktiv filtrlar:</span>
                {studentFilter && (
                  <Badge variant="secondary" className="gap-1.5 bg-white text-blue-900 border-blue-300">
                    <Users className="w-3 h-3" />
                    O'quvchi: {payments[0]?.student?.full_name || studentFilter.slice(0, 8) + '...'}
                    <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-600" onClick={clearStudentFilter} />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1.5 bg-white text-blue-900 border-blue-300">
                    <Search className="w-3 h-3" />
                    Qidiruv: {searchQuery}
                    <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-600" onClick={clearSearchQuery} />
                  </Badge>
                )}
                {(startDate || endDate) && (
                  <Badge variant="secondary" className="gap-1.5 bg-white text-blue-900 border-blue-300">
                    <Calendar className="w-3 h-3" />
                    Sana: {startDate || '...'} - {endDate || '...'}
                    <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-600" onClick={clearDateFilters} />
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Barchasini tozalash
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Qidirish (shaxsiy raqam)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!!studentFilter}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <X 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-gray-600" 
                    onClick={clearSearchQuery}
                  />
                )}
              </div>
              {studentFilter && (
                <p className="text-xs text-gray-500 mt-1">
                  O'quvchi filtri faol - qidiruv o'chirilgan
                </p>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="relative flex-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Boshlanish sanasi"
                  className="pr-8"
                />
                {startDate && (
                  <X 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-gray-600" 
                    onClick={() => setStartDate("")}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="relative flex-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Tugash sanasi"
                  className="pr-8"
                />
                {endDate && (
                  <X 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-gray-600" 
                    onClick={() => setEndDate("")}
                  />
                )}
              </div>
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Eksport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">To'lovlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Yuklanmoqda...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">To'lovlar topilmadi</p>
              <p className="text-sm text-gray-400">
                Filtrlarni o'zgartiring yoki yangi to'lov qo'shing
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">O'quvchi</TableHead>
                    <TableHead className="whitespace-nowrap">Abonement</TableHead>
                    <TableHead className="whitespace-nowrap">Summa</TableHead>
                    <TableHead className="whitespace-nowrap">Chegirma</TableHead>
                    <TableHead className="whitespace-nowrap">To'lov turi</TableHead>
                    <TableHead className="whitespace-nowrap">Davr</TableHead>
                    <TableHead className="whitespace-nowrap">Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/branch-admin/finance/payments/${payment.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {payment.student ? (
                            <>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={payment.student.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                                  {payment.student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {payment.student.full_name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500">
                                    {payment.student.personal_number}
                                  </p>
                                  {payment.student.current_class && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {payment.student.current_class.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.student_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.student_personal_number}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700 max-w-xs truncate">
                          {payment.subscription_plan_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-green-600 text-lg">
                            {formatCurrency(payment.final_amount)}
                          </p>
                          {payment.discount_amount > 0 && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatCurrency(payment.base_amount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.discount_amount > 0 ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 w-fit">
                              -{formatCurrency(payment.discount_amount)}
                            </Badge>
                            {payment.discount_name && (
                              <span className="text-xs text-gray-500">
                                {payment.discount_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="font-medium"
                        >
                          {payment.payment_method_display}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 font-medium"
                        >
                          {payment.period_display}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">
                            {new Date(payment.payment_date).toLocaleDateString("uz-UZ", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.payment_date).toLocaleTimeString("uz-UZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
