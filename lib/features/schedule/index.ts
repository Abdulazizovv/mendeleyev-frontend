/**
 * Schedule Feature Exports
 * Centralized export point for all schedule-related functionality
 */

// Components
export { WeeklyTimetableGrid } from './components/WeeklyTimetableGrid';
export { LessonCard } from './components/LessonCard';
export { CurrentTimeIndicator } from './components/CurrentTimeIndicator';
export { TimetableGrid } from './components/TimetableGrid';
export { LessonList } from './components/LessonList';

// Hooks
export {
  useTimetableTemplates,
  useTimetableTemplate,
  useCreateTimetableTemplate,
  useUpdateTimetableTemplate,
  useDeleteTimetableTemplate,
  useTimetableSlots,
  useTimetableSlot,
  useCreateTimetableSlot,
  useBulkCreateTimetableSlots,
  useUpdateTimetableSlot,
  useDeleteTimetableSlot,
  useLessonTopics,
  useCreateLessonTopic,
  useUpdateLessonTopic,
  useDeleteLessonTopic,
  useLessonInstances,
  useLessonInstance,
  useCreateLessonInstance,
  useUpdateLessonInstance,
  useDeleteLessonInstance,
  useGenerateLessons,
  useCompleteLesson,
  useCancelLesson,
  scheduleKeys,
} from './hooks';

// API
export { scheduleApi } from './api';

// Utils
export * from './utils/time';
export * from './utils/timetable';
