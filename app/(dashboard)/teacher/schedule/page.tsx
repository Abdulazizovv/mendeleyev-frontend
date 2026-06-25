'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  UtensilsCrossed,
  MapPin,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfWeek } from 'date-fns';
import { uz } from 'date-fns/locale';
import { parse, addMinutes, format as fmtDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { branchApi } from '@/lib/api';
import { useLessonInstances } from '@/lib/features/schedule/hooks';
import type { LessonInstance } from '@/types/academic';
import type { BranchSettings } from '@/types/school';

// ── Constants ──────────────────────────────────────────────────────────────────

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayKey = typeof DAY_KEYS[number];
const DAY_SHORT = ['Du', 'Se', 'Cho', 'Pay', 'Ju', 'Shan'];
const DAY_FULL  = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

// ── Time helpers ───────────────────────────────────────────────────────────────

interface TimeSlot { lesson_number: number; start_time: string; end_time: string; }

function computeTimeSlots(s: BranchSettings): TimeSlot[] {
  const result: TimeSlot[] = [];
  const startRaw = s.daily_lesson_start_time || s.school_start_time;
  const endRaw   = s.daily_lesson_end_time   || s.school_end_time;
  const start  = parse(startRaw.substring(0, 5), 'HH:mm', new Date());
  const end    = parse(endRaw.substring(0, 5),   'HH:mm', new Date());
  const lStart = s.lunch_break_start ? parse(s.lunch_break_start.substring(0, 5), 'HH:mm', new Date()) : null;
  const lEnd   = s.lunch_break_end   ? parse(s.lunch_break_end.substring(0, 5),   'HH:mm', new Date()) : null;
  let cur = start; let num = 1; let lunchAdded = false;
  while (cur < end) {
    const slotEnd = addMinutes(cur, s.lesson_duration_minutes);
    if (slotEnd > end) break;
    if (lStart && lEnd && !lunchAdded && cur >= lStart) {
      result.push({ lesson_number: 0, start_time: fmtDate(lStart, 'HH:mm'), end_time: fmtDate(lEnd, 'HH:mm') });
      lunchAdded = true; cur = lEnd; continue;
    }
    if (lStart && lEnd && !lunchAdded && slotEnd > lStart) {
      result.push({ lesson_number: 0, start_time: fmtDate(lStart, 'HH:mm'), end_time: fmtDate(lEnd, 'HH:mm') });
      lunchAdded = true; cur = lEnd; continue;
    }
    result.push({ lesson_number: num, start_time: fmtDate(cur, 'HH:mm'), end_time: fmtDate(slotEnd, 'HH:mm') });
    num++;
    cur = addMinutes(slotEnd, s.break_duration_minutes);
  }
  return result;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

const SUBJECT_COLORS = [
  { border: 'border-l-blue-500',    bg: 'bg-blue-50/80'    },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50/80' },
  { border: 'border-l-violet-500',  bg: 'bg-violet-50/80'  },
  { border: 'border-l-rose-500',    bg: 'bg-rose-50/80'    },
  { border: 'border-l-amber-500',   bg: 'bg-amber-50/80'   },
  { border: 'border-l-cyan-500',    bg: 'bg-cyan-50/80'    },
  { border: 'border-l-orange-500',  bg: 'bg-orange-50/80'  },
  { border: 'border-l-teal-500',    bg: 'bg-teal-50/80'    },
  { border: 'border-l-indigo-500',  bg: 'bg-indigo-50/80'  },
  { border: 'border-l-pink-500',    bg: 'bg-pink-50/80'    },
] as const;

function subjectColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}

function lessonCardCls(name: string, status?: string, isPast = false) {
  if (status === 'cancelled' || status === 'canceled') return 'border-l-red-300 bg-red-50/50 opacity-50';
  const c = subjectColor(name ?? '');
  if (status === 'in_progress') return cn(c.border, c.bg, 'ring-2 ring-offset-1 ring-blue-300 shadow-sm');
  if (isPast) return cn(c.border, c.bg, 'opacity-55');
  return cn(c.border, c.bg);
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed')
    return <span className="text-[9px] text-green-700 bg-green-100 px-1 py-0.5 rounded font-medium">✓ Tugadi</span>;
  if (status === 'cancelled' || status === 'canceled')
    return <span className="text-[9px] text-red-600 bg-red-100 px-1 py-0.5 rounded font-medium">Bekor</span>;
  if (status === 'in_progress')
    return (
      <span className="text-[9px] text-blue-700 bg-blue-100 px-1 py-0.5 rounded font-medium flex items-center gap-0.5">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse inline-block" /> Davom
      </span>
    );
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TeacherSchedulePage() {
  const { currentBranch } = useAuth();
  const branchId     = currentBranch?.branch_id ?? '';
  const membershipId = currentBranch?.id ?? '';

  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs      = useRef<(HTMLTableRowElement | null)[]>([]);

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [indicatorTop, setIndicatorTop]     = useState<number | null>(null);

  // ── Week navigation ─────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dayIdx, setDayIdx]       = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 5 : Math.min(d - 1, 5);
  });

  const weekDays        = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const selectedDate    = weekDays[dayIdx];
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const isToday = useMemo(
    () => format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    [selectedDate]
  );

  const goToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const d = new Date().getDay();
    setDayIdx(d === 0 ? 5 : Math.min(d - 1, 5));
  };

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: branchSettings } = useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn:  () => branchApi.getBranchSettings(branchId),
    enabled:  !!branchId,
  });

  const {
    data: lessonsData,
    isLoading: lessonsLoading,
    refetch: refetchLessons,
  } = useLessonInstances(branchId, {
    date_from:  selectedDateStr,
    date_to:    selectedDateStr,
    teacher_id: membershipId,
  });
  const lessons: LessonInstance[] = (lessonsData?.results ?? []).filter(
    l => (l as any).teacher_membership_id === membershipId || true
  );

  // ── Time slots ─────────────────────────────────────────────────────────────
  const timeSlots = useMemo(
    () => (branchSettings ? computeTimeSlots(branchSettings) : []),
    [branchSettings]
  );

  // Lesson map: lesson_number → lesson
  const lessonByNum = useMemo(() => {
    const m = new Map<number, LessonInstance>();
    lessons.forEach(l => { if (l.lesson_number) m.set(l.lesson_number, l); });
    return m;
  }, [lessons]);

  // Day slot counts (based on this week lessons)
  const { data: weekLessonsData } = useLessonInstances(branchId, {
    date_from:  format(weekStart, 'yyyy-MM-dd'),
    date_to:    format(addDays(weekStart, 5), 'yyyy-MM-dd'),
    teacher_id: membershipId,
  });
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

  // ── Current time indicator ─────────────────────────────────────────────────
  const updateIndicator = useCallback(() => {
    const now = new Date();
    setCurrentTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    if (!isToday || timeSlots.length === 0) { setIndicatorTop(null); return; }
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < timeSlots.length; i++) {
      const ts = timeSlots[i];
      if (ts.lesson_number === 0) continue;
      const startMin = toMinutes(ts.start_time);
      const endMin   = toMinutes(ts.end_time);
      if (nowMin >= startMin && nowMin <= endMin) {
        const row = rowRefs.current[i];
        if (row) {
          const progress = (nowMin - startMin) / Math.max(endMin - startMin, 1);
          setIndicatorTop(Math.round(row.offsetTop + row.offsetHeight * progress));
          return;
        }
      }
    }
    setIndicatorTop(null);
  }, [isToday, timeSlots]);

  useEffect(() => {
    updateIndicator();
    const id = setInterval(updateIndicator, 30_000);
    return () => clearInterval(id);
  }, [updateIndicator]);
  useEffect(() => { updateIndicator(); }, [selectedDate, updateIndicator]);

  if (!branchId) return (
    <div className="flex items-center justify-center h-[60vh]">
      <p className="text-gray-500">Filial tanlanmagan</p>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dars Jadvalim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Haftalik dars jadvali</p>
        </div>
        <div className="flex items-center gap-2">
          {currentTimeStr && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-gray-700 tabular-nums">{currentTimeStr}</span>
            </div>
          )}
          <Button
            variant="outline" size="icon" className="h-9 w-9"
            onClick={() => refetchLessons()} disabled={lessonsLoading}
          >
            <RefreshCw className={cn('w-4 h-4', lessonsLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Week navigation + Day tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 px-2 min-w-[190px] text-center tabular-nums">
              {format(weekStart, 'd MMM', { locale: uz })} — {format(addDays(weekStart, 5), 'd MMM yyyy', { locale: uz })}
            </span>
            <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={goToday} className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
            Bugun
          </button>
        </div>

        <div className="grid grid-cols-6">
          {DAY_KEYS.map((key, idx) => {
            const day        = weekDays[idx];
            const isSelected = idx === dayIdx;
            const isTodayTab = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const count      = dayLessonCounts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => setDayIdx(idx)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-3 px-1 transition-all border-b-[3px]',
                  'hover:bg-gray-50 focus-visible:outline-none',
                  isSelected ? 'border-blue-600 bg-blue-50/60' : isTodayTab ? 'border-blue-200' : 'border-transparent'
                )}
              >
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isSelected ? 'text-blue-600' : isTodayTab ? 'text-blue-500' : 'text-gray-400')}>
                  {DAY_SHORT[idx]}
                </span>
                <span className={cn('text-xl font-bold leading-none', isSelected ? 'text-blue-700' : isTodayTab ? 'text-blue-600' : 'text-gray-800')}>
                  {format(day, 'd')}
                </span>
                <span className={cn('text-[10px] font-medium', isSelected ? 'text-blue-500' : 'text-gray-400')}>
                  {format(day, 'MMM', { locale: uz })}
                </span>
                {count > 0 && (
                  <span className={cn('mt-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1', isSelected ? 'bg-blue-600 text-white' : isTodayTab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>
                    {count}
                  </span>
                )}
                {isTodayTab && !isSelected && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day label */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 px-0.5">
        <span className="font-semibold text-gray-800 text-sm">{DAY_FULL[dayIdx]}</span>
        {isToday && (
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Bugun
          </span>
        )}
      </div>

      {/* Grid */}
      {lessonsLoading ? (
        <Skeleton className="h-[400px] w-full rounded-xl" />
      ) : timeSlots.length === 0 && lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">Bu kunda dars yo'q</p>
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="space-y-2">
          {[...lessons].sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0) || (a.start_time ?? '').localeCompare(b.start_time ?? '')).map(lesson => {
            const isPast = selectedDateStr < format(new Date(), 'yyyy-MM-dd');
            return (
              <Link
                key={lesson.id}
                href={`/teacher/schedule/lessons/${lesson.id}`}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-xl border-l-[3px] px-4 py-3 bg-white border border-gray-100 hover:shadow-sm transition-all cursor-pointer',
                  lessonCardCls(lesson.subject_name ?? lesson.group_name ?? '', lesson.status, isPast)
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {lesson.lesson_number != null && (
                      <span className="text-xs font-bold text-gray-400 w-6 shrink-0">{lesson.lesson_number}</span>
                    )}
                    <span className="text-sm font-semibold text-gray-900">{lesson.subject_name ?? lesson.group_name ?? 'Dars'}</span>
                    <StatusBadge status={lesson.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-1 ml-8">
                    <span className="text-xs font-mono text-gray-400">{lesson.start_time?.substring(0,5)} – {lesson.end_time?.substring(0,5)}</span>
                    {lesson.class_name && <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" /> {lesson.class_name}</span>}
                    {lesson.room_name && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {lesson.room_name}</span>}
                  </div>
                </div>
                <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors shrink-0">
                  <ClipboardList className="w-3 h-3" /> Davomat
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm relative"
        >
          {/* Time indicator */}
          {isToday && indicatorTop !== null && (
            <div className="absolute left-0 z-20 pointer-events-none" style={{ top: `${indicatorTop}px`, width: '100%' }}>
              <div className="flex items-center gap-0">
                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-r-full shrink-0 leading-tight shadow-md ml-[88px]">
                  {currentTimeStr}
                </span>
                <div className="flex-1 border-t-[2px] border-green-500 opacity-70" />
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 ring-2 ring-white shadow mr-1" />
              </div>
            </div>
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="sticky left-0 z-20 bg-gray-50 w-[88px] min-w-[88px] px-2 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-200">
                  Vaqt
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 bg-blue-50/60">
                  Darslar
                </th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((ts, rowIdx) => {
                if (ts.lesson_number === 0) {
                  return (
                    <tr key="lunch" ref={el => { rowRefs.current[rowIdx] = el; }} className="border-y-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/40">
                      <td className="sticky left-0 z-10 bg-amber-50 px-2 py-3 border-r-2 border-amber-200 text-center">
                        <div className="text-[10px] font-bold text-amber-700">{ts.start_time}</div>
                        <div className="text-[10px] text-amber-500 mt-0.5">{ts.end_time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-amber-700">
                          <UtensilsCrossed className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-semibold">Tushlik tanaffusi</span>
                          <span className="text-xs text-amber-500">{ts.start_time} – {ts.end_time}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const nowMin    = toMinutes(currentTimeStr || '00:00');
                const slotStart = toMinutes(ts.start_time);
                const slotEnd   = toMinutes(ts.end_time);
                const isCurrentSlot = isToday && !!currentTimeStr && nowMin >= slotStart && nowMin < slotEnd;
                const todayStr  = format(new Date(), 'yyyy-MM-dd');
                const isPastSlot = selectedDateStr < todayStr || (isToday && !!currentTimeStr && ts.end_time <= currentTimeStr);

                const rowBg = isCurrentSlot ? 'bg-green-50/30' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30';
                const lesson = lessonByNum.get(ts.lesson_number);

                return (
                  <tr key={ts.lesson_number} ref={el => { rowRefs.current[rowIdx] = el; }} className={cn('border-b border-gray-100 last:border-b-0', rowBg)}>
                    <td className={cn('sticky left-0 z-10 px-2 py-2.5 border-r border-gray-200 text-center align-middle w-[88px] min-w-[88px]', rowBg)}>
                      <div className={cn('text-[11px] font-bold', isCurrentSlot ? 'text-green-700' : 'text-gray-700')}>
                        {ts.lesson_number}-dars
                      </div>
                      <div className={cn('text-[10px] font-medium mt-0.5', isCurrentSlot ? 'text-green-600' : 'text-gray-600')}>
                        {ts.start_time}
                      </div>
                      <div className="text-[10px] text-gray-400">{ts.end_time}</div>
                      {isCurrentSlot && <div className="mt-1"><span className="text-[9px] text-green-600 font-semibold bg-green-50 px-1 py-0.5 rounded">Hozir</span></div>}
                    </td>
                    <td className="p-2 align-top">
                      {lesson ? (
                        <Link
                          href={`/teacher/schedule/lessons/${lesson.id}`}
                          className={cn(
                            'flex items-start justify-between gap-3 rounded-lg border-l-[3px] px-3 py-2.5 transition-all cursor-pointer hover:shadow-sm',
                            lessonCardCls(lesson.subject_name ?? lesson.group_name ?? '', lesson.status, isPastSlot)
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">
                                {lesson.subject_name ?? lesson.group_name ?? 'Dars'}
                              </span>
                              <StatusBadge status={lesson.status} />
                            </div>
                            <div className="flex flex-wrap gap-x-3 mt-1">
                              {lesson.class_name && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {lesson.class_name}
                                </span>
                              )}
                              {lesson.group_name && !lesson.class_name && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {lesson.group_name}
                                </span>
                              )}
                              {lesson.room_name && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {lesson.room_name}
                                </span>
                              )}
                            </div>
                            {lesson.topic_title && (
                              <p className="text-xs text-gray-400 italic mt-0.5 truncate">{lesson.topic_title}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {lesson.attendance_count != null && lesson.attendance_count > 0 && (
                              <span className="text-[10px] text-gray-500 bg-white/70 px-1.5 py-0.5 rounded border border-gray-100">
                                {lesson.attendance_count} o'q
                              </span>
                            )}
                            <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                              <ClipboardList className="w-3 h-3" /> Davomat
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <div className="h-10 rounded-lg border border-dashed border-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-300">Dars yo'q</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
