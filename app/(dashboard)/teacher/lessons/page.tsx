/**
 * Teacher Lessons Page
 * View and manage lessons with completion/cancellation actions
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLessonInstances, useCompleteLesson, useCancelLesson } from '@/lib/features/schedule/hooks';
import { LessonList } from '@/lib/features/schedule/components/LessonList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Calendar } from 'lucide-react';
import type { LessonInstance } from '@/types/academic';

export default function TeacherLessonsPage() {
  const router = useRouter();
  const [selectedLesson, setSelectedLesson] = useState<LessonInstance | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Get today and 30 days ahead
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: lessonsResponse, isLoading } = useLessonInstances({
    date_from: today,
    date_to: futureDate,
  });

  const completeLesson = useCompleteLesson();
  const cancelLesson = useCancelLesson();

  const handleLessonClick = (lesson: LessonInstance) => {
    router.push(`/teacher/lessons/${lesson.id}`);
  };

  const handleCompleteClick = (lesson: LessonInstance) => {
    setSelectedLesson(lesson);
    setNotes('');
    setCompleteDialogOpen(true);
  };

  const handleCancelClick = (lesson: LessonInstance) => {
    setSelectedLesson(lesson);
    setNotes('');
    setCancelDialogOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedLesson) return;

    await completeLesson.mutateAsync({
      id: selectedLesson.id,
      data: { notes },
    });

    setCompleteDialogOpen(false);
    setSelectedLesson(null);
    setNotes('');
  };

  const handleCancelConfirm = async () => {
    if (!selectedLesson) return;

    await cancelLesson.mutateAsync({
      id: selectedLesson.id,
      reason: notes,
    });

    setCancelDialogOpen(false);
    setSelectedLesson(null);
    setNotes('');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Lessons</h1>
          <p className="text-muted-foreground mt-1">
            Manage your upcoming and past lessons
          </p>
        </div>
        <Button onClick={() => router.push('/teacher/lessons/generate')}>
          <Calendar className="h-4 w-4 mr-2" />
          Generate Lessons
        </Button>
      </div>

      {/* Lessons List */}
      <LessonList
        lessons={lessonsResponse?.results || []}
        isLoading={isLoading}
        onLessonClick={handleLessonClick}
        onComplete={handleCompleteClick}
        onCancel={handleCancelClick}
        canComplete={true}
        canCancel={true}
      />

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedLesson?.subject_name} - {selectedLesson?.class_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedLesson?.date} at {selectedLesson?.start_time}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the lesson..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteConfirm}
              disabled={completeLesson.isPending}
            >
              {completeLesson.isPending ? 'Completing...' : 'Complete Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedLesson?.subject_name} - {selectedLesson?.class_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedLesson?.date} at {selectedLesson?.start_time}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Why is this lesson being cancelled?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelLesson.isPending}
            >
              {cancelLesson.isPending ? 'Cancelling...' : 'Cancel Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
