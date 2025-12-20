"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "@/lib/api";
import {
  StaffMemberDetail,
  UpdateStaffRequest,
  AddBalanceRequest,
  PaySalaryRequest,
  AddSalaryAccrualRequest,
  PaySalaryNewRequest,
  CalculateSalaryResponse,
  MonthlySummaryResponse,
  EMPLOYMENT_TYPE_LABELS,
  transactionTypeLabels,
  paymentMethodLabels,
} from "@/types/staff";
import type { EmploymentType, TransactionType, PaymentMethod } from "@/types/staff";
import { formatCurrency, formatRelativeDateTime, uzbekMonths } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Briefcase,
  MapPin,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const staffId = params.id as string;

  // State
  const [editDialog, setEditDialog] = React.useState(false);
  const [balanceDialog, setBalanceDialog] = React.useState(false);
  const [salaryDialog, setSalaryDialog] = React.useState(false);
  const [salaryAccrualDialog, setSalaryAccrualDialog] = React.useState(false);
  const [paySalaryDialog, setPaySalaryDialog] = React.useState(false);
  const [monthlySummaryDialog, setMonthlySummaryDialog] = React.useState(false);

  // Selected month/year for salary operations
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);

  const [editForm, setEditForm] = React.useState<Partial<UpdateStaffRequest>>({});

  const [balanceForm, setBalanceForm] = React.useState<{
    amount: number;
    transaction_type: TransactionType;
    description: string;
  }>({
    amount: 0,
    transaction_type: "salary",
    description: "",
  });

  const [salaryForm, setSalaryForm] = React.useState<{
    amount: number;
    payment_method: PaymentMethod;
    notes: string;
  }>({
    amount: 0,
    payment_method: "bank_transfer",
    notes: "",
  });

  const [salaryAccrualForm, setSalaryAccrualForm] = React.useState<{
    amount: number;
    description: string;
    reference: string;
  }>({
    amount: 0,
    description: "",
    reference: "",
  });

  const [paySalaryForm, setPaySalaryForm] = React.useState<{
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    notes: string;
    reference_number: string;
  }>({
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    notes: "",
    reference_number: "",
  });

  // Query
  const {
    data: staff,
    isLoading,
    error,
  } = useQuery<StaffMemberDetail>({
    queryKey: ["staff", staffId],
    queryFn: () => staffApi.getStaffMember(staffId),
    enabled: !!staffId,
  });

  // Calculate salary query
  const { data: calculatedSalary, refetch: refetchCalculatedSalary } = useQuery<CalculateSalaryResponse>({
    queryKey: ["calculate-salary", staffId, selectedYear, selectedMonth],
    queryFn: () => staffApi.calculateSalary(staffId, { year: selectedYear, month: selectedMonth }),
    enabled: false, // Manual trigger
  });

  // Monthly summary query
  const { data: monthlySummary, refetch: refetchMonthlySummary } = useQuery<MonthlySummaryResponse>({
    queryKey: ["monthly-summary", staffId, selectedYear, selectedMonth],
    queryFn: () => staffApi.getMonthlySummary(staffId, { year: selectedYear, month: selectedMonth }),
    enabled: false, // Manual trigger
  });

  // Mutations
  const updateStaffMutation = useMutation({
    mutationFn: (data: UpdateStaffRequest) => staffApi.updateStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setEditDialog(false);
      toast.success("Xodim muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Xodimni yangilashda xatolik");
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: (data: AddBalanceRequest) => staffApi.addBalance(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setBalanceDialog(false);
      resetBalanceForm();
      toast.success("Balans muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Balansni yangilashda xatolik");
    },
  });

  const paySalaryMutation = useMutation({
    mutationFn: (data: PaySalaryRequest) => staffApi.paySalary(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      setSalaryDialog(false);
      resetSalaryForm();
      toast.success("Maosh to'landi");
    },
    onError: () => {
      toast.error("Maosh to'lashda xatolik");
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: () => staffApi.deleteStaff(staffId),
    onSuccess: () => {
      toast.success("Xodim o'chirildi");
      router.push("/branch-admin/staff");
    },
    onError: () => {
      toast.error("Xodimni o'chirishda xatolik");
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
      const errorMsg = error?.response?.data?.error || error?.response?.data?.amount?.[0] || "Maosh hisoblashda xatolik";
      toast.error(errorMsg);
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
      const errorMsg = error?.response?.data?.error || error?.response?.data?.month?.[0] || "Maosh to'lashda xatolik";
      toast.error(errorMsg);
    },
  });

  // Handlers
  const resetBalanceForm = () => {
    setBalanceForm({
      amount: 0,
      transaction_type: "salary",
      description: "",
    });
  };

  const resetSalaryForm = () => {
    setSalaryForm({
      amount: 0,
      payment_method: "bank_transfer",
      notes: "",
    });
  };

  const resetSalaryAccrualForm = () => {
    setSalaryAccrualForm({
      amount: 0,
      description: "",
      reference: "",
    });
  };

  const resetPaySalaryForm = () => {
    setPaySalaryForm({
      amount: 0,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "bank_transfer",
      notes: "",
      reference_number: "",
    });
  };

  const openEditDialog = () => {
    if (staff) {
      setEditForm({
        role: staff.role,
        role_ref_id: staff.role_ref_id,
        title: staff.title,
        employment_type: staff.employment_type,
        monthly_salary: staff.monthly_salary,
        salary_type: staff.salary_type,
        passport_serial: staff.passport_serial,
        passport_number: staff.passport_number,
        address: staff.address,
        emergency_contact: staff.emergency_contact,
      });
      setEditDialog(true);
    }
  };

  const openBalanceDialog = () => {
    resetBalanceForm();
    setBalanceDialog(true);
  };

  const openSalaryDialog = () => {
    if (staff) {
      setSalaryForm((prev) => ({
        ...prev,
        amount: staff.monthly_salary,
      }));
      setSalaryDialog(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffMutation.mutate(editForm as UpdateStaffRequest);
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceForm.amount) {
      toast.error("Miqdorni kiriting");
      return;
    }
    addBalanceMutation.mutate({
      amount: balanceForm.amount,
      transaction_type: balanceForm.transaction_type,
      description: balanceForm.description,
    });
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.amount) {
      toast.error("Miqdorni kiriting");
      return;
    }
    paySalaryMutation.mutate({
      amount: salaryForm.amount,
      payment_method: salaryForm.payment_method,
      payment_status: "completed",
      notes: salaryForm.notes,
    });
  };

  const handleDelete = () => {
    if (staff && confirm(`${staff.full_name}ni o'chirmoqchimisiz?`)) {
      deleteStaffMutation.mutate();
    }
  };

  // Salary management handlers
  const openSalaryAccrualDialog = () => {
    resetSalaryAccrualForm();
    if (staff) {
      setSalaryAccrualForm((prev) => ({
        ...prev,
        amount: staff.monthly_salary,
        description: `${selectedYear}-${String(selectedMonth).padStart(2, "0")} oyi maoshi`,
      }));
    }
    setSalaryAccrualDialog(true);
  };

  const openPaySalaryDialog = async () => {
    // Calculate salary first
    const result = await refetchCalculatedSalary();
    if (result.data?.success && result.data.total_amount) {
      setPaySalaryForm((prev) => ({
        ...prev,
        amount: result.data!.total_amount!,
        notes: `${selectedYear}-${String(selectedMonth).padStart(2, "0")} oyi to'lovi`,
      }));
    } else if (staff) {
      setPaySalaryForm((prev) => ({
        ...prev,
        amount: staff.balance > 0 ? staff.balance : staff.monthly_salary,
      }));
    }
    setPaySalaryDialog(true);
  };

  const openMonthlySummaryDialog = () => {
    refetchMonthlySummary();
    setMonthlySummaryDialog(true);
  };

  const handleSalaryAccrualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryAccrualForm.amount || salaryAccrualForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    if (!salaryAccrualForm.description) {
      toast.error("Tavsif kiritish majburiy");
      return;
    }
    addSalaryAccrualMutation.mutate({
      amount: salaryAccrualForm.amount,
      description: salaryAccrualForm.description,
      reference: salaryAccrualForm.reference || undefined,
    });
  };

  const handlePaySalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySalaryForm.amount || paySalaryForm.amount <= 0) {
      toast.error("Miqdor 0 dan katta bo'lishi kerak");
      return;
    }
    
    // Format month as YYYY-MM-01
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    
    paySalaryNewMutation.mutate({
      amount: paySalaryForm.amount,
      payment_date: paySalaryForm.payment_date,
      payment_method: paySalaryForm.payment_method,
      month: monthStr,
      notes: paySalaryForm.notes || undefined,
      reference_number: paySalaryForm.reference_number || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Xodim topilmadi</h2>
          <p className="text-gray-600 mb-6">Bu xodim mavjud emas yoki o&apos;chirilgan</p>
          <Button onClick={() => router.push("/branch-admin/staff")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Orqaga qaytish
          </Button>
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
          <Button variant="outline" onClick={openSalaryAccrualDialog} className="gap-2" size="sm">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Hisoblash</span>
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

      {/* Status Badge & Overview Cards */}
      <div className="flex items-center gap-2 mb-4">
        {staff.balance < 0 && (
          <Badge variant="destructive" className="text-sm">
            Qarzdor: {formatCurrency(Math.abs(staff.balance))}
          </Badge>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(staff.monthly_salary)}</p>
                <p className="text-sm text-gray-600">Oylik maosh</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staff.days_employed || 0}</p>
                <p className="text-sm text-gray-600">Ish kunlari</p>
                <p className="text-xs text-gray-500">
                  {staff.years_employed ? staff.years_employed.toFixed(1) : "0.0"} yil
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {staff.employment_type_display || "-"}
                </p>
                <p className="text-sm text-gray-600">Ish turi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
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
              {staff.emergency_contact && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Favqulodda aloqa</p>
                    <p className="font-medium">{staff.emergency_contact}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shaxsiy ma&apos;lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staff.passport_serial && staff.passport_number && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Pasport</p>
                    <p className="font-medium">
                      {staff.passport_serial} {staff.passport_number}
                    </p>
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
              {staff.hire_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Ishga qabul qilingan</p>
                    <p className="font-medium">{formatDate(staff.hire_date)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Moliyaviy xulosalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jami tranzaksiyalar:</span>
                  <span className="font-medium">{staff.transaction_summary.total_transactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jami olingan:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(staff.transaction_summary.total_received)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jami chegirma:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(staff.transaction_summary.total_deducted)}
                  </span>
                </div>
              </div>
              <hr />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jami to&apos;lovlar:</span>
                  <span className="font-medium">{staff.payment_summary.total_payments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">To&apos;langan summa:</span>
                  <span className="font-medium">
                    {formatCurrency(staff.payment_summary.total_amount_paid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Kutilayotgan:</span>
                  <span className="font-medium text-orange-600">
                    {staff.payment_summary.pending_payments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transactions and Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Oxirgi tranzaksiyalar</CardTitle>
              <CardDescription>
                Eng so&apos;nggi 10 ta balans o&apos;zgarishi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staff.recent_transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tranzaksiyalar mavjud emas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turi</TableHead>
                        <TableHead>Miqdor</TableHead>
                        <TableHead>Balans</TableHead>
                        <TableHead>Izoh</TableHead>
                        <TableHead>Kim tomonidan</TableHead>
                        <TableHead>Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.recent_transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.transaction_type_display}
                            </Badge>
                          </TableCell>
                          <TableCell className={
                            ["deduction", "fine"].includes(transaction.transaction_type)
                              ? "text-red-600 font-medium"
                              : "text-green-600 font-medium"
                          }>
                            {["deduction", "fine"].includes(transaction.transaction_type) ? "-" : "+"}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(transaction.previous_balance)} → {formatCurrency(transaction.new_balance)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.processed_by_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(transaction.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Oxirgi to&apos;lovlar</CardTitle>
              <CardDescription>
                Eng so&apos;nggi 10 ta maosh to&apos;lovlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staff.recent_payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  To&apos;lovlar mavjud emas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Oy</TableHead>
                        <TableHead>Miqdor</TableHead>
                        <TableHead>To&apos;lov usuli</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Kim tomonidan</TableHead>
                        <TableHead>Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.recent_payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.month}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.payment_method_display}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                              {payment.status_display}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.processed_by_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(payment.payment_date)}
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xodimni tahrirlash</DialogTitle>
            <DialogDescription>
              Xodim ma&apos;lumotlarini yangilash
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lavozim</Label>
                  <Input
                    id="title"
                    value={editForm.title || ""}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Ish turi</Label>
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
                      <SelectItem value="full_time">{EMPLOYMENT_TYPE_LABELS.full_time}</SelectItem>
                      <SelectItem value="part_time">{EMPLOYMENT_TYPE_LABELS.part_time}</SelectItem>
                      <SelectItem value="contract">{EMPLOYMENT_TYPE_LABELS.contract}</SelectItem>
                      <SelectItem value="intern">{EMPLOYMENT_TYPE_LABELS.intern}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_salary">Oylik maosh (so&apos;m)</Label>
                <Input
                  id="monthly_salary"
                  type="number"
                  value={editForm.monthly_salary}
                  onChange={(e) =>
                    setEditForm({ ...editForm, monthly_salary: parseInt(e.target.value) || 0 })
                  }
                  step="100000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passport_serial">Pasport seriyasi</Label>
                  <Input
                    id="passport_serial"
                    value={editForm.passport_serial || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, passport_serial: e.target.value.toUpperCase() })
                    }
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_number">Pasport raqami</Label>
                  <Input
                    id="passport_number"
                    value={editForm.passport_number || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, passport_number: e.target.value })
                    }
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Textarea
                  id="address"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Favqulodda aloqa</Label>
                <Input
                  id="emergency_contact"
                  value={editForm.emergency_contact || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, emergency_contact: e.target.value })
                  }
                />
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

      {/* Balance Dialog */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Balans tranzaksiyasi</DialogTitle>
            <DialogDescription>
              Joriy balans: <span className={staff.balance < 0 ? "text-red-600 font-medium" : "font-medium"}>
                {formatCurrency(staff.balance)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBalanceSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_type">
                  Tranzaksiya turi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={balanceForm.transaction_type}
                  onValueChange={(value) =>
                    setBalanceForm({ ...balanceForm, transaction_type: value as TransactionType })
                  }
                >
                  <SelectTrigger id="transaction_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">{transactionTypeLabels.salary}</SelectItem>
                    <SelectItem value="bonus">{transactionTypeLabels.bonus}</SelectItem>
                    <SelectItem value="deduction">{transactionTypeLabels.deduction}</SelectItem>
                    <SelectItem value="advance">{transactionTypeLabels.advance}</SelectItem>
                    <SelectItem value="fine">{transactionTypeLabels.fine}</SelectItem>
                    <SelectItem value="refund">{transactionTypeLabels.refund}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={balanceForm.amount}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, amount: parseInt(e.target.value) || 0 })
                  }
                  step="10000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Izoh</Label>
                <Textarea
                  id="description"
                  value={balanceForm.description}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBalanceDialog(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={addBalanceMutation.isPending}>
                {addBalanceMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Salary Dialog */}
      <Dialog open={salaryDialog} onOpenChange={setSalaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maosh to&apos;lash</DialogTitle>
            <DialogDescription>
              Oylik maosh: <span className="font-medium">{formatCurrency(staff.monthly_salary)}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalarySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  To&apos;lov usuli <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={salaryForm.payment_method}
                  onValueChange={(value) =>
                    setSalaryForm({ ...salaryForm, payment_method: value as PaymentMethod })
                  }
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{paymentMethodLabels.cash}</SelectItem>
                    <SelectItem value="bank_transfer">{paymentMethodLabels.bank_transfer}</SelectItem>
                    <SelectItem value="card">{paymentMethodLabels.card}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salary_amount"
                  type="number"
                  value={salaryForm.amount}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, amount: parseInt(e.target.value) || 0 })
                  }
                  step="100000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_notes">Izoh</Label>
                <Textarea
                  id="salary_notes"
                  value={salaryForm.notes}
                  onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSalaryDialog(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={paySalaryMutation.isPending}>
                {paySalaryMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                To&apos;lash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Salary Accrual Dialog */}
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

      {/* Pay Salary Dialog */}
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

              {/* Amount (Max = Balance) */}
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
                  onChange={(e) =>
                    setPaySalaryForm({ ...paySalaryForm, payment_date: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

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
              <Button type="submit" disabled={paySalaryNewMutation.isPending}>
                {paySalaryNewMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                To&apos;lash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Monthly Summary Dialog */}
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
    </div>
  );
}
