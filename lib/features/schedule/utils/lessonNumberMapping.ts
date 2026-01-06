/**
 * Time to Lesson Number Mapping Utility
 * Derives lesson_number from start_time for proper API integration
 */

export interface TimeSlotDefinition {
  lesson_number: number;
  start_time: string;
  end_time: string;
  label: string;
}

/**
 * Standard school time slots with lesson numbers
 * This is the SOURCE OF TRUTH for time → lesson_number mapping
 */
export const STANDARD_TIME_SLOTS: TimeSlotDefinition[] = [
  { lesson_number: 1, start_time: '08:00:00', end_time: '08:45:00', label: 'Period 1' },
  { lesson_number: 2, start_time: '08:55:00', end_time: '09:40:00', label: 'Period 2' },
  { lesson_number: 3, start_time: '09:50:00', end_time: '10:35:00', label: 'Period 3' },
  { lesson_number: 4, start_time: '10:45:00', end_time: '11:30:00', label: 'Period 4' },
  { lesson_number: 5, start_time: '11:40:00', end_time: '12:25:00', label: 'Period 5' },
  { lesson_number: 6, start_time: '13:00:00', end_time: '13:45:00', label: 'Period 6' },
  { lesson_number: 7, start_time: '13:55:00', end_time: '14:40:00', label: 'Period 7' },
  { lesson_number: 8, start_time: '14:50:00', end_time: '15:35:00', label: 'Period 8' },
];

/**
 * Derive lesson_number from start_time
 * THIS IS CRITICAL - Never hardcode lesson_number in UI
 */
export const getLessonNumberFromTime = (startTime: string): number | null => {
  const normalized = normalizeTime(startTime);
  const slot = STANDARD_TIME_SLOTS.find((s) => normalizeTime(s.start_time) === normalized);
  return slot ? slot.lesson_number : null;
};

/**
 * Get time slot definition by lesson_number
 */
export const getTimeSlotByNumber = (lessonNumber: number): TimeSlotDefinition | null => {
  return STANDARD_TIME_SLOTS.find((s) => s.lesson_number === lessonNumber) || null;
};

/**
 * Get time slot definition by start_time
 */
export const getTimeSlotByTime = (startTime: string): TimeSlotDefinition | null => {
  const normalized = normalizeTime(startTime);
  return STANDARD_TIME_SLOTS.find((s) => normalizeTime(s.start_time) === normalized) || null;
};

/**
 * Normalize time string for comparison
 * Handles both "HH:mm" and "HH:mm:ss" formats
 */
const normalizeTime = (time: string): string => {
  if (time.length === 5) {
    return `${time}:00`; // "09:00" → "09:00:00"
  }
  return time; // Already "09:00:00"
};

/**
 * Get all time slots for rendering grid
 */
export const getAllTimeSlots = (): TimeSlotDefinition[] => {
  return STANDARD_TIME_SLOTS;
};

/**
 * Validate if a time range is valid
 */
export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  const startSlot = getTimeSlotByTime(startTime);
  if (!startSlot) return false;
  
  // Check if endTime matches the slot's end time
  return normalizeTime(endTime) === normalizeTime(startSlot.end_time);
};

/**
 * Format time for display (HH:mm)
 */
export const formatTimeDisplay = (time: string): string => {
  return time.substring(0, 5); // "09:00:00" → "09:00"
};

/**
 * Get next available time slot
 */
export const getNextTimeSlot = (currentLessonNumber: number): TimeSlotDefinition | null => {
  const nextNumber = currentLessonNumber + 1;
  return getTimeSlotByNumber(nextNumber);
};

/**
 * Get previous time slot
 */
export const getPreviousTimeSlot = (currentLessonNumber: number): TimeSlotDefinition | null => {
  const prevNumber = currentLessonNumber - 1;
  return getTimeSlotByNumber(prevNumber);
};

/**
 * Check if two slots conflict (same time)
 */
export const doSlotsConflict = (slot1: TimeSlotDefinition, slot2: TimeSlotDefinition): boolean => {
  return slot1.lesson_number === slot2.lesson_number;
};

/**
 * Create API payload for slot creation/update
 * ALWAYS use this to ensure correct format
 */
export interface SlotAPIPayload {
  timetable: string;
  class_obj: string;
  class_subject: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  lesson_number: number;
  start_time: string;
  end_time: string;
  room?: string;
}

// Day of week mapping: number to string
const DAY_OF_WEEK_MAP: Record<number, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  7: 'sunday',
};

export const createSlotPayload = (
  classId: string,
  classSubjectId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  templateId: string,
  room?: string
): SlotAPIPayload | null => {
  const lessonNumber = getLessonNumberFromTime(startTime);
  
  if (lessonNumber === null) {
    console.error('Invalid start_time, cannot derive lesson_number:', startTime);
    return null;
  }

  // Validate time range
  if (!isValidTimeRange(startTime, endTime)) {
    console.error('Invalid time range:', { startTime, endTime });
    return null;
  }

  // Convert day number to string
  const dayOfWeekString = DAY_OF_WEEK_MAP[dayOfWeek];
  if (!dayOfWeekString) {
    console.error('Invalid day_of_week:', dayOfWeek);
    return null;
  }

  const payload: SlotAPIPayload = {
    timetable: templateId,
    class_obj: classId,
    class_subject: classSubjectId,
    day_of_week: dayOfWeekString,
    lesson_number: lessonNumber,
    start_time: startTime,
    end_time: endTime,
  };

  if (room) {
    payload.room = room;
  }

  return payload;
};

/**
 * Parse time slot from API response
 */
export const parseSlotFromAPI = (apiSlot: any): {
  lessonNumber: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
} => {
  return {
    lessonNumber: apiSlot.lesson_number,
    startTime: apiSlot.start_time,
    endTime: apiSlot.end_time,
    dayOfWeek: apiSlot.day_of_week,
  };
};
