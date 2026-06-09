"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import type { FinanceCategory, FinanceCategoryClientType } from "@/types/finance";
import { FINANCE_CATEGORY_CLIENT_TYPE_LABELS } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreVertical, Edit, Trash2,
  TrendingUp, TrendingDown, LayoutList,
  User, Users, Globe, HelpCircle,
  GraduationCap, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { cn } from "@/lib/utils";

// ── Types & constants ─────────────────────────────────────────────────────────

type CategoryType = "income" | "expense";

const CLIENT_TYPE_ICONS: Record<FinanceCategoryClientType, React.ElementType> = {
  student: GraduationCap,
  employee: Users,
  third_party: Globe,
  other: HelpCircle,
};

const CLIENT_TYPE_COLORS: Record<FinanceCategoryClientType, string> = {
  student:     "bg-blue-50   text-blue-700   border-blue-200",
  employee:    "bg-orange-50 text-orange-700 border-orange-200",
  third_party: "bg-purple-50 text-purple-700 border-purple-200",
  other:       "bg-slate-50  text-slate-600  border-slate-200",
};

interface FormState {
  name: string;
  type: CategoryType;
  client_type: FinanceCategoryClientType;
  description: string;
  is_active: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "", type: "income", client_type: "other", description: "", is_active: true,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionTypesPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id ?? "";

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<FinanceCategory | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<FinanceCategory | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["finance-categories", branchId],
    queryFn: () => financeApi.getCategories({ page_size: 200 }),
    enabled: !!branchId,
  });

  const allCategories = data?.results ?? [];
  const incomeCategories = allCategories.filter((c) => c.type === "income");
  const expenseCategories = allCategories.filter((c) => c.type === "expense");

  const createMutation = useMutation({
    mutationFn: () => financeApi.createCategory({
      name: form.name,
      type: form.type,
      client_type: form.client_type,
      description: form.description || undefined,
      is_active: form.is_active,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-categories"] });
      toast.success("Tranzaksiya turi yaratildi");
      setDialog(null);
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () => financeApi.updateCategory(editTarget!.id, {
      name: form.name,
      client_type: form.client_type,
      description: form.description || undefined,
      is_active: form.is_active,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-categories"] });
      toast.success("Tranzaksiya turi yangilandi");
      setDialog(null);
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-categories"] });
      toast.success("Tranzaksiya turi o'chirildi");
      setDeleteConfirm(null);
    },
    onError: (e: unknown) => {
      toast.error(extractApiError(e) ?? "O'chirib bo'lmadi");
      setDeleteConfirm(null);
    },
  });

  function openCreate(defaultType?: CategoryType) {
    setForm({ ...DEFAULT_FORM, type: defaultType ?? "income" });
    setEditTarget(null);
    setDialog("create");
  }

  function openEdit(c: FinanceCategory) {
    setForm({ name: c.name, type: c.type, client_type: c.client_type, description: c.description ?? "", is_active: c.is_active });
    setEditTarget(c);
    setDialog("edit");
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (dialog === "edit") updateMutation.mutate();
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
            <LayoutList className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900">Tranzaksiya turlari</span>
            <span className="text-xs text-slate-400 ml-2">{allCategories.length} ta</span>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 h-8 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => openCreate()}>
          <Plus className="w-3.5 h-3.5" />
          Yangi tur
        </Button>
      </div>

      {/* 2-column content */}
      <div className="flex-1 overflow-hidden flex gap-0">
        {/* Income column */}
        <CategoryColumn
          type="income"
          label="Kirim turlari"
          categories={incomeCategories}
          isLoading={isLoading}
          onAdd={() => openCreate("income")}
          onEdit={openEdit}
          onDelete={setDeleteConfirm}
        />

        {/* Divider */}
        <div className="w-px bg-slate-200 shrink-0" />

        {/* Expense column */}
        <CategoryColumn
          type="expense"
          label="Chiqim turlari"
          categories={expenseCategories}
          isLoading={isLoading}
          onAdd={() => openCreate("expense")}
          onEdit={openEdit}
          onDelete={setDeleteConfirm}
        />
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog === "edit" ? "Turni tahrirlash" : "Yangi tranzaksiya turi"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label>Tur nomi <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="Masalan: O'quvchi to'lovi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {dialog === "create" && (
              <div className="space-y-1.5">
                <Label>Yo'nalish <span className="text-rose-500">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "income" })}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                      form.type === "income"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <TrendingUp className="w-4 h-4" />Kirim
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "expense" })}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                      form.type === "expense"
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <TrendingDown className="w-4 h-4" />Chiqim
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Mijoz turi</Label>
              <Select
                value={form.client_type}
                onValueChange={(v) => setForm({ ...form, client_type: v as FinanceCategoryClientType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {([
                    ["student", GraduationCap, "O'quvchi"],
                    ["employee", Users, "Xodim"],
                    ["third_party", Globe, "Uchinchi shaxs"],
                    ["other", HelpCircle, "Boshqa"],
                  ] as const).map(([v, Icon, label]) => (
                    <SelectItem key={v} value={v}>
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />{label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Tranzaksiya qo'shganda qaysi maydon ko'rinadi</p>
            </div>

            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Textarea
                placeholder="Qisqacha ma'lumot..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-slate-700">Faol</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || isPending}>
              {isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {dialog === "edit" ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-rose-600" />
              </div>
              Turni o'chirish
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Bu tur bog'liq tranzaksiyalar mavjud bo'lsa o'chirib bo'lmaydi. Buning o'rniga nofaol qilish tavsiya etiladi.
              </p>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">"{deleteConfirm?.name}"</span> turini o'chirishni tasdiqlaysizmi?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Bekor qilish</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Category column ───────────────────────────────────────────────────────────

function CategoryColumn({
  type, label, categories, isLoading, onAdd, onEdit, onDelete,
}: {
  type: "income" | "expense";
  label: string;
  categories: FinanceCategory[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (c: FinanceCategory) => void;
  onDelete: (c: FinanceCategory) => void;
}) {
  const isIncome = type === "income";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Column header */}
      <div className={cn(
        "px-5 py-3 border-b flex items-center justify-between shrink-0",
        isIncome ? "bg-emerald-50/60" : "bg-rose-50/60"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center",
            isIncome ? "bg-emerald-100" : "bg-rose-100"
          )}>
            {isIncome
              ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              : <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            }
          </div>
          <span className={cn("text-sm font-semibold", isIncome ? "text-emerald-800" : "text-rose-800")}>
            {label}
          </span>
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {categories.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
            isIncome
              ? "text-emerald-600 hover:bg-emerald-100"
              : "text-rose-600 hover:bg-rose-100"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
              isIncome ? "bg-emerald-50" : "bg-rose-50"
            )}>
              {isIncome
                ? <TrendingUp className="w-5 h-5 text-emerald-300" />
                : <TrendingDown className="w-5 h-5 text-rose-300" />
              }
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {isIncome ? "Kirim turlari" : "Chiqim turlari"} yo'q
            </p>
            <button
              onClick={onAdd}
              className={cn(
                "text-xs font-medium mt-2 px-3 py-1.5 rounded-lg transition-colors",
                isIncome
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              )}
            >
              <Plus className="w-3 h-3 inline mr-1" />
              Yangi qo'shish
            </button>
          </div>
        ) : (
          categories.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              onEdit={() => onEdit(c)}
              onDelete={() => onDelete(c)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({
  category, onEdit, onDelete,
}: {
  category: FinanceCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = category.type === "income";
  const ClientIcon = CLIENT_TYPE_ICONS[category.client_type] ?? HelpCircle;
  const clientColor = CLIENT_TYPE_COLORS[category.client_type];

  return (
    <div className={cn(
      "bg-white rounded-xl border px-3.5 py-3 transition-all hover:shadow-sm group",
      !category.is_active && "opacity-50",
      isIncome ? "border-slate-200 hover:border-emerald-200" : "border-slate-200 hover:border-rose-200"
    )}>
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          isIncome ? "bg-emerald-50" : "bg-rose-50"
        )}>
          <ClientIcon className={cn("w-4 h-4", isIncome ? "text-emerald-600" : "text-rose-600")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">{category.name}</p>
            {!category.is_active && (
              <span className="text-xs text-slate-400 shrink-0">Nofaol</span>
            )}
          </div>
          <div className={cn("inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md border mt-0.5", clientColor)}>
            <ClientIcon className="w-2.5 h-2.5" />
            {FINANCE_CATEGORY_CLIENT_TYPE_LABELS[category.client_type]}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-sm">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-3.5 h-3.5 mr-2" />Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {category.description && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-1 pl-[2.75rem]">{category.description}</p>
      )}
    </div>
  );
}
