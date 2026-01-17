'use client';

import React, { useMemo, useEffect } from 'react';
import { Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonInstance } from '@/types/academic';
import type { BranchSettings, Class } from '@/types/school';
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
  classes: Class[];
  isLoading?: boolean;
}

interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
  label: string;
  isLunchBreak?: boolean; // Tushlik vaqti marker
}

// Days of week in Uzbek (Mon-Sun)
// Note: JavaScript Date.getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
const DAYS_UZ = [
  { value: 1, short: 'Du', full: 'Dushanba' },  // Monday
  { value: 2, short: 'Se', full: 'Seshanba' },  // Tuesday
  { value: 3, short: 'Chor', full: 'Chorshanba' }, // Wednesday
  { value: 4, short: 'Pay', full: 'Payshanba' }, // Thursday
  { value: 5, short: 'Ju', full: 'Juma' },       // Friday
  { value: 6, short: 'Shan', full: 'Shanba' },   // Saturday
  { value: 0, short: 'Yak', full: 'Yakshanba' }, // Sunday
];

/**
 * Generate time slots based on branch settings
 * Creates dynamic time slots considering lesson duration, break times, and lunch break
 */
function generateTimeSlots(settings: BranchSettings): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startTime = parse(settings.school_start_time.substring(0, 5), 'HH:mm', new Date());
  // Use daily_lesson_end_time if available, otherwise fall back to school_end_time
  const endTimeStr = settings.daily_lesson_end_time || settings.school_end_time;
  const endTime = parse(endTimeStr.substring(0, 5), 'HH:mm', new Date());
  
  // Parse lunch break times if available
  const lunchStart = settings.lunch_break_start 
    ? parse(settings.lunch_break_start.substring(0, 5), 'HH:mm', new Date())
    : null;
  const lunchEnd = settings.lunch_break_end 
    ? parse(settings.lunch_break_end.substring(0, 5), 'HH:mm', new Date())
    : null;
  
  let currentTime = startTime;
  let slotNumber = 1;
  let lunchAdded = false;
  
  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, settings.lesson_duration_minutes);
    
    // Check if lesson would exceed school end time
    if (slotEnd > endTime) break;
    
    // Check if this lesson would overlap with lunch break
    if (lunchStart && lunchEnd && !lunchAdded && slotEnd > lunchStart && currentTime < lunchEnd) {
      // Add lunch break slot if we haven't added it yet
      if (currentTime < lunchStart) {
        // We're before lunch, so add lunch now
        slots.push({
          start: format(lunchStart, 'HH:mm'),
          end: format(lunchEnd, 'HH:mm'),
          label: '🍽️ Tushlik vaqti',
          isLunchBreak: true,
        });
        lunchAdded = true;
      }
      
      // Move to end of lunch break and continue
      currentTime = lunchEnd;
      continue;
    }
    
    // Add regular lesson slot
    slots.push({
      start: format(currentTime, 'HH:mm'),
      end: format(slotEnd, 'HH:mm'),
      label: `${slotNumber}-dars`,
      isLunchBreak: false,
    });
    
    slotNumber++;
    
    // Move to next slot (add break time)
    currentTime = addMinutes(slotEnd, settings.break_duration_minutes);
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

/**
 * Calculate progress percentage within current time slot
 * Returns percentage (0-100) of how far through the current slot we are
 */
