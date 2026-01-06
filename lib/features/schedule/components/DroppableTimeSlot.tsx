/**
 * Droppable Time Slot Component
 * Accepts dragged lessons and handles drop logic
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { LessonInstance } from '@/types/academic';
import { DraggableLessonCard } from './DraggableLessonCard';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DroppableTimeSlotProps {
  dayOfWeek: number;
  timeSlot: string;
  lessons: LessonInstance[];
  onEdit?: (lesson: LessonInstance) => void;
  onDelete?: (lesson: LessonInstance) => void;
  onAddLesson?: (dayOfWeek: number, timeSlot: string) => void;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  dayOfWeek,
  timeSlot,
  lessons,
  onEdit,
  onDelete,
  onAddLesson,
}) => {
  const dropId = `${dayOfWeek}-${timeSlot}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: {
      dayOfWeek,
      timeSlot,
    },
  });

  const lessonIds = lessons.map((l) => l.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] p-2 rounded-md border-2 border-dashed transition-all',
        isOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-gray-400">
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">Drop lesson here</span>
            {onAddLesson && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={() => onAddLesson(dayOfWeek, timeSlot)}
              >
                Add Lesson
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <DraggableLessonCard
                key={lesson.id}
                lesson={lesson}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </SortableContext>
    </div>
  );
};
