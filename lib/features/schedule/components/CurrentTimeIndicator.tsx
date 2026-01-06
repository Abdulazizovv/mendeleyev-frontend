/**
 * Current Time Indicator Component
 * Red horizontal line showing current time position in timetable
 */

'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentTimePositionInGrid, getCurrentUzbekistanTime } from '../utils/time';
import { cn } from '@/lib/utils';

interface CurrentTimeIndicatorProps {
  dayOfWeek: number;
  earliestTime: string;
  latestTime: string;
  isToday: boolean;
}

export const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  dayOfWeek,
  earliestTime,
  latestTime,
  isToday,
}) => {
  const [position, setPosition] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    if (!isToday) return;

    const updatePosition = () => {
      const pos = getCurrentTimePositionInGrid(earliestTime, latestTime);
      setPosition(pos);

      const now = getCurrentUzbekistanTime();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    // Initial update
    updatePosition();

    // Update every 30 seconds
    const interval = setInterval(updatePosition, 30000);

    return () => clearInterval(interval);
  }, [isToday, earliestTime, latestTime]);

  if (!isToday) return null;

  // Don't show if time is outside the timetable range
  if (position <= 0 || position >= 100) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${position}%` }}
    >
      {/* Time badge */}
      <div className="absolute -left-2 -top-2.5 flex items-center">
        <div className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded shadow-md">
          {currentTime}
        </div>
      </div>

      {/* Red line */}
      <div className="relative h-0.5 bg-red-500 shadow-md">
        {/* Animated pulse effect */}
        <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50" />
        
        {/* Arrow indicator */}
        <div className="absolute left-0 -top-1 w-2 h-2 bg-red-500 rounded-full" />
      </div>
    </div>
  );
};
