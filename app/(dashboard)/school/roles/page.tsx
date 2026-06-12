"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { staffApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Role, StaffMember, CreateRoleRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Edit, Trash2, Shield, Search, Users, Check,
  ChevronRight, UserCircle, Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

type PermsData = Record<string, Record<string, boolean>>;

const MODULES: Array<{ key: string; label: string; actions: string[] }> = [
  { key: "students",   label: "O'quvchilar",  actions: ["view","create","edit","delete"] },
  { key: "finance",    label: "Moliya",        actions: ["view","create","edit","delete"] },
  { key: "staff",      label: "Xodimlar",      actions: ["view","create","edit","delete"] },
  { key: "schedule",   label: "Dars jadvali",  actions: ["view","create","edit","delete"] },
  { key: "classes",    label: "Sinflar",       actions: ["view","create","edit","delete"] },
  { key: "grades",     label: "Baholar",       actions: ["view","create","edit","delete"] },
  { key: "attendance", label: "Davomat",       actions: ["view","create","edit","delete"] },
  { key: "homework",   label: "Uyga vazifa",   actions: ["view","create","edit","delete"] },
  { key: "reports",    label: "Hisobotlar",    actions: ["view"] },
  { key: "settings",   label: "Sozlamalar",    actions: ["view","edit"] },
];

