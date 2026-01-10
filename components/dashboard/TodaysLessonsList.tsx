import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, User, MapPin, Loader2 } from "lucide-react";
import type { TodaysLesson } from "@/types";

interface TodaysLessonsListProps {
  lessons: TodaysLesson[];
  isLoading?: boolean;
}

const statusConfig = {
  planned: { label: "Rejada", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "O'tib bormoqda", color: "bg-green-100 text-green-800" },
  completed: { label: "Tugallandi", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Bekor qilindi", color: "bg-red-100 text-red-800" },
};

function formatTime(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}

function getStatusConfig(status: string): (typeof statusConfig)[keyof typeof statusConfig] {
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;
}

export function TodaysLessonsList({ lessons, isLoading }: TodaysLessonsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Bugungi darslar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Bugungi darslar
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          Bugun darslar yo'q
        </CardContent>
      </Card>
    );
  }

  // Sort lessons by start time
  const sortedLessons = [...lessons].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Bugungi darslar ({lessons.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedLessons.map((lesson) => {
            const statusInfo = getStatusConfig(lesson.status);
            return (
              <div
                key={lesson.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Lesson Number */}
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg font-semibold text-blue-700">
                  {lesson.lesson_number}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 truncate">
                        {lesson.class_name || lesson.class_subject || "Dars"}
                      </h4>
                      {lesson.subject_name && (
                        <p className="text-sm text-gray-600 truncate">
                          {lesson.subject_name}
                        </p>
                      )}
                    </div>
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                      </span>
                    </div>

                    {lesson.teacher_name && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{lesson.teacher_name}</span>
                      </div>
                    )}

                    {lesson.room && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{lesson.room}</span>
                      </div>
                    )}

                    {lesson.topic && (
                      <div className="col-span-2 text-gray-700 font-medium">
                        Mavzu: {lesson.topic}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
