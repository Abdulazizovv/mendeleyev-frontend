"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { TrendingDown, Loader2 } from "lucide-react";
import type { CreateTransactionRequest, PaymentMethod } from "@/types/finance";

interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateExpenseModal({
  open,
  onClose,
  onSuccess,
}: CreateExpenseModalProps) {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<CreateTransactionRequest>>({
    transaction_type: "expense",
    payment_method: "cash",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // Fetch cash registers
  const { data: cashRegistersData } = useQuery({
    queryKey: ["cash-registers", branchId],
    queryFn: () => financeApi.getCashRegisters({ branch_id: branchId }),
    enabled: !!branchId && open,
  });

  // Fetch expense categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "expense"],
    queryFn: () => financeApi.getCategories({ type: "expense", is_active: true }),
    enabled: open,
  });

  const cashRegisters = cashRegistersData?.results || [];
  const categories = categoriesData?.results || [];

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) => financeApi.createTransaction(data),
    onSuccess: () => {
      toast.success("Chiqim tranzaksiyasi muvaffaqiyatli yaratildi");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      handleReset();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!branchId || !formData.cash_register || !formData.amount) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    createMutation.mutate({
      ...formData,
      branch: branchId,
      transaction_type: "expense",
    } as CreateTransactionRequest);
  };

  const handleReset = () => {
    setFormData({
      transaction_type: "expense",
      payment_method: "cash",
      transaction_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <TrendingDown className="w-5 h-5" />
            Chiqim tranzaksiyasi yaratish
          </DialogTitle>
          <DialogDescription>
            Kassadan chiqim qo'shish uchun ma'lumotlarni kiriting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash Register */}
            <div className="space-y-2">
              <Label htmlFor="cash_register">
                Kassa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.cash_register}
                onValueChange={(value) =>
                  setFormData({ ...formData, cash_register: value })
                }
              >
                <SelectTrigger id="cash_register">
                  <SelectValue placeholder="Kassani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {cashRegisters.map((register) => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategoriya</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Summa (so'm) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                className="text-lg font-semibold text-red-600"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">
                To'lov usuli <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value as PaymentMethod })
                }
              >
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Naqd pul</SelectItem>
                  <SelectItem value="card">Karta</SelectItem>
                  <SelectItem value="bank_transfer">Bank o'tkazmasi</SelectItem>
                  <SelectItem value="mobile_payment">Mobil to'lov</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="transaction_date">
                Sana <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_date: e.target.value })
                }
              />
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="reference_number">Referens raqam</Label>
              <Input
                id="reference_number"
                placeholder="REF-123"
                value={formData.reference_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Tavsif</Label>
            <Input
              id="description"
              placeholder="Qo'shimcha ma'lumot..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
