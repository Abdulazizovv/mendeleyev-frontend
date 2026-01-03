/**
 * Student Report Card Component
 * Display student's grades for all subjects in a quarter
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Award, BookOpen } from 'lucide-react';
import type { GradeSummary } from '@/types/academic';
import { cn } from '@/lib/utils';
import { gradesApi } from '../api';

interface StudentReportCardProps {
  summaries: GradeSummary[];
  studentName?: string;
  quarter: number;
  isLoading?: boolean;
  className?: string;
}

export const StudentReportCard: React.FC<StudentReportCardProps> = ({
  summaries,
  studentName,
  quarter,
  isLoading,
  className,
}) => {
  const overallAverage =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.average_score, 0) / summaries.length
      : 0;

  const overallLetterGrade = gradesApi.getLetterGrade(overallAverage);

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-300';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-300';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  const getTrendIcon = (average: number) => {
    if (average >= 85) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (average >= 70) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6" />
              Report Card - Quarter {quarter}
            </CardTitle>
            {studentName && (
              <p className="text-sm text-muted-foreground mt-1">{studentName}</p>
            )}
          </div>

          {/* Overall Average */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Overall Average</div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'text-3xl font-bold',
                  getGradeColor(overallAverage).split(' ')[0]
                )}
              >
                {Math.round(overallAverage)}%
              </div>
              <Badge
                variant="outline"
                className={cn('text-xl font-bold', getGradeColor(overallAverage))}
              >
                {overallLetterGrade}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {summaries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No grades available for Quarter {quarter}</p>
          </div>
        ) : (
          summaries
            .sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || ''))
            .map((summary) => {
              const letterGrade = summary.letter_grade || gradesApi.getLetterGrade(summary.average_score);
              
              return (
                <div
                  key={summary.subject_id}
                  className={cn(
                    'p-4 rounded-lg border-2',
                    getGradeColor(summary.average_score)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(summary.average_score)}
                        <h3 className="font-semibold text-lg">{summary.subject_name}</h3>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {summary.assessments_count} assessment
                        {summary.assessments_count !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Percentage */}
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Average</div>
                        <div className="text-3xl font-bold">
                          {Math.round(summary.average_score)}%
                        </div>
                      </div>

                      {/* Letter Grade */}
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Grade</div>
                        <Badge variant="outline" className="text-2xl font-bold px-4 py-2">
                          {letterGrade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        )}

        {/* Summary Stats */}
        {summaries.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Subjects</div>
              <div className="text-2xl font-bold">{summaries.length}</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Highest</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(Math.max(...summaries.map((s) => s.average_score)))}%
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Lowest</div>
              <div className="text-2xl font-bold text-red-600">
                {Math.round(Math.min(...summaries.map((s) => s.average_score)))}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
