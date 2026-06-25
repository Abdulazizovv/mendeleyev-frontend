'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks';
import { schoolApi } from '@/lib/api';
import { scheduleApi } from '@/lib/features/schedule/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import {
  ArrowLeft, Calendar, Clock, MapPin, BookOpen,
  CheckCircle2, XCircle, Clock3, AlertCircle, Minus,
  Lock, Unlock, Loader2, Users, FileText,
  Ban, ChevronDown, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { LessonInstance } from '@/types/academic';
import type { LessonAttendance, AttendanceStatus } from '@/types/school';

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  icon: React.ElementType;
  btnClass: string;
  badgeClass: string;
  dotClass: string;
}[] = [
  { value: 'present', label: 'Keldi',    icon: CheckCircle2, btnClass: 'bg-green-500 text-white border-green-500',   badgeClass: 'bg-green-50 text-green-700 border-green-200',   dotClass: 'bg-green-500'  },
  { value: 'absent',  label: 'Kelmadi',  icon: XCircle,      btnClass: 'bg-red-500 text-white border-red-500',       badgeClass: 'bg-red-50 text-red-700 border-red-200',         dotClass: 'bg-red-500'    },
  { value: 'late',    label: 'Kechikdi', icon: Clock3,       btnClass: 'bg-amber-500 text-white border-amber-500',   badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',   dotClass: 'bg-amber-500'  },
  { value: 'excused', label: 'Sababli',  icon: AlertCircle,  btnClass: 'bg-blue-500 text-white border-blue-500',     badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',      dotClass: 'bg-blue-500'   },
  { value: 'sick',    label: 'Kasal',    icon: Minus,        btnClass: 'bg-purple-500 text-white border-purple-500', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',dotClass: 'bg-purple-500' },
];

const GRADE_CONFIG: Record<number, { active: string; hover: string }> = {
  1: { active: 'bg-red-500 text-white border-red-500',     hover: 'hover:bg-red-50 hover:border-red-300 hover:text-red-500'   },
  2: { active: 'bg-orange-400 text-white border-orange-400', hover: 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500' },
  3: { active: 'bg-yellow-400 text-gray-800 border-yellow-400', hover: 'hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600' },
  4: { active: 'bg-teal-500 text-white border-teal-500',    hover: 'hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600'    },
  5: { active: 'bg-green-500 text-white border-green-500',  hover: 'hover:bg-green-50 hover:border-green-300 hover:text-green-600'  },
};

const LESSON_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planned:     { label: 'Rejalashtirilgan', color: 'bg-gray-100 text-gray-700'  },
  in_progress: { label: 'Davom etmoqda',   color: 'bg-blue-100 text-blue-700'  },
  completed:   { label: 'Tugagan',         color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Bekor qilindi',   color: 'bg-red-100 text-red-700'    },
  canceled:    { label: 'Bekor qilindi',   color: 'bg-red-100 text-red-700'    },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function humanDate(dateStr: string): { relative: string; full: string } {
  const full = format(new Date(dateStr), 'd MMMM yyyy, EEEE', { locale: uz });
  try {
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    const diff   = Math.round((today.getTime() - target.getTime()) / 86_400_000);
    if (diff === 0)  return { relative: 'Bugun',        full };
    if (diff === 1)  return { relative: 'Kecha',        full };
    if (diff === -1) return { relative: 'Ertaga',       full };
    if (diff > 1 && diff <= 7) return { relative: `${diff} kun oldin`, full };
  } catch { /* */ }
  return { relative: full, full };
}

// ── AttendanceSelector ───────────────────────────────────────────────────────

function AttendanceSelector({
  value, onChange, locked, saving,
}: {
  value: AttendanceStatus | null;
  onChange: (s: AttendanceStatus) => void;
  locked: boolean;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = STATUS_OPTIONS.find(s => s.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (locked) {
    return current ? (
      <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border', current.badgeClass)}>
        <current.icon className="w-3 h-3" />{current.label}
      </span>
    ) : <span className="text-xs text-gray-300 px-1">—</span>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !saving && setOpen(v => !v)}
        disabled={saving}
        className={cn(
          'h-9 px-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all min-w-[88px] justify-between',
          current ? current.btnClass : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50',
          saving && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex items-center gap-1.5 truncate">
          {current && <current.icon className="w-3.5 h-3.5 shrink-0" />}
          {current?.label ?? 'Davomat'}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform ml-0.5', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 min-w-[160px]">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
                  isActive ? 'bg-gray-50' : 'hover:bg-gray-50'
                )}
              >
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', opt.btnClass)}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className={cn('flex-1', isActive ? 'font-semibold text-gray-900' : 'text-gray-700')}>{opt.label}</span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── GradeSelector ────────────────────────────────────────────────────────────

function GradeSelector({
  value, onChange, locked,
}: {
  value: number | null;
  onChange: (g: number | null) => void;
  locked: boolean;
}) {
  if (locked) {
    if (value == null) return null;
    const cfg = GRADE_CONFIG[value];
    return (
      <span className={cn('w-8 h-8 rounded-xl text-sm font-bold flex items-center justify-center border', cfg.active)}>
        {value}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(g => {
        const cfg = GRADE_CONFIG[g];
        const isActive = value === g;
        return (
          <button
            key={g}
            onClick={() => onChange(isActive ? null : g)}
            className={cn(
              'w-8 h-9 rounded-lg text-xs font-bold border transition-all',
              isActive ? cfg.active : cn('bg-white border-gray-200 text-gray-400', cfg.hover)
            )}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}

// ── StudentRow ───────────────────────────────────────────────────────────────

interface Student {
  id: string;
  profileId: string;
  name: string;
  balance: number | null;
}

function StudentRow({
  student, currentStatus, currentGrade, locked, saving, onMark, onGradeChange,
}: {
  student: Student;
  currentStatus: AttendanceStatus | null;
  currentGrade: number | null;
  locked: boolean;
  saving: boolean;
  onMark: (id: string, s: AttendanceStatus) => void;
  onGradeChange: (id: string, g: number | null) => void;
}) {
  const current  = STATUS_OPTIONS.find(s => s.value === currentStatus);
  const initials = student.name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="border-b border-gray-100 last:border-0 px-3 py-3">
      {/* Row 1: avatar + name (+ locked badges) */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-[13px] select-none">
            {initials}
          </div>
          {current && (
            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white', current.dotClass)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-tight truncate">{student.name}</p>
          {student.balance != null && (
            <p className={cn('text-[11px] leading-tight', student.balance >= 0 ? 'text-green-600' : 'text-red-500')}>
              {student.balance >= 0 ? '+' : ''}{student.balance.toLocaleString()} so'm
            </p>
          )}
        </div>

        {/* Locked view */}
        {locked && (
          <div className="flex items-center gap-1.5 shrink-0">
            <AttendanceSelector value={currentStatus} onChange={() => {}} locked saving={false} />
            <GradeSelector value={currentGrade} onChange={() => {}} locked />
          </div>
        )}
      </div>

      {/* Row 2: controls (edit mode only) */}
      {!locked && (
        <div className="flex items-center gap-2 mt-2 ml-12">
          <AttendanceSelector
            value={currentStatus}
            onChange={s => onMark(student.id, s)}
            locked={false}
            saving={saving}
          />
          <GradeSelector
            value={currentGrade}
            onChange={g => onGradeChange(student.id, g)}
            locked={false}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LessonDetailPage() {
  const params       = useParams();
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const { currentBranch } = useAuth();

  const branchId     = currentBranch?.branch_id ?? '';
  const membershipId = currentBranch?.id ?? '';
  const lessonId     = params.lessonId as string;
  const isAdmin      = ['branch_admin', 'super_admin'].includes(currentBranch?.role ?? '');
  const isTeacher    = currentBranch?.role === 'teacher';

  const [pendingSaves, setPendingSaves]   = useState<Record<string, boolean>>({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [localGrades, setLocalGrades]     = useState<Record<string, number | null>>({});
  const [pendingTimers, setPendingTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Fetch lesson ──────────────────────────────────────────────────────────
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery({
    queryKey: ['lesson', branchId, lessonId],
    queryFn: () => scheduleApi.getLessonInstance(branchId, lessonId),
    enabled: !!branchId && !!lessonId,
  });

  // ── Security: teacher can only view/edit own lessons ─────────────────────
  const isOwnLesson = !isTeacher || !membershipId || lesson?.teacher_id === membershipId;
  const canEdit     = (isAdmin || isTeacher) && isOwnLesson;

  // ── Fetch attendance ──────────────────────────────────────────────────────
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', branchId, 'by-lesson', lessonId],
    queryFn: async () => {
      const res = await schoolApi.getAttendances(branchId, { lesson: lessonId as any, page_size: 1 });
      return res.results[0] ?? null;
    },
    enabled: !!branchId && !!lessonId && !!lesson && isOwnLesson,
  });

  // ── Fetch students ────────────────────────────────────────────────────────
  const classObjId = lesson?.class_id ?? null;
  const groupId    = lesson?.group   ?? null;

  const { data: classStudents = [] } = useQuery({
    queryKey: ['class-students', classObjId],
    queryFn: () => schoolApi.getClassStudents(classObjId!, { is_active: true, page_size: 200 }),
    enabled: !!classObjId && isOwnLesson,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['group-members', branchId, groupId],
    queryFn: () => schoolApi.getGroupMembers(branchId, groupId!),
    enabled: !!groupId && isOwnLesson,
  });

  const students: Student[] = classObjId
    ? classStudents.map(cs => ({
        id:        cs.student_id,
        profileId: cs.student_profile_id ?? cs.student_id,
        name:      cs.student_name,
        balance:   cs.student_balance ?? null,
      }))
    : groupMembers.map(gm => ({
        id:        gm.student,
        profileId: gm.student,
        name:      gm.student_name,
        balance:   null,
      }));

  // ── Build merged state ────────────────────────────────────────────────────
  const serverStatuses: Record<string, AttendanceStatus> = {};
  const serverNotes:    Record<string, string>            = {};
  const serverGrades:   Record<string, number | null>     = {};
  (attendanceData?.records ?? []).forEach(r => {
    serverStatuses[r.student] = r.status;
    serverNotes[r.student]    = r.notes ?? '';
    serverGrades[r.student]   = (r as any).grade ?? null;
  });

  const mergedStatuses: Record<string, AttendanceStatus | null> = {};
  const mergedGrades:   Record<string, number | null>           = {};
  students.forEach(s => {
    mergedStatuses[s.id] = localStatuses[s.id] ?? serverStatuses[s.profileId] ?? null;
    mergedGrades[s.id]   = localGrades[s.id]   !== undefined ? localGrades[s.id] : (serverGrades[s.profileId] ?? null);
  });

  // ── Mark attendance ───────────────────────────────────────────────────────
  const markMutation = useMutation({
    mutationFn: (payload: { student_id: string; status: AttendanceStatus; grade: number | null }) =>
      schoolApi.bulkMarkAttendance(branchId, {
        lesson_id: lessonId,
        ...(lesson?.class_subject ? { class_subject_id: lesson.class_subject } : {}),
        ...(lesson?.group         ? { group_id: lesson.group as string }        : {}),
        records: [{ student_id: payload.student_id, status: payload.status, notes: serverNotes[payload.student_id] ?? '', grade: payload.grade ?? undefined }],
      }),
    onSuccess: (_, payload) => {
      setPendingSaves(prev => { const n = { ...prev }; delete n[payload.student_id]; return n; });
      queryClient.invalidateQueries({ queryKey: ['attendance', branchId, 'by-lesson', lessonId] });
    },
    onError: (err: any, payload) => {
      setPendingSaves(prev => { const n = { ...prev }; delete n[payload.student_id]; return n; });
      toast.error(err?.response?.data?.detail ?? 'Davomat saqlashda xatolik');
    },
  });

  const handleMark = useCallback((studentId: string, status: AttendanceStatus) => {
    setLocalStatuses(prev => ({ ...prev, [studentId]: status }));
    setPendingSaves(prev => ({ ...prev, [studentId]: true }));
    const grade = localGrades[studentId] !== undefined ? localGrades[studentId] : (serverGrades[studentId] ?? null);
    markMutation.mutate({ student_id: studentId, status, grade });
  }, [markMutation, localGrades, serverGrades]);

  const debouncedGradeSave = useCallback((studentId: string, grade: number | null) => {
    if (pendingTimers[studentId]) clearTimeout(pendingTimers[studentId]);
    const timer = setTimeout(() => {
      const status = localStatuses[studentId] ?? serverStatuses[studentId] ?? null;
      if (status) {
        markMutation.mutate({ student_id: studentId, status, grade });
      }
      setPendingTimers(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    }, 600);
    setPendingTimers(prev => ({ ...prev, [studentId]: timer as any }));
  }, [localStatuses, serverStatuses, pendingTimers, markMutation]);

  const handleGradeChange = useCallback((studentId: string, grade: number | null) => {
    setLocalGrades(prev => ({ ...prev, [studentId]: grade }));
    debouncedGradeSave(studentId, grade);
  }, [debouncedGradeSave]);

  // ── Mark all ──────────────────────────────────────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: (status: AttendanceStatus) =>
      schoolApi.bulkMarkAttendance(branchId, {
        lesson_id: lessonId,
        ...(lesson?.class_subject ? { class_subject_id: lesson.class_subject } : {}),
        ...(lesson?.group         ? { group_id: lesson.group as string }        : {}),
        records: students.map(s => ({ student_id: s.id, status, notes: '' })),
      }),
    onSuccess: (_, status) => {
      const next: Record<string, AttendanceStatus> = {};
      students.forEach(s => { next[s.id] = status; });
      setLocalStatuses(prev => ({ ...prev, ...next }));
      queryClient.invalidateQueries({ queryKey: ['attendance', branchId, 'by-lesson', lessonId] });
      toast.success("Barcha o'quvchilar belgilandi");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Xatolik yuz berdi'),
  });

  // ── Lock/unlock ───────────────────────────────────────────────────────────
  const lockMutation = useMutation({
    mutationFn: (action: 'lock' | 'unlock') =>
      schoolApi.lockUnlockAttendance(branchId, [attendanceData!.id], action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', branchId, 'by-lesson', lessonId] });
      toast.success('Davomat holati yangilandi');
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Xatolik'),
  });

  // ── Cancel lesson ─────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: () => scheduleApi.updateLessonInstance(branchId, lessonId, { status: 'canceled' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', branchId, lessonId] });
      toast.success('Dars bekor qilindi');
    },
    onError: () => toast.error('Bekor qilishda xatolik'),
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statusCounts = { present: 0, absent: 0, late: 0, excused: 0, sick: 0, unmarked: 0 };
  students.forEach(s => {
    const st = mergedStatuses[s.id];
    if (!st) statusCounts.unmarked++;
    else statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  });
  const progressPct = students.length > 0
    ? Math.round(((students.length - statusCounts.unmarked) / students.length) * 100)
    : 0;

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!branchId || lessonLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">Dars topilmadi</p>
        <Button variant="outline" onClick={() => router.back()}>Orqaga</Button>
      </div>
    );
  }

  // Teacher accessing someone else's lesson
  if (isTeacher && !isOwnLesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">Ruxsat yo'q</p>
          <p className="text-sm text-gray-500 mt-1">Bu dars sizga biriktirilmagan</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />Orqaga
        </Button>
      </div>
    );
  }

  const statusInfo  = LESSON_STATUS_LABELS[lesson.status] ?? LESSON_STATUS_LABELS.planned;
  const isLocked    = attendanceData?.is_locked ?? false;
  const isCancelled = lesson.status === 'cancelled' || lesson.status === 'canceled';
  const dateInfo    = lesson.date ? humanDate(lesson.date) : { relative: '—', full: '—' };
  const fullDate    = lesson.date ? format(new Date(lesson.date), 'd MMMM yyyy, EEEE', { locale: uz }) : '—';

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 -ml-1 mt-0.5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
            {lesson.subject_name ?? lesson.group_name ?? 'Dars'}
          </h1>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-sm text-gray-500">{lesson.class_name ?? lesson.group_name}</span>
            <span className="text-gray-300">·</span>
            <span className={cn(
              'text-sm font-medium',
              dateInfo.relative === 'Bugun' ? 'text-blue-600' :
              dateInfo.relative === 'Kecha' ? 'text-gray-500' : 'text-gray-500'
            )}>
              {dateInfo.relative}
            </span>
            {dateInfo.relative !== fullDate && (
              <span className="text-xs text-gray-400">({format(new Date(lesson.date), 'd MMM', { locale: uz })})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <Badge className={cn(statusInfo.color, 'text-xs')}>{statusInfo.label}</Badge>
          {isAdmin && !isCancelled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs">
                  <Ban className="w-3.5 h-3.5 mr-1" />Bekor
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Darsni bekor qilishni tasdiqlaysizmi?</AlertDialogTitle>
                  <AlertDialogDescription>Bu amaliyotni qaytarib bo'lmaydi.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Yo'q</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cancelMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                    {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ha, bekor'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Info chips ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <InfoChip icon={Calendar} label="Sana"  value={fullDate} sub={dateInfo.relative !== fullDate ? dateInfo.relative : undefined} highlight={dateInfo.relative === 'Bugun'} />
        <InfoChip icon={Clock}    label="Vaqt"  value={`${lesson.start_time?.slice(0,5) ?? '—'} – ${lesson.end_time?.slice(0,5) ?? '—'}`} />
        {lesson.teacher_name && (
          <InfoChip icon={Users}  label="O'qituvchi" value={lesson.teacher_name} />
        )}
        {lesson.room_name && (
          <InfoChip icon={MapPin} label="Xona"  value={lesson.room_name} />
        )}
      </div>

      {/* ── Topic / homework ──────────────────────────────────────────── */}
      {(lesson.topic_title || lesson.homework) && (
        <div className="space-y-2">
          {lesson.topic_title && (
            <div className="flex items-start gap-2.5 bg-indigo-50 text-indigo-800 border border-indigo-100 px-3.5 py-2.5 rounded-xl">
              <BookOpen className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
              <div className="text-sm min-w-0">
                <span className="font-semibold">Mavzu: </span>{lesson.topic_title}
              </div>
            </div>
          )}
          {lesson.homework && (
            <div className="flex items-start gap-2.5 bg-amber-50 text-amber-800 border border-amber-100 px-3.5 py-2.5 rounded-xl">
              <FileText className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <div className="text-sm min-w-0">
                <span className="font-semibold">Uy vazifasi: </span>{lesson.homework}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Attendance card ────────────────────────────────────────────── */}
      <Card className="overflow-hidden shadow-sm border-gray-200">
        {/* Header */}
        <CardHeader className="pb-0 pt-4 px-4 bg-gradient-to-r from-indigo-50/50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base">Davomat</CardTitle>
                {attendanceLoading && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> yuklanmoqda…
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && !isLocked && students.length > 0 && (
                <Select onValueChange={v => markAllMutation.mutate(v as AttendanceStatus)} value="">
                  <SelectTrigger className="h-8 text-xs w-[148px]">
                    <SelectValue placeholder="Barchasini belgilash" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {isAdmin && attendanceData && (
                <Button
                  variant="outline" size="sm" className="h-8 text-xs"
                  onClick={() => lockMutation.mutate(isLocked ? 'unlock' : 'lock')}
                  disabled={lockMutation.isPending}
                >
                  {lockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> :
                   isLocked ? <><Unlock className="w-3 h-3 mr-1" />Ochish</> :
                              <><Lock className="w-3 h-3 mr-1" />Qulflash</>}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 pb-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap flex-1">
              <StatPill label="Jami"    value={students.length}      color="bg-gray-100 text-gray-600" />
              <StatPill label="Keldi"   value={statusCounts.present} color="bg-green-100 text-green-700" />
              <StatPill label="Kelmadi" value={statusCounts.absent}  color="bg-red-100 text-red-700" />
              {statusCounts.late    > 0 && <StatPill label="Kech"    value={statusCounts.late}    color="bg-amber-100 text-amber-700" />}
              {statusCounts.excused > 0 && <StatPill label="Sababli" value={statusCounts.excused} color="bg-blue-100 text-blue-700" />}
              {statusCounts.sick    > 0 && <StatPill label="Kasal"   value={statusCounts.sick}    color="bg-purple-100 text-purple-700" />}
            </div>
            {students.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-xs text-gray-500 tabular-nums">{progressPct}%</span>
              </div>
            )}
          </div>

          {isLocked && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-3 w-fit border border-amber-200">
              <Lock className="w-3 h-3" /> Davomat qulflangan
            </div>
          )}
        </CardHeader>

        {/* Legend (edit mode) */}
        {canEdit && !isLocked && students.length > 0 && (
          <div className="px-4 py-2 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500 font-medium">Baho:</span>
            {[1,2,3,4,5].map(g => {
              const cfg = GRADE_CONFIG[g];
              return (
                <span key={g} className={cn('w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border', cfg.active)}>
                  {g}
                </span>
              );
            })}
            <span className="text-[11px] text-gray-400 ml-1">= maktab bahosi</span>
          </div>
        )}

        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              O'quvchilar topilmadi
            </div>
          ) : (
            <div>
              {students.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  currentStatus={mergedStatuses[student.id] ?? null}
                  currentGrade={mergedGrades[student.id] ?? null}
                  locked={isLocked || !canEdit}
                  saving={!!pendingSaves[student.id]}
                  onMark={handleMark}
                  onGradeChange={handleGradeChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Teacher notes ──────────────────────────────────────────────── */}
      {canEdit && !isCancelled && (
        <TeacherNotesSection branchId={branchId} lessonId={lessonId} lesson={lesson} queryClient={queryClient} />
      )}
    </div>
  );
}

// ── Teacher notes ────────────────────────────────────────────────────────────

function TeacherNotesSection({
  branchId, lessonId, lesson, queryClient,
}: {
  branchId: string;
  lessonId: string;
  lesson: LessonInstance;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [homework,     setHomework]     = useState(lesson.homework      ?? '');
  const [teacherNotes, setTeacherNotes] = useState(lesson.teacher_notes ?? '');
  const [dirty, setDirty] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: { homework?: string; teacher_notes?: string }) =>
      scheduleApi.updateLessonInstance(branchId, lessonId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', branchId, lessonId] });
      toast.success('Saqlandi');
      setDirty(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Saqlashda xatolik'),
  });

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
          </div>
          O'qituvchi yozuvlari
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Uy vazifasi</label>
          <Textarea
            value={homework}
            onChange={e => { setHomework(e.target.value); setDirty(true); }}
            placeholder="Uy vazifasini kiriting..."
            rows={2}
            className="text-sm resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Dars izohi</label>
          <Textarea
            value={teacherNotes}
            onChange={e => { setTeacherNotes(e.target.value); setDirty(true); }}
            placeholder="Dars haqida izoh..."
            rows={2}
            className="text-sm resize-none"
          />
        </div>
        <Button
          size="sm" className="w-full"
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate({ homework, teacher_notes: teacherNotes })}
        >
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Saqlash
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function InfoChip({ icon: Icon, label, value, sub, highlight }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl p-3 border flex flex-col gap-0.5',
      highlight ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
    )}>
      <div className={cn('flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide', highlight ? 'text-blue-400' : 'text-gray-400')}>
        <Icon className="w-3 h-3" />{label}
      </div>
      <p className={cn('text-sm font-semibold truncate', highlight ? 'text-blue-700' : 'text-gray-800')}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', color)}>
      {label}: {value}
    </span>
  );
}
