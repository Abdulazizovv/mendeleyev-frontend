/**
 * Time utilities for timetable calculations
 * Handles Uzbekistan timezone (UTC+5)
 */

import { format, parse, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';

/**
 * Get current time in Uzbekistan timezone
 * Uzbekistan is UTC+5 (no DST)
 */
export const getCurrentUzbekistanTime = (): Date => {
  const now = new Date();
  // Convert to UTC+5 (Uzbekistan)
  const uzbekTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
  return uzbekTime;
};

/**
 * Get start of week (Monday) for given date
 */
export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
};

/**
 * Get end of week (Sunday) for given date
 */
export const getWeekEnd = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Navigate to previous week
 */
export const getPreviousWeek = (currentDate: Date): Date => {
  return subWeeks(currentDate, 1);
};

/**
 * Navigate to next week
 */
export const getNextWeek = (currentDate: Date): Date => {
  return addWeeks(currentDate, 1);
};

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Format time for display (HH:mm)
 */
export const formatTimeForDisplay = (time: string): string => {
  // Input: "09:00:00" or "09:00"
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Parse time string to minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Calculate duration between two times in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

/**
 * Check if current time is within lesson time
 */
export const isLessonOngoing = (
  lessonDate: string,
  startTime: string,
  endTime: string
): boolean => {
  const now = getCurrentUzbekistanTime();
  const lessonDateObj = parseISO(lessonDate);
  
  if (!isSameDay(now, lessonDateObj)) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

/**
 * Check if lesson is in the past
 */
export const isLessonPast = (lessonDate: string, endTime: string): boolean => {
  const now = getCurrentUzbekistanTime();
  const lessonDateObj = parseISO(lessonDate);
  
  if (now.toDateString() !== lessonDateObj.toDateString()) {
    return now > lessonDateObj;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = timeToMinutes(endTime);

  return currentMinutes >= endMinutes;
};

/**
 * Get day of week from date (1 = Monday, 7 = Sunday)
 */
export const getDayOfWeek = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

/**
 * Calculate position of current time indicator (percentage)
 * Returns percentage from start of day (00:00) to end of day (23:59)
 */
export const getCurrentTimePosition = (): number => {
  const now = getCurrentUzbekistanTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const totalDayMinutes = 24 * 60;
  return (currentMinutes / totalDayMinutes) * 100;
};

/**
 * Calculate position of current time within timetable view
 * Returns percentage based on earliest and latest lesson times
 */
export const getCurrentTimePositionInGrid = (
  earliestTime: string,
  latestTime: string
): number => {
  const now = getCurrentUzbekistanTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(earliestTime);
  const endMinutes = timeToMinutes(latestTime);

  if (currentMinutes < startMinutes) return 0;
  if (currentMinutes > endMinutes) return 100;

  const elapsed = currentMinutes - startMinutes;
  const total = endMinutes - startMinutes;
  return (elapsed / total) * 100;
};

/**
 * Format week range for display
 */
export const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = getWeekEnd(weekStart);
  return `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const now = getCurrentUzbekistanTime();
  return isSameDay(now, date);
};

/**
 * Get all time slots from lessons (unique start-end combinations)
 */
export const getUniqueTimeSlots = (
  lessons: Array<{ start_time: string; end_time: string }>
): Array<{ start_time: string; end_time: string }> => {
  const slotsMap = new Map<string, { start_time: string; end_time: string }>();

  lessons.forEach((lesson) => {
    const key = `${lesson.start_time}-${lesson.end_time}`;
    if (!slotsMap.has(key)) {
      slotsMap.set(key, {
        start_time: lesson.start_time,
        end_time: lesson.end_time,
      });
    }
  });

  return Array.from(slotsMap.values()).sort((a, b) =>
    timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );
};
