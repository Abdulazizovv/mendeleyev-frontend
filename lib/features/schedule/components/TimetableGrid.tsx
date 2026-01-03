/**
 * Timetable Grid Component
 * Displays weekly timetable in a grid format (Monday-Saturday)
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TimetableSlot } from '@/types/academic';
import { cn } from '@/lib/utils';

interface TimetableGridProps {
  slots: TimetableSlot[];
  isLoading?: boolean;
  onSlotClick?: (slot: TimetableSlot) => void;
  onSlotEdit?: (slot: TimetableSlot) => void;
  onSlotDelete?: (slot: TimetableSlot) => void;
  editable?: boolean;
  className?: string;
}

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-100 border-blue-300 text-blue-800',
  English: 'bg-green-100 border-green-300 text-green-800',
  Science: 'bg-purple-100 border-purple-300 text-purple-800',
  History: 'bg-orange-100 border-orange-300 text-orange-800',
  Physics: 'bg-red-100 border-red-300 text-red-800',
  Chemistry: 'bg-pink-100 border-pink-300 text-pink-800',
  Biology: 'bg-teal-100 border-teal-300 text-teal-800',
  default: 'bg-gray-100 border-gray-300 text-gray-800',
};

const getSubjectColor = (subjectName?: string): string => {
  if (!subjectName) return SUBJECT_COLORS.default;
  return SUBJECT_COLORS[subjectName] || SUBJECT_COLORS.default;
};

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  isLoading,
  onSlotClick,
  onSlotEdit,
  onSlotDelete,
  editable = false,
  className,
}) => {
  // Group slots by day and sort by start time
  const slotsByDay = useMemo(() => {
    const grouped = new Map<number, TimetableSlot[]>();
    
    DAYS.forEach((day) => {
      const daySlots = slots
        .filter((slot) => slot.day_of_week === day.value)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      grouped.set(day.value, daySlots);
    });

    return grouped;
  }, [slots]);

  // Get all unique time slots
  const timeSlots = useMemo(() => {
    const times = new Set<string>();
    slots.forEach((slot) => {
      times.add(`${slot.start_time}-${slot.end_time}`);
    });
    return Array.from(times).sort();
  }, [slots]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No timetable slots found. Create a template to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Weekly Timetable</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View: Grid */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[900px]">
            {/* Header Row */}
            <div className="font-semibold text-sm p-2 bg-muted rounded">
              Time
            </div>
            {DAYS.map((day) => (
              <div
                key={day.value}
                className="font-semibold text-sm p-2 bg-muted rounded text-center"
              >
                {day.label}
              </div>
            ))}

            {/* Time Slots Rows */}
            {timeSlots.map((timeSlot) => {
              const [startTime, endTime] = timeSlot.split('-');
              
              return (
                <React.Fragment key={timeSlot}>
                  {/* Time Column */}
                  <div className="text-xs text-muted-foreground p-2 flex items-center">
                    <div>
                      <div className="font-medium">{startTime}</div>
                      <div>{endTime}</div>
                    </div>
                  </div>

                  {/* Day Columns */}
                  {DAYS.map((day) => {
                    const daySlots = slotsByDay.get(day.value) || [];
                    const slot = daySlots.find(
                      (s) => `${s.start_time}-${s.end_time}` === timeSlot
                    );

                    if (!slot) {
                      return (
                        <div
                          key={`${day.value}-${timeSlot}`}
                          className="border border-dashed border-gray-200 rounded p-2 min-h-[80px]"
                        />
                      );
                    }

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          'border-2 rounded p-2 min-h-[80px] cursor-pointer transition-all hover:shadow-md',
                          getSubjectColor(slot.subject_name)
                        )}
                        onClick={() => onSlotClick?.(slot)}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
                            {slot.subject_name || 'Unknown Subject'}
                          </div>
                          <div className="text-xs">
                            {slot.teacher_name || 'No Teacher'}
                          </div>
                          {slot.room_name && (
                            <Badge variant="outline" className="text-xs">
                              {slot.room_name}
                            </Badge>
                          )}
                        </div>

                        {editable && (
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSlotEdit?.(slot);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSlotDelete?.(slot);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet View: List by Day */}
        <div className="lg:hidden space-y-4">
          {DAYS.map((day) => {
            const daySlots = slotsByDay.get(day.value) || [];

            if (daySlots.length === 0) return null;

            return (
              <div key={day.value}>
                <h3 className="font-semibold mb-2">{day.label}</h3>
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={cn(
                        'border-2 rounded p-3 cursor-pointer transition-all',
                        getSubjectColor(slot.subject_name)
                      )}
                      onClick={() => onSlotClick?.(slot)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">
                          {slot.subject_name || 'Unknown Subject'}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {slot.start_time} - {slot.end_time}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {slot.teacher_name || 'No Teacher'}
                      </div>
                      {slot.room_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Room: {slot.room_name}
                        </div>
                      )}

                      {editable && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSlotEdit?.(slot);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSlotDelete?.(slot);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
