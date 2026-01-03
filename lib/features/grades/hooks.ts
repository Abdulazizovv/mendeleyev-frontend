/**
 * Grades & Assessments React Query Hooks
 * Custom hooks for grades, assessments, and grade summaries
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { gradesApi } from './api';
import type {
  AssessmentTypeConfig,
  Assessment,
  GradeEntry,
  BulkGradeEntry,
  GradeFilters,
  GradeOverride,
} from '@/types/academic';

// ==================== QUERY KEYS ====================

export const gradesKeys = {
  all: ['grades'] as const,
  
  assessmentTypes: () => [...gradesKeys.all, 'assessment-types'] as const,
  
  assessments: () => [...gradesKeys.all, 'assessments'] as const,
  assessment: (id: string) => [...gradesKeys.assessments(), id] as const,
  assessmentList: (filters?: GradeFilters) =>
    [...gradesKeys.assessments(), 'list', filters] as const,
  
  entries: () => [...gradesKeys.all, 'entries'] as const,
  entry: (id: string) => [...gradesKeys.entries(), id] as const,
  entryList: (filters?: GradeFilters & { assessment_id?: string }) =>
    [...gradesKeys.entries(), 'list', filters] as const,
  
  summaries: () => [...gradesKeys.all, 'summaries'] as const,
  summary: (studentId: string, subjectId: string, quarter: number) =>
    [...gradesKeys.summaries(), studentId, subjectId, quarter] as const,
  reportCard: (studentId: string, quarter: number) =>
    [...gradesKeys.summaries(), 'report-card', studentId, quarter] as const,
  
  overrides: () => [...gradesKeys.all, 'overrides'] as const,
  override: (id: string) => [...gradesKeys.overrides(), id] as const,
};

// ==================== ASSESSMENT TYPES ====================

/**
 * Hook to fetch assessment types
 */
export const useAssessmentTypes = () => {
  return useQuery({
    queryKey: gradesKeys.assessmentTypes(),
    queryFn: () => gradesApi.getAssessmentTypes(),
  });
};

/**
 * Hook to create assessment type
 */
export const useCreateAssessmentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AssessmentTypeConfig, keyof import('@/types/academic').BaseEntity>) =>
      gradesApi.createAssessmentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessmentTypes() });
      toast.success('Assessment type created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create assessment type');
    },
  });
};

/**
 * Hook to update assessment type
 */
export const useUpdateAssessmentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssessmentTypeConfig> }) =>
      gradesApi.updateAssessmentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessmentTypes() });
      toast.success('Assessment type updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update assessment type');
    },
  });
};

/**
 * Hook to delete assessment type
 */
export const useDeleteAssessmentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.deleteAssessmentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessmentTypes() });
      toast.success('Assessment type deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete assessment type');
    },
  });
};

// ==================== ASSESSMENTS ====================

/**
 * Hook to fetch assessments
 */
export const useAssessments = (filters?: GradeFilters) => {
  return useQuery({
    queryKey: gradesKeys.assessmentList(filters),
    queryFn: () => gradesApi.getAssessments(filters),
  });
};

/**
 * Hook to fetch a single assessment
 */
export const useAssessment = (id: string) => {
  return useQuery({
    queryKey: gradesKeys.assessment(id),
    queryFn: () => gradesApi.getAssessment(id),
    enabled: !!id,
  });
};

/**
 * Hook to create assessment
 */
export const useCreateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Assessment, keyof import('@/types/academic').BaseEntity>) =>
      gradesApi.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessments() });
      toast.success('Assessment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create assessment');
    },
  });
};

/**
 * Hook to update assessment
 */
export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assessment> }) =>
      gradesApi.updateAssessment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessment(variables.id) });
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessments() });
      toast.success('Assessment updated successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked assessment');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update assessment');
      }
    },
  });
};

/**
 * Hook to delete assessment
 */
export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessments() });
      toast.success('Assessment deleted successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot delete locked assessment');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to delete assessment');
      }
    },
  });
};

/**
 * Hook to lock assessment
 */
export const useLockAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.lockAssessment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessment(id) });
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessments() });
      toast.success('Assessment locked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to lock assessment');
    },
  });
};

/**
 * Hook to unlock assessment
 */
export const useUnlockAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.unlockAssessment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessment(id) });
      queryClient.invalidateQueries({ queryKey: gradesKeys.assessments() });
      toast.success('Assessment unlocked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to unlock assessment');
    },
  });
};

