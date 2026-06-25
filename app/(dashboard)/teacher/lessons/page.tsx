"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth";
import { scheduleApi } from "@/lib/features/schedule/api";
import { useCompleteLesson, useCancelLesson } from "@/lib/features/schedule/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ClipboardList,
  MapPin,
  Users,
} from "lucide-react";
import type { LessonInstance } from "@/types/academic";

type DateTab = "today" | "week" | "month";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planned:    { label: "Rejalashtirilgan", color: "bg-blue-50 text-blue-700 border border-blue-200"    },
  in_progress:{ label: "Davom etmoqda",    color: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  completed:  { label: "Tugallangan",      color: "bg-green-50 text-green-700 border border-green-200"  },
  cancelled:  { label: "Bekor qilingan",   color: "bg-red-50 text-red-700 border border-red-200"        },
  canceled:   { label: "Bekor qilingan",   color: "bg-red-50 text-red-700 border border-red-200"        },
};

function getDateRange(tab: DateTab): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (tab === "today") {
    const s = fmt(now);
    return { from: s, to: s };
  }
  if (tab === "week") {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const mon = new Date(now);
    mon.setDate(now.getDate() - day);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: fmt(mon), to: fmt(sun) };
  }
  // month
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: fmt(first), to: fmt(last) };
}

export default function TeacherLessonsPage() {
  const router = useRouter();
  const { currentBranch } = useAuthStore();
  const branchId     = currentBranch?.branch_id ?? "";
  const membershipId = (currentBranch as any)?.id as string ?? "";

  const [tab, setTab] = useState<DateTab>("today");
  const [selected, setSelected] = useState<LessonInstance | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen,   setCancelOpen]   = useState(false);
  const [notes, setNotes] = useState("");

  const { from, to } = getDateRange(tab);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["teacher-lessons", branchId, membershipId, from, to],
    queryFn: () =>
      scheduleApi.getLessonInstances(branchId, {
        date_from: from,
        date_to:   to,
        teacher_id: membershipId,
      }),
    enabled: !!branchId && !!membershipId,
  });

  const lessons = data?.results ?? [];

  const completeLesson = useCompleteLesson(branchId);
  const cancelLesson   = useCancelLesson(branchId);

  const openComplete = (l: LessonInstance) => {
    setSelected(l);
    setNotes("");
    setCompleteOpen(true);
  };
  const openCancel = (l: LessonInstance) => {
    setSelected(l);
    setNotes("");
    setCancelOpen(true);
  };

  const confirmComplete = async () => {
    if (!selected) return;
    await completeLesson.mutateAsync({ id: selected.id, data: { notes } });
    setCompleteOpen(false);
    refetch();
  };

  const confirmCancel = async () => {
    if (!selected) return;
    await cancelLesson.mutateAsync({ id: selected.id, reason: notes });
    setCancelOpen(false);
    refetch();
  };

  const TAB_LABELS: Record<DateTab, string> = {
    today: "Bugun",
    week:  "Bu hafta",
    month: "Bu oy",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Darslarim</h1>
        <p className="text-sm text-gray-500">Darslarni ko'rish va davomat olish</p>
      </div>

      {/* Date tabs */}
      <div className="flex gap-2">
        {(["today", "week", "month"] as DateTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Lessons list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card className="border border-dashed border-gray-200 shadow-none">
          <CardContent className="py-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Bu davrda dars topilmadi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => {
            const st = STATUS_MAP[lesson.status] ?? {
              label: lesson.status,
              color: "bg-gray-50 text-gray-600 border border-gray-200",
            };
            const canComplete = lesson.status === "planned" || lesson.status === "in_progress";
            const canCancel   = lesson.status === "planned";
            const isAttendable = lesson.status === "planned" || lesson.status === "in_progress" || lesson.status === "completed";

            return (
              <div
                key={lesson.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
              >
                {/* Time */}
                <div className="flex items-center gap-2 sm:w-28 shrink-0">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-mono text-gray-600">
                    {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-semibold text-gray-900">
                      {lesson.subject_name ?? lesson.group_name ?? "Dars"}
                    </p>
                    {lesson.date && tab !== "today" && (
                      <span className="text-xs text-gray-400">{lesson.date}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {lesson.class_name && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {lesson.class_name}
                      </span>
                    )}
                    {lesson.group_name && !lesson.class_name && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {lesson.group_name}
                      </span>
                    )}
                    {lesson.room_name && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {lesson.room_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                  {isAttendable && (
                    <Link href={`/teacher/schedule/lessons/${lesson.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <ClipboardList className="w-3 h-3" /> Davomat
                      </Button>
                    </Link>
                  )}
                  {canComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50 gap-1"
                      onClick={() => openComplete(lesson)}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Tugatish
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50 gap-1"
                      onClick={() => openCancel(lesson)}
                    >
                      <XCircle className="w-3 h-3" /> Bekor
                    </Button>
                  )}
                  <Link href={`/teacher/schedule/lessons/${lesson.id}`}>
                    <ChevronRight className="w-4 h-4 text-gray-300 hover:text-blue-500" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Darsni tugatish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              {selected?.subject_name ?? selected?.group_name} ·{" "}
              {selected?.class_name ?? selected?.group_name}
            </p>
            <p className="text-sm text-gray-500">
              {selected?.date} · {selected?.start_time?.slice(0, 5)}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="complete-notes" className="text-sm">Izoh (ixtiyoriy)</Label>
              <Textarea
                id="complete-notes"
                placeholder="Dars haqida izoh..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Bekor</Button>
            <Button
              onClick={confirmComplete}
              disabled={completeLesson.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeLesson.isPending ? "Saqlanmoqda..." : "Tugatildi deb belgilash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Darsni bekor qilish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              {selected?.subject_name ?? selected?.group_name} ·{" "}
              {selected?.class_name ?? selected?.group_name}
            </p>
            <p className="text-sm text-gray-500">
              {selected?.date} · {selected?.start_time?.slice(0, 5)}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-sm">Sabab</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Nima sababdan bekor qilinmoqda?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Orqaga</Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelLesson.isPending}
            >
              {cancelLesson.isPending ? "Bekor qilinmoqda..." : "Bekor qilish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
