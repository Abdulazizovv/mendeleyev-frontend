"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api";
import { scheduleApi } from "@/lib/features/schedule/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Users,
  MapPin,
  BarChart2,
} from "lucide-react";
import { formatCurrency } from "@/lib/translations";

export default function StudentDashboard() {
  const { user, currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id ?? "";
  const today = new Date().toISOString().split("T")[0];

  const { data: studentClass, isLoading: classLoading } = useQuery({
    queryKey: ["student-class", branchId],
    queryFn: () => schoolApi.getStudentClass({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const { data: subjectsRaw, isLoading: subjectsLoading } = useQuery({
    queryKey: ["student-subjects", branchId],
    queryFn: () => schoolApi.getStudentSubjects({ branch_id: branchId }),
    enabled: !!branchId,
  });

  const subjects = Array.isArray(subjectsRaw) ? subjectsRaw : [];

  // Today's lessons for this student's class
  const classId = studentClass?.id;
  const { data: todayLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["student-today-lessons", branchId, classId, today],
    queryFn: () =>
      scheduleApi.getLessonInstances(branchId, {
        date_from: today,
        date_to: today,
        class_id: classId,
      }),
    enabled: !!branchId && !!classId,
  });

  const lessons = todayLessons?.results ?? [];
  const balance = currentBranch?.balance;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">
          Salom, {user?.first_name || user?.phone_number}!
        </h1>
        {studentClass ? (
          <p className="text-sm text-gray-500">
            {studentClass.name} · {studentClass.academic_year_name}
          </p>
        ) : (
          <p className="text-sm text-gray-500">O'quvchi</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Fanlar",
            value: subjectsLoading ? null : subjects.length,
            sub: "Aktiv fan",
            icon: <BookOpen className="w-5 h-5 text-blue-600" />,
            bg: "bg-blue-50",
          },
          {
            label: "Sinfdoshlar",
            value: classLoading ? null : studentClass?.students_count ?? 0,
            sub: "Sinfda",
            icon: <Users className="w-5 h-5 text-green-600" />,
            bg: "bg-green-50",
          },
          {
            label: "Bugungi darslar",
            value: lessonsLoading ? null : lessons.length,
            sub: "Bugun",
            icon: <Calendar className="w-5 h-5 text-purple-600" />,
            bg: "bg-purple-50",
          },
          {
            label: "Balans",
            value:
              balance == null
                ? null
                : balance >= 0
                ? "✓"
                : "⚠",
            sub: balance != null ? formatCurrency(Math.abs(balance)) : "Ma'lumot yo'q",
            icon: <Wallet className="w-5 h-5 text-orange-600" />,
            bg: "bg-orange-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              {stat.value === null ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              )}
              <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today lessons + Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's lessons */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" /> Bugungi darslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessonsLoading || classLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Bugun dars yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <div className="text-xs font-mono text-gray-500 w-20 shrink-0">
                      {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lesson.subject_name ?? "Dars"}
                      </p>
                      <div className="flex flex-wrap gap-x-3 mt-0.5">
                        {lesson.teacher_name && (
                          <span className="text-xs text-gray-500">{lesson.teacher_name}</span>
                        )}
                        {lesson.room_name && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {lesson.room_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        lesson.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : lesson.status === "cancelled" || lesson.status === "canceled"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {lesson.status === "completed"
                        ? "Tugallangan"
                        : lesson.status === "cancelled" || lesson.status === "canceled"
                        ? "Bekor"
                        : lesson.lesson_number
                        ? `${lesson.lesson_number}-dars`
                        : "Rejalashtirilgan"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-500" /> Moliyaviy holat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balance != null ? (
              <div
                className={`flex items-center justify-between p-4 rounded-lg ${
                  balance >= 0 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {balance >= 0 ? "Balans" : "Qarzdorlik"}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      balance >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(Math.abs(balance))}
                  </p>
                </div>
                {balance >= 0 ? (
                  <CheckCircle2 className="w-10 h-10 text-green-300" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-300" />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Moliyaviy ma'lumot mavjud emas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subjects */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-500" /> Mening fanlarim
          </CardTitle>
          <Link href="/student/grades">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              Baholar <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Fan biriktirilmagan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sub.subject_name}
                    </p>
                    {sub.teacher_name && (
                      <p className="text-xs text-gray-500 truncate">{sub.teacher_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/student/grades">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart2 className="w-4 h-4" /> Baholarim
          </Button>
        </Link>
      </div>
    </div>
  );
}