// ==================== GRADE ENTRIES ====================

/**
 * Hook to fetch grade entries
 */
export const useGradeEntries = (filters?: GradeFilters & { assessment_id?: string }) => {
  return useQuery({
    queryKey: gradesKeys.entryList(filters),
    queryFn: () => gradesApi.getGradeEntries(filters),
    enabled: !!filters?.assessment_id,
  });
};

/**
 * Hook to fetch a single grade entry
 */
export const useGradeEntry = (id: string) => {
  return useQuery({
    queryKey: gradesKeys.entry(id),
    queryFn: () => gradesApi.getGradeEntry(id),
    enabled: !!id,
  });
};

/**
 * Hook to create grade entry
 */
export const useCreateGradeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<GradeEntry, keyof import('@/types/academic').BaseEntity | 'percentage'>) =>
      gradesApi.createGradeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.entries() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success('Grade recorded successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked assessment');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to record grade');
      }
    },
  });
};

/**
 * Hook to bulk create grade entries
 */
export const useBulkCreateGradeEntries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkGradeEntry) => gradesApi.bulkCreateGradeEntries(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.entries() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success(`${data.length} grades recorded successfully`);
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked assessment');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to record grades');
      }
    },
  });
};

/**
 * Hook to update grade entry
 */
export const useUpdateGradeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradeEntry> }) =>
      gradesApi.updateGradeEntry(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.entry(variables.id) });
      queryClient.invalidateQueries({ queryKey: gradesKeys.entries() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success('Grade updated successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked assessment');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update grade');
      }
    },
  });
};

/**
 * Hook to delete grade entry
 */
export const useDeleteGradeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.deleteGradeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.entries() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success('Grade deleted successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot delete locked assessment');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to delete grade');
      }
    },
  });
};

// ==================== GRADE SUMMARIES ====================

/**
 * Hook to fetch grade summaries
 */
export const useGradeSummaries = (filters?: GradeFilters) => {
  return useQuery({
    queryKey: gradesKeys.summaries(),
    queryFn: () => gradesApi.getGradeSummaries(filters),
  });
};

/**
 * Hook to fetch student grade summary
 */
export const useStudentGradeSummary = (
  studentId: string,
  subjectId: string,
  quarter: number
) => {
  return useQuery({
    queryKey: gradesKeys.summary(studentId, subjectId, quarter),
    queryFn: () => gradesApi.getStudentGradeSummary(studentId, subjectId, quarter),
    enabled: !!studentId && !!subjectId && !!quarter,
  });
};

/**
 * Hook to fetch student report card
 */
export const useStudentReportCard = (studentId: string, quarter: number) => {
  return useQuery({
    queryKey: gradesKeys.reportCard(studentId, quarter),
    queryFn: () => gradesApi.getStudentReportCard(studentId, quarter),
    enabled: !!studentId && !!quarter,
  });
};

// ==================== GRADE OVERRIDES ====================

/**
 * Hook to fetch grade overrides
 */
export const useGradeOverrides = (filters?: GradeFilters) => {
  return useQuery({
    queryKey: gradesKeys.overrides(),
    queryFn: () => gradesApi.getGradeOverrides(filters),
  });
};

/**
 * Hook to create grade override
 */
export const useCreateGradeOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<GradeOverride, keyof import('@/types/academic').BaseEntity>) =>
      gradesApi.createGradeOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.overrides() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success('Grade override created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create override');
    },
  });
};

/**
 * Hook to update grade override
 */
export const useUpdateGradeOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradeOverride> }) =>
      gradesApi.updateGradeOverride(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.override(variables.id) });
      queryClient.invalidateQueries({ queryKey: gradesKeys.overrides() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success('Grade override updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update override');
    },
  });
};

/**
 * Hook to delete grade override
 */
export const useDeleteGradeOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradesApi.deleteGradeOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.overrides() });
      queryClient.invalidateQueries({ queryKey: gradesKeys.summaries() });
      toast.success('Grade override removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove override');
    },
  });
};

// ==================== CUSTOM HOOKS ====================

/**
 * Hook to export grades
 */
export const useExportGrades = () => {
  return useMutation({
    mutationFn: (filters?: GradeFilters) => gradesApi.exportGrades(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grades-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Grades exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export grades');
    },
  });
};
