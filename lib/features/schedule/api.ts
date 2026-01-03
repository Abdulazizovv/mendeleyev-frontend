/**
 * Schedule & Timetable API
 * Endpoints for managing timetable templates, slots, and schedule operations
 * 
 * NOTE: All endpoints require branch_id in URL path
 * Base URL: /api/v1/school/branches/{branch_id}/
 */

import { apiClient } from '@/lib/api';
import type {
  PaginatedResponse,
  TimetableTemplate,
  TimetableSlot,
  CreateTimetableTemplate,
  CreateTimetableSlot,
  BulkCreateSlots,
  ScheduleFilters,
  LessonInstance,
  LessonTopic,
  LessonFilters,
  GenerateLessonsRequest,
  GenerateLessonsResponse,
  CompleteLessonRequest,
} from '@/types/academic';

/**
 * Get base path for branch-scoped endpoints
 */
const getBasePath = (branchId: string) => `/school/branches/${branchId}`;

// ==================== TIMETABLE TEMPLATES ====================

/**
 * Get all timetable templates for the current branch
 */
export const getTimetableTemplates = async (
  branchId: string,
  filters?: ScheduleFilters
): Promise<PaginatedResponse<TimetableTemplate>> => {
  const response = await apiClient.get(`${getBasePath(branchId)}/timetables/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get a single timetable template by ID
 */
export const getTimetableTemplate = async (
  branchId: string,
  id: string
): Promise<TimetableTemplate> => {
  const response = await apiClient.get(`${getBasePath(branchId)}/timetables/${id}/`);
  return response.data;
};

/**
 * Create a new timetable template
 */
export const createTimetableTemplate = async (
  branchId: string,
  data: CreateTimetableTemplate
): Promise<TimetableTemplate> => {
  const response = await apiClient.post(`${getBasePath(branchId)}/timetables/`, data);
  return response.data;
};

/**
 * Update a timetable template
 */
export const updateTimetableTemplate = async (
  branchId: string,
  id: string,
  data: Partial<CreateTimetableTemplate>
): Promise<TimetableTemplate> => {
  const response = await apiClient.patch(
    `${getBasePath(branchId)}/timetables/${id}/`,
    data
  );
  return response.data;
};

/**
 * Delete a timetable template
 */
export const deleteTimetableTemplate = async (
  branchId: string,
  id: string
): Promise<void> => {
  await apiClient.delete(`${getBasePath(branchId)}/timetables/${id}/`);
};

// ==================== TIMETABLE SLOTS ====================

/**
 * Get all timetable slots for a template
 */
export const getTimetableSlots = async (
  branchId: string,
  templateId: string,
  filters?: Omit<ScheduleFilters, 'template_id'>
): Promise<PaginatedResponse<TimetableSlot>> => {
  const response = await apiClient.get(
    `${getBasePath(branchId)}/timetables/${templateId}/slots/`,
    { params: filters }
  );
  return response.data;
};

/**
 * Get a single timetable slot by ID
 */
export const getTimetableSlot = async (
  branchId: string,
  templateId: string,
  slotId: string
): Promise<TimetableSlot> => {
  const response = await apiClient.get(
    `${getBasePath(branchId)}/timetables/${templateId}/slots/${slotId}/`
  );
  return response.data;
};

/**
 * Create a single timetable slot
 */
export const createTimetableSlot = async (
  branchId: string,
  templateId: string,
  data: CreateTimetableSlot
): Promise<TimetableSlot> => {
  const response = await apiClient.post(
    `${getBasePath(branchId)}/timetables/${templateId}/slots/`,
    data
  );
  return response.data;
};

/**
 * Bulk create multiple timetable slots
 */
export const bulkCreateTimetableSlots = async (
  branchId: string,
  templateId: string,
  data: { slots: Omit<CreateTimetableSlot, 'template_id'>[] }
): Promise<{ message: string; created_count: number; slots: TimetableSlot[] }> => {
  const response = await apiClient.post(
    `${getBasePath(branchId)}/timetables/${templateId}/slots/bulk-create/`,
    data
  );
  return response.data;
};

/**
 * Update a timetable slot
 */
export const updateTimetableSlot = async (
  branchId: string,
  templateId: string,
  slotId: string,
  data: Partial<CreateTimetableSlot>
): Promise<TimetableSlot> => {
  const response = await apiClient.patch(
    `${getBasePath(branchId)}/timetables/${templateId}/slots/${slotId}/`,
    data
  );
  return response.data;
};

/**
 * Delete a timetable slot
 */
export const deleteTimetableSlot = async (
  branchId: string,
  templateId: string,
  slotId: string
): Promise<void> => {
  await apiClient.delete(
    `${getBasePath(branchId)}/timetables/${templateId}/slots/${slotId}/`
  );
};

// ==================== LESSON TOPICS ====================

/**
 * Get all lesson topics
 */
export const getLessonTopics = async (
  branchId: string,
  filters?: { subject?: string; quarter?: string; search?: string }
): Promise<PaginatedResponse<LessonTopic>> => {
  const response = await apiClient.get(`${getBasePath(branchId)}/lesson-topics/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Create a lesson topic
 */
export const createLessonTopic = async (
  branchId: string,
  data: Omit<LessonTopic, 'id' | 'created_at' | 'updated_at'>
): Promise<LessonTopic> => {
  const response = await apiClient.post(`${getBasePath(branchId)}/lesson-topics/`, data);
  return response.data;
};

/**
 * Update a lesson topic
 */
export const updateLessonTopic = async (
  branchId: string,
  id: string,
  data: Partial<LessonTopic>
): Promise<LessonTopic> => {
  const response = await apiClient.patch(
    `${getBasePath(branchId)}/lesson-topics/${id}/`,
    data
  );
  return response.data;
};

/**
 * Delete a lesson topic
 */
export const deleteLessonTopic = async (
  branchId: string,
  id: string
): Promise<void> => {
  await apiClient.delete(`${getBasePath(branchId)}/lesson-topics/${id}/`);
};

// ==================== LESSON INSTANCES ====================

/**
 * Get all lesson instances
 */
export const getLessonInstances = async (
  branchId: string,
  filters?: LessonFilters
): Promise<PaginatedResponse<LessonInstance>> => {
  const response = await apiClient.get(`${getBasePath(branchId)}/lessons/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get a single lesson instance by ID
 */
export const getLessonInstance = async (
  branchId: string,
  id: string
): Promise<LessonInstance> => {
  const response = await apiClient.get(`${getBasePath(branchId)}/lessons/${id}/`);
  return response.data;
};

/**
 * Create a lesson instance
 */
export const createLessonInstance = async (
  branchId: string,
  data: Omit<LessonInstance, 'id' | 'created_at' | 'updated_at' | 'is_auto_generated'>
): Promise<LessonInstance> => {
  const response = await apiClient.post(`${getBasePath(branchId)}/lessons/`, data);
  return response.data;
};

/**
 * Update a lesson instance
 */
export const updateLessonInstance = async (
  branchId: string,
  id: string,
  data: Partial<LessonInstance>
): Promise<LessonInstance> => {
  const response = await apiClient.patch(
    `${getBasePath(branchId)}/lessons/${id}/`,
    data
  );
  return response.data;
};

/**
 * Delete a lesson instance
 */
export const deleteLessonInstance = async (
  branchId: string,
  id: string
): Promise<void> => {
  await apiClient.delete(`${getBasePath(branchId)}/lessons/${id}/`);
};

/**
 * Generate lessons from timetable template
 */
export const generateLessons = async (
  branchId: string,
  data: GenerateLessonsRequest
): Promise<GenerateLessonsResponse> => {
  const response = await apiClient.post(
    `${getBasePath(branchId)}/lessons/generate/`,
    data
  );
  return response.data;
};

/**
 * Complete a lesson
 */
export const completeLesson = async (
  branchId: string,
  id: string,
  data: CompleteLessonRequest
): Promise<LessonInstance> => {
  const response = await apiClient.post(
    `${getBasePath(branchId)}/lessons/${id}/complete/`,
    data
  );
  return response.data;
};

/**
 * Cancel a lesson
 */
export const cancelLesson = async (
  branchId: string,
  id: string,
  reason?: string
): Promise<LessonInstance> => {
  const response = await apiClient.post(
    `${getBasePath(branchId)}/lessons/${id}/cancel/`,
    { reason }
  );
  return response.data;
};

// Export all functions as scheduleApi object
export const scheduleApi = {
  getTimetableTemplates,
  getTimetableTemplate,
  createTimetableTemplate,
  updateTimetableTemplate,
  deleteTimetableTemplate,
  getTimetableSlots,
  getTimetableSlot,
  createTimetableSlot,
  bulkCreateTimetableSlots,
  updateTimetableSlot,
  deleteTimetableSlot,
  getLessonTopics,
  createLessonTopic,
  updateLessonTopic,
  deleteLessonTopic,
  getLessonInstances,
  getLessonInstance,
  createLessonInstance,
  updateLessonInstance,
  deleteLessonInstance,
  generateLessons,
  completeLesson,
  cancelLesson,
};
