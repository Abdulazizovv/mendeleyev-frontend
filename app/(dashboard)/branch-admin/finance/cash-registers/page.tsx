"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, formatRelativeDateTime } from "@/lib/utils";
import type { CreateCashRegisterRequest } from "@/types/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Wallet,
  MapPin,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function CashRegistersPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id;

  const [searchTerm, setSearchTerm] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<any>(null);

  const [form, setForm] = useState<CreateCashRegisterRequest>({
    branch: branchId || "",
    name: "",
    description: "",
    location: "",
    is_active: true,
  });

  // Fetch cash registers
  const { data: cashRegistersData, isLoading } = useQuery({
    queryKey: ["cash-registers", branchId, searchTerm],
    queryFn: () =>
      financeApi.getCashRegisters({
        branch_id: branchId,
        search: searchTerm || undefined,
        ordering: "-created_at",
      }),
    enabled: !!branchId,
  });

  const cashRegisters = cashRegistersData?.results || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: financeApi.createCashRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setCreateDialog(false);
      resetForm();
      toast.success("Kassa muvaffaqiyatli yaratildi");
    },
    onError: () => {
      toast.error("Kassa yaratishda xatolik yuz berdi");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCashRegisterRequest> }) =>
      financeApi.updateCashRegister(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setEditDialog(false);
      setSelectedRegister(null);
      resetForm();
      toast.success("Kassa muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Kassa yangilashda xatolik yuz berdi");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: financeApi.deleteCashRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      toast.success("Kassa muvaffaqiyatli o'chirildi");
    },
    onError: () => {
      toast.error("Kassa o'chirishda xatolik yuz berdi");
    },
  });

  const resetForm = () => {
    setForm({
      branch: branchId || "",
      name: "",
      description: "",
      location: "",
      is_active: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialog(true);
  };

  const openEditDialog = (register: any) => {
    setSelectedRegister(register);
    setForm({
      branch: register.branch,
      name: register.name,
      description: register.description || "",
      location: register.location || "",
      is_active: register.is_active,
    });
    setEditDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editDialog && selectedRegister) {
      updateMutation.mutate({ id: selectedRegister.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name} kassasini o'chirishni tasdiqlaysizmi?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Kassalar
            </h1>
            <p className="text-muted-foreground mt-1">
              Filial kassalarini boshqarish va monitoring
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Kassa yaratish
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Kassa nomi yoki manzil bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cash Registers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Barcha kassalar ({cashRegisters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : cashRegisters.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Qidiruv natijasi topilmadi" : "Hech qanday kassa mavjud emas"}
              </p>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Birinchi kassani yaratish
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kassa nomi</TableHead>
                    <TableHead>Manzil</TableHead>
                    <TableHead>Balans</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Yaratilgan</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashRegisters.map((register) => (
                    <TableRow key={register.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Wallet className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{register.name}</p>
                            {register.description && (
                              <p className="text-sm text-gray-500">{register.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {register.location ? (
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{register.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-lg">
                          {formatCurrency(register.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={register.is_active ? "default" : "secondary"}>
                          {register.is_active ? "Faol" : "Nofaol"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatRelativeDateTime(register.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(register)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(register.id, register.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialog || editDialog} onOpenChange={(open) => {
        if (!open) {
          setCreateDialog(false);
          setEditDialog(false);
          setSelectedRegister(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog ? "Kassani tahrirlash" : "Yangi kassa yaratish"}
            </DialogTitle>
            <DialogDescription>
              Kassa ma&apos;lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Kassa nomi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Masalan: Asosiy kassa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Manzil</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Masalan: 1-qavat, kabinet 101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Kassa haqida qisqacha ma'lumot..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Faol kassa
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialog(false);
                  setEditDialog(false);
                  setSelectedRegister(null);
                  resetForm();
                }}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {editDialog ? "Saqlash" : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
