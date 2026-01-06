/**
 * Edit Lesson Drawer
 * Side drawer for quickly editing lesson details
 */

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { LessonInstance } from '@/types/academic';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X } from 'lucide-react';

interface EditLessonDrawerProps {
  lesson: LessonInstance | null;
  open: boolean;
  onClose: () => void;
  onSave: (lessonId: string, data: Partial<LessonInstance>) => Promise<void>;
  isLoading?: boolean;
}

interface LessonFormData {
  start_time: string;
  end_time: string;
  room_name: string;
  notes: string;
}

export const EditLessonDrawer: React.FC<EditLessonDrawerProps> = ({
  lesson,
  open,
  onClose,
  onSave,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LessonFormData>();

  useEffect(() => {
    if (lesson) {
      reset({
        start_time: lesson.start_time.substring(0, 5), // HH:mm
        end_time: lesson.end_time.substring(0, 5),
        room_name: lesson.room_name || '',
        notes: lesson.notes || '',
      });
    }
  }, [lesson, reset]);

  const onSubmit = async (data: LessonFormData) => {
    if (!lesson) return;

    await onSave(lesson.id, {
      start_time: `${data.start_time}:00`,
      end_time: `${data.end_time}:00`,
      room_name: data.room_name || undefined,
      notes: data.notes || undefined,
    });

    onClose();
  };

  if (!lesson) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Lesson</SheetTitle>
          <SheetDescription>
            Modify lesson time, room, or notes
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Lesson Info (Read-only) */}
          <div className="space-y-2 pb-4 border-b">
            <div>
              <span className="text-sm font-medium">Subject:</span>
              <span className="text-sm ml-2">{lesson.subject_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Class:</span>
              <span className="text-sm ml-2">{lesson.class_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Teacher:</span>
              <span className="text-sm ml-2">{lesson.teacher_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm ml-2">{lesson.date}</span>
            </div>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              id="start_time"
              type="time"
              {...register('start_time', { required: 'Start time is required' })}
              className={errors.start_time ? 'border-red-500' : ''}
            />
            {errors.start_time && (
              <p className="text-sm text-red-500">{errors.start_time.message}</p>
            )}
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Input
              id="end_time"
              type="time"
              {...register('end_time', { required: 'End time is required' })}
              className={errors.end_time ? 'border-red-500' : ''}
            />
            {errors.end_time && (
              <p className="text-sm text-red-500">{errors.end_time.message}</p>
            )}
          </div>

          {/* Room */}
          <div className="space-y-2">
            <Label htmlFor="room_name">Room</Label>
            <Input
              id="room_name"
              {...register('room_name')}
              placeholder="e.g., Room 101"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
