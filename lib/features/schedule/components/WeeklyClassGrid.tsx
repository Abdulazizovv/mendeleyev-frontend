'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TimetableSlot } from '@/types/academic';
import type { TimeSlotDefinition } from '../utils/lessonNumberMapping';
import { formatTimeDisplay } from '../utils/lessonNumberMapping';
import { getSubjectColor } from '../utils/timetable';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DAYS = [
  { value: 1, key: 'monday',    short: 'Du', full: 'Dushanba'   },
  { value: 2, key: 'tuesday',   short: 'Se', full: 'Seshanba'   },
  { value: 3, key: 'wednesday', short: 'Ch', full: 'Chorshanba' },
  { value: 4, key: 'thursday',  short: 'Pa', full: 'Payshanba'  },
  { value: 5, key: 'friday',    short: 'Ju', full: 'Juma'       },
  { value: 6, key: 'saturday',  short: 'Sh', full: 'Shanba'     },
];

interface WeeklyClassGridProps {
  slots: TimetableSlot[];
  timeSlots: TimeSlotDefinition[];
  classId: string;
  onCellClick: (dayOfWeek: number, timeSlot: TimeSlotDefinition) => void;
  onSlotEdit: (slot: TimetableSlot) => void;
  onSlotDelete: (slot: TimetableSlot) => void;
}

export function WeeklyClassGrid({
  slots,
  timeSlots,
  classId,
  onCellClick,
  onSlotEdit,
  onSlotDelete,
}: WeeklyClassGridProps) {
  // Build lookup: dayKey + lessonNumber → slot
  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    slots
      .filter((s) => s.class_obj === classId)
      .forEach((slot) => {
        map.set(`${slot.day_of_week}-${slot.lesson_number}`, slot);
      });
    return map;
  }, [slots, classId]);

  if (timeSlots.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Dars vaqtlari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="w-24 p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
              Vaqt
            </th>
            {DAYS.map((day) => (
              <th
                key={day.key}
                className="p-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
              >
                <span className="hidden sm:inline">{day.full}</span>
                <span className="sm:hidden">{day.short}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((timeSlot, rowIdx) => {
            const isLunch = timeSlot.lesson_number === 0;

            if (isLunch) {
              return (
                <tr key="lunch" className="bg-amber-50 border-b border-amber-200">
                  <td className="p-3 border-r border-amber-200">
                    <div className="text-xs font-medium text-amber-700">
                      {formatTimeDisplay(timeSlot.start_time)}
                    </div>
                    <div className="text-xs text-amber-500">
                      {formatTimeDisplay(timeSlot.end_time)}
                    </div>
                  </td>
                  <td colSpan={6} className="p-3 text-center">
                    <span className="text-sm font-medium text-amber-800">
                      🍽️ Tushlik vaqti — {formatTimeDisplay(timeSlot.start_time)} – {formatTimeDisplay(timeSlot.end_time)}
                    </span>
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={timeSlot.lesson_number}
                className={cn(
                  'border-b border-gray-100 last:border-b-0',
                  rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                )}
              >
                {/* Time label */}
                <td className="p-2.5 border-r border-gray-200 align-middle w-24 shrink-0">
                  <div className="text-xs font-semibold text-gray-700 text-center">
                    {timeSlot.lesson_number}-dars
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-0.5">
                    {formatTimeDisplay(timeSlot.start_time)}
                  </div>
                  <div className="text-xs text-gray-300 text-center">
                    {formatTimeDisplay(timeSlot.end_time)}
                  </div>
                </td>

                {/* Day cells */}
                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day.key}-${timeSlot.lesson_number}`);

                  return (
                    <td
                      key={day.key}
                      className="p-1.5 border-r border-gray-100 last:border-r-0 align-top min-w-[110px]"
                    >
                      {slot ? (
                        <SlotCard
                          slot={slot}
                          onEdit={onSlotEdit}
                          onDelete={onSlotDelete}
                        />
                      ) : (
                        <EmptyCell
                          onClick={() => onCellClick(day.value, timeSlot)}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Slot Card ────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  onEdit,
  onDelete,
}: {
  slot: TimetableSlot;
  onEdit: (s: TimetableSlot) => void;
  onDelete: (s: TimetableSlot) => void;
}) {
  const color = getSubjectColor(slot.subject_name || '');

  return (
    <div
      className={cn(
        'group relative rounded-lg border-l-[3px] px-2.5 py-2 text-xs transition-all hover:shadow-sm',
        color.bg,
        color.border,
      )}
    >
      {/* Actions — appear on hover */}
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={(e) => { e.stopPropagation(); onEdit(slot); }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 text-red-500 hover:text-red-600"
          onClick={(e) => { e.stopPropagation(); onDelete(slot); }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <div className={cn('font-semibold leading-tight pr-8 truncate', color.text)}>
        {slot.subject_name ?? 'Fan'}
      </div>
      {slot.teacher_name && (
        <div className="text-gray-500 truncate mt-0.5">{slot.teacher_name}</div>
      )}
      {slot.room_name && (
        <div className="text-gray-400 truncate">{slot.room_name}</div>
      )}
    </div>
  );
}

// ── Empty Cell ────────────────────────────────────────────────────────────────

function EmptyCell({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full min-h-[64px] rounded-lg border-2 border-dashed border-gray-200',
        'flex items-center justify-center',
        'text-gray-300 hover:text-gray-400 hover:border-gray-300 hover:bg-gray-50',
        'transition-all group'
      )}
    >
      <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
