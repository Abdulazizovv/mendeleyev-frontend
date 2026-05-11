"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Homework,
  HomeworkSubmission,
  ClassSubject,
  CreateHomeworkRequest,
  HomeworkStatus,
  GradeSubmissionRequest,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  Loader2,
  Trash2,
  Eye,
  Award,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { uz } from "date-fns/locale";

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; color: string }> = {
  active: { label: "Faol", color: "bg-green-100 text-green-700 border-green-300" },
  closed: { label: "Yopilgan", color: "bg-gray-100 text-gray-600 border-gray-300" },
  archived: { label: "Arxivlangan", color: "bg-purple-100 text-purple-600 border-purple-300" },
};

const SUBMISSION_STATUS_CONFIG = {
  not_submitted: { label: "Topshirilmagan", color: "text-red-600" },
  submitted: { label: "Topshirilgan", color: "text-blue-600" },
  late: { label: "Kechikkan", color: "text-orange-600" },
  graded: { label: "Baholangan", color: "text-green-600" },
  returned: { label: "Qaytarilgan", color: "text-yellow-600" },
};

function getDueDateInfo(dueDate: string) {
  const date = new Date(dueDate);
  const today = new Date();
  if (isToday(date)) return { text: "Bugun muddati tugaydi", urgent: true };
  if (isPast(date)) {
    const days = differenceInDays(today, date);
    return { text: `Muddat ${days} kun oldin o'tgan`, urgent: true };
  }
  const days = differenceInDays(date, today);
  if (days <= 3) return { text: `${days} kun qoldi`, urgent: true };
  return { text: `${days} kun qoldi`, urgent: false };
};

