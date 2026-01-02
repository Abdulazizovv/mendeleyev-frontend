/**
 * ExportModal Component - Excel Export Dialog
 * 
 * Features:
 * - Date range picker
 * - Filter options (payment method, status, branch, etc.)
 * - Real-time progress indicator
 * - Automatic file download on success
 * - Professional error handling
 */

'use client';

import { useState, useEffect } from 'react';
import { useExport } from '@/lib/hooks/useExport';
import { useAuthStore } from '@/lib/stores';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import type { ExportFilters } from '@/types/finance';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'transactions' | 'payments';
  defaultFilters?: Partial<ExportFilters>;
}

export const ExportModal = ({
  open,
  onOpenChange,
  exportType,
  defaultFilters = {},
}: ExportModalProps) => {
  const [filters, setFilters] = useState<ExportFilters>({
    ...defaultFilters,
  });

  // Get branch_id from auth state
  const currentBranch = useAuthStore((state) => state.currentBranch);
  const branchId = currentBranch?.branch_id;
  
  console.log('🏢 Auth state currentBranch:', currentBranch);
  console.log('🆔 Branch ID from state:', branchId);

  const {
    startExport,
    downloadFile,
    reset,
    isExporting,
    taskStatus,
    progress,
  } = useExport(exportType, {
    onSuccess: (data) => {
      if (data.file_url) {
        const filename = `${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        downloadFile(data.file_url, filename);
        toast.success(`${data.records_count} ta yozuv Excel faylga eksport qilindi`, {
          description: 'Fayl avtomatik yuklanmoqda...',
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
        setTimeout(() => {
          onOpenChange(false);
          reset();
        }, 2000);
      }
    },
    onError: (error) => {
      toast.error('Export xatolik bilan yakunlandi', {
        description: error.message,
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      });
    },
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      reset();
      setFilters({ ...defaultFilters });
    }
  }, [open, reset, defaultFilters]);

  const handleExport = async () => {
    // Check if branch_id exists
    if (!branchId) {
      toast.error('Branch topilmadi', {
        description: 'Iltimos qaytadan login qiling va branch tanlang',
      });
      return;
    }
    
    // Validation - only check if both dates provided
    if (filters.date_from && filters.date_to) {
      if (new Date(filters.date_from) > new Date(filters.date_to)) {
        toast.error('Boshlanish sanasi tugash sanasidan kichik bo\'lishi kerak');
        return;
      }
    }

    // Show info if no filters applied
    if (!filters.date_from && !filters.date_to && !filters.status && !filters.payment_method) {
      toast.info('Barcha ma\'lumotlar eksport qilinmoqda', {
        description: 'Filtr qo\'llanmagan, barcha yozuvlar yuklanadi',
      });
    }

    // Include branch_id in BOTH body AND header for compatibility
    const exportFilters = {
      ...filters,
      branch_id: branchId, // UUID string from localStorage
    };

    console.log('🚀 Export filters (body):', exportFilters);
    console.log('🏢 Branch ID:', branchId, '(UUID string, sent in body + X-Branch-Id header)');

    await startExport(exportFilters);
  };

  const isSuccess = taskStatus?.status === 'SUCCESS';
  const isFailure = taskStatus?.status === 'FAILURE';
  const isProcessing = isExporting && !isSuccess && !isFailure;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Excel ga eksport qilish
          </DialogTitle>
          <DialogDescription>
            {exportType === 'transactions' ? 'Tranzaksiyalar' : 'To\'lovlar'} ro'yxatini Excel faylga yuklab olish.
            Filtrlar ixtiyoriy - bo\'sh qoldirish barcha ma\'lumotlarni eksport qiladi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">💡 Maslahat:</p>
            <p className="text-blue-700 mt-1">
              • Sana ko'rsatmasangiz - barcha ma'lumotlar eksport qilinadi<br />
              • Filtrlar sahifadagi joriy filtrlar bilan to'ldiriladi<br />
              • Filtrlarni o'chirish uchun "Barchasi" ni tanlang
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Boshlanish sanasi (ixtiyoriy)</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                disabled={isProcessing}
                placeholder="Barcha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Tugash sanasi (ixtiyoriy)</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                disabled={isProcessing}
                placeholder="Barcha"
              />
            </div>
          </div>

          {/* Payment Method (for transactions) */}
          {exportType === 'transactions' && (
            <div className="space-y-2">
              <Label htmlFor="payment-method">To'lov usuli (ixtiyoriy)</Label>
              <Select
                value={filters.payment_method}
                onValueChange={(value) => setFilters({ ...filters, payment_method: value as any })}
                disabled={isProcessing}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="CASH">Naqd</SelectItem>
                  <SelectItem value="CARD">Karta</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank o'tkazmasi</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Holat (ixtiyoriy)</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as any })}
              disabled={isProcessing}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {exportType === 'transactions' ? (
                  <>
                    <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                    <SelectItem value="COMPLETED">Yakunlangan</SelectItem>
                    <SelectItem value="CANCELLED">Bekor qilingan</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                    <SelectItem value="APPROVED">Tasdiqlangan</SelectItem>
                    <SelectItem value="REJECTED">Rad etilgan</SelectItem>
                    <SelectItem value="PAID">To'langan</SelectItem>
                    <SelectItem value="PARTIALLY_PAID">Qisman to'langan</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">
                  {taskStatus?.status === 'PENDING' && 'Kutilmoqda...'}
                  {taskStatus?.status === 'STARTED' && 'Ishlanmoqda...'}
                </span>
                <span className="text-blue-700">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {taskStatus?.message && (
                <p className="text-xs text-blue-700">{taskStatus.message}</p>
              )}
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium">Excel fayl tayyor!</p>
                <p className="text-green-700">
                  {taskStatus.records_count} ta yozuv eksport qilindi
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isFailure && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-medium">Xatolik yuz berdi</p>
                <p className="text-red-700">{taskStatus.error || 'Export amalga oshmadi'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Yopish
          </Button>
          {isSuccess && taskStatus?.file_url && (
            <Button
              onClick={() => {
                const filename = `${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
                downloadFile(taskStatus.file_url!, filename);
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Qayta yuklab olish
            </Button>
          )}
          {!isSuccess && (
            <Button
              onClick={handleExport}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Kuting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Eksport qilish
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
