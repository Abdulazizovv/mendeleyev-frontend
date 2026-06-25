'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { parse, addMinutes, format as fmtDate } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { schoolApi, branchApi } from '@/lib/api';
import {
  useTimetableTemplates,
  useTimetableSlots,
  useCreateTimetableSlot,
  useUpdateTimetableSlot,
  useDeleteTimetableSlot,
  useGenerateLessons,
} from '@/lib/features/schedule/hooks';
import { GenerateLessonsDialog } from '@/lib/features/schedule/components/GenerateLessonsDialog';
import type { GenerateLessonsData } from '@/lib/features/schedule/components/GenerateLessonsDialog';
import type { TimetableSlot, CreateTimetableSlot } from '@/types/academic';
import type { ClassSubject, Room, BranchSettings, Group } from '@/types/school';

// ── Constants ──────────────────────────────────────────────────────────────────

const DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const;
type DayKey = typeof DAY_KEYS[number];

const DAY_SHORT = ['Du', 'Se', 'Cho', 'Pay', 'Ju', 'Shan'];
const DAY_FULL  = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

// ── Helpers ───────────────────────────────────────────────────────────────────

interface TimeSlot {
  lesson_number: number; // 0 = tushlik
  start_time: string;   // "08:00"
  end_time: string;     // "08:45"
}

function computeTimeSlots(s: BranchSettings): TimeSlot[] {
  const result: TimeSlot[] = [];
  const startRaw = s.daily_lesson_start_time || s.school_start_time;
  const start  = parse(startRaw.substring(0, 5), 'HH:mm', new Date());
  const endRaw = s.daily_lesson_end_time || s.school_end_time;
  const end    = parse(endRaw.substring(0, 5), 'HH:mm', new Date());
  const lS     = s.lunch_break_start ? parse(s.lunch_break_start.substring(0, 5), 'HH:mm', new Date()) : null;
  const lE     = s.lunch_break_end   ? parse(s.lunch_break_end.substring(0, 5),   'HH:mm', new Date()) : null;

  let cur = start, num = 1, lunchAdded = false;

  while (cur < end) {
    const slotEnd = addMinutes(cur, s.lesson_duration_minutes);
    if (slotEnd > end) break;

    if (lS && lE && !lunchAdded && cur < lE && slotEnd > lS) {
      if (cur < lS) {
        result.push({ lesson_number: 0, start_time: fmtDate(lS, 'HH:mm'), end_time: fmtDate(lE, 'HH:mm') });
        lunchAdded = true;
      }
      cur = lE;
      continue;
    }

    result.push({ lesson_number: num, start_time: fmtDate(cur, 'HH:mm'), end_time: fmtDate(slotEnd, 'HH:mm') });
    num++;
    cur = addMinutes(slotEnd, s.break_duration_minutes);
  }
  return result;
}

// Fan rangi (nom bo'yicha deterministik)
const SLOT_COLORS = [
  'border-l-blue-500 bg-blue-50 hover:bg-blue-100/80',
  'border-l-emerald-500 bg-emerald-50 hover:bg-emerald-100/80',
  'border-l-violet-500 bg-violet-50 hover:bg-violet-100/80',
  'border-l-rose-500 bg-rose-50 hover:bg-rose-100/80',
  'border-l-amber-500 bg-amber-50 hover:bg-amber-100/80',
  'border-l-cyan-500 bg-cyan-50 hover:bg-cyan-100/80',
  'border-l-orange-500 bg-orange-50 hover:bg-orange-100/80',
  'border-l-teal-500 bg-teal-50 hover:bg-teal-100/80',
  'border-l-indigo-500 bg-indigo-50 hover:bg-indigo-100/80',
  'border-l-pink-500 bg-pink-50 hover:bg-pink-100/80',
];

function subjectColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return SLOT_COLORS[Math.abs(h) % SLOT_COLORS.length];
}

function toApiTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

// ── Dialog state ──────────────────────────────────────────────────────────────

