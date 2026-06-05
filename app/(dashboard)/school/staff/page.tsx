"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { staffApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StaffMember,
  CreateStaffRequest,
  UpdateStaffRequest,
  EMPLOYMENT_TYPE_LABELS,
} from "@/types/staff";
import type { EmploymentType } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Plus,
  Edit,
  Search,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserCheck,
  Eye,
  EyeOff,
  Info,
  Archive,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { extractApiError } from "@/lib/error-messages";
import { StaffTransactionSheet } from "@/components/staff/StaffTransactionSheet";

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES = [
  { value: "teacher", label: "O'qituvchi", color: "bg-blue-500" },
  { value: "branch_admin", label: "Filial admini", color: "bg-purple-500" },
  { value: "other", label: "Boshqa", color: "bg-slate-400" },
];

const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;
const roleColor = (r: string) => ROLES.find((x) => x.value === r)?.color ?? "bg-slate-400";

// ── FieldLabel ────────────────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
  tip,
}: {
  label: string;
  required?: boolean;
  tip: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3 h-3 text-gray-300 cursor-help hover:text-gray-400 transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ── PhoneInput ────────────────────────────────────────────────────────────────

function formatPhoneDigits(d: string) {
  const s = d.slice(0, 9);
  if (s.length <= 2) return s;
  if (s.length <= 5) return `${s.slice(0, 2)} ${s.slice(2)}`;
  if (s.length <= 7) return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5)}`;
  return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5, 7)} ${s.slice(7)}`;
}

function PhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const prefix = "+998";
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange(prefix + digits);
  };

  return (
    <div className="flex h-9 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
      <span className="flex items-center px-3 text-gray-600 font-medium border-r border-input bg-muted/50 select-none shrink-0">
        +998
      </span>
      <input
        value={formatPhoneDigits(raw)}
        onChange={handleChange}
        placeholder="90 123 45 67"
        inputMode="numeric"
        className="flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ── SalaryInput ───────────────────────────────────────────────────────────────

function formatSalary(n: number | undefined) {
  if (!n) return "";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function SalaryInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (val: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const cursorPos = el.selectionStart ?? 0;
    const oldVal = el.value;

    const digitsBeforeCursor = oldVal.slice(0, cursorPos).replace(/\D/g, "").length;
    const rawDigits = el.value.replace(/\D/g, "");
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    onChange(num);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const newFormatted = formatSalary(num);
      let digitCount = 0;
      let newPos = newFormatted.length;
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) digitCount++;
        if (digitCount === digitsBeforeCursor) { newPos = i + 1; break; }
      }
      inputRef.current.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={formatSalary(value)}
        onChange={handleChange}
        placeholder="5 000 000"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pr-14 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">
        so&apos;m
      </span>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";
  return (
    <div
      className={`w-9 h-9 rounded-full ${roleColor(role)} flex items-center justify-center text-white text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "active" | "archived";

export default function StaffPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id ?? "";

  // ── Tab & Filters ──────────────────────────────────────────────────────────
  const [tab, setTab] = React.useState<Tab>("active");
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const debouncedSearch = useDebounce(search, 400);

  // ── Balance visibility ─────────────────────────────────────────────────────
  const [showBalances, setShowBalances] = React.useState(false);

  // ── Sheet: create / edit ───────────────────────────────────────────────────
  const [editSheet, setEditSheet] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: StaffMember;
  }>({ open: false, mode: "create" });

  // ── Sheet: staff transaction ───────────────────────────────────────────────
  const [txSheet, setTxSheet] = React.useState<{
    open: boolean;
    staff?: StaffMember;
  }>({ open: false });

  // ── Form ───────────────────────────────────────────────────────────────────
  const [form, setForm] = React.useState<Partial<CreateStaffRequest & UpdateStaffRequest>>({
    role: "teacher",
    employment_type: "full_time",
    salary_type: "monthly",
    monthly_salary: 0,
  });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: rolesData = [] } = useQuery({
    queryKey: ["roles", branchId],
    queryFn: () => staffApi.getRoles(branchId),
    enabled: !!branchId,
  });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff", branchId, debouncedSearch, roleFilter, tab],
    queryFn: () =>
      staffApi.getStaff({
        branch: branchId,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        status: tab === "active" ? "active" : "terminated",
      }),
    enabled: !!branchId,
  });

  const { data: stats } = useQuery({
    queryKey: ["staff-stats", branchId],
    queryFn: () => staffApi.getStaffStats({ branch: branchId }),
    enabled: !!branchId,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d: CreateStaffRequest) => staffApi.createStaff(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setEditSheet({ open: false, mode: "create" });
      toast.success("Xodim muvaffaqiyatli qo'shildi");
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffRequest }) =>
      staffApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      setEditSheet({ open: false, mode: "create" });
      toast.success("Xodim yangilandi");
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => staffApi.reactivateStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] });
      toast.success("Xodim qayta faollashtirildi");
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({
      role: "teacher",
      employment_type: "full_time",
      salary_type: "monthly",
      monthly_salary: 0,
      phone_number: "+998",
    });
    setEditSheet({ open: true, mode: "create" });
  };

  const openEdit = (m: StaffMember) => {
    setForm({
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email ?? "",
      role: m.role,
      role_ref_id: m.role_ref_id,
      employment_type: m.employment_type ?? "full_time",
      monthly_salary: m.monthly_salary,
      title: m.title ?? "",
    });
    setEditSheet({ open: true, mode: "edit", data: m });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editSheet.mode === "create") {
      if (!form.first_name || !form.last_name) {
        toast.error("Ism va familiyani kiriting");
        return;
      }
      const phone = form.phone_number ?? "";
      if (phone.length < 13) {
        toast.error("Telefon raqamni to'liq kiriting: +998 XX XXX XX XX");
        return;
      }
      if (form.role === "other" && !form.role_ref_id) {
        toast.error('"Boshqa xodim" uchun maxsus rol tanlang');
        return;
      }
      createMutation.mutate({
        phone_number: form.phone_number!,
        first_name: form.first_name!,
        last_name: form.last_name!,
        email: form.email,
        password: form.password,
        branch_id: branchId,
        role: form.role!,
        role_ref_id: form.role_ref_id,
        title: form.title,
        monthly_salary: form.monthly_salary ?? 0,
        salary_type: form.salary_type ?? "monthly",
        hire_date: form.hire_date,
        employment_type: form.employment_type,
        passport_serial: form.passport_serial,
        passport_number: form.passport_number,
        address: form.address,
        emergency_contact: form.emergency_contact,
      });
    } else if (editSheet.data) {
      updateMutation.mutate({
        id: editSheet.data.id,
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          email: form.email,
          role: form.role,
          role_ref_id: form.role_ref_id,
          title: form.title,
          employment_type: form.employment_type,
          monthly_salary: form.monthly_salary,
          salary_type: form.salary_type,
          passport_serial: form.passport_serial,
          passport_number: form.passport_number,
          address: form.address,
          emergency_contact: form.emergency_contact,
        },
      });
    }
  };

  const handleReactivate = (m: StaffMember, e: React.MouseEvent) => {
    e.stopPropagation();
    reactivateMutation.mutate(m.id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Stats helpers ──────────────────────────────────────────────────────────
  const statItems = stats
    ? [
        {
          icon: Users,
          color: "text-blue-600 bg-blue-50",
          value: stats.total_staff,
          label: "Jami xodim",
          fmt: false,
        },
        {
          icon: UserCheck,
          color: "text-emerald-600 bg-emerald-50",
          value: stats.active_staff,
          label: "Faol",
          fmt: false,
        },
        {
          icon: DollarSign,
          color: "text-amber-600 bg-amber-50",
          value: stats.total_salary_budget,
          label: "Maosh byudjeti",
          fmt: true,
        },
        {
          icon: stats.total_balance >= 0 ? TrendingUp : TrendingDown,
          color: stats.total_balance >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50",
          value: stats.total_balance,
          label: "Umumiy balans",
          fmt: true,
        },
      ]
    : [];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading && staffList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xodimlar</h1>
          {stats && (
            <p className="text-sm text-gray-400 mt-0.5">
              {stats.active_staff} faol · {stats.terminated_staff} arxivlangan
            </p>
          )}
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Xodim qo&apos;shish
        </Button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statItems.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-none truncate">
                      {s.fmt ? formatCurrency(s.value as number) : s.value}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "active"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Faol xodimlar
          {stats && (
            <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              {stats.active_staff}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("archived")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "archived"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Arxivlangan
          {stats && stats.terminated_staff > 0 && (
            <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
              {stats.terminated_staff}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Ism, telefon bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 text-sm w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha rollar</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalances((v) => !v)}
          className="gap-1.5 text-gray-500 h-9"
        >
          {showBalances ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showBalances ? "Yashirish" : "Balanslar"}
        </Button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {staffList.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            {tab === "archived" ? (
              <>
                <Archive className="w-12 h-12 text-gray-200" />
                <p className="text-gray-500 text-sm">Arxivlangan xodimlar yo&apos;q</p>
              </>
            ) : (
              <>
                <Users className="w-12 h-12 text-gray-200" />
                <p className="text-gray-500 text-sm">Xodimlar topilmadi</p>
                {!search && !isLoading && (
                  <Button size="sm" onClick={openCreate} className="gap-2 mt-1">
                    <Plus className="w-4 h-4" />
                    Birinchi xodimni qo&apos;shish
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                  <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wide pl-5">Xodim</TableHead>
                  <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rol</TableHead>
                  <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Ish turi</TableHead>
                  <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wide">Oylik maosh</TableHead>
                  {showBalances && (
                    <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wide">Balans</TableHead>
                  )}
                  <TableHead className="text-xs font-medium text-gray-400 uppercase tracking-wide text-right pr-5">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((member) => (
                  <TableRow
                    key={member.id}
                    className={`hover:bg-gray-50/60 cursor-pointer ${tab === "archived" ? "opacity-75" : ""}`}
                    onClick={() => router.push(`/school/staff/${member.id}`)}
                  >
                    {/* Xodim */}
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.full_name} role={member.role} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{member.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{member.phone_number}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Rol */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                          {member.role_display}
                        </Badge>
                        {member.role_ref_name && (
                          <p className="text-xs text-gray-400 truncate max-w-[110px]">
                            {member.role_ref_name}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Ish turi */}
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-gray-500">
                        {member.employment_type
                          ? EMPLOYMENT_TYPE_LABELS[member.employment_type]
                          : "—"}
                      </span>
                    </TableCell>

                    {/* Maosh */}
                    <TableCell>
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(member.monthly_salary)}
                      </span>
                    </TableCell>

                    {/* Balans */}
                    {showBalances && (
                      <TableCell>
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            member.balance < 0 ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(member.balance)}
                        </span>
                      </TableCell>
                    )}

                    {/* Amallar */}
                    <TableCell
                      className="pr-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {tab === "active" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); setTxSheet({ open: true, staff: member }); }}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Hisob-kitob
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); openEdit(member); }}
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-400" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1 border-green-200 text-green-600 hover:bg-green-50"
                            onClick={(e) => handleReactivate(member, e)}
                            disabled={reactivateMutation.isPending}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Qaytarish
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); router.push(`/school/staff/${member.id}`); }}
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Staff Transaction Sheet ─────────────────────────────────────────── */}
      {txSheet.staff && (
        <StaffTransactionSheet
          open={txSheet.open}
          onClose={() => setTxSheet({ open: false })}
          staff={txSheet.staff}
          branchId={branchId}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["staff"] })}
        />
      )}

      {/* ── Create / Edit Sheet ─────────────────────────────────────────────── */}
      <Sheet
        open={editSheet.open}
        onOpenChange={(o) => setEditSheet({ ...editSheet, open: o })}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
          {/* Colored header */}
          <div
            className={`px-6 pt-6 pb-5 shrink-0 ${
              editSheet.mode === "create" ? "bg-blue-600" : "bg-indigo-600"
            }`}
          >
            <SheetHeader>
              <SheetTitle className="text-white font-semibold text-lg">
                {editSheet.mode === "create" ? "Yangi xodim" : "Xodimni tahrirlash"}
              </SheetTitle>
              <SheetDescription className="text-white/60 text-sm">
                {editSheet.mode === "create"
                  ? "Telefon raqam orqali foydalanuvchi yaratiladi"
                  : editSheet.data?.full_name}
              </SheetDescription>
            </SheetHeader>
          </div>

          <TooltipProvider delayDuration={300}>
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* Foydalanuvchi — create: all fields; edit: all editable fields */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Foydalanuvchi
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel
                        label="Ism"
                        required
                        tip="Xodimning ismi. Tizim va hujjatlarda ko'rsatiladi."
                      />
                      <Input
                        value={form.first_name ?? ""}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        placeholder="Ali"
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel
                        label="Familiya"
                        required
                        tip="Xodimning familiyasi."
                      />
                      <Input
                        value={form.last_name ?? ""}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        placeholder="Valiyev"
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {editSheet.mode === "create" ? (
                    <div className="space-y-1">
                      <FieldLabel
                        label="Telefon"
                        required
                        tip="Xodimning mobil raqami. Tizimga kirish uchun login sifatida ishlatiladi. 9 ta raqam kiriting."
                      />
                      <PhoneInput
                        value={form.phone_number ?? "+998"}
                        onChange={(val) => setForm({ ...form, phone_number: val })}
                      />
                    </div>
                  ) : (
                    <div className="rounded-md bg-gray-50 border px-3 py-2.5 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Telefon (o&apos;zgartirib bo&apos;lmaydi)</p>
                        <p className="text-sm font-medium text-gray-700">{editSheet.data?.phone_number}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel
                        label="Email"
                        tip="Ixtiyoriy. Xodimning elektron pochta manzili."
                      />
                      <Input
                        type="email"
                        value={form.email ?? ""}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                        className="h-9 text-sm"
                      />
                    </div>
                    {editSheet.mode === "create" && (
                      <div className="space-y-1">
                        <FieldLabel
                          label="Parol"
                          tip="Ixtiyoriy. Bo'sh qoldirilsa, tizim avtomatik parol yaratadi. Xodim keyinchalik o'zgartirishi mumkin."
                        />
                        <Input
                          type="password"
                          value={form.password ?? ""}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Avtomatik"
                          className="h-9 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Role */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Rol va lavozim
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel
                        label="Rol turi"
                        required
                        tip="Xodimning tizimda bajaradigan asosiy vazifasi: O'qituvchi, Filial admini yoki Boshqa rol."
                      />
                      <Select
                        value={form.role}
                        onValueChange={(v) => setForm({ ...form, role: v })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel
                        label="Maxsus rol"
                        required={form.role === "other"}
                        tip={`"Boshqa" xodim uchun qo'lda yaratilgan maxsus rol. Sozlamalar > Rollar bo'limida boshqariladi.`}
                      />
                      <Select
                        value={form.role_ref_id ?? "none"}
                        onValueChange={(v) =>
                          setForm({ ...form, role_ref_id: v === "none" ? undefined : v })
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yo&apos;q</SelectItem>
                          {rolesData.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel
                        label="Lavozim"
                        tip="Xodimning rasmiy lavozimi. Masalan: Katta o'qituvchi, Direktor o'rinbosari."
                      />
                      <Input
                        value={form.title ?? ""}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Katta o'qituvchi"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel
                        label="Ish turi"
                        tip="To'liq stavka (full-time), yarim stavka (part-time) yoki soatlik ish tartibi."
                      />
                      <Select
                        value={form.employment_type}
                        onValueChange={(v) =>
                          setForm({ ...form, employment_type: v as EmploymentType })
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, l]) => (
                            <SelectItem key={k} value={k}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Salary */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Maosh
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel
                        label="Oylik maosh (so'm)"
                        tip="Xodimning asosiy oylik maoshi so'mda. Moliya hisobotlari va balans hisob-kitobida ishlatiladi."
                      />
                      <SalaryInput
                        value={form.monthly_salary}
                        onChange={(val) => setForm({ ...form, monthly_salary: val })}
                      />
                    </div>
                    {editSheet.mode === "create" && (
                      <div className="space-y-1">
                        <FieldLabel
                          label="Ishga kirgan sana"
                          tip="Xodim filialda rasman ishlashga kirgan sana. Ixtiyoriy."
                        />
                        <Input
                          type="date"
                          value={form.hire_date ?? ""}
                          onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Personal */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Shaxsiy ma&apos;lumotlar
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <FieldLabel
                        label="Pasport ser."
                        tip="O'zbekiston pasportining 2 ta seriya harfi. Masalan: AA, AB, AD."
                      />
                      <Input
                        value={form.passport_serial ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, passport_serial: e.target.value.toUpperCase() })
                        }
                        placeholder="AA"
                        maxLength={2}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel
                        label="Pasport raqami"
                        tip="Pasportning 7 xonali raqami."
                      />
                      <Input
                        value={form.passport_number ?? ""}
                        onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
                        placeholder="1234567"
                        maxLength={7}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel
                      label="Manzil"
                      tip="Xodimning yashash manzili. Ixtiyoriy."
                    />
                    <Textarea
                      value={form.address ?? ""}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Yashash manzili"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel
                      label="Favqulodda aloqa"
                      tip="Favqulodda holatlarda bog'lanish uchun telefon raqami yoki boshqa aloqa ma'lumoti."
                    />
                    <Input
                      value={form.emergency_contact ?? ""}
                      onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                      placeholder="+998 90 000 00 00"
                      className="h-9 text-sm"
                    />
                  </div>
                  {editSheet.mode === "edit" && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                      Pasport va manzil ma&apos;lumotlari xodim detail sahifasida ham ko&apos;rinadi.
                    </div>
                  )}
                </section>
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 flex items-center justify-end gap-2 bg-gray-50 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSheet({ ...editSheet, open: false })}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  {editSheet.mode === "create" ? "Yaratish" : "Saqlash"}
                </Button>
              </div>
            </form>
          </TooltipProvider>
        </SheetContent>
      </Sheet>
    </div>
  );
}
