"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { schoolApi } from "@/lib/api";
import { scheduleApi } from "@/lib/features/schedule/api";
import { useCompleteLesson, useCancelLesson } from "@/lib/features/schedule/hooks";
import type { Group, GroupMembership, Student } from "@/types";
import type { LessonInstance } from "@/types/academic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Trash2,
  Search,
  Loader2,
  ArrowLeft,
  GraduationCap,
  User,
  BookOpen,
  DollarSign,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  X,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { formatCurrency } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── constants ─────────────────────────────────────────────────────────────────

const ATTENDANCE_STATUSES = [
  { value: "present",  label: "Keldi",    color: "bg-green-100 text-green-700" },
  { value: "absent",   label: "Kelmadi",  color: "bg-red-100 text-red-700" },
  { value: "late",     label: "Kechikdi", color: "bg-yellow-100 text-yellow-700" },
  { value: "excused",  label: "Sababli",  color: "bg-blue-100 text-blue-700" },
  { value: "sick",     label: "Kasal",    color: "bg-purple-100 text-purple-700" },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string, display?: string | null) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-0 text-xs">{display ?? "Yakunlangan"}</Badge>;
    case "cancelled":
    case "canceled":
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs">{display ?? "Bekor qilindi"}</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{display ?? "Rejalashtirilgan"}</Badge>;
  }
}

