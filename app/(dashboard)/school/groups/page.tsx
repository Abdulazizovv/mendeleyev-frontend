"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import { branchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Group, Subject, SubjectLevel, CreateGroupRequest } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  User,
  RefreshCcw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  selectedSubjectId: string;
  subject_level: string;
  teacher: string;
  description: string;
  max_students: number;
  teacher_salary_type: "percentage" | "per_lesson" | "";
  teacher_salary_value: number | "";
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  selectedSubjectId: "",
  subject_level: "",
  teacher: "",
  description: "",
  max_students: 30,
  teacher_salary_type: "",
  teacher_salary_value: "",
  is_active: true,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id ?? "";
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  // ── Data fetches ──────────────────────────────────────────────────────────

  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ["groups", branchId],
    queryFn: () => schoolApi.getGroups(branchId),
    enabled: !!branchId,
  });

  const { data: subjectsData = [] } = useQuery<Subject[]>({
    queryKey: ["subjects", branchId, "active"],
    queryFn: () => schoolApi.getSubjects(branchId, { is_active: true }),
    enabled: !!branchId,
  });

  // Faqat o'qituvchilarni olish — branchApi.getMemberships(branchId, { role: 'teacher' })
  const { data: teachersPage } = useQuery({
    queryKey: ["branch-teachers", branchId],
    queryFn: () => branchApi.getMemberships(branchId, { role: "teacher", page_size: 200 }),
    enabled: !!branchId,
  });
  const teachers = teachersPage?.results ?? [];

  // Fan darajalari — faqat tanlangan fan bo'lganda yuklanadi
  const { data: levels = [], isLoading: levelsLoading } = useQuery<SubjectLevel[]>({
    queryKey: ["subject-levels", branchId, form.selectedSubjectId],
    queryFn: () => schoolApi.getSubjectLevels(branchId, form.selectedSubjectId),
    enabled: !!branchId && !!form.selectedSubjectId,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: CreateGroupRequest) => schoolApi.createGroup(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", branchId] });
      toast.success("Guruh yaratildi");
      setSheetOpen(false);
    },
    onError: (err: any) => {
      const detail = err?.response?.data;
      if (typeof detail === "object") {
        const msgs = Object.values(detail).flat().join(" ");
        toast.error(msgs || "Yaratishda xatolik");
      } else {
        toast.error(detail ?? "Yaratishda xatolik");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGroupRequest> }) =>
      schoolApi.updateGroup(branchId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", branchId] });
      toast.success("Guruh yangilandi");
      setSheetOpen(false);
    },
    onError: (err: any) => {
      const detail = err?.response?.data;
      if (typeof detail === "object") {
        const msgs = Object.values(detail).flat().join(" ");
        toast.error(msgs || "Yangilashda xatolik");
      } else {
        toast.error(detail ?? "Yangilashda xatolik");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteGroup(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", branchId] });
      toast.success(`"${deleteTarget?.name}" guruhi o'chirildi`);
      setDeleteTarget(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleSubjectChange = (subjectId: string) => {
    setForm((f) => ({
      ...f,
      selectedSubjectId: subjectId === "none" ? "" : subjectId,
      subject_level: "",
    }));
  };

  const openCreate = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      selectedSubjectId: group.subject_level_detail?.subject ?? "",
      subject_level: group.subject_level ?? "",
      teacher: group.teacher ?? "",
      description: group.description ?? "",
      max_students: group.max_students,
      teacher_salary_type: group.teacher_salary_type ?? "",
      teacher_salary_value: group.teacher_salary_value ?? "",
      is_active: group.is_active,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Guruh nomi kiritilishi shart");
      return;
    }
    const payload: CreateGroupRequest = {
      name: form.name.trim(),
      subject_level: form.subject_level || null,
      teacher: form.teacher || null,
      description: form.description,
      max_students: form.max_students,
      teacher_salary_type: form.teacher_salary_type || null,
      teacher_salary_value: form.teacher_salary_value !== "" ? Number(form.teacher_salary_value) : null,
      is_active: form.is_active,
    };
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.teacher_name ?? "").toLowerCase().includes(q) ||
        (g.subject_level_detail?.name ?? "").toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const activeCount  = groups.filter((g) => g.is_active).length;
  const totalMembers = groups.reduce((s, g) => s + g.members_count, 0);

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Guruhlar
          </h1>
          <p className="text-sm text-gray-500">Filial guruhlarini boshqaring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchGroups()} disabled={groupsLoading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${groupsLoading ? "animate-spin" : ""}`} />
            Yangilash
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Yangi guruh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jami guruhlar</p>
              <p className="text-2xl font-bold">{groups.length}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Faol guruhlar</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jami o'quvchilar</p>
              <p className="text-2xl font-bold text-purple-600">{totalMembers}</p>
            </div>
            <GraduationCap className="w-10 h-10 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Guruh nomi, o'qituvchi yoki daraja bo'yicha qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Guruhlar ro'yxati
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Guruhlar topilmadi</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Birinchi guruhni yarating
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guruh nomi</TableHead>
                    <TableHead>Fan / Daraja</TableHead>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>O'quvchilar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((group) => (
                    <TableRow
                      key={group.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/school/groups/${group.id}`)}
                    >
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        {group.subject_level_detail ? (
                          <div className="text-sm">
                            <p className="font-medium">{group.subject_level_detail.subject_name}</p>
                            <p className="text-gray-500 flex items-center gap-1">
                              {group.subject_level_detail.name}
                              <span className="text-xs text-blue-600 ml-1">
                                {formatCurrency(group.subject_level_detail.lesson_price)}/dars
                              </span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.teacher_name ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm">{group.teacher_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm">
                            {group.members_count} / {group.max_students}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.is_active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Faol
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Nofaol
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openEdit(group); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(group); }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); router.push(`/school/groups/${group.id}`); }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { if (!saving) setSheetOpen(o); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingGroup ? "Guruhni tahrirlash" : "Yangi guruh"}</SheetTitle>
            <SheetDescription>
              {editingGroup ? "Guruh ma'lumotlarini yangilang" : "Yangi guruh yarating"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Guruh nomi <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Masalan: Fizika-A, Matematika ilg'or"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Fan</Label>
              <Select
                value={form.selectedSubjectId || "none"}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fan tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {subjectsData.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.code ? ` (${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level — faqat fan tanlanganda */}
            {form.selectedSubjectId && (
              <div className="space-y-1.5">
                <Label>Daraja / Narx</Label>
                {levelsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Darajalar yuklanmoqda...
                  </div>
                ) : levels.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-md px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Bu fan uchun darajalar topilmadi
                  </p>
                ) : (
                  <Select
                    value={form.subject_level || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, subject_level: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Daraja tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Tanlanmagan —</SelectItem>
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} — {formatCurrency(l.lesson_price)}/dars
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Teacher */}
            <div className="space-y-1.5">
              <Label>O'qituvchi</Label>
              <Select
                value={form.teacher || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, teacher: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="O'qituvchi tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.user_name || t.user_phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teachers.length === 0 && (
                <p className="text-xs text-gray-400">
                  Filialdagi o'qituvchilar yuklanmadi
                </p>
              )}
            </div>

            {/* Teacher salary — faqat o'qituvchi tanlanganda */}
            {form.teacher && (
              <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maosh sozlamalari</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Maosh turi</Label>
                    <Select
                      value={form.teacher_salary_type || "_none"}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          teacher_salary_type: v === "_none" ? "" : v as "percentage" | "per_lesson",
                          teacher_salary_value: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Belgilanmagan</SelectItem>
                        <SelectItem value="percentage">Foizga (%)</SelectItem>
                        <SelectItem value="per_lesson">Dars uchun (so'm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.teacher_salary_type && (
                    <div className="space-y-1.5">
                      <Label>
                        {form.teacher_salary_type === "percentage" ? "Foiz (%)" : "Summa (so'm)"}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={form.teacher_salary_type === "percentage" ? 100 : undefined}
                        placeholder={form.teacher_salary_type === "percentage" ? "40" : "50000"}
                        value={form.teacher_salary_value}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            teacher_salary_value: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Max students */}
            <div className="space-y-1.5">
              <Label>Maksimal o'quvchilar soni</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.max_students}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_students: parseInt(e.target.value) || 30 }))
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Textarea
                placeholder="Guruh haqida qo'shimcha ma'lumot..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Holat</Label>
              <Select
                value={form.is_active ? "active" : "inactive"}
                onValueChange={(v) => setForm((f) => ({ ...f, is_active: v === "active" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingGroup ? "Saqlash" : "Yaratish"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
                Bekor qilish
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guruhni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{deleteTarget?.name}"</span> guruhini o'chirishni
              tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
