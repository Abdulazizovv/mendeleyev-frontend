/**
 * Homework & Assignments API
 * Endpoints for managing homework assignments and student submissions
 */

import { apiClient } from '@/lib/api';
import type {
  PaginatedResponse,
  HomeworkAssignment,
  HomeworkSubmission,
  HomeworkStatistics,
  HomeworkFilters,
} from '@/types/academic';

const BASE_PATH = '/school/homework';

// ==================== HOMEWORK ASSIGNMENTS ====================

/**
 * Get all homework assignments
 */
export const getHomeworkAssignments = async (
  filters?: HomeworkFilters
): Promise<PaginatedResponse<HomeworkAssignment>> => {
  const response = await apiClient.get(`${BASE_PATH}/assignments/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get homework assignment by ID
 */
export const getHomeworkAssignment = async (
  id: string
): Promise<HomeworkAssignment> => {
  const response = await apiClient.get(`${BASE_PATH}/assignments/${id}/`);
  return response.data;
};

/**
 * Create homework assignment (teacher only)
 * @requires Permission: create_homeworkassignment
 * @requires User must be a teacher
 */
export const createHomeworkAssignment = async (
  data: Omit<HomeworkAssignment, keyof import('@/types/academic').BaseEntity>
): Promise<HomeworkAssignment> => {
  const response = await apiClient.post(`${BASE_PATH}/assignments/`, data);
  return response.data;
};

/**
 * Update homework assignment
 * @requires Permission: change_homeworkassignment
 * @requires User must be the creator
 */
export const updateHomeworkAssignment = async (
  id: string,
  data: Partial<HomeworkAssignment>
): Promise<HomeworkAssignment> => {
  const response = await apiClient.patch(`${BASE_PATH}/assignments/${id}/`, data);
  return response.data;
};

/**
 * Delete homework assignment
 * @requires Permission: delete_homeworkassignment
 * @requires User must be the creator
 */
export const deleteHomeworkAssignment = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/assignments/${id}/`);
};

// ==================== HOMEWORK SUBMISSIONS ====================

/**
 * Get all homework submissions
 */
export const getHomeworkSubmissions = async (
  filters?: HomeworkFilters & { assignment_id?: string }
): Promise<PaginatedResponse<HomeworkSubmission>> => {
  const response = await apiClient.get(`${BASE_PATH}/submissions/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get homework submission by ID
 */
export const getHomeworkSubmission = async (
  id: string
): Promise<HomeworkSubmission> => {
  const response = await apiClient.get(`${BASE_PATH}/submissions/${id}/`);
  return response.data;
};

/**
 * Get student's submission for an assignment
 */
export const getStudentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<HomeworkSubmission | null> => {
  const response = await apiClient.get(`${BASE_PATH}/submissions/`, {
    params: { assignment_id: assignmentId, student_id: studentId },
  });
  return response.data.results[0] || null;
};

/**
 * Submit homework (student only)
 * @requires Permission: create_homeworksubmission
 * @requires User must be a student in the class
 */
export const submitHomework = async (
  data: Omit<HomeworkSubmission, keyof import('@/types/academic').BaseEntity>
): Promise<HomeworkSubmission> => {
  const response = await apiClient.post(`${BASE_PATH}/submissions/`, data);
  return response.data;
};

/**
 * Update homework submission (student can edit before due date)
 * @requires Permission: change_homeworksubmission
 * @requires User must be the submitter
 * @requires Before due date (or teacher/admin can edit anytime)
 */
export const updateHomeworkSubmission = async (
  id: string,
  data: Partial<HomeworkSubmission>
): Promise<HomeworkSubmission> => {
  const response = await apiClient.patch(`${BASE_PATH}/submissions/${id}/`, data);
  return response.data;
};

/**
 * Delete homework submission
 * @requires Permission: delete_homeworksubmission
 * @requires User must be the submitter or teacher
 */
export const deleteHomeworkSubmission = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/submissions/${id}/`);
};

/**
 * Grade homework submission (teacher only)
 * @requires Permission: change_homeworksubmission
 * @requires User must be the assignment creator or subject teacher
 */
export const gradeHomeworkSubmission = async (
  id: string,
  score: number,
  feedback?: string
): Promise<HomeworkSubmission> => {
  const response = await apiClient.patch(`${BASE_PATH}/submissions/${id}/grade/`, {
    score,
    feedback,
  });
  return response.data;
};

// ==================== HOMEWORK STATISTICS ====================

/**
 * Get homework statistics for an assignment
 */
export const getHomeworkStatistics = async (
  assignmentId: string
): Promise<HomeworkStatistics> => {
  const response = await apiClient.get(`${BASE_PATH}/statistics/`, {
    params: { assignment_id: assignmentId },
  });
  return response.data;
};

/**
 * Get student's homework statistics
 */
export const getStudentHomeworkStats = async (
  studentId: string,
  subjectId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<HomeworkStatistics> => {
  const response = await apiClient.get(`${BASE_PATH}/statistics/`, {
    params: {
      student_id: studentId,
      subject_id: subjectId,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return response.data;
};

/**
 * Get class homework statistics
 */
export const getClassHomeworkStats = async (
  classId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<HomeworkStatistics> => {
  const response = await apiClient.get(`${BASE_PATH}/statistics/`, {
    params: {
      class_id: classId,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if homework is overdue
 */
export const isHomeworkOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

/**
 * Check if student can submit/edit homework
 */
export const canSubmitHomework = (assignment: HomeworkAssignment): boolean => {
  return !isHomeworkOverdue(assignment.due_date);
};

/**
 * Get homework status for a student
 */
export const getHomeworkStatus = (
  assignment: HomeworkAssignment,
  submission?: HomeworkSubmission | null
): 'not_submitted' | 'submitted' | 'late' | 'graded' => {
  if (!submission) {
    return isHomeworkOverdue(assignment.due_date) ? 'late' : 'not_submitted';
  }
  if (submission.status === 'graded') {
    return 'graded';
  }
  if (submission.submitted_at && new Date(submission.submitted_at) > new Date(assignment.due_date)) {
    return 'late';
  }
  return 'submitted';
};

/**
 * Export homework data to Excel (if backend supports)
 */
export const exportHomework = async (filters?: HomeworkFilters): Promise<Blob> => {
  const response = await apiClient.get(`${BASE_PATH}/assignments/export/`, {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export const homeworkApi = {
  // Assignments
  getHomeworkAssignments,
  getHomeworkAssignment,
  createHomeworkAssignment,
  updateHomeworkAssignment,
  deleteHomeworkAssignment,

  // Submissions
  getHomeworkSubmissions,
  getHomeworkSubmission,
  getStudentSubmission,
  submitHomework,
  updateHomeworkSubmission,
  deleteHomeworkSubmission,
  gradeHomeworkSubmission,

  // Statistics
  getHomeworkStatistics,
  getStudentHomeworkStats,
  getClassHomeworkStats,

  // Helpers
  isHomeworkOverdue,
  canSubmitHomework,
  getHomeworkStatus,
  exportHomework,
};
