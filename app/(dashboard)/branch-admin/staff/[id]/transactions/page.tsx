"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { staffApi } from "@/lib/api";
import type { BalanceTransaction, SalaryPayment, PaginatedResponse } from "@/types/staff";
import { formatRelativeDateTime, formatRelativeDate, formatCurrency, uzbekMonths, cn } from "@/lib/utils";
import { transactionTypeLabels, paymentMethodLabels, salaryPaymentStatusLabels } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Search, Filter, X } from "lucide-react";

export default function StaffTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = params.id as string;

  // State
  const [activeTab, setActiveTab] = React.useState("transactions");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTransaction, setSelectedTransaction] = React.useState<BalanceTransaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<SalaryPayment | null>(null);
  const [paymentDetailDialogOpen, setPaymentDetailDialogOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({
    transaction_type: "",
    payment_method: "",
    status: "",
    date_from: "",
    date_to: "",
    ordering: "-created_at",
  });

  // Get staff detail for header
  const { data: staff } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.getStaffMember(staffId),
  });

  // Get transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", staffId, filters, searchTerm],
    queryFn: async () => {
      const result = await staffApi.getTransactions({
        membership: staffId,
        search: searchTerm,
        ordering: filters.ordering,
        transaction_type: filters.transaction_type || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      });
      return result as any as PaginatedResponse<BalanceTransaction>;
    },
    enabled: activeTab === "transactions",
  });

  const transactions = transactionsData as PaginatedResponse<BalanceTransaction> | undefined;

  // Get payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", staffId, filters, searchTerm],
    queryFn: async () => {
      const result = await staffApi.getPayments({
        membership: staffId,
        search: searchTerm,
        ordering: filters.ordering,
        payment_method: filters.payment_method || undefined,
        status: filters.status || undefined,
        payment_date_from: filters.date_from || undefined,
        payment_date_to: filters.date_to || undefined,
      });
      return result as any as PaginatedResponse<SalaryPayment>;
    },
    enabled: activeTab === "payments",
  });

  const payments = paymentsData as PaginatedResponse<SalaryPayment> | undefined;

  const clearFilters = () => {
    setFilters({
      transaction_type: "",
      payment_method: "",
      status: "",
      date_from: "",
      date_to: "",
      ordering: "-created_at",
    });
    setSearchTerm("");
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/branch-admin/staff/${staffId}`)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Orqaga
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {staff?.full_name} - Tranzaksiyalar
          </h1>
          {staff && (
            <p className="text-gray-600 mt-1">
              {staff.phone_number} • {staff.role_display}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="transactions">Tranzaksiyalar</TabsTrigger>
          <TabsTrigger value="payments">To&apos;lovlar</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filterlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <Label>Qidiruv</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Izoh, referens, telefon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Transaction Type / Payment Method */}
              {activeTab === "transactions" ? (
                <div>
                  <Label>Tranzaksiya turi</Label>
                  <Select
                    value={filters.transaction_type || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, transaction_type: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hammasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hammasi</SelectItem>
                      {Object.entries(transactionTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div>
                    <Label>To&apos;lov usuli</Label>
                    <Select
                      value={filters.payment_method || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, payment_method: value === "all" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hammasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hammasi</SelectItem>
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Holat</Label>
                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value === "all" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hammasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hammasi</SelectItem>
                        {Object.entries(salaryPaymentStatusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Date From */}
              <div>
                <Label>Sanadan</Label>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>

              {/* Date To */}
              <div>
                <Label>Sanagacha</Label>
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Tozalash
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead className="text-right">O&apos;zgarish</TableHead>
                      <TableHead className="text-right">Yangi balans</TableHead>
                      <TableHead>Tavsif</TableHead>
                      <TableHead>Kim tomonidan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Yuklanmoqda...
                        </TableCell>
                      </TableRow>
                    ) : transactions && transactions.results.length > 0 ? (
                      transactions.results.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <TableCell className="whitespace-nowrap">
                            {formatRelativeDateTime(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.transaction_type_display}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              transaction.balance_change >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.balance_change >= 0 ? "+" : ""}
                            {formatCurrency(transaction.balance_change)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(transaction.new_balance)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>{transaction.processed_by_name}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tranzaksiyalar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {transactions && transactions.count > 0 && (
            <div className="text-center text-sm text-gray-600">
              Jami: {transactions.count} ta tranzaksiya
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To&apos;lov sanasi</TableHead>
                      <TableHead>Oy</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead>Usul</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Izoh</TableHead>
                      <TableHead>Kim tomonidan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Yuklanmoqda...
                        </TableCell>
                      </TableRow>
                    ) : payments && payments.results.length > 0 ? (
                      payments.results.map((payment) => (
                        <TableRow
                          key={payment.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setPaymentDetailDialogOpen(true);
                          }}
                        >
                          <TableCell className="whitespace-nowrap">
                            {formatRelativeDate(payment.payment_date)}
                          </TableCell>
                          <TableCell>{payment.month_display}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.payment_method_display}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status_display === "To'langan"
                                  ? "default"
                                  : payment.status_display === "Bekor qilingan"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {payment.status_display}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.notes || "-"}
                          </TableCell>
                          <TableCell>{payment.processed_by_name}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          To&apos;lovlar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {payments && payments.count > 0 && (
            <div className="text-center text-sm text-gray-600">
              Jami: {payments.count} ta to&apos;lov
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tranzaksiya Tafsilotlari</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Header with Type Badge and Date */}
              <div className="flex items-center justify-between pb-4 border-b">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {selectedTransaction.transaction_type_display}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeDateTime(selectedTransaction.created_at)}
                </span>
              </div>

              {/* Staff Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Xodim Ma&apos;lumotlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ism</p>
                    <p className="font-medium">{selectedTransaction.staff_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                    <p className="font-medium">{selectedTransaction.staff_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Lavozim</p>
                    <p className="font-medium">{selectedTransaction.staff_role}</p>
                  </div>
                </div>
              </div>

              {/* Amount Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Moliyaviy Ma&apos;lumotlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Miqdor</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Balans o&apos;zgarishi</p>
                    <p
                      className={`font-bold text-lg ${
                        selectedTransaction.balance_change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTransaction.balance_change >= 0 ? "+" : ""}
                      {formatCurrency(selectedTransaction.balance_change)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avvalgi balans</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.previous_balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Yangi balans</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.new_balance)}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Qo&apos;shimcha Ma&apos;lumotlar
                </h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                  {selectedTransaction.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tavsif</p>
                      <p className="font-medium">{selectedTransaction.description}</p>
                    </div>
                  )}
                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referens raqami</p>
                      <p className="font-medium font-mono text-sm">{selectedTransaction.reference}</p>
                    </div>
                  )}
                  {selectedTransaction.salary_payment_id && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Maosh to&apos;lovi ID</p>
                        <p className="font-medium font-mono text-sm">{selectedTransaction.salary_payment_id}</p>
                      </div>
                      {selectedTransaction.salary_payment_month && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Maosh oyi</p>
                          <p className="font-medium">
                            {(() => {
                              const date = new Date(selectedTransaction.salary_payment_month);
                              const year = date.getFullYear();
                              const month = date.getMonth();
                              return `${uzbekMonths[month]} ${year}`;
                            })()}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Processed By */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Qayd Qilgan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ism</p>
                    <p className="font-medium">{selectedTransaction.processed_by_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                    <p className="font-medium">{selectedTransaction.processed_by_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={paymentDetailDialogOpen} onOpenChange={setPaymentDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>To&apos;lov Tafsilotlari</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Header with Status Badge and Date */}
              <div className="flex items-center justify-between pb-4 border-b">
                <Badge
                  variant={
                    selectedPayment.status_display === "To'langan"
                      ? "default"
                      : selectedPayment.status_display === "Bekor qilingan"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-base px-3 py-1"
                >
                  {selectedPayment.status_display}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeDate(selectedPayment.payment_date)}
                </span>
              </div>

              {/* Staff Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Xodim Ma&apos;lumotlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ism</p>
                    <p className="font-medium">{selectedPayment.staff_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                    <p className="font-medium">{selectedPayment.staff_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Lavozim</p>
                    <p className="font-medium">{selectedPayment.staff_role}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  To&apos;lov Ma&apos;lumotlari
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Oy</p>
                    <p className="font-bold text-lg">
                      {(() => {
                        const date = new Date(selectedPayment.month);
                        const year = date.getFullYear();
                        const month = date.getMonth();
                        return `${uzbekMonths[month]} ${year}`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Oylik maosh</p>
                    <p className="font-medium">{formatCurrency(selectedPayment.staff_monthly_salary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">To&apos;langan miqdor</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">To&apos;lov usuli</p>
                    <p className="font-medium">{selectedPayment.payment_method_display}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">To&apos;lov sanasi</p>
                    <p className="font-medium">{formatRelativeDate(selectedPayment.payment_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tranzaksiyalar soni</p>
                    <p className="font-medium">{selectedPayment.transactions_count || 0} ta</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Qo&apos;shimcha Ma&apos;lumotlar
                </h3>
                <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                  {selectedPayment.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Izoh</p>
                      <p className="font-medium">{selectedPayment.notes}</p>
                    </div>
                  )}
                  {selectedPayment.reference_number && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referens raqami</p>
                      <p className="font-medium font-mono text-sm">{selectedPayment.reference_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Processed By */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Qayd Qilgan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ism</p>
                    <p className="font-medium">{selectedPayment.processed_by_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Telefon</p>
                    <p className="font-medium">{selectedPayment.processed_by_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Yaratilgan sana</p>
                    <p className="font-medium">{formatRelativeDateTime(selectedPayment.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDetailDialogOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
