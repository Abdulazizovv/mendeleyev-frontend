/**
 * Weekly Schedule View - Professional Edition
 * Branch Admin can view, add, edit, and generate lessons
 * Full Uzbek localization with real-time features
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  Edit,
  Sparkles,
  AlertCircle,
  Settings,
  Plus,
  BookOpen,
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
import type { LessonInstance, TimetableTemplate, CurrentTimetableResponse } from '@/types/academic';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

  // Fetch current timetable template
  const {
    data: currentTemplate,
    isLoading: isTemplateLoading,
    error: templateError,
    refetch: refetchTemplate,
  } = useQuery<TimetableTemplate, CurrentTimetableResponse>({
    queryKey: ['current-timetable', branchId],
    queryFn: async () => {
      const response = await api.get('/school/timetables/current/');
      return response.data;
    },
    enabled: !!branchId,
    retry: false,
  });

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
      const response = await api.post(`/school/branches/${branchId}/lessons/`, data);
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
      await api.delete(`/school/lessons/${lessonId}/`);
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
      const response = await api.patch(`/school/lessons/${lessonId}/`, {
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
      if (!branchId) {
        throw new Error('Branch ID not found');
      }
      const response = await api.post(`/school/branches/${branchId}/lessons/generate/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-instances', branchId] });
      setGenerationResult({
        created: data.created_count || 0,
        skipped: data.skipped_count || 0,
        updated: data.updated_count || 0,
      });
      toast.success(SCHEDULE_TRANSLATIONS.toasts.lessonsGenerated);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || SCHEDULE_TRANSLATIONS.toasts.error;
      toast.error(message);
      setGenerateDialogOpen(false);
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/school/timetables/current/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-timetable', branchId] });
      refetchTemplate();
      toast.success('Jadval shabloni muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.detail || 'Shablon yaratishda xatolik';
      toast.error(message);
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

  // Show loading state
  if (isTemplateLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if template fetch failed
  if (templateError || !currentTemplate) {
    const errorData = (templateError as any)?.response?.data as CurrentTimetableResponse;
    
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{SCHEDULE_TRANSLATIONS.title}</h1>
            <p className="text-muted-foreground mt-2">
              {SCHEDULE_TRANSLATIONS.description}
            </p>
          </div>
          <CurrentTimeDisplay />
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-amber-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-amber-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {errorData?.error || 'Jadval shabloni topilmadi'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Dars jadvali ko'rsatish uchun avval jadval shablonini yaratishingiz kerak.
                  {errorData?.quarter && (
                    <span className="block mt-2 text-sm">
                      Joriy chorak: <span className="font-semibold">{errorData.quarter.name}</span>
                      {' '}({formatDateUz(new Date(errorData.quarter.start_date))} - {formatDateUz(new Date(errorData.quarter.end_date))})
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={() => createTemplateMutation.mutate()}
                  disabled={createTemplateMutation.isPending}
                  className="gap-2"
                >
                  {createTemplateMutation.isPending ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Yaratilmoqda...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Jadval shablonini yaratish
                    </>
                  )}
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/branch-admin/schedule/edit')}
                  className="gap-2"
                >
                  <Settings className="h-5 w-5" />
                  Sozlamalar
                </Button>
              </div>

              {errorData?.quarter && (
                <Alert className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ma'lumot</AlertTitle>
                  <AlertDescription>
                    Shablon yaratilgandan so'ng, siz darslarni qo'lda qo'shishingiz yoki
                    ommaviy generatsiya qilishingiz mumkin.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Real-Time Clock and Template Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{SCHEDULE_TRANSLATIONS.title}</h1>
          <p className="text-muted-foreground mt-2">
            {currentTemplate.name} • {currentTemplate.academic_year_name}
          </p>
        </div>

        <CurrentTimeDisplay />
      </div>

      {/* Template Info Banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <BookOpen className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Aktiv jadval</AlertTitle>
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{currentTemplate.name}</span>
              <span className="mx-2">•</span>
              <span>{formatDateUz(new Date(currentTemplate.effective_from))} - {formatDateUz(new Date(currentTemplate.effective_until))}</span>
              {currentTemplate.slots_count !== undefined && (
                <>
                  <span className="mx-2">•</span>
                  <span>{currentTemplate.slots_count} ta dars slot</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/branch-admin/schedule/edit')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Tahrirlash
            </Button>
          </div>
        </AlertDescription>
      </Alert>

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
      {currentTemplate && (
        <GenerateLessonsDialog
          open={generateDialogOpen}
          onOpenChange={handleCloseGenerateDialog}
          currentTemplateId={currentTemplate.id}
          currentTemplateName={`${currentTemplate.name} - ${currentTemplate.academic_year_name}`}
          onSubmit={handleSubmitGenerate}
          isGenerating={generateLessonsMutation.isPending}
          generationResult={generationResult}
        />
      )}
    </div>
  );
}
