"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import { branchApi } from "@/lib/api/branch";
import type { Subject, SubjectLevel, CreateSubjectLevelRequest, Class } from "@/types";
import type { SubjectDetailClassSubject } from "@/types/school";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { EditSubjectForm } from "@/components/dashboard/EditSubjectForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Layers,
  DollarSign,
  Users,
  GraduationCap,
  Percent,
  Calculator,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const subjectId = params.id as string;

  const [subject, setSubject] = React.useState<Subject | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Levels state
  const [levels, setLevels] = React.useState<SubjectLevel[]>([]);
  const [levelsLoading, setLevelsLoading] = React.useState(false);
  const [levelForm, setLevelForm] = React.useState<Partial<CreateSubjectLevelRequest>>({});
  const [editingLevel, setEditingLevel] = React.useState<SubjectLevel | null>(null);
  const [levelFormOpen, setLevelFormOpen] = React.useState(false);
  const [savingLevel, setSavingLevel] = React.useState(false);
  const [deletingLevelId, setDeletingLevelId] = React.useState<string | null>(null);
  const [deleteLevelConfirm, setDeleteLevelConfirm] = React.useState<SubjectLevel | null>(null);

  // Edit subject dialog
  const [editOpen, setEditOpen] = React.useState(false);

  // Assign-to-class dialog
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [teachers, setTeachers] = React.useState<{ id: string; user_name: string }[]>([]);
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assigning, setAssigning] = React.useState(false);
  const [assignForm, setAssignForm] = React.useState<{
    class_id: string;
    subject_level: string;
    teacher: string;
    hours_per_week: number;
    is_active: boolean;
    teacher_salary_type: 'percentage' | 'per_lesson' | '';
    teacher_salary_value: number | '';
  }>({ class_id: '', subject_level: '', teacher: '', hours_per_week: 2, is_active: true, teacher_salary_type: '', teacher_salary_value: '' });

  // Load classes and teachers when assign dialog opens
  React.useEffect(() => {
    if (!assignOpen || !branchId) return;
    setAssignLoading(true);
    Promise.all([
      schoolApi.getClasses(branchId, { is_active: true, page_size: 100 }),
      branchApi.getMemberships(branchId, { role: 'teacher', is_active: true, page_size: 100 }),
    ]).then(([cls, memberships]) => {
      setClasses(cls);
      setTeachers((memberships?.results ?? []).map((m: any) => ({ id: m.id, user_name: m.user_name })));
    }).catch(() => {}).finally(() => setAssignLoading(false));
  }, [assignOpen, branchId]);

  // Auto-select level when only one available
  React.useEffect(() => {
    if (assignOpen && levels.length === 1) {
      setAssignForm(f => ({ ...f, subject_level: levels[0].id }));
    }
  }, [assignOpen, levels]);

  const handleAssign = async () => {
    if (!branchId || !assignForm.class_id || !assignForm.subject_level) return;
    try {
      setAssigning(true);
      await schoolApi.addSubjectToClass(assignForm.class_id, {
        subject: subjectId,
        subject_level: assignForm.subject_level,
        teacher: assignForm.teacher || null,
        hours_per_week: assignForm.hours_per_week,
        is_active: assignForm.is_active,
        teacher_salary_type: assignForm.teacher_salary_type || null,
        teacher_salary_value: assignForm.teacher_salary_value !== '' ? Number(assignForm.teacher_salary_value) : null,
      });
      toast.success("Fan sinfga biriktirildi");
      setAssignOpen(false);
      setAssignForm({ class_id: '', subject_level: '', teacher: '', hours_per_week: 2, is_active: true, teacher_salary_type: '', teacher_salary_value: '' });
      loadSubject();
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, unknown> } };
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  const loadSubject = React.useCallback(async () => {
    if (!branchId || !subjectId) return;
    try {
      setLoading(true);
      const data = await schoolApi.getSubject(branchId, subjectId);
      setSubject(data);
    } catch {
      toast.error("Fan ma'lumotlari yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [branchId, subjectId]);

  const loadLevels = React.useCallback(async () => {
    if (!branchId || !subjectId) return;
    try {
      setLevelsLoading(true);
      const data = await schoolApi.getSubjectLevels(branchId, subjectId);
      setLevels(data);
    } catch {
      setLevels([]);
    } finally {
      setLevelsLoading(false);
    }
  }, [branchId, subjectId]);

  React.useEffect(() => {
    loadSubject();
    loadLevels();
  }, [loadSubject, loadLevels]);

  // Level handlers
  const handleSaveLevel = async () => {
    if (!branchId || !subjectId) return;
    if (!levelForm.name?.trim()) { toast.error("Daraja nomi kiritilishi shart"); return; }
    if (levelForm.lesson_price === undefined || levelForm.lesson_price < 0) {
      toast.error("Dars narxi noto'g'ri"); return;
    }
    try {
      setSavingLevel(true);
      const payload: CreateSubjectLevelRequest = {
        name: levelForm.name.trim(),
        lesson_price: levelForm.lesson_price,
        is_active: levelForm.is_active ?? true,
      };
      if (editingLevel) {
        await schoolApi.updateSubjectLevel(branchId, subjectId, editingLevel.id, payload);
        toast.success("Daraja yangilandi");
      } else {
        await schoolApi.createSubjectLevel(branchId, subjectId, payload);
        toast.success("Daraja yaratildi");
      }
      await loadLevels();
      setLevelFormOpen(false);
      setEditingLevel(null);
      setLevelForm({});
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, unknown> } };
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : "Saqlashda xatolik";
      toast.error(msg);
    } finally {
      setSavingLevel(false);
    }
  };

  const handleDeleteLevel = async (level: SubjectLevel) => {
    if (!branchId || !subjectId) return;
    try {
      setDeletingLevelId(level.id);
      await schoolApi.deleteSubjectLevel(branchId, subjectId, level.id);
      setLevels(prev => prev.filter(l => l.id !== level.id));
      toast.success(`"${level.name}" darajasi o'chirildi`);
    } catch {
      toast.error("O'chirishda xatolik");
    } finally {
      setDeletingLevelId(null);
      setDeleteLevelConfirm(null);
    }
  };

  const openEditLevel = (level: SubjectLevel) => {
    setEditingLevel(level);
    setLevelForm({ name: level.name, lesson_price: level.lesson_price, is_active: level.is_active });
    setLevelFormOpen(true);
  };

  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({ name: "", lesson_price: 0, is_active: true });
    setLevelFormOpen(true);
  };

  const cancelLevelForm = () => {
    setLevelFormOpen(false);
    setEditingLevel(null);
    setLevelForm({});
  };

  if (!branchId || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <BookOpen className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Fan topilmadi</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  const classSubjects: SubjectDetailClassSubject[] = subject.class_subjects ?? [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/school/subjects")}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Fanlar
        </Button>

        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border-2 shrink-0"
              style={{ backgroundColor: subject.color || '#3b82f6', borderColor: subject.color || '#3b82f6' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-sm text-gray-500">{subject.branch_name}</p>
            </div>
            {subject.is_active ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 ml-2">
                <CheckCircle2 className="w-3 h-3 mr-1" />Faol
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">
                <XCircle className="w-3 h-3 mr-1" />Nofaol
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadSubject}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Yangilash
            </Button>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Tahrirlash
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-500 opacity-80" />
            <div>
              <p className="text-xs text-gray-500">Darajalar</p>
              <p className="text-xl font-bold">{levels.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-violet-500 opacity-80" />
            <div>
              <p className="text-xs text-gray-500">Jami sinflar</p>
              <p className="text-xl font-bold">{subject.total_classes ?? classSubjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-80" />
            <div>
              <p className="text-xs text-gray-500">Faol sinflar</p>
              <p className="text-xl font-bold">
                {subject.active_classes ?? classSubjects.filter(cs => cs.is_active).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-500 opacity-80" />
            <div>
              <p className="text-xs text-gray-500">O'qituvchilar</p>
              <p className="text-xl font-bold">{subject.teachers?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="levels">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Ma'lumotlar
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Darajalar
            <Badge variant="secondary" className="ml-1 text-xs py-0 px-1.5">{levels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            Sinflar
            <Badge variant="secondary" className="ml-1 text-xs py-0 px-1.5">{classSubjects.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── INFO TAB ── */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Fan nomi</p>
                <p className="font-medium">{subject.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rang</p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded border"
                    style={{ backgroundColor: subject.color || '#3b82f6' }}
                  />
                  <span className="font-mono text-sm">{subject.color || '—'}</span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Tavsif</p>
                <p className="text-sm text-gray-700">{subject.description || <span className="text-gray-400 italic">Kiritilmagan</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Yaratilgan</p>
                <p className="text-sm">{new Date(subject.created_at).toLocaleString("uz-UZ")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Yangilangan</p>
                <p className="text-sm">{new Date(subject.updated_at).toLocaleString("uz-UZ")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEVELS TAB ── */}
        <TabsContent value="levels" className="mt-4 space-y-4">
          {/* Level form card */}
          {levelFormOpen ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingLevel ? "Darajani tahrirlash" : "Yangi daraja qo'shish"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Daraja nomi *</Label>
                    <Input
                      placeholder="Masalan: Asosiy, Chuqur, Olimpiya"
                      value={levelForm.name ?? ""}
                      onChange={e => setLevelForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dars narxi (so'm) *</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={levelForm.lesson_price ?? ""}
                      onChange={e => setLevelForm(f => ({ ...f, lesson_price: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={levelForm.is_active ?? true}
                    onCheckedChange={v => setLevelForm(f => ({ ...f, is_active: v }))}
                  />
                  <Label>Faol</Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveLevel} disabled={savingLevel}>
                    {savingLevel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingLevel ? "Saqlash" : "Yaratish"}
                  </Button>
                  <Button variant="outline" onClick={cancelLevelForm} disabled={savingLevel}>
                    Bekor qilish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={openCreateLevel} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Yangi daraja qo'shish
            </Button>
          )}

          {/* Levels list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-5 h-5" />
                Darajalar ro'yxati
              </CardTitle>
            </CardHeader>
            <CardContent>
              {levelsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : levels.length === 0 ? (
                <div className="text-center py-10">
                  <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Hali daraja qo'shilmagan</p>
                  <p className="text-gray-400 text-xs mt-1">Yuqoridagi tugma orqali daraja qo'shing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {levels.map(level => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{level.name}</p>
                          <p className="text-xs text-gray-500">
                            {level.lesson_price.toLocaleString("uz-UZ")} so'm / dars
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {level.is_active ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Faol</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditLevel(level)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDeleteLevelConfirm(level)}
                          disabled={deletingLevelId === level.id}
                        >
                          {deletingLevelId === level.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CLASSES TAB ── */}
        <TabsContent value="classes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="w-5 h-5" />
                  Biriktirilgan sinflar
                </CardTitle>
                <Button size="sm" onClick={() => setAssignOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Sinfga biriktirish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {classSubjects.length === 0 ? (
                <div className="text-center py-10">
                  <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Bu fan hech qaysi sinfga biriktirilmagan</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setAssignOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Sinfga biriktirish
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sinf</TableHead>
                        <TableHead>Daraja</TableHead>
                        <TableHead>O'qituvchi</TableHead>
                        <TableHead>Maosh turi</TableHead>
                        <TableHead>Maosh miqdori</TableHead>
                        <TableHead>Holat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classSubjects.map(cs => (
                        <TableRow key={cs.id}>
                          <TableCell className="font-medium">{cs.class_name}</TableCell>
                          <TableCell>
                            {cs.subject_level ? (
                              <div>
                                <p className="text-sm font-medium">{cs.subject_level.name}</p>
                                <p className="text-xs text-gray-500">
                                  {cs.subject_level.lesson_price.toLocaleString("uz-UZ")} so'm
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {cs.teacher ? (
                              <div>
                                <p className="text-sm font-medium">{cs.teacher.full_name}</p>
                                <p className="text-xs text-gray-500">{cs.teacher.phone_number}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Belgilanmagan</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {cs.teacher_salary_type === 'percentage' ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <Percent className="w-3.5 h-3.5 text-blue-500" />
                                Foiz
                              </div>
                            ) : cs.teacher_salary_type === 'per_lesson' ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <Calculator className="w-3.5 h-3.5 text-green-500" />
                                Dars uchun
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {cs.teacher_salary_value != null ? (
                              <span className="font-medium text-sm">
                                {cs.teacher_salary_type === 'percentage'
                                  ? `${cs.teacher_salary_value}%`
                                  : `${cs.teacher_salary_value.toLocaleString("uz-UZ")} so'm`
                                }
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {cs.is_active ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Faol</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teachers summary */}
          {(subject.teachers?.length ?? 0) > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5" />
                  O'qituvchilar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {subject.teachers!.map(t => (
                    <div key={t.id} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                        {t.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.full_name || t.phone_number}</p>
                        <p className="text-xs text-gray-500">{t.phone_number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit subject dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Fanni tahrirlash
            </DialogTitle>
            <DialogDescription>Fan ma'lumotlarini yangilang</DialogDescription>
          </DialogHeader>
          <EditSubjectForm
            branchId={branchId}
            subject={subject}
            onSuccess={() => {
              setEditOpen(false);
              loadSubject();
              toast.success("Fan yangilandi");
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Assign to class dialog */}
      <Dialog open={assignOpen} onOpenChange={open => { setAssignOpen(open); if (!open) setAssignForm({ class_id: '', subject_level: '', teacher: '', hours_per_week: 2, is_active: true, teacher_salary_type: '', teacher_salary_value: '' }); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              Sinfga biriktirish
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium" style={{ color: subject?.color || '#2563eb' }}>{subject?.name}</span> fanini sinfga biriktiring
            </DialogDescription>
          </DialogHeader>
          <Separator />

          {assignLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sinf */}
              <div className="space-y-1.5">
                <Label>Sinf <span className="text-red-500">*</span></Label>
                <Select value={assignForm.class_id} onValueChange={v => setAssignForm(f => ({ ...f, class_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Daraja */}
              <div className="space-y-1.5">
                <Label>Daraja <span className="text-red-500">*</span></Label>
                <Select value={assignForm.subject_level} onValueChange={v => setAssignForm(f => ({ ...f, subject_level: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={levels.length === 0 ? "Daraja yo'q" : "Darajani tanlang"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(lv => (
                      <SelectItem key={lv.id} value={lv.id}>
                        {lv.name} — {lv.lesson_price.toLocaleString("uz-UZ")} so'm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* O'qituvchi */}
              <div className="space-y-1.5">
                <Label>O'qituvchi</Label>
                <Select value={assignForm.teacher || "_none"} onValueChange={v => setAssignForm(f => ({ ...f, teacher: v === "_none" ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">O'qituvchisiz</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.user_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Haftalik soat */}
              <div className="space-y-1.5">
                <Label>Haftalik soat <span className="text-red-500">*</span></Label>
                <Input
                  type="number" min={1} max={20}
                  value={assignForm.hours_per_week}
                  onChange={e => setAssignForm(f => ({ ...f, hours_per_week: Number(e.target.value) }))}
                />
              </div>

              {/* Maosh (o'qituvchi tanlanganda) */}
              {assignForm.teacher && assignForm.teacher !== '_none' && (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maosh sozlamalari</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Maosh turi</Label>
                      <Select
                        value={assignForm.teacher_salary_type || "_none"}
                        onValueChange={v => setAssignForm(f => ({ ...f, teacher_salary_type: v === '_none' ? '' : v as 'percentage' | 'per_lesson' }))}
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
                    {assignForm.teacher_salary_type && (
                      <div className="space-y-1.5">
                        <Label>{assignForm.teacher_salary_type === 'percentage' ? 'Foiz (%)' : "Summa (so'm)"}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={assignForm.teacher_salary_type === 'percentage' ? 100 : undefined}
                          placeholder={assignForm.teacher_salary_type === 'percentage' ? "40" : "50000"}
                          value={assignForm.teacher_salary_value}
                          onChange={e => setAssignForm(f => ({ ...f, teacher_salary_value: e.target.value === '' ? '' : Number(e.target.value) }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={assignForm.is_active}
                  onCheckedChange={v => setAssignForm(f => ({ ...f, is_active: v }))}
                />
                <Label>Faol</Label>
              </div>
            </div>
          )}

          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || !assignForm.class_id || !assignForm.subject_level}
            >
              {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Biriktirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete level confirm */}
      <AlertDialog
        open={!!deleteLevelConfirm}
        onOpenChange={open => { if (!open) setDeleteLevelConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darajani o'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">"{deleteLevelConfirm?.name}"</span> darajasi o'chiriladi.
              Bu amalni ortga qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLevelConfirm && handleDeleteLevel(deleteLevelConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
