"use client";

import React from "react";
import Link from "next/link";
import {
  Target,
  ArrowLeft,
  PhoneCall,
  TrendingUp,
  UserCheck,
  UserX,
  Inbox,
} from "lucide-react";

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

// ── Kanban column ─────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    label: "Yangi lidlar",
    icon: Inbox,
    color: "bg-blue-500",
    lightBg: "bg-blue-50",
    textCls: "text-blue-700",
    count: 4,
    cards: [
      { nameW: "w-24", phoneW: "w-28", delay: 0   },
      { nameW: "w-20", phoneW: "w-24", delay: 80  },
      { nameW: "w-28", phoneW: "w-20", delay: 160 },
      { nameW: "w-22", phoneW: "w-32", delay: 240 },
    ],
  },
  {
    label: "Aloqa o'rnatildi",
    icon: PhoneCall,
    color: "bg-violet-500",
    lightBg: "bg-violet-50",
    textCls: "text-violet-700",
    count: 3,
    cards: [
      { nameW: "w-28", phoneW: "w-24", delay: 40  },
      { nameW: "w-20", phoneW: "w-28", delay: 120 },
      { nameW: "w-24", phoneW: "w-20", delay: 200 },
    ],
  },
  {
    label: "Sinov darsi",
    icon: UserCheck,
    color: "bg-orange-400",
    lightBg: "bg-orange-50",
    textCls: "text-orange-700",
    count: 2,
    cards: [
      { nameW: "w-24", phoneW: "w-20", delay: 60  },
      { nameW: "w-28", phoneW: "w-24", delay: 140 },
    ],
  },
  {
    label: "Qabul qilindi",
    icon: TrendingUp,
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    textCls: "text-emerald-700",
    count: 5,
    cards: [
      { nameW: "w-20", phoneW: "w-28", delay: 20  },
      { nameW: "w-28", phoneW: "w-24", delay: 100 },
      { nameW: "w-24", phoneW: "w-20", delay: 180 },
    ],
  },
];

function KanbanCard({ nameW, phoneW, delay }: { nameW: string; phoneW: string; delay: number }) {
  return (
    <div
      className="bg-white rounded-xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-2 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
        <div className={`h-3 ${nameW} bg-gray-100 rounded`} />
      </div>
      <div className={`h-2.5 ${phoneW} bg-gray-100 rounded`} />
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-12 bg-gray-100 rounded-full" />
        <div className="h-4 w-16 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/school"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Lidlar (CRM)</h1>
            <p className="text-xs text-gray-400">Potensial o'quvchilar boshqaruvi</p>
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
      <div className="relative rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-orange-500 p-8 overflow-hidden text-center text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: "500ms" }} />
        <div className="absolute top-4 left-1/3 w-20 h-20 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: "250ms" }} />

        <div className="relative z-10">
          <div
            className="text-5xl mb-4 inline-block animate-bounce"
            style={{ animationDuration: "1.4s" }}
          >
            🎯
          </div>
          <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-1">
            CRM tizimi qurilmoqda
            <Dots />
          </h2>
          <p className="text-rose-100 text-sm max-w-md mx-auto leading-relaxed">
            Potensial o'quvchilarni qabul qilishdan tortib, guruhga yozilgunga qadar
            bo'lgan barcha jarayonni kuzating.
          </p>
        </div>
      </div>

      {/* Mini stats — skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Jami lidlar",    icon: Target,    bg: "bg-rose-50",    ic: "text-rose-500",    delay: 0   },
          { label: "Bu oy kirdi",    icon: Inbox,     bg: "bg-blue-50",    ic: "text-blue-500",    delay: 80  },
          { label: "Qabul qilindi",  icon: UserCheck, bg: "bg-emerald-50", ic: "text-emerald-500", delay: 160 },
          { label: "Rad etildi",     icon: UserX,     bg: "bg-gray-50",    ic: "text-gray-400",    delay: 240 },
        ].map(({ label, icon: Icon, bg, ic, delay }) => (
          <div key={label} className="bg-white rounded-xl ring-1 ring-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${ic} animate-pulse`} style={{ animationDelay: `${delay}ms` }} />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-8 bg-gray-100 rounded animate-pulse" style={{ animationDelay: `${delay}ms` }} />
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban board — skeleton */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Pipeline (Kanban)
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {COLUMNS.map((col, ci) => {
            const Icon = col.icon;
            return (
              <div key={col.label} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                {/* Column header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-4 ${col.color} rounded-full`} />
                    <span className={`text-xs font-semibold ${col.textCls}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${col.lightBg} ${col.textCls}`}>
                    {col.count}
                  </span>
                </div>

                {/* Mock cards */}
                {col.cards.map((card, i) => (
                  <KanbanCard key={i} {...card} />
                ))}

                {/* Add placeholder */}
                <div
                  className="border border-dashed border-gray-200 rounded-xl p-3 flex items-center justify-center gap-1.5 text-gray-300 animate-pulse"
                  style={{ animationDelay: `${ci * 100 + 300}ms` }}
                >
                  <span className="text-lg">+</span>
                  <span className="text-xs">Lid qo'shish</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature preview */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Tez orada qo'shiladigan imkoniyatlar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              emoji: "📞",
              title: "Qo'ng'iroq tarixi",
              desc: "Har bir lid bilan muloqot tarixi va eslatmalar",
              from: "from-rose-50", border: "border-rose-100",
            },
            {
              emoji: "🔄",
              title: "Avtomatik statuslar",
              desc: "Sinov darsiga kelganda yoki to'lov qilganda status o'zgaradi",
              from: "from-orange-50", border: "border-orange-100",
            },
            {
              emoji: "📈",
              title: "Konversiya hisoboti",
              desc: "Liddan o'quvchiga o'tish foizi va manbalar tahlili",
              from: "from-pink-50", border: "border-pink-100",
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
