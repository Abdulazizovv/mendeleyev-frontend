"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Play, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Loader2, TrendingDown, TrendingUp, SkipForward, XCircle,
  Calendar, User, RefreshCw, Info, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { BillingRun, BillingRunItem } from "@/types/finance";

// ── Helpers ───────────────────────────────────────────────────────────────────

const UZ_MONTHS: Record<string, string> = {
  "01":"Yanvar","02":"Fevral","03":"Mart","04":"Aprel","05":"May","06":"Iyun",
  "07":"Iyul","08":"Avgust","09":"Sentabr","10":"Oktabr","11":"Noyabr","12":"Dekabr",
};

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${UZ_MONTHS[mo] ?? mo} ${y}`;
}

function fmtDate(s: string) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
}

// ── Status chips ──────────────────────────────────────────────────────────────

const RUN_STATUS: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  running:   { label: "Ishlamoqda", cls: "bg-blue-50 text-blue-700 border-blue-200",     Icon: Loader2 },
  completed: { label: "Yakunlandi", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  failed:    { label: "Xato",       cls: "bg-red-50 text-red-700 border-red-200",         Icon: AlertCircle },
};

const ITEM_STATUS: Record<string, { label: string; cls: string; rowCls: string; Icon: React.ElementType }> = {
  charged:    { label: "To'landi",          cls: "bg-emerald-50 text-emerald-700 border-emerald-200", rowCls: "", Icon: TrendingUp },
  debt_added: { label: "Qarzga yozildi",    cls: "bg-red-50 text-red-700 border-red-200",            rowCls: "bg-red-50/30", Icon: TrendingDown },
  skipped:    { label: "O'tkazildi",        cls: "bg-slate-50 text-slate-500 border-slate-200",       rowCls: "opacity-60", Icon: SkipForward },
  error:      { label: "Xato",              cls: "bg-orange-50 text-orange-700 border-orange-200",    rowCls: "bg-orange-50/30", Icon: XCircle },
};

const PAGE_SIZE = 10;

// ── BillingRunCard ────────────────────────────────────────────────────────────

function BillingRunCard({ run }: { run: BillingRun }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const router = useRouter();

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["billing-run-detail", run.id],
    queryFn: () => financeApi.getBillingRunDetail(run.id, { branch_id: branchId }),
    enabled: expanded,
  });

  const st = RUN_STATUS[run.status] ?? RUN_STATUS.completed;
  const chargeRate = run.total_subscriptions > 0
    ? Math.round((run.charged_count / run.total_subscriptions) * 100)
    : 0;

  const allItems: BillingRunItem[] = detail?.items ?? [];
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
  const pagedItems = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-sm font-bold text-slate-900">{monthLabel(run.month)}</h3>
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-full", st.cls)}>
                <st.Icon className={cn("w-3 h-3", run.status === "running" && "animate-spin")} />
                {st.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {fmtDate(run.created_at)}
              {run.triggered_by_name && ` · ${run.triggered_by_name}`}
            </p>
          </div>
          <button
            onClick={() => { setExpanded(e => !e); setPage(1); }}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Summary stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-black text-emerald-700 tabular-nums">{run.charged_count}</p>
            <p className="text-[10px] text-emerald-600 font-medium">To'landi</p>
            <p className="text-[10px] text-emerald-500 tabular-nums">{formatCurrency(run.charged_amount)}</p>
          </div>
          <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-black text-red-600 tabular-nums">{run.debt_count}</p>
            <p className="text-[10px] text-red-500 font-medium">Qarz yozildi</p>
            <p className="text-[10px] text-red-400 tabular-nums">{formatCurrency(run.debt_amount)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-black text-slate-600 tabular-nums">{run.skipped_count}</p>
            <p className="text-[10px] text-slate-500 font-medium">O'tkazildi</p>
            <p className="text-[10px] text-slate-400 tabular-nums">{chargeRate}% yig'ildi</p>
          </div>
        </div>

        {/* Progress bar */}
        {run.total_subscriptions > 0 && (
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${chargeRate}%` }}
            />
          </div>
        )}
      </div>

      {/* Expanded: item list */}
      {expanded && (
        <div className="border-t border-slate-100">
          {detailLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-500">O'quvchi</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Abonement</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Natija</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Yechildi</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Qarz</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Balans (oldin→keyin)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((item: BillingRunItem) => {
                      const ist = ITEM_STATUS[item.status] ?? ITEM_STATUS.skipped;
                      return (
                        <tr key={item.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", ist.rowCls)}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-300 shrink-0" />
                              <button
                                onClick={() => router.push(`/school/students/${item.student_profile_id}`)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[140px] text-left"
                              >
                                {item.student_name}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 ml-[18px]">{item.student_personal_no}</p>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate">{item.subscription_plan}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full", ist.cls)}>
                              <ist.Icon className="w-2.5 h-2.5" />
                              {ist.label}
                            </span>
                            {item.reason && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.reason}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {item.charged_amount > 0
                              ? <span className="text-emerald-600 font-semibold">{formatCurrency(item.charged_amount)}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {item.debt_amount > 0
                              ? <span className="text-red-500 font-semibold">{formatCurrency(item.debt_amount)}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                            {formatCurrency(item.balance_before)}
                            {item.balance_before !== item.balance_after && (
                              <span className="text-emerald-600"> → {formatCurrency(item.balance_after)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {allItems.length === 0 && (
                  <p className="text-center py-8 text-sm text-slate-400">Ma'lumot yo'q</p>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, allItems.length)} / {allItems.length} o'quvchi
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pg = totalPages <= 7 ? i + 1
                        : page <= 4 ? i + 1
                        : page >= totalPages - 3 ? totalPages - 6 + i
                        : page - 3 + i;
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                            pg === page
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-200 text-slate-600"
                          )}
                        >
                          {pg}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── System Info ────────────────────────────────────────────────────────────────

function SystemInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-blue-800 flex-1">Billing tizimi qanday ishlaydi?</span>
        {open ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-xs text-blue-900 border-t border-blue-200 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="font-bold text-blue-700 mb-1.5">📋 Billing nima?</p>
              <p className="leading-relaxed text-slate-600">
                Billing — har oy o'quvchilarning abonement to'lovlarini avtomatik hisob-kitob qilish jarayoni.
                Har bir faol abonement uchun oy narxi o'quvchining balansidan yechiladi.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="font-bold text-blue-700 mb-1.5">⚡ Qanday ishlaydi?</p>
              <ol className="space-y-1 text-slate-600 list-decimal list-inside">
                <li>Oy tanlang va "Boshlash" tugmasini bosing</li>
                <li>Tizim barcha faol abonementlarni tekshiradi</li>
                <li>Balans yetarli → balansdan yechildi</li>
                <li>Balans yetarsiz → qarzga yozildi</li>
              </ol>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="font-bold text-blue-700 mb-1.5">✅ To'landi</p>
              <p className="text-slate-600">O'quvchi balansida yetarli mablag' bor edi va abonement narxi balansdan muvaffaqiyatli yechildi.</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="font-bold text-red-600 mb-1.5">❌ Qarzga yozildi</p>
              <p className="text-slate-600">O'quvchi balansida yetarli mablag' bo'lmadi. Abonement to'lovi qarzga o'tkazildi.</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="font-bold text-slate-600 mb-1.5">⏭ O'tkazildi</p>
              <p className="text-slate-600">O'quvchi faol emas, abonement tugagan yoki bu oy uchun allaqachon billing qilingan.</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="font-bold text-amber-600 mb-1.5">🔄 Qayta ishlash</p>
              <p className="text-slate-600">Allaqachon yakunlangan oy uchun "Qayta ishlash" ni bosish orqali billingni yana ishga tushirish mumkin.</p>
            </div>
          </div>
          <p className="text-[11px] text-blue-600 bg-blue-100 rounded-lg px-3 py-2">
            💡 Maslahat: Billing har oy oxirida yoki boshida o'tkazilishi tavsiya etiladi. O'quvchi balansiga avval to'lov kiritib, so'ng billing ishga tushiring.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const qc = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["billing-runs", branchId],
    queryFn: () => financeApi.getBillingRuns({ branch_id: branchId }),
    enabled: !!branchId,
    refetchInterval: (query) => {
      const data = query.state.data as BillingRun[] | undefined;
      return data?.some(r => r.status === "running") ? 3000 : false;
    },
  });

  const triggerMutation = useMutation({
    mutationFn: (force: boolean) =>
      financeApi.triggerBillingRun({ branch_id: branchId, month: selectedMonth, force }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing-runs", branchId] });
      setShowConfirm(false);
    },
  });

  const existingRun = runs.find(r => r.month === selectedMonth);
  const isCompleted = existingRun?.status === "completed";

  // Month options: last 6 months + current
  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Billing tizimi</h1>
            <p className="text-xs text-slate-400 mt-0.5">Oylik hisob-kitob boshqaruvi</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setShowConfirm(false); }}
              className="h-9 text-sm border border-slate-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthOptions.map(m => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={triggerMutation.isPending}
                className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {isCompleted ? "Qayta ishlatish" : "Boshlash"}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <p className="text-xs font-medium text-amber-800">
                  {isCompleted
                    ? `${monthLabel(selectedMonth)} allaqachon tugagan. Qayta ishlatilsinmi?`
                    : `${monthLabel(selectedMonth)} uchun billing boshlash?`}
                </p>
                <button
                  onClick={() => triggerMutation.mutate(isCompleted)}
                  disabled={triggerMutation.isPending}
                  className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {triggerMutation.isPending
                    ? <><Loader2 className="w-3 h-3 animate-spin" />Kutilmoqda...</>
                    : <><RefreshCw className="w-3 h-3" />Ha, boshlash</>}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                >
                  Bekor
                </button>
              </div>
            )}
          </div>
        </div>

        {triggerMutation.isError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {(triggerMutation.error as any)?.response?.data?.detail ?? "Xato yuz berdi"}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <SystemInfo />

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Hali billing o'tkazilmagan</p>
              <p className="text-xs text-slate-400 mt-1">Yuqoridagi "Boshlash" tugmasini bosing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map(run => <BillingRunCard key={run.id} run={run} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
