"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Calendar,
  CreditCard,
  Edit,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  SubscriptionPlan,
  CreateSubscriptionPlanRequest,
  PeriodType,
  PERIOD_TYPE_LABELS,
} from "@/types/finance";

const periodLabels: typeof PERIOD_TYPE_LABELS = {
  monthly: "Oylik",
  yearly: "Yillik",
  quarterly: "Choraklik",
  semester: "Semestr",
};

export default function SubscriptionPlansPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Partial<CreateSubscriptionPlanRequest>>({
    period: "monthly",
    is_active: true,
    grade_level_min: 1,
    grade_level_max: 11,
  });

  // Fetch subscription plans
  const { data, isLoading } = useQuery({
    queryKey: ["subscription-plans", branchId, search],
    queryFn: () =>
      financeApi.getSubscriptionPlans({
        branch_id: branchId,
        search: search || undefined,
      }),
    enabled: !!branchId,
  });

  const plans = data?.results || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSubscriptionPlanRequest) => financeApi.createSubscriptionPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Abonement tarifi muvaffaqiyatli yaratildi");
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubscriptionPlanRequest> }) =>
      financeApi.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Abonement tarifi muvaffaqiyatli yangilandi");
      setEditModalOpen(false);
      setSelectedPlan(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteSubscriptionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Abonement tarifi muvaffaqiyatli o'chirildi");
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  const resetForm = () => {
    setFormData({
      period: "monthly",
      is_active: true,
      grade_level_min: 1,
      grade_level_max: 11,
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Tarif nomini kiriting");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Narxni kiriting");
      return;
    }
    if (!formData.grade_level_min || !formData.grade_level_max) {
      toast.error("Sinf darajasini kiriting");
      return;
    }

    createMutation.mutate({
      ...formData,
      branch: branchId!,
      price: Number(formData.price),
      grade_level_min: Number(formData.grade_level_min),
      grade_level_max: Number(formData.grade_level_max),
    } as CreateSubscriptionPlanRequest);
  };

  const handleEdit = () => {
    if (!selectedPlan) return;

    if (!formData.name) {
      toast.error("Tarif nomini kiriting");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Narxni kiriting");
      return;
    }
    if (!formData.grade_level_min || !formData.grade_level_max) {
      toast.error("Sinf darajasini kiriting");
      return;
    }

    updateMutation.mutate({
      id: selectedPlan.id,
      data: {
        name: formData.name,
        price: Number(formData.price),
        grade_level_min: Number(formData.grade_level_min),
        grade_level_max: Number(formData.grade_level_max),
        period: formData.period!,
        description: formData.description,
        is_active: formData.is_active ?? true,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedPlan) return;
    deleteMutation.mutate(selectedPlan.id);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      grade_level_min: plan.grade_level_min,
      grade_level_max: plan.grade_level_max,
      period: plan.period,
      description: plan.description || "",
      is_active: plan.is_active,
    });
    setEditModalOpen(true);
  };

  const openDeleteDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abonement Tariflari</h1>
          <p className="text-muted-foreground mt-1">O&apos;quvchilar uchun to&apos;lov rejalari</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yangi Tarif
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tarif qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Yuklanmoqda...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Hech qanday tarif topilmadi</p>
              <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Birinchi tarifni yarating
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarif nomi</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Sinflar</TableHead>
                  <TableHead>Davr</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Tavsif</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {formatCurrency(plan.price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100">
                        {plan.grade_level_range}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {periodLabels[plan.period]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.is_active ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-green-100 text-green-800 border-green-200"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Faol
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-gray-100 text-gray-800 border-gray-200"
                        >
                          <XCircle className="w-3 h-3" />
                          Nofaol
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {plan.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(plan)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(plan)}
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Abonement Tarifi</DialogTitle>
            <DialogDescription>Yangi to&apos;lov tarifi yarating</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Tarif nomi</Label>
              <Input
                placeholder="Masalan: Oylik standart"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Narx (UZS)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>

            {/* Grade Level Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min sinf</Label>
                <Input
                  type="number"
                  placeholder="1"
                  min="1"
                  max="11"
                  value={formData.grade_level_min || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, grade_level_min: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max sinf</Label>
                <Input
                  type="number"
                  placeholder="11"
                  min="1"
                  max="11"
                  value={formData.grade_level_max || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, grade_level_max: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label>Davr</Label>
              <Select
                value={formData.period}
                onValueChange={(value: PeriodType) =>
                  setFormData({ ...formData, period: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Oylik</SelectItem>
                  <SelectItem value="quarterly">Choraklik</SelectItem>
                  <SelectItem value="semester">Semestr</SelectItem>
                  <SelectItem value="yearly">Yillik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Tavsif (ixtiyoriy)</Label>
              <Input
                placeholder="Tarif haqida qo'shimcha ma'lumot"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Active */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <label
                htmlFor="create-active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Faol tarif
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Yuklanmoqda..." : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tarifni Tahrirlash</DialogTitle>
            <DialogDescription>Abonement tarifini o&apos;zgartiring</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Tarif nomi</Label>
              <Input
                placeholder="Masalan: Oylik standart"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Narx (UZS)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>

            {/* Grade Level Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min sinf</Label>
                <Input
                  type="number"
                  placeholder="1"
                  min="1"
                  max="11"
                  value={formData.grade_level_min || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, grade_level_min: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max sinf</Label>
                <Input
                  type="number"
                  placeholder="11"
                  min="1"
                  max="11"
                  value={formData.grade_level_max || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, grade_level_max: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label>Davr</Label>
              <Select
                value={formData.period}
                onValueChange={(value: PeriodType) =>
                  setFormData({ ...formData, period: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Oylik</SelectItem>
                  <SelectItem value="quarterly">Choraklik</SelectItem>
                  <SelectItem value="semester">Semestr</SelectItem>
                  <SelectItem value="yearly">Yillik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Tavsif (ixtiyoriy)</Label>
              <Input
                placeholder="Tarif haqida qo'shimcha ma'lumot"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Active */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <label
                htmlFor="edit-active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Faol tarif
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Yuklanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tarifni o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{selectedPlan?.name}</span> tarifini o&apos;chirmoqchimisiz? Bu
              amalni bekor qilish mumkin emas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Yuklanmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
