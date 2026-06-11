"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { branchApi } from "@/lib/api/branch";
import type {
  StaffPermissionItem,
  PermissionsData,
  PermissionModuleInfo,
  PermissionGroup,
} from "@/lib/api/branch";
import { toast } from "sonner";
import {
  Shield,
  Save,
  Loader2,
  Search,
  User,
  CheckSquare,
  Square,
  Users,
  Layers,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  CheckCheck,
  XCircle,
} from "lucide-react";
import { translateRole } from "@/lib/translations";

const ACTION_LABELS: Record<string, string> = {
  view: "Ko'rish",
  create: "Qo'shish",
  edit: "Tahrirlash",
  delete: "O'chirish",
};

const ROLE_COLORS: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-purple-100 text-purple-700",
  director: "bg-indigo-100 text-indigo-700",
  accountant: "bg-green-100 text-green-700",
};

// ── Permission Matrix ──────────────────────────────────────────────────────
interface PermissionMatrixProps {
  modules: Record<string, PermissionModuleInfo>;
  permissions: PermissionsData;
  readonly?: boolean;
  canManage?: boolean;
  onToggle?: (module: string, action: string) => void;
  onSetAll?: (value: boolean) => void;
  onSetModule?: (module: string, value: boolean) => void;
}

function PermissionMatrix({
  modules,
  permissions,
  readonly = false,
  canManage = true,
  onToggle,
  onSetAll,
  onSetModule,
}: PermissionMatrixProps) {
  const editable = canManage && !readonly;

  return (
    <div className="overflow-x-auto">
      {editable && onSetAll && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onSetAll(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Hammasiga ruxsat
          </button>
          <button
            onClick={() => onSetAll(false)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Hammasini rad etish
          </button>
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4 w-40">
              Modul
            </th>
            {["view", "create", "edit", "delete"].map((a) => (
              <th
                key={a}
                className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2.5 w-24"
              >
                {ACTION_LABELS[a]}
              </th>
            ))}
            {editable && onSetModule && (
              <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2.5 w-24">
                Barchasi
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Object.entries(modules).map(([module, meta]) => {
            const allGranted = meta.actions.every((a) => permissions[module]?.[a]);
            return (
              <tr key={module} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 pr-4">
                  <span className="text-sm font-medium text-gray-800">{meta.label}</span>
                </td>
                {["view", "create", "edit", "delete"].map((action) => {
                  const supported = meta.actions.includes(action);
                  const checked = supported && !!permissions[module]?.[action];
                  return (
                    <td key={action} className="py-2.5 text-center">
                      {supported ? (
                        <button
                          onClick={() => editable && onToggle?.(module, action)}
                          disabled={!editable}
                          className={`mx-auto flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                            checked
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                              : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                          } ${!editable ? "cursor-default opacity-80" : "cursor-pointer"}`}
                        >
                          {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      ) : (
                        <span className="text-gray-200 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
                {editable && onSetModule && (
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => onSetModule(module, !allGranted)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        allGranted
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {allGranted ? "Rad" : "Ruxsat"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Group Permission Summary ───────────────────────────────────────────────
function GroupPermSummary({
  permissions,
  modules,
}: {
  permissions: PermissionsData;
  modules: Record<string, PermissionModuleInfo>;
}) {
  const activeModules = Object.entries(modules).filter(([mod, meta]) =>
    meta.actions.some((a) => permissions[mod]?.[a])
  );
  if (activeModules.length === 0) {
    return <span className="text-xs text-gray-400 italic">Ruxsatlar belgilanmagan</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {activeModules.map(([mod, meta]) => (
        <span
          key={mod}
          className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-medium"
        >
          {meta.label}
        </span>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PermissionsPage() {
  const { currentBranch, isSuperAdmin, hasRole } = useAuth();

  // Shared data
  const [staff, setStaff] = useState<StaffPermissionItem[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [modules, setModules] = useState<Record<string, PermissionModuleInfo>>({});
  const [loading, setLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<"staff" | "groups">("staff");

  // Staff tab
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [localPerms, setLocalPerms] = useState<PermissionsData>({});
  const [permMode, setPermMode] = useState<"group" | "custom">("custom");
  const [assignedGroupId, setAssignedGroupId] = useState<string | null>(null);
  const [staffDirty, setStaffDirty] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Groups tab
  const [editingGroupId, setEditingGroupId] = useState<string | "__new__" | null>(null);
  const [groupForm, setGroupForm] = useState<{
    name: string;
    description: string;
    permissions: PermissionsData;
    applyToMembers: boolean;
  }>({ name: "", description: "", permissions: {}, applyToMembers: false });
  const [groupDirty, setGroupDirty] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const canManage =
    isSuperAdmin() || hasRole(["branch_admin", "admin", "manager", "director"]);

  // ── Data loading ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentBranch?.branch_id) return;
    try {
      setLoading(true);
      const data = await branchApi.getBranchPermissions(currentBranch.branch_id);
      setStaff(data.staff);
      setGroups(data.groups ?? []);
      setModules(data.available_modules);
      if (data.staff.length > 0) {
        const first = data.staff[0];
        setSelectedStaffId(first.membership_id);
        setLocalPerms(first.permissions ?? {});
        setPermMode(first.permission_group_id ? "group" : "custom");
        setAssignedGroupId(first.permission_group_id);
      }
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [currentBranch?.branch_id]);

  useEffect(() => {
    loadData();
  }, [currentBranch?.branch_id]);

  // ── Staff helpers ─────────────────────────────────────────────────────
  const selectedStaff = staff.find((s) => s.membership_id === selectedStaffId);
  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (s) =>
          s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
          s.phone_number.includes(staffSearch)
      ),
    [staff, staffSearch]
  );

  const selectStaff = (item: StaffPermissionItem) => {
    if (staffDirty && !confirm("Saqlanmagan o'zgarishlar yo'qotiladi. Davom etasizmi?")) return;
    setSelectedStaffId(item.membership_id);
    setLocalPerms(item.permissions ?? {});
    setPermMode(item.permission_group_id ? "group" : "custom");
    setAssignedGroupId(item.permission_group_id);
    setStaffDirty(false);
  };

  const assignGroup = (groupId: string | null) => {
    if (!canManage) return;
    if (groupId) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        setAssignedGroupId(groupId);
        setPermMode("group");
        setLocalPerms(group.permissions ?? {});
        setStaffDirty(true);
      }
    } else {
      setAssignedGroupId(null);
      setPermMode("custom");
      setStaffDirty(true);
    }
  };

  const switchToCustom = () => {
    setPermMode("custom");
    setAssignedGroupId(null);
    setStaffDirty(true);
  };

  const togglePermission = (module: string, action: string) => {
    if (!canManage || permMode === "group") return;
    setLocalPerms((prev) => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] },
    }));
    setStaffDirty(true);
  };

  const setAllPerms = (value: boolean) => {
    if (!canManage || permMode === "group") return;
    const all: PermissionsData = {};
    for (const [mod, meta] of Object.entries(modules)) {
      all[mod] = Object.fromEntries(meta.actions.map((a) => [a, value]));
    }
    setLocalPerms(all);
    setStaffDirty(true);
  };

  const setModulePerms = (module: string, value: boolean) => {
    if (!canManage || permMode === "group") return;
    const actions = modules[module]?.actions ?? [];
    setLocalPerms((prev) => ({
      ...prev,
      [module]: Object.fromEntries(actions.map((a) => [a, value])),
    }));
    setStaffDirty(true);
  };

  const cancelStaff = () => {
    if (!selectedStaff) return;
    setLocalPerms(selectedStaff.permissions ?? {});
    setPermMode(selectedStaff.permission_group_id ? "group" : "custom");
    setAssignedGroupId(selectedStaff.permission_group_id);
    setStaffDirty(false);
  };

  const handleSaveStaff = async () => {
    if (!currentBranch?.branch_id || !selectedStaffId) return;
    try {
      setSaving(true);
      let result;
      if (permMode === "group" && assignedGroupId) {
        result = await branchApi.applyPermissionGroup(
          currentBranch.branch_id,
          selectedStaffId,
          assignedGroupId
        );
      } else {
        result = await branchApi.updateMembershipPermissions(
          currentBranch.branch_id,
          selectedStaffId,
          localPerms
        );
      }
      setStaff((prev) =>
        prev.map((s) =>
          s.membership_id === selectedStaffId
            ? {
                ...s,
                permissions: result.permissions,
                permission_group_id: result.permission_group_id,
                permission_group_name: result.permission_group_name,
              }
            : s
        )
      );
      setStaffDirty(false);
      toast.success("Ruxsatlar saqlandi");
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  // ── Groups helpers ────────────────────────────────────────────────────
  const startNewGroup = () => {
    setGroupForm({ name: "", description: "", permissions: {}, applyToMembers: false });
    setEditingGroupId("__new__");
    setGroupDirty(false);
  };

  const startEditGroup = (group: PermissionGroup) => {
    setGroupForm({
      name: group.name,
      description: group.description,
      permissions: group.permissions ?? {},
      applyToMembers: false,
    });
    setEditingGroupId(group.id);
    setGroupDirty(false);
  };

  const cancelGroup = () => {
    setEditingGroupId(null);
    setGroupDirty(false);
  };

  const updateGroupFormPerms = (perms: PermissionsData) => {
    setGroupForm((prev) => ({ ...prev, permissions: perms }));
    setGroupDirty(true);
  };

  const toggleGroupPerm = (module: string, action: string) => {
    const prev = groupForm.permissions;
    updateGroupFormPerms({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] },
    });
  };

  const setAllGroupPerms = (value: boolean) => {
    const all: PermissionsData = {};
    for (const [mod, meta] of Object.entries(modules)) {
      all[mod] = Object.fromEntries(meta.actions.map((a) => [a, value]));
    }
    updateGroupFormPerms(all);
  };

  const setModuleGroupPerms = (module: string, value: boolean) => {
    const actions = modules[module]?.actions ?? [];
    updateGroupFormPerms({
      ...groupForm.permissions,
      [module]: Object.fromEntries(actions.map((a) => [a, value])),
    });
  };

  const handleSaveGroup = async () => {
    if (!currentBranch?.branch_id) return;
    const name = groupForm.name.trim();
    if (!name) {
      toast.error("Guruh nomi kiritilishi shart");
      return;
    }
    try {
      setSavingGroup(true);
      if (editingGroupId === "__new__") {
        const created = await branchApi.createPermissionGroup(currentBranch.branch_id, {
          name,
          description: groupForm.description,
          permissions: groupForm.permissions,
        });
        setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success(`"${created.name}" guruhi yaratildi`);
      } else if (editingGroupId) {
        const updated = await branchApi.updatePermissionGroup(
          currentBranch.branch_id,
          editingGroupId,
          {
            name,
            description: groupForm.description,
            permissions: groupForm.permissions,
            apply_to_members: groupForm.applyToMembers,
          }
        );
        setGroups((prev) =>
          prev.map((g) => (g.id === editingGroupId ? { ...g, ...updated } : g))
        );
        if (groupForm.applyToMembers) {
          // Refresh staff to reflect updated permissions
          await loadData();
        }
        toast.success(`"${updated.name}" guruhi yangilandi`);
      }
      setEditingGroupId(null);
      setGroupDirty(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Saqlashda xatolik");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentBranch?.branch_id) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (!confirm(`"${group.name}" guruhini o'chirmoqchimisiz? Xodimlardagi guruh belgilash tozalanadi.`)) return;
    try {
      setDeletingGroupId(groupId);
      await branchApi.deletePermissionGroup(currentBranch.branch_id, groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setStaff((prev) =>
        prev.map((s) =>
          s.permission_group_id === groupId
            ? { ...s, permission_group_id: null, permission_group_name: null }
            : s
        )
      );
      if (editingGroupId === groupId) setEditingGroupId(null);
      toast.success(`"${group.name}" guruhi o'chirildi`);
    } catch {
      toast.error("O'chirishda xatolik");
    } finally {
      setDeletingGroupId(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ruxsatlar boshqaruvi</h1>
          <p className="text-sm text-gray-500">Xodimlar uchun kirish huquqlarini sozlang</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "staff"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          Xodimlar
          {staff.length > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 leading-none">
              {staff.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "groups"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          Guruhlar
          {groups.length > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 leading-none">
              {groups.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-230px)] min-h-[500px]">
        {activeTab === "staff" ? (
          <StaffTab
            staff={staff}
            filteredStaff={filteredStaff}
            staffSearch={staffSearch}
            setStaffSearch={setStaffSearch}
            selectedStaffId={selectedStaffId}
            selectedStaff={selectedStaff}
            localPerms={localPerms}
            permMode={permMode}
            assignedGroupId={assignedGroupId}
            staffDirty={staffDirty}
            saving={saving}
            canManage={canManage}
            modules={modules}
            groups={groups}
            onSelectStaff={selectStaff}
            onTogglePermission={togglePermission}
            onSetAll={setAllPerms}
            onSetModule={setModulePerms}
            onAssignGroup={assignGroup}
            onSwitchToCustom={switchToCustom}
            onSave={handleSaveStaff}
            onCancel={cancelStaff}
          />
        ) : (
          <GroupsTab
            groups={groups}
            modules={modules}
            canManage={canManage}
            editingGroupId={editingGroupId}
            groupForm={groupForm}
            groupDirty={groupDirty}
            savingGroup={savingGroup}
            deletingGroupId={deletingGroupId}
            onStartNew={startNewGroup}
            onStartEdit={startEditGroup}
            onDelete={handleDeleteGroup}
            onCancel={cancelGroup}
            onFormChange={(field, value) => {
              setGroupForm((prev) => ({ ...prev, [field]: value }));
              setGroupDirty(true);
            }}
            onTogglePerm={toggleGroupPerm}
            onSetAll={setAllGroupPerms}
            onSetModule={setModuleGroupPerms}
            onSave={handleSaveGroup}
          />
        )}
      </div>
    </div>
  );
}

// ── Staff Tab ──────────────────────────────────────────────────────────────
interface StaffTabProps {
  staff: StaffPermissionItem[];
  filteredStaff: StaffPermissionItem[];
  staffSearch: string;
  setStaffSearch: (v: string) => void;
  selectedStaffId: string | null;
  selectedStaff: StaffPermissionItem | undefined;
  localPerms: PermissionsData;
  permMode: "group" | "custom";
  assignedGroupId: string | null;
  staffDirty: boolean;
  saving: boolean;
  canManage: boolean;
  modules: Record<string, PermissionModuleInfo>;
  groups: PermissionGroup[];
  onSelectStaff: (item: StaffPermissionItem) => void;
  onTogglePermission: (module: string, action: string) => void;
  onSetAll: (value: boolean) => void;
  onSetModule: (module: string, value: boolean) => void;
  onAssignGroup: (groupId: string | null) => void;
  onSwitchToCustom: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function StaffTab({
  staff,
  filteredStaff,
  staffSearch,
  setStaffSearch,
  selectedStaffId,
  selectedStaff,
  localPerms,
  permMode,
  assignedGroupId,
  staffDirty,
  saving,
  canManage,
  modules,
  groups,
  onSelectStaff,
  onTogglePermission,
  onSetAll,
  onSetModule,
  onAssignGroup,
  onSwitchToCustom,
  onSave,
  onCancel,
}: StaffTabProps) {
  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Users className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-medium">Xodimlar topilmadi</p>
        <p className="text-sm mt-1">Filialni xodimlar bo'limidan xodimlar qo'shing</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Left — Staff list */}
      <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Xodim qidirish..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredStaff.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Topilmadi</p>
          ) : (
            filteredStaff.map((item) => {
              const isSelected = item.membership_id === selectedStaffId;
              const hasGroup = !!item.permission_group_id;
              return (
                <button
                  key={item.membership_id}
                  onClick={() => onSelectStaff(item)}
                  className={`w-full text-left px-3 py-3 flex items-start gap-2.5 border-b border-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.full_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                          ROLE_COLORS[item.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {translateRole(item.role as any)}
                      </span>
                      {hasGroup && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-medium truncate max-w-[80px]">
                          {item.permission_group_name}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right — Permission editor */}
      {selectedStaff ? (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-w-0">
          {/* Staff header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{selectedStaff.full_name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {translateRole(selectedStaff.role as any)}
                  {selectedStaff.title ? ` · ${selectedStaff.title}` : ""}
                  {" · "}
                  {selectedStaff.phone_number}
                </p>
              </div>

              {/* Group selector */}
              {canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col gap-1 items-end">
                    <label className="text-xs text-gray-400 font-medium">Ruxsatlar guruhi</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={assignedGroupId ?? ""}
                          onChange={(e) => onAssignGroup(e.target.value || null)}
                          className="text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none text-gray-800 cursor-pointer"
                        >
                          <option value="">Guruhsiz (shaxsiy)</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {permMode === "group" && (
                        <button
                          onClick={onSwitchToCustom}
                          className="text-xs px-2.5 py-1.5 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                        >
                          Shaxsiy qilish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mode badge */}
            {permMode === "group" && assignedGroupId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <Layers className="w-3.5 h-3.5" />
                  Guruhdan: <strong>{groups.find((g) => g.id === assignedGroupId)?.name}</strong>
                </span>
                <span className="text-xs text-gray-400">
                  Tahrirlash uchun "Shaxsiy qilish" tugmasini bosing
                </span>
              </div>
            )}
          </div>

          {/* Permission matrix */}
          <div className="overflow-y-auto flex-1 p-5">
            <PermissionMatrix
              modules={modules}
              permissions={localPerms}
              readonly={permMode === "group"}
              canManage={canManage}
              onToggle={onTogglePermission}
              onSetAll={permMode === "custom" ? onSetAll : undefined}
              onSetModule={permMode === "custom" ? onSetModule : undefined}
            />
          </div>

          {/* Footer */}
          {canManage && staffDirty && (
            <div className="px-5 py-3 border-t border-amber-100 bg-amber-50 flex items-center justify-between">
              <p className="text-sm text-amber-700 font-medium">Saqlanmagan o'zgarishlar</p>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="text-sm px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Saqlash
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Xodimni tanlang</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Groups Tab ─────────────────────────────────────────────────────────────
interface GroupsTabProps {
  groups: PermissionGroup[];
  modules: Record<string, PermissionModuleInfo>;
  canManage: boolean;
  editingGroupId: string | "__new__" | null;
  groupForm: { name: string; description: string; permissions: PermissionsData; applyToMembers: boolean };
  groupDirty: boolean;
  savingGroup: boolean;
  deletingGroupId: string | null;
  onStartNew: () => void;
  onStartEdit: (group: PermissionGroup) => void;
  onDelete: (groupId: string) => void;
  onCancel: () => void;
  onFormChange: (field: string, value: any) => void;
  onTogglePerm: (module: string, action: string) => void;
  onSetAll: (value: boolean) => void;
  onSetModule: (module: string, value: boolean) => void;
  onSave: () => void;
}

function GroupsTab({
  groups,
  modules,
  canManage,
  editingGroupId,
  groupForm,
  groupDirty,
  savingGroup,
  deletingGroupId,
  onStartNew,
  onStartEdit,
  onDelete,
  onCancel,
  onFormChange,
  onTogglePerm,
  onSetAll,
  onSetModule,
  onSave,
}: GroupsTabProps) {
  const isEditing = editingGroupId !== null;
  const isNew = editingGroupId === "__new__";

  return (
    <div className="flex gap-4 h-full">
      {/* Left — Group list */}
      <div
        className={`${
          isEditing ? "w-72 shrink-0" : "flex-1"
        } bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">
            {groups.length > 0 ? `${groups.length} ta guruh` : "Guruhlar"}
          </span>
          {canManage && (
            <button
              onClick={onStartNew}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Yangi guruh
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-3">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
              <Layers className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Guruhlar yo'q</p>
              {canManage && (
                <p className="text-xs mt-1 text-center px-6">
                  "Yangi guruh" tugmasi bilan xodimlar uchun ruxsatlar shabloni yarating
                </p>
              )}
            </div>
          ) : isEditing ? (
            // Compact list when editor is open
            <div className="space-y-1">
              {groups.map((group) => {
                const isActive = editingGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => onStartEdit(group)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                      isActive ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                      <p className="text-xs text-gray-400">{group.member_count} xodim</p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />}
                  </button>
                );
              })}
              {isNew && (
                <div className="px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-700">Yangi guruh</p>
                  <p className="text-xs text-indigo-400">Saqlanmagan</p>
                </div>
              )}
            </div>
          ) : (
            // Full card grid when not editing
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const activeCount = Object.values(group.permissions ?? {}).reduce(
                  (n, actions) => n + Object.values(actions).filter(Boolean).length,
                  0
                );
                const totalCount = Object.values(modules).reduce(
                  (n, meta) => n + meta.actions.length,
                  0
                );
                return (
                  <div
                    key={group.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <Layers className="w-4.5 h-4.5 text-indigo-600" style={{ width: 18, height: 18 }} />
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => onStartEdit(group)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(group.id)}
                            disabled={deletingGroupId === group.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="O'chirish"
                          >
                            {deletingGroupId === group.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{group.name}</h3>
                    {group.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{group.description}</p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-400">
                        {group.member_count} xodim
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {activeCount}/{totalCount} ruxsat
                      </span>
                    </div>

                    {/* Permission modules summary */}
                    <GroupPermSummary permissions={group.permissions ?? {}} modules={modules} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right — Group editor */}
      {isEditing && (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-w-0">
          {/* Editor header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {isNew ? "Yangi guruh yaratish" : "Guruhni tahrirlash"}
            </h2>
            <button
              onClick={onCancel}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* Name & Description */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Guruh nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => onFormChange("name", e.target.value)}
                  placeholder="Masalan: O'qituvchilar guruhi"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tavsif
                </label>
                <input
                  type="text"
                  value={groupForm.description}
                  onChange={(e) => onFormChange("description", e.target.value)}
                  placeholder="Ixtiyoriy tavsif..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-100 pt-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Ruxsatlar matritsasi
              </p>
              <PermissionMatrix
                modules={modules}
                permissions={groupForm.permissions}
                readonly={false}
                canManage={true}
                onToggle={onTogglePerm}
                onSetAll={onSetAll}
                onSetModule={onSetModule}
              />
            </div>

            {/* Apply to members checkbox (only when editing existing) */}
            {!isNew && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <input
                  type="checkbox"
                  id="applyToMembers"
                  checked={groupForm.applyToMembers}
                  onChange={(e) => onFormChange("applyToMembers", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="applyToMembers" className="text-sm text-amber-800 cursor-pointer">
                  <span className="font-medium">Barcha guruh xodimlariga ham qo'llash</span>
                  <span className="block text-xs text-amber-600 mt-0.5">
                    Bu guruhga biriktirilgan xodimlarning ruxsatlari ham yangilanadi
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="text-sm px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={onSave}
              disabled={savingGroup || !groupForm.name.trim()}
              className="flex items-center gap-1.5 text-sm px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {savingGroup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isNew ? "Guruh yaratish" : "Saqlash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
