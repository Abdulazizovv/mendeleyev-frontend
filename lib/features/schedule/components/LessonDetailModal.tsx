'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Trash2,
  BookMarked
} from 'lucide-react';
import type { LessonInstance } from '@/types/academic';
import { 
  LESSON_STATUSES_UZ, 
  formatDateUz, 
  formatTimeUz,
  isLessonNow,
  isTimeInPast 
} from '../constants/translations';
import { cn } from '@/lib/utils';

interface LessonDetailModalProps {
  lesson: LessonInstance | null;
  open: boolean;
  onClose: () => void;
  onDelete: (lesson: LessonInstance) => void;
  onComplete?: (lesson: LessonInstance) => void;
}

export function LessonDetailModal({
  lesson,
  open,
  onClose,
  onDelete,
  onComplete,
}: LessonDetailModalProps) {
  if (!lesson) return null;

  const statusInfo = LESSON_STATUSES_UZ[lesson.status as keyof typeof LESSON_STATUSES_UZ] || LESSON_STATUSES_UZ.planned;
  const isNow = isLessonNow(new Date(lesson.date), lesson.start_time, lesson.end_time);
  const isPast = isTimeInPast(new Date(lesson.date), lesson.end_time);
  const canComplete = lesson.status === 'planned' && (isNow || isPast);

  const handleDelete = () => {
    onDelete(lesson);
    onClose();
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(lesson);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {lesson.subject_name || 'Fan nomi'}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {lesson.class_name}
              </DialogDescription>
            </div>
            <Badge 
              variant="secondary"
              className={cn('text-sm px-3 py-1', {
                'bg-blue-100 text-blue-700': lesson.status === 'planned',
                'bg-green-100 text-green-700': lesson.status === 'completed' || isNow,
                'bg-red-100 text-red-700': lesson.status === 'cancelled',
              })}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Lesson Alert */}
          {isNow && (
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-3">
              <div className="h-3 w-3 bg-green-600 rounded-full animate-pulse" />
              <p className="text-sm font-semibold text-green-800">
                Bu dars hozir davom etmoqda
              </p>
            </div>
          )}

          {/* Main Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Asosiy ma'lumotlar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Sana</span>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {formatDateUz(new Date(lesson.date))}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Vaqt</span>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {formatTimeUz(lesson.start_time)} - {formatTimeUz(lesson.end_time)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">O'qituvchi</span>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {lesson.teacher_name || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Xona</span>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {lesson.room_name || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookMarked className="h-4 w-4" />
                  <span className="text-sm">Dars raqami</span>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {lesson.lesson_number}-dars
                </p>
              </div>

              {lesson.is_auto_generated && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Generatsiya</span>
                  </div>
                  <p className="text-base font-medium text-gray-900 ml-6">
                    Avtomatik
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Topic Section */}
          {lesson.topic?.title && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Mavzu
                </h3>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-base font-medium text-gray-900">
                        {lesson.topic.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Homework Section */}
          {lesson.homework && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Uy vazifasi
                </h3>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {lesson.homework}
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Teacher Notes Section */}
          {lesson.teacher_notes && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  O'qituvchi izohlar
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {lesson.teacher_notes}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            {lesson.created_at && (
              <div>
                <span className="font-medium">Yaratilgan:</span>{' '}
                {new Date(lesson.created_at).toLocaleString('uz-UZ')}
              </div>
            )}
            {lesson.updated_at && (
              <div>
                <span className="font-medium">Yangilangan:</span>{' '}
                {new Date(lesson.updated_at).toLocaleString('uz-UZ')}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Yopish
          </Button>
          
          {canComplete && onComplete && (
            <Button 
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Darsni tugallash
            </Button>
          )}
          
          <Button 
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            O'chirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
