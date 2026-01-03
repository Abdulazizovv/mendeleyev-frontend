/**
 * Schedule & Timetable React Query Hooks
 * Custom hooks for schedule data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { scheduleApi } from './api';
import type {
  ScheduleFilters,
  LessonFilters,
  CreateTimetableTemplate,
  CreateTimetableSlot,
  LessonTopic,
  LessonInstance,
  GenerateLessonsRequest,
  CompleteLessonRequest,
} from '@/types/academic';

// ==================== QUERY KEYS ====================

export const scheduleKeys = {
  all: ['schedule'] as const,
  
  templates: (branchId?: string) => [...scheduleKeys.all, 'templates', branchId] as const,
  template: (branchId: string, id: string) => [...scheduleKeys.templates(branchId), id] as const,
  templateList: (branchId: string, filters?: ScheduleFilters) =>
    [...scheduleKeys.templates(branchId), 'list', filters] as const,
  
  slots: (branchId?: string, templateId?: string) => 
    [...scheduleKeys.all, 'slots', branchId, templateId] as const,
  slot: (branchId: string, templateId: string, id: string) => 
    [...scheduleKeys.slots(branchId, templateId), id] as const,
  slotList: (branchId: string, templateId: string, filters?: any) =>
    [...scheduleKeys.slots(branchId, templateId), 'list', filters] as const,
  
  topics: (branchId?: string) => [...scheduleKeys.all, 'topics', branchId] as const,
  topic: (branchId: string, id: string) => [...scheduleKeys.topics(branchId), id] as const,
  topicList: (branchId: string, filters?: any) =>
    [...scheduleKeys.topics(branchId), 'list', filters] as const,
  
  lessons: (branchId?: string) => [...scheduleKeys.all, 'lessons', branchId] as const,
  lesson: (branchId: string, id: string) => [...scheduleKeys.lessons(branchId), id] as const,
  lessonList: (branchId: string, filters?: LessonFilters) =>
    [...scheduleKeys.lessons(branchId), 'list', filters] as const,
};

// ==================== TIMETABLE TEMPLATES ====================

/**
 * Fetch timetable templates list
 */
export const useTimetableTemplates = (branchId: string, filters?: ScheduleFilters) => {
  return useQuery({
    queryKey: scheduleKeys.templateList(branchId, filters),
    queryFn: () => scheduleApi.getTimetableTemplates(branchId, filters),
    enabled: !!branchId,
  });
};

/**
 * Fetch a single timetable template
 */
export const useTimetableTemplate = (branchId: string, id: string) => {
  return useQuery({
    queryKey: scheduleKeys.template(branchId, id),
    queryFn: () => scheduleApi.getTimetableTemplate(branchId, id),
    enabled: !!branchId && !!id,
  });
};

/**
 * Create a timetable template
 */
export const useCreateTimetableTemplate = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimetableTemplate) =>
      scheduleApi.createTimetableTemplate(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates(branchId) });
      toast.success('Jadval shabloni muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Shablon yaratishda xatolik');
    },
  });
};

/**
 * Update a timetable template
 */
export const useUpdateTimetableTemplate = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTimetableTemplate> }) =>
      scheduleApi.updateTimetableTemplate(branchId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.template(branchId, variables.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates(branchId) });
      toast.success('Shablon muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Shabl onni yangilashda xatolik');
    },
  });
};

/**
 * Delete a timetable template
 */
export const useDeleteTimetableTemplate = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteTimetableTemplate(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates(branchId) });
      toast.success('Shablon muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Shablonni o\'chirishda xatolik');
    },
  });
};

// ==================== TIMETABLE SLOTS ====================

/**
 * Fetch timetable slots
 */
export const useTimetableSlots = (
  branchId: string,
  templateId: string,
  filters?: Omit<ScheduleFilters, 'template_id'>
) => {
  return useQuery({
    queryKey: scheduleKeys.slotList(branchId, templateId, filters),
    queryFn: () => scheduleApi.getTimetableSlots(branchId, templateId, filters),
    enabled: !!branchId && !!templateId,
  });
};

/**
 * Fetch a single timetable slot
 */
export const useTimetableSlot = (branchId: string, templateId: string, slotId: string) => {
  return useQuery({
    queryKey: scheduleKeys.slot(branchId, templateId, slotId),
    queryFn: () => scheduleApi.getTimetableSlot(branchId, templateId, slotId),
    enabled: !!branchId && !!templateId && !!slotId,
  });
};

/**
 * Create a timetable slot
 */
export const useCreateTimetableSlot = (branchId: string, templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimetableSlot) =>
      scheduleApi.createTimetableSlot(branchId, templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.slots(branchId, templateId) });
      toast.success('Dars vaqti muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Konflikt: O\'qituvchi yoki xona band');
      } else {
        toast.error(error.response?.data?.detail || 'Dars vaqtini qo\'shishda xatolik');
      }
    },
  });
};

/**
 * Bulk create timetable slots
 */
