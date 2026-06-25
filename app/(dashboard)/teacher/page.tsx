"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api";
import { useLessonInstances } from "@/lib/features/schedule/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, BookOpen, Calendar, Wallet,
  ChevronRight, ClipboardList, GraduationCap,
  CheckCircle2, AlertCircle, MapPin, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/translations";
import { format, addDays, startOfWeek } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ── Colour helpers ────────────────────────────────────────────────────────────

const COLORS = [
  'border-l-blue-400 bg-blue-50/80',
  'border-l-emerald-400 bg-emerald-50/80',
  'border-l-violet-400 bg-violet-50/80',
  'border-l-rose-400 bg-rose-50/80',
  'border-l-amber-400 bg-amber-50/80',
  'border-l-cyan-400 bg-cyan-50/80',
  'border-l-orange-400 bg-orange-50/80',
  'border-l-teal-400 bg-teal-50/80',
];
function subjectColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

// ── Day constants ─────────────────────────────────────────────────────────────

const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday'] as const;
const DAY_SHORT = ['Du','Se','Cho','Pay','Ju','Shan'];
const DAY_FULL  = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];

// ── Main component ────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user, currentBranch } = useAuth();
  const branchId     = currentBranch?.branch_id ?? "";
  const membershipId = currentBranch?.id ?? "";

  // ── Week / day state ────────────────────────────────────────────────────────
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const [dayIdx, setDayIdx] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 5 : Math.min(d - 1, 5);
  });

  const weekDays        = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const selectedDateStr = format(weekDays[dayIdx], 'yyyy-MM-dd');
  const todayStr        = format(new Date(), 'yyyy-MM-dd');
  const isToday         = selectedDateStr === todayStr;

  // ── Data fetches ────────────────────────────────────────────────────────────
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ["teacher-subjects", branchId],
    queryFn: () => schoolApi.getTeacherSubjects({ branch_id: branchId, is_active: true }),
    enabled: !!branchId,
  });

  // Selected day's lessons
  const { data: lessonsData, isLoading: lessonsLoading } = useLessonInstances(branchId, {
    date_from:  selectedDateStr,
    date_to:    selectedDateStr,
    teacher_id: membershipId,
  });

  // Week lessons (for day badge counts)
  const { data: weekLessonsData } = useLessonInstances(branchId, {
    date_from:  format(weekStart, 'yyyy-MM-dd'),
    date_to:    format(addDays(weekStart, 5), 'yyyy-MM-dd'),
    teacher_id: membershipId,
  });

  const subjects = Array.isArray(subjectsData) ? subjectsData : (subjectsData as any)?.results ?? [];
  const lessons  = lessonsData?.results ?? [];

  const balance = currentBranch?.balance;
  const salary  = currentBranch?.salary;

  // Sorted lessons for selected day
  const sortedLessons = useMemo(() =>
    [...lessons].sort((a, b) =>
      (a.lesson_number ?? 99) - (b.lesson_number ?? 99) ||
      (a.start_time ?? '').localeCompare(b.start_time ?? '')
    ), [lessons]);

  // Day badge counts
  const dayLessonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DAY_KEYS.forEach(k => { counts[k] = 0; });
    (weekLessonsData?.results ?? []).forEach(l => {
      if (!l.date) return;
      const d = new Date(l.date).getDay();
      const key = DAY_KEYS[d === 0 ? 5 : Math.min(d - 1, 5)];
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [weekLessonsData]);

  const completedCount  = lessons.filter((l: any) => l.status === 'completed').length;
  const inProgressCount = lessons.filter((l: any) => l.status === 'in_progress').length;

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xush kelibsiz, {user?.first_name || user?.phone_number}!
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{currentBranch?.title ?? "O'qituvchi"}</p>
      </div>

      {/* ── Jadval widget ─────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden shadow-sm border border-gray-100">
        <CardHeader className="pb-0 pt-4 px-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Dars jadvalim
              {isToday && inProgressCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-normal text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {inProgressCount} ta davom etmoqda
                </span>
              )}
            </CardTitle>
            <Link href="/teacher/schedule" className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0">
              To'liq jadval <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Day tabs */}
          <div className="grid grid-cols-6 gap-1 pb-0">
            {DAY_KEYS.map((key, idx) => {
              const day        = weekDays[idx];
              const isSelected = idx === dayIdx;
              const isTodayTab = format(day, 'yyyy-MM-dd') === todayStr;
              const count      = dayLessonCounts[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setDayIdx(idx)}
                  className={cn(
                    'relative flex flex-col items-center py-2.5 rounded-xl transition-all border-b-[3px]',
                    'hover:bg-gray-50 focus-visible:outline-none',
                    isSelected      ? 'border-blue-600 bg-blue-50/60'  :
                    isTodayTab      ? 'border-blue-200 bg-blue-50/30'  :
                                      'border-transparent'
                  )}
                >
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider', isSelected ? 'text-blue-600' : isTodayTab ? 'text-blue-500' : 'text-gray-400')}>
                    {DAY_SHORT[idx]}
                  </span>
                  <span className={cn('text-lg font-bold leading-tight tabular-nums', isSelected ? 'text-blue-700' : isTodayTab ? 'text-blue-600' : 'text-gray-800')}>
                    {format(day, 'd')}
                  </span>
                  <span className={cn('text-[10px]', isSelected ? 'text-blue-400' : 'text-gray-400')}>
                    {format(day, 'MMM', { locale: uz })}
                  </span>
                  {count > 0 && (
                    <span className={cn('mt-0.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center px-1', isSelected ? 'bg-blue-600 text-white' : isTodayTab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>
                      {count}
                    </span>
                  )}
                  {isTodayTab && !isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-3">
          {/* Day label */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{DAY_FULL[dayIdx]}, {format(weekDays[dayIdx], 'd MMMM', { locale: uz })}</span>
            {isToday && <span className="flex items-center gap-1 text-red-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Bugun</span>}
            {!lessonsLoading && lessons.length > 0 && (
              <span className="ml-auto text-gray-400">{lessons.length} ta dars · {completedCount} tugallandi</span>
            )}
          </div>

          {/* Lessons */}
          {lessonsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : sortedLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Bu kunda dars yo'q</p>
              <Link href="/teacher/schedule" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                Haftalik jadvalni ko'rish →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLessons.map(lesson => {
                const isCancelled = lesson.status === 'cancelled' || lesson.status === 'canceled';
                const isLive      = lesson.status === 'in_progress';
                const isDone      = lesson.status === 'completed';
                const colorCls    = subjectColor(lesson.subject_name ?? '');

                return (
                  <Link
                    key={lesson.id}
                    href={`/teacher/schedule/lessons/${lesson.id}`}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 transition-all hover:shadow-sm hover:brightness-95 cursor-pointer',
                      isCancelled ? 'border-l-red-300 bg-red-50/50 opacity-60' :
                      isLive      ? cn(colorCls, 'ring-1 ring-blue-200 shadow-sm') :
                      isDone      ? cn(colorCls, 'opacity-65') :
                                    colorCls
                    )}
                  >
                    {/* Lesson number */}
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isLive ? 'bg-blue-600 text-white' :
                      isDone ? 'bg-gray-200 text-gray-500' :
                               'bg-white/80 text-gray-600 border border-gray-200'
                    )}>
                      {lesson.lesson_number ?? '—'}
                    </div>

                    {/* Time */}
                    <span className="text-[11px] font-mono text-gray-400 w-[68px] shrink-0">
                      {lesson.start_time?.substring(0,5) && lesson.end_time?.substring(0,5)
                        ? `${lesson.start_time.substring(0,5)} – ${lesson.end_time.substring(0,5)}`
                        : '—'}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {lesson.subject_name ?? lesson.group_name ?? 'Dars'}
                      </p>
                      <div className="flex flex-wrap gap-x-2 mt-0.5">
                        {lesson.class_name && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <GraduationCap className="w-2.5 h-2.5" /> {lesson.class_name}
                          </span>
                        )}
                        {lesson.room_name && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {lesson.room_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isLive && (
                        <span className="text-[9px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Davom
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[9px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">✓ Tugadi</span>
                      )}
                      {isCancelled && (
                        <span className="text-[9px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold">Bekor</span>
                      )}
                      {lesson.attendance_count != null && lesson.attendance_count > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Users className="w-3 h-3" /> {lesson.attendance_count}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moliya va Fanlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Moliya */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" /> Moliyaviy holat
              </CardTitle>
              <Link href="/teacher/finance" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                Batafsil <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {salary != null && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Oylik maosh</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(salary)}</p>
                </div>
                <ClipboardList className="w-7 h-7 text-blue-300" />
              </div>
            )}
            {balance != null && (
              <div className={`flex items-center justify-between p-3 rounded-xl ${balance >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <div>
                  <p className="text-xs text-gray-500">Balans</p>
                  <p className={`text-lg font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                  </p>
                </div>
                {balance >= 0
                  ? <CheckCircle2 className="w-7 h-7 text-green-300" />
                  : <AlertCircle  className="w-7 h-7 text-red-300"   />
                }
              </div>
            )}
            {salary == null && balance == null && (
              <p className="text-sm text-gray-400 text-center py-4">Moliyaviy ma'lumot mavjud emas</p>
            )}
          </CardContent>
        </Card>

        {/* Fanlar */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" /> Mening fanlarim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}</div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <BookOpen className="w-9 h-9 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Fan biriktirilmagan</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {subjects.slice(0, 6).map((sub: any) => (
                  <div key={sub.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-purple-50 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{sub.subject_name}</p>
                      <p className="text-xs text-gray-400 truncate">{sub.class_name}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{sub.students_count} o'q</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
