"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { staffApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Role, CreateRoleRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  ChevronRight,
  Shield,
  Check,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// ── Permission modules ────────────────────────────────────────────────────────
type PermsData = Record<string, Record<string, boolean>>;

const PERMISSION_MODULES: Record<string, { label: string; actions: string[] }> = {
  students:   { label: "O'quvchilar",  actions: ["view", "create", "edit", "delete"] },
  finance:    { label: "Moliya",        actions: ["view", "create", "edit", "delete"] },
  staff:      { label: "Xodimlar",      actions: ["view", "create", "edit", "delete"] },
  schedule:   { label: "Dars jadvali",  actions: ["view", "create", "edit", "delete"] },
  classes:    { label: "Sinflar",       actions: ["view", "create", "edit", "delete"] },
  grades:     { label: "Baholar",       actions: ["view", "create", "edit", "delete"] },
  attendance: { label: "Davomat",       actions: ["view", "create", "edit", "delete"] },
  homework:   { label: "Uyga vazifa",   actions: ["view", "create", "edit", "delete"] },
  reports:    { label: "Hisobotlar",    actions: ["view"] },
  settings:   { label: "Sozlamalar",    actions: ["view", "edit"] },
};

const ACTION_LABELS: Record<string, string> = {
  view: "Ko'rish",
  create: "Yaratish",
  edit: "Tahrirlash",
  delete: "O'chirish",
};

