/**
 * Grades & Assessments API
 * Endpoints for managing assessments, grades, and summaries
 */

import { apiClient } from '@/lib/api';
import type {
  PaginatedResponse,
  AssessmentTypeConfig,
  Assessment,
  GradeEntry,
  GradeSummary,
  GradeOverride,
  BulkGradeEntry,
  GradeFilters,
} from '@/types/academic';

const BASE_PATH = '/school/grades';

// ==================== ASSESSMENT TYPES ====================

/**
 * Get all assessment type configurations
 */
export const getAssessmentTypes = async (): Promise<
  PaginatedResponse<AssessmentTypeConfig>
> => {
  const response = await apiClient.get(`${BASE_PATH}/assessment-types/`);
  return response.data;
};

/**
 * Create assessment type
 * @requires Permission: create_assessmenttype
 */
export const createAssessmentType = async (
  data: Omit<AssessmentTypeConfig, keyof import('@/types/academic').BaseEntity>
): Promise<AssessmentTypeConfig> => {
  const response = await apiClient.post(`${BASE_PATH}/assessment-types/`, data);
  return response.data;
};

/**
 * Update assessment type
 * @requires Permission: change_assessmenttype
 */
export const updateAssessmentType = async (
  id: string,
  data: Partial<AssessmentTypeConfig>
): Promise<AssessmentTypeConfig> => {
  const response = await apiClient.patch(`${BASE_PATH}/assessment-types/${id}/`, data);
  return response.data;
};

/**
 * Delete assessment type
 * @requires Permission: delete_assessmenttype
 */
export const deleteAssessmentType = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/assessment-types/${id}/`);
};

// ==================== ASSESSMENTS ====================

/**
 * Get all assessments
 */
export const getAssessments = async (
  filters?: GradeFilters
): Promise<PaginatedResponse<Assessment>> => {
  const response = await apiClient.get(`${BASE_PATH}/assessments/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get assessment by ID
 */
export const getAssessment = async (id: string): Promise<Assessment> => {
  const response = await apiClient.get(`${BASE_PATH}/assessments/${id}/`);
  return response.data;
};

/**
 * Create assessment
 * @requires Permission: create_assessment
 */
export const createAssessment = async (
  data: Omit<Assessment, keyof import('@/types/academic').BaseEntity>
): Promise<Assessment> => {
  const response = await apiClient.post(`${BASE_PATH}/assessments/`, data);
  return response.data;
};

/**
 * Update assessment
 * @requires Permission: change_assessment
 * @requires Assessment must not be locked
 */
export const updateAssessment = async (
  id: string,
  data: Partial<Assessment>
): Promise<Assessment> => {
  const response = await apiClient.patch(`${BASE_PATH}/assessments/${id}/`, data);
  return response.data;
};

/**
 * Delete assessment
 * @requires Permission: delete_assessment
 * @requires Assessment must not be locked
 */
export const deleteAssessment = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/assessments/${id}/`);
};

/**
 * Lock assessment
 * Prevents further edits to grades
 * @requires Permission: lock_assessment
 */
export const lockAssessment = async (id: string): Promise<Assessment> => {
  const response = await apiClient.post(`${BASE_PATH}/assessments/${id}/lock/`);
  return response.data;
};

/**
 * Unlock assessment
 * Admin-only action
 * @requires Permission: unlock_assessment
 */
export const unlockAssessment = async (id: string): Promise<Assessment> => {
  const response = await apiClient.post(`${BASE_PATH}/assessments/${id}/unlock/`);
  return response.data;
};

// ==================== GRADE ENTRIES ====================

/**
 * Get all grade entries
 */
export const getGradeEntries = async (
  filters?: GradeFilters & { assessment_id?: string }
): Promise<PaginatedResponse<GradeEntry>> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-entries/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get grade entry by ID
 */
export const getGradeEntry = async (id: string): Promise<GradeEntry> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-entries/${id}/`);
  return response.data;
};

/**
 * Create single grade entry
 * @requires Permission: create_gradeentry
 * @requires Assessment must not be locked
 */
export const createGradeEntry = async (
  data: Omit<GradeEntry, keyof import('@/types/academic').BaseEntity | 'percentage'>
): Promise<GradeEntry> => {
  const response = await apiClient.post(`${BASE_PATH}/grade-entries/`, data);
  return response.data;
};

