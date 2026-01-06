/**
 * Weekly Schedule View - Professional Edition
 * Branch Admin can view, add, edit, and generate lessons
 * Full Uzbek localization with real-time features
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  Edit,
  Sparkles,
} from 'lucide-react';
import { WeeklyTimetableGrid } from '@/lib/features/schedule/components/WeeklyTimetableGrid';
import { CurrentTimeDisplay } from '@/lib/features/schedule/components/CurrentTimeDisplay';
import { LessonDetailModal } from '@/lib/features/schedule/components/LessonDetailModal';
import { DeleteLessonDialog } from '@/lib/features/schedule/components/DeleteLessonDialog';
import { AddLessonDialog, type AddLessonData } from '@/lib/features/schedule/components/AddLessonDialog';
import { GenerateLessonsDialog, type GenerateLessonsData } from '@/lib/features/schedule/components/GenerateLessonsDialog';
import { useLessonInstances } from '@/lib/features/schedule/hooks';
import {
  getWeekStart,
  getPreviousWeek,
  getNextWeek,
  formatDateForAPI,
} from '@/lib/features/schedule/utils/time';
import { addDays, format } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { LessonInstance } from '@/types/academic';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { SCHEDULE_TRANSLATIONS, formatDateUz } from '@/lib/features/schedule/constants/translations';

export default function BranchAdminSchedulePage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  
  // State for week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );

  // State for modals
  const [selectedLesson, setSelectedLesson] = useState<LessonInstance | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<LessonInstance | null>(null);
  const [addLessonDialogOpen, setAddLessonDialogOpen] = useState(false);
  const [addLessonContext, setAddLessonContext] = useState<{ date: Date; lessonNumber: number } | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generationResult, setGenerationResult] = useState<{ created: number; skipped: number; updated: number } | null>(null);

  const branchId = currentBranch?.branch_id;

  // Calculate week date range
  const weekEnd = useMemo(() => addDays(currentWeekStart, 5), [currentWeekStart]); // Saturday

  // Fetch lessons for the week
  const {
    data: lessonsData,
    isLoading,
    refetch,
  } = useLessonInstances(branchId || '', {
    date_from: formatDateForAPI(currentWeekStart),
    date_to: formatDateForAPI(weekEnd),
  });

  const lessons = lessonsData?.results || [];

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeekStart(getPreviousWeek(currentWeekStart));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(getNextWeek(currentWeekStart));
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleEditSchedule = () => {
    router.push('/branch-admin/schedule/edit');
  };

  // Lesson interaction handlers
  const handleLessonClick = (lesson: LessonInstance) => {
    setSelectedLesson(lesson);
    setDetailModalOpen(true);
  };

  const handleLessonDelete = (lesson: LessonInstance) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    toast.success(SCHEDULE_TRANSLATIONS.toasts.refreshed);
  };

  // Add lesson handler
  const handleAddLesson = (date: Date, lessonNumber: number) => {
    setAddLessonContext({ date, lessonNumber });
    setAddLessonDialogOpen(true);
  };

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: AddLessonData) => {
      const response = await api.post('/api/v1/school/lessons/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-instances', branchId] });
      setAddLessonDialogOpen(false);
      setAddLessonContext(null);
      toast.success(SCHEDULE_TRANSLATIONS.toasts.lessonAdded);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || SCHEDULE_TRANSLATIONS.toasts.error;
      toast.error(message);
    },
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await api.delete(`/api/v1/school/lessons/${lessonId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-instances', branchId] });
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
      setDetailModalOpen(false);
      toast.success(SCHEDULE_TRANSLATIONS.toasts.lessonDeleted);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || SCHEDULE_TRANSLATIONS.toasts.error;
      toast.error(message);
    },
  });

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await api.patch(`/api/v1/school/lessons/${lessonId}/`, {
        status: 'completed',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-instances', branchId] });
      setDetailModalOpen(false);
      setSelectedLesson(null);
      toast.success(SCHEDULE_TRANSLATIONS.toasts.lessonCompleted);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || SCHEDULE_TRANSLATIONS.toasts.error;
      toast.error(message);
    },
  });

  // Generate lessons mutation
  const generateLessonsMutation = useMutation({
    mutationFn: async (data: GenerateLessonsData) => {
      const response = await api.post('/api/v1/school/lessons/generate/', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-instances', branchId] });
      setGenerationResult({
        created: data.created || 0,
        skipped: data.skipped || 0,
        updated: data.updated || 0,
      });
      toast.success(SCHEDULE_TRANSLATIONS.toasts.lessonsGenerated);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || SCHEDULE_TRANSLATIONS.toasts.error;
      toast.error(message);
      setGenerateDialogOpen(false);
    },
  });

  // Handler functions
  const handleSubmitAddLesson = (data: AddLessonData) => {
    createLessonMutation.mutate(data);
  };

  const handleConfirmDelete = () => {
    if (lessonToDelete) {
      // Convert string ID to number if needed
      const lessonId = typeof lessonToDelete.id === 'string' 
        ? parseInt(lessonToDelete.id, 10) 
        : lessonToDelete.id;
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleCompleteLesson = (lesson: LessonInstance) => {
    // Convert string ID to number if needed
    const lessonId = typeof lesson.id === 'string' 
      ? parseInt(lesson.id, 10) 
      : lesson.id;
    completeLessonMutation.mutate(lessonId);
  };

  const handleSubmitGenerate = (data: GenerateLessonsData) => {
    generateLessonsMutation.mutate(data);
  };

  const handleCloseGenerateDialog = () => {
    setGenerateDialogOpen(false);
    setGenerationResult(null);
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">{SCHEDULE_TRANSLATIONS.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Real-Time Clock */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{SCHEDULE_TRANSLATIONS.title}</h1>
          <p className="text-muted-foreground mt-2">
            {SCHEDULE_TRANSLATIONS.description}
          </p>
        </div>

        <CurrentTimeDisplay />
      </div>

      {/* Controls Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {formatDateUz(currentWeekStart)} - {formatDateUz(weekEnd)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {lessons.length} {SCHEDULE_TRANSLATIONS.lessonsCount}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Generate Button */}
              <Button 
                onClick={() => setGenerateDialogOpen(true)} 
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {SCHEDULE_TRANSLATIONS.generateLessons}
              </Button>

              {/* Edit Schedule Button */}
              <Button onClick={handleEditSchedule} variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                {SCHEDULE_TRANSLATIONS.editSchedule}
              </Button>

              {/* Today Button */}
              <Button variant="outline" size="sm" onClick={handleToday}>
                {SCHEDULE_TRANSLATIONS.today}
              </Button>

              {/* Navigation */}
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousWeek}
                  className="h-9 w-9"
                  title={SCHEDULE_TRANSLATIONS.previousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextWeek}
                  className="h-9 w-9"
                  title={SCHEDULE_TRANSLATIONS.nextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                title={SCHEDULE_TRANSLATIONS.refresh}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <WeeklyTimetableGrid
              lessons={lessons}
              weekStart={currentWeekStart}
              onLessonClick={handleLessonClick}
              onLessonDelete={handleLessonDelete}
              onAddLesson={handleAddLesson}
            />
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {!isLoading && lessons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {lessons.filter((l) => l.status === 'planned').length}
              </div>
              <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.statuses.planned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {lessons.filter((l) => l.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.statuses.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {lessons.filter((l) => l.status === 'cancelled').length}
              </div>
              <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.statuses.cancelled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(lessons.map((l) => l.class_id)).size}
              </div>
              <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.classesCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        lesson={selectedLesson}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedLesson(null);
        }}
        onDelete={handleLessonDelete}
        onComplete={handleCompleteLesson}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteLessonDialog
        lesson={lessonToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteLessonMutation.isPending}
      />

      {/* Add Lesson Dialog */}
      {addLessonContext && branchId && (
        <AddLessonDialog
          open={addLessonDialogOpen}
          onOpenChange={setAddLessonDialogOpen}
          date={addLessonContext.date}
          lessonNumber={addLessonContext.lessonNumber}
          branchId={branchId}
          onSubmit={handleSubmitAddLesson}
          isSubmitting={createLessonMutation.isPending}
        />
      )}

      {/* Generate Lessons Dialog */}
      {branchId && (
        <GenerateLessonsDialog
          open={generateDialogOpen}
          onOpenChange={handleCloseGenerateDialog}
          branchId={parseInt(branchId, 10)}
          onSubmit={handleSubmitGenerate}
          isGenerating={generateLessonsMutation.isPending}
          generationResult={generationResult}
        />
      )}
    </div>
  );
}
