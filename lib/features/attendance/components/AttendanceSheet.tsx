/**
 * Attendance Sheet Component
 * Bulk attendance marking interface for teachers
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Unlock, Save, CheckCircle } from 'lucide-react';
import type { AttendanceSheet, AttendanceStatus } from '@/types/academic';
import { cn } from '@/lib/utils';

interface AttendanceSheetProps {
  sheet: AttendanceSheet;
  isLoading?: boolean;
  onSave: (records: Array<{ student_id: string; status: AttendanceStatus; notes?: string }>) => Promise<void>;
  onLock?: () => void;
  onUnlock?: () => void;
  canLock?: boolean;
  canUnlock?: boolean;
  className?: string;
}

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string; color: string }> = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-800 border-blue-300' },
];

export const AttendanceSheetComponent: React.FC<AttendanceSheetProps> = ({
  sheet,
  isLoading,
  onSave,
  onLock,
  onUnlock,
  canLock = false,
  canUnlock = false,
  className,
}) => {
  const [editedRecords, setEditedRecords] = useState<Map<string, { status: AttendanceStatus; notes?: string }>>(
    new Map()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const hasChanges = editedRecords.size > 0;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (sheet.is_locked) return;

    const newRecords = new Map(editedRecords);
    const existingRecord = sheet.records.find((r) => r.student_id === studentId);
    
    if (existingRecord?.status === status && !newRecords.has(studentId)) {
      return; // No change
    }

    newRecords.set(studentId, { status });
    setEditedRecords(newRecords);
  };

  const handleBulkStatus = (status: AttendanceStatus) => {
    if (sheet.is_locked || selectedStudents.size === 0) return;

    const newRecords = new Map(editedRecords);
    selectedStudents.forEach((studentId) => {
      newRecords.set(studentId, { status });
    });
    setEditedRecords(newRecords);
    setSelectedStudents(new Set()); // Clear selection
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(sheet.records.map((r) => r.student_id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSave = async () => {
    if (!hasChanges || sheet.is_locked) return;

    setIsSaving(true);
    try {
      const records = Array.from(editedRecords.entries()).map(([student_id, data]) => ({
        student_id,
        ...data,
      }));
      await onSave(records);
      setEditedRecords(new Map());
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Failed to save attendance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStudentStatus = (studentId: string): AttendanceStatus => {
    const edited = editedRecords.get(studentId);
    if (edited) return edited.status;

    const existing = sheet.records.find((r) => r.student_id === studentId);
    return existing?.status || 'present';
  };

  const getStatusColor = (status: AttendanceStatus): string => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option?.color || '';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Attendance Sheet</CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            {sheet.subject_name} - {sheet.class_name} - {sheet.lesson_date}
          </div>
        </div>
        <div className="flex gap-2">
          {sheet.is_locked ? (
            <>
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
              {canUnlock && (
                <Button size="sm" variant="outline" onClick={onUnlock}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock
                </Button>
              )}
            </>
          ) : (
            <>
              {canLock && (
                <Button size="sm" variant="outline" onClick={onLock}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        {!sheet.is_locked && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="select-all"
              checked={selectedStudents.size === sheet.records.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({selectedStudents.size} selected)
            </label>

            {selectedStudents.size > 0 && (
              <>
                <div className="flex-1" />
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatus(option.value)}
                  >
                    Mark {option.label}
                  </Button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Student List */}
        <div className="space-y-2">
          {sheet.records.map((record) => {
            const currentStatus = getStudentStatus(record.student_id);
            const isChanged = editedRecords.has(record.student_id);

            return (
              <div
                key={record.student_id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 transition-colors',
                  isChanged && 'bg-blue-50 border-blue-300'
                )}
              >
                {!sheet.is_locked && (
                  <Checkbox
                    checked={selectedStudents.has(record.student_id)}
                    onCheckedChange={(checked) =>
                      handleSelectStudent(record.student_id, checked as boolean)
                    }
                  />
                )}

                <div className="flex-1">
                  <div className="font-medium">{record.student_name}</div>
                  {record.notes && (
                    <div className="text-xs text-muted-foreground">{record.notes}</div>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((option) => {
                    const isActive = currentStatus === option.value;
                    return (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        disabled={sheet.is_locked}
                        className={cn(
                          'min-w-[80px]',
                          isActive && getStatusColor(option.value)
                        )}
                        onClick={() => handleStatusChange(record.student_id, option.value)}
                      >
                        {isActive && <CheckCircle className="h-3 w-3 mr-1" />}
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        {!sheet.is_locked && hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : `Save Changes (${editedRecords.size})`}
            </Button>
          </div>
        )}

        {sheet.records.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No students found in this class.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
