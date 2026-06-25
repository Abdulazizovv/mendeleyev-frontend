'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Settings2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Plus,
  Loader2,
  GraduationCap,
  Sparkles,
  Clock,
  UtensilsCrossed,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek } from 'date-fns';
import { uz } from 'date-fns/locale';
import { parse, addMinutes, format as fmtDate } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api/client';
import { schoolApi, branchApi } from '@/lib/api';
import {
  useTimetableSlots,
  useLessonInstances,
  useGenerateLessons,
  useCreateLessonInstance,
} from '@/lib/features/schedule/hooks';
import { scheduleApi } from '@/lib/features/schedule/api';
import { GenerateLessonsDialog } from '@/lib/features/schedule/components/GenerateLessonsDialog';
import type { GenerateLessonsData } from '@/lib/features/schedule/components/GenerateLessonsDialog';
import { AddLessonDialog } from '@/lib/features/schedule/components/AddLessonDialog';
import type { AddLessonData, AddLessonContext } from '@/lib/features/schedule/components/AddLessonDialog';
import type { TimetableSlot, LessonInstance } from '@/types/academic';
import type { Group, BranchSettings } from '@/types/school';

// ── Constants ──────────────────────────────────────────────────────────────────

const DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const;
type DayKey = typeof DAY_KEYS[number];

const DAY_SHORT = ['Du', 'Se', 'Cho', 'Pay', 'Ju', 'Shan'];
const DAY_FULL  = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

// ── Time slot helpers ─────────────────────────────────────────────────────────

interface TimeSlot {
  lesson_number: number; // 0 = tushlik
  start_time: string;   // "08:00"
  end_time: string;     // "08:45"
}

function computeTimeSlots(s: BranchSettings): TimeSlot[] {
  const result: TimeSlot[] = [];
  const startRaw = s.daily_lesson_start_time || s.school_start_time;
  const endRaw   = s.daily_lesson_end_time   || s.school_end_time;
  const start  = parse(startRaw.substring(0, 5), 'HH:mm', new Date());
  const end    = parse(endRaw.substring(0, 5),   'HH:mm', new Date());
  const lStart = s.lunch_break_start ? parse(s.lunch_break_start.substring(0, 5), 'HH:mm', new Date()) : null;
  const lEnd   = s.lunch_break_end   ? parse(s.lunch_break_end.substring(0, 5),   'HH:mm', new Date()) : null;

  let cur = start;
  let num = 1;
  let lunchAdded = false;

  // Use end time as primary constraint; max_lessons_per_day is not used here
  while (cur < end) {
    const slotEnd = addMinutes(cur, s.lesson_duration_minutes);
    if (slotEnd > end) break;

    // Tushlik tanaffusini qo'shish
    if (lStart && lEnd && !lunchAdded && cur >= lStart) {
      result.push({ lesson_number: 0, start_time: fmtDate(lStart, 'HH:mm'), end_time: fmtDate(lEnd, 'HH:mm') });
      lunchAdded = true;
      cur = lEnd;
      continue;
    }
    // Tushlik tanaffusi ustida dars bo'lsa o'tkazib yuborish
    if (lStart && lEnd && !lunchAdded && slotEnd > lStart) {
      result.push({ lesson_number: 0, start_time: fmtDate(lStart, 'HH:mm'), end_time: fmtDate(lEnd, 'HH:mm') });
      lunchAdded = true;
      cur = lEnd;
      continue;
    }

    result.push({ lesson_number: num, start_time: fmtDate(cur, 'HH:mm'), end_time: fmtDate(slotEnd, 'HH:mm') });
    num++;
    cur = addMinutes(slotEnd, s.break_duration_minutes);
  }
  return result;
}

// vaqtni daqiqaga aylantirish
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// ── Subject colour helpers ────────────────────────────────────────────────────