export const useBulkCreateTimetableSlots = (branchId: string, templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { slots: Omit<CreateTimetableSlot, 'template_id'>[] }) =>
      scheduleApi.bulkCreateTimetableSlots(branchId, templateId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.slots(branchId, templateId) });
      toast.success(`${data.created_count} ta dars vaqti qo'shildi`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Dars vaqtlarini qo\'shishda xatolik');
    },
  });
};

/**
 * Update a timetable slot
 */
export const useUpdateTimetableSlot = (branchId: string, templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slotId, data }: { slotId: string; data: Partial<CreateTimetableSlot> }) =>
      scheduleApi.updateTimetableSlot(branchId, templateId, slotId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: scheduleKeys.slot(branchId, templateId, variables.slotId) 
      });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.slots(branchId, templateId) });
      toast.success('Dars vaqti muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Konflikt: O\'qituvchi yoki xona band');
      } else {
        toast.error(error.response?.data?.detail || 'Dars vaqtini yangilashda xatolik');
      }
    },
  });
};

/**
 * Delete a timetable slot
 */
export const useDeleteTimetableSlot = (branchId: string, templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: string) =>
      scheduleApi.deleteTimetableSlot(branchId, templateId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.slots(branchId, templateId) });
      toast.success('Dars vaqti muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Dars vaqtini o\'chirishda xatolik');
    },
  });
};

// ==================== LESSON TOPICS ====================

/**
 * Fetch lesson topics
 */
export const useLessonTopics = (
  branchId: string,
  filters?: { subject?: string; quarter?: string; search?: string }
) => {
  return useQuery({
    queryKey: scheduleKeys.topicList(branchId, filters),
    queryFn: () => scheduleApi.getLessonTopics(branchId, filters),
    enabled: !!branchId,
  });
};

/**
 * Create a lesson topic
 */
export const useCreateLessonTopic = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LessonTopic, 'id' | 'created_at' | 'updated_at'>) =>
      scheduleApi.createLessonTopic(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.topics(branchId) });
      toast.success('Mavzu muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Mavzu qo\'shishda xatolik');
    },
  });
};

/**
 * Update a lesson topic
 */
export const useUpdateLessonTopic = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LessonTopic> }) =>
      scheduleApi.updateLessonTopic(branchId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.topic(branchId, variables.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.topics(branchId) });
      toast.success('Mavzu muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Mavzuni yangilashda xatolik');
    },
  });
};

/**
 * Delete a lesson topic
 */
export const useDeleteLessonTopic = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteLessonTopic(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.topics(branchId) });
      toast.success('Mavzu muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Mavzuni o\'chirishda xatolik');
    },
  });
};

// ==================== LESSON INSTANCES ====================

/**
 * Fetch lesson instances
 */
export const useLessonInstances = (branchId: string, filters?: LessonFilters) => {
  return useQuery({
    queryKey: scheduleKeys.lessonList(branchId, filters),
    queryFn: () => scheduleApi.getLessonInstances(branchId, filters),
    enabled: !!branchId,
  });
};

/**
 * Fetch a single lesson instance
 */
export const useLessonInstance = (branchId: string, id: string) => {
  return useQuery({
    queryKey: scheduleKeys.lesson(branchId, id),
    queryFn: () => scheduleApi.getLessonInstance(branchId, id),
    enabled: !!branchId && !!id,
  });
};

/**
 * Create a lesson instance
 */
export const useCreateLessonInstance = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LessonInstance, 'id' | 'created_at' | 'updated_at' | 'is_auto_generated'>) =>
      scheduleApi.createLessonInstance(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lessons(branchId) });
      toast.success('Dars muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Dars yaratishda xatolik');
    },
  });
};

/**
 * Update a lesson instance
 */
export const useUpdateLessonInstance = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LessonInstance> }) =>
      scheduleApi.updateLessonInstance(branchId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(branchId, variables.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lessons(branchId) });
      toast.success('Dars muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Darsni yangilashda xatolik');
    },
  });
};

/**
 * Delete a lesson instance
 */
export const useDeleteLessonInstance = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteLessonInstance(branchId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lessons(branchId) });
      toast.success('Dars muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Darsni o\'chirishda xatolik');
    },
  });
};

/**
 * Generate lessons from timetable template
 */
export const useGenerateLessons = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateLessonsRequest) =>
      scheduleApi.generateLessons(branchId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lessons(branchId) });
      const count = (data as any).created_count || (data as any).lessons?.length || 0;
      toast.success(`${count} ta dars yaratildi`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Darslarni yaratishda xatolik');
    },
  });
};

/**
 * Complete a lesson
 */
export const useCompleteLesson = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteLessonRequest }) =>
      scheduleApi.completeLesson(branchId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(branchId, variables.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lessons(branchId) });
      toast.success('Dars yakunlandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Darsni yakunlashda xatolik');
    },
  });
};

/**
 * Cancel a lesson
 */
export const useCancelLesson = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      scheduleApi.cancelLesson(branchId, id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lesson(branchId, variables.id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lessons(branchId) });
      toast.success('Dars bekor qilindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Darsni bekor qilishda xatolik');
    },
  });
};
