"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock, Save, Loader2, Calendar, Briefcase, AlertCircle,
  Building2, Package, BarChart3, BadgePercent, ArrowRight,
  RefreshCw, Coffee, GraduationCap, Wallet, CheckCircle2,
  ChevronRight, Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "@/lib/api/branch";
import type { BranchSettings, UpdateBranchSettingsPayload } from "@/types/school";
import { parse, addMinutes, format as fmtDate } from "date-fns";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: 1,  label: "Yanvar"  }, { value: 2,  label: "Fevral"  },
  { value: 3,  label: "Mart"    }, { value: 4,  label: "Aprel"   },
  { value: 5,  label: "May"     }, { value: 6,  label: "Iyun"    },
  { value: 7,  label: "Iyul"   }, { value: 8,  label: "Avgust"  },
  { value: 9,  label: "Sentabr" }, { value: 10, label: "Oktabr"  },
  { value: 11, label: "Noyabr"  }, { value: 12, label: "Dekabr"  },
];

const WEEK_DAYS = [
  { key: "monday",    short: "Du", full: "Dushanba"   },
  { key: "tuesday",   short: "Se", full: "Seshanba"   },
  { key: "wednesday", short: "Ch", full: "Chorshanba" },
  { key: "thursday",  short: "Pa", full: "Payshanba"  },
  { key: "friday",    short: "Ju", full: "Juma"       },
  { key: "saturday",  short: "Sh", full: "Shanba"     },
  { key: "sunday",    short: "Ya", full: "Yakshanba"  },
];

const NAV_ITEMS = [
  { id: "schedule", label: "Dars jadvali", icon: Clock,         color: "text-blue-600"  },
  { id: "academic", label: "Akademik yil", icon: GraduationCap, color: "text-violet-600"},
  { id: "finance",  label: "Moliya",       icon: Wallet,        color: "text-green-600" },
  { id: "salary",   label: "Maosh",        icon: Briefcase,     color: "text-orange-600"},
];

