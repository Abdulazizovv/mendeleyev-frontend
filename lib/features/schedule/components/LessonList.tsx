/**
 * Lesson List Component
 * Display and manage lesson instances with filters
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react';
import type { LessonInstance, LessonStatus } from '@/types/academic';
import { cn } from '@/lib/utils';

interface LessonListProps {
  lessons: LessonInstance[];
  isLoading?: boolean;
  onLessonClick?: (lesson: LessonInstance) => void;
  onComplete?: (lesson: LessonInstance) => void;
  onCancel?: (lesson: LessonInstance) => void;
  canComplete?: boolean;
  canCancel?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<LessonStatus, { label: string; color: string; icon: React.ReactNode }> = {
  planned: {
    label: 'Planned',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Clock className="h-3 w-3" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  isLoading,
  onLessonClick,
  onComplete,
  onCancel,
  canComplete = false,
  canCancel = false,
  className,
}) => {
  const [filterStatus, setFilterStatus] = useState<LessonStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = lessons.filter((lesson) => {
    // Status filter
    if (filterStatus !== 'all' && lesson.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lesson.subject_name?.toLowerCase().includes(query) ||
        lesson.class_name?.toLowerCase().includes(query) ||
        lesson.teacher_name?.toLowerCase().includes(query) ||
        lesson.topic_name?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    const date = lesson.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(lesson);
    return acc;
  }, {} as Record<string, LessonInstance[]>);

  const sortedDates = Object.keys(groupedLessons).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lessons</CardTitle>
          <Badge variant="outline">{filteredLessons.length} total</Badge>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? 'default' : 'outline'}
                onClick={() => setFilterStatus(status as LessonStatus)}
              >
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lessons found</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>

              <div className="space-y-2">
                {groupedLessons[date]
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((lesson) => {
                    const statusConfig = STATUS_CONFIG[lesson.status];

                    return (
                      <div
                        key={lesson.id}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                          'bg-white hover:bg-gray-50'
                        )}
                        onClick={() => onLessonClick?.(lesson)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={statusConfig.color}>
                                {statusConfig.icon}
                                <span className="ml-1">{statusConfig.label}</span>
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {lesson.start_time} - {lesson.end_time}
                              </span>
                            </div>

                            <div className="font-semibold text-lg mb-1">
                              {lesson.subject_name}
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Class: {lesson.class_name}</div>
                              <div>Teacher: {lesson.teacher_name}</div>
                              {lesson.room_name && <div>Room: {lesson.room_name}</div>}
                              {lesson.topic_name && (
                                <div className="mt-2">
                                  <Badge variant="secondary">Topic: {lesson.topic_name}</Badge>
                                </div>
                              )}
                              {lesson.notes && (
                                <div className="mt-2 text-xs italic">{lesson.notes}</div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {lesson.status === 'planned' && (
                            <div className="flex flex-col gap-2 ml-4">
                              {canComplete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onComplete?.(lesson);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                              {canCancel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCancel?.(lesson);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
