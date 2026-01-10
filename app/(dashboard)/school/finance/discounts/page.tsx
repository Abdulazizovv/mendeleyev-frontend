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
  BadgePercent,
  Calendar,
  CheckCircle2,
  Edit,
  Plus,
  Search,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Discount,
  CreateDiscountRequest,
  DiscountType,
  DISCOUNT_TYPE_LABELS,
} from "@/types/finance";

const typeLabels: typeof DISCOUNT_TYPE_LABELS = {
  percentage: "Foiz",
  fixed: "Fikslangan",
};

export default function DiscountsPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<Partial<CreateDiscountRequest>>({
    discount_type: "percentage",
    is_active: true,
  });

  // Fetch discounts
  const { data, isLoading } = useQuery({
    queryKey: ["discounts", branchId, search],
    queryFn: () =>
      financeApi.getDiscounts({
        branch_id: branchId,
        search: search || undefined,
      }),
    enabled: !!branchId,
  });

  const discounts = data?.results || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDiscountRequest) => financeApi.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Chegirma muvaffaqiyatli yaratildi");
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDiscountRequest> }) =>
      financeApi.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Chegirma muvaffaqiyatli yangilandi");
      setEditModalOpen(false);
      setSelectedDiscount(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Chegirma muvaffaqiyatli o'chirildi");
      setDeleteDialogOpen(false);
      setSelectedDiscount(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  const resetForm = () => {
    setFormData({
      discount_type: "percentage",
      is_active: true,
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Chegirma nomini kiriting");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Chegirma miqdorini kiriting");
      return;
    }

    // Validate percentage type
    if (formData.discount_type === "percentage" && Number(formData.amount) > 100) {
      toast.error("Foiz 100 dan oshmasligi kerak");
      return;
    }

    createMutation.mutate({
      ...formData,
      branch: branchId!,
      amount: Number(formData.amount),
    } as CreateDiscountRequest);
  };

  const handleEdit = () => {
    if (!selectedDiscount) return;

    if (!formData.name) {
      toast.error("Chegirma nomini kiriting");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Chegirma miqdorini kiriting");
      return;
    }

    // Validate percentage type
    if (formData.discount_type === "percentage" && Number(formData.amount) > 100) {
      toast.error("Foiz 100 dan oshmasligi kerak");
      return;
    }

    updateMutation.mutate({
      id: selectedDiscount.id,
      data: {
        name: formData.name,
        discount_type: formData.discount_type!,
        amount: Number(formData.amount),
        description: formData.description,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: formData.is_active ?? true,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedDiscount) return;
    deleteMutation.mutate(selectedDiscount.id);
  };

  const openEditModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    setFormData({
      name: discount.name,
      discount_type: discount.discount_type,
      amount: discount.amount,
      description: discount.description || "",
      valid_from: discount.valid_from || "",
      valid_until: discount.valid_until || "",
      is_active: discount.is_active,
    });
    setEditModalOpen(true);
  };

  const openDeleteDialog = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDeleteDialogOpen(true);
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.discount_type === "percentage") {
      return `${discount.amount}%`;
    }
    return formatCurrency(discount.amount);
  };

  const isExpired = (discount: Discount) => {
    if (!discount.valid_until) return false;
    return new Date(discount.valid_until) < new Date();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chegirmalar</h1>
          <p className="text-muted-foreground mt-1">Maxsus takliflar va chegirmalar</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yangi Chegirma
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Chegirma qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Yuklanmoqda...</p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="p-12 text-center">
              <BadgePercent className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Hech qanday chegirma topilmadi</p>
              <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Birinchi chegirmani yarating
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chegirma nomi</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Miqdori</TableHead>
                  <TableHead>Amal qilish muddati</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Tavsif</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          discount.discount_type === "percentage"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {typeLabels[discount.discount_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {formatDiscountValue(discount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {discount.valid_from || discount.valid_until ? (
                          <>
                            <Calendar className="w-3 h-3" />
                            <span>
                              {discount.valid_from
                                ? new Date(discount.valid_from).toLocaleDateString("uz-UZ")
                                : "—"}
                              {" → "}
                              {discount.valid_until
                                ? new Date(discount.valid_until).toLocaleDateString("uz-UZ")
                                : "—"}
                            </span>
                          </>
                        ) : (
                          "Cheklanmagan"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpired(discount) ? (
                        <Badge
                          variant="outline"
                          className="gap-1 bg-red-100 text-red-800 border-red-200"
                        >
                          <XCircle className="w-3 h-3" />
                          Muddati o&apos;tgan
                        </Badge>
                      ) : discount.is_active ? (
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
                      {discount.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(discount)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(discount)}
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
            <DialogTitle>Yangi Chegirma</DialogTitle>
            <DialogDescription>Yangi chegirma yoki aksiya yarating</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Chegirma nomi</Label>
              <Input
                placeholder="Masalan: Yangi yil aksiyasi"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: DiscountType) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Fikslangan (UZS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Miqdori</Label>
                <Input
                  type="number"
                  placeholder={formData.discount_type === "percentage" ? "10" : "50000"}
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boshlanish sanasi</Label>
                <Input
                  type="date"
                  value={formData.valid_from || ""}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tugash sanasi</Label>
                <Input
                  type="date"
                  value={formData.valid_until || ""}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Tavsif (ixtiyoriy)</Label>
              <Input
                placeholder="Chegirma haqida qo'shimcha ma'lumot"
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
                Faol chegirma
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
            <DialogTitle>Chegirmani Tahrirlash</DialogTitle>
            <DialogDescription>Chegirma ma&apos;lumotlarini o&apos;zgartiring</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Chegirma nomi</Label>
              <Input
                placeholder="Masalan: Yangi yil aksiyasi"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turi</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: DiscountType) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Fikslangan (UZS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Miqdori</Label>
                <Input
                  type="number"
                  placeholder={formData.discount_type === "percentage" ? "10" : "50000"}
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boshlanish sanasi</Label>
                <Input
                  type="date"
                  value={formData.valid_from || ""}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tugash sanasi</Label>
                <Input
                  type="date"
                  value={formData.valid_until || ""}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Tavsif (ixtiyoriy)</Label>
              <Input
                placeholder="Chegirma haqida qo'shimcha ma'lumot"
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
                Faol chegirma
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
            <AlertDialogTitle>Chegirmani o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{selectedDiscount?.name}</span> chegirmasini
              o&apos;chirmoqchimisiz? Bu amalni bekor qilish mumkin emas.
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