function getCurrentTimeProgress(timeSlot: TimeSlot): number {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  // Parse start and end times
  const [startHour, startMin] = timeSlot.start.split(':').map(Number);
  const [endHour, endMin] = timeSlot.end.split(':').map(Number);
  const [currHour, currMin] = currentTime.split(':').map(Number);
  
  // Convert to minutes from midnight
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const currentMinutes = currHour * 60 + currMin;
  
  // Calculate progress
  const totalDuration = endMinutes - startMinutes;
  const elapsed = currentMinutes - startMinutes;
  
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
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

  // Keyboard shortcuts for navigation (Arrow Left/Right)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        // Previous day
        onDateChange(addDays(selectedDate, -1));
      } else if (e.key === 'ArrowRight') {
        // Next day
        onDateChange(addDays(selectedDate, 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDate, onDateChange]);

  // Generate time slots from branch settings
  const timeSlots = useMemo(() => {
    return generateTimeSlots(branchSettings);
  }, [branchSettings]);

  // Get current time slot
  const currentTimeSlotIndex = useMemo(() => {
    return getCurrentTimeSlot(timeSlots);
  }, [timeSlots, currentTime]);

  // Create week days array (Mon-Sun, 7 days)
  const weekDays = useMemo(() => {
    return DAYS_UZ.map((day, index) => ({
      ...day,
      date: addDays(weekStart, index), // weekStart should be Monday
    }));
  }, [weekStart]);

  // Filter lessons for selected date only
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => lesson.date === selectedDateKey);
  }, [lessons, selectedDateKey]);

  // Build complete class list from both provided classes and lessons
  const allClasses = useMemo(() => {
    const classMap = new Map<string, Class>();
    
    // Add provided classes first (they come ordered by grade_level from API)
    classes.forEach(cls => {
      classMap.set(cls.name, cls);
    });
    
    // Add classes from lessons that aren't in the list yet
    filteredLessons.forEach(lesson => {
      if (lesson.class_name && !classMap.has(lesson.class_name)) {
        // Create a temporary class object with estimated grade_level from name
        const gradeMatch = lesson.class_name.match(/(\d+)/);
        classMap.set(lesson.class_name, {
          id: lesson.class_id || `temp-${lesson.class_name}`,
          name: lesson.class_name,
          grade_level: gradeMatch ? parseInt(gradeMatch[1]) : 999,
          section: '',
        } as Class);
      }
    });
    
    // Sort classes by grade_level, then by name
    return Array.from(classMap.values()).sort((a, b) => 
      a.grade_level - b.grade_level || a.name.localeCompare(b.name)
    );
  }, [classes, filteredLessons]);

  // Helper function to find the nearest time slot for a given time
  const findNearestTimeSlot = (lessonTime: string, slots: TimeSlot[]): string => {
    if (!lessonTime) return '';
    
    // Parse lesson time (HH:mm:ss or HH:mm format)
    const lessonTimeStr = lessonTime.substring(0, 5); // Get HH:mm
    const [lessonHour, lessonMin] = lessonTimeStr.split(':').map(Number);
    const lessonMinutes = lessonHour * 60 + lessonMin;
    
    // Find the closest slot
    let closestSlot = slots[0];
    let minDiff = Infinity;
    
    for (const slot of slots) {
      if (slot.isLunchBreak) continue; // Skip lunch break slots
      
      const [slotHour, slotMin] = slot.start.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;
      const diff = Math.abs(lessonMinutes - slotMinutes);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestSlot = slot;
      }
    }
    
    return closestSlot.start;
  };

  // Group lessons by time slot and class - maps lessons to nearest time slot
  const lessonsBySlotAndClass = useMemo(() => {
    const grouped: Record<string, Record<string, LessonInstance[]>> = {};
    
    filteredLessons.forEach(lesson => {
      // Find the nearest time slot for this lesson
      const nearestSlotTime = findNearestTimeSlot(lesson.start_time || '', timeSlots);
      const timeKey = nearestSlotTime || lesson.start_time?.substring(0, 5) || '';
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
  }, [filteredLessons, timeSlots]);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const isSunday = selectedDate.getDay() === 0;

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

      {/* If Sunday is selected, show special message */}
      {isSunday ? (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dam olish kuni
            </h3>
            <p className="text-sm text-gray-600">
              Yakshanba kuni darslar bo'lmaydi. Iltimos, boshqa kunni tanlang.
            </p>
          </div>
        </div>
      ) : (
        <>
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

      {/* Timetable Grid - with sticky headers and time column */}
      <div className="border rounded-lg bg-white overflow-hidden">
        {/* Scrollable Container - horizontal scroll only */}
        <div className="overflow-x-auto overflow-y-visible relative">
          <div className="inline-block min-w-full">
            {/* Header Row - Classes (Sticky Top) */}
            <div className="flex border-b-2 border-gray-200 bg-gray-50 sticky top-0 z-30 shadow-sm">
              {/* Time Column Header (Sticky Top-Left Corner) */}
              <div className="w-[140px] shrink-0 p-4 border-r-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50 sticky left-0 z-40">
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
                const isLunchBreak = timeSlot.isLunchBreak;
                
                // Special rendering for lunch break
                if (isLunchBreak) {
                  return (
                    <div
                      key={`lunch-${slotIndex}`}
                      className="flex border-b border-gray-200 h-16 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50"
                    >
                      {/* Lunch Time Cell (Sticky Left) */}
                      <div className="w-[140px] shrink-0 p-2 border-r-2 border-amber-300 flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 sticky left-0 z-20">
                        <div className="text-lg mb-0.5">🍽️</div>
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                          Tushlik
                        </div>
                        <div className="text-xs font-medium text-amber-900">
                          {timeSlot.start} - {timeSlot.end}
                        </div>
                      </div>
                      
                      {/* Lunch break spans all classes */}
                      <div className="flex-1 flex items-center justify-center border-r border-amber-200">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-amber-800">
                            {timeSlot.label}
                          </div>
                          <div className="text-xs text-amber-600 mt-0.5">
                            Barcha sinflar uchun
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={slotIndex}
                    className={cn(
                      'flex border-b border-gray-200 last:border-b-0 min-h-[120px] relative',
                      isCurrentSlot && 'bg-green-50/50'
                    )}
                  >
                    {/* Real-time horizontal progress line */}
                    {isCurrentSlot && (
                      <div 
                        className="absolute left-0 right-0 z-30 pointer-events-none"
                        style={{ 
                          top: `${getCurrentTimeProgress(timeSlot)}%`,
                          transition: 'top 1s linear'
                        }}
                      >
                        {/* Main line */}
                        <div className="h-1 bg-green-500 shadow-lg relative">
                          {/* Animated pulse dot at the left */}
                          <div className="absolute -left-1.5 -top-1.5 w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-lg border-2 border-white" />
                          {/* Time label */}
                          <div className="absolute -top-8 left-3 px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded shadow-lg whitespace-nowrap">
                            {format(currentTime, 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time Cell (Sticky Left) */}
                    <div
                      className={cn(
                        'w-[140px] shrink-0 p-4 border-r-2 border-gray-200 flex flex-col items-center justify-center sticky left-0 z-20',
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
        </>
      )}
    </div>
  );
}
