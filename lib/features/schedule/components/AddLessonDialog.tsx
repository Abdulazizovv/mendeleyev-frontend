'use client';

import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { schoolApi } from '@/lib/api/school';
import { formatDateUz, TIME_SLOTS } from '../constants/translations';
import type { ClassSubject, Room } from '@/types/school';

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  lessonNumber: number | null;
  branchId: string;
  onSubmit: (data: AddLessonData) => void;
  isSubmitting?: boolean;
}

export interface AddLessonData {
  class_subject: string;
  date: string;
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string;
  topic?: string;
  homework?: string;
  teacher_notes?: string;
}

export function AddLessonDialog({
  open,
  onOpenChange,
  date,
  lessonNumber,
  branchId,
  onSubmit,
  isSubmitting = false,
}: AddLessonDialogProps) {
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [homework, setHomework] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');

  // Get time slot info
  const timeSlot = TIME_SLOTS.find((slot) => slot.number === lessonNumber);

  // Fetch all class subjects
  const { data: classSubjectsData, isLoading: classSubjectsLoading } = useQuery({
    queryKey: ['all-class-subjects', branchId],
    queryFn: async () => {
      // Get all active classes
      const classes = await schoolApi.getClasses(branchId, { is_active: true, page_size: 100 });
      
      // Get class subjects for all classes
      const allClassSubjects: ClassSubject[] = [];
      for (const cls of classes) {
        const subjects = await schoolApi.getClassSubjects(cls.id, { is_active: true });
        allClassSubjects.push(...subjects);
      }
      
      return allClassSubjects;
    },
    enabled: open && !!branchId,
  });

  // Fetch rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['rooms', branchId],
    queryFn: () => schoolApi.getRooms(branchId, { is_active: true }),
    enabled: open && !!branchId,
  });

  const handleSubmit = () => {
    if (!selectedClassSubjectId || !date || !lessonNumber || !timeSlot) return;

    const data: AddLessonData = {
      class_subject: selectedClassSubjectId,
      date: date.toISOString().split('T')[0],
      lesson_number: lessonNumber,
      start_time: `${timeSlot.start}:00`,
      end_time: `${timeSlot.end}:00`,
      room: selectedRoomId === '_none' ? undefined : selectedRoomId,
      homework: homework.trim() || undefined,
      teacher_notes: teacherNotes.trim() || undefined,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    setSelectedClassSubjectId(undefined);
    setSelectedRoomId(undefined);
    setHomework('');
    setTeacherNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yangi dars qo'shish</DialogTitle>
          <DialogDescription>
            {date && formatDateUz(date)} - {timeSlot?.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Subject Select */}
          <div className="space-y-2">
            <Label htmlFor="class-subject">
              Sinf va Fan <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedClassSubjectId} onValueChange={setSelectedClassSubjectId}>
              <SelectTrigger id="class-subject" disabled={classSubjectsLoading}>
                <SelectValue placeholder={classSubjectsLoading ? 'Yuklanmoqda...' : 'Sinf va fanni tanlang'} />
              </SelectTrigger>
              <SelectContent>
                {classSubjectsLoading ? (
                  <div className="px-2 py-6 text-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Yuklanmoqda...
                  </div>
                ) : classSubjectsData && classSubjectsData.length > 0 ? (
                  classSubjectsData
                    .filter((cs) => cs.id && cs.id.trim() !== '')
                    .map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cs.class_name}</span>
                          <span className="text-gray-500">-</span>
                          <span>{cs.subject_name}</span>
                          {cs.teacher_name && (
                            <span className="text-xs text-gray-500">({cs.teacher_name})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-gray-500">
                    Faol sinf-fanlar topilmadi
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Darsni o'tkaziladigan sinf va fanni tanlang
            </p>
          </div>

          {/* Room Select */}
          <div className="space-y-2">
            <Label htmlFor="room">Xona</Label>
            <Select 
              value={selectedRoomId || '_none'} 
              onValueChange={(v) => setSelectedRoomId(v === '_none' ? undefined : v)}
            >
              <SelectTrigger id="room" disabled={roomsLoading}>
                <SelectValue placeholder={roomsLoading ? 'Yuklanmoqda...' : 'Xonani tanlang (ixtiyoriy)'} />
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
          <Button onClick={handleSubmit} disabled={!selectedClassSubjectId || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dars qo'shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
