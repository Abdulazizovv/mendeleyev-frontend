'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Users,
  MapPin,
  User,
  RefreshCw,
  AlertCircle,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { uz } from 'date-fns/locale';
import api from '@/lib/api/client';
import { schoolApi } from '@/lib/api';
import {
  useLessonInstances,
  useCompleteLesson,
  useCancelLesson,
  useGenerateLessons,
} from '@/lib/features/schedule/hooks';
import { formatDateForAPI } from '@/lib/features/schedule/utils/time';
import type { LessonInstance } from '@/types/academic';
import { GenerateLessonsDialog, type GenerateLessonsData } from '@/lib/features/schedule/components/GenerateLessonsDialog';

// ── helpers ────────────────────────────────────────────────────────────────────

const UZ_DAYS = [
  { short: 'Du', full: 'Dushanba' },
  { short: 'Se', full: 'Seshanba' },
  { short: 'Chor', full: 'Chorshanba' },
  { short: 'Pay', full: 'Payshanba' },
  { short: 'Ju', full: 'Juma' },
  { short: 'Shan', full: 'Shanba' },
  { short: 'Yak', full: 'Yakshanba' },
];

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

function getPreviousWeek(date: Date): Date { return addDays(date, -7); }
function getNextWeek(date: Date): Date { return addDays(date, 7); }

function statusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-50 border-green-200';
    case 'cancelled': return 'bg-red-50 border-red-200 opacity-70';
    default:          return 'bg-white border-gray-200';
  }
}

