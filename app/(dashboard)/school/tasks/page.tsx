"use client";

import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  ArrowLeft,
  Bell,
  BarChart3,
  Users,
  Clock,
  CircleCheck,
  AlertCircle,
  Circle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ── Animated dots ─────────────────────────────────────────────────────────────

function Dots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

// ── Skeleton task row ─────────────────────────────────────────────────────────

const MOCK_TASKS = [
  { titleW: "w-52", metaW: "w-28", tag: "Bugun",   tagCls: "bg-red-100 text-red-600",    delay: 0   },
  { titleW: "w-64", metaW: "w-36", tag: "Ertaga",  tagCls: "bg-orange-100 text-orange-600", delay: 80  },
  { titleW: "w-44", metaW: "w-24", tag: "Bu hafta", tagCls: "bg-blue-100 text-blue-600",  delay: 160 },
  { titleW: "w-60", metaW: "w-32", tag: "Bajarildi", tagCls: "bg-emerald-100 text-emerald-600", delay: 240 },
  { titleW: "w-48", metaW: "w-20", tag: "Bugun",   tagCls: "bg-red-100 text-red-600",    delay: 320 },
];

function MockTaskRow({ titleW, metaW, tag, tagCls, delay }: typeof MOCK_TASKS[0]) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 border-b last:border-0 border-gray-50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Circle className="w-4 h-4 text-gray-200 shrink-0 animate-pulse" style={{ animationDelay: `${delay}ms` }} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className={`h-3.5 ${titleW} rounded bg-gray-100 animate-pulse`} style={{ animationDelay: `${delay}ms` }} />
        <div className={`h-2.5 ${metaW} rounded bg-gray-100 animate-pulse`} style={{ animationDelay: `${delay + 60}ms` }} />
      </div>
      <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse shrink-0" style={{ animationDelay: `${delay + 40}ms` }} />
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tagCls} opacity-60`}>{tag}</span>
    </div>
  );
}

// ── Stat skeleton ─────────────────────────────────────────────────────────────

const MOCK_STATS = [
  { label: "Bugungi",   icon: Clock,         iconCls: "text-orange-500", bg: "bg-orange-50" },
  { label: "Bajarildi", icon: CircleCheck,   iconCls: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "Kechikkan", icon: AlertCircle,   iconCls: "text-red-500",    bg: "bg-red-50" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/school"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Topshiriqlar</h1>
            <p className="text-xs text-gray-400">Task management tizimi</p>
          </div>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-xs font-semibold text-amber-700">Ishlanmoqda</span>
        </div>
      </div>

      {/* Construction hero */}
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 overflow-hidden text-center text-white shadow-lg">
        {/* BG circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />

        <div className="relative z-10">
          <div
            className="text-5xl mb-4 inline-block animate-bounce"
            style={{ animationDuration: "1.4s" }}
          >
            📋
          </div>
          <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-1">
            Topshiriqlar tizimi yaratilmoqda
            <Dots />
          </h2>
          <p className="text-blue-100 text-sm max-w-md mx-auto leading-relaxed">
            Xodimlar va guruhlar uchun topshiriq yaratish, muddatlarni belgilash
            va bajarilishini kuzatish tizimi tez orada tayyor bo'ladi.
          </p>
        </div>
      </div>

      {/* Stats row — skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {MOCK_STATS.map(({ label, icon: Icon, iconCls, bg }, i) => (
          <div
            key={label}
            className="bg-white rounded-xl ring-1 ring-gray-100 p-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${iconCls} animate-pulse`} style={{ animationDelay: `${i * 120}ms` }} />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-8 bg-gray-100 rounded animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mock task list */}
      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-8 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <CardContent className="p-0">
          {MOCK_TASKS.map((t, i) => (
            <MockTaskRow key={i} {...t} />
          ))}
        </CardContent>
      </Card>

      {/* Feature preview */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Tez orada qo'shiladigan imkoniyatlar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: CheckSquare,
              emoji: "✅",
              title: "Topshiriq yaratish",
              desc: "Xodim, guruh yoki sinfga topshiriq berish va muddatini belgilash",
              from: "from-blue-50", border: "border-blue-100",
            },
            {
              icon: BarChart3,
              emoji: "📊",
              title: "Holat kuzatuvi",
              desc: "Bajarilganlik foizi, vaqt jadval va hisobotlar",
              from: "from-violet-50", border: "border-violet-100",
            },
            {
              icon: Bell,
              emoji: "🔔",
              title: "Eslatmalar",
              desc: "Muddati yaqinlashganda SMS va ilova ichida xabarnomalar",
              from: "from-orange-50", border: "border-orange-100",
            },
          ].map((f, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${f.from} to-white border ${f.border} rounded-xl p-4`}
            >
              <span className="text-2xl">{f.emoji}</span>
              <p className="text-sm font-semibold text-gray-800 mt-2 mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
