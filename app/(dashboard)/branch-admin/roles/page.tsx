"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { hrApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffRole, CreateStaffRoleRequest } from "@/types";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Key,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  X,
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

export default function RolesPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  // Branch ID - UUID (string) yuboramiz, backend qabul qilishi kerak
  const branchId = currentBranch?.branch_id || "";

  // State management
  const [roleDialog, setRoleDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: StaffRole;
  }>({ open: false, mode: "create" });

  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    id?: string;
    name?: string;
  }>({ open: false });

  const [roleForm, setRoleForm] = React.useState<CreateStaffRoleRequest>({
    name: "",
    code: "",
    branch: branchId, // UUID string
    permissions: [],
    description: "",
    is_active: true,
  });

  const [permissionInput, setPermissionInput] = React.useState("");
  const [salaryMin, setSalaryMin] = React.useState("");
  const [salaryMax, setSalaryMax] = React.useState("");

  // Queries
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["hr-roles", branchId],
    queryFn: () => hrApi.getRoles({ branch: branchId }),
    enabled: !!branchId,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateStaffRoleRequest) => hrApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-roles", branchId] });
      setRoleDialog({ open: false, mode: "create" });
      resetRoleForm();
      toast.success("Rol muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.code?.[0] ||
        "Rol yaratishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStaffRoleRequest> }) =>
      hrApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-roles", branchId] });
      setRoleDialog({ open: false, mode: "create" });
      resetRoleForm();
      toast.success("Rol muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.name?.[0] ||
        "Rolni yangilashda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => hrApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-roles", branchId] });
      setDeleteDialog({ open: false });
      toast.success("Rol muvaffaqiyatli o'chirildi");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail || "Rolni o'chirishda xatolik yuz berdi";
      toast.error(errorMessage);
    },
  });

  // Form handlers
  const resetRoleForm = () => {
    setRoleForm({
      name: "",
      code: "",
      branch: branchId,
      permissions: [],
      description: "",
      is_active: true,
    });
    setPermissionInput("");
    setSalaryMin("");
    setSalaryMax("");
  };

  const openCreateRoleDialog = () => {
    resetRoleForm();
    setRoleDialog({ open: true, mode: "create" });
  };

  const openEditRoleDialog = (role: StaffRole) => {
    setRoleForm({
      name: role.name,
      code: role.code,
      branch: role.branch,
      permissions: role.permissions || [],
      salary_range_min: role.salary_range_min,
      salary_range_max: role.salary_range_max,
      description: role.description || "",
      is_active: role.is_active,
    });
    setSalaryMin(role.salary_range_min ? String(role.salary_range_min) : "");
    setSalaryMax(role.salary_range_max ? String(role.salary_range_max) : "");
    setRoleDialog({ open: true, mode: "edit", data: role });
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...roleForm,
      salary_range_min: salaryMin ? parseInt(salaryMin) : undefined,
      salary_range_max: salaryMax ? parseInt(salaryMax) : undefined,
    };

    if (roleDialog.mode === "create") {
      createRoleMutation.mutate(submitData);
    } else if (roleDialog.data) {
      updateRoleMutation.mutate({ id: roleDialog.data.id, data: submitData });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.id) {
      deleteRoleMutation.mutate(deleteDialog.id);
    }
  };

  const addPermission = () => {
    if (permissionInput.trim()) {
      setRoleForm({
        ...roleForm,
        permissions: [...(roleForm.permissions || []), permissionInput.trim()],
      });
      setPermissionInput("");
    }
  };

  const removePermission = (index: number) => {
    const newPermissions = roleForm.permissions?.filter((_, i) => i !== index) || [];
    setRoleForm({ ...roleForm, permissions: newPermissions });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xodim Rollari</h1>
          <p className="text-gray-600 mt-1">{roles.length} ta rol</p>
        </div>
        <Button onClick={openCreateRoleDialog} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Rol qo&apos;shish
        </Button>
      </div>

      {/* Roles List */}
      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rollar topilmadi</h3>
            <p className="text-gray-600 mb-6">Yangi rol qo&apos;shish uchun tugmani bosing</p>
            <Button onClick={openCreateRoleDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Rol qo&apos;shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`hover:shadow-lg transition-all ${!role.is_active ? "opacity-60" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">Kod: {role.code}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}

                  {/* Staff Count */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{role.staff_count} xodim</span>
                  </div>

                  {/* Salary Range */}
                  {(role.salary_range_min || role.salary_range_max) && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Maosh diapazoni</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {role.salary_range_min && formatCurrency(role.salary_range_min)}
                        {role.salary_range_min && role.salary_range_max && " - "}
                        {role.salary_range_max && formatCurrency(role.salary_range_max)}
                      </p>
                    </div>
                  )}

                  {/* Permissions */}
                  {role.permissions && role.permissions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Ruxsatlar</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {role.is_active ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Faol</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Nofaol</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditRoleDialog(role)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDeleteDialog({ open: true, id: role.id, name: role.name })
                      }
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ ...roleDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {roleDialog.mode === "create" ? "Yangi rol yaratish" : "Rolni tahrirlash"}
            </DialogTitle>
            <DialogDescription>Rol ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">
                    Rol nomi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="role-name"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="Masalan: Oshpaz"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role-code">
                    Kod <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="role-code"
                    value={roleForm.code}
                    onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toLowerCase() })}
                    placeholder="Masalan: cook"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-description">Tavsif</Label>
                <Textarea
                  id="role-description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Rol haqida qo'shimcha ma'lumot"
                  rows={3}
                />
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary-min">Minimal maosh</Label>
                  <Input
                    id="salary-min"
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="Masalan: 3000000"
                    step="100000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary-max">Maksimal maosh</Label>
                  <Input
                    id="salary-max"
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="Masalan: 5000000"
                    step="100000"
                  />
                </div>
              </div>

              {/* Permissions Management */}
              <div className="space-y-2">
                <Label>Ruxsatlar</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ruxsat nomi (masalan: view_menu)"
                    value={permissionInput}
                    onChange={(e) => setPermissionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPermission();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addPermission}
                    size="sm"
                    disabled={!permissionInput.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Current Permissions */}
                {roleForm.permissions && roleForm.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
                    {roleForm.permissions.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-2 pr-1">
                        {perm}
                        <button
                          type="button"
                          onClick={() => removePermission(idx)}
                          className="ml-1 hover:text-red-600 p-1 rounded hover:bg-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="role-active"
                  checked={roleForm.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRoleForm({ ...roleForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="role-active" className="cursor-pointer">
                  Faol rol
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleDialog({ ...roleDialog, open: false })}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {roleDialog.mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolni o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteDialog.name}</span> rolini o&apos;chirishni
              xohlaysizmi? Bu amalni ortga qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
