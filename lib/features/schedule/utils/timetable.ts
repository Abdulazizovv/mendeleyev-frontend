/**
 * Timetable data processing utilities
 */

import type { LessonInstance } from '@/types/academic';
import { getDayOfWeek } from './time';
import { parseISO } from 'date-fns';

export interface GroupedLessons {
  [dayOfWeek: number]: {
    [timeSlot: string]: LessonInstance[];
  };
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  label: string;
}

/**
 * Group lessons by day of week and time slot
 */
export const groupLessonsByDayAndTime = (
  lessons: LessonInstance[]
): GroupedLessons => {
  const grouped: GroupedLessons = {};

  // Initialize for Monday-Saturday (1-6)
  for (let day = 1; day <= 6; day++) {
    grouped[day] = {};
  }

  lessons.forEach((lesson) => {
    const date = parseISO(lesson.date);
    const dayOfWeek = getDayOfWeek(date);

    // Only include Monday-Saturday
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      const timeKey = `${lesson.start_time}-${lesson.end_time}`;

      if (!grouped[dayOfWeek][timeKey]) {
        grouped[dayOfWeek][timeKey] = [];
      }

      grouped[dayOfWeek][timeKey].push(lesson);
    }
  });

  return grouped;
};

/**
 * Get all unique time slots from lessons, sorted chronologically
 */
export const extractTimeSlots = (lessons: LessonInstance[]): TimeSlot[] => {
  const slotsMap = new Map<string, TimeSlot>();

  lessons.forEach((lesson) => {
    const key = `${lesson.start_time}-${lesson.end_time}`;
    if (!slotsMap.has(key)) {
      slotsMap.set(key, {
        start_time: lesson.start_time,
        end_time: lesson.end_time,
        label: `${formatTime(lesson.start_time)} - ${formatTime(lesson.end_time)}`,
      });
    }
  });

  return Array.from(slotsMap.values()).sort((a, b) => {
    const aMinutes = timeToMinutes(a.start_time);
    const bMinutes = timeToMinutes(b.start_time);
    return aMinutes - bMinutes;
  });
};

/**
 * Format time for display (HH:mm)
 */
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Convert time string to minutes since midnight
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Get subject color based on subject name
 */
export const getSubjectColor = (subjectName: string): {
  bg: string;
  border: string;
  text: string;
} => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    Mathematics: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    Math: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    English: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
    Physics: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
    Chemistry: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
    Biology: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900' },
    History: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
    Geography: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900' },
    Literature: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
    Science: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900' },
    Art: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900' },
    Music: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900' },
    PE: { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900' },
    'Physical Education': { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900' },
  };

  return colors[subjectName] || {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
  };
};

/**
 * Get lesson status styling
 */
export const getLessonStatusStyle = (
  status: string,
  isOngoing: boolean,
  isPast: boolean
): { className: string; label: string } => {
  if (status === 'cancelled') {
    return {
      className: 'opacity-50 line-through',
      label: 'Cancelled',
    };
  }

  if (isOngoing) {
    return {
      className: 'ring-2 ring-amber-400 ring-offset-2',
      label: 'Ongoing',
    };
  }

  if (isPast && status === 'completed') {
    return {
      className: 'opacity-75',
      label: 'Completed',
    };
  }

  if (isPast && status === 'planned') {
    return {
      className: 'opacity-60',
      label: 'Past',
    };
  }

  return {
    className: '',
    label: 'Scheduled',
  };
};

/**
 * Get day name from day number
 */
export const getDayName = (day: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day - 1] || '';
};

/**
 * Get short day name from day number
 */
export const getShortDayName = (day: number): string => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day - 1] || '';
};

/**
 * Calculate grid row span based on lesson duration
 * Useful for visual representation of longer lessons
 */
export const calculateRowSpan = (startTime: string, endTime: string): number => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const duration = end - start;
  
  // Assuming standard 45-minute lessons
  return Math.max(1, Math.round(duration / 45));
};

/**
 * Sort lessons within a time slot by class name
 */
export const sortLessonsByClass = (lessons: LessonInstance[]): LessonInstance[] => {
  return [...lessons].sort((a, b) => {
    const classA = a.class_name || '';
    const classB = b.class_name || '';
    return classA.localeCompare(classB);
  });
};

/**
 * Check if lessons overlap in time
 */
export const doLessonsOverlap = (
  lesson1: { start_time: string; end_time: string },
  lesson2: { start_time: string; end_time: string }
): boolean => {
  const start1 = timeToMinutes(lesson1.start_time);
  const end1 = timeToMinutes(lesson1.end_time);
  const start2 = timeToMinutes(lesson2.start_time);
  const end2 = timeToMinutes(lesson2.end_time);

  return start1 < end2 && start2 < end1;
};
