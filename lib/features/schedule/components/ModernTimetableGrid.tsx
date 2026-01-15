'use client';

import React, { useMemo, useEffect } from 'react';
import { Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonInstance } from '@/types/academic';
import type { BranchSettings } from '@/types/school';
import { LessonCard } from './LessonCard';
import { format, addDays, isSameDay, parse, addMinutes } from 'date-fns';
import { uz } from 'date-fns/locale';

interface ModernTimetableGridProps {
  lessons: LessonInstance[];
  weekStart: Date;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onLessonClick: (lesson: LessonInstance) => void;
  onLessonDelete: (lesson: LessonInstance) => void;
  onAddLesson: (date: Date, startTime: string, endTime: string, classId: string, className: string) => void;
  branchSettings: BranchSettings;
  classes: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
  label: string;
}

// Days of week in Uzbek (Mon-Sat)
const DAYS_UZ = [
  { value: 0, short: 'Du', full: 'Dushanba' },
  { value: 1, short: 'Se', full: 'Seshanba' },
  { value: 2, short: 'Chor', full: 'Chorshanba' },
  { value: 3, short: 'Pay', full: 'Payshanba' },
  { value: 4, short: 'Ju', full: 'Juma' },
  { value: 5, short: 'Shan', full: 'Shanba' },
];

/**
 * Generate time slots based on branch settings
 * Creates dynamic time slots considering lesson duration and break times
 */
function generateTimeSlots(settings: BranchSettings): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startTime = parse(settings.school_start_time.substring(0, 5), 'HH:mm', new Date());
  const endTime = parse(settings.school_end_time.substring(0, 5), 'HH:mm', new Date());
  
  let currentTime = startTime;
  let slotNumber = 1;
  
  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, settings.lesson_duration_minutes);
    
    // Stop if lesson would exceed school end time
    if (slotEnd > endTime) break;
    
    slots.push({
      start: format(currentTime, 'HH:mm'),
      end: format(slotEnd, 'HH:mm'),
      label: `${slotNumber}-dars`,
    });
    
    // Add break time before next slot (except for last slot)
    const nextSlotStart = addMinutes(slotEnd, settings.break_duration_minutes);
    
    // Check if there's enough time for another lesson
    const potentialNextEnd = addMinutes(nextSlotStart, settings.lesson_duration_minutes);
    if (potentialNextEnd > endTime) break;
    
    currentTime = nextSlotStart;
    slotNumber++;
  }
  
  return slots;
}

/**
 * Get current time slot index if current time is within school hours
 */
function getCurrentTimeSlot(timeSlots: TimeSlot[]): number | null {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  for (let i = 0; i < timeSlots.length; i++) {
    const slot = timeSlots[i];
    if (currentTime >= slot.start && currentTime <= slot.end) {
      return i;
    }
  }
  
  return null;
}

