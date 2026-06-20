"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  TrendingUp, TrendingDown, ArrowRightLeft, CreditCard,
  Banknote, Wallet, RotateCcw, X, ArrowRight,
  GraduationCap, Users, Globe, Calendar, Hash,
  UserCheck, UserX, Building2, MessageSquare, LandmarkIcon,
} from "lucide-react";
import { cn, formatCurrency, fmtDate, fmtDateTime } from "@/lib/utils";
import type { Transaction } from "@/types/finance";

interface Props {
  tx: Transaction | null;
  onClose: () => void;
}

// ── Config maps ──────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, {
  label: string;
  Icon: React.ElementType;
  hdr: string;       // header bg
  iconBg: string;    // icon circle bg
  sign: "+" | "−" | "";
  amtCls: string;
}> = {
  income:   { label: "Kirim",      Icon: TrendingUp,      hdr: "bg-emerald-600", iconBg: "bg-emerald-500", sign: "+",  amtCls: "text-emerald-600" },
  payment:  { label: "To'lov",     Icon: CreditCard,      hdr: "bg-emerald-600", iconBg: "bg-emerald-500", sign: "+",  amtCls: "text-emerald-600" },
  expense:  { label: "Chiqim",     Icon: TrendingDown,    hdr: "bg-rose-600",    iconBg: "bg-rose-500",    sign: "−",  amtCls: "text-rose-600"    },
  salary:   { label: "Maosh",      Icon: Wallet,          hdr: "bg-amber-600",   iconBg: "bg-amber-500",   sign: "−",  amtCls: "text-amber-600"   },
  transfer: { label: "O'tkazma",   Icon: ArrowRightLeft,  hdr: "bg-blue-600",    iconBg: "bg-blue-500",    sign: "",   amtCls: "text-blue-600"    },
  refund:   { label: "Qaytarish",  Icon: RotateCcw,       hdr: "bg-orange-500",  iconBg: "bg-orange-400",  sign: "+",  amtCls: "text-orange-600"  },
};

const STATUS_CFG: Record<string, { label: string; dot: string; text: string }> = {
  completed: { label: "Bajarilgan",     dot: "bg-emerald-400", text: "text-emerald-100" },
  pending:   { label: "Kutilmoqda",     dot: "bg-yellow-400",  text: "text-yellow-100"  },
  cancelled: { label: "Bekor qilingan", dot: "bg-gray-400",    text: "text-gray-200"    },
  failed:    { label: "Xatolik",        dot: "bg-red-400",     text: "text-red-100"     },
};

const METHOD_CFG: Record<string, { label: string; Icon: React.ElementType }> = {
  cash: { label: "Naqd pul",      Icon: Banknote      },
  card: { label: "Plastik karta", Icon: CreditCard    },
  bank: { label: "Bank orqali",   Icon: LandmarkIcon  },
};

const MONTH_NAMES: Record<string, string> = {
  "01": "Yanvar", "02": "Fevral", "03": "Mart",    "04": "Aprel",
  "05": "May",    "06": "Iyun",   "07": "Iyul",    "08": "Avgust",
  "09": "Sentabr","10": "Oktabr", "11": "Noyabr",  "12": "Dekabr",
};