// ── PermissionMatrix ──────────────────────────────────────────────────────────
function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: PermsData;
  onChange: (p: PermsData) => void;
}) {
  const toggle = (module: string, action: string, val: boolean) => {
    onChange({
      ...permissions,
      [module]: { ...(permissions[module] || {}), [action]: val },
    });
  };

  const toggleModule = (module: string, allOn: boolean) => {
    const actions = PERMISSION_MODULES[module].actions;
    onChange({
      ...permissions,
      [module]: Object.fromEntries(actions.map((a) => [a, !allOn])),
    });
  };

  return (
    <div className="space-y-2.5">
      {Object.entries(PERMISSION_MODULES).map(([module, meta]) => {
        const modPerms = permissions[module] || {};
        const enabledCount = meta.actions.filter((a) => modPerms[a]).length;
        const allOn = enabledCount === meta.actions.length;
        const someOn = enabledCount > 0 && !allOn;

        return (
          <div key={module} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Module header */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleModule(module, allOn)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                    allOn
                      ? "bg-blue-600 border-blue-600"
                      : someOn
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {allOn && <Check className="w-3 h-3 text-white" />}
                  {someOn && <span className="w-2.5 h-0.5 bg-blue-500 block rounded-full" />}
                </button>
                <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {enabledCount}/{meta.actions.length}
              </span>
            </div>
            {/* Actions grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100">
              {meta.actions.map((action) => {
                const checked = !!modPerms[action];
                return (
                  <label
                    key={action}
                    className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors ${
                      checked ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggle(module, action, e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-600 select-none">
                      {ACTION_LABELS[action] || action}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  selected,
  onClick,
}: {
  role: Role;
  selected: boolean;
  onClick: () => void;
}) {
  const activeModules = Object.values(role.permissions || {}).filter(
    (v) => typeof v === "object" && Object.values(v).some(Boolean)
  ).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selected ? "bg-blue-600" : "bg-blue-100"
          }`}
        >
          <Briefcase className={`w-5 h-5 ${selected ? "text-white" : "text-blue-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${selected ? "text-blue-700" : "text-gray-900"}`}>
            {role.name}
          </p>
          {(role as any).description ? (
            <p className="text-xs text-gray-400 truncate mt-0.5">{(role as any).description}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">
              {activeModules > 0 ? `${activeModules} ta modul` : "Ruxsatlar belgilanmagan"}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            variant={role.is_active ? "default" : "secondary"}
            className={`text-xs h-5 px-2 ${
              role.is_active
                ? "bg-green-100 text-green-700 hover:bg-green-100 border-0"
                : "bg-gray-100 text-gray-500 border-0"
            }`}
          >
            {role.is_active ? "Faol" : "Nofaol"}
          </Badge>
          <ChevronRight className={`w-4 h-4 ${selected ? "text-blue-500" : "text-gray-300"}`} />
        </div>
      </div>
    </button>
  );
}

// ── Role form interface ───────────────────────────────────────────────────────
interface RoleForm {
  name: string;
  description: string;
  is_active: boolean;
  permissions: PermsData;
}
const emptyForm = (): RoleForm => ({
  name: "",
  description: "",
  is_active: true,
  permissions: {},
});
type EditorMode = "idle" | "create" | "edit";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<EditorMode>("idle");
  const [form, setForm] = React.useState<RoleForm>(emptyForm());
  // On mobile, show either the list or the editor, not both
  const [mobileView, setMobileView] = React.useState<"list" | "editor">("list");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", branchId],
    queryFn: () => staffApi.getRoles(branchId),
    enabled: !!branchId,
  });

  const handleApiError = (err: any, fallback: string) => {
    const errors = err?.response?.data;
    if (errors && typeof errors === "object") {
      Object.entries(errors).forEach(([field, msgs]) => {
        const list = Array.isArray(msgs) ? msgs : [msgs];
        list.forEach((m) => toast.error(`${field}: ${m}`));
      });
    } else {
      toast.error(fallback);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => staffApi.createRole(branchId, data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      setSelectedId(newRole.id);
      setMode("edit");
      toast.success("Rol yaratildi");
    },
    onError: (err: any) => handleApiError(err, "Rol yaratishda xatolik"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleRequest> }) =>
      staffApi.updateRole(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      toast.success("Rol yangilandi");
    },
    onError: (err: any) => handleApiError(err, "Rolni yangilashda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.deleteRole(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      setSelectedId(null);
      setMode("idle");
      setMobileView("list");
      toast.success("Rol o'chirildi");
    },
    onError: (err: any) => handleApiError(err, "Rolni o'chirishda xatolik"),
  });

  const selectedRole = roles.find((r) => r.id === selectedId);

  const selectRole = (role: Role) => {
    setSelectedId(role.id);
    setMode("edit");
    setMobileView("editor");
    setForm({
      name: role.name,
      description: (role as any).description || "",
      is_active: role.is_active,
      permissions: (role.permissions as unknown as PermsData) || {},
    });
  };

  const startCreate = () => {
    setSelectedId(null);
    setMode("create");
    setMobileView("editor");
    setForm(emptyForm());
  };

  const cancelEdit = () => {
    if (mode === "create") {
      setMode("idle");
      setMobileView("list");
    } else if (selectedRole) {
      selectRole(selectedRole);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Rol nomini kiriting");
      return;
    }
    const payload: CreateRoleRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      is_active: form.is_active,
      permissions: form.permissions,
    };
    if (mode === "create") {
      createMutation.mutate(payload);
    } else if (selectedId) {
      updateMutation.mutate({ id: selectedId, data: payload });
    }
  };

  const handleDelete = () => {
    if (!selectedId || !selectedRole) return;
    if (confirm(`"${selectedRole.name}" rolini o'chirmoqchimisiz?`)) {
      deleteMutation.mutate(selectedId);
    }
  };

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      ((r as any).description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const showList = mobileView === "list";
  const showEditor = mobileView === "editor";

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rollar</h1>
          <p className="text-sm text-gray-500 mt-1">{roles.length} ta custom rol mavjud</p>
        </div>
        <Button
          onClick={startCreate}
          className="gap-2 bg-blue-600 hover:bg-blue-700 h-10 px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yangi rol</span>
          <span className="sm:hidden">Yangi</span>
        </Button>
      </div>

      {/* Split layout — desktop side by side, mobile stacked */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* ── Left: role list ── */}
        <div className={`lg:w-80 xl:w-96 lg:flex-shrink-0 flex flex-col gap-3 ${!showList ? "hidden lg:flex" : "flex"}`}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-10 h-11 text-sm rounded-xl border-gray-200 focus:border-blue-400"
              placeholder="Rol qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 lg:max-h-[calc(100vh-260px)]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-500 mb-1">
                  {search ? "Topilmadi" : "Hali rol yo'q"}
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  {search ? "Boshqa kalit so'z bilan qidiring" : "Birinchi rolni yarating"}
                </p>
                {!search && (
                  <Button onClick={startCreate} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Rol yaratish
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedId === role.id}
                  onClick={() => selectRole(role)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: editor ── */}
        <div
          className={`flex-1 border border-gray-200 rounded-2xl bg-white flex flex-col overflow-hidden min-h-0 ${
            !showEditor && mode === "idle" ? "hidden lg:flex" : "flex"
          }`}
        >
          {mode === "idle" ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                <Shield className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Rol tanlang</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
                Chap paneldan tahrirlash uchun rol tanlang yoki yangi rol yarating
              </p>
              <Button
                onClick={startCreate}
                className="gap-2 bg-blue-600 hover:bg-blue-700 h-11 px-6"
              >
                <Plus className="w-4 h-4" />
                Yangi rol yaratish
              </Button>
            </div>
          ) : (
            <>
              {/* Editor header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                {/* Mobile: back to list */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setMobileView("list"); }}
                    className="lg:hidden p-2 rounded-xl text-gray-400 hover:bg-gray-100 -ml-1"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {mode === "create" ? "Yangi rol yaratish" : `"${selectedRole?.name}" tahrirlash`}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {mode === "create"
                        ? "Rol nomini va ruxsatlarini belgilang"
                        : "O'zgarishlar avtomatik saqlanmaydi"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Basic info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                        Rol nomi <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Masalan: Marketing menejeri"
                        className="h-11 text-sm rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desc" className="text-sm font-semibold text-gray-700">
                        Tavsif
                      </Label>
                      <Textarea
                        id="desc"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Bu rol haqida qisqacha ma'lumot..."
                        rows={2}
                        className="text-sm rounded-xl resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_active: !form.is_active })}
                        className={`relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0 ${
                          form.is_active ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block mt-0.5 ml-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            form.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {form.is_active ? "Faol" : "Nofaol"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {form.is_active
                            ? "Xodimlarga tayinlanishi mumkin"
                            : "Bu rol hozircha ishlatilmaydi"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Permissions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Ruxsatlar</p>
                        <p className="text-xs text-gray-400">
                          Har bir modul uchun alohida ruxsatlarni belgilang
                        </p>
                      </div>
                    </div>
                    <PermissionMatrix
                      permissions={form.permissions}
                      onChange={(p) => setForm({ ...form, permissions: p })}
                    />
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white shrink-0">
                  {mode === "edit" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 h-10"
                    >
                      <Trash2 className="w-4 h-4" />
                      O&apos;chirish
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      className="h-10 px-4"
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 h-10 px-5"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {mode === "create" ? "Yaratish" : "Saqlash"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
