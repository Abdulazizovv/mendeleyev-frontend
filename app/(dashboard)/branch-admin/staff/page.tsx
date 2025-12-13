"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { staffApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StaffMember,
  Role,
  CreateStaffRequest,
  UpdateStaffRequest,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
} from "@/types/staff";
import type { EmploymentType } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Plus,
  Edit,
  DollarSign,
  CreditCard,
  Search,
  Wallet,
  CheckCircle,
  User,
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

export default function StaffPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  // State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [staffDialog, setStaffDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: StaffMember;
  }>({ open: false, mode: "create" });

  const [balanceDialog, setBalanceDialog] = React.useState<{
    open: boolean;
    data?: StaffMember;
  }>({ open: false });

  const [staffForm, setStaffForm] = React.useState<Partial<CreateStaffRequest>>({
    employment_type: "full_time",
    monthly_salary: 0,
  });

  const [balanceForm, setBalanceForm] = React.useState({
    amount: 0,
    note: "",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Queries
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", branchId],
    queryFn: () => staffApi.getRoles(branchId),
    enabled: !!branchId,
  });

  const {
    data: staffData,
    isLoading: isLoadingStaff,
  } = useQuery({
    queryKey: ["staff", branchId, debouncedSearch, employmentTypeFilter, roleFilter, statusFilter],
    queryFn: () => {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (employmentTypeFilter && employmentTypeFilter !== "all") params.employment_type = employmentTypeFilter;
      if (roleFilter && roleFilter !== "all") params.role = roleFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      return staffApi.getStaff(branchId, params);
    },
    enabled: !!branchId,
  });

  const { data: stats } = useQuery({
    queryKey: ["staff-stats", branchId],
    queryFn: () => staffApi.getStaffStats(branchId),
    enabled: !!branchId,
  });

  const staff = staffData || [];

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffRequest) => staffApi.createStaff(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setStaffDialog({ open: false, mode: "create" });
      resetStaffForm();
      toast.success("Xodim muvaffaqiyatli qo'shildi");
    },
    onError: (error: any) => {
      const errors = error?.response?.data;
      if (errors && typeof errors === "object") {
        Object.keys(errors).forEach((field) => {
          const messages = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          messages.forEach((msg: string) => toast.error(`${field}: ${msg}`));
        });
      } else {
        toast.error("Xodim qo'shishda xatolik yuz berdi");
      }
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffRequest }) =>
      staffApi.updateStaff(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setStaffDialog({ open: false, mode: "create" });
      resetStaffForm();
      toast.success("Xodim muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      toast.error("Xodimni yangilashda xatolik");
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; note?: string } }) =>
      staffApi.addBalance(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setBalanceDialog({ open: false });
      resetBalanceForm();
      toast.success("Balans muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      toast.error("Balansni yangilashda xatolik");
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.deleteStaff(branchId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      toast.success("Xodim o'chirildi");
    },
    onError: (error: any) => {
      toast.error("Xodimni o'chirishda xatolik");
    },
  });

  // Handlers
  const resetStaffForm = () => {
    setStaffForm({
      employment_type: "full_time",
      monthly_salary: 0,
    });
  };

  const resetBalanceForm = () => {
    setBalanceForm({
      amount: 0,
      note: "",
    });
  };

  const openCreateDialog = () => {
    resetStaffForm();
    setStaffDialog({ open: true, mode: "create" });
  };

  const openEditDialog = (member: StaffMember) => {
    setStaffForm({
      user: member.user,
      role_ref: member.role_ref,
      title: member.title,
      employment_type: member.employment_type,
      monthly_salary: member.monthly_salary,
      hire_date: member.hire_date,
      passport_serial: member.passport_serial || undefined,
      passport_number: member.passport_number || undefined,
      address: member.address || undefined,
      emergency_contact: member.emergency_contact || undefined,
      notes: member.notes || undefined,
    });
    setStaffDialog({ open: true, mode: "edit", data: member });
  };

  const openBalanceDialog = (member: StaffMember) => {
    resetBalanceForm();
    setBalanceDialog({ open: true, data: member });
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffForm.user || !staffForm.role_ref) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    const data: CreateStaffRequest = {
      user: staffForm.user!,
      branch: branchId,
      role_ref: staffForm.role_ref!,
      title: staffForm.title,
      employment_type: staffForm.employment_type,
      monthly_salary: staffForm.monthly_salary!,
      hire_date: staffForm.hire_date,
      passport_serial: staffForm.passport_serial,
      passport_number: staffForm.passport_number,
      address: staffForm.address,
      emergency_contact: staffForm.emergency_contact,
      notes: staffForm.notes,
    };

    if (staffDialog.mode === "create") {
      createStaffMutation.mutate(data);
    } else if (staffDialog.data) {
      const updateData: UpdateStaffRequest = {
        role_ref: staffForm.role_ref,
        title: staffForm.title,
        employment_type: staffForm.employment_type,
        monthly_salary: staffForm.monthly_salary,
        address: staffForm.address,
        emergency_contact: staffForm.emergency_contact,
        notes: staffForm.notes,
      };
      updateStaffMutation.mutate({ id: staffDialog.data.id, data: updateData });
    }
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!balanceDialog.data || !balanceForm.amount) {
      toast.error("Miqdorni kiriting");
      return;
    }

    addBalanceMutation.mutate({
      id: balanceDialog.data.id,
      data: balanceForm,
    });
  };

  const handleDelete = (staffId: string, staffName: string) => {
    if (confirm(`${staffName}ni o'chirmoqchimisiz?`)) {
      deleteStaffMutation.mutate(staffId);
    }
  };

  if (isLoadingStaff) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xodimlar</h1>
          <p className="text-gray-600 mt-1">{staff.length} ta xodim</p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Xodim qo&apos;shish
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_staff}</p>
                  <p className="text-sm text-gray-600">Jami xodimlar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_staff}</p>
                  <p className="text-sm text-gray-600">Faol xodimlar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_balance)}</p>
                  <p className="text-sm text-gray-600">Umumiy balans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_base_salary)}</p>
                  <p className="text-sm text-gray-600">Umumiy maosh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ish turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="full_time">{EMPLOYMENT_TYPE_LABELS.full_time}</SelectItem>
                <SelectItem value="part_time">{EMPLOYMENT_TYPE_LABELS.part_time}</SelectItem>
                <SelectItem value="contract">{EMPLOYMENT_TYPE_LABELS.contract}</SelectItem>
                <SelectItem value="intern">{EMPLOYMENT_TYPE_LABELS.intern}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rol" />
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">{EMPLOYMENT_STATUS_LABELS.active}</SelectItem>
                <SelectItem value="terminated">{EMPLOYMENT_STATUS_LABELS.terminated}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xodimlar topilmadi</h3>
            <p className="text-gray-600 mb-6">Yangi xodim qo&apos;shish uchun tugmani bosing</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Xodim qo&apos;shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Xodim</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Ish turi</TableHead>
                    <TableHead>Maosh</TableHead>
                    <TableHead>Balans</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Harakatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member: StaffMember) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{member.user_name}</p>
                            <p className="text-sm text-gray-500">{member.user_phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.effective_role}</Badge>
                      </TableCell>
                      <TableCell>
                        {member.employment_type ? EMPLOYMENT_TYPE_LABELS[member.employment_type] : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(member.monthly_salary)}
                      </TableCell>
                      <TableCell>
                        <span className={member.balance < 0 ? "text-red-600 font-medium" : "font-medium"}>
                          {formatCurrency(member.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active_employment ? "default" : "secondary"}>
                          {member.is_active_employment ? EMPLOYMENT_STATUS_LABELS.active : EMPLOYMENT_STATUS_LABELS.terminated}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBalanceDialog(member)}
                            title="Balans"
                          >
                            <Wallet className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                            title="Tahrirlash"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Dialog */}
      <Dialog
        open={staffDialog.open}
        onOpenChange={(open) => setStaffDialog({ ...staffDialog, open })}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {staffDialog.mode === "create" ? "Yangi xodim qo'shish" : "Xodimni tahrirlash"}
            </DialogTitle>
            <DialogDescription>Xodim ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit}>
            <div className="space-y-4 py-4">
              {/* User ID */}
              {staffDialog.mode === "create" && (
                <div className="space-y-2">
                  <Label htmlFor="user">
                    Foydalanuvchi ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user"
                    value={staffForm.user || ""}
                    onChange={(e) => setStaffForm({ ...staffForm, user: e.target.value })}
                    placeholder="Foydalanuvchi ID"
                    required
                  />
                </div>
              )}

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role_ref">
                  Rol <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={staffForm.role_ref}
                  onValueChange={(value) => setStaffForm({ ...staffForm, role_ref: value })}
                >
                  <SelectTrigger id="role_ref">
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

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Lavozim</Label>
                <Input
                  id="title"
                  value={staffForm.title || ""}
                  onChange={(e) => setStaffForm({ ...staffForm, title: e.target.value })}
                  placeholder="Masalan: Katta o'qituvchi"
                />
              </div>

              {/* Employment Type */}
              <div className="space-y-2">
                <Label htmlFor="employment_type">Ish turi</Label>
                <Select
                  value={staffForm.employment_type}
                  onValueChange={(value) =>
                    setStaffForm({ ...staffForm, employment_type: value as EmploymentType })
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

              {/* Monthly Salary */}
              <div className="space-y-2">
                <Label htmlFor="monthly_salary">
                  Oylik maosh (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="monthly_salary"
                  type="number"
                  value={staffForm.monthly_salary}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, monthly_salary: parseInt(e.target.value) })
                  }
                  placeholder="Masalan: 5000000"
                  step="100000"
                  required
                />
              </div>

              {/* Hire Date */}
              <div className="space-y-2">
                <Label htmlFor="hire_date">Ishga qabul qilingan sana</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={staffForm.hire_date || ""}
                  onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                />
              </div>

              {/* Passport */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Passport ma&apos;lumotlari</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport_serial">Seriya</Label>
                    <Input
                      id="passport_serial"
                      value={staffForm.passport_serial || ""}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, passport_serial: e.target.value })
                      }
                      placeholder="AA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Raqam</Label>
                    <Input
                      id="passport_number"
                      value={staffForm.passport_number || ""}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, passport_number: e.target.value })
                      }
                      placeholder="1234567"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Textarea
                  id="address"
                  value={staffForm.address || ""}
                  onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                  placeholder="To'liq manzil"
                  rows={2}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Favqulodda aloqa</Label>
                <Input
                  id="emergency_contact"
                  value={staffForm.emergency_contact || ""}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, emergency_contact: e.target.value })
                  }
                  placeholder="Telefon raqam"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Izohlar</Label>
                <Textarea
                  id="notes"
                  value={staffForm.notes || ""}
                  onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
                  placeholder="Qo'shimcha ma'lumot"
                  rows={2}
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

      {/* Balance Dialog */}
      <Dialog open={balanceDialog.open} onOpenChange={(open) => setBalanceDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Balansni boshqarish</DialogTitle>
            <DialogDescription>
              {balanceDialog.data && balanceDialog.data.user_name}
              <br />
              Joriy balans: {balanceDialog.data && formatCurrency(balanceDialog.data.balance)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBalanceSubmit}>
            <div className="space-y-4 py-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Miqdor (so&apos;m) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={balanceForm.amount}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, amount: parseInt(e.target.value) })
                  }
                  placeholder="Musbat - qo'shish, Manfiy - ayirish"
                  step="10000"
                  required
                />
                <p className="text-xs text-gray-500">
                  Musbat qiymat balansga qo&apos;shadi, manfiy qiymat ayiradi
                </p>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">Izoh</Label>
                <Textarea
                  id="note"
                  value={balanceForm.note}
                  onChange={(e) => setBalanceForm({ ...balanceForm, note: e.target.value })}
                  placeholder="Operatsiya haqida ma'lumot"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBalanceDialog({ open: false })}
              >
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
    </div>
  );
}