const FINANCE_LINKS = [
  { label: "Kassalar",            desc: "Naqd va karta kassalari",           href: "/school/finance/cash-registers",     icon: Building2,    bg: "bg-blue-50",   fg: "text-blue-600",    border: "border-blue-100"   },
  { label: "Abonement tariflari", desc: "O'quvchilar uchun to'lov rejalari", href: "/school/finance/subscription-plans", icon: Package,      bg: "bg-purple-50", fg: "text-purple-600",  border: "border-purple-100" },
  { label: "Kategoriyalar",       desc: "Kirim va chiqim turlari",           href: "/school/finance/categories",         icon: BarChart3,    bg: "bg-teal-50",   fg: "text-teal-600",    border: "border-teal-100"   },
  { label: "Chegirmalar",         desc: "Foiz yoki miqdor chegirmalari",     href: "/school/finance/discounts",          icon: BadgePercent, bg: "bg-amber-50",  fg: "text-amber-600",   border: "border-amber-100"  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function toHH(v: string | null | undefined): string {
  return v ? v.substring(0, 5) : "";
}

function toFull(v: string): string {
  return v.length === 5 ? v + ":00" : v;
}

interface PreviewSlot { num: number; start: string; end: string; }

function buildPreview(
  startTime: string, endTime: string,
  lessonMin: number, breakMin: number,
  lunchStart: string, lunchEnd: string,
  maxLessons: number,
): PreviewSlot[] {
  if (!startTime || !endTime || lessonMin < 1) return [];
  try {
    const start = parse(startTime, "HH:mm", new Date());
    const end   = parse(endTime,   "HH:mm", new Date());
    const lS = lunchStart ? parse(lunchStart, "HH:mm", new Date()) : null;
    const lE = lunchEnd   ? parse(lunchEnd,   "HH:mm", new Date()) : null;
    const slots: PreviewSlot[] = [];
    let cur = start, num = 1, lunchAdded = false;
    while (cur < end && num <= (maxLessons || 20)) {
      const slotEnd = addMinutes(cur, lessonMin);
      if (slotEnd > end) break;
      if (lS && lE && !lunchAdded && slotEnd > lS) {
        slots.push({ num: 0, start: fmtDate(lS, "HH:mm"), end: fmtDate(lE, "HH:mm") });
        lunchAdded = true;
        cur = lE;
        continue;
      }
      slots.push({ num, start: fmtDate(cur, "HH:mm"), end: fmtDate(slotEnd, "HH:mm") });
      num++;
      cur = addMinutes(slotEnd, breakMin);
    }
    return slots;
  } catch { return []; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, description, color,
}: { icon: React.ElementType; title: string; description?: string; color: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <Label className="text-sm font-medium text-gray-700">{children}</Label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function SaveRow({ pending, onClick, saved }: { pending: boolean; onClick: () => void; saved?: boolean }) {
  return (
    <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
      <Button
        onClick={onClick}
        disabled={pending}
        className={cn(
          "gap-2 min-w-[120px]",
          saved ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"
        )}
      >
        {pending ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" />Saqlandi</>
        ) : (
          <><Save className="w-4 h-4" />Saqlash</>
        )}
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BranchSettingsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id;

  const [activeSection, setActiveSection] = useState("schedule");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ["branch-settings", branchId],
    queryFn: () => branchApi.getBranchSettings(branchId!),
    enabled: !!branchId,
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBranchSettingsPayload) =>
      branchApi.updateBranchSettings(branchId!, data),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: ["branch-settings", branchId] });
      toast.success("Saqlandi");
      setLastSaved(activeSection);
      setTimeout(() => setLastSaved(null), 3000);
    },
    onError: (err: any) => {
      const d = err?.response?.data;
      if (d && typeof d === "object") {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("; ");
        toast.error(msgs || "Xatolik yuz berdi");
      } else {
        toast.error(d?.detail ?? "Xatolik yuz berdi");
      }
    },
  });

  // ── Form state ────────────────────────────────────────────────────────────
  const [sch, setSch] = useState({
    daily_lesson_start_time: "08:00",
    daily_lesson_end_time:   "17:00",
    lesson_duration_minutes: 45,
    break_duration_minutes:  10,
    lunch_break_start:       "",
    lunch_break_end:         "",
    max_lessons_per_day:     8,
    working_days:            ["monday","tuesday","wednesday","thursday","friday","saturday"] as string[],
  });

  const [acad, setAcad] = useState({ academic_year_start_month: 9, academic_year_end_month: 6 });

  const [fin, setFin] = useState({
    late_payment_penalty_percent:   "0.00",
    early_payment_discount_percent: "0.00",
  });

  const [sal, setSal] = useState({
    salary_calculation_time:    "00:00",
    auto_calculate_salary:      true,
    salary_calculation_day:     1,
    work_days_per_week:         6,
    work_hours_per_day:         8,
    enable_lesson_based_salary: false,
    enable_daily_salary_calc:   false,
  });

  useEffect(() => {
    if (!settings) return;
    setSch({
      daily_lesson_start_time: toHH(settings.daily_lesson_start_time) || toHH(settings.school_start_time) || "08:00",
      daily_lesson_end_time:   toHH(settings.daily_lesson_end_time)   || toHH(settings.school_end_time)   || "17:00",
      lesson_duration_minutes: settings.lesson_duration_minutes ?? 45,
      break_duration_minutes:  settings.break_duration_minutes  ?? 10,
      lunch_break_start:       toHH(settings.lunch_break_start) ?? "",
      lunch_break_end:         toHH(settings.lunch_break_end)   ?? "",
      max_lessons_per_day:     settings.max_lessons_per_day ?? 8,
      working_days:            settings.working_days?.length
        ? settings.working_days
        : ["monday","tuesday","wednesday","thursday","friday","saturday"],
    });
    setAcad({
      academic_year_start_month: settings.academic_year_start_month ?? 9,
      academic_year_end_month:   settings.academic_year_end_month   ?? 6,
    });
    setFin({
      late_payment_penalty_percent:   String(settings.late_payment_penalty_percent   ?? "0.00"),
      early_payment_discount_percent: String(settings.early_payment_discount_percent ?? "0.00"),
    });
    setSal({
      salary_calculation_time:    toHH(settings.salary_calculation_time) || "00:00",
      auto_calculate_salary:      settings.auto_calculate_salary ?? true,
      salary_calculation_day:     settings.salary_calculation_day ?? 1,
      work_days_per_week:         settings.work_days_per_week    ?? 6,
      work_hours_per_day:         settings.work_hours_per_day    ?? 8,
      enable_lesson_based_salary: settings.enable_lesson_based_salary ?? false,
      enable_daily_salary_calc:   settings.enable_daily_salary_calc   ?? false,
    });
  }, [settings]);

  const preview = useMemo(() =>
    buildPreview(
      sch.daily_lesson_start_time, sch.daily_lesson_end_time,
      sch.lesson_duration_minutes, sch.break_duration_minutes,
      sch.lunch_break_start, sch.lunch_break_end,
      sch.max_lessons_per_day,
    ), [sch]);

  const lessonCount = preview.filter(p => p.num > 0).length;

  const toggleDay = (day: string) =>
    setSch(p => ({
      ...p,
      working_days: p.working_days.includes(day)
        ? p.working_days.filter(d => d !== day)
        : [...p.working_days, day],
    }));

  const saveSchedule = () =>
    updateMutation.mutate({
      daily_lesson_start_time: toFull(sch.daily_lesson_start_time),
      daily_lesson_end_time:   toFull(sch.daily_lesson_end_time),
      school_start_time:       toFull(sch.daily_lesson_start_time),
      school_end_time:         toFull(sch.daily_lesson_end_time),
      lesson_duration_minutes: sch.lesson_duration_minutes,
      break_duration_minutes:  sch.break_duration_minutes,
      lunch_break_start:       sch.lunch_break_start ? toFull(sch.lunch_break_start) : null,
      lunch_break_end:         sch.lunch_break_end   ? toFull(sch.lunch_break_end)   : null,
      max_lessons_per_day:     sch.max_lessons_per_day,
      working_days:            sch.working_days,
    });

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500">Filial tanlanmagan</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-500">Sozlamalarni yuklashda xatolik</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Qayta urinish
        </Button>
      </div>
    );
  }

  const pending = updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50/40">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Filial sozlamalari</h1>
              <p className="text-xs text-gray-400">{settings?.branch_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar nav (desktop) ── */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0 sticky top-[72px]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Sozlamalar</p>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-600" : "text-gray-400")} />
                  {item.label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400" />}
                </button>
              );
            })}
          </aside>

          {/* ── Mobile nav (horizontal chips) ── */}
          <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 mb-4 overflow-x-auto">
            <div className="flex gap-2 pb-1 min-w-max">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ══════════ DARS JADVALI ══════════ */}
            {activeSection === "schedule" && (
              <div className="space-y-4">

                {/* Vaqtlar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader
                    icon={Clock}
                    color="bg-blue-50 text-blue-600"
                    title="Dars vaqtlari"
                    description="Kunlik birinchi va oxirgi dars vaqtlari"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel hint="1-dars boshlanadi">Boshlanish</FieldLabel>
                      <Input
                        type="time"
                        value={sch.daily_lesson_start_time}
                        onChange={e => setSch(p => ({ ...p, daily_lesson_start_time: e.target.value }))}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    <div>
                      <FieldLabel hint="Oxirgi dars tugaydi">Tugash</FieldLabel>
                      <Input
                        type="time"
                        value={sch.daily_lesson_end_time}
                        onChange={e => setSch(p => ({ ...p, daily_lesson_end_time: e.target.value }))}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Davomiylik */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader
                    icon={Clock}
                    color="bg-indigo-50 text-indigo-600"
                    title="Davomiylik"
                    description="Dars va tanaffus uzunligi"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FieldLabel hint="daqiqa">Dars davomiyligi</FieldLabel>
                      <div className="relative">
                        <Input
                          type="number" min={20} max={120}
                          value={sch.lesson_duration_minutes}
                          onChange={e => setSch(p => ({ ...p, lesson_duration_minutes: Math.max(20, Math.min(120, parseInt(e.target.value) || 45)) }))}
                          className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">daq</span>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="daqiqa">Tanaffus</FieldLabel>
                      <div className="relative">
                        <Input
                          type="number" min={0} max={60}
                          value={sch.break_duration_minutes}
                          onChange={e => setSch(p => ({ ...p, break_duration_minutes: Math.max(0, Math.min(60, parseInt(e.target.value) || 10)) }))}
                          className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">daq</span>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="maksimal">Darslar soni</FieldLabel>
                      <Input
                        type="number" min={1} max={20}
                        value={sch.max_lessons_per_day}
                        onChange={e => setSch(p => ({ ...p, max_lessons_per_day: Math.max(1, Math.min(20, parseInt(e.target.value) || 8)) }))}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Tushlik */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-2 mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">Tushlik tanaffusi</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Bo'sh qoldiring — tushlik bo'lmaydi</p>
                      </div>
                    </div>
                    {(sch.lunch_break_start || sch.lunch_break_end) && (
                      <button
                        onClick={() => setSch(p => ({ ...p, lunch_break_start: "", lunch_break_end: "" }))}
                        className="text-xs text-red-500 hover:text-red-700 shrink-0 mt-1"
                      >
                        Tozalash
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Boshlanish</FieldLabel>
                      <Input
                        type="time"
                        value={sch.lunch_break_start}
                        onChange={e => setSch(p => ({ ...p, lunch_break_start: e.target.value }))}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    <div>
                      <FieldLabel>Tugash</FieldLabel>
                      <Input
                        type="time"
                        value={sch.lunch_break_end}
                        onChange={e => setSch(p => ({ ...p, lunch_break_end: e.target.value }))}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                  </div>
                  {sch.lunch_break_start && !sch.lunch_break_end && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Tugash vaqtini ham kiriting
                    </p>
                  )}
                </div>

                {/* Ish kunlari */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader
                    icon={Calendar}
                    color="bg-green-50 text-green-600"
                    title="Ish kunlari"
                    description={`${sch.working_days.length} kun tanlangan`}
                  />
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {WEEK_DAYS.map(d => {
                      const active = sch.working_days.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          onClick={() => toggleDay(d.key)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 rounded-xl py-2.5 px-1 text-center transition-all border",
                            active
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                          )}
                        >
                          <span className="text-[13px] font-semibold">{d.short}</span>
                          <span className={cn("text-[9px] hidden sm:block", active ? "text-indigo-200" : "text-gray-400")}>
                            {d.full.slice(0, 4)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live preview */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 rounded-2xl border border-indigo-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-indigo-800">Jadval ko'rinishi</h3>
                    <span className="text-xs text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
                      {lessonCount} ta dars
                    </span>
                  </div>
                  {preview.length === 0 ? (
                    <p className="text-sm text-indigo-400 text-center py-4">Vaqtlarni to'ldiring</p>
                  ) : (
                    <div className="space-y-1.5">
                      {preview.map((slot, i) =>
                        slot.num === 0 ? (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-amber-100/70 border border-amber-200/60 text-amber-700 rounded-xl px-3 py-2 text-xs"
                          >
                            <Coffee className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium">Tushlik tanaffusi</span>
                            <span className="ml-auto font-mono text-amber-600">{slot.start} – {slot.end}</span>
                          </div>
                        ) : (
                          <div
                            key={i}
                            className="flex items-center bg-white/80 border border-indigo-100 rounded-xl px-3 py-2 text-xs shadow-sm"
                          >
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                              {slot.num}
                            </span>
                            <span className="ml-2.5 text-gray-600">-dars</span>
                            <span className="ml-auto font-mono text-gray-500 tabular-nums">{slot.start} – {slot.end}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <SaveRow pending={pending} onClick={saveSchedule} saved={lastSaved === "schedule"} />
              </div>
            )}

            {/* ══════════ AKADEMIK ══════════ */}
            {activeSection === "academic" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionHeader
                  icon={GraduationCap}
                  color="bg-violet-50 text-violet-600"
                  title="Akademik yil"
                  description="O'quv yilining boshlanish va tugash oylari"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel hint="Standart: Sentabr">Boshlanish oyi</FieldLabel>
                    <Select
                      value={String(acad.academic_year_start_month)}
                      onValueChange={v => setAcad(p => ({ ...p, academic_year_start_month: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel hint="Standart: Iyun">Tugash oyi</FieldLabel>
                    <Select
                      value={String(acad.academic_year_end_month)}
                      onValueChange={v => setAcad(p => ({ ...p, academic_year_end_month: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                  <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
                  <p className="text-sm text-violet-800">
                    O'quv yili:{" "}
                    <strong>{MONTHS.find(m => m.value === acad.academic_year_start_month)?.label}</strong>
                    {" – "}
                    <strong>{MONTHS.find(m => m.value === acad.academic_year_end_month)?.label}</strong>
                  </p>
                </div>

                <SaveRow
                  pending={pending}
                  onClick={() => updateMutation.mutate(acad)}
                  saved={lastSaved === "academic"}
                />
              </div>
            )}

            {/* ══════════ MOLIYA ══════════ */}
            {activeSection === "finance" && (
              <div className="space-y-4">

                {/* Currency info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader
                    icon={Wallet}
                    color="bg-green-50 text-green-600"
                    title="Valyuta"
                    description="Moliyaviy hisob-kitoblarda ishlatiladi"
                  />
                  <div className="flex items-center gap-6">
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Kod</p>
                      <p className="text-2xl font-bold text-gray-800">{settings?.currency || "UZS"}</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Belgi</p>
                      <p className="text-2xl font-bold text-gray-800">{settings?.currency_symbol || "so'm"}</p>
                    </div>
                  </div>
                </div>

                {/* To'lov sozlamalari */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader
                    icon={BadgePercent}
                    color="bg-orange-50 text-orange-600"
                    title="To'lov sozlamalari"
                    description="Jarima va chegirma foizlari"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel hint="To'lov kechiktirilsa">Kechikish jarimasi</FieldLabel>
                      <div className="relative">
                        <Input
                          type="number" step="0.01" min="0" max="100"
                          value={fin.late_payment_penalty_percent}
                          onChange={e => setFin(p => ({ ...p, late_payment_penalty_percent: e.target.value }))}
                          className="pr-8 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="Muddatidan avval to'lansa">Erta to'lash chegirmasi</FieldLabel>
                      <div className="relative">
                        <Input
                          type="number" step="0.01" min="0" max="100"
                          value={fin.early_payment_discount_percent}
                          onChange={e => setFin(p => ({ ...p, early_payment_discount_percent: e.target.value }))}
                          className="pr-8 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Namuna */}
                  {(parseFloat(fin.late_payment_penalty_percent) > 0 || parseFloat(fin.early_payment_discount_percent) > 0) && (
                    <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-3 text-sm space-y-1">
                      <p className="text-xs font-semibold text-green-700 mb-2">Namuna: 1 000 000 so'm uchun</p>
                      {parseFloat(fin.late_payment_penalty_percent) > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Kechikish jarimasi</span>
                          <span className="font-semibold text-red-600">
                            +{(1_000_000 * parseFloat(fin.late_payment_penalty_percent) / 100).toLocaleString()} so'm
                          </span>
                        </div>
                      )}
                      {parseFloat(fin.early_payment_discount_percent) > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Erta to'lash chegirmasi</span>
                          <span className="font-semibold text-green-600">
                            −{(1_000_000 * parseFloat(fin.early_payment_discount_percent) / 100).toLocaleString()} so'm
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <SaveRow
                    pending={pending}
                    onClick={() => updateMutation.mutate(fin)}
                    saved={lastSaved === "finance"}
                  />
                </div>

                {/* Moliya bo'limlari */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3 px-1">Moliya konfiguratsiyasi</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FINANCE_LINKS.map(item => (
                      <Link key={item.href} href={item.href}>
                        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all group cursor-pointer">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", item.bg, item.fg, item.border)}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ MAOSH ══════════ */}
            {activeSection === "salary" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <SectionHeader
                  icon={Briefcase}
                  color="bg-orange-50 text-orange-600"
                  title="Maosh sozlamalari"
                  description="Avtomatik maosh hisoblash rejimi"
                />

                {/* Toggles */}
                <div className="space-y-3 mb-5">
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-colors",
                    sal.auto_calculate_salary ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-200"
                  )}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Avtomatik hisoblash</p>
                      <p className="text-xs text-gray-500 mt-0.5">Har kuni belgilangan vaqtda ishga tushadi</p>
                    </div>
                    <Switch
                      checked={sal.auto_calculate_salary}
                      onCheckedChange={v => setSal(p => ({ ...p, auto_calculate_salary: v }))}
                    />
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-colors",
                    sal.enable_lesson_based_salary ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-200"
                  )}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Darsga asoslangan maosh</p>
                      <p className="text-xs text-gray-500 mt-0.5">O'quvchi to'loviga bog'liq holda o'qituvchi maoshi hisoblanadi</p>
                    </div>
                    <Switch
                      checked={sal.enable_lesson_based_salary}
                      onCheckedChange={v => setSal(p => ({ ...p, enable_lesson_based_salary: v }))}
                    />
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-colors",
                    sal.enable_daily_salary_calc ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-200"
                  )}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Kunlik maosh hisoblash</p>
                      <p className="text-xs text-gray-500 mt-0.5">Oylik/soatlik xodimlar uchun har kuni belgilangan ulush yoziladi</p>
                    </div>
                    <Switch
                      checked={sal.enable_daily_salary_calc}
                      onCheckedChange={v => setSal(p => ({ ...p, enable_daily_salary_calc: v }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <FieldLabel hint="Kunlik avtomatik vaqt">Hisoblash vaqti</FieldLabel>
                    <Input
                      type="time"
                      value={sal.salary_calculation_time}
                      onChange={e => setSal(p => ({ ...p, salary_calculation_time: e.target.value }))}
                      disabled={!sal.auto_calculate_salary}
                      className="bg-gray-50 border-gray-200 focus:bg-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <FieldLabel hint="Oyning 1–31 kuni">To'lov kuni</FieldLabel>
                    <div className="relative">
                      <Input
                        type="number" min={1} max={31}
                        value={sal.salary_calculation_day}
                        onChange={e => setSal(p => ({ ...p, salary_calculation_day: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) }))}
                        className="pr-12 bg-gray-50 border-gray-200 focus:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">-kun</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 mb-1">
                  <p className="text-sm font-medium text-gray-700 mb-4">Ish rejimi</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel hint="Haftada necha kun">Ish kunlari</FieldLabel>
                      <div className="relative">
                        <Input
                          type="number" min={1} max={7}
                          value={sal.work_days_per_week}
                          onChange={e => setSal(p => ({ ...p, work_days_per_week: Math.max(1, Math.min(7, parseInt(e.target.value) || 5)) }))}
                          className="pr-14 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kun/hafta</span>
                      </div>
                    </div>
                    <div>
                      <FieldLabel hint="Kunlik ish soati">Ish soatlari</FieldLabel>
                      <div className="relative">
                        <Input
                          type="number" min={1} max={24}
                          value={sal.work_hours_per_day}
                          onChange={e => setSal(p => ({ ...p, work_hours_per_day: Math.max(1, Math.min(24, parseInt(e.target.value) || 8)) }))}
                          className="pr-14 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">soat/kun</span>
                      </div>
                    </div>
                  </div>
                </div>

                <SaveRow
                  pending={pending}
                  onClick={() => updateMutation.mutate({
                    salary_calculation_time:    toFull(sal.salary_calculation_time),
                    auto_calculate_salary:      sal.auto_calculate_salary,
                    salary_calculation_day:     sal.salary_calculation_day,
                    work_days_per_week:         sal.work_days_per_week,
                    work_hours_per_day:         sal.work_hours_per_day,
                    enable_lesson_based_salary: sal.enable_lesson_based_salary,
                    enable_daily_salary_calc:   sal.enable_daily_salary_calc,
                  })}
                  saved={lastSaved === "salary"}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
