'use client';

import React from 'react';
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
import { formatDateUz, formatTimeUz } from '../constants/translations';
import type { LessonInstance } from '@/types/academic';
import { AlertTriangle } from 'lucide-react';

interface DeleteLessonDialogProps {
  lesson: LessonInstance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteLessonDialog({
  lesson,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteLessonDialogProps) {
  if (!lesson) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Darsni o'chirish
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-4 space-y-3">
            <p>
              Quyidagi darsni o'chirishni tasdiqlaysizmi?
            </p>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div>
                <span className="text-sm font-semibold text-gray-700">Fan:</span>
                <p className="text-base text-gray-900">{lesson.subject_name}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Sinf:</span>
                <p className="text-base text-gray-900">{lesson.class_name}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Sana va vaqt:</span>
                <p className="text-base text-gray-900">
                  {formatDateUz(new Date(lesson.date))}, {formatTimeUz(lesson.start_time)} - {formatTimeUz(lesson.end_time)}
                </p>
              </div>
              {lesson.teacher_name && (
                <div>
                  <span className="text-sm font-semibold text-gray-700">O'qituvchi:</span>
                  <p className="text-base text-gray-900">{lesson.teacher_name}</p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">Diqqat:</span> Bu amalni qaytarib bo'lmaydi. 
                Darsga tegishli barcha ma'lumotlar o'chiriladi.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Bekor qilish
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
