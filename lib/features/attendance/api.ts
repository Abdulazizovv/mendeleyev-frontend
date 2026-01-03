/**
 * Attendance API
 * Endpoints for managing student attendance records
 */

import { apiClient } from '@/lib/api';
import type {
  PaginatedResponse,
  AttendanceRecord,
  AttendanceSheet,
  AttendanceStatistics,
  MarkAttendanceRequest,
  BulkMarkAttendanceRequest,
  AttendanceFilters,
} from '@/types/academic';

const BASE_PATH = '/school/attendance';

// ==================== ATTENDANCE RECORDS ====================

/**
 * Get attendance records
 */
export const getAttendanceRecords = async (
  filters?: AttendanceFilters
): Promise<PaginatedResponse<AttendanceRecord>> => {
  const response = await apiClient.get(`${BASE_PATH}/records/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get attendance record by ID
 */
export const getAttendanceRecord = async (id: string): Promise<AttendanceRecord> => {
  const response = await apiClient.get(`${BASE_PATH}/records/${id}/`);
  return response.data;
};

/**
 * Get attendance sheet for a specific lesson
 * Returns all students in the class with their attendance status
 */
export const getAttendanceSheet = async (lessonId: string): Promise<AttendanceSheet> => {
  const response = await apiClient.get(`${BASE_PATH}/records/`, {
    params: { lesson_id: lessonId },
  });
  
  // Transform response to AttendanceSheet format
  const records = response.data.results;
  return {
    lesson_id: lessonId,
    lesson_date: records[0]?.lesson_date || '',
    subject_name: records[0]?.subject_name || '',
    class_name: records[0]?.class_name || '',
    is_locked: records[0]?.is_locked || false,
    records,
  };
};

/**
 * Mark attendance for a single student
 * @requires Permission: create_attendancerecord or change_attendancerecord
 * @requires Lesson must not be locked
 */
export const markAttendance = async (
  data: MarkAttendanceRequest
): Promise<AttendanceRecord> => {
  const response = await apiClient.post(`${BASE_PATH}/records/mark/`, data);
  return response.data;
};

/**
 * Bulk mark attendance for multiple students
 * @requires Permission: create_attendancerecord or change_attendancerecord
 * @requires Lesson must not be locked
 */
export const bulkMarkAttendance = async (
  data: BulkMarkAttendanceRequest
): Promise<AttendanceRecord[]> => {
  const response = await apiClient.post(`${BASE_PATH}/records/bulk-mark/`, data);
  return response.data;
};

/**
 * Update attendance record
 * @requires Permission: change_attendancerecord
 * @requires Lesson must not be locked
 */
export const updateAttendanceRecord = async (
  id: string,
  data: Partial<MarkAttendanceRequest>
): Promise<AttendanceRecord> => {
  const response = await apiClient.patch(`${BASE_PATH}/records/${id}/`, data);
  return response.data;
};

/**
 * Delete attendance record
 * @requires Permission: delete_attendancerecord
 * @requires Lesson must not be locked
 */
export const deleteAttendanceRecord = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/records/${id}/`);
};

// ==================== LOCK/UNLOCK ====================

/**
 * Lock attendance for a lesson
 * Prevents further edits by teachers
 * @requires Permission: lock_attendance (usually teacher/admin)
 */
export const lockAttendance = async (lessonId: string): Promise<void> => {
  await apiClient.post(`${BASE_PATH}/records/lock/`, { lesson_id: lessonId });
};

/**
 * Unlock attendance for a lesson
 * Admin-only action to allow edits after locking
 * @requires Permission: unlock_attendance (usually admin only)
 */
export const unlockAttendance = async (lessonId: string): Promise<void> => {
  await apiClient.post(`${BASE_PATH}/records/unlock/`, { lesson_id: lessonId });
};

// ==================== STATISTICS ====================

/**
 * Get attendance statistics
 * Can filter by student, class, date range
 */
export const getAttendanceStatistics = async (
  filters?: AttendanceFilters
): Promise<AttendanceStatistics> => {
  const response = await apiClient.get(`${BASE_PATH}/statistics/`, {
    params: filters,
  });
  return response.data;
};

/**
 * Get attendance statistics for a specific student
 */
export const getStudentAttendanceStats = async (
  studentId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AttendanceStatistics> => {
  const response = await apiClient.get(`${BASE_PATH}/statistics/`, {
    params: {
      student_id: studentId,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return response.data;
};

/**
 * Get attendance statistics for a class
 */
export const getClassAttendanceStats = async (
  classId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AttendanceStatistics> => {
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
 * Check if attendance can be edited for a lesson
 */
export const canEditAttendance = async (lessonId: string): Promise<boolean> => {
  try {
    const sheet = await getAttendanceSheet(lessonId);
    return !sheet.is_locked;
  } catch {
    return false;
  }
};

/**
 * Mark all students as present (quick action)
 */
export const markAllPresent = async (
  lessonId: string,
  studentIds: string[]
): Promise<AttendanceRecord[]> => {
  return bulkMarkAttendance({
    lesson_id: lessonId,
    records: studentIds.map((student_id) => ({
      student_id,
      status: 'present',
    })),
  });
};

/**
 * Export attendance records to Excel (if backend supports)
 */
export const exportAttendance = async (
  filters?: AttendanceFilters
): Promise<Blob> => {
  const response = await apiClient.get(`${BASE_PATH}/records/export/`, {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export const attendanceApi = {
  // Records
  getAttendanceRecords,
  getAttendanceRecord,
  getAttendanceSheet,
  markAttendance,
  bulkMarkAttendance,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  
  // Lock/Unlock
  lockAttendance,
  unlockAttendance,
  
  // Statistics
  getAttendanceStatistics,
  getStudentAttendanceStats,
  getClassAttendanceStats,
  
  // Helpers
  canEditAttendance,
  markAllPresent,
  exportAttendance,
};
