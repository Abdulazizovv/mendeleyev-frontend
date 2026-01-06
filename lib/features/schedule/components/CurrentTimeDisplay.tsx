'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { formatDateUz, getCurrentLessonNumber } from '../constants/translations';
import { cn } from '@/lib/utils';

interface CurrentTimeDisplayProps {
  className?: string;
  showSeconds?: boolean;
}

export function CurrentTimeDisplay({ className, showSeconds = true }: CurrentTimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const timeString = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  
  const dateString = formatDateUz(currentTime);
  const currentLesson = getCurrentLessonNumber(currentTime);
  
  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Date */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-600" />
        <div>
          <div className="text-sm font-medium text-gray-900">{dateString}</div>
        </div>
      </div>
      
      {/* Current Time */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-green-600" />
        <div>
          <div className="text-2xl font-bold font-mono tabular-nums text-gray-900">
            {timeString}
          </div>
        </div>
      </div>
      
      {/* Current Lesson Indicator */}
      {currentLesson && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-lg">
          <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-green-800">
            {currentLesson}-dars davom etmoqda
          </span>
        </div>
      )}
    </div>
  );
}
