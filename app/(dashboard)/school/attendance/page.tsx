"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LessonAttendance,
  StudentAttendanceRecord,
  ClassSubject,
  AcademicYear,
  BulkAttendanceMarkRequest,
  AttendanceStatus,
  ClassStudent,
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
import {
  ClipboardList,
  Search,
  Users,
  Lock,
  Unlock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Plus,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  present: {
    label: "Keldi",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  absent: {
    label: "Kelmadi",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  late: {
    label: "Kechikdi",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  excused: {
    label: "Sababli",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  sick: {
    label: "Kasal",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function MarkAttendanceModal({
  open,
  onOpenChange,
  branchId,
  classSubjects,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branchId: string;
  classSubjects: ClassSubject[];
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedCs, setSelectedCs] = useState<string>("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [lessonNumber, setLessonNumber] = useState<string>("1");
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({});

  const { data: classStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["class-students-for-attendance", selectedCs],
    queryFn: async () => {
      if (!selectedCs) return [];
      const cs = classSubjects.find((c) => c.id === selectedCs);
      if (!cs) return [];
      return await schoolApi.getClassStudents(cs.class_obj || "");
    },
    enabled: !!selectedCs,
  });

  useEffect(() => {
    if (classStudents.length > 0) {
      const initial: Record<string, AttendanceStatus> = {};
      classStudents.forEach((s: ClassStudent) => {
        initial[s.student_id] = "present";
      });
      setStudentStatuses(initial);
    }
  }, [classStudents]);

  const markMutation = useMutation({
    mutationFn: (data: BulkAttendanceMarkRequest) =>
      schoolApi.bulkMarkAttendance(branchId, data),
    onSuccess: () => {
      toast.success("Davomat muvaffaqiyatli saqlandi");
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Davomatni saqlashda xatolik");
    },
  });

  const handleSubmit = () => {
    if (!selectedCs || !date) {
      toast.error("Sinf fani va sanani tanlang");
      return;
    }

    const records = Object.entries(studentStatuses).map(([student_id, status]) => ({
      student_id,
      status,
    }));

    if (records.length === 0) {
      toast.error("O'quvchilar topilmadi");
      return;
    }

    markMutation.mutate({
      class_subject_id: selectedCs,
      date,
      lesson_number: Number(lessonNumber),
      records,
    });
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setStudentStatuses((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        updated[k] = status;
      });
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Davomat belgilash
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Sinf fani *</Label>
              <Select value={selectedCs} onValueChange={setSelectedCs}>
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
              <Label>Sana *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Dars raqami</Label>
              <Select value={lessonNumber} onValueChange={setLessonNumber}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}-dars
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCs && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">O'quvchilar davomati</p>
                <div className="flex gap-2">
                  {(["present", "absent"] as AttendanceStatus[]).map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      onClick={() => setAllStatus(s)}
                      className="text-xs"
                    >
                      Hammasini: {STATUS_CONFIG[s].label}
                    </Button>
                  ))}
                </div>
              </div>

              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : classStudents.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bu sinfga o'quvchilar qo'shilmagan yoki ma'lumot yuklanmagan.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {classStudents.map((student: ClassStudent) => {
                    const studentKey = student.student_id;
                    const currentStatus = studentStatuses[studentKey] || "present";
                    return (
                      <div
                        key={studentKey}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                            {(student.student_name || "?")[0]}
                          </div>
                          <span className="text-sm font-medium">{student.student_name}</span>
                        </div>

                        <Select
                          value={currentStatus}
                          onValueChange={(v) =>
                            setStudentStatuses((prev) => ({
                              ...prev,
                              [studentKey]: v as AttendanceStatus,
                            }))
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  {cfg.icon}
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={markMutation.isPending || !selectedCs}>
            {markMutation.isPending ? (
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

export default function AttendancePage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id || "";

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [statsClass, setStatsClass] = useState<string>("");

  const { data: attendancesData, isLoading } = useQuery({
    queryKey: ["attendances", branchId, selectedClass, selectedDate],
    queryFn: () =>
      schoolApi.getAttendances(branchId, {
        class_subject: selectedClass !== "all" ? selectedClass : undefined,
        date: selectedDate || undefined,
        page_size: 100,
      }),
    enabled: !!branchId,
  });

  const { data: classSubjectsData } = useQuery({
    queryKey: ["branch-class-subjects", branchId],
    queryFn: () => schoolApi.getBranchClassSubjects(branchId),
    enabled: !!branchId,
  });

  const { data: classAttendanceStats } = useQuery({
    queryKey: ["class-attendance-stats", branchId, statsClass],
    queryFn: () => schoolApi.getClassAttendanceStats(branchId, statsClass),
    enabled: !!branchId && !!statsClass,
  });

  const lockMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: "lock" | "unlock" }) =>
      schoolApi.lockUnlockAttendance(branchId, ids, action),
    onSuccess: (_, { action }) => {
      toast.success(action === "lock" ? "Davomat bloklandi" : "Blok olib tashlandi");
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  const classSubjects: ClassSubject[] = classSubjectsData?.results || [];
  const attendances = attendancesData?.results || [];

  const filtered = useMemo(() => {
    if (!search) return attendances;
    const q = search.toLowerCase();
    return attendances.filter(
      (a) =>
        (a.class_name || "").toLowerCase().includes(q) ||
        (a.subject_name || "").toLowerCase().includes(q)
    );
  }, [attendances, search]);

  const totalPresent = attendances.reduce((s, a) => s + (a.present_count || 0), 0);
  const totalAbsent = attendances.reduce((s, a) => s + (a.absent_count || 0), 0);
  const totalCount = attendances.reduce((s, a) => s + (a.total_count || 0), 0);
  const attendanceRate =
    totalCount > 0 ? Math.round((totalPresent / totalCount) * 100) : 0;

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
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              Davomat
            </h1>
            <p className="text-blue-100 mt-2">
              O'quvchilar davomatini kuzatish va boshqarish
            </p>
          </div>
          <Button
            onClick={() => setMarkModalOpen(true)}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Davomat belgilash
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{attendances.length}</p>
              <p className="text-xs text-muted-foreground">Jami darslar</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
              <p className="text-xs text-muted-foreground">Keldi</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{totalAbsent}</p>
              <p className="text-xs text-muted-foreground">Kelmadi</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">Davomat foizi</p>
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
                placeholder="Sinf yoki fan nomini qidiring..."
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

            <Input
              type="date"
              className="w-[180px]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              placeholder="Sana bo'yicha"
            />

            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate("")}
                className="text-gray-500"
              >
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Davomat ro'yxati
          </CardTitle>
          <CardDescription>{filtered.length} ta yozuv topildi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Davomat ma'lumotlari topilmadi</p>
              <p className="text-sm text-muted-foreground mt-1">
                Davomat belgilash uchun yuqoridagi tugmani bosing
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setMarkModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Davomat belgilash
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((attendance) => {
                const rate =
                  attendance.total_count && attendance.total_count > 0
                    ? Math.round(((attendance.present_count || 0) / attendance.total_count) * 100)
                    : 0;

                return (
                  <div
                    key={attendance.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">
                            {attendance.class_name} — {attendance.subject_name}
                          </p>
                          {attendance.lesson_number && (
                            <Badge variant="outline" className="text-xs">
                              {attendance.lesson_number}-dars
                            </Badge>
                          )}
                          {attendance.is_locked && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Bloklangan
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(attendance.date), "dd MMMM yyyy, EEEE", { locale: uz })}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Mini stats */}
                        <div className="flex items-center gap-3 text-sm">
                          {attendance.present_count !== undefined && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {attendance.present_count}
                            </span>
                          )}
                          {attendance.absent_count !== undefined && (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-3.5 h-3.5" />
                              {attendance.absent_count}
                            </span>
                          )}
                          {attendance.total_count !== undefined && (
                            <span className="text-muted-foreground">
                              / {attendance.total_count}
                            </span>
                          )}
                        </div>

                        {/* Rate bar */}
                        {attendance.total_count && attendance.total_count > 0 && (
                          <div className="hidden sm:flex items-center gap-2 w-24">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500 transition-all"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 w-8">{rate}%</span>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() =>
                            lockMutation.mutate({
                              ids: [attendance.id],
                              action: attendance.is_locked ? "unlock" : "lock",
                            })
                          }
                          title={attendance.is_locked ? "Blokni olib tashlash" : "Bloklash"}
                        >
                          {attendance.is_locked ? (
                            <Unlock className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Records preview */}
                    {attendance.records && attendance.records.length > 0 && (
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                        {attendance.records.slice(0, 8).map((record: StudentAttendanceRecord) => (
                          <div key={record.id} className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">{record.student_name}</span>
                            <StatusBadge status={record.status} />
                          </div>
                        ))}
                        {attendance.records.length > 8 && (
                          <span className="text-xs text-muted-foreground">
                            +{attendance.records.length - 8} ta
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class Attendance Statistics */}
      {classSubjects.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <BarChart3 className="w-5 h-5" />
              Sinf bo'yicha statistika
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Select value={statsClass} onValueChange={setStatsClass}>
                <SelectTrigger className="flex-1 max-w-[300px]">
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

            {classAttendanceStats && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-blue-800">
                    Jami darslar: {classAttendanceStats.total_lessons}
                  </span>
                  <span className="text-blue-800">
                    O'rtacha davomat: {classAttendanceStats.average_attendance_rate}%
                  </span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {classAttendanceStats.students.map((s) => (
                    <div
                      key={s.student_id}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border"
                    >
                      <span className="text-sm font-medium text-gray-800">{s.student_name}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600 font-medium">{s.present_count}✓</span>
                        <span className="text-red-600 font-medium">{s.absent_count}✗</span>
                        {s.late_count > 0 && (
                          <span className="text-yellow-600">{s.late_count}⏰</span>
                        )}
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.attendance_rate >= 80
                                ? "bg-green-500"
                                : s.attendance_rate >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${s.attendance_rate}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold w-10 text-right ${
                            s.attendance_rate >= 80
                              ? "text-green-600"
                              : s.attendance_rate >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {s.attendance_rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        open={markModalOpen}
        onOpenChange={setMarkModalOpen}
        branchId={branchId}
        classSubjects={classSubjects}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["attendances"] })}
      />
    </div>
  );
}
