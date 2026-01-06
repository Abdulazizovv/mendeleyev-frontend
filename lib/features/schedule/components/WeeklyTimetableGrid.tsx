'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LessonInstance } from '@/types/academic';
import { LessonCard } from './LessonCard';
import { DAYS_UZ, TIME_SLOTS, getCurrentLessonNumber } from '../constants/translations';
import { format, addDays, isSameDay } from 'date-fns';

interface WeeklyTimetableGridProps {
  lessons: LessonInstance[];
  weekStart: Date;
  onLessonClick: (lesson: LessonInstance) => void;
  onLessonDelete: (lesson: LessonInstance) => void;
  onAddLesson: (date: Date, lessonNumber: number) => void;
  isLoading?: boolean;
}

export function WeeklyTimetableGrid({
  lessons,
  weekStart,
  onLessonClick,
  onLessonDelete,
  onAddLesson,
  isLoading,
}: WeeklyTimetableGridProps) {
  // Group lessons by date and lesson number
  const groupedLessons = useMemo(() => {
    const grouped: Record<string, Record<number, LessonInstance[]>> = {};
    
    lessons.forEach((lesson) => {
      const dateKey = lesson.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      // Use lesson_number if available, otherwise default to 1
      const lessonNum = lesson.lesson_number ?? 1;
      if (!grouped[dateKey][lessonNum]) {
        grouped[dateKey][lessonNum] = [];
      }
      grouped[dateKey][lessonNum].push(lesson);
    });
    
    return grouped;
  }, [lessons]);

  // Get current lesson number for highlighting
  const currentLessonNumber = getCurrentLessonNumber(new Date());
  const today = new Date();

  // Create week days array
  const weekDays = DAYS_UZ.map((day, index) => ({
    ...day,
    date: addDays(weekStart, index),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header - Days */}
        <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-2 mb-4 sticky top-0 bg-white z-10 pb-2">
          {/* Empty corner cell */}
          <div className="h-16 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">Vaqt</span>
          </div>
          
          {/* Day headers */}
          {weekDays.map(({ value, full, date }) => {
            const isToday = isSameDay(date, today);
            return (
              <div
                key={value}
                className={cn(
                  'h-16 rounded-lg flex flex-col items-center justify-center border-2 transition-colors',
                  isToday
                    ? 'bg-blue-50 border-blue-400 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <span className={cn('text-sm font-semibold', isToday ? 'text-blue-700' : 'text-gray-900')}>
                  {full}
                </span>
                <span className={cn('text-xs', isToday ? 'text-blue-600' : 'text-gray-500')}>
                  {format(date, 'd MMM')}
                </span>
                {isToday && (
                  <div className="mt-1 h-1.5 w-1.5 bg-blue-600 rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Grid - Time slots and lessons */}
        <div className="space-y-2">
          {TIME_SLOTS.map((timeSlot) => {
            const isCurrentLesson = timeSlot.number === currentLessonNumber;
            
            return (
              <div
                key={timeSlot.number}
                className={cn(
                  'grid grid-cols-[100px_repeat(6,1fr)] gap-2 min-h-[100px]',
                  isCurrentLesson && 'ring-2 ring-green-400 rounded-lg p-1'
                )}
              >
                {/* Time slot label */}
                <div
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2',
                    isCurrentLesson
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <span className={cn('text-xs font-semibold', isCurrentLesson ? 'text-green-700' : 'text-gray-700')}>
                    {timeSlot.number}-dars
                  </span>
                  <span className={cn('text-xs mt-1', isCurrentLesson ? 'text-green-600' : 'text-gray-500')}>
                    {timeSlot.start}
                  </span>
                  <span className={cn('text-xs', isCurrentLesson ? 'text-green-600' : 'text-gray-500')}>
                    {timeSlot.end}
                  </span>
                  {isCurrentLesson && (
                    <div className="mt-1.5 h-1.5 w-1.5 bg-green-600 rounded-full animate-pulse" />
                  )}
                </div>

                {/* Lesson cells for each day */}
                {weekDays.map(({ value, date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const lessonsInCell = groupedLessons[dateKey]?.[timeSlot.number] || [];

                  return (
                    <div
                      key={`${value}-${timeSlot.number}`}
                      className={cn(
                        'min-h-[100px] rounded-lg border-2 transition-all',
                        lessonsInCell.length === 0
                          ? 'border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                          : 'border-transparent'
                      )}
                    >
                      {lessonsInCell.length > 0 ? (
                        <div className="space-y-2 p-1">
                          {lessonsInCell.map((lesson) => (
                            <LessonCard
                              key={lesson.id}
                              lesson={lesson}
                              onClick={onLessonClick}
                              onDelete={onLessonDelete}
                              compact={lessonsInCell.length > 1}
                            />
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddLesson(date, timeSlot.number)}
                          className="w-full h-full flex flex-col items-center justify-center gap-2 group hover:bg-blue-50/50 transition-colors rounded-lg"
                        >
                          <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                            Dars qo'shish
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Belgilar</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-200 border-2 border-blue-400 rounded" />
              <span>Rejalashtirilgan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-200 border-2 border-green-400 rounded ring-2 ring-green-400" />
              <span>Hozirgi dars</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-emerald-200 border-2 border-emerald-400 rounded" />
              <span>Tugallangan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-gray-200 border-2 border-gray-300 rounded opacity-70" />
              <span>O'tgan darslar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-200 border-2 border-red-300 rounded" />
              <span>Bekor qilingan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
