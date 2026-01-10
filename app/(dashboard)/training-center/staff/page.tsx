"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { staffApi, financeApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StaffMember,
  Role,
  CreateStaffRequest,
  UpdateStaffRequest,
  AddBalanceRequest,
  ChangeBalanceRequest,
  PaySalaryRequest,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  transactionTypeLabels,
  paymentMethodLabels,
} from "@/types/staff";
import type { EmploymentType, TransactionType, PaymentMethod } from "@/types/staff";
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
  Users,
  Plus,
  Edit,
  DollarSign,
  CreditCard,
  Search,
  Wallet,
  CheckCircle,
  User,
  Trash2,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
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

// BranchRole options
const BRANCH_ROLE_OPTIONS = [
  { value: "teacher", label: "O'qituvchi" },
  { value: "branch_admin", label: "Filial admini" },
  { value: "other", label: "Boshqa xodim" },
];

export default function StaffPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  // State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [customRoleFilter, setCustomRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  
  // Balance visibility state
  const [showAllBalances, setShowAllBalances] = React.useState(false);
  const [visibleBalances, setVisibleBalances] = React.useState<Set<string>>(new Set());
  
  // Statistics visibility state
  const [visibleStats, setVisibleStats] = React.useState<Set<string>>(new Set());
  
  const statsCards = ['budget', 'balance', 'salary-range', 'paid', 'pending'] as const;
  type StatCard = typeof statsCards[number];

  const [staffDialog, setStaffDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: StaffMember;
  }>({ open: false, mode: "create" });

  const [balanceDialog, setBalanceDialog] = React.useState<{
    open: boolean;
    data?: StaffMember;
  }>({ open: false });

  const [salaryDialog, setSalaryDialog] = React.useState<{
    open: boolean;
    data?: StaffMember;
  }>({ open: false });

  const [staffForm, setStaffForm] = React.useState<Partial<CreateStaffRequest>>({
    role: "teacher",
    employment_type: "full_time",
    salary_type: "monthly",
    monthly_salary: 0,
  });

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
    cash_register_id: string;
    category_id: string;
  }>({
    amount: 0,
    payment_method: "cash",
    notes: "",
    cash_register_id: "",
    category_id: "",
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Queries
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", branchId],
    queryFn: () => staffApi.getRoles(branchId),
    enabled: !!branchId,
  });

  // Fetch cash registers
  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const cashRegisters = cashRegistersData?.results || [];

  // Fetch expense categories (for salary payment)
  const { data: categoriesData } = useQuery({
    queryKey: ["finance-categories", branchId, "expense"],
    queryFn: () => financeApi.getCategories({ 
      branch_id: branchId,
      type: "expense",
      is_active: true 
    }),
    enabled: !!branchId,
  });

  const expenseCategories = categoriesData?.results || [];

  const {
    data: staffData,
    isLoading: isLoadingStaff,
  } = useQuery({
    queryKey: ["staff", branchId, debouncedSearch, employmentTypeFilter, roleFilter, customRoleFilter, statusFilter],
    queryFn: () => {
      const params: any = { branch: branchId };
      if (debouncedSearch) params.search = debouncedSearch;
      if (employmentTypeFilter && employmentTypeFilter !== "all") 
        params.employment_type = employmentTypeFilter as EmploymentType;
      if (roleFilter && roleFilter !== "all") params.role = roleFilter;
      if (customRoleFilter && customRoleFilter !== "all") params.role_ref = customRoleFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      return staffApi.getStaff(params);
    },
    enabled: !!branchId,
  });

  const { data: stats } = useQuery({
    queryKey: ["staff-stats", branchId],
    queryFn: () => staffApi.getStaffStats({ branch: branchId }),
    enabled: !!branchId,
  });

  const staff = staffData || [];

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffRequest) => staffApi.createStaff(data),
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
      staffApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setStaffDialog({ open: false, mode: "create" });
      resetStaffForm();
      toast.success("Xodim muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Xodimni yangilashda xatolik");
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddBalanceRequest }) =>
      staffApi.addBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setBalanceDialog({ open: false });
      resetBalanceForm();
      toast.success("Balans muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Balansni yangilashda xatolik");
    },
  });

  const paySalaryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeBalanceRequest }) =>
      staffApi.changeBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setSalaryDialog({ open: false });
      resetSalaryForm();
      toast.success("Maosh muvaffaqiyatli to'landi!");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || "Maosh to'lashda xatolik";
      toast.error(errorMessage);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      toast.success("Xodim o'chirildi");
    },
    onError: () => {
      toast.error("Xodimni o'chirishda xatolik");
    },
  });

  // Handlers
  const resetStaffForm = () => {
    setStaffForm({
      role: "teacher",
      employment_type: "full_time",
      salary_type: "monthly",
      monthly_salary: 0,
    });
  };

  const resetBalanceForm = () => {
    setBalanceForm({
      amount: 0,
      transaction_type: "salary",
      description: "",
    });
  };

  const resetSalaryForm = () => {
    // Auto-select first cash register if available
    const firstCashRegister = cashRegisters.length > 0 ? cashRegisters[0].id : "";
    
    // Try to find salary category
    const salaryCategory = expenseCategories.find(cat => 
      cat.code === "staff_salary" || cat.name.toLowerCase().includes("maosh")
    );
    
    setSalaryForm({
      amount: 0,
      payment_method: "cash",
      notes: "",
      cash_register_id: firstCashRegister,
      category_id: salaryCategory?.id || "",
    });
  };

  const openCreateDialog = () => {
    resetStaffForm();
    setStaffDialog({ open: true, mode: "create" });
  };

  const openEditDialog = (member: StaffMember) => {
    setStaffForm({
      role: member.role,
      employment_type: member.employment_type || "full_time",
      monthly_salary: member.monthly_salary,
      title: member.title,
    });
    setStaffDialog({ open: true, mode: "edit", data: member });
  };

  const openBalanceDialog = (member: StaffMember) => {
    resetBalanceForm();
    setBalanceDialog({ open: true, data: member });
  };

  const openSalaryDialog = (member: StaffMember) => {
    resetSalaryForm();
    setSalaryForm((prev) => ({
      ...prev,
      amount: member.monthly_salary,
    }));
    setSalaryDialog({ open: true, data: member });
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (staffDialog.mode === "create") {
      if (!staffForm.phone_number || !staffForm.first_name || !staffForm.last_name || !staffForm.role) {
        toast.error("Barcha majburiy maydonlarni to'ldiring");
        return;
      }

      // Validate role="other" requires role_ref_id
      if (staffForm.role === "other" && !staffForm.role_ref_id) {
        toast.error("\"Boshqa xodim\" turi uchun rol tanlanishi shart");
        return;
      }

      const data: CreateStaffRequest = {
        phone_number: staffForm.phone_number!,
        first_name: staffForm.first_name!,
        last_name: staffForm.last_name!,
        email: staffForm.email,
        password: staffForm.password,
        branch_id: branchId,
        role: staffForm.role!,
        role_ref_id: staffForm.role_ref_id,
        title: staffForm.title,
        monthly_salary: staffForm.monthly_salary || 0,
        salary_type: staffForm.salary_type || "monthly",
        hire_date: staffForm.hire_date,
        employment_type: staffForm.employment_type,
        passport_serial: staffForm.passport_serial,
        passport_number: staffForm.passport_number,
        address: staffForm.address,
        emergency_contact: staffForm.emergency_contact,
        notes: staffForm.notes as Record<string, any> | undefined,
      };

      createStaffMutation.mutate(data);
    } else if (staffDialog.data) {
      const updateData: UpdateStaffRequest = {
        role: staffForm.role,
        role_ref_id: staffForm.role_ref_id,
        title: staffForm.title,
        employment_type: staffForm.employment_type,
        monthly_salary: staffForm.monthly_salary,
        salary_type: staffForm.salary_type,
        passport_serial: staffForm.passport_serial,
        passport_number: staffForm.passport_number,
        address: staffForm.address,
        emergency_contact: staffForm.emergency_contact,
        notes: staffForm.notes as Record<string, any> | undefined,
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

    const data: AddBalanceRequest = {
      amount: balanceForm.amount,
      transaction_type: balanceForm.transaction_type,
      description: balanceForm.description,
    };

    addBalanceMutation.mutate({ id: balanceDialog.data.id, data });
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!salaryDialog.data) {
      toast.error("Xodim ma'lumotlari topilmadi");
      return;
    }

    if (!salaryForm.amount || salaryForm.amount <= 0) {
      toast.error("To'lov miqdorini kiriting");
      return;
    }

    if (!salaryForm.cash_register_id) {
      toast.error("Kassani tanlang");
      return;
    }

    if (!salaryForm.category_id) {
      toast.error("Kategoriyani tanlang");
      return;
    }

    const data: ChangeBalanceRequest = {
      transaction_type: "deduction",
      amount: salaryForm.amount,
      description: salaryForm.notes || `Maosh to'lovi - ${new Date().toLocaleDateString('uz-UZ')}`,
      create_cash_transaction: true,
      cash_register_id: salaryForm.cash_register_id,
      payment_method: salaryForm.payment_method,
      reference: `SALARY-${Date.now()}`,
    };

    paySalaryMutation.mutate({ id: salaryDialog.data.id, data });
  };

  const handleDelete = (staffId: string, staffName: string) => {
    if (confirm(`${staffName}ni o'chirmoqchimisiz?`)) {
      deleteStaffMutation.mutate(staffId);
    }
  };

  // Balance visibility handlers
  const toggleAllBalances = () => {
    setShowAllBalances(!showAllBalances);
    if (!showAllBalances) {
      setVisibleBalances(new Set());
    }
  };

  const toggleBalanceVisibility = (e: React.MouseEvent, staffId: string) => {
    e.stopPropagation(); // Prevent row click
    const newVisible = new Set(visibleBalances);
    if (newVisible.has(staffId)) {
      newVisible.delete(staffId);
    } else {
      newVisible.add(staffId);
    }
    setVisibleBalances(newVisible);
  };

  const isBalanceVisible = (staffId: string) => {
    return showAllBalances || visibleBalances.has(staffId);
  };

  // Statistics visibility handlers
  const toggleStatVisibility = (statCard: StatCard) => {
    const newVisible = new Set(visibleStats);
    if (newVisible.has(statCard)) {
      newVisible.delete(statCard);
    } else {
      newVisible.add(statCard);
    }
    setVisibleStats(newVisible);
  };

  const isStatVisible = (statCard: StatCard) => {
    return visibleStats.has(statCard);
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
          <h1 className="text-3xl font-bold text-gray-900">Xodimlar Boshqaruvi</h1>
          <p className="text-gray-600 mt-1">
            Jami {staff.length} ta xodim • API v2
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleAllBalances} 
            variant="outline" 
            size="lg" 
            className="gap-2"
          >
            {showAllBalances ? (
              <>
                <EyeOff className="w-5 h-5" />
                Balanslarni yashirish
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Balanslarni ko&apos;rsatish
              </>
            )}
          </Button>
          <Button onClick={openCreateDialog} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Xodim qo&apos;shish
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_staff}</p>
                  <p className="text-sm text-gray-600">Jami xodimlar</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.active_staff} faol / {stats.terminated_staff} tugatilgan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleStatVisibility('budget')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-lg font-bold truncate transition-all ${
                    isStatVisible('budget') ? '' : 'blur-sm select-none'
                  }`}>
                    {isStatVisible('budget') ? formatCurrency(stats.total_salary_budget) : '•••••••'}
                  </p>
                  <p className="text-sm text-gray-600">Umumiy byudjet</p>
                  <p className={`text-xs text-gray-500 mt-1 truncate transition-all ${
                    isStatVisible('budget') ? '' : 'blur-sm select-none'
                  }`}>
                    O&apos;rtacha: {isStatVisible('budget') ? formatCurrency(Math.round(stats.average_salary)) : '•••••••'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleStatVisibility('balance')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stats.total_balance >= 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  {stats.total_balance >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-lg font-bold truncate transition-all ${
                    stats.total_balance < 0 ? "text-red-600" : ""
                  } ${isStatVisible('balance') ? '' : 'blur-sm select-none'}`}>
                    {isStatVisible('balance') ? formatCurrency(stats.total_balance) : '•••••••'}
                  </p>
                  <p className="text-sm text-gray-600">Umumiy balans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleStatVisibility('salary-range')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-600 truncate transition-all ${
                    isStatVisible('salary-range') ? '' : 'blur-sm select-none'
                  }`}>
                    Min: {isStatVisible('salary-range') ? formatCurrency(stats.min_salary) : '•••••••'}
                  </p>
                  <p className={`text-sm text-gray-600 truncate transition-all ${
                    isStatVisible('salary-range') ? '' : 'blur-sm select-none'
                  }`}>
                    Max: {isStatVisible('salary-range') ? formatCurrency(stats.max_salary) : '•••••••'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Maosh diapazoni</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleStatVisibility('paid')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-lg font-bold truncate transition-all ${
                    isStatVisible('paid') ? '' : 'blur-sm select-none'
                  }`}>
                    {isStatVisible('paid') ? formatCurrency(stats.total_paid) : '•••••••'}
                  </p>
                  <p className="text-sm text-gray-600">Jami to&apos;langan</p>
                  <p className={`text-xs text-gray-500 mt-1 transition-all ${
                    isStatVisible('paid') ? '' : 'blur-sm select-none'
                  }`}>
                    {isStatVisible('paid') ? `${stats.paid_payments_count} ta to'lov` : '•••'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleStatVisibility('pending')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-lg font-bold truncate transition-all ${
                    isStatVisible('pending') ? '' : 'blur-sm select-none'
                  }`}>
                    {isStatVisible('pending') ? formatCurrency(stats.total_pending) : '•••••••'}
                  </p>
                  <p className="text-sm text-gray-600">Kutilayotgan to&apos;lovlar</p>
                  <p className={`text-xs text-gray-500 mt-1 transition-all ${
                    isStatVisible('pending') ? '' : 'blur-sm select-none'
                  }`}>
                    {isStatVisible('pending') ? `${stats.pending_payments_count} ta to'lov` : '•••'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="BranchRole" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha rollar</SelectItem>
                {BRANCH_ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={customRoleFilter} onValueChange={setCustomRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Maxsus rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha maxsus rollar</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="terminated">Tugatilgan</SelectItem>
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
            <p className="text-gray-600 mb-6 text-center">
              Yangi xodim qo&apos;shish uchun telefon raqam orqali<br/>
              foydalanuvchi yarating yoki mavjudni ulang
            </p>
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
                    <TableHead>Rol / Lavozim</TableHead>
                    <TableHead>Ish turi</TableHead>
                    <TableHead>Maosh</TableHead>
                    <TableHead>Balans</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => window.location.href = `/branch-admin/staff/${member.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{member.full_name}</p>
                            <p className="text-sm text-gray-500 truncate">{member.phone_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="mb-1">{member.role_display}</Badge>
                          {member.role_ref_name ? (
                            <p className="text-sm font-medium text-gray-700 truncate">{member.role_ref_name}</p>
                          ) : member.title ? (
                            <p className="text-sm text-gray-600 truncate">{member.title}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {member.employment_type 
                            ? EMPLOYMENT_TYPE_LABELS[member.employment_type] 
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium whitespace-nowrap">
                          {formatCurrency(member.monthly_salary)}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {isBalanceVisible(member.id) ? (
                            <>
                              <span className={`font-medium whitespace-nowrap ${
                                member.balance < 0 ? "text-red-600" : "text-green-600"
                              }`}>
                                {formatCurrency(member.balance)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => toggleBalanceVisibility(e, member.id)}
                                className="h-7 w-7 p-0 hover:bg-gray-100"
                              >
                                <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-gray-400 select-none">
                                •••••••
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => toggleBalanceVisibility(e, member.id)}
                                className="h-7 w-7 p-0 hover:bg-gray-100"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Faol" : "Faol emas"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Staff Dialog */}
      <Dialog
        open={staffDialog.open}
        onOpenChange={(open) => setStaffDialog({ ...staffDialog, open })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {staffDialog.mode === "create" ? "Yangi xodim qo'shish" : "Xodimni tahrirlash"}
            </DialogTitle>
            <DialogDescription>
              {staffDialog.mode === "create" 
                ? "Telefon raqam orqali foydalanuvchi yaratiladi yoki mavjudsi ulanadi"
                : "Xodim ma'lumotlarini yangilash (foydalanuvchi va filial o'zgartirilmaydi)"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit}>
            <div className="space-y-6 py-4">
              {/* User Information - Only for Create */}
              {staffDialog.mode === "create" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Foydalanuvchi ma&apos;lumotlari</CardTitle>
                    <CardDescription>Telefon raqam orqali yangi foydalanuvchi yaratiladi</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">
                          Telefon raqam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone_number"
                          value={staffForm.phone_number || ""}
                          onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                          placeholder="+998901234567"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={staffForm.email || ""}
                          onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">
                          Ism <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="first_name"
                          value={staffForm.first_name || ""}
                          onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                          placeholder="Ali"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name">
                          Familiya <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="last_name"
                          value={staffForm.last_name || ""}
                          onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                          placeholder="Valiyev"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Parol (ixtiyoriy)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={staffForm.password || ""}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder="Bo'sh qoldirilsa avtomatik yaratiladi"
                      />
                      <p className="text-xs text-gray-500">
                        Parol kiritilmasa, tizim avtomatik yaratadi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Role & Employment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rol va ish turi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">
                        BranchRole <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={staffForm.role}
                        onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANCH_ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role_ref_id">
                        Maxsus rol {staffForm.role === "other" && <span className="text-red-500">*</span>}
                      </Label>
                      <Select
                        value={staffForm.role_ref_id}
                        onValueChange={(value) => setStaffForm({ ...staffForm, role_ref_id: value })}
                      >
                        <SelectTrigger id="role_ref_id">
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo'q</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {staffForm.role === "other" && !staffForm.role_ref_id && (
                        <p className="text-xs text-red-600">
                          &quot;Boshqa xodim&quot; turi uchun maxsus rol tanlash majburiy
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Lavozim</Label>
                      <Input
                        id="title"
                        value={staffForm.title || ""}
                        onChange={(e) => setStaffForm({ ...staffForm, title: e.target.value })}
                        placeholder="Masalan: Katta o'qituvchi"
                      />
                    </div>

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
                  </div>
                </CardContent>
              </Card>

              {/* Salary Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Maosh ma&apos;lumotlari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_salary">Oylik maosh (so&apos;m)</Label>
                      <Input
                        id="monthly_salary"
                        type="number"
                        value={staffForm.monthly_salary}
                        onChange={(e) =>
                          setStaffForm({ ...staffForm, monthly_salary: parseInt(e.target.value) || 0 })
                        }
                        placeholder="5000000"
                        step="100000"
                      />
                    </div>

                    {staffDialog.mode === "create" && (
                      <div className="space-y-2">
                        <Label htmlFor="hire_date">Ishga qabul qilingan sana</Label>
                        <Input
                          id="hire_date"
                          type="date"
                          value={staffForm.hire_date || ""}
                          onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shaxsiy ma&apos;lumotlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passport_serial">Pasport seriyasi</Label>
                      <Input
                        id="passport_serial"
                        value={staffForm.passport_serial || ""}
                        onChange={(e) =>
                          setStaffForm({ ...staffForm, passport_serial: e.target.value.toUpperCase() })
                        }
                        placeholder="AA"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passport_number">Pasport raqami</Label>
                      <Input
                        id="passport_number"
                        value={staffForm.passport_number || ""}
                        onChange={(e) =>
                          setStaffForm({ ...staffForm, passport_number: e.target.value })
                        }
                        placeholder="1234567"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Manzil</Label>
                    <Textarea
                      id="address"
                      value={staffForm.address || ""}
                      onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                      placeholder="To'liq yashash manzili"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">Favqulodda aloqa</Label>
                    <Input
                      id="emergency_contact"
                      value={staffForm.emergency_contact || ""}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, emergency_contact: e.target.value })
                      }
                      placeholder="+998901234567"
                    />
                  </div>
                </CardContent>
              </Card>
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

      {/* Balance Transaction Dialog */}
      <Dialog open={balanceDialog.open} onOpenChange={(open) => setBalanceDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Balans tranzaksiyasi</DialogTitle>
            <DialogDescription>
              {balanceDialog.data && (
                <>
                  <span className="font-medium">{balanceDialog.data.full_name}</span>
                  <br />
                  Joriy balans: <span className={balanceDialog.data.balance < 0 ? "text-red-600 font-medium" : "font-medium"}>
                    {formatCurrency(balanceDialog.data.balance)}
                  </span>
                </>
              )}
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
                  placeholder="500000"
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
                  placeholder="Tranzaksiya haqida ma'lumot"
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

      {/* Salary Payment Dialog */}
      <Dialog open={salaryDialog.open} onOpenChange={(open) => setSalaryDialog({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Maosh To&apos;lash
            </DialogTitle>
            <DialogDescription>
              {salaryDialog.data && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Xodim:</span>
                    <span className="font-medium text-gray-900">{salaryDialog.data.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Oylik maosh:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(salaryDialog.data.monthly_salary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Joriy balans:</span>
                    <span className={`font-medium ${
                      salaryDialog.data.balance < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(salaryDialog.data.balance)}
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalarySubmit}>
            <div className="space-y-4 py-4">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4 pb-3">
                  <div className="flex gap-2 text-sm text-yellow-800">
                    <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Maosh to&apos;lash - Kassa chiqimi</p>
                      <p className="text-xs">
                        Bu operatsiya xodim balansini kamaytiradi va tanlangan kassadan pul chiqimini qayd qiladi.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cash_register_id">
                    Kassa <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={salaryForm.cash_register_id}
                    onValueChange={(value) =>
                      setSalaryForm({ ...salaryForm, cash_register_id: value })
                    }
                  >
                    <SelectTrigger id="cash_register_id">
                      <SelectValue placeholder="Kassani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {cashRegisters.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Kassalar topilmadi
                        </div>
                      ) : (
                        cashRegisters.map((register) => (
                          <SelectItem key={register.id} value={register.id}>
                            {register.name} ({formatCurrency(register.balance)})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">
                    Kategoriya <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={salaryForm.category_id}
                    onValueChange={(value) =>
                      setSalaryForm({ ...salaryForm, category_id: value })
                    }
                  >
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Kategoriyalar topilmadi
                        </div>
                      ) : (
                        expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            {category.is_global && (
                              <span className="text-xs text-gray-500 ml-1">(Global)</span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Chiqim kategoriyasi (masalan: Xodim maoshi)
                  </p>
                </div>
              </div>

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
                    <SelectItem value="mobile_payment">{paymentMethodLabels.mobile_payment || "Mobil to'lov"}</SelectItem>
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
                  placeholder="4000000"
                  step="100000"
                  min="0"
                  required
                />
                {salaryDialog.data && salaryDialog.data.monthly_salary > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Oylik maosh:</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => setSalaryForm({ ...salaryForm, amount: salaryDialog.data!.monthly_salary })}
                    >
                      {formatCurrency(salaryDialog.data.monthly_salary)} dan foydalanish
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_notes">Izoh</Label>
                <Textarea
                  id="salary_notes"
                  value={salaryForm.notes}
                  onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                  placeholder="To'lov haqida qo'shimcha ma'lumot (ixtiyoriy)"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSalaryDialog({ open: false })}
              >
                Bekor qilish
              </Button>
              <Button 
                type="submit" 
                disabled={paySalaryMutation.isPending || !salaryForm.cash_register_id || !salaryForm.category_id}
              >
                {paySalaryMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                <CheckCircle className="w-4 h-4 mr-2" />
                Maosh To&apos;lash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
