/**
 * useExport Hook - Professional Excel Export with Polling
 * 
 * Celery task orqali asinxron export qilish va real-time status tracking
 * 
 * Features:
 * - Automatic polling (3s interval)
 * - Max attempts protection (60 attempts = 3 minutes)
 * - Error handling & retry logic
 * - File download helper
 * - TypeScript type safety
 * 
 * Usage:
 * ```tsx
 * const { startExport, isExporting, taskStatus } = useExport('transactions', {
 *   onSuccess: (data) => toast.success(`${data.records_count} yozuv tayyor`),
 *   onError: (error) => toast.error(error.message),
 * });
 * 
 * await startExport({ date_from: '2026-01-01', date_to: '2026-01-31' });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import type { 
  ExportFilters, 
  ExportTaskStatusResponse 
} from '@/types/finance';

interface UseExportOptions {
  onSuccess?: (data: ExportTaskStatusResponse) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
  maxAttempts?: number;
}

export const useExport = (
  exportType: 'transactions' | 'payments',
  options: UseExportOptions = {}
) => {
  const {
    onSuccess,
    onError,
    pollingInterval = 3000, // 3 seconds
    maxAttempts = 60, // 3 minutes max
  } = options;

  const [taskId, setTaskId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const attemptCountRef = useRef(0);
  const processedStatusRef = useRef<string | null>(null); // Track processed status
  
  // Use refs for callbacks to prevent effect re-runs
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Polling query - task status tekshirish
  const { 
    data: taskStatus, 
    isLoading: isPolling,
    error: pollingError 
  } = useQuery({
    queryKey: ['export-task-status', taskId],
    queryFn: () => financeApi.getExportTaskStatus(taskId!),
    enabled: !!taskId && isExporting,
    refetchInterval: (query) => {
      const data = query.state.data;
      
      // Terminal states - polling to'xtatish
      if (data?.status === 'SUCCESS' || data?.status === 'FAILURE') {
        return false;
      }
      
      // Max attempts check
      attemptCountRef.current += 1;
      if (attemptCountRef.current >= maxAttempts) {
        setIsExporting(false);
        onError?.(new Error('Export timeout: Juda uzoq vaqt oldi. Iltimos qaytadan urinib ko\'ring.'));
        return false;
      }
      
      // Continue polling
      return pollingInterval;
    },
    retry: 3, // Network error bo'lsa 3 marta retry
    retryDelay: 1000,
  });

  // Success/Error handling with useEffect
  useEffect(() => {
    if (!taskStatus?.status) return;
    
    // Prevent duplicate processing
    const statusKey = `${taskId}-${taskStatus.status}`;
    if (processedStatusRef.current === statusKey) return;
    processedStatusRef.current = statusKey;
    
    if (taskStatus.status === 'SUCCESS') {
      setIsExporting(false);
      // Check if no records found
      if (taskStatus.records_count === 0) {
        onErrorRef.current?.(new Error('Export qilish uchun ma\'lumot topilmadi. Filtrlarni o\'zgartiring yoki olib tashlang.'));
      } else {
        onSuccessRef.current?.(taskStatus);
      }
    } else if (taskStatus.status === 'FAILURE') {
      setIsExporting(false);
      const errorMessage = taskStatus.error || 'Export muvaffaqiyatsiz yakunlandi';
      // Provide helpful message for common errors
      if (errorMessage.includes('topilmadi') || errorMessage.includes('not found')) {
        onErrorRef.current?.(new Error('Ma\'lumot topilmadi. Sana oralig\'ini kengaytiring yoki filtrlarni olib tashlang.'));
      } else {
        onErrorRef.current?.(new Error(errorMessage));
      }
    }
  }, [taskStatus?.status, taskStatus?.records_count, taskId]);

  useEffect(() => {
    if (pollingError && isExporting) {
      setIsExporting(false);
      onErrorRef.current?.(pollingError as Error);
    }
  }, [pollingError, isExporting]);

  /**
   * Export jarayonini boshlash
   */
  const startExport = useCallback(async (filters: ExportFilters) => {
    try {
      setIsExporting(true);
      attemptCountRef.current = 0;
      
      // Export type bo'yicha tegishli API ni chaqirish
      const exportFn = exportType === 'transactions' 
        ? financeApi.exportTransactions 
        : financeApi.exportPayments;
      
      const response = await exportFn(filters);
      setTaskId(response.task_id);
    } catch (error: any) {
      setIsExporting(false);
      onError?.(error as Error);
      throw error;
    }
  }, [exportType, onError]);

  /**
   * Faylni yuklab olish
   */
  const downloadFile = useCallback((fileUrl: string, filename: string) => {
    // Backend media URL ni to'liq URL ga aylantirish
    const fullUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${fileUrl}`;
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setTaskId(null);
    setIsExporting(false);
    attemptCountRef.current = 0;
    processedStatusRef.current = null;
  }, []);

  return {
    // Actions
    startExport,
    downloadFile,
    reset,
    
    // State
    isExporting,
    taskStatus,
    isPolling,
    pollingError,
    
    // Computed
    progress: taskStatus?.progress || 0,
    attemptsCount: attemptCountRef.current,
  };
};