function AttendanceStatusCell({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;
  const s = ATTENDANCE_STATUSES.find((x) => x.value === status);
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${s?.color ?? "bg-gray-100 text-gray-600"}`}>
      {s?.label ?? status}
    </span>
  );
}

const UZ_DAYS = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];
function formatDateUz(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id ?? "";
  const groupId = params.id as string;
  const userRole = currentBranch?.role ?? "";
  const isAdmin = ["branch_admin", "super_admin"].includes(userRole);

  // ── Data queries ─────────────────────────────────────────────────────────

  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["group", branchId, groupId],
    queryFn: () => schoolApi.getGroup(branchId, groupId),
    enabled: !!branchId && !!groupId,
  });

  // A'zolar tab uchun: sahifalangan + qidiruv
  const [memberPage, setMemberPage] = React.useState(1);
  const [memberSearch, setMemberSearch] = React.useState("");
  const debouncedMemberSearch = useDebounce(memberSearch, 300);
  const PAGE_SIZE = 20;

  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ["group-members", branchId, groupId, memberPage, debouncedMemberSearch],
    queryFn: () => schoolApi.getGroupMembersPaged(branchId, groupId, {
      page: memberPage,
      page_size: PAGE_SIZE,
      search: debouncedMemberSearch || undefined,
    }),
    enabled: !!branchId && !!groupId,
  });
  const membersPage = membersData?.results ?? [];
  const memberCount = membersData?.count ?? 0;
  const memberTotalPages = Math.ceil(memberCount / PAGE_SIZE);

  // Journal/Moliya/Davomat uchun: hammasi (limit yuqori)
  const { data: allMembersData, isLoading: allMembersLoading } = useQuery({
    queryKey: ["group-members-all", branchId, groupId],
    queryFn: () => schoolApi.getGroupMembersPaged(branchId, groupId, { page_size: 500 }),
    enabled: !!branchId && !!groupId,
  });
  const allMembers = allMembersData?.results ?? [];

  // Arxiv: o'chirilgan a'zolar
  const [activeTab, setActiveTab] = React.useState("members");
  const { data: archivedData, isLoading: archivedLoading } = useQuery({
    queryKey: ["group-members-archived", branchId, groupId],
    queryFn: () => schoolApi.getGroupMembersPaged(branchId, groupId, { include_removed: true, page_size: 500 }),
    enabled: !!branchId && !!groupId && activeTab === "archive",
  });
  const archivedMembers = (archivedData?.results ?? []).filter((m) => m.deleted_at != null);

  const { data: lessonsData, isLoading: lessonsLoading, refetch: refetchLessons } = useQuery({
    queryKey: ["group-lessons", branchId, groupId],
    queryFn: () => scheduleApi.getLessonInstances(branchId, { group_id: groupId }),
    enabled: !!branchId && !!groupId,
  });
  const lessons = (lessonsData?.results ?? []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const { data: attendances = [], isLoading: attendancesLoading, refetch: refetchAttendances } = useQuery<any[]>({
    queryKey: ["group-attendances", branchId, groupId],
    queryFn: () => schoolApi.getGroupAttendances(branchId, groupId),
    enabled: !!branchId && !!groupId,
  });

  // ── Add members dialog ────────────────────────────────────────────────────

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState("");
  const debouncedSearch = useDebounce(studentSearch, 300);
  const [selectedStudents, setSelectedStudents] = React.useState<Student[]>([]);

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students", branchId, debouncedSearch],
    queryFn: () => schoolApi.getStudents(branchId, { search: debouncedSearch || undefined, page_size: 50 }),
    enabled: !!branchId && addDialogOpen,
  });

  const memberStudentIds = React.useMemo(
    () => new Set(allMembers.map((m) => m.student)),
    [allMembers]
  );
  const availableStudents = (studentsData?.results ?? []).filter(
    (s) => !memberStudentIds.has(s.id)
  );

  const addMembersMutation = useMutation({
    mutationFn: (ids: string[]) => schoolApi.addGroupMembers(branchId, groupId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", branchId, groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", branchId, groupId] });
      toast.success(`${selectedStudents.length} ta o'quvchi guruhga qo'shildi`);
      setAddDialogOpen(false);
      setSelectedStudents([]);
      setStudentSearch("");
    },
    onError: (err: any) => toast.error(extractApiError(err) ?? "Qo'shishda xatolik"),
  });

  const toggleStudent = (student: Student) => {
    setSelectedStudents((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  };

  // ── Remove member ─────────────────────────────────────────────────────────

  const [removeTarget, setRemoveTarget] = React.useState<GroupMembership | null>(null);

  const removeMutation = useMutation({
    mutationFn: (id: string) => schoolApi.removeGroupMember(branchId, groupId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", branchId, groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", branchId, groupId] });
      toast.success(`${removeTarget?.student_name} guruhdan chiqarildi`);
      setRemoveTarget(null);
    },
    onError: (err: any) => toast.error(extractApiError(err) ?? "Chiqarishda xatolik"),
  });

  // ── Add lesson ────────────────────────────────────────────────────────────

  const [addLessonOpen, setAddLessonOpen] = React.useState(false);
  const [lessonForm, setLessonForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    start_time: "08:00",
    end_time: "08:45",
    lesson_number: "1",
    topic: "",
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => scheduleApi.createLessonInstance(branchId, data),
    onSuccess: () => {
      toast.success("Dars qo'shildi");
      setAddLessonOpen(false);
      queryClient.invalidateQueries({ queryKey: ["group-lessons", branchId, groupId] });
    },
    onError: (err: any) => toast.error(extractApiError(err) ?? "Dars qo'shishda xatolik"),
  });

  // ── Complete / Cancel lesson ──────────────────────────────────────────────

  const [lessonAction, setLessonAction] = React.useState<{ lesson: LessonInstance; type: "complete" | "cancel" } | null>(null);
  const [attendanceCount, setAttendanceCount] = React.useState("");

  const completeMutation = useCompleteLesson(branchId);
  const cancelMutation = useCancelLesson(branchId);

  const handleCompleteConfirm = () => {
    if (!lessonAction || lessonAction.type !== "complete") return;
    completeMutation.mutate(
      { id: lessonAction.lesson.id, data: { attendance_count: attendanceCount ? Number(attendanceCount) : undefined } },
      { onSuccess: () => { setLessonAction(null); setAttendanceCount(""); refetchLessons(); } }
    );
  };

  const handleCancelConfirm = () => {
    if (!lessonAction || lessonAction.type !== "cancel") return;
    cancelMutation.mutate(
      { id: lessonAction.lesson.id },
      { onSuccess: () => { setLessonAction(null); refetchLessons(); } }
    );
  };

  // ── Attendance (Journal) ──────────────────────────────────────────────────

  const [attendanceDialogLesson, setAttendanceDialogLesson] = React.useState<any | null>(null);
  const [attendanceForm, setAttendanceForm] = React.useState<Record<string, string>>({});

  const openAttendanceDialog = (lesson: any) => {
    const initial: Record<string, string> = {};
    const existingAtt = attendances.find(
      (a: any) => a.lesson === lesson.id || (a.date === lesson.date && a.lesson_number === lesson.lesson_number)
    );
    allMembers.forEach((m) => {
      const rec = existingAtt?.records?.find((r: any) => r.student === m.student);
      initial[m.student] = rec?.status ?? "present";
    });
    setAttendanceForm(initial);
    setAttendanceDialogLesson({ lesson, existingAtt });
  };

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => schoolApi.bulkMarkGroupAttendance(branchId, data),
    onSuccess: () => {
      toast.success("Davomat saqlandi");
      setAttendanceDialogLesson(null);
      queryClient.invalidateQueries({ queryKey: ["group-attendances", branchId, groupId] });
    },
    onError: (err: any) => toast.error(extractApiError(err) ?? "Davomatni saqlashda xatolik"),
  });

  const handleMarkAttendance = () => {
    if (!attendanceDialogLesson) return;
    const { lesson, existingAtt } = attendanceDialogLesson;
    markAttendanceMutation.mutate({
      group_id: groupId,
      date: lesson.date,
      lesson_number: lesson.lesson_number ?? 1,
      lesson_id: lesson.id,
      records: allMembers.map((m) => ({
        student_id: m.student,
        status: attendanceForm[m.student] ?? "present",
      })),
    });
  };

  // ── Finance stats ─────────────────────────────────────────────────────────

  const financeStats = React.useMemo(() => {
    const positive = allMembers.filter((m) => (m.student_balance ?? 0) > 0);
    const negative = allMembers.filter((m) => (m.student_balance ?? 0) < 0);
    const zero = allMembers.filter((m) => (m.student_balance ?? 0) === 0);
    const totalDebt = negative.reduce((s, m) => s + Math.abs(m.student_balance ?? 0), 0);
    const totalPrepaid = positive.reduce((s, m) => s + (m.student_balance ?? 0), 0);
    return { positive, negative, zero, totalDebt, totalPrepaid };
  }, [allMembers]);

  // ── Journal matrix ────────────────────────────────────────────────────────

  const journalLessons = React.useMemo(() =>
    [...lessons].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [lessons]
  );

  // Pagination handler
  const handleMemberSearchChange = (v: string) => {
    setMemberSearch(v);
    setMemberPage(1);
  };

  function getAttendanceForLesson(lessonId: string, date: string, lessonNumber: number | undefined) {
    return attendances.find(
      (a: any) => a.lesson === lessonId || (a.date === date && a.lesson_number === lessonNumber)
    );
  }

  function getStudentStatus(att: any, studentId: string): string | undefined {
    if (!att) return undefined;
    return att.records?.find((r: any) => r.student === studentId)?.status;
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-gray-500">Guruh topilmadi</p>
        <Button variant="outline" onClick={() => router.push("/school/groups")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/school/groups")} className="p-1.5 h-auto">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.is_active ? (
              <Badge className="bg-green-100 text-green-800">Faol</Badge>
            ) : (
              <Badge variant="secondary">Nofaol</Badge>
            )}
          </div>
          {group.description && <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Fan / Daraja</p>
              {group.subject_level_detail ? (
                <>
                  <p className="font-medium text-sm truncate">{group.subject_level_detail.subject_name}</p>
                  <p className="text-xs text-gray-500 truncate">{group.subject_level_detail.name}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Belgilanmagan</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Dars narxi</p>
              <p className="font-bold text-base">
                {group.subject_level_detail
                  ? formatCurrency(group.subject_level_detail.lesson_price)
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="w-8 h-8 text-purple-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">O'qituvchi</p>
              <p className="font-medium text-sm truncate">{group.teacher_name ?? "Belgilanmagan"}</p>
              {group.teacher_salary_type && (
                <p className="text-xs text-gray-400">
                  {group.teacher_salary_type === "percentage"
                    ? `${group.teacher_salary_value ?? "?"}% (foiz)`
                    : `${formatCurrency(group.teacher_salary_value ?? 0)}/dars`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">O'quvchilar</p>
              <p className="font-bold text-xl">
                {group.members_count}
                <span className="text-sm text-gray-400 font-normal"> / {group.max_students}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-1.5" />
            A'zolar
            {memberCount > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{memberCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <CalendarDays className="w-4 h-4 mr-1.5" />
            Darslar
            {lessons.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">{lessons.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="journal">
            <ClipboardList className="w-4 h-4 mr-1.5" />
            Jurnal
          </TabsTrigger>
          <TabsTrigger value="finance">
            <Wallet className="w-4 h-4 mr-1.5" />
            Moliya
          </TabsTrigger>
          <TabsTrigger value="archive">
            <X className="w-4 h-4 mr-1.5" />
            Arxiv
          </TabsTrigger>
        </TabsList>

        {/* ── A'ZOLAR TAB ── */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">Guruh a'zolari</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Ism, telefon..."
                      value={memberSearch}
                      onChange={(e) => handleMemberSearchChange(e.target.value)}
                      className="pl-8 h-9 w-48"
                    />
                    {memberSearch && (
                      <button onClick={() => handleMemberSearchChange("")} className="absolute right-2 top-2.5">
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedStudents([]);
                      setStudentSearch("");
                      setAddDialogOpen(true);
                    }}
                    disabled={group.members_count >= group.max_students}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Qo'shish
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {membersLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : membersPage.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {memberSearch ? "Qidiruv bo'yicha natija topilmadi" : "Guruhda hali o'quvchi yo'q"}
                  </p>
                  {!memberSearch && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      O'quvchi qo'shish
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-right">Balans</TableHead>
                      <TableHead>Qo'shilgan</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersPage.map((member, idx) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-gray-400 text-sm">{(memberPage - 1) * PAGE_SIZE + idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/school/students/${member.student}`}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {member.student_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {member.student_phone ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-medium ${
                              (member.student_balance ?? 0) > 0
                                ? "text-green-600"
                                : (member.student_balance ?? 0) < 0
                                ? "text-red-600"
                                : "text-gray-400"
                            }`}
                          >
                            {formatCurrency(member.student_balance ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarDays className="w-3 h-3" />
                            {formatDateUz(member.enrollment_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.is_active ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Faol</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setRemoveTarget(member)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {/* Pagination */}
              {memberTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                  <span className="text-gray-500">Jami: {memberCount} ta</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMemberPage((p) => p - 1)}
                      disabled={memberPage === 1}
                    >
                      ‹ Oldingi
                    </Button>
                    <span className="text-gray-600 min-w-[60px] text-center">
                      {memberPage} / {memberTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMemberPage((p) => p + 1)}
                      disabled={memberPage >= memberTotalPages}
                    >
                      Keyingi ›
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DARSLAR TAB ── */}
        <TabsContent value="lessons" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Darslar jadvali</CardTitle>
                {isAdmin && (
                  <Button size="sm" onClick={() => setAddLessonOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Dars qo'shish
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lessonsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Bu guruh uchun darslar yo'q</p>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddLessonOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Dars qo'shish
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Vaqt</TableHead>
                      <TableHead>Dars №</TableHead>
                      <TableHead>Mavzu</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Davomat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((lesson) => {
                      const att = getAttendanceForLesson(lesson.id, lesson.date, lesson.lesson_number);
                      return (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <div className="text-sm font-medium">{formatDateUz(lesson.date)}</div>
                            <div className="text-xs text-gray-400">
                              {UZ_DAYS[new Date(lesson.date).getDay()]}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {lesson.start_time?.substring(0, 5)} – {lesson.end_time?.substring(0, 5)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-gray-700">
                            #{lesson.lesson_number}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">
                            {lesson.topic_title ?? <span className="text-gray-300">—</span>}
                          </TableCell>
                          <TableCell>{statusBadge(lesson.status, lesson.status_display)}</TableCell>
                          <TableCell>
                            {att ? (
                              <div className="text-xs text-gray-600">
                                <span className="text-green-600 font-medium">{att.present_count}</span>
                                <span className="text-gray-400 mx-0.5">/</span>
                                <span>{att.total_count}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2"
                                onClick={() => openAttendanceDialog(lesson)}
                              >
                                <ClipboardList className="w-3 h-3 mr-1" />
                                Davomat
                              </Button>
                              {lesson.status === "planned" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-7 text-xs px-2"
                                    onClick={() => { setLessonAction({ lesson, type: "complete" }); setAttendanceCount(""); }}
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Yakunla
                                  </Button>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-200 h-7 text-xs px-2"
                                      onClick={() => setLessonAction({ lesson, type: "cancel" })}
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── JURNAL TAB ── */}
        <TabsContent value="journal" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Davomat jurnali</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allMembersLoading || lessonsLoading || attendancesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : allMembers.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">Guruhda o'quvchi yo'q</div>
              ) : journalLessons.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">Darslar yo'q</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-white z-10 min-w-[160px]">O'quvchi</TableHead>
                        {journalLessons.map((l) => (
                          <TableHead key={l.id} className="text-center min-w-[70px] text-xs">
                            <div className="font-medium">{formatDateUz(l.date)}</div>
                            <div className="text-gray-400">#{l.lesson_number}</div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[60px]">Jami</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMembers.map((member) => {
                        let presentCount = 0;
                        const cells = journalLessons.map((l) => {
                          const att = getAttendanceForLesson(l.id, l.date, l.lesson_number);
                          const status = getStudentStatus(att, member.student);
                          if (status === "present" || status === "late") presentCount++;
                          return { lessonId: l.id, status };
                        });
                        return (
                          <TableRow key={member.id}>
                            <TableCell className="sticky left-0 bg-white z-10 font-medium text-sm py-2">
                              <Link
                                href={`/school/students/${member.student}`}
                                className="hover:text-primary hover:underline"
                              >
                                {member.student_name}
                              </Link>
                            </TableCell>
                            {cells.map(({ lessonId, status }) => (
                              <TableCell key={lessonId} className="text-center py-2">
                                <AttendanceStatusCell status={status} />
                              </TableCell>
                            ))}
                            <TableCell className="text-center text-sm font-medium text-gray-700">
                              {presentCount}/{journalLessons.length}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {ATTENDANCE_STATUSES.map((s) => (
              <div key={s.value} className="flex items-center gap-1.5">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-300 text-xs">—</span>
              <span className="text-xs text-gray-500">Belgilanmagan</span>
            </div>
          </div>
        </TabsContent>

        {/* ── MOLIYA TAB ── */}
        <TabsContent value="finance" className="mt-4 space-y-4">
          {allMembersLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Ijobiy balans</p>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{financeStats.positive.length}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(financeStats.totalPrepaid)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Sifr balans</p>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold">{financeStats.zero.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Hisob-kitob yo'q</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Qarzdorlar</p>
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{financeStats.negative.length}</p>
                    <p className="text-xs text-gray-500 mt-1">—{formatCurrency(financeStats.totalDebt)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Jami a'zo</p>
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold">{allMembers.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Guruhda jami</p>
                  </CardContent>
                </Card>
              </div>

              {financeStats.negative.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {financeStats.negative.length} ta o'quvchi qarzdor
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Jami qarz: {formatCurrency(financeStats.totalDebt)}
                    </p>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">O'quvchilar moliyaviy holati</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {allMembers.length === 0 ? (
                    <p className="text-center py-10 text-sm text-gray-500">O'quvchilar qo'shilmagan</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>O'quvchi</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead className="text-right">Balans</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...allMembers]
                          .sort((a, b) => (a.student_balance ?? 0) - (b.student_balance ?? 0))
                          .map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">
                                <Link
                                  href={`/school/students/${m.student}`}
                                  className="hover:text-primary hover:underline"
                                >
                                  {m.student_name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {m.student_phone ?? "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`text-sm font-medium ${
                                    (m.student_balance ?? 0) > 0
                                      ? "text-green-600"
                                      : (m.student_balance ?? 0) < 0
                                      ? "text-red-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {formatCurrency(m.student_balance ?? 0)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── ARXIV TAB ── */}
        <TabsContent value="archive" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chiqarilgan a'zolar tarixi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {archivedLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : archivedMembers.length === 0 ? (
                <div className="text-center py-12">
                  <X className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Chiqarilgan a'zolar yo'q</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Qo'shilgan</TableHead>
                      <TableHead>Chiqarilgan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          <Link href={`/school/students/${m.student}`} className="hover:text-primary hover:underline">
                            {m.student_name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{m.student_phone ?? "—"}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDateUz(m.enrollment_date)}</TableCell>
                        <TableCell className="text-sm text-red-500">
                          {m.deleted_at ? formatDateUz(m.deleted_at) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Members Dialog ── */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(o) => {
          if (!o) { setSelectedStudents([]); setStudentSearch(""); }
          setAddDialogOpen(o);
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>O'quvchilarni tanlash</DialogTitle>
            <DialogDescription>
              Guruhga qo'shish uchun o'quvchilarni belgilang
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            {/* Search + selected tags */}
            <div className="space-y-2">
              <div className="relative flex flex-wrap items-center gap-1.5 min-h-10 border rounded-md px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-ring">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                {selectedStudents.map((st) => (
                  <span
                    key={st.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-primary/10 text-primary"
                  >
                    {st.full_name}
                    <button onClick={() => setSelectedStudents((s) => s.filter((x) => x.id !== st.id))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 min-w-[100px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
                  placeholder="Ism yoki telefon..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              {selectedStudents.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedStudents.length} ta tanlandi</p>
              )}
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {studentsLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  {debouncedSearch ? "O'quvchi topilmadi" : "Qo'shish uchun o'quvchi yo'q"}
                </div>
              ) : (
                availableStudents.map((st) => {
                  const selected = selectedStudents.some((s) => s.id === st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      }`}
                      onClick={() => toggleStudent(st)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            selected ? "bg-primary" : "bg-gray-400"
                          }`}
                        >
                          {(st.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{st.full_name}</p>
                          <p className="text-xs text-gray-500">{st.phone_number}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => addMembersMutation.mutate(selectedStudents.map((s) => s.id))}
              disabled={addMembersMutation.isPending || selectedStudents.length === 0}
            >
              {addMembersMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Qo'shilmoqda...</>
              ) : (
                `Qo'shish${selectedStudents.length > 0 ? ` (${selectedStudents.length})` : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Davomat olish Dialog ── */}
      <Dialog
        open={!!attendanceDialogLesson}
        onOpenChange={(o) => { if (!o) setAttendanceDialogLesson(null); }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Davomat olish</DialogTitle>
            <DialogDescription>
              {attendanceDialogLesson &&
                `${formatDateUz(attendanceDialogLesson.lesson.date)} — ${attendanceDialogLesson.lesson.lesson_number}-dars`}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {allMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 py-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.student_name}</p>
                </div>
                <Select
                  value={attendanceForm[member.student] ?? "present"}
                  onValueChange={(v) =>
                    setAttendanceForm((f) => ({ ...f, [member.student]: v }))
                  }
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceDialogLesson(null)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleMarkAttendance}
              disabled={markAttendanceMutation.isPending || allMembers.length === 0}
            >
              {markAttendanceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Lesson Dialog ── */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dars qo'shish</DialogTitle>
            <DialogDescription>{group.name} guruhiga yangi dars</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Sana</Label>
              <Input
                type="date"
                value={lessonForm.date}
                onChange={(e) => setLessonForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Boshlanish</Label>
                <Input
                  type="time"
                  value={lessonForm.start_time}
                  onChange={(e) => setLessonForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tugash</Label>
                <Input
                  type="time"
                  value={lessonForm.end_time}
                  onChange={(e) => setLessonForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Dars raqami</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={lessonForm.lesson_number}
                onChange={(e) => setLessonForm((f) => ({ ...f, lesson_number: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Mavzu (ixtiyoriy)</Label>
              <Input
                placeholder="Dars mavzusi..."
                value={lessonForm.topic}
                onChange={(e) => setLessonForm((f) => ({ ...f, topic: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLessonOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={() =>
                createLessonMutation.mutate({
                  group: groupId,
                  date: lessonForm.date,
                  start_time: `${lessonForm.start_time}:00`,
                  end_time: `${lessonForm.end_time}:00`,
                  lesson_number: Number(lessonForm.lesson_number),
                  topic: lessonForm.topic || undefined,
                  status: "planned",
                })
              }
              disabled={createLessonMutation.isPending}
            >
              {createLessonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Member Confirm ── */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'quvchini guruhdan chiqarish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{removeTarget?.student_name}</span> ni guruhdan
              chiqarishni tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
              disabled={removeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Chiqarish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Complete Lesson ── */}
      <AlertDialog
        open={lessonAction?.type === "complete"}
        onOpenChange={(o) => { if (!o) { setLessonAction(null); setAttendanceCount(""); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni yakunlash</AlertDialogTitle>
            <AlertDialogDescription>
              {lessonAction?.lesson.date} sanasidagi dars yakunlangan deb belgilanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-sm font-medium">Davomat (ixtiyoriy)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Kelgan o'quvchilar soni"
              value={attendanceCount}
              onChange={(e) => setAttendanceCount(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteConfirm}
              disabled={completeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yakunlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel Lesson ── */}
      <AlertDialog
        open={lessonAction?.type === "cancel"}
        onOpenChange={(o) => { if (!o) setLessonAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni bekor qilish</AlertDialogTitle>
            <AlertDialogDescription>
              {lessonAction?.lesson.date} sanasidagi dars bekor qilinadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Yo'q</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Bekor qilish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
