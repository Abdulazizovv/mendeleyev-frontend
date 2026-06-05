"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditBranchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: branch, isLoading } = useQuery({
    queryKey: ["superadmin", "branch", id],
    queryFn: () => superadminApi.getBranch(id).then((r) => r.data),
  });

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone_number: "",
    email: "",
  });

  useEffect(() => {
    if (branch) {
      setForm({
        name: branch.name,
        code: branch.code ?? "",
        address: branch.address ?? "",
        phone_number: branch.phone_number ?? "",
        email: branch.email ?? "",
      });
    }
  }, [branch]);

  const mutation = useMutation({
    mutationFn: () =>
      superadminApi.updateBranch(id, {
        name: form.name || undefined,
        code: form.code || undefined,
        address: form.address || undefined,
        phone_number: form.phone_number || undefined,
        email: form.email || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branch", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] });
      toast.success("Filial muvaffaqiyatli yangilandi");
      router.push(`/super-admin/branches/${id}`);
    },
    onError: () => toast.error("Yangilashda xatolik yuz berdi"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Filial nomi kiritilishi shart");
      return;
    }
    mutation.mutate();
  };

  if (isLoading) {
    return <div className="h-40 bg-gray-100 rounded-xl animate-pulse max-w-lg" />;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/super-admin/branches/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filialni tahrirlash</h1>
          <p className="text-sm text-gray-500">{branch?.name}</p>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ma'lumotlarni yangilash</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Filial nomi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">Filial kodi</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Manzil</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon raqami</Label>
              <Input
                id="phone"
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
              <Link href={`/super-admin/branches/${id}`} className="flex-1">
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
