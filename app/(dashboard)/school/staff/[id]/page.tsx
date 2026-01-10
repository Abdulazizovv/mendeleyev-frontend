"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi, financeApi } from "@/lib/api";
import {
  StaffMemberDetail,
  UpdateStaffRequest,
  AddBalanceRequest,
  ChangeBalanceRequest,
  AddSalaryAccrualRequest,
  PaySalaryNewRequest,
  MonthlySummaryResponse,
  BalanceTransaction,
  EMPLOYMENT_TYPE_LABELS,
  transactionTypeLabels,
  paymentMethodLabels,
} from "@/types/staff";
import type { CashRegister } from "@/types/finance";
import type { EmploymentType, TransactionType, PaymentMethod } from "@/types/staff";
import { formatCurrency, formatRelativeDateTime, uzbekMonths } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ArrowLeft,
  Edit,
  Wallet,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const staffId = params.id as string;

  // Dialog States
  const [editDialog, setEditDialog] = React.useState(false);
  const [balanceDialog, setBalanceDialog] = React.useState(false);
  const [salaryAccrualDialog, setSalaryAccrualDialog] = React.useState(false);
  const [paySalaryDialog, setPaySalaryDialog] = React.useState(false);
  const [monthlySummaryDialog, setMonthlySummaryDialog] = React.useState(false);
  const [transactionDetailDialog, setTransactionDetailDialog] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<BalanceTransaction | null>(null);

  // Selected month/year for salary operations
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);

  // Form States
  const [editForm, setEditForm] = React.useState<Partial<UpdateStaffRequest>>({});

  const [balanceForm, setBalanceForm] = React.useState<ChangeBalanceRequest>({
    transaction_type: "bonus",
    amount: 0,
    description: "",
    create_cash_transaction: false,
    cash_register_id: "",
    payment_method: "cash",
    reference: "",
  });

  const [salaryAccrualForm, setSalaryAccrualForm] = React.useState({
    amount: 0,
    description: "",
    reference: "",
  });

  const [paySalaryForm, setPaySalaryForm] = React.useState({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer" as PaymentMethod,
    notes: "",
    reference_number: "",
  });

  // Reset form functions
  const resetEditForm = () => setEditForm({});
  const resetBalanceForm = () => setBalanceForm({
    transaction_type: "bonus",
    amount: 0,
    description: "",
    create_cash_transaction: false,
    cash_register_id: "",
    payment_method: "cash",
    reference: "",
  });
  const resetSalaryAccrualForm = () => setSalaryAccrualForm({ amount: 0, description: "", reference: "" });
  const resetPaySalaryForm = () => setPaySalaryForm({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    notes: "",
    reference_number: "",
  });

  // Queries
  const {
    data: staff,
    isLoading,
    error,
  } = useQuery<StaffMemberDetail>({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.getStaffMember(staffId),
    enabled: !!staffId,
  });

  // Get cash registers for the branch
  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", staff?.branch],
    queryFn: () => financeApi.getCashRegisters({ branch_id: staff?.branch }),
    enabled: !!staff?.branch,
  });

  const cashRegisters = cashRegistersData?.results || [];

  const { data: monthlySummary, refetch: refetchMonthlySummary } = useQuery<MonthlySummaryResponse>({
    queryKey: ["monthly-summary", staffId, selectedYear, selectedMonth],
    queryFn: () => staffApi.getMonthlySummary(staffId, { year: selectedYear, month: selectedMonth }),
    enabled: false,
  });

  // Mutations
  const updateStaffMutation = useMutation({
    mutationFn: (data: UpdateStaffRequest) => staffApi.updateStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setEditDialog(false);
      resetEditForm();
      toast.success("Xodim muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Xodimni yangilashda xatolik");
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: () => staffApi.deleteStaff(staffId),
    onSuccess: () => {
      toast.success("Xodim muvaffaqiyatli o'chirildi");
      router.push("/branch-admin/staff");
    },
    onError: () => {
      toast.error("Xodimni o'chirishda xatolik");
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: (data: ChangeBalanceRequest) => staffApi.changeBalance(staffId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setBalanceDialog(false);
      resetBalanceForm();
      
      const message = response.cash_transaction_id 
        ? `Balans yangilandi. Kassadan ${formatCurrency(response.previous_balance - response.new_balance)} chiqarildi.`
        : "Balans muvaffaqiyatli yangilandi";
      
      toast.success(message);
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || 
                       error?.response?.data?.cash_register_id?.[0] ||
                       "Balansni yangilashda xatolik";
      toast.error(errorMsg);
    },
  });

  const addSalaryAccrualMutation = useMutation({
    mutationFn: (data: AddSalaryAccrualRequest) => staffApi.addSalaryAccrual(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setSalaryAccrualDialog(false);
      resetSalaryAccrualForm();
      toast.success("Maosh muvaffaqiyatli hisoblandi");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Maosh hisoblashda xatolik");
    },
  });

  const paySalaryNewMutation = useMutation({
    mutationFn: (data: PaySalaryNewRequest) => staffApi.paySalaryNew(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setPaySalaryDialog(false);
      resetPaySalaryForm();
      toast.success("Maosh muvaffaqiyatli to'landi");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Maosh to'lashda xatolik");
    },
  });

  // Handlers
  const openEditDialog = () => {
    if (staff) {
      setEditForm({
        monthly_salary: staff.monthly_salary,
        employment_type: staff.employment_type,
      });
      setEditDialog(true);
    }
  };

  const openBalanceDialog = () => {
    setBalanceDialog(true);
  };

  const openSalaryAccrualDialog = () => {
    if (staff) {
      setSalaryAccrualForm({
        amount: staff.monthly_salary || 0,
        description: `${uzbekMonths[selectedMonth - 1]} ${selectedYear} oyi maoshi`,
        reference: "",
      });
    }
    setSalaryAccrualDialog(true);
  };

  const openPaySalaryDialog = () => {
    if (staff && staff.balance > 0) {
      setPaySalaryForm({
        ...paySalaryForm,
        amount: Math.min(staff.balance, staff.monthly_salary || 0),
      });
    }
    setPaySalaryDialog(true);
  };

  const openMonthlySummaryDialog = () => {
    setMonthlySummaryDialog(true);
    refetchMonthlySummary();
  };

  const handleDelete = () => {
    if (window.confirm("Rostdan ham bu xodimni o'chirmoqchimisiz?")) {
      deleteStaffMutation.mutate();
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffMutation.mutate(editForm as UpdateStaffRequest);
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (balanceForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    
    // Validate description
    if (!balanceForm.description.trim()) {
      toast.error("Tavsif kiritish majburiy");
      return;
    }
    
    // Validate cash register when creating cash transaction
    if (balanceForm.create_cash_transaction && !balanceForm.cash_register_id) {
      toast.error("Kassa tanlash majburiy");
      return;
    }
    
    addBalanceMutation.mutate(balanceForm);
  };

  const handleSalaryAccrualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salaryAccrualForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    if (!salaryAccrualForm.description.trim()) {
      toast.error("Tavsif kiritilishi shart");
      return;
    }
    addSalaryAccrualMutation.mutate(salaryAccrualForm);
  };

  const handlePaySalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paySalaryForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    if (staff && paySalaryForm.amount > staff.balance) {
      toast.error("Balansdan ortiq to'lov qilish mumkin emas");
      return;
    }

    const month = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    paySalaryNewMutation.mutate({
      ...paySalaryForm,
      month,
    });
  };

  // Loading and Error States
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">Xodim topilmadi</p>
            <Button onClick={() => router.push("/branch-admin/staff")}>
              Orqaga qaytish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/branch-admin/staff")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{staff.full_name}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {staff.role_display}
              {staff.role_ref_name && ` • ${staff.role_ref_name}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/branch-admin/staff/${staffId}/transactions`)}
            className="gap-2"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Tranzaksiyalar</span>
          </Button>
          <Button variant="outline" onClick={openMonthlySummaryDialog} className="gap-2" size="sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Xulosa</span>
          </Button>
          <Button onClick={openPaySalaryDialog} className="gap-2 bg-green-600 hover:bg-green-700" size="sm">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">To&apos;lash</span>
          </Button>
          <Button variant="outline" onClick={openEditDialog} className="gap-2" size="sm">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Tahrirlash</span>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="gap-2"
            disabled={deleteStaffMutation.isPending}
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">O&apos;chirish</span>
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      {staff.balance < 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm">
            Qarzdor: {formatCurrency(Math.abs(staff.balance))}
          </Badge>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                staff.balance >= 0 ? "bg-green-100" : "bg-red-100"
              }`}>
                {staff.balance >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${staff.balance < 0 ? "text-red-600" : ""}`}>
                  {formatCurrency(staff.balance)}
                </p>
                <p className="text-sm text-gray-600">Joriy balans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Salary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(staff.monthly_salary || 0)}
                </p>
                <p className="text-sm text-gray-600">Oylik maosh</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Type Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {staff.employment_type ? EMPLOYMENT_TYPE_LABELS[staff.employment_type] : "Belgilanmagan"}
                </p>
                <p className="text-sm text-gray-600">Ish turi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hire Date Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {staff.hire_date ? new Date(staff.hire_date).toLocaleDateString("uz-UZ") : "Belgilanmagan"}
                </p>
                <p className="text-sm text-gray-600">Ish boshlagan sana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aloqa ma&apos;lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium">{staff.phone_number}</p>
                </div>
              </div>
              {staff.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{staff.email}</p>
                  </div>
                </div>
              )}
              {staff.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Manzil</p>
                    <p className="font-medium">{staff.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Moliyaviy xulosa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Oylik maosh:</span>
                <span className="font-medium">{formatCurrency(staff.monthly_salary || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joriy balans:</span>
                <span className={`font-medium ${staff.balance < 0 ? "text-red-600" : ""}`}>
                  {formatCurrency(staff.balance)}
                </span>
              </div>
              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={openBalanceDialog}
                  className="w-full gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Tranzaksiya qo&apos;shish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Oxirgi tranzaksiyalar</CardTitle>
                <Button
                  variant="link"
                  onClick={() => router.push(`/branch-admin/staff/${staffId}/transactions`)}
                >
                  Barchasini ko&apos;rish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staff.recent_transactions && staff.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Turi</TableHead>
                        <TableHead className="text-right">Miqdor</TableHead>
                        <TableHead className="text-right">Balans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.recent_transactions.slice(0, 5).map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setTransactionDetailDialog(true);
                          }}
                        >
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatRelativeDateTime(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {transaction.transaction_type_display}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.balance_change >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.balance_change >= 0 ? "+" : ""}
                            {formatCurrency(transaction.balance_change)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(transaction.new_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Tranzaksiyalar yo&apos;q</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs - Part 1: Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xodimni tahrirlash</DialogTitle>
            <DialogDescription>
              Xodim ma&apos;lumotlarini yangilash
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_salary">
                  Oylik maosh (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="monthly_salary"
                  type="number"
                  value={editForm.monthly_salary || 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, monthly_salary: parseInt(e.target.value) || 0 })
                  }
                  step="100000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">
                  Ish turi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editForm.employment_type}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, employment_type: value as EmploymentType })
                  }
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={updateStaffMutation.isPending}>
                {updateStaffMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 2: Balance Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Balans Tranzaksiyasi</DialogTitle>
            <DialogDescription>
              Xodim balansini o&apos;zgartirish va kassa bilan integratsiya
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBalanceSubmit}>
            <div className="space-y-6 py-4">
              {/* Current Balance Info */}
              {staff && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Joriy balans</p>
                      <p className={`font-bold text-2xl ${staff.balance < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(staff.balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Oylik maosh</p>
                      <p className="font-semibold text-lg text-gray-800">
                        {formatCurrency(staff.monthly_salary || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Type */}
              <div className="space-y-3">
                <Label htmlFor="transaction_type">
                  Tranzaksiya turi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={balanceForm.transaction_type}
                  onValueChange={(value: any) =>
                    setBalanceForm({ ...balanceForm, transaction_type: value })
                  }
                >
                  <SelectTrigger id="transaction_type">
                    <SelectValue placeholder="Tranzaksiya turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary_accrual">Oylik hisoblash</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                    <SelectItem value="deduction">Balansdan chiqarish</SelectItem>
                    <SelectItem value="advance">Avans berish</SelectItem>
                    <SelectItem value="fine">Jarima</SelectItem>
                    <SelectItem value="adjustment">To&apos;g&apos;rilash</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Contextual Help */}
                {balanceForm.transaction_type && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      {balanceForm.transaction_type === "salary_accrual" && (
                        <><strong>Oylik hisoblash:</strong> Xodim balansiga oylik maosh qo&apos;shiladi. Kassa ta&apos;siri yo&apos;q.</>
                      )}
                      {balanceForm.transaction_type === "bonus" && (
                        <><strong>Bonus:</strong> Xodim balansiga bonus qo&apos;shiladi (yutuq, rag&apos;batlantirish). Kassa ta&apos;siri yo&apos;q.</>
                      )}
                      {balanceForm.transaction_type === "other" && (
                        <><strong>Boshqa qo&apos;shimcha:</strong> Xodim balansiga boshqa turdagi qo&apos;shimcha pul. Kassa ta&apos;siri yo&apos;q.</>
                      )}
                      {balanceForm.transaction_type === "deduction" && (
                        <><strong>Balansdan chiqarish:</strong> Xodim balansidan pul ayiriladi va kassadan to&apos;lov amalga oshiriladi (maosh to&apos;lash).</>
                      )}
                      {balanceForm.transaction_type === "advance" && (
                        <><strong>Avans berish:</strong> Xodim balansidan avans sifatida pul ayiriladi va kassadan chiqim qilinadi.</>
                      )}
                      {balanceForm.transaction_type === "fine" && (
                        <><strong>Jarima:</strong> Xodim balansidan jarima sifatida pul ayiriladi va kassadan chiqim qilinadi.</>
                      )}
                      {balanceForm.transaction_type === "adjustment" && (
                        <><strong>To&apos;g&apos;rilash:</strong> Xodim balansidan to&apos;g&apos;rilash uchun pul ayiriladi va kassadan chiqim qilinadi.</>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={balanceForm.amount || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                    setBalanceForm({ ...balanceForm, amount: value });
                  }}
                  min="1"
                  required
                  placeholder="Masalan: 3500000"
                  className="text-lg font-medium"
                />
                <p className="text-xs text-gray-500">
                  Istalgan musbat butun son kiritishingiz mumkin
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Tavsif <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={balanceForm.description}
                  onChange={(e) => setBalanceForm({ ...balanceForm, description: e.target.value })}
                  rows={3}
                  required
                  placeholder="Tranzaksiya haqida qisqacha ma'lumot kiriting..."
                />
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference">Referens raqami (ixtiyoriy)</Label>
                <Input
                  id="reference"
                  value={balanceForm.reference}
                  onChange={(e) => setBalanceForm({ ...balanceForm, reference: e.target.value })}
                  placeholder="Masalan: SAL-2024-12"
                />
              </div>

              {/* Cash Transaction Section */}
              <div className="border-t pt-4">
                <div className="flex items-start space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="create_cash_transaction"
                    checked={balanceForm.create_cash_transaction}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, create_cash_transaction: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="create_cash_transaction" className="cursor-pointer">
                      Kassadan pul chiqarish
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Belgilansa, tanlangan kassadan avtomatik pul chiqimi amalga oshiriladi
                    </p>
                  </div>
                </div>

                {balanceForm.create_cash_transaction && (
                  <div className="space-y-4 ml-6 pl-4 border-l-2 border-blue-200">
                    {/* Cash Register Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="cash_register_id">
                        Kassa <span className="text-red-500">*</span>
                      </Label>
                      {cashRegisters.length > 0 ? (
                        <Select
                          value={balanceForm.cash_register_id}
                          onValueChange={(value) =>
                            setBalanceForm({ ...balanceForm, cash_register_id: value })
                          }
                        >
                          <SelectTrigger id="cash_register_id">
                            <SelectValue placeholder="Kassani tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {cashRegisters.map((register) => (
                              <SelectItem key={register.id} value={register.id}>
                                {register.name} ({formatCurrency(register.balance)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-red-600">
                          Filialda faol kassa topilmadi. Avval kassa yarating.
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">To&apos;lov usuli</Label>
                      <Select
                        value={balanceForm.payment_method}
                        onValueChange={(value: any) =>
                          setBalanceForm({ ...balanceForm, payment_method: value })
                        }
                      >
                        <SelectTrigger id="payment_method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Naqd pul</SelectItem>
                          <SelectItem value="bank_transfer">Bank o&apos;tkazmasi</SelectItem>
                          <SelectItem value="card">Karta</SelectItem>
                          <SelectItem value="mobile_payment">Mobil to&apos;lov</SelectItem>
                          <SelectItem value="other">Boshqa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBalanceDialog(false)}>
                Bekor qilish
              </Button>
              <Button 
                type="submit" 
                disabled={addBalanceMutation.isPending || (balanceForm.create_cash_transaction && cashRegisters.length === 0)}
              >
                {addBalanceMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 3: Salary Accrual Dialog */}
      <Dialog open={salaryAccrualDialog} onOpenChange={setSalaryAccrualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maosh Hisoblash</DialogTitle>
            <DialogDescription>
              Xodim balansiga maosh qo&apos;shish
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalaryAccrualSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accrual_amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accrual_amount"
                  type="number"
                  value={salaryAccrualForm.amount}
                  onChange={(e) =>
                    setSalaryAccrualForm({ ...salaryAccrualForm, amount: parseInt(e.target.value) || 0 })
                  }
                  step="100000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accrual_description">
                  Tavsif <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accrual_description"
                  value={salaryAccrualForm.description}
                  onChange={(e) =>
                    setSalaryAccrualForm({ ...salaryAccrualForm, description: e.target.value })
                  }
                  placeholder="Dekabr oyi maoshi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accrual_reference">Referens raqami</Label>
                <Input
                  id="accrual_reference"
                  value={salaryAccrualForm.reference}
                  onChange={(e) =>
                    setSalaryAccrualForm({ ...salaryAccrualForm, reference: e.target.value })
                  }
                  placeholder="SAL-2024-12"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSalaryAccrualDialog(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={addSalaryAccrualMutation.isPending}>
                {addSalaryAccrualMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Hisoblash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 4: Pay Salary Dialog */}
      <Dialog open={paySalaryDialog} onOpenChange={setPaySalaryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maosh To&apos;lash</DialogTitle>
            <DialogDescription>
              Xodim balansidan maosh to&apos;lovi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaySalarySubmit}>
            <div className="space-y-4 py-4">
              {/* Balance Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Joriy balans:</span>
                  <span className={`text-xl font-bold ${staff.balance < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(staff.balance)}
                  </span>
                </div>
                {staff.balance <= 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Balansda mablag&apos; yo&apos;q
                  </p>
                )}
              </div>

              {/* Month Selection */}
              <div className="space-y-2">
                <Label>
                  To&apos;lov oyi <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={String(month)}>
                          {uzbekMonths[month - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="pay_amount">
                  To&apos;lov miqdori (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pay_amount"
                  type="number"
                  value={paySalaryForm.amount}
                  onChange={(e) =>
                    setPaySalaryForm({ ...paySalaryForm, amount: parseInt(e.target.value) || 0 })
                  }
                  max={staff.balance > 0 ? staff.balance : 0}
                  step="100000"
                  required
                />
                <p className="text-xs text-gray-500">
                  Maksimal: {formatCurrency(staff.balance > 0 ? staff.balance : 0)}
                </p>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="pay_date">
                  To&apos;lov sanasi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={paySalaryForm.payment_date}
                  onChange={(e) =>
                    setPaySalaryForm({ ...paySalaryForm, payment_date: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="pay_method">
                  To&apos;lov usuli <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={paySalaryForm.payment_method}
                  onValueChange={(value) =>
                    setPaySalaryForm({ ...paySalaryForm, payment_method: value as PaymentMethod })
                  }
                >
                  <SelectTrigger id="pay_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{paymentMethodLabels.cash}</SelectItem>
                    <SelectItem value="bank_transfer">{paymentMethodLabels.bank_transfer}</SelectItem>
                    <SelectItem value="card">{paymentMethodLabels.card}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="pay_reference">Referens raqami</Label>
                <Input
                  id="pay_reference"
                  value={paySalaryForm.reference_number}
                  onChange={(e) =>
                    setPaySalaryForm({ ...paySalaryForm, reference_number: e.target.value })
                  }
                  placeholder="PAY-2024-12-001"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="pay_notes">Izoh</Label>
                <Textarea
                  id="pay_notes"
                  value={paySalaryForm.notes}
                  onChange={(e) => setPaySalaryForm({ ...paySalaryForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Dekabr oyi to'lovi"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaySalaryDialog(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={paySalaryNewMutation.isPending || staff.balance <= 0}
              >
                {paySalaryNewMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                To&apos;lash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Part 5: Monthly Summary Dialog */}
      <Dialog open={monthlySummaryDialog} onOpenChange={setMonthlySummaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oylik Xulosa</DialogTitle>
            <DialogDescription>
              {selectedYear}-{String(selectedMonth).padStart(2, "0")} oy uchun ma&apos;lumotlar
            </DialogDescription>
          </DialogHeader>
          {monthlySummary ? (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Jami hisoblangan:</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(monthlySummary.total_accrued)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">Jami to&apos;langan:</span>
                  <span className="font-semibold text-red-700">
                    {formatCurrency(monthlySummary.total_paid)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Balans o&apos;zgarishi:</span>
                  <span className={`font-semibold ${
                    monthlySummary.balance_change < 0 ? "text-red-700" : "text-blue-700"
                  }`}>
                    {formatCurrency(monthlySummary.balance_change)}
                  </span>
                </div>
              </div>

              <hr />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tranzaksiyalar:</span>
                  <span className="font-medium">{monthlySummary.transactions_count} ta</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To&apos;lovlar:</span>
                  <span className="font-medium">{monthlySummary.payments_count} ta</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Ma&apos;lumotlar yuklanmoqda...
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setMonthlySummaryDialog(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={transactionDetailDialog} onOpenChange={setTransactionDetailDialog}>
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
            <Button variant="outline" onClick={() => setTransactionDetailDialog(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
