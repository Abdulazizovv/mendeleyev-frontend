/**
 * Grade Entry Sheet Component
 * Bulk grading interface for assessments
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Lock, Unlock, Save, Calculator } from 'lucide-react';
import type { Assessment, GradeEntry } from '@/types/academic';
import { cn } from '@/lib/utils';
import { gradesApi } from '../api';

interface GradeEntrySheetProps {
  assessment: Assessment;
  entries: GradeEntry[];
  isLoading?: boolean;
  onSave: (grades: Array<{ student_id: string; score: number; notes?: string }>) => Promise<void>;
  onLock?: () => void;
  onUnlock?: () => void;
  canLock?: boolean;
  canUnlock?: boolean;
  className?: string;
}

export const GradeEntrySheet: React.FC<GradeEntrySheetProps> = ({
  assessment,
  entries,
  isLoading,
  onSave,
  onLock,
  onUnlock,
  canLock = false,
  canUnlock = false,
  className,
}) => {
  const [editedGrades, setEditedGrades] = useState<Map<string, { score: number; notes?: string }>>(
    new Map()
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = editedGrades.size > 0;

  const handleScoreChange = (studentId: string, value: string) => {
    if (assessment.is_locked) return;

    const score = parseFloat(value);
    if (isNaN(score) || score < 0 || score > assessment.max_score) {
      return;
    }

    const newGrades = new Map(editedGrades);
    const existingEntry = entries.find((e) => e.student_id === studentId);
    
    if (existingEntry?.score === score && !newGrades.has(studentId)) {
      return; // No change
    }

    newGrades.set(studentId, { score });
    setEditedGrades(newGrades);
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    if (assessment.is_locked) return;

    const newGrades = new Map(editedGrades);
    const existing = newGrades.get(studentId) || { score: 0 };
    newGrades.set(studentId, { ...existing, notes });
    setEditedGrades(newGrades);
  };

  const handleSave = async () => {
    if (!hasChanges || assessment.is_locked) return;

    setIsSaving(true);
    try {
      const grades = Array.from(editedGrades.entries()).map(([student_id, data]) => ({
        student_id,
        ...data,
      }));
      await onSave(grades);
      setEditedGrades(new Map());
    } catch (error) {
      console.error('Failed to save grades:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStudentGrade = (studentId: string): { score: number; percentage: number; notes?: string } => {
    const edited = editedGrades.get(studentId);
    if (edited) {
      return {
        score: edited.score,
        percentage: gradesApi.calculatePercentage(edited.score, assessment.max_score),
        notes: edited.notes,
      };
    }

    const existing = entries.find((e) => e.student_id === studentId);
    if (existing) {
      return {
        score: existing.score,
        percentage: existing.percentage,
        notes: existing.notes,
      };
    }

    return { score: 0, percentage: 0 };
  };

  const getLetterGrade = (percentage: number): string => {
    return gradesApi.getLetterGrade(percentage);
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
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
              <Skeleton key={i} className="h-20 w-full" />
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
          <CardTitle>{assessment.name}</CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            {assessment.subject_name} - {assessment.class_name} - Max: {assessment.max_score}
          </div>
        </div>
        <div className="flex gap-2">
          {assessment.is_locked ? (
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
        {/* Summary */}
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Total Students</div>
            <div className="text-2xl font-bold">{entries.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Graded</div>
            <div className="text-2xl font-bold">
              {entries.filter((e) => e.score > 0).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Average</div>
            <div className="text-2xl font-bold">
              {entries.length > 0
                ? Math.round(
                    entries.reduce((sum, e) => sum + e.percentage, 0) / entries.length
                  )
                : 0}
              %
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-2">
          {entries.map((entry) => {
            const grade = getStudentGrade(entry.student_id);
            const isChanged = editedGrades.has(entry.student_id);
            const letterGrade = getLetterGrade(grade.percentage);

            return (
              <div
                key={entry.student_id}
                className={cn(
                  'grid grid-cols-12 gap-3 p-3 rounded-lg border-2 transition-colors items-center',
                  isChanged && 'bg-blue-50 border-blue-300'
                )}
              >
                {/* Student Name */}
                <div className="col-span-4">
                  <div className="font-medium">{entry.student_name}</div>
                </div>

                {/* Score Input */}
                <div className="col-span-2">
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={assessment.max_score}
                      step={0.5}
                      value={grade.score}
                      onChange={(e) =>
                        handleScoreChange(entry.student_id, e.target.value)
                      }
                      disabled={assessment.is_locked}
                      className="text-center font-semibold"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      / {assessment.max_score}
                    </div>
                  </div>
                </div>

                {/* Percentage */}
                <div className="col-span-2 text-center">
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      getGradeColor(grade.percentage)
                    )}
                  >
                    {grade.percentage}%
                  </div>
                </div>

                {/* Letter Grade */}
                <div className="col-span-1 text-center">
                  <Badge
                    variant="outline"
                    className={cn('text-lg font-bold', getGradeColor(grade.percentage))}
                  >
                    {letterGrade}
                  </Badge>
                </div>

                {/* Notes */}
                <div className="col-span-3">
                  <Textarea
                    placeholder="Notes (optional)"
                    value={grade.notes || ''}
                    onChange={(e) => handleNotesChange(entry.student_id, e.target.value)}
                    disabled={assessment.is_locked}
                    className="text-xs resize-none h-12"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        {!assessment.is_locked && hasChanges && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditedGrades(new Map())}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : `Save Grades (${editedGrades.size})`}
            </Button>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No students found in this class.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
