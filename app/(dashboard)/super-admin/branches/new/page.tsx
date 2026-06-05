"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NewBranchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    type: "school" as "school" | "center",
    code: "",
    address: "",
    phone_number: "",
    email: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      superadminApi.createBranch({
        name: form.name,
        type: form.type,
        code: form.code || undefined,
        address: form.address || undefined,
        phone_number: form.phone_number || undefined,
        email: form.email || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] });
      toast.success("Filial muvaffaqiyatli yaratildi");
      router.push("/super-admin/branches");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { name?: string[] } } })?.response?.data?.name?.[0];
      toast.error(msg ?? "Filial yaratishda xatolik yuz berdi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Filial nomi kiritilishi shart");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/super-admin/branches">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yangi filial</h1>
          <p className="text-sm text-gray-500">Yangi filial yaratish</p>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filial ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Filial nomi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Masalan: Toshkent filiali"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Filial turi</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as "school" | "center" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">Maktab</SelectItem>
                  <SelectItem value="center">O'quv markazi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">Filial kodi</Label>
              <Input
                id="code"
                placeholder="Masalan: TAS, SAM"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
              <p className="text-xs text-gray-400">O'quvchi shaxsiy raqami uchun ishlatiladi</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Manzil</Label>
              <Input
                id="address"
                placeholder="To'liq manzil"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon raqami</Label>
              <Input
                id="phone"
                placeholder="+998901234567"
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="filial@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
              <Link href="/super-admin/branches" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Bekor qilish
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
