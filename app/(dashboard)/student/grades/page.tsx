/**
 * Student Grades Page
 * View personal report card and grade details
 */

'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useStudentReportCard } from '@/lib/features/grades/hooks';
import { StudentReportCard } from '@/lib/features/grades/components/StudentReportCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Award } from 'lucide-react';

export default function StudentGradesPage() {
  const { user } = useAuthStore();
  const [selectedQuarter, setSelectedQuarter] = useState(1);

  const studentId = user?.student_profile?.id;
  const studentName = user?.full_name;

  const { data: reportCard, isLoading } = useStudentReportCard(
    studentId!,
    selectedQuarter
  );

  const handleExport = () => {
    // TODO: Implement export to PDF
    console.log('Export report card');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Grades</h1>
          <p className="text-muted-foreground mt-1">
            View your academic performance and report card
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Quarter Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((quarter) => (
              <Button
                key={quarter}
                variant={selectedQuarter === quarter ? 'default' : 'outline'}
                onClick={() => setSelectedQuarter(quarter)}
              >
                Quarter {quarter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Card */}
      <StudentReportCard
        summaries={reportCard || []}
        studentName={studentName}
        quarter={selectedQuarter}
        isLoading={isLoading}
      />

      {/* Tips Card */}
      {!isLoading && reportCard && reportCard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportCard
              .filter((s) => s.average_score >= 90)
              .map((s) => (
                <div
                  key={s.subject_id}
                  className="flex items-center gap-2 text-sm text-green-600"
                >
                  <Award className="h-4 w-4" />
                  <span>
                    Excellent work in <strong>{s.subject_name}</strong>! Keep it up!
                  </span>
                </div>
              ))}

            {reportCard
              .filter((s) => s.average_score < 70)
              .map((s) => (
                <div
                  key={s.subject_id}
                  className="flex items-center gap-2 text-sm text-orange-600"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    Consider spending more time on <strong>{s.subject_name}</strong>
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