/**
 * Bulk create grade entries
 * @requires Permission: create_gradeentry
 * @requires Assessment must not be locked
 */
export const bulkCreateGradeEntries = async (
  data: BulkGradeEntry
): Promise<GradeEntry[]> => {
  const response = await apiClient.post(`${BASE_PATH}/grade-entries/bulk-create/`, data);
  return response.data;
};

/**
 * Update grade entry
 * @requires Permission: change_gradeentry
 * @requires Assessment must not be locked
 */
export const updateGradeEntry = async (
  id: string,
  data: Partial<GradeEntry>
): Promise<GradeEntry> => {
  const response = await apiClient.patch(`${BASE_PATH}/grade-entries/${id}/`, data);
  return response.data;
};

/**
 * Delete grade entry
 * @requires Permission: delete_gradeentry
 * @requires Assessment must not be locked
 */
export const deleteGradeEntry = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/grade-entries/${id}/`);
};

// ==================== GRADE SUMMARIES ====================

/**
 * Get grade summaries
 */
export const getGradeSummaries = async (
  filters?: GradeFilters
): Promise<PaginatedResponse<GradeSummary>> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-summaries/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get student's grade summary for a subject/quarter
 */
export const getStudentGradeSummary = async (
  studentId: string,
  subjectId: string,
  quarter: number
): Promise<GradeSummary> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-summaries/`, {
    params: { student_id: studentId, subject_id: subjectId, quarter },
  });
  return response.data.results[0];
};

/**
 * Get student's full report card (all subjects for a quarter)
 */
export const getStudentReportCard = async (
  studentId: string,
  quarter: number
): Promise<GradeSummary[]> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-summaries/`, {
    params: { student_id: studentId, quarter },
  });
  return response.data.results;
};

// ==================== GRADE OVERRIDES ====================

/**
 * Get grade overrides
 */
export const getGradeOverrides = async (
  filters?: GradeFilters
): Promise<PaginatedResponse<GradeOverride>> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-overrides/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Create grade override
 * @requires Permission: create_gradeoverride (admin/teacher)
 */
export const createGradeOverride = async (
  data: Omit<GradeOverride, keyof import('@/types/academic').BaseEntity>
): Promise<GradeOverride> => {
  const response = await apiClient.post(`${BASE_PATH}/grade-overrides/`, data);
  return response.data;
};

/**
 * Update grade override
 * @requires Permission: change_gradeoverride
 */
export const updateGradeOverride = async (
  id: string,
  data: Partial<GradeOverride>
): Promise<GradeOverride> => {
  const response = await apiClient.patch(`${BASE_PATH}/grade-overrides/${id}/`, data);
  return response.data;
};

/**
 * Delete grade override (revert to auto-calculated grade)
 * @requires Permission: delete_gradeoverride
 */
export const deleteGradeOverride = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/grade-overrides/${id}/`);
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate percentage from score and max score
 */
export const calculatePercentage = (score: number, maxScore: number): number => {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100 * 100) / 100; // Round to 2 decimals
};

/**
 * Get letter grade from percentage
 * Customize based on your grading scale
 */
export const getLetterGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

/**
 * Check if assessment can be edited
 */
export const canEditAssessment = async (assessmentId: string): Promise<boolean> => {
  try {
    const assessment = await getAssessment(assessmentId);
    return !assessment.is_locked;
  } catch {
    return false;
  }
};

/**
 * Export grades to Excel (if backend supports)
 */
export const exportGrades = async (filters?: GradeFilters): Promise<Blob> => {
  const response = await apiClient.get(`${BASE_PATH}/grade-entries/export/`, {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export const gradesApi = {
  // Assessment Types
  getAssessmentTypes,
  createAssessmentType,
  updateAssessmentType,
  deleteAssessmentType,

  // Assessments
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  lockAssessment,
  unlockAssessment,

  // Grade Entries
  getGradeEntries,
  getGradeEntry,
  createGradeEntry,
  bulkCreateGradeEntries,
  updateGradeEntry,
  deleteGradeEntry,

  // Grade Summaries
  getGradeSummaries,
  getStudentGradeSummary,
  getStudentReportCard,

  // Grade Overrides
  getGradeOverrides,
  createGradeOverride,
  updateGradeOverride,
  deleteGradeOverride,

  // Helpers
  calculatePercentage,
  getLetterGrade,
  canEditAssessment,
  exportGrades,
};