const SUBJECT_COLORS = [
  { border: 'border-l-blue-500',    bg: 'bg-blue-50/80'    },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50/80' },
  { border: 'border-l-violet-500',  bg: 'bg-violet-50/80'  },
  { border: 'border-l-rose-500',    bg: 'bg-rose-50/80'    },
  { border: 'border-l-amber-500',   bg: 'bg-amber-50/80'   },
  { border: 'border-l-cyan-500',    bg: 'bg-cyan-50/80'    },
  { border: 'border-l-orange-500',  bg: 'bg-orange-50/80'  },
  { border: 'border-l-teal-500',    bg: 'bg-teal-50/80'    },
  { border: 'border-l-indigo-500',  bg: 'bg-indigo-50/80'  },
  { border: 'border-l-pink-500',    bg: 'bg-pink-50/80'    },
] as const;

function subjectColorCls(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}

function lessonCardClass(subjectName: string, status?: string, isPast = false): string {
  if (status === 'cancelled' || status === 'canceled')
    return 'border-l-red-300 bg-red-50/50 opacity-50';
  const c = subjectColorCls(subjectName ?? '');
  if (status === 'in_progress')
    return cn(c.border, c.bg, 'ring-2 ring-offset-1 ring-blue-300 shadow-sm');
  if (isPast)
    return cn(c.border, c.bg, 'opacity-55');
  return cn(c.border, c.bg);
}

function slotCardClass(subjectName: string): string {
  const c = subjectColorCls(subjectName ?? '');
  return cn(c.border, c.bg, 'hover:opacity-80');
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed')
    return <span className="text-[9px] text-green-700 bg-green-100 px-1 py-0.5 rounded font-medium">✓ Tugadi</span>;
  if (status === 'cancelled' || status === 'canceled')
    return <span className="text-[9px] text-red-600 bg-red-100 px-1 py-0.5 rounded font-medium">Bekor</span>;
  if (status === 'in_progress')
    return (
      <span className="text-[9px] text-blue-700 bg-blue-100 px-1 py-0.5 rounded font-medium flex items-center gap-0.5">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse inline-block" />
        Davom
      </span>
    );
  return null;
}

// ── Column type ───────────────────────────────────────────────────────────────

interface Col {
  type: 'class' | 'group';
  id: string;
  name: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const pathname  = usePathname();
  const router    = useRouter();
  const branchId  = currentBranch?.branch_id ?? '';
  const userRole  = currentBranch?.role ?? '';
  const isAdmin   = ['branch_admin', 'super_admin'].includes(userRole);
  const editPath  = pathname.replace(/\/$/, '') + '/edit';
  const basePath  = pathname.replace(/\/schedule.*$/, '');

  // ── Refs for time indicator ───────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // ── Current time state ────────────────────────────────────────────────────────
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

  // ── Generation state ──────────────────────────────────────────────────────────
  const [generateOpen, setGenerateOpen]         = useState(false);
  const [generationResult, setGenerationResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const generateMutation = useGenerateLessons(branchId);

  const handleGenerateSubmit = (data: GenerateLessonsData) => {
    generateMutation.mutate(
      { timetable_id: data.timetable_id, start_date: data.start_date, end_date: data.end_date, skip_existing: data.skip_existing, force_update: data.force_update } as any,
      {
        onSuccess: (result: any) => {
          setGenerationResult({
            created: result.created_count ?? result.generated_count ?? 0,
            updated: result.updated_count ?? 0,
            skipped: result.skipped_count ?? 0,
          });
          refetchLessons();
        },
      }
    );
  };

  // ── Add lesson state ──────────────────────────────────────────────────────────
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addLessonCtx, setAddLessonCtx] = useState<AddLessonContext | null>(null);
  const [openingSlotKey, setOpeningSlotKey] = useState<string | null>(null);

  const createLessonMutation = useCreateLessonInstance(branchId);

  const handleAddLessonSubmit = (data: AddLessonData) => {
    createLessonMutation.mutate(data as any, {
      onSuccess: () => {
        setAddLessonOpen(false);
        setAddLessonCtx(null);
        toast.success('Dars yaratildi');
      },
      onError: (err: any) => {
        const errData = err?.response?.data;
        if (errData && typeof errData === 'object') {
          const msgs = Object.entries(errData)
            .map(([, v]) => (Array.isArray(v) ? v.join(', ') : String(v)))
            .join('. ');
          toast.error(msgs || 'Dars yaratishda xatolik');
        } else {
          toast.error(errData?.detail ?? 'Dars yaratishda xatolik');
        }
      },
    });
  };

