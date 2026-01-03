/**
 * Attendance React Query Hooks
 * Custom hooks for attendance data fetching and mutations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendanceApi } from './api';
import type {
  AttendanceRecord,
  AttendanceFilters,
  MarkAttendanceRequest,
  BulkMarkAttendanceRequest,
} from '@/types/academic';

// ==================== QUERY KEYS ====================

export const attendanceKeys = {
  all: ['attendance'] as const,
  
  records: () => [...attendanceKeys.all, 'records'] as const,
  record: (id: string) => [...attendanceKeys.records(), id] as const,
  recordList: (filters?: AttendanceFilters) =>
    [...attendanceKeys.records(), 'list', filters] as const,
  
  sheet: (lessonId: string) =>
    [...attendanceKeys.all, 'sheet', lessonId] as const,
  
  statistics: () => [...attendanceKeys.all, 'statistics'] as const,
  studentStats: (studentId: string, dateFrom?: string, dateTo?: string) =>
    [...attendanceKeys.statistics(), 'student', studentId, dateFrom, dateTo] as const,
  classStats: (classId: string, dateFrom?: string, dateTo?: string) =>
    [...attendanceKeys.statistics(), 'class', classId, dateFrom, dateTo] as const,
};

// ==================== ATTENDANCE RECORDS ====================

/**
 * Hook to fetch attendance records
 */
export const useAttendanceRecords = (filters?: AttendanceFilters) => {
  return useQuery({
    queryKey: attendanceKeys.recordList(filters),
    queryFn: () => attendanceApi.getAttendanceRecords(filters),
  });
};

/**
 * Hook to fetch a single attendance record
 */
export const useAttendanceRecord = (id: string) => {
  return useQuery({
    queryKey: attendanceKeys.record(id),
    queryFn: () => attendanceApi.getAttendanceRecord(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch attendance sheet for a lesson
 */
export const useAttendanceSheet = (lessonId: string) => {
  return useQuery({
    queryKey: attendanceKeys.sheet(lessonId),
    queryFn: () => attendanceApi.getAttendanceSheet(lessonId),
    enabled: !!lessonId,
  });
};

/**
 * Hook to mark attendance for a single student
 */
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkAttendanceRequest) => attendanceApi.markAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.sheet(variables.lesson_id),
      });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked attendance');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to mark attendance');
      }
    },
  });
};

/**
 * Hook to bulk mark attendance
 */
export const useBulkMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkMarkAttendanceRequest) =>
      attendanceApi.bulkMarkAttendance(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.sheet(variables.lesson_id),
      });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      toast.success(`Attendance marked for ${data.length} students`);
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked attendance');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to mark attendance');
      }
    },
  });
};

/**
 * Hook to update attendance record
 */
export const useUpdateAttendanceRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarkAttendanceRequest> }) =>
      attendanceApi.updateAttendanceRecord(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.record(variables.id) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      if (data.lesson_id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.sheet(data.lesson_id),
        });
      }
      toast.success('Attendance updated successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot edit locked attendance');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update attendance');
      }
    },
  });
};

/**
 * Hook to delete attendance record
 */
export const useDeleteAttendanceRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attendanceApi.deleteAttendanceRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      toast.success('Attendance record deleted successfully');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Cannot delete locked attendance');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to delete attendance');
      }
    },
  });
};

// ==================== LOCK/UNLOCK ====================

/**
 * Hook to lock attendance for a lesson
 */
export const useLockAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => attendanceApi.lockAttendance(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sheet(lessonId) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      toast.success('Attendance locked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to lock attendance');
    },
  });
};

/**
 * Hook to unlock attendance for a lesson
 */
export const useUnlockAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => attendanceApi.unlockAttendance(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sheet(lessonId) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      toast.success('Attendance unlocked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to unlock attendance');
    },
  });
};

// ==================== STATISTICS ====================

/**
 * Hook to fetch attendance statistics
 */
export const useAttendanceStatistics = (filters?: AttendanceFilters) => {
  return useQuery({
    queryKey: attendanceKeys.statistics(),
    queryFn: () => attendanceApi.getAttendanceStatistics(filters),
  });
};

/**
 * Hook to fetch student attendance statistics
 */
export const useStudentAttendanceStats = (
  studentId: string,
  dateFrom?: string,
  dateTo?: string
) => {
  return useQuery({
    queryKey: attendanceKeys.studentStats(studentId, dateFrom, dateTo),
    queryFn: () => attendanceApi.getStudentAttendanceStats(studentId, dateFrom, dateTo),
    enabled: !!studentId,
  });
};

/**
 * Hook to fetch class attendance statistics
 */
export const useClassAttendanceStats = (
  classId: string,
  dateFrom?: string,
  dateTo?: string
) => {
  return useQuery({
    queryKey: attendanceKeys.classStats(classId, dateFrom, dateTo),
    queryFn: () => attendanceApi.getClassAttendanceStats(classId, dateFrom, dateTo),
    enabled: !!classId,
  });
};

// ==================== CUSTOM HOOKS ====================

/**
 * Hook to mark all students as present (quick action)
 */
export const useMarkAllPresent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, studentIds }: { lessonId: string; studentIds: string[] }) =>
      attendanceApi.markAllPresent(lessonId, studentIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.sheet(variables.lessonId),
      });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
      toast.success(`Marked ${data.length} students as present`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to mark all present');
    },
  });
};

/**
 * Hook to export attendance records
 */
export const useExportAttendance = () => {
  return useMutation({
    mutationFn: (filters?: AttendanceFilters) => attendanceApi.exportAttendance(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Attendance exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export attendance');
    },
  });
};
