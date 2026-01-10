'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { formatDateUz } from '../constants/translations';
import { cn } from '@/lib/utils';
import type { BranchSettings } from '@/types/school';
import { parse, addMinutes, format as formatTime } from 'date-fns';

interface CurrentTimeDisplayProps {
  className?: string;
  showSeconds?: boolean;
  branchSettings?: BranchSettings;
}

/**
 * Get current lesson number based on branch settings
 * Returns null if not during a lesson (break, before school, after school, or lunch)
 */
function getCurrentLessonFromSettings(branchSettings: BranchSettings, currentTime: Date): number | null {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Parse lunch break times if available
  const lunchStart = branchSettings.lunch_break_start?.substring(0, 5);
  const lunchEnd = branchSettings.lunch_break_end?.substring(0, 5);
  
  // Check if it's lunch break
  if (lunchStart && lunchEnd && timeString >= lunchStart && timeString < lunchEnd) {
    return null; // Tushlik vaqti
  }
  
  // Generate time slots dynamically
  const startTime = parse(branchSettings.school_start_time.substring(0, 5), 'HH:mm', new Date());
  // Use daily_lesson_end_time if available, otherwise fall back to school_end_time
  const endTimeStr = branchSettings.daily_lesson_end_time || branchSettings.school_end_time;
  const endTime = parse(endTimeStr.substring(0, 5), 'HH:mm', new Date());
  const lunchStartTime = lunchStart ? parse(lunchStart, 'HH:mm', new Date()) : null;
  const lunchEndTime = lunchEnd ? parse(lunchEnd, 'HH:mm', new Date()) : null;
  
  let currentSlotTime = startTime;
  let lessonNumber = 1;
  let lunchAdded = false;
  
  while (currentSlotTime < endTime) {
    const slotEnd = addMinutes(currentSlotTime, branchSettings.lesson_duration_minutes);
    
    if (slotEnd > endTime) break;
    
    // Check if this lesson would overlap with lunch break
    if (lunchStartTime && lunchEndTime && !lunchAdded && slotEnd > lunchStartTime && currentSlotTime < lunchEndTime) {
      lunchAdded = true;
      // Move to end of lunch break and continue
      currentSlotTime = lunchEndTime;
      continue;
    }
    
    // Check if current time is within this lesson
    const slotStartStr = formatTime(currentSlotTime, 'HH:mm');
    const slotEndStr = formatTime(slotEnd, 'HH:mm');
    
    if (timeString >= slotStartStr && timeString < slotEndStr) {
      return lessonNumber;
    }
    
    // Move to next slot
    currentSlotTime = addMinutes(slotEnd, branchSettings.break_duration_minutes);
    lessonNumber++;
  }
  
  return null; // Not during a lesson
}

export function CurrentTimeDisplay({ className, showSeconds = true, branchSettings }: CurrentTimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const timeString = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  
  const dateString = formatDateUz(currentTime);
  const currentLesson = branchSettings ? getCurrentLessonFromSettings(branchSettings, currentTime) : null;
  
  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Date */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-600" />
        <div>
          <div className="text-sm font-medium text-gray-900">{dateString}</div>
        </div>
      </div>
      
      {/* Current Time */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-green-600" />
        <div>
          <div className="text-2xl font-bold font-mono tabular-nums text-gray-900">
            {timeString}
          </div>
        </div>
      </div>
      
      {/* Current Lesson Indicator */}
      {currentLesson && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg">
          <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-green-800">
            {currentLesson}-dars davom etmoqda
          </span>
        </div>
      )}
    </div>
  );
}
