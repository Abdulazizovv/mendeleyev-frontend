"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useStudentReportCard } from "@/lib/features/grades/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, TrendingUp, Award, BarChart2 } from "lucide-react";

function getLetterGrade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "text-green-700 bg-green-100"  };
  if (score >= 75) return { letter: "B", color: "text-blue-700 bg-blue-100"    };
  if (score >= 60) return { letter: "C", color: "text-yellow-700 bg-yellow-100"};
  if (score >= 45) return { letter: "D", color: "text-orange-700 bg-orange-100"};
  return               { letter: "F", color: "text-red-700 bg-red-100"         };
}

export default function StudentGradesPage() {
  const { user } = useAuthStore();
  const [quarter, setQuarter] = useState(1);

  const studentId = user?.id ?? "";

  const { data: reportCard, isLoading } = useStudentReportCard(studentId, quarter);

  const grades = reportCard ?? [];

  const avgScore =
    grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + (g.average_score ?? 0), 0) / grades.length)
      : null;

  const QUARTER_LABELS: Record<number, string> = {
    1: "1-chorak",
    2: "2-chorak",
    3: "3-chorak",
    4: "4-chorak",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Baholarim</h1>
        <p className="text-sm text-gray-500">Fan bo'yicha baholash natijalari</p>
      </div>

      {/* Quarter selector */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((q) => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              quarter === q
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {QUARTER_LABELS[q]}
          </button>
        ))}
      </div>

      {/* Summary */}
      {!isLoading && grades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{grades.length}</div>
              <p className="text-xs text-gray-500 mt-0.5">Baholangan fanlar</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{avgScore ?? "—"}</div>
              <p className="text-xs text-gray-500 mt-0.5">O'rtacha ball</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {avgScore != null ? getLetterGrade(avgScore).letter : "—"}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Umumiy daraja</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades table */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            {QUARTER_LABELS[quarter]} natijalari
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Bu chorak uchun baho topilmadi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {grades.map((g) => {
                const pct = Math.round(g.average_score ?? 0);
                const { letter, color } = getLetterGrade(pct);
                return (
                  <div
                    key={g.subject_id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Subject */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {g.subject_name ?? "Fan"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {g.assessments_count ?? 0} ta baholash
                      </p>
                    </div>

                    {/* Score bar */}
                    <div className="hidden sm:flex items-center gap-2 w-40 shrink-0">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90
                              ? "bg-green-500"
                              : pct >= 75
                              ? "bg-blue-500"
                              : pct >= 60
                              ? "bg-yellow-500"
                              : pct >= 45
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-9 text-right">
                        {pct}%
                      </span>
                    </div>

                    {/* Letter grade */}
                    <span
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold shrink-0 ${color}`}
                    >
                      {letter}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance notes */}
      {!isLoading && grades.length > 0 && (
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" /> Tavsiyalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grades
              .filter((g) => (g.average_score ?? 0) >= 90)
              .map((g) => (
                <div key={g.subject_id} className="flex items-center gap-2 text-sm text-green-700">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{g.subject_name}</strong> fanida juda yaxshi natija!
                  </span>
                </div>
              ))}
            {grades
              .filter((g) => (g.average_score ?? 0) < 60)
              .map((g) => (
                <div key={g.subject_id} className="flex items-center gap-2 text-sm text-orange-700">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{g.subject_name}</strong> faniga ko'proq e'tibor bering.
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
