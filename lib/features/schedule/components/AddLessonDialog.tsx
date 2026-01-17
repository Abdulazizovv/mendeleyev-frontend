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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { scheduleApi } from '../api';
import { formatDateUz } from '../constants/translations';
import { formatDateForAPI } from '../utils/time';
import type { AddLessonData, ScheduleAvailabilityResponse } from '@/types/academic';

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: { date: Date; lessonNumber: number; startTime: string; endTime: string; classId: string; className: string } | null;
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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [homework, setHomework] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');

  // Get time slot info
  const timeSlot = context ? {
    start: context.startTime,
    end: context.endTime,
    label: `${context.lessonNumber}-dars (${context.startTime}-${context.endTime})`
  } : null;

  // Check availability when dialog opens and context changes
  const { data: availability, isLoading: availabilityLoading, error: availabilityError } = useQuery({
    queryKey: ['schedule-availability', branchId, context?.classId, context?.date, context?.startTime, context?.endTime],
    queryFn: async () => {
      if (!context?.classId || !context?.date || !context?.startTime || !context?.endTime) {
        throw new Error('Missing required parameters');
      }
      return await scheduleApi.checkScheduleAvailability(branchId, {
        class_id: context.classId,
        date: formatDateForAPI(context.date),
        start_time: context.startTime,
        end_time: context.endTime,
      });
    },
    enabled: open && !!context?.classId && !!context?.date && !!context?.startTime && !!context?.endTime,
  });

  // Reset form when context changes
  useEffect(() => {
    if (context) {
      setSelectedSubjectId(undefined);
      setSelectedRoomId(undefined);
      setHomework('');
      setTeacherNotes('');
    }
  }, [context]);

  const handleSubmit = () => {
    if (!selectedSubjectId || !context || !timeSlot) return;

    const data: AddLessonData = {
      class_subject: selectedSubjectId,
      date: formatDateForAPI(context.date),
      lesson_number: context.lessonNumber,
      start_time: context.startTime,
      end_time: context.endTime,
      room: selectedRoomId === '_none' ? undefined : selectedRoomId,
      homework: homework.trim() || undefined,
      teacher_notes: teacherNotes.trim() || undefined,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    setSelectedSubjectId(undefined);
    setSelectedRoomId(undefined);
    setHomework('');
    setTeacherNotes('');
    onOpenChange(false);
  };

  if (!context || !timeSlot) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yangi dars qo'shish</DialogTitle>
          <DialogDescription>
            {context.className} sinfi • {formatDateUz(context.date)} • {timeSlot.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Availability Status */}
          {availabilityLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Mavjudlik tekshirilmoqda...</span>
            </div>
          )}

          {availabilityError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mavjudlikni tekshirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.
              </AlertDescription>
            </Alert>
          )}

          {availability && availability.conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Konfliktlar topildi:</div>
                <ul className="list-disc list-inside space-y-1">
                  {availability.conflicts.map((conflict, index) => (
                    <li key={index} className="text-sm">
                      {conflict.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Subject Select */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Fan <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
              disabled={availabilityLoading || !availability}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder={
                  availabilityLoading ? 'Yuklanmoqda...' :
                  !availability ? 'Mavjudlik tekshirilmoqda...' :
                  availability.available_subjects.length === 0 ? 'Mavjud fanlar yo\'q' :
                  'Fan tanlang'
                } />
              </SelectTrigger>
              <SelectContent>
                {availability?.available_subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{subject.subject_name}</span>
                      <span className="text-gray-500">-</span>
                      <span className="text-sm text-gray-600">{subject.teacher_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Faqat ushbu vaqtda mavjud bo'lgan fanlar ko'rsatiladi
            </p>
          </div>

          {/* Room Select */}
          <div className="space-y-2">
            <Label htmlFor="room">Xona</Label>
            <Select
              value={selectedRoomId || '_none'}
              onValueChange={(v) => setSelectedRoomId(v === '_none' ? undefined : v)}
              disabled={availabilityLoading || !availability}
            >
              <SelectTrigger id="room">
                <SelectValue placeholder={
                  availabilityLoading ? 'Yuklanmoqda...' :
                  !availability ? 'Mavjudlik tekshirilmoqda...' :
                  'Xonani tanlang (ixtiyoriy)'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Xonasiz</SelectItem>
                {availability?.available_rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} ({room.capacity} o'rindiq)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Faqat ushbu vaqtda bo'sh bo'lgan xonalar ko'rsatiladi
            </p>
          </div>

          {/* Homework */}
          <div className="space-y-2">
            <Label htmlFor="homework">Uy vazifasi</Label>
            <Textarea
              id="homework"
              placeholder="Uy vazifasini kiriting (ixtiyoriy)"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              rows={3}
            />
          </div>

          {/* Teacher Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">O'qituvchi uchun izohlar</Label>
            <Textarea
              id="notes"
              placeholder="Qo'shimcha izohlar (ixtiyoriy)"
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
          <Button
            onClick={handleSubmit}
            disabled={!selectedSubjectId || availabilityLoading || !availability || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dars qo'shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
