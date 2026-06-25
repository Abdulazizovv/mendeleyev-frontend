'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { schoolApi } from '@/lib/api';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Shared add-lesson data type ──────────────────────────────────────────────

export interface AddLessonData {
  class_subject?: string;
  group?: string;
  date: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string;
  homework?: string;
  teacher_notes?: string;
  status: string;
}

// ── Context type ─────────────────────────────────────────────────────────────

export interface AddLessonContext {
  type: 'class' | 'group';
  id: string;       // classId or groupId
  name: string;     // className or groupName
  date: Date;
  lessonNumber: number;
  startTime: string;
  endTime: string;
}

// ── Dialog component ──────────────────────────────────────────────────────────

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: AddLessonContext | null;
  branchId: string;
  onSubmit: (data: AddLessonData) => void;
  isSubmitting?: boolean;
}

export function AddLessonDialog({
  open,
  onOpenChange,
  context,
  branchId,
  onSubmit,
  isSubmitting = false,
}: AddLessonDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId]       = useState<string>('_none');
  const [homework, setHomework]                   = useState('');
  const [teacherNotes, setTeacherNotes]           = useState('');

  // Reset on context change
  useEffect(() => {
    if (context) {
      setSelectedSubjectId('');
      setSelectedRoomId('_none');
      setHomework('');
      setTeacherNotes('');
    }
  }, [context]);

  // Fetch class subjects (only for class type)
  const { data: classSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['class-subjects', context?.id],
    queryFn: () => schoolApi.getClassSubjects(context!.id, { is_active: true }),
    enabled: open && !!context && context.type === 'class',
    staleTime: 60_000,
  });

  // Fetch rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['branch-rooms', branchId],
    queryFn: () => schoolApi.getRooms(branchId, { is_active: true }),
    enabled: open && !!branchId,
    staleTime: 60_000,
  });

  const loading = subjectsLoading || roomsLoading;

  const handleSubmit = () => {
    if (!context) return;
    if (context.type === 'class' && !selectedSubjectId) return;

    const data: AddLessonData = {
      date: format(context.date, 'yyyy-MM-dd'),
      lesson_number: context.lessonNumber,
      start_time: context.startTime,
      end_time: context.endTime,
      room: selectedRoomId === '_none' ? undefined : selectedRoomId,
      homework: homework.trim() || undefined,
      teacher_notes: teacherNotes.trim() || undefined,
      status: 'planned',
    };

    if (context.type === 'class') {
      data.class_subject = selectedSubjectId;
    } else {
      data.group = context.id;
    }

    onSubmit(data);
  };

  const handleClose = () => {
    setSelectedSubjectId('');
    setSelectedRoomId('_none');
    setHomework('');
    setTeacherNotes('');
    onOpenChange(false);
  };

  const isClassMode = context?.type === 'class';
  const canSubmit = !isSubmitting && !loading && (isClassMode ? !!selectedSubjectId : true);

  const dateLabel = context
    ? format(context.date, 'd MMMM yyyy', { locale: uz })
    : '';
  const timeLabel = context
    ? `${context.lessonNumber}-dars (${context.startTime}–${context.endTime})`
    : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isClassMode ? "Sinf darsi qo'shish" : "Guruh darsi qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {context?.name} · {dateLabel} · {timeLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Subject — only for class lessons */}
          {isClassMode && (
            <div className="space-y-1.5">
              <Label>Fan <span className="text-red-500">*</span></Label>
              {subjectsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fanlar yuklanmoqda...
                </div>
              ) : classSubjects.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                  Bu sinfga biriktirilgan fanlar topilmadi
                </p>
              ) : (
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fan tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {classSubjects.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cs.subject_name}</span>
                          {cs.teacher_name && (
                            <span className="text-xs text-gray-500">{cs.teacher_name}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Room */}
          <div className="space-y-1.5">
            <Label>Xona <span className="text-gray-400 text-xs">(ixtiyoriy)</span></Label>
            {roomsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Xonalar yuklanmoqda...
              </div>
            ) : (
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Xona tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Xonasiz —</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.capacity ? ` (${r.capacity} o'rindiq)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Homework */}
          <div className="space-y-1.5">
            <Label>Uy vazifasi <span className="text-gray-400 text-xs">(ixtiyoriy)</span></Label>
            <Textarea
              placeholder="Uy vazifasini kiriting..."
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Izoh <span className="text-gray-400 text-xs">(ixtiyoriy)</span></Label>
            <Textarea
              placeholder="Qo'shimcha izohlar..."
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dars qo'shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