interface CreateClassState {
  mode: 'create';
  slotType: 'class';
  classId: string;
  className: string;
  timeSlot: TimeSlot;
}
interface CreateGroupState {
  mode: 'create';
  slotType: 'group';
  groupId: string;
  groupName: string;
  timeSlot: TimeSlot;
}
interface EditState {
  mode: 'edit';
  slot: TimetableSlot;
}
type DialogState = CreateClassState | CreateGroupState | EditState | null;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimetableEditPage() {
  const { currentBranch } = useAuth();

  const pathname   = usePathname();
  const branchId   = currentBranch?.branch_id ?? '';
  const userRole   = currentBranch?.role ?? '';
  // Hozirgi URL dan /edit ni olib tashlash — har qanday base path uchun ishlaydi
  const backPath   = pathname.replace(/\/edit\/?$/, '');

  // ── Day state ─────────────────────────────────────────────────────────────────
  const [dayIdx, setDayIdx] = useState(0);
  const selectedDayKey: DayKey = DAY_KEYS[dayIdx];

  // ── Dialog state ──────────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null);
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [roomId, setRoomId]       = useState<string | undefined>();
  const [generateOpen, setGenerateOpen]       = useState(false);
  const [generationResult, setGenerationResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const [draggingSlot, setDraggingSlot]         = useState<TimetableSlot | null>(null);
  const [conflictErrors, setConflictErrors]     = useState<Array<{ type: string; message: string; details: Record<string, string> }> | null>(null);

  const closeDialog = () => { setDialog(null); setSubjectId(undefined); setRoomId(undefined); };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // ── Data ──────────────────────────────────────────────────────────────────────
  const { data: branchSettings } = useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn:  () => branchApi.getBranchSettings(branchId),
    enabled:  !!branchId,
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  const { data: templatesResp, isLoading: templatesLoading } = useTimetableTemplates(branchId);
  const activeTemplate =
    templatesResp?.results?.find(t => t.is_active) ?? templatesResp?.results?.[0];

  const { data: slotsResp, isLoading: slotsLoading } = useTimetableSlots(
    branchId,
    activeTemplate?.id ?? '',
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

  // Faqat dialog ochiq bo'lganda class subjects va rooms yuklanadi
  const activeClassId =
    dialog?.mode === 'create' && dialog.slotType === 'class' ? dialog.classId :
    dialog?.mode === 'edit'   ? dialog.slot.class_obj ?? undefined :
    undefined;

  const { data: classSubjects = [], isFetching: subjectsLoading } = useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', branchId, activeClassId],
    queryFn:  () => schoolApi.getClassSubjects(activeClassId!, { is_active: true }),
    enabled:  !!activeClassId,
  });

  const { data: rooms = [], isFetching: roomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms', branchId],
    queryFn:  () => schoolApi.getRooms(branchId, { is_active: true }),
    enabled:  !!branchId,
  });

  // ── Computed ──────────────────────────────────────────────────────────────────
  const timeSlots = useMemo(
    () => (branchSettings ? computeTimeSlots(branchSettings) : []),
    [branchSettings]
  );

  // "class-classId-dayKey-lessonNum" | "group-groupId-dayKey-lessonNum" → TimetableSlot
  const slotMap = useMemo(() => {
    const m = new Map<string, TimetableSlot>();
    allSlots.forEach(s => {
      if (s.class_obj)
        m.set(`class-${s.class_obj}-${s.day_of_week}-${s.lesson_number}`, s);
      if (s.group)
        m.set(`group-${s.group}-${s.day_of_week}-${s.lesson_number}`, s);
    });
    return m;
  }, [allSlots]);

  const classCount = classes.length;
  const dayCount   = allSlots.filter(s => s.day_of_week === selectedDayKey).length;
  const totalCount = allSlots.length;

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMutation   = useCreateTimetableSlot(branchId, activeTemplate?.id ?? '');
  const updateMutation   = useUpdateTimetableSlot(branchId, activeTemplate?.id ?? '');
  const deleteMutation   = useDeleteTimetableSlot(branchId, activeTemplate?.id ?? '');
  const generateMutation = useGenerateLessons(branchId);

  // ── DnD handlers ──────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const slot = allSlots.find(s => s.id === event.active.id);
    setDraggingSlot(slot ?? null);
  }, [allSlots]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggingSlot(null);
    const { active, over } = event;
    if (!over || !activeTemplate) return;

    const slotId = active.id as string;
    const [targetClassId, targetDay, targetNumStr] = (over.id as string).split('||');
    const targetNum = Number(targetNumStr);
    const slot = allSlots.find(s => s.id === slotId);
    if (!slot || !targetClassId || !targetDay || isNaN(targetNum)) return;

    if (slot.class_obj === targetClassId && slot.day_of_week === targetDay && slot.lesson_number === targetNum) return;

    // Boshqa sinfga ko'chirish mumkin emas — class_subject bog'liq bo'ladi
    if (slot.class_obj !== targetClassId) {
      toast.error('Darsni boshqa sinfga ko\'chirish mumkin emas');
      return;
    }

    const occupied = slotMap.get(`class-${targetClassId}-${targetDay}-${targetNum}`);
    if (occupied && occupied.id !== slotId) {
      toast.error('Bu katakda allaqachon dars bor');
      return;
    }

    const targetTs = timeSlots.find(t => t.lesson_number === targetNum);
    if (!targetTs) return;

    updateMutation.mutate(
      {
        slotId,
        data: {
          day_of_week:   targetDay as DayKey,
          lesson_number: targetNum,
          start_time:    toApiTime(targetTs.start_time),
          end_time:      toApiTime(targetTs.end_time),
        } as any,
      },
      {
        onError: (err: any) => {
          const conflicts = err?.response?.data?.conflicts;
          if (conflicts?.length) setConflictErrors(conflicts);
        },
      }
    );
  }, [allSlots, activeTemplate, slotMap, timeSlots, updateMutation]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const openCreate = useCallback((
    type: 'class' | 'group',
    id: string,
    name: string,
    ts: TimeSlot,
  ) => {
    if (type === 'class') {
      setDialog({ mode: 'create', slotType: 'class', classId: id, className: name, timeSlot: ts });
    } else {
      setDialog({ mode: 'create', slotType: 'group', groupId: id, groupName: name, timeSlot: ts });
    }
    setSubjectId(undefined);
    setRoomId(undefined);
  }, []);

  const openEdit = useCallback((slot: TimetableSlot) => {
    setDialog({ mode: 'edit', slot });
    setSubjectId(slot.class_subject ?? undefined);
    setRoomId(slot.room ?? undefined);
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeTemplate || !dialog) return;

    if (dialog.mode === 'create') {
      const isGroup = dialog.slotType === 'group';
      // For group slots no subject needed; for class slots subjectId required
      if (!isGroup && !subjectId) return;

      const payload: CreateTimetableSlot = {
        timetable:    activeTemplate.id,
        day_of_week:  selectedDayKey,
        lesson_number: dialog.timeSlot.lesson_number,
        start_time:   toApiTime(dialog.timeSlot.start_time),
        end_time:     toApiTime(dialog.timeSlot.end_time),
        ...(roomId ? { room: roomId } : {}),
        ...(isGroup
          ? { group: dialog.groupId }
          : { class_obj: dialog.classId, class_subject: subjectId }),
      };
      try {
        await createMutation.mutateAsync(payload);
        toast.success('Dars qo\'shildi');
        closeDialog();
      } catch (err: any) {
        const d = err.response?.data;
        toast.error(d?.non_field_errors?.[0] ?? d?.detail ?? 'Dars qo\'shishda xatolik');
      }
    } else {
      const payload: Partial<CreateTimetableSlot> = {
        ...(subjectId ? { class_subject: subjectId } : {}),
        ...(roomId ? { room: roomId } : { room: null }),
      };
      try {
        await updateMutation.mutateAsync({ slotId: dialog.slot.id, data: payload });
        toast.success('Dars yangilandi');
        closeDialog();
      } catch (err: any) {
        const d = err.response?.data;
        toast.error(d?.detail ?? 'Darsni yangilashda xatolik');
      }
    }
  }, [activeTemplate, dialog, subjectId, roomId, selectedDayKey, createMutation, updateMutation]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Dars o\'chirildi');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'O\'chirishda xatolik');
    }
  }, [deleteTarget, deleteMutation]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleGenerateSubmit = useCallback((data: GenerateLessonsData) => {
    generateMutation.mutate(
      { timetable_id: data.timetable_id, start_date: data.start_date, end_date: data.end_date, skip_existing: data.skip_existing, force_update: data.force_update } as any,
      {
        onSuccess: (result: any) => {
          setGenerationResult({
            created: result.created_count ?? result.generated_count ?? 0,
            updated: result.updated_count ?? 0,
            skipped: result.skipped_count ?? 0,
          });
        },
      }
    );
  }, [generateMutation]);

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">Filial tanlanmagan</p>
      </div>
    );
  }

  if (templatesLoading || classesLoading || groupsLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!activeTemplate) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backPath}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Jadval sozlash</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <div>
            <p className="font-semibold text-gray-800 mb-1">Faol jadval shabloni topilmadi</p>
            <p className="text-sm text-gray-500">Avval "Dars Jadvali" sahifasida shablon yarating</p>
          </div>
          <Button asChild>
            <Link href={backPath}>Dars jadvaliga qaytish</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (classes.length === 0 && groups.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backPath}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Jadval sozlash</h1>
        </div>
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center text-center gap-3">
          <GraduationCap className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 text-sm">Faol sinf yoki guruhlar topilmadi</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="pb-10">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href={backPath}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                Jadval Sozlash
              </h1>
              <p className="text-xs text-gray-400 truncate">
                <Calendar className="inline h-3 w-3 mr-1" />
                {activeTemplate.name}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-500" />
              {dayCount} dars (bu kun)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {totalCount} jami dars
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-purple-600 border-purple-200 hover:bg-purple-50"
            onClick={() => { setGenerationResult(null); setGenerateOpen(true); }}
            disabled={!activeTemplate}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Darslar yaratish</span>
          </Button>
          <Button asChild size="sm" className="shrink-0">
            <Link href={backPath}>Tayyor</Link>
          </Button>
        </div>

        {/* Day tabs */}
        <div className="flex border-t border-gray-100">
          {DAY_KEYS.map((key, idx) => {
            const isSelected = idx === dayIdx;
            const count = allSlots.filter(s => s.day_of_week === key).length;
            return (
              <button
                key={key}
                onClick={() => setDayIdx(idx)}
                className={cn(
                  'flex-1 py-2.5 px-2 text-center text-xs font-medium transition-all border-b-2',
                  isSelected
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )}
              >
                <span className="block">{DAY_SHORT[idx]}</span>
                {count > 0 && (
                  <span className={cn(
                    'inline-block mt-0.5 text-[10px] font-bold px-1.5 rounded-full',
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid container */}
      <div className="px-4 sm:px-6 mt-5">

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 px-0.5">
          <span className="font-semibold text-gray-600 text-sm mr-1">{DAY_FULL[dayIdx]}</span>
          <span className="text-gray-200">·</span>
          <span>Bo'sh katak → qo'shish</span>
          <span className="text-gray-200">·</span>
          <span>To'liq katak → tahrirlash</span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-0.5"><GripVertical className="h-3 w-3" />Sudrab o'tkazish</span>
        </div>

        {slotsLoading ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : timeSlots.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm">Dars vaqtlari sozlanmagan.</p>
            <p className="text-gray-400 text-xs mt-1">
              Filial sozlamalaridan dars boshlanish vaqti va davomiyligini belgilang.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table
                className="border-collapse"
                style={{ minWidth: `${80 + (classes.length + groups.length) * 150}px` }}
              >
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-20 bg-gray-50 w-[80px] min-w-[80px] px-2 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-200">
                      Vaqt
                    </th>
                    {/* Class columns */}
                    {classes.map(cls => (
                      <th
                        key={cls.id}
                        className="px-2 py-2.5 text-center text-xs font-semibold border-r border-gray-100 last:border-r-0 min-w-[150px] bg-blue-50/60 text-blue-900"
                      >
                        <div className="truncate max-w-[130px] mx-auto" title={cls.name}>
                          {cls.name}
                        </div>
                        <div className="text-[9px] font-normal text-blue-400 mt-0.5 opacity-70">
                          {allSlots.filter(s => s.class_obj === cls.id && s.day_of_week === selectedDayKey).length} dars · Sinf
                        </div>
                      </th>
                    ))}
                    {/* Group columns */}
                    {groups.map((grp, gIdx) => (
                      <th
                        key={grp.id}
                        className={cn(
                          'px-2 py-2.5 text-center text-xs font-semibold border-r border-gray-100 last:border-r-0 min-w-[150px] bg-violet-50/60 text-violet-900',
                          gIdx === 0 && classes.length > 0 && 'border-l-2 border-l-violet-200'
                        )}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <GraduationCap className="w-3 h-3 text-violet-400 shrink-0" />
                          <span className="truncate max-w-[110px]" title={grp.name}>{grp.name}</span>
                        </div>
                        <div className="text-[9px] font-normal text-violet-400 mt-0.5 opacity-70">
                          {allSlots.filter(s => s.group === grp.id && s.day_of_week === selectedDayKey).length} dars · Guruh
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((ts, rowIdx) => {
                    if (ts.lesson_number === 0) {
                      return (
                        <tr key="lunch" className="border-y border-amber-100 bg-amber-50/60">
                          <td className="sticky left-0 bg-amber-50 px-2 py-2 border-r border-amber-100 text-center">
                            <div className="text-[10px] font-semibold text-amber-700">{ts.start_time}</div>
                            <div className="text-[10px] text-amber-500">{ts.end_time}</div>
                          </td>
                          <td
                            colSpan={classes.length + groups.length}
                            className="px-4 py-2 text-center text-xs font-medium text-amber-700"
                          >
                            Tushlik — {ts.start_time} – {ts.end_time}
                          </td>
                        </tr>
                      );
                    }

                    const rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30';

                    return (
                      <tr
                        key={ts.lesson_number}
                        className={cn('border-b border-gray-100 last:border-b-0', rowBg)}
                      >
                        <td
                          className={cn(
                            'sticky left-0 z-10 px-2 py-2 border-r border-gray-200 text-center align-middle w-[80px] min-w-[80px]',
                            rowBg
                          )}
                        >
                          <div className="text-xs font-bold text-gray-700">
                            {ts.lesson_number}-dars
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{ts.start_time}</div>
                          <div className="text-[10px] text-gray-400">{ts.end_time}</div>
                        </td>

                        {/* Class cells */}
                        {classes.map(cls => {
                          const slot = slotMap.get(`class-${cls.id}-${selectedDayKey}-${ts.lesson_number}`);
                          const cellId = `${cls.id}||${selectedDayKey}||${ts.lesson_number}`;
                          const isOtherClass = !!draggingSlot && cls.id !== draggingSlot.class_obj;
                          return (
                            <td
                              key={cls.id}
                              className={cn(
                                'border-r border-gray-100 last:border-r-0 min-w-[150px] p-1.5 align-top transition-opacity',
                                isOtherClass && 'opacity-30 pointer-events-none'
                              )}
                            >
                              <DroppableCell cellId={cellId} isDragging={!!draggingSlot && !isOtherClass}>
                                {slot ? (
                                  <DraggableFilledCell
                                    slot={slot}
                                    onClick={() => openEdit(slot)}
                                    onDelete={() => setDeleteTarget(slot)}
                                    isDraggingThis={draggingSlot?.id === slot.id}
                                  />
                                ) : (
                                  <EmptyCell
                                    onClick={() => openCreate('class', cls.id, cls.name, ts)}
                                    variant="class"
                                  />
                                )}
                              </DroppableCell>
                            </td>
                          );
                        })}

                        {/* Group cells */}
                        {groups.map((grp, gIdx) => {
                          const slot = slotMap.get(`group-${grp.id}-${selectedDayKey}-${ts.lesson_number}`);
                          return (
                            <td
                              key={grp.id}
                              className={cn(
                                'border-r border-gray-100 last:border-r-0 min-w-[150px] p-1.5 align-top',
                                gIdx === 0 && classes.length > 0 && 'border-l-2 border-l-violet-200'
                              )}
                            >
                              {slot ? (
                                <DraggableFilledCell
                                  slot={slot}
                                  onClick={() => openEdit(slot)}
                                  onDelete={() => setDeleteTarget(slot)}
                                  isDraggingThis={false}
                                />
                              ) : (
                                <EmptyCell
                                  onClick={() => openCreate('group', grp.id, grp.name, ts)}
                                  variant="group"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <DragOverlay>
              {draggingSlot && (
                <div className={cn(
                  'rounded-lg border-l-[3px] px-2 py-2 text-xs shadow-xl opacity-95 w-[150px]',
                  subjectColor(draggingSlot.subject_name ?? draggingSlot.group_name ?? '')
                )}>
                  <div className="font-semibold text-gray-800 truncate">
                    {draggingSlot.subject_name ?? draggingSlot.group_name ?? 'Fan'}
                  </div>
                  {draggingSlot.teacher_name && (
                    <div className="text-gray-500 truncate text-[10px]">{draggingSlot.teacher_name}</div>
                  )}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Slot Dialog (Create / Edit) ── */}
      <Dialog open={!!dialog} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === 'create' ? 'Dars qo\'shish' : 'Darsni tahrirlash'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === 'create' && dialog.slotType === 'class'
                ? `${dialog.className} · ${DAY_FULL[dayIdx]} · ${dialog.timeSlot.start_time}–${dialog.timeSlot.end_time}`
                : dialog?.mode === 'create' && dialog.slotType === 'group'
                ? `${dialog.groupName} (guruh) · ${DAY_FULL[dayIdx]} · ${dialog.timeSlot.start_time}–${dialog.timeSlot.end_time}`
                : dialog?.mode === 'edit'
                ? `${dialog.slot.class_name ?? dialog.slot.group_name ?? ''} · ${DAY_FULL[dayIdx]} · ${dialog.slot.lesson_number}-dars`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Fan — only for class slots */}
            {(dialog?.mode === 'edit' && dialog.slot.class_obj) || (dialog?.mode === 'create' && dialog.slotType === 'class') ? (
              <div className="space-y-1.5">
                <Label>
                  Fan <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={subjectId}
                  onValueChange={setSubjectId}
                  disabled={subjectsLoading || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subjectsLoading ? 'Yuklanmoqda…' : 'Fanni tanlang'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsLoading ? (
                      <div className="py-4 flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    ) : classSubjects.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">
                        Bu sinf uchun fan biriktirilmagan
                      </div>
                    ) : (
                      classSubjects.map(cs => (
                        <SelectItem key={cs.id} value={cs.id}>
                          {cs.subject_name}
                          {cs.teacher_name ? ` — ${cs.teacher_name}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* Group slot info */
              dialog?.mode === 'create' && dialog.slotType === 'group' && (
                <div className="flex items-center gap-2 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100">
                  <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-violet-800">{dialog.groupName}</p>
                    <p className="text-[11px] text-violet-500">Guruh darsi — fan guruhga biriktirilgan</p>
                  </div>
                </div>
              )
            )}

            {/* Xona */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Xona
                <span className="text-[11px] text-gray-400 font-normal">(ixtiyoriy)</span>
              </Label>
              <Select
                value={roomId ?? '_none'}
                onValueChange={v => setRoomId(v === '_none' ? undefined : v)}
                disabled={roomsLoading || isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Xona tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Xonasiz</SelectItem>
                  {rooms.filter(r => r?.id).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.room_type_display ? ` (${r.room_type_display})` : ''}
                      {r.capacity ? ` · ${r.capacity} o'rin` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {dialog?.mode === 'edit' && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 border-red-200 mr-auto"
                onClick={() => {
                  if (dialog.slot) setDeleteTarget(dialog.slot);
                  closeDialog();
                }}
                disabled={isSaving}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                O'chirish
              </Button>
            )}
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Bekor
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isSaving ||
                (dialog?.mode === 'create' && dialog.slotType === 'class' && !subjectId) ||
                (dialog?.mode === 'edit' && !!dialog.slot.class_obj && !subjectId)
              }
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialog?.mode === 'create' ? 'Qo\'shish' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Conflict errors dialog ── */}
      <Dialog open={!!conflictErrors} onOpenChange={open => { if (!open) setConflictErrors(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Jadval konflikti
            </DialogTitle>
            <DialogDescription>
              Darsni ko'chirib bo'lmadi — quyidagi to'qnashuvlar aniqlandi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {conflictErrors?.map((c, i) => (
              <div key={i} className="p-3 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-start gap-2">
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5',
                    c.type === 'teacher' ? 'bg-orange-100 text-orange-700' :
                    c.type === 'room'    ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {c.type === 'teacher' ? 'O\'qituvchi' : c.type === 'room' ? 'Xona' : c.type}
                  </span>
                  <div>
                    <p className="text-sm text-gray-800">{c.message}</p>
                    {c.details && Object.keys(c.details).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                        {Object.entries(c.details).map(([k, v]) => (
                          <div key={k}>
                            <span className="font-medium capitalize">{k}:</span> {String(v)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setConflictErrors(null)}>Tushunarli</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate lessons ── */}
      {activeTemplate && (
        <GenerateLessonsDialog
          open={generateOpen}
          onOpenChange={(open) => { setGenerateOpen(open); if (!open) setGenerationResult(null); }}
          currentTemplateId={activeTemplate.id}
          currentTemplateName={activeTemplate.name}
          onSubmit={handleGenerateSubmit}
          isGenerating={generateMutation.isPending}
          generationResult={generationResult}
        />
      )}

      {/* ── Delete confirm ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteTarget?.subject_name}</span>{' '}
              darsi {deleteTarget?.class_name && `(${deleteTarget.class_name})`} jadvaldan olib tashlanadi.
              Bu kun uchun rejalashtirilgan kelajakdagi darslar ham o'chirilishi mumkin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── DroppableCell ─────────────────────────────────────────────────────────────

function DroppableCell({
  cellId,
  isDragging,
  children,
}: {
  cellId: string;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[60px] rounded-lg transition-colors',
        isDragging && !isOver && 'bg-blue-50/20',
        isOver && 'bg-blue-100/60 ring-2 ring-blue-300 ring-inset'
      )}
    >
      {children}
    </div>
  );
}

// ── DraggableFilledCell ───────────────────────────────────────────────────────

function DraggableFilledCell({
  slot,
  onClick,
  onDelete,
  isDraggingThis,
}: {
  slot: TimetableSlot;
  onClick: () => void;
  onDelete: () => void;
  isDraggingThis: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: slot.id });
  const color = subjectColor(slot.subject_name ?? '');

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={cn(
        'group relative w-full text-left rounded-lg border-l-[3px] px-2 py-2 text-xs transition-all min-h-[60px]',
        'cursor-grab active:cursor-grabbing select-none',
        color,
        isDraggingThis && 'opacity-30'
      )}
    >
      {/* Delete button — stopPropagation both click and pointerDown so it doesn't start a drag */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        onPointerDown={e => e.stopPropagation()}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 text-red-500 z-10"
        title="O'chirish"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Edit icon hint */}
      <div className="absolute top-1 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-blue-100 text-blue-500 pointer-events-none">
        <Edit2 className="h-3 w-3" />
      </div>

      <div className="font-semibold text-gray-800 leading-tight pr-8 truncate">
        {slot.subject_name ?? slot.group_name ?? 'Fan'}
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
    </div>
  );
}

// ── EmptyCell ─────────────────────────────────────────────────────────────────

function EmptyCell({ onClick, variant = 'class' }: { onClick: () => void; variant?: 'class' | 'group' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full min-h-[60px] rounded-lg border-2 border-dashed flex items-center justify-center transition-all group',
        variant === 'class'
          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/60'
          : 'border-violet-100 hover:border-violet-300 hover:bg-violet-50/40'
      )}
      title="Dars qo'shish"
    >
      <Plus className={cn(
        'h-4 w-4 transition-colors',
        variant === 'class'
          ? 'text-gray-300 group-hover:text-blue-500'
          : 'text-violet-200 group-hover:text-violet-500'
      )} />
    </button>
  );
}
