/**
 * Time-Based Timetable Edit Grid
 * Rows = Time Slots, Columns = Classes
 * Admin assigns lessons by clicking cells
 */

'use client';

import React, { useMemo } from 'react';
import type { TimetableSlot } from '@/types/academic';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  getAllTimeSlots,
  formatTimeDisplay,
  type TimeSlotDefinition,
} from '../utils/lessonNumberMapping';
import { GripVertical, Users, MapPin, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSubjectColor } from '../utils/timetable';

interface Class {
  id: string;
  name: string;
}

interface TimeBasedGridProps {
  classes: Class[];
  slots: TimetableSlot[];
  dayOfWeek: number;
  onSlotClick?: (classId: string, timeSlot: TimeSlotDefinition) => void;
  onSlotEdit?: (slot: TimetableSlot) => void;
  onSlotDelete?: (slot: TimetableSlot) => void;
  onSlotDrop?: (slotId: string, newClassId: string, newTimeSlot: TimeSlotDefinition) => void;
}

// Draggable Slot Component
const DraggableSlot: React.FC<{
  slot: TimetableSlot;
  onEdit?: (slot: TimetableSlot) => void;
  onDelete?: (slot: TimetableSlot) => void;
}> = ({ slot, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const subjectColor = getSubjectColor(slot.subject_name || '');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-md border-l-4 p-2 transition-all bg-white shadow-sm',
        'hover:shadow-md cursor-move',
        subjectColor.bg,
        subjectColor.border,
        isDragging && 'opacity-50 shadow-lg scale-105 z-50'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(slot);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(slot);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-1 pl-4">
        {/* Subject */}
        <div className={cn('font-semibold text-xs', subjectColor.text)}>
          {slot.subject_name || 'Noma\'lum fan'}
        </div>

        {/* Teacher */}
        {slot.teacher_name && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            <span className="truncate">{slot.teacher_name}</span>
          </div>
        )}

        {/* Room */}
        {slot.room_name && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-2.5 w-2.5" />
            <span>{slot.room_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Droppable Cell Component
const DroppableCell: React.FC<{
  classId: string;
  timeSlot: TimeSlotDefinition;
  slot?: TimetableSlot;
  onClick?: () => void;
  onEdit?: (slot: TimetableSlot) => void;
  onDelete?: (slot: TimetableSlot) => void;
}> = ({ classId, timeSlot, slot, onClick, onEdit, onDelete }) => {
  const dropId = `${classId}-${timeSlot.lesson_number}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: {
      classId,
      timeSlot,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] p-1.5 rounded border-2 border-dashed transition-all',
        isOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        !slot && 'cursor-pointer'
      )}
      onClick={() => !slot && onClick && onClick()}
    >
      {slot ? (
        <DraggableSlot slot={slot} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <div className="flex items-center justify-center h-full text-xs text-gray-400">
          + Qo'shish
        </div>
      )}
    </div>
  );
};

export const TimeBasedGrid: React.FC<TimeBasedGridProps> = ({
  classes,
  slots,
  dayOfWeek,
  onSlotClick,
  onSlotEdit,
  onSlotDelete,
  onSlotDrop,
}) => {
  const timeSlots = getAllTimeSlots();

  // Convert dayOfWeek number to string
  const dayOfWeekMap: Record<number, string> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
  };
  const dayOfWeekString = dayOfWeekMap[dayOfWeek];

  // Group slots by class and lesson number
  const slotsByClassAndTime = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    slots
      .filter((s) => s.day_of_week === dayOfWeekString)
      .forEach((slot) => {
        const key = `${slot.class_obj}-${slot.lesson_number}`;
        map.set(key, slot);
      });
    return map;
  }, [slots, dayOfWeekString]);

  // Drag & drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const activeSlot = useMemo(
    () => slots.find((s) => s.id === activeId),
    [slots, activeId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onSlotDrop) return;

    const slotId = active.id as string;
    const dropData = over.data.current as { classId: string; timeSlot: TimeSlotDefinition };

    if (dropData) {
      onSlotDrop(slotId, dropData.classId, dropData.timeSlot);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Grid Container */}
          <div
            className="grid gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden"
            style={{
              gridTemplateColumns: `100px repeat(${classes.length}, 1fr)`,
            }}
          >
            {/* Header Row */}
            <div className="bg-gray-50 p-2 font-semibold text-xs text-gray-700 flex items-center justify-center sticky left-0 z-10">
              Vaqt
            </div>
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-gray-50 p-2 text-center font-semibold text-xs text-gray-700"
              >
                {cls.name}
              </div>
            ))}

            {/* Time Slot Rows */}
            {timeSlots.map((timeSlot) => (
              <React.Fragment key={timeSlot.lesson_number}>
                {/* Time Label */}
                <div className="bg-white p-2 text-xs text-gray-600 flex flex-col items-center justify-center border-t border-gray-100 sticky left-0 z-10">
                  <div className="font-medium">{formatTimeDisplay(timeSlot.start_time)}</div>
                  <div className="text-xs text-gray-400">-</div>
                  <div className="font-medium">{formatTimeDisplay(timeSlot.end_time)}</div>
                </div>

                {/* Class Cells */}
                {classes.map((cls) => {
                  const key = `${cls.id}-${timeSlot.lesson_number}`;
                  const slot = slotsByClassAndTime.get(key);

                  return (
                    <div key={key} className="bg-white p-1 border-t border-gray-100">
                      <DroppableCell
                        classId={cls.id}
                        timeSlot={timeSlot}
                        slot={slot}
                        onClick={() => onSlotClick && onSlotClick(cls.id, timeSlot)}
                        onEdit={onSlotEdit}
                        onDelete={onSlotDelete}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeSlot ? (
          <div className="bg-white p-2 rounded-md shadow-lg border">
            <div className="font-semibold text-sm">
              {activeSlot.subject_name}
            </div>
            <div className="text-xs text-gray-600">
              {activeSlot.class_name}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
