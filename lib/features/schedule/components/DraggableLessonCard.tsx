/**
 * Draggable Lesson Card Component
 * Used in edit mode for drag & drop functionality
 */

'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LessonInstance } from '@/types/academic';
import { cn } from '@/lib/utils';
import {
  getSubjectColor,
  getLessonStatusStyle,
} from '@/lib/features/schedule/utils/timetable';
import {
  isLessonOngoing,
  isLessonPast,
  formatTimeForDisplay,
} from '@/lib/features/schedule/utils/time';
import { GripVertical, Users, User, MapPin, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableLessonCardProps {
  lesson: LessonInstance;
  onEdit?: (lesson: LessonInstance) => void;
  onDelete?: (lesson: LessonInstance) => void;
}

export const DraggableLessonCard: React.FC<DraggableLessonCardProps> = ({
  lesson,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ongoing = isLessonOngoing(lesson.date, lesson.start_time, lesson.end_time);
  const past = isLessonPast(lesson.date, lesson.end_time);
  const subjectColor = getSubjectColor(lesson.subject_name || '');
  const statusStyle = getLessonStatusStyle(lesson.status, ongoing, past);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border-l-4 p-3 transition-all bg-white shadow-sm',
        'hover:shadow-md',
        subjectColor.bg,
        subjectColor.border,
        statusStyle.className,
        isDragging && 'opacity-50 shadow-lg scale-105 z-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lesson);
            }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lesson);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="space-y-2 pl-6">
        {/* Subject Name */}
        <div className={cn('font-semibold text-sm', subjectColor.text)}>
          {lesson.subject_name}
        </div>

        {/* Class Name */}
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-medium text-gray-700">{lesson.class_name}</span>
        </div>

        {/* Teacher */}
        {lesson.teacher_name && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <User className="h-3 w-3" />
            <span>{lesson.teacher_name}</span>
          </div>
        )}

        {/* Room */}
        {lesson.room_name && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>{lesson.room_name}</span>
          </div>
        )}

        {/* Time */}
        <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
          {formatTimeForDisplay(lesson.start_time)} -{' '}
          {formatTimeForDisplay(lesson.end_time)}
        </div>
      </div>
    </div>
  );
};
