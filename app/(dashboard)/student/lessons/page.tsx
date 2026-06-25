'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth';
import { schoolApi } from '@/lib/api';
import { scheduleApi } from '@/lib/features/schedule/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Users, BookOpen, User } from 'lucide-react';

type DateTab = 'today' | 'week' | 'month';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planned:     { label: 'Rejalashtirilgan', color: 'bg-blue-50 text-blue-700 border border-blue-200'      },
  in_progress: { label: 'Davom etmoqda',   color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  completed:   { label: 'Tugallangan',     color: 'bg-green-50 text-green-700 border border-green-200'   },
  cancelled:   { label: 'Bekor qilingan',  color: 'bg-red-50 text-red-700 border border-red-200'         },
  canceled:    { label: 'Bekor qilingan',  color: 'bg-red-50 text-red-700 border border-red-200'         },
};

const TAB_LABELS: Record<DateTab, string> = { today: 'Bugun', week: 'Bu hafta', month: 'Bu oy' };

function getDateRange(tab: DateTab): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (tab === 'today') { const s = fmt(now); return { from: s, to: s }; }
  if (tab === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const mon = new Date(now); mon.setDate(now.getDate() - day);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: fmt(mon), to: fmt(sun) };
  }
  return {
    from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    to:   fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export default function StudentLessonsPage() {
  const { currentBranch } = useAuthStore();
  const branchId = currentBranch?.branch_id ?? '';
  const [tab, setTab] = useState<DateTab>('today');
  const { from, to } = getDateRange(tab);

  const { data: studentClass, isLoading: classLoading } = useQuery({
    queryKey: ['student-class', branchId],
    queryFn:  () => schoolApi.getStudentClass({ branch_id: branchId }),
    enabled:  !!branchId,
  });

  const classId = studentClass?.id;

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['student-lessons', branchId, classId, from, to],
    queryFn:  () => scheduleApi.getLessonInstances(branchId, { date_from: from, date_to: to, class_id: classId }),
    enabled:  !!branchId && !!classId,
  });

  const lessons = lessonsData?.results ?? [];
  const isLoading = classLoading || lessonsLoading;

  // Group by date when showing week/month
  const grouped = tab !== 'today'
    ? lessons.reduce<Record<string, typeof lessons>>((acc, l) => {
        const d = l.date ?? '';
        if (!acc[d]) acc[d] = [];
        acc[d].push(l);
        return acc;
      }, {})
    : null;

  const sortedDates = grouped ? Object.keys(grouped).sort() : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Darslarim</h1>
        {studentClass ? (
          <p className="text-sm text-gray-500">{studentClass.name} · {studentClass.academic_year_name}</p>
        ) : (
          <p className="text-sm text-gray-500">Darslar ro'yxati</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as DateTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : !classId ? (
        <Card className="border border-dashed border-gray-200 shadow-none">
          <CardContent className="py-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Siz hech qaysi sinfga biriktirilmagan</p>
          </CardContent>
        </Card>
      ) : lessons.length === 0 ? (
        <Card className="border border-dashed border-gray-200 shadow-none">
          <CardContent className="py-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Bu davrda dars topilmadi</p>
          </CardContent>
        </Card>
      ) : tab === 'today' ? (
        <div className="space-y-2">
          {lessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} showDate={false} />)}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates!.map(date => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDateLabel(date)}
                <span className="text-xs font-normal text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {grouped![date].length} ta dars
                </span>
              </h3>
              <div className="space-y-2">
                {grouped![date].map(lesson => <LessonCard key={lesson.id} lesson={lesson} showDate={false} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson, showDate }: { lesson: any; showDate: boolean }) {
  const st = STATUS_MAP[lesson.status] ?? { label: lesson.status, color: 'bg-gray-50 text-gray-600 border border-gray-200' };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
      {/* Time */}
      <div className="flex items-center gap-2 sm:w-28 shrink-0">
        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm font-mono text-gray-600">
          {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2">
          <p className="text-sm font-semibold text-gray-900">
            {lesson.subject_name ?? 'Dars'}
          </p>
          {showDate && lesson.date && (
            <span className="text-xs text-gray-400">{lesson.date}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 mt-0.5">
          {lesson.teacher_name && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" /> {lesson.teacher_name}
            </span>
          )}
          {lesson.room_name && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {lesson.room_name}
            </span>
          )}
          {lesson.lesson_number && (
            <span className="text-xs text-gray-400">{lesson.lesson_number}-dars</span>
          )}
        </div>
        {lesson.topic_title && (
          <p className="text-xs text-gray-400 italic mt-0.5 truncate">
            <BookOpen className="w-3 h-3 inline mr-1" />{lesson.topic_title}
          </p>
        )}
      </div>

      {/* Status */}
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${st.color}`}>
        {st.label}
      </span>
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}
