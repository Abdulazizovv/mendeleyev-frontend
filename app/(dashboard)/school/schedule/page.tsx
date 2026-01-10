/**
 * Weekly Schedule View - Professional Edition
 * Branch Admin can view, add, edit, and generate lessons
 * Full Uzbek localization with real-time features
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { ModernTimetableGrid } from '@/lib/features/schedule/components/ModernTimetableGrid';
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
import { branchApi, schoolApi } from '@/lib/api';
import { SCHEDULE_TRANSLATIONS, formatDateUz } from '@/lib/features/schedule/constants/translations';

export default function BranchAdminSchedulePage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  
  // State for week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  
  // State for selected day (default to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Keep selectedDate within current week range when navigation changes
  useEffect(() => {
    const weekEnd = addDays(currentWeekStart, 5);
    if (selectedDate < currentWeekStart || selectedDate > weekEnd) {
      setSelectedDate(currentWeekStart);
    }
  }, [currentWeekStart, selectedDate]);

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

  // Fetch branch settings
  const {
    data: branchSettings,
    isLoading: isSettingsLoading,
  } = useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn: async () => {
      if (!branchId) throw new Error('No branch ID');
      return await branchApi.getBranchSettings(branchId);
    },
    enabled: !!branchId,
  });

  // Fetch classes
  const {
    data: classesData,
    isLoading: isClassesLoading,
  } = useQuery({
    queryKey: ['classes', branchId],
    queryFn: async () => {
      if (!branchId) throw new Error('No branch ID');
      return await schoolApi.getClassesPaginated(branchId, {
        is_active: true,
        page_size: 100,
      });
    },
    enabled: !!branchId,
  });

  const classes = classesData?.results || [];

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
  const handleAddLesson = (date: Date, timeSlot: string) => {
    setAddLessonContext({ date, lessonNumber: 1 }); // We'll fix this in the dialog
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
  if (isTemplateLoading || isSettingsLoading || isClassesLoading) {
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
  if (templateError || !currentTemplate || !branchSettings) {
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {SCHEDULE_TRANSLATIONS.title}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <p className="text-sm">
              {currentTemplate.name} • {currentTemplate.academic_year_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CurrentTimeDisplay />
        </div>
      </div>

      {/* Template Info Banner - Enhanced */}
      <Alert className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900 font-bold">Aktiv jadval shabloni</AlertTitle>
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">{currentTemplate.name}</span>
              </div>
              <div className="h-4 w-px bg-blue-300" />
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDateUz(new Date(currentTemplate.effective_from))} - {formatDateUz(new Date(currentTemplate.effective_until))}</span>
              </div>
              {currentTemplate.slots_count !== undefined && (
                <>
                  <div className="h-4 w-px bg-blue-300" />
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>{currentTemplate.slots_count} ta dars slot</span>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/branch-admin/schedule/edit')}
              className="gap-2 bg-white hover:bg-blue-50 border-blue-300 hover:border-blue-400"
            >
              <Settings className="h-4 w-4" />
              Tahrirlash
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Controls Card - Enhanced with better styling */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <span className="font-bold">{formatDateUz(currentWeekStart)} - {formatDateUz(weekEnd)}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  <BookOpen className="h-3 w-3" />
                  {lessons.length} {SCHEDULE_TRANSLATIONS.lessonsCount}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Generate Button - Highlighted */}
              <Button 
                onClick={() => setGenerateDialogOpen(true)} 
                variant="default"
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                {SCHEDULE_TRANSLATIONS.generateLessons}
              </Button>

              {/* Edit Schedule Button */}
              <Button onClick={handleEditSchedule} variant="outline" className="gap-2 border-2 hover:border-blue-400">
                <Edit className="h-4 w-4" />
                {SCHEDULE_TRANSLATIONS.editSchedule}
              </Button>

              {/* Today Button */}
              <Button variant="outline" size="sm" onClick={handleToday} className="border-2 hover:border-green-400">
                {SCHEDULE_TRANSLATIONS.today}
              </Button>

              {/* Navigation */}
              <div className="flex items-center gap-1 border-2 border-gray-200 rounded-md hover:border-blue-300 transition-colors">
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
                className="border-2 hover:border-blue-400"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timetable Grid - Enhanced Card */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <ModernTimetableGrid
              lessons={lessons}
              weekStart={currentWeekStart}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onLessonClick={handleLessonClick}
              onLessonDelete={handleLessonDelete}
              onAddLesson={handleAddLesson}
              branchSettings={branchSettings}
              classes={classes}
            />
          )}
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      {!isLoading && lessons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Total Lessons */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {lessons.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Jami darslar</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Planned */}
          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {lessons.filter((l) => l.status === 'planned').length}
                  </div>
                  <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.statuses.planned}</div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Completed */}
          <Card className="border-2 hover:border-green-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {lessons.filter((l) => l.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.statuses.completed}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Cancelled */}
          <Card className="border-2 hover:border-red-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {lessons.filter((l) => l.status === 'cancelled').length}
                  </div>
                  <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.statuses.cancelled}</div>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Classes Count */}
          <Card className="border-2 hover:border-indigo-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {new Set(lessons.map((l) => l.class_id)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">{SCHEDULE_TRANSLATIONS.classesCount}</div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Teachers Count */}
          <Card className="border-2 hover:border-cyan-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-cyan-600">
                    {new Set(lessons.map((l) => l.teacher_id).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">O'qituvchilar</div>
                </div>
                <div className="p-3 bg-cyan-100 rounded-full">
                  <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Week Progress Bar */}
      {!isLoading && lessons.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Haftalik Progress</h3>
                <span className="text-sm text-gray-600">
                  {lessons.filter((l) => l.status === 'completed').length} / {lessons.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${lessons.length > 0 ? (lessons.filter((l) => l.status === 'completed').length / lessons.length * 100) : 0}%` 
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {lessons.length > 0 
                    ? Math.round((lessons.filter((l) => l.status === 'completed').length / lessons.length) * 100) 
                    : 0}% bajarildi
                </span>
                <span>
                  {lessons.filter((l) => l.status === 'planned').length} ta dars qoldi
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
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