function statusBadge(status: string, display?: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700 border-0 text-xs">{display ?? 'Yakunlangan'}</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs">{display ?? 'Bekor qilindi'}</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{display ?? 'Rejalashtirilgan'}</Badge>;
  }
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const branchId     = currentBranch?.branch_id ?? '';
  const membershipId = (currentBranch as any)?.id as string | undefined;
  const userRole     = currentBranch?.role ?? '';
  const isAdmin      = ['branch_admin', 'super_admin'].includes(userRole);
  const isTeacher    = userRole === 'teacher';

  // ── week / date state ────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // ── filters ──────────────────────────────────────────────────────────────────
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ── lesson action dialogs ────────────────────────────────────────────────────
  const [selectedLesson, setSelectedLesson]   = useState<LessonInstance | null>(null);
  const [detailOpen,     setDetailOpen]       = useState(false);
  const [completeOpen,   setCompleteOpen]     = useState(false);
  const [cancelOpen,     setCancelOpen]       = useState(false);
  const [generateOpen,   setGenerateOpen]     = useState(false);
  const [generationResult, setGenerationResult] = useState<{ created: number; skipped: number; updated: number } | null>(null);

  // ── data fetching ─────────────────────────────────────────────────────────────
  const { data: currentTemplate, isLoading: templateLoading, error: templateError, refetch: refetchTemplate } = useQuery({
    queryKey: ['current-timetable', branchId],
    queryFn: () => api.get('/school/timetables/current/').then(r => r.data),
    enabled: !!branchId,
    retry: false,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes', branchId, 'active'],
    queryFn: () => schoolApi.getClassesPaginated(branchId, { is_active: true, page_size: 100, ordering: 'grade_level' }),
    enabled: !!branchId && isAdmin,
  });
  const classes = classesData?.results ?? [];

  const lessonFilters = useMemo(() => ({
    date_from: formatDateForAPI(weekStart),
    date_to:   formatDateForAPI(weekEnd),
    ...(isTeacher && membershipId ? { teacher_id: membershipId } : {}),
  }), [weekStart, weekEnd, isTeacher, membershipId]);

  const { data: lessonsData, isLoading: lessonsLoading, refetch } = useLessonInstances(branchId, lessonFilters);
  const allLessons = lessonsData?.results ?? [];

  // ── mutations ─────────────────────────────────────────────────────────────────
  const completeMutation = useCompleteLesson(branchId);
  const cancelMutation   = useCancelLesson(branchId);
  const generateMutation = useGenerateLessons(branchId);
  const createTemplateMutation = useMutation({
    mutationFn: () => api.post('/school/timetables/current/').then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['current-timetable', branchId] }); refetchTemplate(); toast.success('Jadval shabloni yaratildi'); },
    onError:    (e: any) => toast.error(e.response?.data?.error ?? 'Xatolik yuz berdi'),
  });

  // ── derived data ──────────────────────────────────────────────────────────────
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const dayLessons = useMemo(() => {
    let lessons = allLessons.filter(l => l.date === selectedDateStr);
    if (classFilter !== 'all') lessons = lessons.filter(l => l.class_id === classFilter);
    if (statusFilter !== 'all') lessons = lessons.filter(l => l.status === statusFilter);
    return lessons.sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  }, [allLessons, selectedDateStr, classFilter, statusFilter]);

  const weekStats = useMemo(() => ({
    total:     allLessons.length,
    completed: allLessons.filter(l => l.status === 'completed').length,
    cancelled: allLessons.filter(l => l.status === 'cancelled').length,
  }), [allLessons]);

  // Count lessons per day for the dots indicator
  const lessonCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    allLessons.forEach(l => { counts[l.date] = (counts[l.date] ?? 0) + 1; });
    return counts;
  }, [allLessons]);

  const goToToday = () => {
    const today = new Date();
    setWeekStart(getWeekStart(today));
    setSelectedDate(today);
  };

  const handleCompleteConfirm = () => {
    if (!selectedLesson) return;
    completeMutation.mutate(
      { id: String(selectedLesson.id), data: {} },
      { onSuccess: () => { setCompleteOpen(false); setDetailOpen(false); setSelectedLesson(null); } }
    );
  };

  const handleCancelConfirm = () => {
    if (!selectedLesson) return;
    cancelMutation.mutate(
      { id: String(selectedLesson.id) },
      { onSuccess: () => { setCancelOpen(false); setDetailOpen(false); setSelectedLesson(null); } }
    );
  };

  const handleGenerateSubmit = (data: GenerateLessonsData) => {
    generateMutation.mutate(data as any, {
      onSuccess: (resp: any) => {
        setGenerationResult({ created: resp?.created_count ?? 0, skipped: resp?.skipped_count ?? 0, updated: resp?.updated_count ?? 0 });
      },
    });
  };

  // ── guards ────────────────────────────────────────────────────────────────────
  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">Filial tanlanmagan</p>
      </div>
    );
  }

  if (templateLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // No template
  if (templateError || !currentTemplate) {
    const errData = (templateError as any)?.response?.data;
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dars Jadvali</h1>
          <p className="text-sm text-gray-500 mt-0.5">Haftalik darslar ro'yxati</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {errData?.error ?? 'Jadval shabloni topilmadi'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {isTeacher
                ? "Dars jadvali hali yaratilmagan. Administrator bilan bog'laning."
                : 'Darslarni ko\'rsatish uchun avval jadval shablonini yarating.'}
            </p>
            {errData?.quarter && (
              <p className="text-sm text-gray-500 mt-2">
                Joriy chorak: <span className="font-medium">{errData.quarter.name}</span>{' '}
                ({errData.quarter.start_date} – {errData.quarter.end_date})
              </p>
            )}
          </div>
          {isAdmin && (
            <Button
              onClick={() => createTemplateMutation.mutate()}
              disabled={createTemplateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createTemplateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Yaratilmoqda...</>
                : <><Plus className="w-4 h-4 mr-2" />Jadval shablonini yaratish</>}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Dars Jadvali</h1>
            {isTeacher && (
              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                <User className="w-3 h-3 mr-1" />
                O'qituvchi
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentTemplate.name} · {currentTemplate.academic_year_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Dars yaratish
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()} disabled={lessonsLoading}>
            <RefreshCw className={`w-4 h-4 ${lessonsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Week stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{weekStats.total}</p>
            <p className="text-xs text-gray-500">Jami darslar</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{weekStats.completed}</p>
            <p className="text-xs text-gray-500">Yakunlangan</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{weekStats.cancelled}</p>
            <p className="text-xs text-gray-500">Bekor qilindi</p>
          </div>
        </div>
      </div>

      {/* ── Week navigation + day tabs ── */}
      <div className="bg-white rounded-xl border border-gray-100">
        {/* Controls row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart(getPreviousWeek(weekStart))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 px-1 min-w-[160px] text-center">
              {format(weekStart, 'd MMM', { locale: uz })} – {format(weekEnd, 'd MMM yyyy', { locale: uz })}
            </span>
            <button
              onClick={() => setWeekStart(getNextWeek(weekStart))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={goToToday}>
            Bugun
          </Button>
        </div>

        {/* Day tabs */}
        <div className="flex overflow-x-auto">
          {weekDays.map((day, idx) => {
            const dateStr  = format(day, 'yyyy-MM-dd');
            const isSelected = isSameDay(day, selectedDate);
            const isToday    = isSameDay(day, new Date());
            const count      = lessonCountByDay[dateStr] ?? 0;
            const dayInfo    = UZ_DAYS[idx];

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={`flex-1 min-w-[80px] py-3 px-2 text-center border-b-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : isToday
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <p className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                  {dayInfo.short}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-blue-700' : isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </p>
                <p className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                  {format(day, 'MMM', { locale: uz })}
                </p>
                {count > 0 && (
                  <div className={`mt-1 mx-auto w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters (admin only) ── */}
      {isAdmin && classes.length > 0 && (
        <div className="flex gap-3">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="Barcha sinflar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha sinflar</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="Holati" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="planned">Rejalashtirilgan</SelectItem>
              <SelectItem value="completed">Yakunlangan</SelectItem>
              <SelectItem value="cancelled">Bekor qilindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Day lesson list ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">
            {format(selectedDate, 'dd MMMM, EEEE', { locale: uz })}
          </h2>
          <span className="text-sm text-gray-500">{dayLessons.length} ta dars</span>
        </div>

        {lessonsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : dayLessons.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Bu kun darslar yo'q</p>
            <p className="text-gray-400 text-xs">
              {isAdmin ? 'Dars yaratish uchun "Dars yaratish" tugmasini bosing' : 'Hozircha dars rejalashtirilmagan'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayLessons.map(lesson => (
              <button
                key={lesson.id}
                onClick={() => { setSelectedLesson(lesson); setDetailOpen(true); }}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${statusColor(lesson.status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Time */}
                    <div className="shrink-0 text-center w-14">
                      <p className="text-sm font-bold text-gray-900">{lesson.start_time?.substring(0, 5) ?? '--:--'}</p>
                      <p className="text-xs text-gray-400">{lesson.end_time?.substring(0, 5) ?? '--:--'}</p>
                      <p className="text-xs text-gray-400 mt-1">{lesson.lesson_number}-dars</p>
                    </div>

                    {/* Divider */}
                    <div className={`w-0.5 self-stretch rounded-full shrink-0 ${
                      lesson.status === 'completed' ? 'bg-green-400' :
                      lesson.status === 'cancelled' ? 'bg-red-300' : 'bg-blue-400'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {lesson.subject_name ?? 'Fan noma\'lum'}
                        </span>
                        {statusBadge(lesson.status, (lesson as any).status_display)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {lesson.class_name && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            {lesson.class_name}
                          </span>
                        )}
                        {lesson.teacher_name && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            {lesson.teacher_name}
                          </span>
                        )}
                        {lesson.room_name && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {lesson.room_name}
                          </span>
                        )}
                        {(lesson as any).topic_title && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <BookOpen className="w-3 h-3" />
                            {(lesson as any).topic_title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lesson Detail Dialog ── */}
      {selectedLesson && (
        <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelectedLesson(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLesson.subject_name ?? 'Dars'}</DialogTitle>
              <DialogDescription>
                {selectedLesson.date} · {selectedLesson.start_time?.substring(0, 5)} – {selectedLesson.end_time?.substring(0, 5)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {[
                { icon: Clock, label: 'Vaqt', value: `${selectedLesson.lesson_number}-dars · ${selectedLesson.start_time?.substring(0, 5)} – ${selectedLesson.end_time?.substring(0, 5)}` },
                { icon: Users, label: 'Sinf', value: selectedLesson.class_name },
                { icon: User, label: "O'qituvchi", value: selectedLesson.teacher_name },
                { icon: MapPin, label: 'Xona', value: selectedLesson.room_name },
                { icon: BookOpen, label: 'Mavzu', value: (selectedLesson as any).topic_title },
              ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-400">Holati:</span>
                {statusBadge(selectedLesson.status, (selectedLesson as any).status_display)}
              </div>
              {selectedLesson.teacher_notes && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {selectedLesson.teacher_notes}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {/* Teachers & admins can complete */}
              {(isTeacher || isAdmin) && selectedLesson.status === 'planned' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={() => { setDetailOpen(false); setCompleteOpen(true); }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Yakunlash
                </Button>
              )}
              {/* Only admins can cancel */}
              {isAdmin && selectedLesson.status === 'planned' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border-red-200 flex-1"
                  onClick={() => { setDetailOpen(false); setCancelOpen(true); }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Bekor qilish
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setDetailOpen(false)}>Yopish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Complete Dialog ── */}
      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni yakunlash</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLesson?.subject_name} darsi yakunlangan deb belgilanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteConfirm}
              disabled={completeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yakunlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel Dialog ── */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni bekor qilish</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLesson?.subject_name} darsi bekor qilinadi. Davom etasizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Yo'q</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Bekor qilish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Generate Lessons Dialog ── */}
      {currentTemplate && isAdmin && (
        <GenerateLessonsDialog
          open={generateOpen}
          onOpenChange={(o) => { if (!o) { setGenerateOpen(false); setGenerationResult(null); } else setGenerateOpen(true); }}
          currentTemplateId={currentTemplate.id}
          currentTemplateName={`${currentTemplate.name} – ${currentTemplate.academic_year_name}`}
          onSubmit={handleGenerateSubmit}
          isGenerating={generateMutation.isPending}
          generationResult={generationResult}
        />
      )}
    </div>
  );
}