  const openAddLesson = (
    type: 'class' | 'group',
    id: string,
    name: string,
    ts: TimeSlot,
  ) => {
    setAddLessonCtx({
      type,
      id,
      name,
      date: selectedDate,
      lessonNumber: ts.lesson_number,
      startTime: ts.start_time,
      endTime: ts.end_time,
    });
    setAddLessonOpen(true);
  };

  // ── Week / day ────────────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [dayIdx, setDayIdx] = useState<number>(() => {
    const d = new Date().getDay(); // 0=Yak
    return d === 0 ? 5 : Math.min(d - 1, 5);
  });

  const weekDays = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const selectedDate    = weekDays[dayIdx];
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayKey: DayKey = DAY_KEYS[dayIdx];

  const isToday = useMemo(
    () => format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    [selectedDate]
  );

  const goToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const d = new Date().getDay();
    setDayIdx(d === 0 ? 5 : Math.min(d - 1, 5));
  };

  // ── Data fetches ──────────────────────────────────────────────────────────────
  const { data: branchSettings } = useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn:  () => branchApi.getBranchSettings(branchId),
    enabled:  !!branchId,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  const {
    data: currentTemplate,
    isLoading: templateLoading,
    error: templateError,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['current-timetable', branchId],
    queryFn:  () => api.get('/school/timetables/current/').then(r => r.data),
    enabled:  !!branchId,
    retry:    false,
  });

  const createTemplateMutation = useMutation({
    mutationFn: () => api.post('/school/timetables/current/').then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-timetable', branchId] });
      refetchTemplate();
      toast.success('Jadval shabloni yaratildi');
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Xatolik yuz berdi'),
  });

  const { data: slotsResp, isLoading: slotsLoading } = useTimetableSlots(
    branchId,
    currentTemplate?.id ?? '',
    { page_size: 500 } as any,
  );
  const allSlots: TimetableSlot[] = slotsResp?.results ?? [];

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', branchId, 'active'],
    queryFn:  () =>
      schoolApi.getClassesPaginated(branchId, {
        is_active: true, page_size: 100, ordering: 'grade_level,section',
      }),
    enabled: !!branchId,
  });
  const classes = classesData?.results ?? [];

  const { data: groupsRaw = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['groups', branchId],
    queryFn:  () => schoolApi.getGroups(branchId, { is_active: true }),
    enabled:  !!branchId,
  });
  const groups = groupsRaw.filter(g => g.is_active);

  const {
    data: lessonsData,
    isLoading: lessonsLoading,
    refetch: refetchLessons,
  } = useLessonInstances(branchId, {
    date_from: selectedDateStr,
    date_to:   selectedDateStr,
  });
  const lessons: LessonInstance[] = lessonsData?.results ?? [];

  // ── Computed ──────────────────────────────────────────────────────────────────
  const timeSlots = useMemo(
    () => (branchSettings ? computeTimeSlots(branchSettings) : []),
    [branchSettings]
  );

  const columns: Col[] = useMemo(() => [
    ...classes.map(c => ({ type: 'class' as const, id: c.id, name: c.name })),
    ...groups.map(g  => ({ type: 'group' as const, id: g.id, name: g.name })),
  ], [classes, groups]);

  // "classId-dayKey-lessonNum" → TimetableSlot
  const slotMap = useMemo(() => {
    const m = new Map<string, TimetableSlot>();
    allSlots.forEach(s => {
      if (s.class_obj)
        m.set(`${s.class_obj}-${s.day_of_week}-${s.lesson_number}`, s);
    });
    return m;
  }, [allSlots]);

  // "class-classId-lessonNum" | "subj-csId-lessonNum" | "group-groupId-lessonNum" → LessonInstance
  const lessonMap = useMemo(() => {
    const m = new Map<string, LessonInstance>();
    lessons.forEach(l => {
      const num = l.lesson_number;
      if (!num) return;
      if (l.class_id)      m.set(`class-${l.class_id}-${num}`,   l);
      if (l.class_subject) m.set(`subj-${l.class_subject}-${num}`, l); // fallback when class_id is null
      if (l.group)         m.set(`group-${l.group}-${num}`,       l);
    });
    return m;
  }, [lessons]);

  // Slot katakchani bosganida: mavjud darsni topib navigatsiya qilish,
  // yo'q bo'lsa yangi LessonInstance yaratib detail sahifasiga o'tish
  const handleSlotOpen = useCallback(async (
    slot: TimetableSlot,
    ts: TimeSlot,
    colId: string,
  ) => {
    // Agar class_subject yo'q bo'lsa — dialog orqali qo'shish
    if (!slot.class_subject) {
      openAddLesson('class', colId, slot.class_name ?? colId, ts);
      return;
    }

    // Avval lessonMap da tekshir — dars allaqachon mavjud bo'lishi mumkin
    const existing = lessonMap.get(`class-${colId}-${ts.lesson_number}`)
      ?? (slot.class_subject ? lessonMap.get(`subj-${slot.class_subject}-${ts.lesson_number}`) : undefined);
    if (existing) {
      router.push(`${pathname.replace(/\/$/, '')}/lessons/${existing.id}`);
      return;
    }

    const key = `${colId}-${ts.lesson_number}`;
    if (openingSlotKey === key) return;
    setOpeningSlotKey(key);
    try {
      const newLesson = await scheduleApi.createLessonInstance(branchId, {
        class_subject: slot.class_subject,
        date: selectedDateStr,
        lesson_number: ts.lesson_number,
        start_time: ts.start_time,
        end_time: ts.end_time,
        status: 'planned',
        check_conflicts: false,
      } as any);
      await refetchLessons();
      setOpeningSlotKey(null);
    } catch (err: any) {
      if (err?.response?.status === 400 || err?.response?.status === 409) {
        await refetchLessons();
      } else {
        toast.error(err?.response?.data?.detail ?? 'Darsni ochishda xatolik');
      }
      setOpeningSlotKey(null);
    }
  }, [branchId, openingSlotKey, pathname, router, selectedDateStr, refetchLessons, lessonMap, openAddLesson]);

  // Day tab badge: how many slots exist for that day
  const daySlotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DAY_KEYS.forEach(k => { counts[k] = allSlots.filter(s => s.day_of_week === k).length; });
    return counts;
  }, [allSlots]);

  const classCount = columns.filter(c => c.type === 'class').length;

  // ── Current time indicator ────────────────────────────────────────────────────
  // offsetTop ishlatiladi — scroll o'zgarganda ham to'g'ri ishlaydi
  const updateIndicator = useCallback(() => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    setCurrentTimeStr(`${h}:${m}`);

    if (!isToday || timeSlots.length === 0) {
      setIndicatorTop(null);
      return;
    }

    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < timeSlots.length; i++) {
      const ts = timeSlots[i];
      if (ts.lesson_number === 0) continue;
      const startMin = toMinutes(ts.start_time);
      const endMin   = toMinutes(ts.end_time);

      if (nowMin >= startMin && nowMin <= endMin) {
        const row = rowRefs.current[i];
        if (row) {
          const progress = (nowMin - startMin) / Math.max(endMin - startMin, 1);
          // offsetTop — positioned parent (container div) ga nisbatan
          const top = row.offsetTop + row.offsetHeight * progress;
          setIndicatorTop(Math.round(top));
          return;
        }
      }
    }
    setIndicatorTop(null);
  }, [isToday, timeSlots]);

  useEffect(() => {
    updateIndicator();
    const interval = setInterval(updateIndicator, 30_000);
    return () => clearInterval(interval);
  }, [updateIndicator]);

  // Kun o'zgarganda indicator'ni yangilash
  useEffect(() => { updateIndicator(); }, [selectedDate, updateIndicator]);

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">Filial tanlanmagan</p>
      </div>
    );
  }

  if (templateLoading || classesLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (templateError || !currentTemplate) {
    const errData = (templateError as any)?.response?.data;
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dars Jadvali</h1>
          <p className="text-sm text-gray-500 mt-0.5">Barcha sinf va guruhlar jadvali</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-8 flex flex-col items-center text-center gap-4">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {errData?.error ?? 'Jadval shabloni topilmadi'}
            </h3>
            <p className="text-sm text-gray-500">
              {isAdmin
                ? 'Darslarni ko\'rsatish uchun avval jadval shablonini yarating.'
                : "Dars jadvali hali sozlanmagan. Administrator bilan bog'laning."}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => createTemplateMutation.mutate()}
              disabled={createTemplateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createTemplateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Yaratilmoqda...</>
                : <><Plus className="w-4 h-4 mr-2" />Jadval yaratish</>}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dars Jadvali</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentTemplate.name} · {currentTemplate.academic_year_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Hozirgi vaqt */}
          {currentTimeStr && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-gray-700 tabular-nums">{currentTimeStr}</span>
            </div>
          )}
          {isAdmin && currentTemplate && (
            <Button
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => { setGenerationResult(null); setGenerateOpen(true); }}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Darslar yaratish</span>
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={editPath}>
                <Settings2 className="w-4 h-4 mr-1.5" />
                Sozlash
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetchLessons()}
            disabled={lessonsLoading}
          >
            <RefreshCw className={cn('w-4 h-4', lessonsLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Week navigation + Day tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Week navigation bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 px-2 min-w-[190px] text-center tabular-nums">
              {format(weekStart, 'd MMM', { locale: uz })} — {format(addDays(weekStart, 5), 'd MMM yyyy', { locale: uz })}
            </span>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToday}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
          >
            Bugun
          </button>
        </div>

        {/* Day tab row */}
        <div className="grid grid-cols-6">
          {DAY_KEYS.map((key, idx) => {
            const day        = weekDays[idx];
            const isSelected = idx === dayIdx;
            const isTodayTab = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const count      = daySlotCounts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => setDayIdx(idx)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-3 px-1 transition-all border-b-[3px]',
                  'hover:bg-gray-50 focus-visible:outline-none',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60'
                    : isTodayTab
                    ? 'border-blue-200'
                    : 'border-transparent'
                )}
              >
                {/* Day name */}
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  isSelected ? 'text-blue-600' : isTodayTab ? 'text-blue-500' : 'text-gray-400'
                )}>
                  {DAY_SHORT[idx]}
                </span>

                {/* Date number */}
                <span className={cn(
                  'text-xl font-bold leading-none',
                  isSelected ? 'text-blue-700' : isTodayTab ? 'text-blue-600' : 'text-gray-800'
                )}>
                  {format(day, 'd')}
                </span>

                {/* Month */}
                <span className={cn(
                  'text-[10px] font-medium',
                  isSelected ? 'text-blue-500' : 'text-gray-400'
                )}>
                  {format(day, 'MMM', { locale: uz })}
                </span>

                {/* Slot count badge */}
                {count > 0 && (
                  <span className={cn(
                    'mt-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isTodayTab
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}

                {/* Today dot indicator */}
                {isTodayTab && !isSelected && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day label + legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 px-0.5">
        <span className="font-semibold text-gray-800 text-sm">{DAY_FULL[dayIdx]}</span>
        {isToday && (
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Bugun
          </span>
        )}
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border-l-2 border-blue-400 bg-blue-50" />
          Sinf
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border-l-2 border-violet-400 bg-violet-50" />
          Guruh
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border-l-2 border-green-500 bg-green-50" />
          Yakunlangan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border-l-2 border-red-400 bg-red-50" />
          Bekor
        </span>
        {isAdmin && (
          <span className="flex items-center gap-1.5 ml-auto text-gray-400">
            <Plus className="w-3 h-3" />
            Bo'sh katakka bosib dars qo'shing
          </span>
        )}
      </div>

      {/* Grid */}
      {slotsLoading || groupsLoading || lessonsLoading ? (
        <Skeleton className="h-[450px] w-full rounded-xl" />
      ) : timeSlots.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">Dars vaqtlari sozlanmagan.</p>
          {isAdmin && (
            <p className="text-gray-400 text-xs mt-1">
              Filial sozlamalaridan dars boshlanish vaqti va davomiyligini belgilang.
            </p>
          )}
        </div>
      ) : columns.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">Faol sinf yoki guruhlar topilmadi.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm relative"
        >
          {/* ── Hozirgi vaqt chizig'i ─────────────────────────────────────── */}
          {isToday && indicatorTop !== null && (
            <div
              className="absolute left-0 z-20 pointer-events-none"
              style={{ top: `${indicatorTop}px`, width: `${88 + columns.length * 165}px` }}
            >
              <div className="flex items-center gap-0">
                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-r-full shrink-0 leading-tight shadow-md ml-[88px]">
                  {currentTimeStr}
                </span>
                <div className="flex-1 border-t-[2px] border-green-500 opacity-70" />
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 ring-2 ring-white shadow mr-1" />
              </div>
            </div>
          )}

          <table
            className="border-collapse"
            style={{ minWidth: `${88 + columns.length * 165}px` }}
          >
            <thead>
              <tr className="border-b border-gray-200">
                {/* Sticky vaqt ustuni */}
                <th className="sticky left-0 z-20 bg-gray-50 w-[88px] min-w-[88px] px-2 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-200">
                  Vaqt
                </th>
                {columns.map((col, i) => (
                  <th
                    key={col.id}
                    className={cn(
                      'px-2 py-2.5 text-center text-xs font-semibold border-r border-gray-100 last:border-r-0 min-w-[165px]',
                      col.type === 'class'
                        ? 'bg-blue-50/60 text-blue-900'
                        : 'bg-violet-50/60 text-violet-900',
                      col.type === 'group' && i === classCount
                        ? 'border-l-2 border-l-violet-200'
                        : ''
                    )}
                  >
                    <Link
                      href={col.type === 'class'
                        ? `${basePath}/classes/${col.id}`
                        : `${basePath}/groups/${col.id}`}
                      className={cn(
                        'inline-flex flex-col items-center gap-0.5 hover:underline underline-offset-2 rounded px-1 py-0.5 transition-colors',
                        col.type === 'class' ? 'hover:text-blue-700' : 'hover:text-violet-700'
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {col.type === 'group' && (
                          <GraduationCap className="w-3 h-3 text-violet-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[130px]" title={col.name}>
                          {col.name}
                        </span>
                      </div>
                      <div className={cn(
                        'text-[9px] font-normal opacity-60',
                        col.type === 'class' ? 'text-blue-500' : 'text-violet-500'
                      )}>
                        {col.type === 'class' ? 'Sinf' : 'Guruh'}
                      </div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((ts, rowIdx) => {
                // Tushlik qatori
                if (ts.lesson_number === 0) {
                  return (
                    <tr
                      key="lunch"
                      ref={el => { rowRefs.current[rowIdx] = el; }}
                      className="border-y-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/40"
                    >
                      <td className="sticky left-0 z-10 bg-amber-50 px-2 py-3 border-r-2 border-amber-200 text-center">
                        <div className="text-[10px] font-bold text-amber-700">{ts.start_time}</div>
                        <div className="text-[10px] text-amber-500 mt-0.5">{ts.end_time}</div>
                      </td>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3"
                      >
                        <div className="flex items-center justify-center gap-2 text-amber-700">
                          <UtensilsCrossed className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-semibold">Tushlik tanaffusi</span>
                          <span className="text-xs text-amber-500 font-medium">
                            {ts.start_time} – {ts.end_time}
                          </span>
                          <span className="text-xs text-amber-400 bg-amber-100 px-2 py-0.5 rounded-full ml-1">
                            {(() => {
                              const diffMin = toMinutes(ts.end_time) - toMinutes(ts.start_time);
                              return `${diffMin} daqiqa`;
                            })()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Hozirgi dars qatori
                const nowMin    = toMinutes(currentTimeStr || '00:00');
                const slotStart = toMinutes(ts.start_time);
                const slotEnd   = toMinutes(ts.end_time);
                const isCurrentSlot = isToday && currentTimeStr && nowMin >= slotStart && nowMin < slotEnd;

                const rowBg = isCurrentSlot
                  ? 'bg-green-50/30'
                  : rowIdx % 2 === 0
                  ? 'bg-white'
                  : 'bg-gray-50/30';

                return (
                  <tr
                    key={ts.lesson_number}
                    ref={el => { rowRefs.current[rowIdx] = el; }}
                    className={cn('border-b border-gray-100 last:border-b-0', rowBg)}
                  >
                    {/* Sticky vaqt katagi */}
                    <td
                      className={cn(
                        'sticky left-0 z-10 px-2 py-2.5 border-r border-gray-200 text-center align-middle w-[88px] min-w-[88px]',
                        rowBg
                      )}
                    >
                      <div className={cn(
                        'text-[11px] font-bold',
                        isCurrentSlot ? 'text-green-700' : 'text-gray-700'
                      )}>
                        {ts.lesson_number}-dars
                      </div>
                      <div className={cn(
                        'text-[10px] font-medium mt-0.5',
                        isCurrentSlot ? 'text-green-600' : 'text-gray-600'
                      )}>
                        {ts.start_time}
                      </div>
                      <div className="text-[10px] text-gray-400">{ts.end_time}</div>
                      {isCurrentSlot && (
                        <div className="mt-1">
                          <span className="text-[9px] text-green-600 font-semibold bg-green-50 px-1 py-0.5 rounded">
                            Hozir
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Sinf va guruh katakchalari */}
                    {columns.map((col, colIdx) => {
                      const isFirstGroup = col.type === 'group' && colIdx === classCount;
                      // O'tgan dars belgisi: tanlangan sana bugundan oldin, yoki bugun bo'lsa dars vaqti o'tgan
                      const todayStr = format(new Date(), 'yyyy-MM-dd');
                      const isPastSlot = selectedDateStr < todayStr
                        || (isToday && !!currentTimeStr && ts.end_time <= currentTimeStr);

                      if (col.type === 'class') {
                        const slot   = slotMap.get(`${col.id}-${selectedDayKey}-${ts.lesson_number}`);
                        // class_id may be null in some responses — fall back to class_subject key
                        const lesson = lessonMap.get(`class-${col.id}-${ts.lesson_number}`)
                          ?? (slot?.class_subject ? lessonMap.get(`subj-${slot.class_subject}-${ts.lesson_number}`) : undefined);

                        return (
                          <td
                            key={col.id}
                            className={cn(
                              'border-r border-gray-100 last:border-r-0 min-w-[165px] p-1 align-top',
                              isFirstGroup && 'border-l-2 border-l-violet-200'
                            )}
                          >
                            {lesson ? (
                              <Link
                                href={`${pathname.replace(/\/$/, '')}/lessons/${lesson.id}`}
                                className={cn(
                                  'block rounded-md border-l-[3px] px-2 py-1.5 text-xs min-h-[60px] transition-opacity cursor-pointer',
                                  lessonCardClass(lesson.subject_name ?? '', lesson.status, isPastSlot)
                                )}
                              >
                                <div className="font-semibold text-gray-800 leading-tight truncate text-[12px]">
                                  {lesson.subject_name ?? 'Fan'}
                                </div>
                                {lesson.teacher_name && (
                                  <div className="text-gray-500 truncate text-[10px] mt-0.5">
                                    {lesson.teacher_name}
                                  </div>
                                )}
                                {lesson.room_name && (
                                  <div className="text-gray-400 truncate text-[10px]">
                                    {lesson.room_name}
                                  </div>
                                )}
                                {lesson.topic_title && (
                                  <div className="text-[10px] mt-0.5 truncate opacity-70 italic">
                                    {lesson.topic_title}
                                  </div>
                                )}
                                <div className="mt-1 flex items-center gap-1 flex-wrap">
                                  <StatusBadge status={lesson.status} />
                                  {lesson.attendance_count != null && lesson.attendance_count > 0 && (
                                    <span className="text-[9px] text-gray-500 bg-white/60 px-1 py-0.5 rounded">
                                      {lesson.attendance_count} o'q
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ) : slot ? (
                              <button
                                onClick={() => handleSlotOpen(slot, ts, col.id)}
                                disabled={openingSlotKey === `${col.id}-${ts.lesson_number}`}
                                className={cn(
                                  'w-full text-left rounded-md border-l-[3px] px-2 py-1.5 text-xs min-h-[60px] transition-all cursor-pointer hover:shadow-sm hover:brightness-95 active:scale-[0.98]',
                                  slotCardClass(slot.subject_name ?? ''),
                                  isPastSlot && 'opacity-40'
                                )}
                              >
                                <div className="font-semibold text-gray-700 leading-tight truncate text-[12px] underline-offset-2 hover:underline">
                                  {slot.subject_name ?? 'Fan'}
                                </div>
                                {slot.teacher_name && (
                                  <div className="text-gray-500 truncate text-[10px] mt-0.5">
                                    {slot.teacher_name}
                                  </div>
                                )}
                                {slot.room_name && (
                                  <div className="text-gray-400 truncate text-[10px]">
                                    {slot.room_name}
                                  </div>
                                )}
                                {openingSlotKey === `${col.id}-${ts.lesson_number}` && (
                                  <Loader2 className="w-3 h-3 animate-spin text-gray-400 mt-1" />
                                )}
                              </button>
                            ) : isAdmin ? (
                              <button
                                onClick={() => openAddLesson('class', col.id, col.name, ts)}
                                className="w-full min-h-[60px] flex items-center justify-center rounded-md border border-dashed border-gray-200 text-gray-300 hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50/30 transition-colors group"
                              >
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                            ) : null}
                          </td>
                        );
                      }

                      // Guruh katagi
                      const lesson = lessonMap.get(`group-${col.id}-${ts.lesson_number}`);
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            'border-r border-gray-100 last:border-r-0 min-w-[165px] p-1 align-top',
                            isFirstGroup && 'border-l-2 border-l-violet-200'
                          )}
                        >
                          {lesson ? (
                            <Link
                              href={`${pathname.replace(/\/$/, '')}/lessons/${lesson.id}`}
                              className={cn(
                                'block rounded-md border-l-[3px] px-2 py-1.5 text-xs min-h-[60px] transition-opacity cursor-pointer',
                                lessonCardClass(lesson.subject_name ?? lesson.group_name ?? '', lesson.status, isPastSlot)
                              )}
                            >
                              <div className="font-semibold text-gray-800 leading-tight truncate text-[12px]">
                                {lesson.subject_name ?? lesson.group_name ?? 'Guruh darsi'}
                              </div>
                              {lesson.teacher_name && (
                                <div className="text-gray-500 truncate text-[10px] mt-0.5">
                                  {lesson.teacher_name}
                                </div>
                              )}
                              {lesson.room_name && (
                                <div className="text-gray-400 truncate text-[10px]">
                                  {lesson.room_name}
                                </div>
                              )}
                              {lesson.topic_title && (
                                <div className="text-[10px] mt-0.5 truncate opacity-70 italic">
                                  {lesson.topic_title}
                                </div>
                              )}
                              <div className="mt-1 flex items-center gap-1 flex-wrap">
                                <StatusBadge status={lesson.status} />
                                {lesson.attendance_count != null && lesson.attendance_count > 0 && (
                                  <span className="text-[9px] text-gray-500 bg-white/60 px-1 py-0.5 rounded">
                                    {lesson.attendance_count} o'q
                                  </span>
                                )}
                              </div>
                            </Link>
                          ) : isAdmin ? (
                            /* Bo'sh guruh katagi — admin uchun qo'shish */
                            <button
                              onClick={() => openAddLesson('group', col.id, col.name, ts)}
                              className="w-full min-h-[60px] flex items-center justify-center rounded-md border border-dashed border-violet-200 text-violet-300 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/30 transition-colors group"
                            >
                              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate lessons dialog */}
      {currentTemplate && (
        <GenerateLessonsDialog
          open={generateOpen}
          onOpenChange={(open) => { setGenerateOpen(open); if (!open) setGenerationResult(null); }}
          currentTemplateId={currentTemplate.id}
          currentTemplateName={currentTemplate.name}
          onSubmit={handleGenerateSubmit}
          isGenerating={generateMutation.isPending}
          generationResult={generationResult}
        />
      )}

      {/* Add lesson dialog */}
      <AddLessonDialog
        open={addLessonOpen}
        onOpenChange={(open) => { setAddLessonOpen(open); if (!open) setAddLessonCtx(null); }}
        context={addLessonCtx}
        branchId={branchId}
        onSubmit={handleAddLessonSubmit}
        isSubmitting={createLessonMutation.isPending}
      />
    </div>
  );
}
