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
}

export function LessonCard({ lesson, onClick, onDelete, compact = false }: LessonCardProps) {
  const statusInfo = LESSON_STATUSES_UZ[lesson.status as keyof typeof LESSON_STATUSES_UZ] || LESSON_STATUSES_UZ.planned;
  const isNow = isLessonNow(new Date(lesson.date), lesson.start_time, lesson.end_time);
  const isPast = isTimeInPast(new Date(lesson.date), lesson.end_time);
  
  const cardClasses = cn(
    'group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer',
    'hover:shadow-lg hover:scale-[1.02] hover:z-10',
    {
      // Status-based colors
      'bg-blue-50 border-blue-200 hover:border-blue-400': lesson.status === 'planned' && !isNow && !isPast,
      'bg-green-50 border-green-300 hover:border-green-500 ring-2 ring-green-400 animate-pulse': isNow,
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
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {lesson.subject_name || 'Fan nomi'}
          </h4>
          {!compact && lesson.topic?.title && (
            <p className="text-xs text-gray-600 truncate mt-0.5">
              {lesson.topic.title}
            </p>
          )}
        </div>
        <Badge 
          variant="secondary" 
          className={cn('text-xs px-1.5 py-0 h-5', {
            'bg-blue-100 text-blue-700': lesson.status === 'planned',
            'bg-green-100 text-green-700': lesson.status === 'completed' || isNow,
            'bg-red-100 text-red-700': lesson.status === 'cancelled',
          })}
        >
              {statusInfo.label}
            </Badge>
          </div>
          
          {/* Info Section */}
          {!compact && (
            <div className="space-y-1 text-xs text-gray-600">
              {lesson.teacher_name && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span className="truncate">{lesson.teacher_name}</span>
                </div>
              )}
              {lesson.room_name && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{lesson.room_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>{formatTimeUz(lesson.start_time)} - {formatTimeUz(lesson.end_time)}</span>
              </div>
            </div>
          )}
          
          {/* Quick Actions - visible on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick(lesson);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 bg-white/90 hover:bg-red-50 hover:text-red-600 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lesson);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Current Lesson Indicator */}
          {isNow && (
            <div className="absolute -top-1 -left-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-ping" />
          )}
        </div>
  );
}
