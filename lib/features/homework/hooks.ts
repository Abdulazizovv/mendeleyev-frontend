/**
 * Homework React Query Hooks
 * Custom hooks for homework assignments and submissions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { homeworkApi } from './api';
import type {
  HomeworkAssignment,
  HomeworkSubmission,
  HomeworkFilters,
} from '@/types/academic';

// ==================== QUERY KEYS ====================

export const homeworkKeys = {
  all: ['homework'] as const,
  
  assignments: () => [...homeworkKeys.all, 'assignments'] as const,
  assignment: (id: string) => [...homeworkKeys.assignments(), id] as const,
  assignmentList: (filters?: HomeworkFilters) =>
    [...homeworkKeys.assignments(), 'list', filters] as const,
  
  submissions: () => [...homeworkKeys.all, 'submissions'] as const,
  submission: (id: string) => [...homeworkKeys.submissions(), id] as const,
  submissionList: (filters?: HomeworkFilters & { assignment_id?: string }) =>
    [...homeworkKeys.submissions(), 'list', filters] as const,
  studentSubmission: (assignmentId: string, studentId: string) =>
    [...homeworkKeys.submissions(), 'student', assignmentId, studentId] as const,
  
  statistics: () => [...homeworkKeys.all, 'statistics'] as const,
  assignmentStats: (assignmentId: string) =>
    [...homeworkKeys.statistics(), 'assignment', assignmentId] as const,
  studentStats: (studentId: string, subjectId?: string) =>
    [...homeworkKeys.statistics(), 'student', studentId, subjectId] as const,
  classStats: (classId: string) =>
    [...homeworkKeys.statistics(), 'class', classId] as const,
};

// ==================== HOMEWORK ASSIGNMENTS ====================

/**
 * Hook to fetch homework assignments
 */
export const useHomeworkAssignments = (filters?: HomeworkFilters) => {
  return useQuery({
    queryKey: homeworkKeys.assignmentList(filters),
    queryFn: () => homeworkApi.getHomeworkAssignments(filters),
  });
};

/**
 * Hook to fetch a single homework assignment
 */
export const useHomeworkAssignment = (id: string) => {
  return useQuery({
    queryKey: homeworkKeys.assignment(id),
    queryFn: () => homeworkApi.getHomeworkAssignment(id),
    enabled: !!id,
  });
};

/**
 * Hook to create homework assignment
 */
export const useCreateHomeworkAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<HomeworkAssignment, keyof import('@/types/academic').BaseEntity>) =>
      homeworkApi.createHomeworkAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.assignments() });
      toast.success('Homework assignment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create homework');
    },
  });
};

/**
 * Hook to update homework assignment
 */
export const useUpdateHomeworkAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HomeworkAssignment> }) =>
      homeworkApi.updateHomeworkAssignment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.assignment(variables.id) });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.assignments() });
      toast.success('Homework updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update homework');
    },
  });
};

/**
 * Hook to delete homework assignment
 */
export const useDeleteHomeworkAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => homeworkApi.deleteHomeworkAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.assignments() });
      toast.success('Homework deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete homework');
    },
  });
};

// ==================== HOMEWORK SUBMISSIONS ====================

/**
 * Hook to fetch homework submissions
 */
export const useHomeworkSubmissions = (
  filters?: HomeworkFilters & { assignment_id?: string }
) => {
  return useQuery({
    queryKey: homeworkKeys.submissionList(filters),
    queryFn: () => homeworkApi.getHomeworkSubmissions(filters),
    enabled: !!filters?.assignment_id,
  });
};

/**
 * Hook to fetch a single homework submission
 */
export const useHomeworkSubmission = (id: string) => {
  return useQuery({
    queryKey: homeworkKeys.submission(id),
    queryFn: () => homeworkApi.getHomeworkSubmission(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch student's submission for an assignment
 */
export const useStudentSubmission = (assignmentId: string, studentId: string) => {
  return useQuery({
    queryKey: homeworkKeys.studentSubmission(assignmentId, studentId),
    queryFn: () => homeworkApi.getStudentSubmission(assignmentId, studentId),
    enabled: !!assignmentId && !!studentId,
  });
};

/**
 * Hook to submit homework
 */
export const useSubmitHomework = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<HomeworkSubmission, keyof import('@/types/academic').BaseEntity>) =>
      homeworkApi.submitHomework(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submissions() });
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.studentSubmission(
          variables.assignment_id,
          variables.student_id
        ),
      });
      toast.success('Homework submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit homework');
    },
  });
};

/**
 * Hook to update homework submission
 */
export const useUpdateHomeworkSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HomeworkSubmission> }) =>
      homeworkApi.updateHomeworkSubmission(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submission(variables.id) });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submissions() });
      toast.success('Homework updated successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit after due date');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update homework');
      }
    },
  });
};

/**
 * Hook to delete homework submission
 */
export const useDeleteHomeworkSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => homeworkApi.deleteHomeworkSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submissions() });
      toast.success('Homework submission deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete submission');
    },
  });
};

/**
 * Hook to grade homework submission
 */
export const useGradeHomework = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, score, feedback }: { id: string; score: number; feedback?: string }) =>
      homeworkApi.gradeHomeworkSubmission(id, score, feedback),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submission(variables.id) });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.statistics() });
      toast.success('Homework graded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to grade homework');
    },
  });
};

// ==================== HOMEWORK STATISTICS ====================

/**
 * Hook to fetch homework statistics for an assignment
 */
export const useHomeworkStatistics = (assignmentId: string) => {
  return useQuery({
    queryKey: homeworkKeys.assignmentStats(assignmentId),
    queryFn: () => homeworkApi.getHomeworkStatistics(assignmentId),
    enabled: !!assignmentId,
  });
};

/**
 * Hook to fetch student homework statistics
 */
export const useStudentHomeworkStats = (
  studentId: string,
  subjectId?: string,
  dateFrom?: string,
  dateTo?: string
) => {
  return useQuery({
    queryKey: homeworkKeys.studentStats(studentId, subjectId),
    queryFn: () =>
      homeworkApi.getStudentHomeworkStats(studentId, subjectId, dateFrom, dateTo),
    enabled: !!studentId,
  });
};

/**
 * Hook to fetch class homework statistics
 */
export const useClassHomeworkStats = (
  classId: string,
  dateFrom?: string,
  dateTo?: string
) => {
  return useQuery({
    queryKey: homeworkKeys.classStats(classId),
    queryFn: () => homeworkApi.getClassHomeworkStats(classId, dateFrom, dateTo),
    enabled: !!classId,
  });
};

// ==================== CUSTOM HOOKS ====================

/**
 * Hook to export homework data
 */
export const useExportHomework = () => {
  return useMutation({
    mutationFn: (filters?: HomeworkFilters) => homeworkApi.exportHomework(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `homework-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Homework exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export homework');
    },
  });
};

/**
 * Hook to check if homework can be submitted
 */
export const useCanSubmitHomework = (assignmentId: string) => {
  const { data: assignment } = useHomeworkAssignment(assignmentId);
  return assignment ? homeworkApi.canSubmitHomework(assignment) : false;
};