export function ModernTimetableGrid({
  lessons,
  weekStart,
  selectedDate,
  onDateChange,
  onLessonClick,
  onLessonDelete,
  onAddLesson,
  branchSettings,
  classes,
  isLoading,
}: ModernTimetableGridProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Generate time slots from branch settings
  const timeSlots = useMemo(() => {
    return generateTimeSlots(branchSettings);
  }, [branchSettings]);

  // Get current time slot
  const currentTimeSlotIndex = useMemo(() => {
    return getCurrentTimeSlot(timeSlots);
  }, [timeSlots, currentTime]);

  // Create week days array
  const weekDays = useMemo(() => {
    return DAYS_UZ.map((day, index) => ({
      ...day,
      date: addDays(weekStart, index),
    }));
  }, [weekStart]);

  // Filter lessons for selected date only
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => lesson.date === selectedDateKey);
  }, [lessons, selectedDateKey]);

  // Build complete class list from both provided classes and lessons
  const allClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string }>();
    
    // Add provided classes first (they come ordered by grade_level from API)
    classes.forEach(cls => {
      classMap.set(cls.name, { id: cls.id, name: cls.name });
    });
    
    // Add classes from lessons that aren't in the list yet
    filteredLessons.forEach(lesson => {
      if (lesson.class_name && !classMap.has(lesson.class_name)) {
        classMap.set(lesson.class_name, {
          id: lesson.class_id || `temp-${lesson.class_name}`,
          name: lesson.class_name,
        });
      }
    });
    
    // Return in the order they were added (preserving API ordering)
    return Array.from(classMap.values());
  }, [classes, filteredLessons]);

  // Group lessons by time slot and class - NEW improved structure
  const lessonsBySlotAndClass = useMemo(() => {
    const grouped: Record<string, Record<string, LessonInstance[]>> = {};
    
    filteredLessons.forEach(lesson => {
      const timeKey = lesson.start_time?.substring(0, 5) || ''; // HH:mm format
      const className = lesson.class_name || 'Unknown';
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = {};
      }
      if (!grouped[timeKey][className]) {
        grouped[timeKey][className] = [];
      }
      grouped[timeKey][className].push(lesson);
    });
    
    return grouped;
  }, [filteredLessons]);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  return (
    <div className="space-y-4">
      {/* Day Selector - Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {weekDays.map(({ value, short, full, date }) => {
          const isSelected = isSameDay(date, selectedDate);
          const isDayToday = isSameDay(date, today);
          
          return (
            <button
              key={value}
              onClick={() => onDateChange(date)}
              className={cn(
                'shrink-0 px-6 py-3 rounded-lg border-2 transition-all duration-200 min-w-[120px]',
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                  : isDayToday
                  ? 'bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="text-center">
                <div className={cn('text-sm font-medium', isSelected ? 'text-white' : isDayToday ? 'text-blue-700' : 'text-gray-500')}>
                  {short}
                </div>
                <div className={cn('text-lg font-bold mt-1', isSelected ? 'text-white' : 'text-gray-900')}>
                  {format(date, 'd MMM', { locale: uz })}
                </div>
                {isDayToday && !isSelected && (
                  <div className="mt-1 text-xs font-semibold text-blue-600">Bugun</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Info */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: uz })}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredLessons.length} ta dars rejalashtirilgan
          </p>
        </div>
        {isToday && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm">
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-semibold">
              Hozir {format(currentTime, 'HH:mm')}
            </span>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <div className="border rounded-lg bg-white overflow-hidden">
        {/* Horizontal Scroll Container */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header Row - Classes */}
            <div className="flex border-b-2 border-gray-200 bg-gray-50 sticky top-0 z-20">
              {/* Time Column Header */}
              <div className="w-[140px] shrink-0 p-4 border-r-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50">
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto text-gray-500 mb-1" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Vaqt</span>
                </div>
              </div>

              {/* Class Headers */}
              {allClasses.map((classItem) => (
                <div
                  key={classItem.name}
                  className="w-[180px] shrink-0 p-4 border-r border-gray-200 last:border-r-0"
                >
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900">{classItem.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {/* Count lessons for this class across all time slots */}
                      {Object.values(lessonsBySlotAndClass).reduce((count, slotLessons) => {
                        return count + (slotLessons[classItem.name]?.length || 0);
                      }, 0)} ta dars
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots Rows */}
            <div className="relative">
              {timeSlots.map((timeSlot, slotIndex) => {
                const isCurrentSlot = slotIndex === currentTimeSlotIndex && isToday;
                
                return (
                  <div
                    key={slotIndex}
                    className={cn(
                      'flex border-b border-gray-200 last:border-b-0 min-h-[120px]',
                      isCurrentSlot && 'bg-green-50/50'
                    )}
                  >
                    {/* Time Cell */}
                    <div
                      className={cn(
                        'w-[140px] shrink-0 p-4 border-r-2 border-gray-200 flex flex-col items-center justify-center',
                        isCurrentSlot
                          ? 'bg-green-100 border-green-400'
                          : 'bg-gray-50'
                      )}
                    >
                      <div className={cn(
                        'text-xs font-semibold uppercase tracking-wide',
                        isCurrentSlot ? 'text-green-700' : 'text-gray-500'
                      )}>
                        {timeSlot.label}
                      </div>
                      <div className={cn(
                        'text-lg font-bold mt-2',
                        isCurrentSlot ? 'text-green-700' : 'text-gray-900'
                      )}>
                        {timeSlot.start}
                      </div>
                      <div className={cn(
                        'text-sm font-medium',
                        isCurrentSlot ? 'text-green-600' : 'text-gray-600'
                      )}>
                        {timeSlot.end}
                      </div>
                      {isCurrentSlot && (
                        <div className="mt-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full animate-pulse">
                          Hozir
                        </div>
                      )}
                    </div>

                    {/* Class Cells - Each cell represents one time slot + one class */}
                    {allClasses.map((classItem) => {
                      const lessonsInCell = lessonsBySlotAndClass[timeSlot.start]?.[classItem.name] || [];
                      
                      return (
                        <div
                          key={`${timeSlot.start}-${classItem.name}`}
                          className={cn(
                            'w-[180px] shrink-0 p-3 border-r border-gray-200 last:border-r-0 min-h-[120px] relative',
                            lessonsInCell.length === 0 && 'hover:bg-blue-50/50 cursor-pointer group transition-colors',
                            isCurrentSlot && lessonsInCell.length > 0 && 'ring-2 ring-green-500 ring-inset'
                          )}
                        >
                          {lessonsInCell.length > 0 ? (
                            <div className="space-y-2 h-full">
                              {lessonsInCell.map((lesson) => (
                                <LessonCard
                                  key={lesson.id}
                                  lesson={lesson}
                                  onClick={onLessonClick}
                                  onDelete={onLessonDelete}
                                  compact={lessonsInCell.length > 1}
                                  isCurrentLesson={isCurrentSlot}
                                />
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => onAddLesson(selectedDate, timeSlot.start, timeSlot.end, classItem.id, classItem.name)}
                              className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="p-2 rounded-full bg-white border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-colors">
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
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredLessons.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Darslar rejalashtirilmagan
            </h3>
            <p className="text-sm text-gray-600">
              Bu kun uchun hali darslar qo'shilmagan. Jadvalga dars qo'shish uchun bo'sh katak ustiga bosing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
