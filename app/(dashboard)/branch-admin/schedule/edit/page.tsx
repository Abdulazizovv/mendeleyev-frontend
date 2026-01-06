/**
 * Timetable Template Edit Page
 * TIME-BASED GRID: Rows = Time Slots, Columns = Classes
 * Uses TimetableSlots (template definitions), NOT LessonInstances
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useTimetableTemplates,
  useTimetableSlots,
  useCreateTimetableSlot,
  useUpdateTimetableSlot,
  useDeleteTimetableSlot,
  scheduleKeys,
} from '@/lib/features/schedule/hooks';
import { TimeBasedGrid } from '@/lib/features/schedule/components/TimeBasedGrid';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, AlertCircle, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { schoolApi } from '@/lib/api/school';
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
import { Input } from '@/components/ui/input';

const DAYS = [
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
];

interface CreateSlotDialogState {
  open: boolean;
  classId?: string;
  timeSlot?: TimeSlotDefinition;
}

interface EditSlotDialogState {
  open: boolean;
  slot?: TimetableSlot;
}

interface DeleteSlotDialogState {
  open: boolean;
  slot?: TimetableSlot;
}

export default function TimetableEditPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id || '';
  const queryClient = useQueryClient();
  
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [createDialogState, setCreateDialogState] = useState<CreateSlotDialogState>({ open: false });
  const [editDialogState, setEditDialogState] = useState<EditSlotDialogState>({ open: false });
  const [deleteDialogState, setDeleteDialogState] = useState<DeleteSlotDialogState>({ open: false });
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState<string | undefined>(undefined);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);

  // Room ID handler to convert "_none" to undefined
  const handleRoomChange = useCallback((value: string) => {
    setSelectedRoomId(value === "_none" ? undefined : value);
  }, []);

  // Fetch active template
  const { data: templatesResponse, isLoading: templatesLoading } = useTimetableTemplates(branchId, { is_active: true });
  const activeTemplate = templatesResponse?.results?.[0];

  // Fetch slots for active template
  const { data: slotsResponse, isLoading: slotsLoading } = useTimetableSlots(
    branchId,
    activeTemplate?.id || '',
    undefined
  );
  const allSlots = slotsResponse?.results || [];

  // Fetch all active classes
  const { data: classesData = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['classes', branchId, 'active'],
    queryFn: () => schoolApi.getClasses(branchId, {
      is_active: true,
      page_size: 100,
      ordering: 'grade_level,section',
    }),
    enabled: !!branchId,
  });

  // Transform classes to grid format (only id and name needed)
  const classes = classesData.map(cls => ({
    id: cls.id,
    name: cls.name,
  }));

  // Fetch class subjects for selected class
  const { 
    data: classSubjects = [], 
    isLoading: classSubjectsLoading,
    isError: classSubjectsError 
  } = useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', branchId, createDialogState.classId || editDialogState.slot?.class_obj],
    queryFn: () =>
      schoolApi.getClassSubjects(createDialogState.classId || editDialogState.slot?.class_obj!, {
        is_active: true,
      }),
    enabled: !!branchId && !!(createDialogState.classId || editDialogState.slot?.class_obj),
  });

  // Fetch rooms for room selection
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms', branchId],
    queryFn: () => schoolApi.getRooms(branchId, { is_active: true }),
    enabled: !!branchId,
  });

  // Mutations
  const createMutation = useCreateTimetableSlot(branchId, activeTemplate?.id || '');
  const updateMutation = useUpdateTimetableSlot(branchId, activeTemplate?.id || '');
  const deleteMutation = useDeleteTimetableSlot(branchId, activeTemplate?.id || '');

  // Loading states
  const isLoading = templatesLoading || slotsLoading || classesLoading;

  // Handle cell click to create new slot
  const handleSlotClick = useCallback((classId: string, timeSlot: TimeSlotDefinition) => {
    setCreateDialogState({
      open: true,
      classId,
      timeSlot,
    });
    setSelectedClassSubjectId(undefined);
    setSelectedRoomId(undefined);
  }, []);

  // Handle slot edit
  const handleSlotEdit = useCallback((slot: TimetableSlot) => {
    setEditDialogState({
      open: true,
      slot,
    });
    setSelectedClassSubjectId(slot.class_subject);
    setSelectedRoomId(slot.room || undefined);
  }, []);

  // Handle slot delete
  const handleSlotDelete = useCallback((slot: TimetableSlot) => {
    setDeleteDialogState({
      open: true,
      slot,
    });
  }, []);

  // Handle drag & drop
  const handleSlotDrop = useCallback(
    async (slotId: string, newClassId: string, newTimeSlot: TimeSlotDefinition) => {
      if (!activeTemplate) return;

      const slot = allSlots.find((s: TimetableSlot) => s.id === slotId);
      if (!slot) return;

      // Create payload with new time and class
      const payload = createSlotPayload(
        newClassId,
        slot.class_subject || '',
        selectedDay,
        newTimeSlot.start_time,
        newTimeSlot.end_time,
        activeTemplate.id,
        slot.room
      );

      if (!payload) {
        toast.error('Noto\'g\'ri vaqt tanlandi');
        return;
      }

      try {
        await updateMutation.mutateAsync({
          slotId,
          data: payload,
        });
        toast.success('Dars muvaffaqiyatli ko\'chirildi');
      } catch (error: any) {
        // Parse backend error and show user-friendly message
        const errorData = error.response?.data;
        
        if (errorData?.class_subject) {
          toast.error('Tanlangan fan ushbu sinfga tegishli emas. Iltimos, avval shu sinf uchun fanni biriktiring.');
        } else if (errorData?.conflicts) {
          toast.error(`Vaqt to'qnashuvi: ${errorData.conflicts.join(', ')}`);
        } else if (errorData?.detail) {
          toast.error(errorData.detail);
        } else {
          toast.error('Darsni ko\'chirishda xatolik yuz berdi');
        }
      }
    },
    [activeTemplate, allSlots, selectedDay, updateMutation]
  );

  // Handle create slot
  const handleCreateSlot = useCallback(async () => {
    if (!activeTemplate || !createDialogState.timeSlot || !createDialogState.classId || !selectedClassSubjectId) {
      return;
    }

    const payload = createSlotPayload(
      createDialogState.classId,
      selectedClassSubjectId,
      selectedDay,
      createDialogState.timeSlot.start_time,
      createDialogState.timeSlot.end_time,
      activeTemplate.id,
      selectedRoomId
    );

    if (!payload) {
      toast.error('Noto\'g\'ri sozlamalar');
      return;
    }

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Dars muvaffaqiyatli yaratildi');
      setCreateDialogState({ open: false });
      setSelectedClassSubjectId(undefined);
      setSelectedRoomId(undefined);
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.conflicts) {
        toast.error(`Vaqt to'qnashuvi: ${errorData.conflicts.join(', ')}`);
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error('Darsni yaratishda xatolik yuz berdi');
      }
    }
  }, [activeTemplate, createDialogState, selectedDay, selectedClassSubjectId, selectedRoomId, createMutation]);

  // Handle update slot
  const handleUpdateSlot = useCallback(async () => {
    if (!activeTemplate || !editDialogState.slot || !selectedClassSubjectId) {
      return;
    }

    const slot = editDialogState.slot;

    if (!slot.class_obj) {
      toast.error('Sinf ma\'lumoti topilmadi');
      return;
    }

    const payload = createSlotPayload(
      slot.class_obj,
      selectedClassSubjectId,
      selectedDay,
      slot.start_time,
      slot.end_time,
      activeTemplate.id,
      selectedRoomId
    );

    if (!payload) {
      toast.error('Noto\'g\'ri sozlamalar');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        slotId: slot.id,
        data: payload,
      });
      toast.success('Dars muvaffaqiyatli yangilandi');
      setEditDialogState({ open: false });
      setSelectedClassSubjectId(undefined);
      setSelectedRoomId(undefined);
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.class_subject) {
        toast.error('Tanlangan fan ushbu sinfga tegishli emas');
      } else if (errorData?.conflicts) {
        toast.error(`Vaqt to'qnashuvi: ${errorData.conflicts.join(', ')}`);
      } else if (errorData?.detail) {
        toast.error(errorData.detail);
      } else {
        toast.error('Darsni yangilashda xatolik yuz berdi');
      }
    }
  }, [activeTemplate, editDialogState, selectedDay, selectedClassSubjectId, selectedRoomId, updateMutation]);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialogState.slot) return;

    try {
      await deleteMutation.mutateAsync(deleteDialogState.slot.id);
      toast.success('Dars muvaffaqiyatli o\'chirildi');
      setDeleteDialogState({ open: false });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Darsni o\'chirishda xatolik yuz berdi');
    }
  }, [deleteDialogState, deleteMutation]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!activeTemplate) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Faol dars jadvali shabloni topilmadi. Iltimos, avval shablon yarating.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/branch-admin/schedule">Dars jadvaliga qaytish</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/branch-admin/schedule">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Dars jadvali shablonini tahrirlash</h1>
            <p className="text-sm text-gray-600 mt-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              {activeTemplate.name} ({activeTemplate.start_date} dan {activeTemplate.end_date} gacha)
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/branch-admin/schedule">Tayyor</Link>
        </Button>
      </div>

      {/* Day Tabs */}
      <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(Number(v))}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          {DAYS.map((day) => (
            <TabsTrigger key={day.value} value={day.value.toString()}>
              {day.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map((day) => (
          <TabsContent key={day.value} value={day.value.toString()}>
            <TimeBasedGrid
              classes={classes}
              slots={allSlots}
              dayOfWeek={day.value}
              onSlotClick={handleSlotClick}
              onSlotEdit={handleSlotEdit}
              onSlotDelete={handleSlotDelete}
              onSlotDrop={handleSlotDrop}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Slot Dialog */}
      <Dialog open={createDialogState.open} onOpenChange={(open) => setCreateDialogState({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dars qo'shish</DialogTitle>
            <DialogDescription>
              {classesData.find((c: Class) => c.id === createDialogState.classId)?.name} sinfi uchun{' '}
              {createDialogState.timeSlot?.label} vaqtiga dars qo'shish
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Subject Select */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Fan <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedClassSubjectId} onValueChange={setSelectedClassSubjectId}>
                <SelectTrigger id="subject" disabled={classSubjectsLoading}>
                  <SelectValue placeholder={classSubjectsLoading ? "Yuklanmoqda..." : "Fanni tanlang"} />
                </SelectTrigger>
                <SelectContent>
                  {classSubjectsLoading ? (
                    <div className="px-2 py-6 text-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Fanlar yuklanmoqda...
                    </div>
                  ) : classSubjectsError ? (
                    <div className="px-2 py-6 text-center text-sm text-red-500">
                      Fanlarni yuklashda xatolik yuz berdi
                    </div>
                  ) : (() => {
                    const validSubjects = classSubjects.filter((cs) => 
                      cs?.id && typeof cs.id === 'string' && cs.id.trim() !== ''
                    );
                    
                    if (validSubjects.length === 0) {
                      return (
                        <div className="px-2 py-6 text-center text-sm text-gray-500">
                          Bu sinf uchun faol fan mavjud emas
                        </div>
                      );
                    }
                    
                    return validSubjects.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.subject_name || 'Noma\'lum fan'} ({cs.teacher_name || 'O\'qituvchi biriktirilmagan'})
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Room Select */}
            <div className="space-y-2">
              <Label htmlFor="room">Xona</Label>
              <Select value={selectedRoomId || "_none"} onValueChange={handleRoomChange}>
                <SelectTrigger id="room" disabled={roomsLoading}>
                  <SelectValue placeholder={roomsLoading ? "Yuklanmoqda..." : "Xonani tanlang (ixtiyoriy)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Xonasiz</SelectItem>
                  {rooms
                    .filter((r) => r?.id && r.id.trim() !== '')
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.room_type_display}) - {r.capacity} o'rindi
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dars o'tiladigan xonani belgilang
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogState({ open: false })}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreateSlot} disabled={!selectedClassSubjectId || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog open={editDialogState.open} onOpenChange={(open) => setEditDialogState({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Darsni tahrirlash</DialogTitle>
            <DialogDescription>
              {editDialogState.slot && (
                <>
                  {editDialogState.slot.class_name} - {editDialogState.slot.subject_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Subject Select */}
            <div className="space-y-2">
              <Label htmlFor="edit-subject">
                Fan <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedClassSubjectId} onValueChange={setSelectedClassSubjectId}>
                <SelectTrigger id="edit-subject" disabled={classSubjectsLoading}>
                  <SelectValue placeholder={classSubjectsLoading ? "Yuklanmoqda..." : "Fanni tanlang"} />
                </SelectTrigger>
                <SelectContent>
                  {classSubjectsLoading ? (
                    <div className="px-2 py-6 text-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Fanlar yuklanmoqda...
                    </div>
                  ) : classSubjectsError ? (
                    <div className="px-2 py-6 text-center text-sm text-red-500">
                      Fanlarni yuklashda xatolik yuz berdi
                    </div>
                  ) : (() => {
                    const validSubjects = classSubjects.filter((cs) => 
                      cs?.id && typeof cs.id === 'string' && cs.id.trim() !== ''
                    );
                    
                    if (validSubjects.length === 0) {
                      return (
                        <div className="px-2 py-6 text-center text-sm text-gray-500">
                          Bu sinf uchun faol fan mavjud emas
                        </div>
                      );
                    }
                    
                    return validSubjects.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.subject_name || 'Noma\'lum fan'} ({cs.teacher_name || 'O\'qituvchi biriktirilmagan'})
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Room Select */}
            <div className="space-y-2">
              <Label htmlFor="edit-room">Xona</Label>
              <Select value={selectedRoomId || "_none"} onValueChange={handleRoomChange}>
                <SelectTrigger id="edit-room" disabled={roomsLoading}>
                  <SelectValue placeholder={roomsLoading ? "Yuklanmoqda..." : "Xonani tanlang (ixtiyoriy)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Xonasiz</SelectItem>
                  {rooms
                    .filter((r) => r?.id && r.id.trim() !== '')
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.room_type_display}) - {r.capacity} o'rindi
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogState({ open: false })}>
              Bekor qilish
            </Button>
            <Button onClick={handleUpdateSlot} disabled={!selectedClassSubjectId || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogState.slot && (
                <>
                  <span className="font-semibold">{deleteDialogState.slot.subject_name}</span> darsini{' '}
                  <span className="font-semibold">{deleteDialogState.slot.class_name}</span> sinfidan o'chirmoqchimisiz?
                  <br />
                  <br />
                  Bu amalni qaytarib bo'lmaydi.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogState({ open: false })}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