function fmtPeriodMonth(ym: string) {
  const [year, month] = ym.split("-");
  return `${MONTH_NAMES[month] ?? month} ${year}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass }: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      {Icon && (
        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}
      <span className="text-xs text-slate-400 min-w-[90px] shrink-0">{label}</span>
      <div className={cn("text-sm font-medium text-slate-800 ml-auto text-right", valueClass)}>
        {value}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TransactionDetailSheet({ tx, onClose }: Props) {
  if (!tx) return null;

  const cfg = TYPE_CFG[tx.transaction_type] ?? TYPE_CFG.income;
  const statusCfg = STATUS_CFG[tx.status] ?? STATUS_CFG.completed;
  const methodCfg = METHOD_CFG[tx.payment_method];
  const TypeIcon = cfg.Icon;

  const balanceBefore = tx.metadata?.balance_before;
  const balanceAfter  = tx.metadata?.balance_after;
  const hasBalance    = balanceBefore !== undefined && balanceAfter !== undefined;

  const isCancelled = tx.status === "cancelled";

  // Ko'p oylik yoki bitta oylik
  const periods: string[] =
    tx.period_months && tx.period_months.length > 0
      ? tx.period_months
      : tx.period_month
      ? [tx.period_month]
      : [];

  return (
    <Sheet open={!!tx} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" hideClose className="w-full sm:max-w-[400px] p-0 flex flex-col overflow-hidden">
        <SheetTitle className="sr-only">Tranzaksiya tafsiloti</SheetTitle>

        {/* ── Colored header ── */}
        <div className={cn("relative shrink-0 px-5 pt-5 pb-6", cfg.hdr, isCancelled && "opacity-60")}>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/25 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Label */}
          <p className="text-white/60 text-xs font-medium mb-3">Tranzaksiya tafsiloti</p>

          {/* Icon + amount */}
          <div className="flex items-end gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", cfg.iconBg)}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs mb-0.5">{cfg.label}</p>
              <p className="text-white font-bold text-3xl leading-none tabular-nums">
                {cfg.sign}{formatCurrency(tx.amount)}
              </p>
            </div>
          </div>

          {/* Status + date */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
              <span className={cn("text-xs font-medium", statusCfg.text)}>{statusCfg.label}</span>
            </div>
            <span className="text-white/30">·</span>
            <span className="text-white/50 text-xs">{fmtDateTime(tx.transaction_date)}</span>
          </div>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border-b border-red-100 shrink-0">
            <UserX className="w-4 h-4 text-red-500 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-red-700">Bekor qilingan</span>
              {tx.cancelled_by_info && (
                <span className="text-red-500"> · {tx.cancelled_by_info.full_name}</span>
              )}
              {tx.cancelled_at && (
                <span className="text-red-400 block">{fmtDateTime(tx.cancelled_at)}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 space-y-4">

            {/* Kassa balansi */}
            {hasBalance && (
              <div className="bg-white rounded-xl border border-slate-100 px-4 py-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                  Kassa balansi
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 mb-0.5">Oldingi</p>
                    <p className="text-sm font-bold text-slate-700 tabular-nums">{formatCurrency(balanceBefore)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="text-[10px] text-slate-400 mb-0.5">Keyingi</p>
                    <p className={cn(
                      "text-sm font-bold tabular-nums",
                      (balanceAfter ?? 0) >= (balanceBefore ?? 0) ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {formatCurrency(balanceAfter)}
                    </p>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums",
                    cfg.sign === "+" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {cfg.sign || "±"}{formatCurrency(tx.amount)}
                  </div>
                </div>
              </div>
            )}

            {/* To'lov ma'lumotlari */}
            <Section title="To'lov ma'lumotlari">
              {tx.category_name && (
                <InfoRow icon={Hash} label="Kategoriya" value={tx.category_name} />
              )}
              <InfoRow
                icon={methodCfg?.Icon ?? Banknote}
                label="Usul"
                value={methodCfg?.label ?? tx.payment_method_display}
              />
              <InfoRow icon={Building2} label="Kassa" value={tx.cash_register_name} />
              <InfoRow
                label="Sana"
                value={fmtDate(tx.transaction_date)}
              />
              {tx.reference_number && (
                <InfoRow
                  icon={Hash}
                  label="Referens"
                  value={
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {tx.reference_number}
                    </span>
                  }
                />
              )}
              {tx.description && (
                <InfoRow
                  icon={MessageSquare}
                  label="Izoh"
                  value={<span className="text-slate-600 text-xs leading-relaxed">{tx.description}</span>}
                />
              )}
            </Section>

            {/* O'quvchi / Xodim / Uchinchi shaxs */}
            {tx.student && (
              <Section title="O'quvchi">
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tx.student.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[
                        tx.student.personal_number ? `#${tx.student.personal_number}` : null,
                        tx.student.phone_number,
                      ].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {tx.student.current_class && (
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                      {tx.student.current_class.name}
                    </span>
                  )}
                </div>

                {/* To'lov oylari */}
                {periods.length > 0 && (
                  <div className="px-3.5 py-2.5 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {periods.length > 1 ? "To'lov oylari" : "To'lov oyi"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {periods.map((ym) => (
                        <span
                          key={ym}
                          className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg"
                        >
                          {fmtPeriodMonth(ym)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {tx.employee && (
              <Section title="Xodim">
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Users className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tx.employee.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[tx.employee.role_display, tx.employee.phone_number].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {tx.third_party_name && (
              <Section title="Uchinchi shaxs">
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Globe className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{tx.third_party_name}</p>
                </div>
              </Section>
            )}

            {/* Audit */}
            {tx.created_by_info && (
              <Section title="Audit">
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-xs text-slate-400 min-w-[70px] shrink-0">Yaratdi</span>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-medium text-slate-800">{tx.created_by_info.full_name}</p>
                    <p className="text-xs text-slate-400">{fmtDateTime(tx.created_at)}</p>
                  </div>
                </div>

                {isCancelled && tx.cancelled_by_info && (
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <UserX className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-xs text-slate-400 min-w-[70px] shrink-0">Bekor qildi</span>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-medium text-red-700">{tx.cancelled_by_info.full_name}</p>
                      {tx.cancelled_at && (
                        <p className="text-xs text-slate-400">{fmtDateTime(tx.cancelled_at)}</p>
                      )}
                    </div>
                  </div>
                )}
              </Section>
            )}

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
