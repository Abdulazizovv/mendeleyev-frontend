"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { hrApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StaffProfile,
  CreateStaffProfileRequest,
  EmploymentType,
  StaffStatus,
  TransactionType,
  CreateTransactionRequest,
} from "@/types";
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
  Users,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  CreditCard,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building,
  Briefcase,
  Phone,
  Mail,
  User,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " so'm";
};

// Format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Employment type labels
const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: "To'liq stavka",
  part_time: "Yarim stavka",
  contract: "Shartnoma asosida",
  temporary: "Vaqtinchalik",
};

// Status labels
const statusLabels: Record<StaffStatus, string> = {
  active: "Faol",
  inactive: "Nofaol",
  on_leave: "Ta'tilda",
  terminated: "Ishdan bo'shatilgan",
};

// Status colors
const statusColors: Record<StaffStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  on_leave: "bg-blue-100 text-blue-800",
  terminated: "bg-red-100 text-red-800",
};

export default function StaffPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  // State management
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");

  const [staffDialog, setStaffDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: StaffProfile;
  }>({ open: false, mode: "create" });

  const [transactionDialog, setTransactionDialog] = React.useState<{
    open: boolean;
    staffId?: string;
    staffName?: string;
  }>({ open: false });

  const [staffForm, setStaffForm] = React.useState<Partial<CreateStaffProfileRequest>>({
    employment_type: "full_time",
    hire_date: new Date().toISOString().split("T")[0],
    base_salary: 0,
  });

  const [transactionForm, setTransactionForm] = React.useState<CreateTransactionRequest>({
    transaction_type: "bonus",
    amount: 0,
    description: "",
    reference: "",
  });

  // Queries
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["hr-staff", branchId, statusFilter, roleFilter, searchQuery],
    queryFn: () =>
      hrApi.getStaff({
        branch: branchId,
        status: statusFilter !== "all" ? (statusFilter as StaffStatus) : undefined,
        staff_role: roleFilter !== "all" ? roleFilter : undefined,
        search: searchQuery || undefined,
      }),
    enabled: !!branchId,
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["hr-roles", branchId],
    queryFn: () => hrApi.getRoles({ branch: branchId }),
    enabled: !!branchId,
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffProfileRequest) => hrApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff", branchId] });
      setStaffDialog({ open: false, mode: "create" });
      resetStaffForm();
      toast.success("Xodim muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.user?.[0] ||
        "Xodim yaratishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStaffProfileRequest> }) =>
      hrApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff", branchId] });
      setStaffDialog({ open: false, mode: "create" });
      resetStaffForm();
      toast.success("Xodim ma'lumotlari yangilandi");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error || "Xodim ma'lumotlarini yangilashda xatolik";
      toast.error(errorMessage);
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: CreateTransactionRequest }) =>
      hrApi.createTransaction(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff", branchId] });
      setTransactionDialog({ open: false });
      resetTransactionForm();
      toast.success("Tranzaksiya muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error || "Tranzaksiya yaratishda xatolik";
      toast.error(errorMessage);
    },
  });

  // Form handlers
  const resetStaffForm = () => {
    setStaffForm({
      employment_type: "full_time",
      hire_date: new Date().toISOString().split("T")[0],
      base_salary: 0,
    });
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      transaction_type: "bonus",
      amount: 0,
      description: "",
      reference: "",
    });
  };

  const openCreateStaffDialog = () => {
    resetStaffForm();
    setStaffDialog({ open: true, mode: "create" });
  };

  const openEditStaffDialog = (staff: StaffProfile) => {
    setStaffForm({
      user: staff.user,
      branch: staff.branch,
      staff_role: staff.staff_role,
      employment_type: staff.employment_type,
      hire_date: staff.hire_date,
      base_salary: staff.base_salary,
      bank_account: staff.bank_account,
      tax_id: staff.tax_id,
      notes: staff.notes,
    });
    setStaffDialog({ open: true, mode: "edit", data: staff });
  };

  const openTransactionDialog = (staff: StaffProfile) => {
    resetTransactionForm();
    setTransactionDialog({
      open: true,
      staffId: staff.id,
      staffName: staff.user_info?.full_name || "Xodim",
    });
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (staffDialog.mode === "create") {
      createStaffMutation.mutate(staffForm as CreateStaffProfileRequest);
    } else if (staffDialog.data) {
      updateStaffMutation.mutate({ id: staffDialog.data.id, data: staffForm });
    }
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionDialog.staffId) {
      createTransactionMutation.mutate({
        staffId: transactionDialog.staffId,
        data: transactionForm,
      });
    }
  };

  if (staffLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const totalSalary = staff
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.base_salary, 0);
  const totalBalance = staff.reduce((sum, s) => sum + s.current_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xodimlar</h1>
          <p className="text-gray-600 mt-1">{staff.length} ta xodim</p>
        </div>
        <Button onClick={openCreateStaffDialog} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Xodim qo&apos;shish
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faol xodimlar</p>
                <p className="text-2xl font-bold text-gray-900">{activeStaff}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami maosh fondi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSalary)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami balans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Ism, telefon, INN bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rol bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha rollar</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Nofaol</SelectItem>
                <SelectItem value="on_leave">Ta&apos;tilda</SelectItem>
                <SelectItem value="terminated">Ishdan bo&apos;shatilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xodimlar topilmadi
            </h3>
            <p className="text-gray-600 mb-6">Yangi xodim qo&apos;shish uchun tugmani bosing</p>
            <Button onClick={openCreateStaffDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Xodim qo&apos;shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((staffMember) => (
            <Card
              key={staffMember.id}
              className={`hover:shadow-lg transition-all ${
                staffMember.status !== "active" ? "opacity-60" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {staffMember.user_info?.full_name || "N/A"}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {staffMember.staff_role_info?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[staffMember.status]}>
                    {statusLabels[staffMember.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{staffMember.user_info?.phone_number || "N/A"}</span>
                  </div>

                  {staffMember.user_info?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{staffMember.user_info.email}</span>
                    </div>
                  )}

                  {/* Employment Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{employmentTypeLabels[staffMember.employment_type]}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Ishga kirgan: {formatDate(staffMember.hire_date)}</span>
                  </div>

                  {/* Financial Info */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Maosh:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(staffMember.base_salary)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Balans:</span>
                      <span
                        className={`font-semibold ${
                          staffMember.current_balance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(staffMember.current_balance)}
                      </span>
                    </div>
                  </div>

                  {/* Tax and Bank Info */}
                  {(staffMember.tax_id || staffMember.bank_account) && (
                    <div className="space-y-1">
                      {staffMember.tax_id && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Hash className="w-3 h-3" />
                          <span>INN: {staffMember.tax_id}</span>
                        </div>
                      )}
                      {staffMember.bank_account && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CreditCard className="w-3 h-3" />
                          <span>Karta: {staffMember.bank_account}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditStaffDialog(staffMember)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTransactionDialog(staffMember)}
                      className="flex-1"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Tranzaksiya
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Dialog */}
      <Dialog
        open={staffDialog.open}
        onOpenChange={(open) => setStaffDialog({ ...staffDialog, open })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {staffDialog.mode === "create" ? "Yangi xodim qo'shish" : "Xodimni tahrirlash"}
            </DialogTitle>
            <DialogDescription>
              Xodim ma&apos;lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="staff-role">
                  Rol <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={staffForm.staff_role}
                  onValueChange={(value) =>
                    setStaffForm({ ...staffForm, staff_role: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rolni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employment-type">
                    Ish turi <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={staffForm.employment_type}
                    onValueChange={(value) =>
                      setStaffForm({ ...staffForm, employment_type: value as EmploymentType })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">To&apos;liq stavka</SelectItem>
                      <SelectItem value="part_time">Yarim stavka</SelectItem>
                      <SelectItem value="contract">Shartnoma asosida</SelectItem>
                      <SelectItem value="temporary">Vaqtinchalik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire-date">
                    Ishga kirgan sana <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hire-date"
                    type="date"
                    value={staffForm.hire_date}
                    onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-salary">
                  Maosh (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="base-salary"
                  type="number"
                  value={staffForm.base_salary}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, base_salary: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Masalan: 5000000"
                  step="100000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-account">Bank kartasi</Label>
                  <Input
                    id="bank-account"
                    value={staffForm.bank_account || ""}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, bank_account: e.target.value })
                    }
                    placeholder="8600 1234 5678 9012"
                    maxLength={19}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-id">INN (Soliq identifikatsiya raqami)</Label>
                  <Input
                    id="tax-id"
                    value={staffForm.tax_id || ""}
                    onChange={(e) => setStaffForm({ ...staffForm, tax_id: e.target.value })}
                    placeholder="123456789012"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Izoh</Label>
                <Textarea
                  id="notes"
                  value={staffForm.notes || ""}
                  onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
                  placeholder="Qo'shimcha ma'lumotlar"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStaffDialog({ ...staffDialog, open: false })}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
              >
                {(createStaffMutation.isPending || updateStaffMutation.isPending) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {staffDialog.mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog
        open={transactionDialog.open}
        onOpenChange={(open) => setTransactionDialog({ ...transactionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tranzaksiya yaratish</DialogTitle>
            <DialogDescription>
              {transactionDialog.staffName} uchun tranzaksiya
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransactionSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-type">
                  Tranzaksiya turi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={transactionForm.transaction_type}
                  onValueChange={(value) =>
                    setTransactionForm({
                      ...transactionForm,
                      transaction_type: value as TransactionType,
                    })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="fine">Jarima</SelectItem>
                    <SelectItem value="advance">Avans</SelectItem>
                    <SelectItem value="adjustment">Tuzatish</SelectItem>
                    <SelectItem value="deposit">Kirim</SelectItem>
                    <SelectItem value="withdrawal">Chiqim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Summa (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Masalan: 500000"
                  step="10000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Hujjat raqami</Label>
                <Input
                  id="reference"
                  value={transactionForm.reference}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, reference: e.target.value })
                  }
                  placeholder="Masalan: BONUS-2024-01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Tavsif <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, description: e.target.value })
                  }
                  placeholder="Tranzaksiya sababi"
                  rows={3}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransactionDialog({ open: false })}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={createTransactionMutation.isPending}>
                {createTransactionMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                Yaratish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
