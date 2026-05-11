"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Assessment,
  AssessmentType,
  Grade,
  QuarterGrade,
  Class,
  ClassSubject,
  Quarter,
  AcademicYear,
  CreateAssessmentRequest,
  BulkGradeCreateRequest,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  Plus,
  Search,
  BookOpen,
  Users,
  Lock,
  Unlock,
  Calculator,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

const GRADE_COLORS: Record<number, string> = {
  5: "bg-green-100 text-green-700 border-green-300",
  4: "bg-blue-100 text-blue-700 border-blue-300",
  3: "bg-yellow-100 text-yellow-700 border-yellow-300",
  2: "bg-red-100 text-red-700 border-red-300",
  1: "bg-gray-100 text-gray-700 border-gray-300",
};

function getGradeBadge(score: number) {
  const rounded = Math.round(score);
  const cls = GRADE_COLORS[rounded] || GRADE_COLORS[1];
  return <span className={`px-2 py-0.5 rounded border text-xs font-bold ${cls}`}>{score}</span>;
}

function AssessmentForm({
  branchId,
  classSubjects,
  assessmentTypes,
  quarters,
  initial,
  onSubmit,
  submitting,
}: {
  branchId: string;
  classSubjects: ClassSubject[];
  assessmentTypes: AssessmentType[];
  quarters: Quarter[];
  initial?: Partial<CreateAssessmentRequest>;
  onSubmit: (data: CreateAssessmentRequest) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<Partial<CreateAssessmentRequest>>({
    class_subject: initial?.class_subject || "",
    assessment_type: initial?.assessment_type || "",
    quarter: initial?.quarter || "",
    title: initial?.title || "",
    description: initial?.description || "",
    date: initial?.date || format(new Date(), "yyyy-MM-dd"),
    max_score: initial?.max_score || 10,
    weight: initial?.weight || 1,
    notes: initial?.notes || "",
  });

  const handleChange = (field: keyof CreateAssessmentRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_subject || !form.assessment_type || !form.quarter || !form.title || !form.date) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    onSubmit(form as CreateAssessmentRequest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Sinf fani *</Label>
          <Select value={form.class_subject} onValueChange={(v) => handleChange("class_subject", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sinf fanini tanlang" />
            </SelectTrigger>
            <SelectContent>
              {classSubjects.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.class_name} — {cs.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Nazorat turi *</Label>
          <Select value={form.assessment_type} onValueChange={(v) => handleChange("assessment_type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Turini tanlang" />
            </SelectTrigger>
            <SelectContent>
              {assessmentTypes.map((at) => (
                <SelectItem key={at.id} value={at.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: at.color }}
                    />
                    {at.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Chorak *</Label>
          <Select value={form.quarter} onValueChange={(v) => handleChange("quarter", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Chorakni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1">
          <Label>Nazorat nomi *</Label>
          <Input
            placeholder="Masalan: 1-chorak yakuniy nazorat"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Sana *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Maksimal ball *</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={form.max_score}
            onChange={(e) => handleChange("max_score", Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <Label>Og'irlik (weight)</Label>
          <Input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={form.weight}
            onChange={(e) => handleChange("weight", Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <Label>Tavsif</Label>
          <Input
            placeholder="Ixtiyoriy tavsif"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saqlanmoqda...
          </>
        ) : (
          "Saqlash"
        )}
      </Button>
    </form>
  );
}

function BulkGradeModal({
  open,
  onOpenChange,
  assessment,
  branchId,
  classSubjects,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assessment: Assessment | null;
  branchId: string;
  classSubjects: ClassSubject[];
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, string>>({});

  const classObjId = classSubjects.find((cs) => cs.id === assessment?.class_subject)?.class_obj;

  const { data: classStudents = [] } = useQuery({
    queryKey: ["class-students-for-grade", classObjId],
    queryFn: () => schoolApi.getClassStudents(classObjId!),
    enabled: open && !!classObjId,
  });

  const { data: existingGrades = [] } = useQuery<Grade[]>({
    queryKey: ["grades-for-assessment", assessment?.id],
    queryFn: async () => {
      if (!assessment?.id) return [];
      const resp = await schoolApi.getGrades(branchId, { assessment: assessment.id, page_size: 200 });
      return resp.results;
    },
    enabled: open && !!assessment?.id,
  });

  useEffect(() => {
    if (existingGrades.length > 0) {
      const map: Record<string, string> = {};
      existingGrades.forEach((g) => {
        map[g.student] = String(g.score);
      });
      setScores(map);
    }
  }, [existingGrades]);

  const bulkMutation = useMutation({
    mutationFn: (data: BulkGradeCreateRequest) => schoolApi.bulkCreateGrades(branchId, data),
    onSuccess: () => {
      toast.success("Baholar saqlandi");
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["grades-for-assessment"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Baholarni saqlashda xatolik");
    },
  });

  const handleSave = () => {
    if (!assessment) return;
    const grades = Object.entries(scores)
      .filter(([, score]) => score !== "" && !isNaN(Number(score)))
      .map(([student, score]) => ({ student, score: Number(score) }));

    if (grades.length === 0) {
      toast.error("Hech bo'lmasa bitta baho kiriting");
      return;
    }

    bulkMutation.mutate({ assessment: assessment.id, grades });
  };

  if (!assessment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Baholarni kiritish
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {assessment.title} — Maks: {assessment.max_score} ball
          </p>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {classStudents.length === 0 && existingGrades.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bu sinfga o'quvchilar qo'shilmagan yoki ma'lumot yuklanmagan.
              </AlertDescription>
            </Alert>
          )}

          {(classStudents.length > 0 ? classStudents : existingGrades.map((g: Grade) => ({
            student_id: g.student,
            student_name: g.student_name,
          }))).map((s: any) => {
            const studentId = s.student_id;
            const studentName = s.student_name;
            return (
              <div key={studentId} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
                <span className="text-sm font-medium flex-1">{studentName || "O'quvchi"}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={assessment.max_score}
                    step={0.5}
                    className="w-24"
                    value={scores[studentId] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [studentId]: e.target.value }))
                    }
                  />
                  <span className="text-xs text-muted-foreground">/ {assessment.max_score}</span>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave} disabled={bulkMutation.isPending}>
            {bulkMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GradesPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null);
  const [gradeModalAssessment, setGradeModalAssessment] = useState<Assessment | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  // Fetch data
  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["assessments", branchId, selectedClass, selectedQuarter],
    queryFn: () =>
      schoolApi.getAssessments(branchId, {
        class_subject: selectedClass !== "all" ? selectedClass : undefined,
        quarter: selectedQuarter !== "all" ? selectedQuarter : undefined,
        page_size: 100,
      }),
    enabled: !!branchId,
  });

  const { data: classesData } = useQuery({
    queryKey: ["classes", branchId],
    queryFn: () => schoolApi.getClassesPaginated(branchId, { is_active: true, page_size: 100 }),
    enabled: !!branchId,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years", branchId],
    queryFn: () => schoolApi.getAcademicYears(branchId),
    enabled: !!branchId,
  });

  const { data: assessmentTypes = [] } = useQuery({
    queryKey: ["assessment-types", branchId],
    queryFn: () => schoolApi.getAssessmentTypes(branchId),
    enabled: !!branchId,
  });

  const { data: classSubjectsData } = useQuery({
    queryKey: ["branch-class-subjects", branchId],
    queryFn: () => schoolApi.getBranchClassSubjects(branchId),
    enabled: !!branchId,
  });

  const classes = classesData?.results || [];
  const assessments = assessmentsData?.results || [];
  const allQuarters = academicYears.flatMap((y: AcademicYear) => y.quarters || []);
  const classSubjects: ClassSubject[] = classSubjectsData?.results || [];

  // Create assessment mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAssessmentRequest) => schoolApi.createAssessment(branchId, data),
    onSuccess: () => {
      toast.success("Nazorat muvaffaqiyatli yaratildi");
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      setCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteAssessment(branchId, id),
    onSuccess: () => {
      toast.success("Nazorat o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "O'chirishda xatolik");
    },
  });

  const lockMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: "lock" | "unlock" }) =>
      schoolApi.lockUnlockGrades(branchId, ids, action, "assessment"),
    onSuccess: (_, { action }) => {
      toast.success(action === "lock" ? "Nazorat bloklandi" : "Blok olib tashlandi");
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });

  const calculateMutation = useMutation({
    mutationFn: ({ classSubjectId, quarterId }: { classSubjectId: string; quarterId: string }) =>
      schoolApi.calculateQuarterGrades(branchId, classSubjectId, quarterId),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Hisoblashda xatolik");
    },
  });

  const filteredAssessments = useMemo(() => {
    if (!search) return assessments;
    const q = search.toLowerCase();
    return assessments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.class_name || "").toLowerCase().includes(q) ||
        (a.subject_name || "").toLowerCase().includes(q)
    );
  }, [assessments, search]);

  const openGradeModal = (assessment: Assessment) => {
    setGradeModalAssessment(assessment);
    setGradeModalOpen(true);
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Filial tanlanmagan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="w-8 h-8" />
              Baholar
            </h1>
            <p className="text-indigo-100 mt-2">
              Nazorat ishlari va baholarni boshqarish
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yangi nazorat
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Nazorat nomini qidiring..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Barcha sinflar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sinflar</SelectItem>
                {classSubjects.map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.class_name} — {cs.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Barcha choraklar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha choraklar</SelectItem>
                {allQuarters.map((q: Quarter) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{assessments.length}</p>
              <p className="text-xs text-muted-foreground">Jami nazoratlar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {assessments.filter((a) => !a.is_locked).length}
              </p>
              <p className="text-xs text-muted-foreground">Faol nazoratlar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {assessments.filter((a) => a.is_locked).length}
              </p>
              <p className="text-xs text-muted-foreground">Bloklangan</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(assessments.map((a) => a.class_subject)).size}
              </p>
              <p className="text-xs text-muted-foreground">Sinf-fanlar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Nazorat ishlari
          </CardTitle>
          <CardDescription>
            {filteredAssessments.length} ta nazorat topildi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-16">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nazorat ishlari topilmadi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Yangi nazorat qo'shish uchun yuqoridagi tugmani bosing
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nazorat qo'shish
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          assessmentTypes.find((t) => t.id === assessment.assessment_type)?.color ||
                          "#6366f1",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{assessment.title}</p>
                        {assessment.is_locked && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 shrink-0">
                            <Lock className="w-3 h-3 mr-1" />
                            Bloklangan
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {assessment.class_name} — {assessment.subject_name} •{" "}
                        {assessment.quarter_name} •{" "}
                        {format(new Date(assessment.date), "dd MMM yyyy", { locale: uz })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-indigo-600">
                        {assessment.max_score} ball
                      </p>
                      {assessment.average_score !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          O'rta: {Number(assessment.average_score).toFixed(1)}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGradeModal(assessment)}
                      disabled={assessment.is_locked}
                      className="gap-1"
                    >
                      <Award className="w-3 h-3" />
                      Baholar
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() =>
                        lockMutation.mutate({
                          ids: [assessment.id],
                          action: assessment.is_locked ? "unlock" : "lock",
                        })
                      }
                      title={assessment.is_locked ? "Blokni olib tashlash" : "Bloklash"}
                    >
                      {assessment.is_locked ? (
                        <Unlock className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Bu nazoratni o'chirishni tasdiqlaysizmi?")) {
                          deleteMutation.mutate(assessment.id);
                        }
                      }}
                      disabled={assessment.is_locked}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quarter Grade Calculator */}
      {classSubjects.length > 0 && allQuarters.length > 0 && (
        <Card className="border-2 border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Calculator className="w-5 h-5" />
              Chorak baholarini hisoblash
            </CardTitle>
            <CardDescription>
              Tanlangan sinf va chorak uchun barcha o'quvchilarning chorak baholarini avtomatik hisoblash
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuarterGradeCalculator
              classSubjects={classSubjects}
              quarters={allQuarters}
              onCalculate={(csId, qId) =>
                calculateMutation.mutate({ classSubjectId: csId, quarterId: qId })
              }
              calculating={calculateMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Assessment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Yangi nazorat qo'shish
            </DialogTitle>
          </DialogHeader>
          <AssessmentForm
            branchId={branchId}
            classSubjects={classSubjects}
            assessmentTypes={assessmentTypes}
            quarters={allQuarters}
            onSubmit={(data) => createMutation.mutate(data)}
            submitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Grade Modal */}
      <BulkGradeModal
        open={gradeModalOpen}
        onOpenChange={setGradeModalOpen}
        assessment={gradeModalAssessment}
        branchId={branchId}
        classSubjects={classSubjects}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["assessments"] })}
      />
    </div>
  );
}

function QuarterGradeCalculator({
  classSubjects,
  quarters,
  onCalculate,
  calculating,
}: {
  classSubjects: ClassSubject[];
  quarters: Quarter[];
  onCalculate: (classSubjectId: string, quarterId: string) => void;
  calculating: boolean;
}) {
  const [selectedCs, setSelectedCs] = useState<string>("");
  const [selectedQ, setSelectedQ] = useState<string>("");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1 flex-1 min-w-[180px]">
        <Label className="text-indigo-800">Sinf fani</Label>
        <Select value={selectedCs} onValueChange={setSelectedCs}>
          <SelectTrigger>
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            {classSubjects.map((cs) => (
              <SelectItem key={cs.id} value={cs.id}>
                {cs.class_name} — {cs.subject_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 w-[160px]">
        <Label className="text-indigo-800">Chorak</Label>
        <Select value={selectedQ} onValueChange={setSelectedQ}>
          <SelectTrigger>
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            {quarters.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                {q.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => onCalculate(selectedCs, selectedQ)}
        disabled={!selectedCs || !selectedQ || calculating}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {calculating ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Calculator className="w-4 h-4 mr-2" />
        )}
        Hisoblash
      </Button>
    </div>
  );
}
