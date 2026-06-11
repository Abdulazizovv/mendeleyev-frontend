"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgePercent,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { cn } from "@/lib/utils";
import type {
  SubscriptionPlan,
  CreateSubscriptionPlanRequest,
  PeriodType,
  Discount,
  CreateDiscountRequest,
  DiscountType,
} from "@/types/finance";

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Oylik",
  yearly: "Yillik",
  quarterly: "Choraklik",
  semester: "Semestr",
};
const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "Foiz",
  fixed: "Fikslangan",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SubscriptionPlansPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "discounts">("plans");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="bg-white border-b shrink-0 px-6">
        <div className="flex items-center -mb-px">
          {(["plans", "discounts"] as const).map((tab) => {
            const label = tab === "plans" ? "Abonementlar" : "Chegirmalar";
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                )}
              >
                {tab === "plans" ? (
                  <CreditCard className="w-3.5 h-3.5" />
                ) : (
                  <BadgePercent className="w-3.5 h-3.5" />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "plans" ? <PlansSection /> : <DiscountsSection />}
      </div>
    </div>
  );
}

// ── Subscription Plans ────────────────────────────────────────────────────────

function PlansSection() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<Partial<CreateSubscriptionPlanRequest>>({
    period: "monthly", is_active: true, grade_level_min: 1, grade_level_max: 11,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-plans", branchId, search],
    queryFn: () => financeApi.getSubscriptionPlans({ branch_id: branchId, search: search || undefined }),
    enabled: !!branchId,
  });
  const plans = data?.results ?? [];

  const resetForm = () => setForm({ period: "monthly", is_active: true, grade_level_min: 1, grade_level_max: 11 });

  const createMutation = useMutation({
    mutationFn: (d: CreateSubscriptionPlanRequest) => financeApi.createSubscriptionPlan(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscription-plans"] }); toast.success("Abonement tarifi yaratildi"); setDialog(null); resetForm(); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubscriptionPlanRequest> }) => financeApi.updateSubscriptionPlan(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscription-plans"] }); toast.success("Tarif yangilandi"); setDialog(null); setSelected(null); resetForm(); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteSubscriptionPlan(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subscription-plans"] }); toast.success("Tarif o'chirildi"); setDeleteTarget(null); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  function openEdit(p: SubscriptionPlan) {
    setSelected(p);
    setForm({ name: p.name, price: p.price, grade_level_min: p.grade_level_min, grade_level_max: p.grade_level_max, period: p.period, description: p.description ?? "", is_active: p.is_active });
    setDialog("edit");
  }

  function handleSave() {
    if (!form.name?.trim()) return toast.error("Tarif nomini kiriting");
    if (!form.price || Number(form.price) <= 0) return toast.error("Narxni kiriting");
    const payload = { ...form, branch: branchId!, price: Number(form.price), grade_level_min: Number(form.grade_level_min), grade_level_max: Number(form.grade_level_max) } as CreateSubscriptionPlanRequest;
    if (dialog === "edit" && selected) updateMutation.mutate({ id: selected.id, data: payload });
    else createMutation.mutate(payload);
  }

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={() => { resetForm(); setDialog("create"); }} className="h-10 gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />Yangi tarif
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-3">Abonement tariflari yo'q</p>
            <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={() => { resetForm(); setDialog("create"); }}>
              <Plus className="w-3.5 h-3.5" />Birinchi tarifni yarating
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Tarif nomi", "Narx", "Sinflar", "Davr", "Holat", "Tavsif", ""].map((h) => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold text-slate-500 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{plan.name}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600 tabular-nums">{formatCurrency(plan.price)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{plan.grade_level_range}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">{PERIOD_LABELS[plan.period] ?? plan.period}</span>
                  </td>
                  <td className="py-3 px-4">
                    {plan.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />Faol
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                        <XCircle className="w-3.5 h-3.5" />Nofaol
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">{plan.description || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(plan)}><Edit className="w-3.5 h-3.5 mr-2" />Tahrirlash</DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => setDeleteTarget(plan)}><Trash2 className="w-3.5 h-3.5 mr-2" />O'chirish</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => { if (!o) { setDialog(null); setSelected(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog === "edit" ? "Tarifni tahrirlash" : "Yangi abonement tarifi"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Tarif nomi <span className="text-rose-500">*</span></Label>
              <Input placeholder="Oylik standart" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Narx (UZS) <span className="text-rose-500">*</span></Label>
              <Input type="number" placeholder="0" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min sinf</Label>
                <Input type="number" min={1} max={11} placeholder="1" value={form.grade_level_min ?? ""} onChange={(e) => setForm({ ...form, grade_level_min: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max sinf</Label>
                <Input type="number" min={1} max={11} placeholder="11" value={form.grade_level_max ?? ""} onChange={(e) => setForm({ ...form, grade_level_max: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Davr</Label>
              <Select value={form.period} onValueChange={(v: PeriodType) => setForm({ ...form, period: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Oylik</SelectItem>
                  <SelectItem value="quarterly">Choraklik</SelectItem>
                  <SelectItem value="semester">Semestr</SelectItem>
                  <SelectItem value="yearly">Yillik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Input placeholder="Qo'shimcha ma'lumot..." value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-700">Faol tarif</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setSelected(null); }}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
              {dialog === "edit" ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tarifni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteTarget?.name}</span> tarifini o'chirishni tasdiqlaysizmi? Bu amalni bekor qilish mumkin emas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-rose-600 hover:bg-rose-700" disabled={deleteMutation.isPending}>
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Discounts ─────────────────────────────────────────────────────────────────

function DiscountsSection() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [selected, setSelected] = useState<Discount | null>(null);
  const [form, setForm] = useState<Partial<CreateDiscountRequest>>({ discount_type: "percentage", is_active: true });

  const { data, isLoading } = useQuery({
    queryKey: ["discounts", branchId, search],
    queryFn: () => financeApi.getDiscounts({ branch_id: branchId, search: search || undefined }),
    enabled: !!branchId,
  });
  const discounts = data?.results ?? [];

  const resetForm = () => setForm({ discount_type: "percentage", is_active: true });

  const createMutation = useMutation({
    mutationFn: (d: CreateDiscountRequest) => financeApi.createDiscount(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["discounts"] }); toast.success("Chegirma yaratildi"); setDialog(null); resetForm(); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDiscountRequest> }) => financeApi.updateDiscount(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["discounts"] }); toast.success("Chegirma yangilandi"); setDialog(null); setSelected(null); resetForm(); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteDiscount(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["discounts"] }); toast.success("Chegirma o'chirildi"); setDeleteTarget(null); },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  function openEdit(d: Discount) {
    setSelected(d);
    setForm({ name: d.name, discount_type: d.discount_type, amount: d.amount, description: d.description ?? "", valid_from: d.valid_from ?? "", valid_until: d.valid_until ?? "", is_active: d.is_active });
    setDialog("edit");
  }

  function handleSave() {
    if (!form.name?.trim()) return toast.error("Chegirma nomini kiriting");
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Miqdorni kiriting");
    if (form.discount_type === "percentage" && Number(form.amount) > 100) return toast.error("Foiz 100 dan oshmasligi kerak");
    const payload = { ...form, branch: branchId!, amount: Number(form.amount) } as CreateDiscountRequest;
    if (dialog === "edit" && selected) updateMutation.mutate({ id: selected.id, data: payload });
    else createMutation.mutate(payload);
  }

  function formatValue(d: Discount) {
    return d.discount_type === "percentage" ? `${d.amount}%` : formatCurrency(d.amount);
  }

  function isExpired(d: Discount) {
    return !!d.valid_until && new Date(d.valid_until) < new Date();
  }

  function fmtDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("uz-UZ");
  }

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={() => { resetForm(); setDialog("create"); }} className="h-10 gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />Yangi chegirma
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <BadgePercent className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-3">Chegirmalar yo'q</p>
            <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={() => { resetForm(); setDialog("create"); }}>
              <Plus className="w-3.5 h-3.5" />Birinchi chegirmani yarating
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Chegirma nomi", "Turi", "Miqdori", "Muddati", "Holat", "Tavsif", ""].map((h) => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold text-slate-500 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{d.name}</td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", d.discount_type === "percentage" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600")}>
                      {DISCOUNT_TYPE_LABELS[d.discount_type] ?? d.discount_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-blue-600 tabular-nums">{formatValue(d)}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {d.valid_from || d.valid_until ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {fmtDate(d.valid_from)} → {fmtDate(d.valid_until)}
                      </span>
                    ) : "Cheklanmagan"}
                  </td>
                  <td className="py-3 px-4">
                    {isExpired(d) ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-rose-600"><XCircle className="w-3.5 h-3.5" />Muddati o'tgan</span>
                    ) : d.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />Faol</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-400"><XCircle className="w-3.5 h-3.5" />Nofaol</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">{d.description || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(d)}><Edit className="w-3.5 h-3.5 mr-2" />Tahrirlash</DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => setDeleteTarget(d)}><Trash2 className="w-3.5 h-3.5 mr-2" />O'chirish</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => { if (!o) { setDialog(null); setSelected(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog === "edit" ? "Chegirmani tahrirlash" : "Yangi chegirma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Chegirma nomi <span className="text-rose-500">*</span></Label>
              <Input placeholder="Yangi yil aksiyasi" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Turi</Label>
                <Select value={form.discount_type} onValueChange={(v: DiscountType) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Foiz (%)</SelectItem>
                    <SelectItem value="fixed">Fikslangan (UZS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Miqdori <span className="text-rose-500">*</span></Label>
                <Input type="number" placeholder={form.discount_type === "percentage" ? "10" : "50000"} value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Boshlanish</Label>
                <Input type="date" value={form.valid_from ?? ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tugash</Label>
                <Input type="date" value={form.valid_until ?? ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Input placeholder="Qo'shimcha ma'lumot..." value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-700">Faol chegirma</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setSelected(null); }}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
              {dialog === "edit" ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chegirmani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteTarget?.name}</span> chegirmasini o'chirishni tasdiqlaysizmi? Bu amalni bekor qilish mumkin emas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-rose-600 hover:bg-rose-700" disabled={deleteMutation.isPending}>
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
