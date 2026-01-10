'use client';

import React from 'react';
import { Clock, User, MapPin, BookOpen, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LessonInstance } from '@/types/academic';
import { LESSON_STATUSES_UZ, formatTimeUz, isLessonNow, isTimeInPast } from '../constants/translations';

interface LessonCardProps {
  lesson: LessonInstance;
  onClick: (lesson: LessonInstance) => void;
  onDelete: (lesson: LessonInstance) => void;
  compact?: boolean;
  isCurrentLesson?: boolean;
}

export function LessonCard({ lesson, onClick, onDelete, compact = false, isCurrentLesson = false }: LessonCardProps) {
  const statusInfo = LESSON_STATUSES_UZ[lesson.status as keyof typeof LESSON_STATUSES_UZ] || LESSON_STATUSES_UZ.planned;
  const isNow = isCurrentLesson || isLessonNow(new Date(lesson.date), lesson.start_time, lesson.end_time);
  const isPast = isTimeInPast(new Date(lesson.date), lesson.end_time);
  
  // Subject color mapping for visual variety
  const subjectColors = [
    'bg-blue-50 border-blue-300 hover:border-blue-500',
    'bg-purple-50 border-purple-300 hover:border-purple-500',
    'bg-pink-50 border-pink-300 hover:border-pink-500',
    'bg-indigo-50 border-indigo-300 hover:border-indigo-500',
    'bg-cyan-50 border-cyan-300 hover:border-cyan-500',
    'bg-teal-50 border-teal-300 hover:border-teal-500',
  ];
  
  // Get consistent color based on subject name
  const subjectColorIndex = lesson.subject_name 
    ? lesson.subject_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % subjectColors.length
    : 0;
  
  const baseColor = lesson.status === 'planned' && !isNow && !isPast 
    ? subjectColors[subjectColorIndex]
    : '';
  
  const cardClasses = cn(
    'group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer',
    'hover:shadow-lg hover:scale-[1.02] hover:z-10 overflow-hidden',
    {
      // Status-based colors
      [baseColor]: lesson.status === 'planned' && !isNow && !isPast,
      'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 hover:border-green-600 ring-2 ring-green-400 shadow-lg': isNow,
      'bg-gray-50 border-gray-200 hover:border-gray-300 opacity-70': isPast && lesson.status !== 'completed',
      'bg-emerald-50 border-emerald-300 hover:border-emerald-400': lesson.status === 'completed',
      'bg-red-50 border-red-200 hover:border-red-300': lesson.status === 'cancelled',
    }
  );
  
  return (
    <div className={cardClasses} onClick={() => onClick(lesson)}>
      {/* Top Section - Subject & Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold text-sm truncate",
            isNow ? "text-green-900" : "text-gray-900"
          )}>
            {lesson.subject_name || 'Fan nomi'}
          </h4>
          {!compact && lesson.topic?.title && (
            <p className={cn(
              "text-xs truncate mt-0.5",
              isNow ? "text-green-700" : "text-gray-600"
            )}>
              {lesson.topic.title}
            </p>
          )}
        </div>
        <Badge 
          variant="secondary" 
          className={cn('text-xs px-1.5 py-0 h-5 shrink-0', {
            'bg-blue-100 text-blue-700 border-blue-300': lesson.status === 'planned' && !isNow,
            'bg-green-100 text-green-800 border-green-400 font-bold': isNow,
            'bg-emerald-100 text-emerald-700 border-emerald-300': lesson.status === 'completed' && !isNow,
            'bg-red-100 text-red-700 border-red-300': lesson.status === 'cancelled',
          })}
        >
          {isNow ? '⏱️ Hozir' : statusInfo.label}
        </Badge>
      </div>
      
      {/* Info Section */}
      {!compact && (
        <div className="space-y-1 text-xs text-gray-600">
          {lesson.teacher_name && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{lesson.teacher_name}</span>
            </div>
          )}
          {lesson.room_name && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{lesson.room_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{formatTimeUz(lesson.start_time)} - {formatTimeUz(lesson.end_time)}</span>
          </div>
        </div>
      )}
      
      {/* Quick Actions - visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 bg-white/95 hover:bg-blue-50 hover:text-blue-700 shadow-md backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick(lesson);
          }}
          title="Ko'rish"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 bg-white/95 hover:bg-red-50 hover:text-red-600 shadow-md backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(lesson);
          }}
          title="O'chirish"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Current Lesson Indicator */}
      {isNow && (
        <>
          <div className="absolute -top-1 -left-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-ping" />
          <div className="absolute -top-1 -left-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
          
          {/* Animated gradient overlay for current lesson */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" 
               style={{ 
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 2s infinite'
               }} 
          />
        </>
      )}
    </div>
  );
}