const ACTION_LABEL: Record<string, string> = {
  view: "Ko'rish", create: "Yaratish", edit: "Tahrirlash", delete: "O'chirish",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function enabledModuleCount(perms: PermsData) {
  return MODULES.filter(({ key, actions }) =>
    actions.some((a) => perms[key]?.[a])
  ).length;
}

function emptyForm() {
  return { name: "", description: "", is_active: true, permissions: {} as PermsData };
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Clickable toggle chip used in the permission table */
function ActionChip({
  checked, label, onClick, readOnly,
}: { checked: boolean; label: string; onClick?: () => void; readOnly?: boolean }) {
  const base = "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all select-none";
  if (readOnly) {
    return (
      <span className={cn(base, checked
        ? "bg-blue-50 text-blue-700 border border-blue-200"
        : "bg-slate-50 text-slate-300 border border-slate-100"
      )}>
        {checked && <Check className="w-3 h-3 shrink-0" />}
        {label}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(base, "cursor-pointer",
      checked
        ? "bg-blue-600 text-white shadow-sm"
        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
    )}>
      {checked && <Check className="w-3 h-3 shrink-0" />}
      {label}
    </button>
  );
}

/** Permission table — read-only or editable */
function PermissionsTable({
  permissions, onChange,
}: {
  permissions: PermsData;
  onChange?: (p: PermsData) => void;
}) {
  const readOnly = !onChange;

  const toggle = (module: string, action: string) => {
    if (!onChange) return;
    const cur = permissions[module] ?? {};
    onChange({ ...permissions, [module]: { ...cur, [action]: !cur[action] } });
  };

  const toggleRow = (module: string, actions: string[]) => {
    if (!onChange) return;
    const allOn = actions.every((a) => permissions[module]?.[a]);
    onChange({ ...permissions, [module]: Object.fromEntries(actions.map((a) => [a, !allOn])) });
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 text-left w-[160px]">Modul</th>
            {["view","create","edit","delete"].map((a) => (
              <th key={a} className="py-2.5 px-3 text-xs font-semibold text-slate-400 text-center">
                {ACTION_LABEL[a]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {MODULES.map(({ key, label, actions }) => {
            const allOn = actions.every((a) => permissions[key]?.[a]);
            const someOn = actions.some((a) => permissions[key]?.[a]);
            return (
              <tr key={key} className="group">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => toggleRow(key, actions)}
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                          allOn ? "bg-blue-600 border-blue-600"
                            : someOn ? "bg-blue-100 border-blue-400"
                              : "bg-white border-slate-300 hover:border-slate-400"
                        )}
                      >
                        {allOn && <Check className="w-2.5 h-2.5 text-white" />}
                        {someOn && !allOn && <span className="w-2 h-0.5 bg-blue-500 block rounded" />}
                      </button>
                    )}
                    <span className={cn("text-sm font-medium", someOn ? "text-slate-800" : "text-slate-400")}>
                      {label}
                    </span>
                  </div>
                </td>
                {["view","create","edit","delete"].map((action) => {
                  const enabled = action === "edit" && !actions.includes("edit")
                    ? undefined  // this module doesn't have this action
                    : action === "delete" && !actions.includes("delete")
                      ? undefined
                      : action === "create" && !actions.includes("create")
                        ? undefined
                        : !!permissions[key]?.[action];

                  if (!actions.includes(action)) {
                    return <td key={action} className="py-2.5 px-3 text-center"><span className="text-slate-200">—</span></td>;
                  }

                  return (
                    <td key={action} className="py-2.5 px-3 text-center">
                      {readOnly ? (
                        <span className={cn(
                          "inline-block w-5 h-5 rounded-full mx-auto",
                          enabled ? "bg-blue-100 ring-1 ring-blue-300" : "bg-slate-100"
                        )}>
                          {enabled && <Check className="w-3 h-3 text-blue-600 m-1" />}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggle(key, action)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-colors",
                            enabled ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300 hover:border-blue-400"
                          )}
                        >
                          {enabled && <Check className="w-3 h-3 text-white" />}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Role card in the left panel */
function RoleCard({
  role, selected, onClick,
}: { role: Role; selected: boolean; onClick: () => void }) {
  const modCount = enabledModuleCount((role.permissions as unknown as PermsData) ?? {});
  const membersCount = (role as any).members_count ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl px-3.5 py-3 border transition-all",
        selected
          ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-600/20"
          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          selected ? "bg-white/20" : "bg-blue-50"
        )}>
          <Shield className={cn("w-4 h-4", selected ? "text-white" : "text-blue-500")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold truncate", selected ? "text-white" : "text-slate-800")}>
            {role.name}
          </p>
          <p className={cn("text-xs mt-0.5", selected ? "text-blue-200" : "text-slate-400")}>
            {modCount > 0 ? `${modCount} ta modul` : "Ruxsat yo'q"}
            {membersCount > 0 && ` · ${membersCount} ta xodim`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            role.is_active
              ? selected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
              : selected ? "bg-white/10 text-blue-200" : "bg-slate-100 text-slate-400"
          )}>
            {role.is_active ? "Faol" : "Nofaol"}
          </span>
          <ChevronRight className={cn("w-3.5 h-3.5", selected ? "text-white/60" : "text-slate-300")} />
        </div>
      </div>
    </button>
  );
}

/** Role form dialog — create or edit */
function RoleFormDialog({
  open, mode, form, setForm, onClose, onSubmit, isSaving,
}: {
  open: boolean;
  mode: "create" | "edit";
  form: ReturnType<typeof emptyForm>;
  setForm: (f: ReturnType<typeof emptyForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSaving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-base font-bold">
            {mode === "create" ? "Yangi rol yaratish" : "Rolni tahrirlash"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Rol nomi <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Masalan: Marketing menejeri"
                className="h-10"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Holat</Label>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={cn(
                  "w-full h-10 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2.5 px-3",
                  form.is_active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  form.is_active ? "bg-emerald-500" : "bg-slate-300"
                )} />
                {form.is_active ? "Faol" : "Nofaol"}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tavsif</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Bu rol haqida qisqacha ma'lumot..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-sm font-semibold text-slate-800">Ruxsatlar</p>
              <span className="text-xs text-slate-400">
                — {enabledModuleCount(form.permissions)} ta modul faol
              </span>
            </div>
            <PermissionsTable
              permissions={form.permissions}
              onChange={(p) => setForm({ ...form, permissions: p })}
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0">
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button
            onClick={onSubmit}
            disabled={!form.name.trim() || isSaving}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {mode === "create" ? "Yaratish" : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Member card in the Xodimlar tab */
function MemberCard({ member }: { member: StaffMember }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <UserCircle className="w-5 h-5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{member.full_name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{member.phone_number}</p>
      </div>
      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
        {member.role_display}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id ?? "";

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"permissions" | "members">("permissions");
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", branchId],
    queryFn: () => staffApi.getRoles(branchId),
    enabled: !!branchId,
  });

  const selectedRole = roles.find((r) => r.id === selectedId) ?? null;

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["role-members", selectedId, branchId],
    queryFn: () => staffApi.getStaff({ branch: branchId, role_ref: selectedId! }),
    enabled: !!selectedId && activeTab === "members",
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const handleError = (err: unknown) => {
    const errors = (err as any)?.response?.data;
    if (errors && typeof errors === "object") {
      Object.values(errors).flat().forEach((m) => toast.error(String(m)));
    } else {
      toast.error("Xatolik yuz berdi");
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => staffApi.createRole(branchId, data),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      toast.success("Rol yaratildi");
      setDialog(null);
      setSelectedId(newRole.id);
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleRequest> }) =>
      staffApi.updateRole(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      toast.success("Rol yangilandi");
      setDialog(null);
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.deleteRole(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", branchId] });
      toast.success("Rol o'chirildi");
      setDeleteId(null);
      setSelectedId(null);
    },
    onError: handleError,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(emptyForm());
    setDialog("create");
  };

  const openEdit = () => {
    if (!selectedRole) return;
    setForm({
      name: selectedRole.name,
      description: (selectedRole as any).description ?? "",
      is_active: selectedRole.is_active,
      permissions: (selectedRole.permissions as unknown as PermsData) ?? {},
    });
    setDialog("edit");
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const payload: CreateRoleRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      is_active: form.is_active,
      permissions: form.permissions,
      branch: branchId,
    };
    if (dialog === "create") createMutation.mutate(payload);
    else if (dialog === "edit" && selectedId) updateMutation.mutate({ id: selectedId, data: payload });
  };

  const filtered = useMemo(
    () => roles.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      ((r as any).description ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [roles, search]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedPerms = (selectedRole?.permissions as unknown as PermsData) ?? {};

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4 h-full">

      {/* ── LEFT PANEL ────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-3 h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">Rollar</h1>
            <p className="text-xs text-slate-400 mt-0.5">{roles.length} ta rol</p>
          </div>
          <Button onClick={openCreate} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9">
            <Plus className="w-3.5 h-3.5" />
            Yangi
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            className="pl-9 h-9 text-sm rounded-xl border-slate-200"
            placeholder="Rol qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {search ? "Topilmadi" : "Rollar yo'q"}
              </p>
              {!search && (
                <button onClick={openCreate} className="text-xs text-blue-500 hover:underline mt-1">
                  Birinchi rolni yarating
                </button>
              )}
            </div>
          ) : (
            filtered.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                selected={selectedId === role.id}
                onClick={() => { setSelectedId(role.id); setActiveTab("permissions"); }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {!selectedRole ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-base font-semibold text-slate-700 mb-1">Rol tanlang</p>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Chap paneldan rolni bosing yoki yangi rol yarating
            </p>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 gap-2 h-10">
              <Plus className="w-4 h-4" />
              Yangi rol yaratish
            </Button>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedRole.name}</h2>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        selectedRole.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {selectedRole.is_active ? "Faol" : "Nofaol"}
                      </span>
                    </div>
                    {(selectedRole as any).description && (
                      <p className="text-xs text-slate-400 mt-0.5">{(selectedRole as any).description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={openEdit}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 border-slate-200"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Tahrirlash
                  </Button>
                  <Button
                    onClick={() => setDeleteId(selectedRole.id)}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {([
                  { key: "permissions", label: "Ruxsatlar", icon: Shield },
                  { key: "members",     label: "Xodimlar",  icon: Users },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                      activeTab === key
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "permissions" && (
                <div className="p-6">
                  {enabledModuleCount(selectedPerms) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <Shield className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Ruxsatlar belgilanmagan</p>
                      <p className="text-xs text-slate-400">Bu rol hech qanday modulga kirish huquqiga ega emas</p>
                      <Button onClick={openEdit} variant="outline" size="sm" className="mt-4 gap-1.5">
                        <Edit className="w-3.5 h-3.5" />
                        Ruxsatlarni belgilash
                      </Button>
                    </div>
                  ) : (
                    <PermissionsTable permissions={selectedPerms} />
                  )}
                </div>
              )}

              {activeTab === "members" && (
                <div>
                  {membersLoading ? (
                    <div className="p-4 space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Xodimlar yo'q</p>
                      <p className="text-xs text-slate-400">Bu rolga hali hech kim biriktirilmagan</p>
                    </div>
                  ) : (
                    <div>
                      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">{members.length} ta xodim</span>
                      </div>
                      {members.map((m) => <MemberCard key={m.id} member={m} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── DIALOGS ───────────────────────────────────────────────────── */}
      <RoleFormDialog
        open={!!dialog}
        mode={dialog ?? "create"}
        form={form}
        setForm={setForm}
        onClose={() => setDialog(null)}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">&quot;{selectedRole?.name}&quot;</span> rolini o&apos;chirishni
              tasdiqlaysizmi? Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : "O'chirish"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