function HomeworkForm({
  classSubjects,
  initial,
  onSubmit,
  submitting,
}: {
  classSubjects: ClassSubject[];
  initial?: Partial<CreateHomeworkRequest>;
  onSubmit: (data: CreateHomeworkRequest) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<Partial<CreateHomeworkRequest>>({
    class_subject: initial?.class_subject || "",
    title: initial?.title || "",
    description: initial?.description || "",
    assigned_date: initial?.assigned_date || format(new Date(), "yyyy-MM-dd"),
    due_date: initial?.due_date || "",
    allow_late_submission: initial?.allow_late_submission ?? true,
    max_score: initial?.max_score,
    notes: initial?.notes || "",
  });

  const set = (field: keyof CreateHomeworkRequest, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_subject || !form.title || !form.description || !form.due_date) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    onSubmit(form as CreateHomeworkRequest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Sinf fani *</Label>
        <Select value={form.class_subject} onValueChange={(v) => set("class_subject", v)}>
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
        <Label>Vazifa nomi *</Label>
        <Input
          placeholder="Masalan: §5 mashqlar"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Tavsif va yo'riqnoma *</Label>
        <Textarea
          placeholder="Vazifaning batafsil tavsifi..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Berilgan sana *</Label>
          <Input
            type="date"
            value={form.assigned_date}
            onChange={(e) => set("assigned_date", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Topshirish muddati *</Label>
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => set("due_date", e.target.value)}
            min={form.assigned_date}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Maksimal ball (ixtiyoriy)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="Masalan: 10"
            value={form.max_score ?? ""}
            onChange={(e) =>
              set("max_score", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Kechiktirib topshirish</Label>
          <Select
            value={form.allow_late_submission ? "yes" : "no"}
            onValueChange={(v) => set("allow_late_submission", v === "yes")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Ruxsat berilgan</SelectItem>
              <SelectItem value="no">Ruxsat yo'q</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Izoh (ixtiyoriy)</Label>
        <Input
          placeholder="O'qituvchi uchun qo'shimcha eslatma"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
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

function SubmissionsModal({
  open,
  onOpenChange,
  homework,
  branchId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  homework: Homework | null;
  branchId: string;
}) {
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<string>("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ["homework-submissions", homework?.id],
    queryFn: () => schoolApi.getHomeworkSubmissions(branchId, homework!.id),
    enabled: open && !!homework?.id,
  });

  const gradeMutation = useMutation({
    mutationFn: (data: { submissionId: string; gradeData: GradeSubmissionRequest }) =>
      schoolApi.gradeSubmission(branchId, homework!.id, data.submissionId, data.gradeData),
    onSuccess: () => {
      toast.success("Baho saqlandi");
      queryClient.invalidateQueries({ queryKey: ["homework-submissions", homework?.id] });
      queryClient.invalidateQueries({ queryKey: ["homeworks"] });
      setGradingId(null);
      setGradeScore("");
      setGradeFeedback("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Baholashda xatolik");
    },
  });

  const submissions = submissionsData || [];

  if (!homework) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Topshiriqlar
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{homework.title}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">Hali hech kim topshirmagan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub: HomeworkSubmission) => {
              const statusCfg = SUBMISSION_STATUS_CONFIG[sub.status] || SUBMISSION_STATUS_CONFIG.not_submitted;
              const isGrading = gradingId === sub.id;

              return (
                <div key={sub.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{sub.student_name}</p>
                      <p className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</p>
                      {sub.submitted_at && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.submitted_at), "dd MMM HH:mm", { locale: uz })}
                          {sub.is_late && (
                            <span className="ml-1 text-orange-600">(kechikkan)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.score !== undefined && sub.score !== null && (
                        <span className="text-sm font-bold text-green-600">
                          {sub.score}/{homework.max_score}
                        </span>
                      )}
                      {sub.status === "submitted" || sub.status === "late" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGradingId(sub.id);
                            setGradeScore(String(sub.score || ""));
                            setGradeFeedback(sub.teacher_feedback || "");
                          }}
                        >
                          <Award className="w-3.5 h-3.5 mr-1" />
                          Baholash
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {sub.submission_text && (
                    <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                      {sub.submission_text}
                    </p>
                  )}

                  {isGrading && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Ball {homework.max_score ? `(maks: ${homework.max_score})` : ""}</Label>
                          <Input
                            type="number"
                            min={0}
                            max={homework.max_score || undefined}
                            value={gradeScore}
                            onChange={(e) => setGradeScore(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Izoh (ixtiyoriy)</Label>
                          <Input
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            placeholder="Sharh..."
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            gradeMutation.mutate({
                              submissionId: sub.id,
                              gradeData: {
                                score: Number(gradeScore),
                                teacher_feedback: gradeFeedback,
                              },
                            })
                          }
                          disabled={!gradeScore || gradeMutation.isPending}
                        >
                          Saqlash
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setGradingId(null)}
                        >
                          Bekor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function HomeworkPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [submissionsHomework, setSubmissionsHomework] = useState<Homework | null>(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);

  const { data: homeworkData, isLoading } = useQuery({
    queryKey: ["homeworks", branchId, selectedClass, selectedStatus],
    queryFn: () =>
      schoolApi.getHomeworks(branchId, {
        class_subject: selectedClass !== "all" ? selectedClass : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        page_size: 50,
      }),
    enabled: !!branchId,
  });

  const { data: classSubjectsData } = useQuery({
    queryKey: ["branch-class-subjects", branchId],
    queryFn: () => schoolApi.getBranchClassSubjects(branchId),
    enabled: !!branchId,
  });

  const classSubjects: ClassSubject[] = classSubjectsData?.results || [];
  const homeworks = homeworkData?.results || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateHomeworkRequest) => schoolApi.createHomework(branchId, data),
    onSuccess: () => {
      toast.success("Uy vazifasi yaratildi");
      queryClient.invalidateQueries({ queryKey: ["homeworks"] });
      setCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteHomework(branchId, id),
    onSuccess: () => {
      toast.success("Vazifa o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["homeworks"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "O'chirishda xatolik");
    },
  });

  const filtered = useMemo(() => {
    if (!search) return homeworks;
    const q = search.toLowerCase();
    return homeworks.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        (h.class_name || "").toLowerCase().includes(q) ||
        (h.subject_name || "").toLowerCase().includes(q)
    );
  }, [homeworks, search]);

  const openSubmissions = (hw: Homework) => {
    setSubmissionsHomework(hw);
    setSubmissionsOpen(true);
  };

  // Counts
  const activeCount = homeworks.filter((h) => h.status === "active").length;
  const overdueCount = homeworks.filter(
    (h) => h.status === "active" && isPast(new Date(h.due_date))
  ).length;
  const totalSubmissions = homeworks.reduce((s, h) => s + (h.submission_count || 0), 0);

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
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Uy Vazifalari
            </h1>
            <p className="text-amber-100 mt-2">
              O'quvchilar uchun uy vazifalarini boshqarish
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-white text-amber-600 hover:bg-amber-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yangi vazifa
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{homeworks.length}</p>
              <p className="text-xs text-muted-foreground">Jami vazifalar</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Faol</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Muddati o'tgan</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalSubmissions}</p>
              <p className="text-xs text-muted-foreground">Topshiriqlar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Vazifa nomini qidiring..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[220px]">
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Holati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="closed">Yopilgan</SelectItem>
                <SelectItem value="archived">Arxivlangan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Uy vazifalari
          </CardTitle>
          <CardDescription>{filtered.length} ta vazifa</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Uy vazifalari topilmadi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Yangi vazifa qo'shish uchun yuqoridagi tugmani bosing
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Vazifa qo'shish
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((hw) => {
                const dueDateInfo = getDueDateInfo(hw.due_date);
                const statusCfg = STATUS_CONFIG[hw.status] || STATUS_CONFIG.active;
                const completionRate = hw.completion_rate || 0;

                return (
                  <div
                    key={hw.id}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      dueDateInfo.urgent && hw.status === "active"
                        ? "border-orange-200 bg-orange-50/30"
                        : "border-gray-200 hover:border-amber-300 bg-white hover:bg-amber-50/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-base">{hw.title}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border font-medium ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                          {dueDateInfo.urgent && hw.status === "active" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-300 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dueDateInfo.text}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {hw.class_name} — {hw.subject_name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(hw.assigned_date), "dd MMM", { locale: uz })}
                            <ArrowRight className="w-3 h-3" />
                            {format(new Date(hw.due_date), "dd MMM yyyy", { locale: uz })}
                          </span>
                          {hw.max_score && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                {hw.max_score} ball
                              </span>
                            </>
                          )}
                        </p>

                        {hw.description && (
                          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                            {hw.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Submission stats */}
                        {hw.submission_count !== undefined && (
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-blue-600">
                              {hw.submission_count}
                            </p>
                            <p className="text-xs text-muted-foreground">topshiriq</p>
                            {completionRate > 0 && (
                              <p className="text-xs text-green-600">{completionRate}%</p>
                            )}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubmissions(hw)}
                          className="gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ko'rish
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Bu vazifani o'chirishni tasdiqlaysizmi?")) {
                              deleteMutation.mutate(hw.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {completionRate > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {completionRate}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Homework Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              Yangi uy vazifasi
            </DialogTitle>
          </DialogHeader>
          <HomeworkForm
            classSubjects={classSubjects}
            onSubmit={(data) => createMutation.mutate(data)}
            submitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Submissions Modal */}
      <SubmissionsModal
        open={submissionsOpen}
        onOpenChange={setSubmissionsOpen}
        homework={submissionsHomework}
        branchId={branchId}
      />
    </div>
  );
}
