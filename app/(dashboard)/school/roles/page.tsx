"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { staffApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Role, CreateRoleRequest } from "@/types";
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
  Briefcase,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Shield,
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
  const branchId = currentBranch?.branch_id || "";

  // State
  const [roleDialog, setRoleDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: Role;
  }>({ open: false, mode: "create" });

  const [roleForm, setRoleForm] = React.useState<Partial<CreateRoleRequest>>({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });

  // Queries
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", branchId],
    queryFn: () => staffApi.getRoles(branchId),
    enabled: !!branchId,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => staffApi.createRole(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      setRoleDialog({ open: false, mode: "create" });
      resetForm();
      toast.success("Rol muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      const errors = error?.response?.data;
      if (errors && typeof errors === "object") {
        Object.keys(errors).forEach((field) => {
          const messages = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          messages.forEach((msg: string) => toast.error(`${field}: ${msg}`));
        });
      } else {
        toast.error("Rol yaratishda xatolik yuz berdi");
      }
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleRequest> }) =>
      staffApi.updateRole(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      setRoleDialog({ open: false, mode: "create" });
      resetForm();
      toast.success("Rol muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      const errors = error?.response?.data;
      if (errors && typeof errors === "object") {
        Object.keys(errors).forEach((field) => {
          const messages = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          messages.forEach((msg: string) => toast.error(`${field}: ${msg}`));
        });
      } else {
        toast.error("Rolni yangilashda xatolik yuz berdi");
      }
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => staffApi.deleteRole(branchId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      toast.success("Rol muvaffaqiyatli o'chirildi");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || "Rolni o'chirishda xatolik";
      toast.error(errorMessage);
    },
  });

  // Handlers
  const resetForm = () => {
    setRoleForm({
      name: "",
      code: "",
      description: "",
      is_active: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setRoleDialog({ open: true, mode: "create" });
  };

  const openEditDialog = (role: Role) => {
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description,
      salary_range_min: role.salary_range_min,
      salary_range_max: role.salary_range_max,
      is_active: role.is_active,
    });
    setRoleDialog({ open: true, mode: "edit", data: role });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleForm.name) {
      toast.error("Rol nomini kiriting");
      return;
    }

    if (roleDialog.mode === "create") {
      createRoleMutation.mutate(roleForm as CreateRoleRequest);
    } else if (roleDialog.data) {
      updateRoleMutation.mutate({ id: roleDialog.data.id, data: roleForm });
    }
  };

  const handleDelete = (roleId: string, roleName: string) => {
    if (confirm(`"${roleName}" rolini o'chirmoqchimisiz?`)) {
      deleteRoleMutation.mutate(roleId);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Rollar</h1>
          <p className="text-gray-600 mt-1">{roles.length} ta rol</p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Rol qo&apos;shish
        </Button>
      </div>

      {/* Roles List */}
      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rollar topilmadi</h3>
            <p className="text-gray-600 mb-6">Yangi rol qo&apos;shish uchun tugmani bosing</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Rol qo&apos;shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      {role.code && (
                        <p className="text-sm text-gray-500">Kod: {role.code}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={role.is_active ? "default" : "secondary"}>
                    {role.is_active ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Description */}
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}

                  {/* Salary Range */}
                  {(role.salary_range_min || role.salary_range_max) && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">Maosh diapazoni:</span>
                      </div>
                      <div className="text-sm">
                        {role.salary_range_min && (
                          <p className="text-gray-700">
                            Min: {formatCurrency(role.salary_range_min)}
                          </p>
                        )}
                        {role.salary_range_max && (
                          <p className="text-gray-700">
                            Max: {formatCurrency(role.salary_range_max)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  {role.permissions && Object.keys(role.permissions).length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Ruxsatlar:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(role.permissions).map((key) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role.id, role.name)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      O&apos;chirish
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Dialog */}
      <Dialog
        open={roleDialog.open}
        onOpenChange={(open) => setRoleDialog({ ...roleDialog, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {roleDialog.mode === "create" ? "Yangi rol qo'shish" : "Rolni tahrirlash"}
            </DialogTitle>
            <DialogDescription>Rol ma&apos;lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Rol nomi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Masalan: O'qituvchi"
                  required
                />
              </div>

              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Kod</Label>
                <Input
                  id="code"
                  value={roleForm.code || ""}
                  onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                  placeholder="Masalan: teacher"
                />
                <p className="text-xs text-gray-500">
                  Dasturda ishlatish uchun unikal kod
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  value={roleForm.description || ""}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Rol haqida qisqacha ma'lumot"
                  rows={3}
                />
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">Minimal maosh (so&apos;m)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={roleForm.salary_range_min || ""}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        salary_range_min: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Masalan: 3000000"
                    step="100000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_max">Maksimal maosh (so&apos;m)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={roleForm.salary_range_max || ""}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        salary_range_max: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Masalan: 5000000"
                    step="100000"
                  />
                </div>
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
    </div>
  );
}
