"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superadminApi, type BranchSettings } from "@/lib/api/superadmin";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, Users, GraduationCap, UserCog,
  CheckCircle, XCircle, Archive, Settings, Pencil, Trash2,
  DollarSign, BookOpen, TrendingUp, TrendingDown, Wallet,
  Phone, MapPin, Mail, Clock, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:   { label: "Faol",        className: "bg-green-100 text-green-700 border border-green-200" },
  inactive: { label: "Nofaol",      className: "bg-gray-100 text-gray-600 border border-gray-200" },
  pending:  { label: "Kutilmoqda",  className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  archived: { label: "Arxivlangan", className: "bg-red-100 text-red-700 border border-red-200" },
};
const TYPE_LABELS: Record<string, string> = { school: "Maktab", center: "O'quv markazi" };
const ROLE_LABELS: Record<string, string> = {
  branch_admin: "Filial admini", super_admin: "Super admin",
  teacher: "O'qituvchi", other: "Boshqa",
};

function fmt(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

type TabType = "overview" | "students" | "staff" | "classes" | "finance" | "admins" | "settings";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Umumiy",      icon: Building2 },
  { id: "students",  label: "O'quvchilar", icon: GraduationCap },
  { id: "staff",     label: "Xodimlar",    icon: Users },
  { id: "classes",   label: "Sinflar",     icon: BookOpen },
  { id: "finance",   label: "Moliya",      icon: DollarSign },
  { id: "admins",    label: "Adminlar",    icon: UserCog },
  { id: "settings",  label: "Sozlamalar",  icon: Settings },
];

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>("overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  const { data: branch, isLoading } = useQuery({
    queryKey: ["superadmin", "branch", id],
    queryFn: () => superadminApi.getBranch(id).then((r) => r.data),
  });

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["superadmin", "branch-admins", id],
    queryFn: () => superadminApi.getBranchAdmins(id).then((r) => r.data),
    enabled: tab === "admins",
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["superadmin", "branch-students", id, studentSearch],
    queryFn: () =>
      superadminApi.getBranchStudents(id, studentSearch ? { search: studentSearch } : {}).then((r) => r.data),
    enabled: tab === "students",
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["superadmin", "branch-staff", id, staffSearch],
    queryFn: () =>
      superadminApi.getBranchStaff(id, staffSearch ? { search: staffSearch } : {}).then((r) => r.data),
    enabled: tab === "staff",
  });

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ["superadmin", "branch-classes", id],
    queryFn: () => superadminApi.getBranchClasses(id).then((r) => r.data),
    enabled: tab === "classes",
  });

  const { data: branchFinance, isLoading: financeLoading } = useQuery({
    queryKey: ["superadmin", "branch-finance", id],
    queryFn: () => superadminApi.getBranchFinance(id).then((r) => r.data),
    enabled: tab === "finance",
  });

  const activateMutation = useMutation({
    mutationFn: () => superadminApi.activateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branch", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] });
      toast.success("Filial faollashtirildi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => superadminApi.deactivateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branch", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] });
      toast.success("Filial nofaol qilindi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const archiveMutation = useMutation({
    mutationFn: () => superadminApi.archiveBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branch", id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] });
      toast.success("Filial arxivlandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const removeAdminMutation = useMutation({
    mutationFn: (membershipId: string) =>
      superadminApi.removeAdmin(id, { membership_id: membershipId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branch-admins", id] });
      toast.success("Admin olib tashlandi");
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-48" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
        <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Filial topilmadi</p>
        <Link href="/super-admin/branches">
          <Button variant="outline" className="mt-4">Orqaga</Button>
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[branch.status] ?? STATUS_CONFIG.inactive;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/super-admin/branches">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 h-8">
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.className}`}>
                {cfg.label}
              </span>
              {branch.code && (
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-mono">
                  {branch.code}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{TYPE_LABELS[branch.type] ?? branch.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/super-admin/branches/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Pencil className="w-3.5 h-3.5" />
              Tahrirlash
            </Button>
          </Link>
          {branch.status !== "active" && (
            <Button
              size="sm"
              className="gap-1.5 h-8 bg-green-600 hover:bg-green-700"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Faollashtirish
            </Button>
          )}
          {branch.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              <XCircle className="w-3.5 h-3.5" />
              Nofaol
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {[
          { label: "O'quvchilar", value: branch.student_count, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50", tab: "students" as TabType },
          { label: "Xodimlar",    value: branch.staff_count,   icon: Users,         color: "text-purple-600", bg: "bg-purple-50", tab: "staff" as TabType },
          { label: "Adminlar",    value: branch.admin_count,   icon: UserCog,       color: "text-green-600",  bg: "bg-green-50",  tab: "admins" as TabType },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab)}
            className={`flex items-center gap-3 p-3.5 bg-white border rounded-xl text-left transition-all ${
              tab === s.tab ? "border-blue-300 shadow-sm shadow-blue-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Filial ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: MapPin,  label: "Manzil",         value: branch.address },
                  { icon: Phone,   label: "Telefon",        value: branch.phone_number },
                  { icon: Mail,    label: "Email",          value: branch.email },
                  { icon: Clock,   label: "Yaratilgan",     value: new Date(branch.created_at).toLocaleDateString("uz-UZ") },
                ].filter((r) => r.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {branch.status !== "archived" && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (confirm(`"${branch.name}" filialini arxivlashni tasdiqlaysizmi?`)) {
                    archiveMutation.mutate();
                  }
                }}
                disabled={archiveMutation.isPending}
              >
                <Archive className="w-3.5 h-3.5" />
                Arxivlash
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Students ── */}
      {tab === "students" && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm font-semibold">
                O'quvchilar · {studentsData?.count ?? 0} ta
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Qidirish..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 h-8 w-52 text-sm border-gray-200"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : !studentsData?.results?.length ? (
              <div className="text-center py-10">
                <GraduationCap className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">O'quvchi topilmadi</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="pb-2 text-xs font-medium text-gray-400">Ismi</th>
                        <th className="pb-2 text-xs font-medium text-gray-400">Telefon</th>
                        <th className="pb-2 text-xs font-medium text-gray-400 text-right">Balans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {studentsData.results.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="py-2.5 text-sm font-medium text-gray-900">{s.full_name}</td>
                          <td className="py-2.5 text-sm text-gray-500">{s.phone_number}</td>
                          <td className={`py-2.5 text-sm font-medium text-right ${s.balance < 0 ? "text-red-600" : "text-gray-700"}`}>
                            {fmt(s.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {studentsData.count > studentsData.results.length && (
                  <p className="text-xs text-gray-400 text-center pt-3">
                    Ko'rsatilmoqda: {studentsData.results.length} / {studentsData.count}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Staff ── */}
      {tab === "staff" && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-sm font-semibold">
                Xodimlar · {staffData?.count ?? 0} ta
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Qidirish..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="pl-8 h-8 w-52 text-sm border-gray-200"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {staffLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : !staffData?.results?.length ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Xodim topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 text-xs font-medium text-gray-400">Ismi</th>
                      <th className="pb-2 text-xs font-medium text-gray-400">Rol</th>
                      <th className="pb-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Telefon</th>
                      <th className="pb-2 text-xs font-medium text-gray-400 text-right">Balans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staffData.results.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="py-2.5">
                          <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                          {m.title && <p className="text-xs text-gray-400">{m.title}</p>}
                        </td>
                        <td className="py-2.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {m.role_label}
                          </span>
                        </td>
                        <td className="py-2.5 text-sm text-gray-500 hidden sm:table-cell">{m.phone_number}</td>
                        <td className={`py-2.5 text-sm font-medium text-right ${m.balance < 0 ? "text-red-600" : "text-gray-700"}`}>
                          {fmt(m.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Classes ── */}
      {tab === "classes" && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Sinflar · {classesData?.length ?? 0} ta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : !classesData?.length ? (
              <div className="text-center py-10">
                <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sinflar topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 text-xs font-medium text-gray-400">Sinf nomi</th>
                      <th className="pb-2 text-xs font-medium text-gray-400 text-center">Daraja</th>
                      <th className="pb-2 text-xs font-medium text-gray-400">Akademik yil</th>
                      <th className="pb-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Sinf o'qituvchisi</th>
                      <th className="pb-2 text-xs font-medium text-gray-400 text-center">O'quvchi</th>
                      <th className="pb-2 text-xs font-medium text-gray-400 text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {classesData.map((c) => {
                      const pct = c.max_students > 0 ? Math.round((c.student_count / c.max_students) * 100) : 0;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="py-2.5 text-sm font-semibold text-gray-900">{c.name}</td>
                          <td className="py-2.5 text-center">
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                              {c.grade_level}-sinf
                            </span>
                          </td>
                          <td className="py-2.5 text-xs text-gray-500">{c.academic_year}</td>
                          <td className="py-2.5 text-sm text-gray-600 hidden sm:table-cell">
                            {c.class_teacher ?? <span className="text-gray-300 italic text-xs">Belgilanmagan</span>}
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-semibold text-gray-900">
                                {c.student_count}/{c.max_students}
                              </span>
                              <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-yellow-400" : "bg-green-400"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                              c.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}>
                              {c.is_active ? "Faol" : "Nofaol"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Finance ── */}
      {tab === "finance" && (
        <div className="space-y-4">
          {financeLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : branchFinance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Jami kirim",   value: branchFinance.total_income,   icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100" },
                  { label: "Jami chiqim",  value: branchFinance.total_expense,  icon: TrendingDown, color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100" },
                  { label: "Sof balans",   value: branchFinance.net_balance,    icon: DollarSign,   color: branchFinance.net_balance >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50", border: "border-blue-100" },
                  { label: "Kassa balansi",value: branchFinance.cash_balance,   icon: Wallet,       color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                ].map((s) => (
                  <Card key={s.label} className={`border ${s.border}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-500">{s.label}</p>
                        <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                      </div>
                      <p className={`text-lg font-bold ${s.color}`}>{fmt(s.value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Joriy oy</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Kirim</p>
                    <p className="text-lg font-bold text-green-600">{fmt(branchFinance.monthly_income)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Chiqim</p>
                    <p className="text-lg font-bold text-red-600">{fmt(branchFinance.monthly_expense)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Sof</p>
                    <p className={`text-lg font-bold ${branchFinance.monthly_net >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      {fmt(branchFinance.monthly_net)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400">Moliya ma'lumotlari yuklanmadi</div>
          )}
        </div>
      )}

      {/* ── Admins ── */}
      {tab === "admins" && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Filial adminlari · {admins?.length ?? 0} ta</CardTitle>
          </CardHeader>
          <CardContent>
            {adminsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            ) : !admins?.length ? (
              <div className="text-center py-10">
                <UserCog className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Admin tayinlanmagan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                        <UserCog className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{admin.full_name || admin.phone_number}</p>
                        <p className="text-xs text-gray-500">
                          {admin.phone_number} ·{" "}
                          <span className="text-blue-600">{ROLE_LABELS[admin.role] ?? admin.role}</span>
                          {admin.is_super_admin && (
                            <span className="ml-1 text-purple-600 font-medium">· Superuser</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Bu adminni olib tashlashni tasdiqlaysizmi?")) {
                          removeAdminMutation.mutate(admin.id);
                        }
                      }}
                      disabled={removeAdminMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Settings ── */}
      {tab === "settings" && branch.settings && (
        <BranchSettingsForm branchId={id} settings={branch.settings} />
      )}
      {tab === "settings" && !branch.settings && (
        <div className="text-center py-10 text-gray-400">Sozlamalar yuklanmadi</div>
      )}
    </div>
  );
}

function BranchSettingsForm({ branchId, settings }: { branchId: string; settings: BranchSettings }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...settings });

  const mutation = useMutation({
    mutationFn: (data: Partial<BranchSettings>) => superadminApi.updateBranchSettings(branchId, data),
    onSuccess: (res) => {
      setForm(res.data);
      queryClient.invalidateQueries({ queryKey: ["superadmin", "branch", branchId] });
      toast.success("Sozlamalar saqlandi");
    },
    onError: () => toast.error("Saqlashda xatolik yuz berdi"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Filial sozlamalari</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Dars davomiyligi (daqiqa)", key: "lesson_duration_minutes", type: "number", min: 1 },
              { label: "Tanaffus davomiyligi (daqiqa)", key: "break_duration_minutes", type: "number", min: 0 },
              { label: "Maktab boshlanish vaqti", key: "school_start_time", type: "time" },
              { label: "Maktab tugash vaqti", key: "school_end_time", type: "time" },
              { label: "Valyuta", key: "currency", type: "text" },
              { label: "Maosh to'lash kuni", key: "salary_calculation_day", type: "number", min: 1, max: 31 },
              { label: "Kunlik max darslar", key: "max_lessons_per_day", type: "number", min: 1 },
              { label: "Haftalik ish kunlari", key: "work_days_per_week", type: "number", min: 1, max: 7 },
            ].map(({ label, key, type, min, max }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">{label}</Label>
                <Input
                  type={type}
                  value={(form as any)[key] ?? ""}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    [key]: type === "number" ? Number(e.target.value) : e.target.value,
                  }))}
                  min={min}
                  max={max}
                  className="h-9 border-gray-200"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
