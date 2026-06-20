'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useTimetableTemplates,
  useTimetableSlots,
  useCreateTimetableSlot,
  useUpdateTimetableSlot,
  useDeleteTimetableSlot,
} from '@/lib/features/schedule/hooks';
import { WeeklyClassGrid } from '@/lib/features/schedule/components/WeeklyClassGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
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
import { createSlotPayload, type TimeSlotDefinition } from '@/lib/features/schedule/utils/lessonNumberMapping';
import type { TimetableSlot } from '@/types/academic';
import type { Class, ClassSubject, Room } from '@/types/school';
import { toast } from 'sonner';
import { schoolApi, branchApi } from '@/lib/api';
import { parse, addMinutes, format as formatDate } from 'date-fns';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateDialogState {
  open: boolean;
  classId?: string;
  dayOfWeek?: number;
  timeSlot?: TimeSlotDefinition;
}

interface EditDialogState {
  open: boolean;
  slot?: TimetableSlot;
}

interface DeleteDialogState {
  open: boolean;
  slot?: TimetableSlot;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimetableEditPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id || '';
  const userRole = currentBranch?.role ?? '';
  const scheduleBase = userRole === 'branch_admin' ? '/branch-admin/schedule' : '/school/schedule';

  // Selected class index (navigate with arrows)
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);

  // Dialog states
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({ open: false });
  const [editDialog, setEditDialog]     = useState<EditDialogState>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId]       = useState<string | undefined>();

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const { data: branchSettings } = useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn: () => branchApi.getBranchSettings(branchId),
    enabled: !!branchId,
  });

  const { data: templatesResponse, isLoading: templatesLoading } = useTimetableTemplates(branchId);
  const activeTemplate = templatesResponse?.results?.find((t) => t.is_active) ?? templatesResponse?.results?.[0];

  const { data: slotsResponse, isLoading: slotsLoading } = useTimetableSlots(
    branchId,
    activeTemplate?.id ?? '',
  );
  const allSlots: TimetableSlot[] = slotsResponse?.results ?? [];

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', branchId, 'active'],
    queryFn: () => schoolApi.getClassesPaginated(branchId, { is_active: true, page_size: 100, ordering: 'grade_level,section' }),
    enabled: !!branchId,
  });
  const classesRaw: Class[] = classesData?.results ?? [];

  const activeClassId =
    createDialog.open ? createDialog.classId
    : editDialog.open  ? editDialog.slot?.class_obj
    : undefined;

  const { data: classSubjects = [], isLoading: subjectsLoading } = useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', branchId, activeClassId],
    queryFn: () => schoolApi.getClassSubjects(activeClassId!, { is_active: true }),
    enabled: !!activeClassId,
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms', branchId],
    queryFn: () => schoolApi.getRooms(branchId, { is_active: true }),
    enabled: !!branchId,
  });

  // ── Time slots from branch settings ────────────────────────────────────────

  const timeSlots = useMemo<TimeSlotDefinition[]>(() => {
    if (!branchSettings) return [];

    const slots: TimeSlotDefinition[] = [];
    const startTime = parse(branchSettings.school_start_time.substring(0, 5), 'HH:mm', new Date());
    const endTimeStr = branchSettings.daily_lesson_end_time || branchSettings.school_end_time;
    const endTime   = parse(endTimeStr.substring(0, 5), 'HH:mm', new Date());
    const lunchStart = branchSettings.lunch_break_start
      ? parse(branchSettings.lunch_break_start.substring(0, 5), 'HH:mm', new Date())
      : null;
    const lunchEnd = branchSettings.lunch_break_end
      ? parse(branchSettings.lunch_break_end.substring(0, 5), 'HH:mm', new Date())
      : null;

    let current = startTime;
    let num = 1;
    let lunchAdded = false;

    while (current < endTime) {
      const slotEnd = addMinutes(current, branchSettings.lesson_duration_minutes);
      if (slotEnd > endTime) break;

      if (lunchStart && lunchEnd && !lunchAdded && slotEnd > lunchStart && current < lunchEnd) {
        if (current < lunchStart) {
          slots.push({ lesson_number: 0, start_time: formatDate(lunchStart, 'HH:mm:ss'), end_time: formatDate(lunchEnd, 'HH:mm:ss'), label: 'Tushlik' });
          lunchAdded = true;
        }
        current = lunchEnd;
        continue;
      }

      slots.push({
        lesson_number: num,
        start_time: formatDate(current, 'HH:mm:ss'),
        end_time:   formatDate(slotEnd, 'HH:mm:ss'),
        label: `${num}-dars`,
      });
      num++;
      current = addMinutes(slotEnd, branchSettings.break_duration_minutes);
    }

    return slots;
  }, [branchSettings]);

  // ── Derived: classes with slot counts ──────────────────────────────────────

  const classes = useMemo(() => {
    const lessonCount = timeSlots.filter((t) => t.lesson_number > 0).length;
    const maxSlots = lessonCount * 6; // 6 days

    return classesRaw.map((cls) => {
      const count = allSlots.filter((s) => s.class_obj === cls.id).length;
      return { id: cls.id, name: cls.name, slotCount: count, maxSlots };
    });
  }, [classesRaw, allSlots, timeSlots]);

  const selectedClass = classes[selectedClassIndex] ?? classes[0];

  // ── Mutations ───────────────────────────────────────────────────────────────

  const createMutation = useCreateTimetableSlot(branchId, activeTemplate?.id ?? '');
  const updateMutation = useUpdateTimetableSlot(branchId, activeTemplate?.id ?? '');
  const deleteMutation = useDeleteTimetableSlot(branchId, activeTemplate?.id ?? '');

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openCreate = useCallback((dayOfWeek: number, timeSlot: TimeSlotDefinition) => {
    if (!selectedClass) return;
    setCreateDialog({ open: true, classId: selectedClass.id, dayOfWeek, timeSlot });
    setSelectedSubjectId(undefined);
    setSelectedRoomId(undefined);
  }, [selectedClass]);

  const openEdit = useCallback((slot: TimetableSlot) => {
    setEditDialog({ open: true, slot });
    setSelectedSubjectId(slot.class_subject);
    setSelectedRoomId(slot.room ?? undefined);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!activeTemplate || !createDialog.classId || !createDialog.dayOfWeek || !createDialog.timeSlot || !selectedSubjectId) return;

    const payload = createSlotPayload(
      createDialog.classId,
      selectedSubjectId,
      createDialog.dayOfWeek,
      createDialog.timeSlot.start_time,
      createDialog.timeSlot.end_time,
      activeTemplate.id,
      selectedRoomId,
    );
    if (!payload) { toast.error("Noto'g'ri sozlamalar"); return; }

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Dars qo\'shildi');
      setCreateDialog({ open: false });
    } catch (err: any) {
      const d = err.response?.data;
      if (d?.conflicts)    toast.error(`Vaqt to'qnashuvi: ${d.conflicts.join(', ')}`);
      else if (d?.detail)  toast.error(d.detail);
      else                 toast.error("Dars qo'shishda xatolik");
    }
  }, [activeTemplate, createDialog, selectedSubjectId, selectedRoomId, createMutation]);

  const handleUpdate = useCallback(async () => {
    if (!activeTemplate || !editDialog.slot || !selectedSubjectId) return;
    const slot = editDialog.slot;

    const payload = createSlotPayload(
      slot.class_obj!,
      selectedSubjectId,
      dayOfWeekToNumber(slot.day_of_week),
      slot.start_time,
      slot.end_time,
      activeTemplate.id,
      selectedRoomId,
    );
    if (!payload) { toast.error("Noto'g'ri sozlamalar"); return; }

    try {
      await updateMutation.mutateAsync({ slotId: slot.id, data: payload });
      toast.success('Dars yangilandi');
      setEditDialog({ open: false });
    } catch (err: any) {
      const d = err.response?.data;
      if (d?.conflicts)   toast.error(`Vaqt to'qnashuvi: ${d.conflicts.join(', ')}`);
      else if (d?.detail) toast.error(d.detail);
      else                toast.error('Darsni yangilashda xatolik');
    }
  }, [activeTemplate, editDialog, selectedSubjectId, selectedRoomId, updateMutation]);

  const handleDelete = useCallback(async () => {
    if (!deleteDialog.slot) return;
    try {
      await deleteMutation.mutateAsync(deleteDialog.slot.id);
      toast.success("Dars o'chirildi");
      setDeleteDialog({ open: false });
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "O'chirishda xatolik");
    }
  }, [deleteDialog, deleteMutation]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  const isLoading = templatesLoading || classesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!activeTemplate) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={scheduleBase}><ArrowLeft className="h-5 w-5" /></Link>
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
            <Link href={scheduleBase}>Dars jadvaliga qaytish</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={scheduleBase}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Jadval sozlash</h1>
        </div>
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center text-center gap-3">
          <GraduationCap className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 text-sm">Faol sinflar topilmadi</p>
        </div>
      </div>
    );
  }

  const lessonSlotCount = timeSlots.filter((t) => t.lesson_number > 0).length;

  return (
    <div className="pb-8">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={scheduleBase}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                Jadval Sozlash
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                <Calendar className="inline h-3 w-3 mr-1" />
                {activeTemplate.name}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-500" />
              {lessonSlotCount} dars / kun
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-purple-500" />
              {classes.length} sinf
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {allSlots.length} slot kiritilgan
            </span>
          </div>

          <Button asChild size="sm">
            <Link href={scheduleBase}>Tayyor</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5 flex gap-5">

        {/* ── Left sidebar: class list ── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 gap-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">
            Sinflar
          </p>
          {classes.map((cls, idx) => {
            const pct = cls.maxSlots > 0 ? Math.round((cls.slotCount / cls.maxSlots) * 100) : 0;
            const isSelected = idx === selectedClassIndex;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassIndex(idx)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm',
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{cls.name}</span>
                  <span className={cn('text-xs', isSelected ? 'text-blue-100' : 'text-gray-400')}>
                    {cls.slotCount}
                  </span>
                </div>
                <div className={cn('h-1 rounded-full', isSelected ? 'bg-blue-400' : 'bg-gray-200')}>
                  <div
                    className={cn('h-1 rounded-full transition-all', isSelected ? 'bg-white' : 'bg-blue-500')}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Class selector (mobile + navigation) */}
          <div className="flex items-center gap-3">
            {/* Mobile: arrows */}
            <button
              onClick={() => setSelectedClassIndex((i) => Math.max(0, i - 1))}
              disabled={selectedClassIndex === 0}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{selectedClass?.name ?? '—'}</h2>
              <p className="text-sm text-gray-500">
                {selectedClass?.slotCount ?? 0} ta slot kiritilgan
              </p>
            </div>

            <button
              onClick={() => setSelectedClassIndex((i) => Math.min(classes.length - 1, i + 1))}
              disabled={selectedClassIndex >= classes.length - 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Mobile: class selector dropdown */}
            <div className="lg:hidden">
              <Select
                value={selectedClassIndex.toString()}
                onValueChange={(v) => setSelectedClassIndex(Number(v))}
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls, idx) => (
                    <SelectItem key={cls.id} value={idx.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {slotsLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : selectedClass ? (
            <WeeklyClassGrid
              slots={allSlots}
              timeSlots={timeSlots}
              classId={selectedClass.id}
              onCellClick={openCreate}
              onSlotEdit={openEdit}
              onSlotDelete={(slot) => setDeleteDialog({ open: true, slot })}
            />
          ) : null}

          {/* Legend */}
          <div className="text-xs text-gray-400 flex items-center gap-4 px-1">
            <span>Katakchani bosing → dars qo'shish</span>
            <span>•</span>
            <span>Kalamush belgisini olib boring → tahrirlash</span>
          </div>
        </div>
      </div>

      {/* ── Create Slot Dialog ── */}
      <Dialog
        open={createDialog.open}
        onOpenChange={(o) => { if (!o) setCreateDialog({ open: false }); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dars qo'shish</DialogTitle>
            <DialogDescription>
              {selectedClass?.name} · {dayLabel(createDialog.dayOfWeek)} · {createDialog.timeSlot?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <SubjectSelect
              subjects={classSubjects}
              loading={subjectsLoading}
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
            />
            <RoomSelect
              rooms={rooms}
              loading={roomsLoading}
              value={selectedRoomId}
              onChange={(v) => setSelectedRoomId(v === '_none' ? undefined : v)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog({ open: false })}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedSubjectId || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Slot Dialog ── */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(o) => { if (!o) setEditDialog({ open: false }); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Darsni tahrirlash</DialogTitle>
            <DialogDescription>
              {editDialog.slot?.class_name} · {dayLabelFromStr(editDialog.slot?.day_of_week)} · {editDialog.slot?.lesson_number}-dars
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <SubjectSelect
              subjects={classSubjects}
              loading={subjectsLoading}
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
            />
            <RoomSelect
              rooms={rooms}
              loading={roomsLoading}
              value={selectedRoomId}
              onChange={(v) => setSelectedRoomId(v === '_none' ? undefined : v)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!selectedSubjectId || updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(o) => { if (!o) setDeleteDialog({ open: false }); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteDialog.slot?.subject_name}</span> darsini{' '}
              {dayLabelFromStr(deleteDialog.slot?.day_of_week)}, {deleteDialog.slot?.lesson_number}-dars vaqtidan olib tashlansinmi?
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SubjectSelect({
  subjects,
  loading,
  value,
  onChange,
}: {
  subjects: ClassSubject[];
  loading: boolean;
  value?: string;
  onChange: (v: string) => void;
}) {
  const valid = subjects.filter((cs) => cs?.id);
  return (
    <div className="space-y-1.5">
      <Label>Fan <span className="text-red-500">*</span></Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Yuklanmoqda...' : 'Fanni tanlang'} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="py-4 text-center text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : valid.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-400">
              Bu sinf uchun fan biriktirilmagan
            </div>
          ) : (
            valid.map((cs) => (
              <SelectItem key={cs.id} value={cs.id}>
                {cs.subject_name ?? "Fan"}{cs.teacher_name ? ` — ${cs.teacher_name}` : ''}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function RoomSelect({
  rooms,
  loading,
  value,
  onChange,
}: {
  rooms: Room[];
  loading: boolean;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Xona <span className="text-xs text-gray-400 font-normal">(ixtiyoriy)</span></Label>
      <Select value={value ?? '_none'} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder="Xona tanlang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">Xonasiz</SelectItem>
          {rooms
            .filter((r) => r?.id)
            .map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}{r.room_type_display ? ` (${r.room_type_display})` : ''}{r.capacity ? ` · ${r.capacity} o'rin` : ''}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const DAY_LABELS: Record<number, string> = {
  1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba',
  4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba',
};

const DAY_STR_LABELS: Record<string, string> = {
  monday: 'Dushanba', tuesday: 'Seshanba', wednesday: 'Chorshanba',
  thursday: 'Payshanba', friday: 'Juma', saturday: 'Shanba', sunday: 'Yakshanba',
};

function dayLabel(day?: number) {
  return day ? (DAY_LABELS[day] ?? '') : '';
}

function dayLabelFromStr(day?: string) {
  return day ? (DAY_STR_LABELS[day] ?? day) : '';
}

function dayOfWeekToNumber(day?: string): number {
  const map: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6, sunday: 7,
  };
  return day ? (map[day] ?? 1) : 1;
}
