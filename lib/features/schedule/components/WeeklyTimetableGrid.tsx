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
        <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-3 mb-4 sticky top-0 bg-white z-10 pb-2">
          {/* Empty corner cell */}
          <div className="h-20 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
            <div className="text-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dars</span>
              <span className="block text-xs text-gray-400 mt-0.5">vaqti</span>
            </div>
          </div>
          
          {/* Day headers */}
          {weekDays.map(({ value, full, date }) => {
            const isToday = isSameDay(date, today);
            return (
              <div
                key={value}
                className={cn(
                  'h-20 rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-200',
                  isToday
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-md'
                    : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-gray-300'
                )}
              >
                <span className={cn('text-base font-bold', isToday ? 'text-blue-700' : 'text-gray-900')}>
                  {full}
                </span>
                <span className={cn('text-sm font-medium mt-1', isToday ? 'text-blue-600' : 'text-gray-600')}>
                  {format(date, 'd MMMM')}
                </span>
                {isToday && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                    <span className="text-xs text-blue-700 font-semibold">Bugun</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid - Time slots and lessons */}
        <div className="space-y-3">
          {TIME_SLOTS.map((timeSlot) => {
            const isCurrentLesson = timeSlot.number === currentLessonNumber;
            
            return (
              <div
                key={timeSlot.number}
                className={cn(
                  'grid grid-cols-[120px_repeat(6,1fr)] gap-3 min-h-[110px]',
                  isCurrentLesson && 'ring-2 ring-green-400 rounded-xl p-2 bg-green-50/30'
                )}
              >
                {/* Time slot label */}
                <div
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2 shadow-sm',
                    isCurrentLesson
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400'
                      : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                  )}
                >
                  <div className={cn(
                    'text-lg font-bold',
                    isCurrentLesson ? 'text-green-700' : 'text-gray-700'
                  )}>
                    {timeSlot.number}
                  </div>
                  <div className={cn(
                    'text-xs font-medium mt-1',
                    isCurrentLesson ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {timeSlot.start}
                  </div>
                  <div className={cn(
                    'text-xs font-medium',
                    isCurrentLesson ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {timeSlot.end}
                  </div>
                  {isCurrentLesson && (
                    <div className="mt-2 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                      Hozir
                    </div>
                  )}
                </div>

                {/* Lesson cells for each day */}
                {weekDays.map(({ value, date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const lessonsInCell = groupedLessons[dateKey]?.[timeSlot.number] || [];
                  const isToday = isSameDay(date, today);

                  return (
                    <div
                      key={`${value}-${timeSlot.number}`}
                      className={cn(
                        'min-h-[110px] rounded-lg border-2 transition-all duration-200',
                        lessonsInCell.length === 0
                          ? cn(
                              'border-dashed hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm group cursor-pointer',
                              isToday ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                            )
                          : 'border-transparent'
                      )}
                    >
                      {lessonsInCell.length > 0 ? (
                        <div className="space-y-2 p-2">
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
                          className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-blue-100/50 transition-all rounded-lg"
                        >
                          <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
                            <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <span className="text-xs text-gray-500 group-hover:text-blue-700 font-medium transition-colors">
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
        <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
          <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="h-5 w-1 bg-blue-600 rounded" />
            Ranglar tavsifi
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="h-4 w-4 bg-blue-100 border-2 border-blue-400 rounded shadow-sm" />
              <span className="text-sm font-medium text-gray-700">Rejalashtirilgan</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
              <div className="relative">
                <div className="h-4 w-4 bg-green-100 border-2 border-green-400 rounded shadow-sm" />
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-600 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-gray-700">Hozirgi dars</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors">
              <div className="h-4 w-4 bg-emerald-100 border-2 border-emerald-400 rounded shadow-sm" />
              <span className="text-sm font-medium text-gray-700">Tugallangan</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-4 w-4 bg-gray-100 border-2 border-gray-300 rounded opacity-70 shadow-sm" />
              <span className="text-sm font-medium text-gray-700">O'tgan darslar</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition-colors">
              <div className="h-4 w-4 bg-red-100 border-2 border-red-300 rounded shadow-sm" />
              <span className="text-sm font-medium text-gray-700">Bekor qilingan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
