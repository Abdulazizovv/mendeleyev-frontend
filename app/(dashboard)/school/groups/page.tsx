"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
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
  BookOpen,
  User,
  RefreshCcw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { formatCurrency } from "@/lib/utils";
import { staffApi } from "@/lib/api";
import type { StaffMember } from "@/types/staff";

type FormState = {
  name: string;
  subject_level: string;
  teacher: string;
  description: string;
  max_students: number;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  subject_level: "",
  teacher: "",
  description: "",
  max_students: 30,
  is_active: true,
};

export default function GroupsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [levels, setLevels] = React.useState<SubjectLevel[]>([]);
  const [teachers, setTeachers] = React.useState<StaffMember[]>([]);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<Group | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchGroups = React.useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const data = await schoolApi.getGroups(branchId);
      setGroups(data);
    } catch {
      toast.error("Guruhlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const fetchSubjects = React.useCallback(async () => {
    if (!branchId) return;
    try {
      const data = await schoolApi.getSubjects(branchId, { is_active: true });
      setSubjects(data);
    } catch {
      // ignore
    }
  }, [branchId]);

  const fetchTeachers = React.useCallback(async () => {
    if (!branchId) return;
    try {
      const data = await staffApi.getStaff({ branch: branchId, role: "teacher" });
      setTeachers(data);
    } catch {
      // ignore
    }
  }, [branchId]);

  React.useEffect(() => {
    fetchGroups();
    fetchSubjects();
    fetchTeachers();
  }, [fetchGroups, fetchSubjects, fetchTeachers]);

  // Load levels when subject_level subject changes
  const selectedSubjectId = React.useMemo(() => {
    if (!form.subject_level) return null;
    const level = levels.find((l) => l.id === form.subject_level);
    if (level) return level.subject;
    return null;
  }, [form.subject_level, levels]);

  const loadLevelsForSubject = React.useCallback(async (subjectId: string) => {
    if (!branchId || !subjectId) return;
    try {
      const data = await schoolApi.getSubjectLevels(branchId, subjectId);
      setLevels(data);
    } catch {
      setLevels([]);
    }
  }, [branchId]);

  const handleSubjectChange = async (subjectId: string) => {
    setForm((f) => ({ ...f, subject_level: "" }));
    if (subjectId === "none") {
      setLevels([]);
      return;
    }
    await loadLevelsForSubject(subjectId);
  };

  const openCreate = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setLevels([]);
    setSheetOpen(true);
  };

  const openEdit = async (group: Group) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      subject_level: group.subject_level ?? "",
      teacher: group.teacher ?? "",
      description: group.description ?? "",
      max_students: group.max_students,
      is_active: group.is_active,
    });
    // Load levels for existing subject
    if (group.subject_level_detail?.subject) {
      await loadLevelsForSubject(group.subject_level_detail.subject);
    }
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!branchId || !form.name.trim()) {
      toast.error("Guruh nomi kiritilishi shart");
      return;
    }
    try {
      setSaving(true);
      const payload: CreateGroupRequest = {
        name: form.name.trim(),
        subject_level: form.subject_level || null,
        teacher: form.teacher || null,
        description: form.description,
        max_students: form.max_students,
        is_active: form.is_active,
      };
      if (editingGroup) {
        await schoolApi.updateGroup(branchId, editingGroup.id, payload);
        toast.success("Guruh yangilandi");
      } else {
        await schoolApi.createGroup(branchId, payload);
        toast.success("Guruh yaratildi");
      }
      setSheetOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(extractApiError(err) ?? "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!branchId || !deleteTarget) return;
    try {
      setDeleting(true);
      await schoolApi.deleteGroup(branchId, deleteTarget.id);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" guruhi o'chirildi`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractApiError(err) ?? "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.teacher_name ?? "").toLowerCase().includes(q) ||
        (g.subject_level_detail?.name ?? "").toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const activeCount = groups.filter((g) => g.is_active).length;
  const totalMembers = groups.reduce((sum, g) => sum + g.members_count, 0);

  // Derive current subject from form.subject_level
  const currentSubjectId = React.useMemo(() => {
    if (!form.subject_level) return "";
    const found = levels.find((l) => l.id === form.subject_level);
    if (found) return found.subject;
    if (editingGroup?.subject_level_detail?.subject) return editingGroup.subject_level_detail.subject;
    return "";
  }, [form.subject_level, levels, editingGroup]);

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="outline" size="default" onClick={fetchGroups} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
          {loading ? (
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
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(group);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(group);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/school/groups/${group.id}`);
                            }}
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
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingGroup ? "Guruhni tahrirlash" : "Yangi guruh"}</SheetTitle>
            <SheetDescription>
              {editingGroup ? "Guruh ma'lumotlarini yangilang" : "Yangi guruh yarating"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Guruh nomi *</Label>
              <Input
                placeholder="Masalan: Fizika-A, Matematika ilg'or"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Subject selector */}
            <div className="space-y-2">
              <Label>Fan</Label>
              <Select
                value={currentSubjectId || "none"}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fan tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level selector */}
            <div className="space-y-2">
              <Label>Daraja / Narx</Label>
              <Select
                value={form.subject_level || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, subject_level: v === "none" ? "" : v }))}
                disabled={levels.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={levels.length === 0 ? "Avval fan tanlang" : "Daraja tanlang"} />
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
            </div>

            {/* Teacher */}
            <div className="space-y-2">
              <Label>O'qituvchi</Label>
              <Select
                value={form.teacher || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, teacher: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="O'qituvchi tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tanlanmagan —</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name || t.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max students */}
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Textarea
                placeholder="Guruh haqida qo'shimcha ma'lumot..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
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
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingGroup ? "Saqlash" : "Yaratish"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>
                Bekor qilish
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guruhni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{deleteTarget?.name}"</span> guruhini o'chirishni
              tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
