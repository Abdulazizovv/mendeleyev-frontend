"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, formatDateUz } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, User, Package, XCircle,
  ArrowRightLeft, Users, Hash, ChevronRight,
  GraduationCap, Wallet, AlertCircle, MapPin, Calendar,
  Clock, Tag, Receipt, Banknote, CreditCard, Building2,
  TrendingUp, TrendingDown, RotateCcw, UserX, UserPlus,
  ArrowUpCircle, ArrowDownCircle, FileText, File, ImageIcon,
  Upload, Trash2, Download, Activity, Plus, Edit2, Loader2,
  User2, Shield,
} from "lucide-react";
import { TransactionDetailSheet } from "@/components/finance/transactions/TransactionDetailSheet";
import { cn } from "@/lib/utils";
import type { Transaction, StudentBalanceTransaction } from "@/types/finance";
import type { StudentDocument, StudentActivityLog, CreateStudentRequest, StudentRelative, RelationshipType, CreateStudentRelativeRequest } from "@/types/school";

// ─────────────────────────────────── helpers ──────────────────────────────────

function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  const suffix = d.startsWith("998") ? d.slice(3) : d.startsWith("8") ? d.slice(1) : d;
  const parts = [suffix.slice(0, 2), suffix.slice(2, 5), suffix.slice(5, 7), suffix.slice(7, 9)].filter(Boolean);
  return "+998 " + parts.join(" ");
}

const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];
const UZ_MONTHS_MAP: Record<string, string> = {
  "01":"Yanvar","02":"Fevral","03":"Mart","04":"Aprel","05":"May","06":"Iyun",
  "07":"Iyul","08":"Avgust","09":"Sentabr","10":"Oktabr","11":"Noyabr","12":"Dekabr",
};

function formatMonth(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : `${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateFull(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatPeriodMonth(periodMonth?: string | null): string {
  if (!periodMonth) return "—";
  const [y, m] = periodMonth.split("-");
  return `${UZ_MONTHS[parseInt(m) - 1]} ${y}`;
}

function fmtPeriod(ym: string) {
  const [y, m] = ym.split("-");
  return `${UZ_MONTHS_MAP[m] ?? m} ${y}`;
}

// ─────────────────────────────────── config ───────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; btnColor: string; actionLabel: string; description: string; destructive: boolean }> = {
  active:      { label: "Aktiv",        color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700", actionLabel: "Faollashtirish",      description: "O'quvchi faol holda davom etadi",                           destructive: false },
  archived:    { label: "Arxivlangan",  color: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400",   btnColor: "bg-gray-600 hover:bg-gray-700 text-white border-gray-700",         actionLabel: "Arxivlash",            description: "O'quvchi arxivga o'tkaziladi, ko'rinmaydi",                 destructive: true  },
  suspended:   { label: "To'xtatilgan", color: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500",    btnColor: "bg-red-600 hover:bg-red-700 text-white border-red-700",             actionLabel: "To'xtatish",           description: "O'quvchi vaqtincha to'xtatiladi",                           destructive: true  },
  graduated:   { label: "Bitirgan",     color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500",   btnColor: "bg-blue-600 hover:bg-blue-700 text-white border-blue-700",          actionLabel: "Bitirgan deb belgilash", description: "O'quvchi maktabni tamomlagan deb belgilanadi",              destructive: true  },
  transferred: { label: "Ko'chirilgan", color: "bg-orange-50 text-orange-700 border-orange-200",    dot: "bg-orange-500", btnColor: "bg-orange-600 hover:bg-orange-700 text-white border-orange-700",    actionLabel: "Ko'chirilgan belgilash", description: "O'quvchi boshqa muassasaga o'tkazilgan deb belgilanadi",   destructive: true  },
};

const GENDER_MAP: Record<string, string> = {
  male: "Erkak", female: "Ayol", other: "Boshqa", unspecified: "Belgilanmagan",
};

const REL_MAP: Record<string, string> = {
  father: "Ota", mother: "Ona", brother: "Aka/Uka", sister: "Opa/Singil",
  grandfather: "Bobo", grandmother: "Buvi", uncle: "Amaki/Togʻa", aunt: "Xola/Amma", guardian: "Vasiy", other: "Boshqa",
};

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: "father",      label: "Ota" },
  { value: "mother",      label: "Ona" },
  { value: "brother",     label: "Aka/Uka" },
  { value: "sister",      label: "Opa/Singil" },
  { value: "grandfather", label: "Bobo" },
  { value: "grandmother", label: "Buvi" },
  { value: "uncle",       label: "Amaki/Togʻa" },
  { value: "aunt",        label: "Xola/Amma" },
  { value: "guardian",    label: "Vasiy" },
  { value: "other",       label: "Boshqa" },
];

const TX_ICON_CFG: Record<string, { iconBg: string; iconCls: string; Icon: React.ElementType; sign: string; amtCls: string }> = {
  income:   { iconBg: "bg-emerald-50", iconCls: "text-emerald-600", Icon: TrendingUp,     sign: "+", amtCls: "text-emerald-600" },
  payment:  { iconBg: "bg-emerald-50", iconCls: "text-emerald-600", Icon: TrendingUp,     sign: "+", amtCls: "text-emerald-600" },
  refund:   { iconBg: "bg-orange-50",  iconCls: "text-orange-500",  Icon: RotateCcw,      sign: "+", amtCls: "text-orange-600" },
  expense:  { iconBg: "bg-rose-50",    iconCls: "text-rose-500",    Icon: TrendingDown,   sign: "−", amtCls: "text-rose-600"   },
  salary:   { iconBg: "bg-amber-50",   iconCls: "text-amber-600",   Icon: TrendingDown,   sign: "−", amtCls: "text-amber-600"  },
  transfer: { iconBg: "bg-blue-50",    iconCls: "text-blue-600",    Icon: ArrowRightLeft, sign: "⇄", amtCls: "text-blue-600"  },
};

const METHOD_BADGE: Record<string, { Icon: React.ElementType; cls: string; label: string }> = {
  cash: { Icon: Banknote,   cls: "bg-amber-50 text-amber-700 border-amber-200",     label: "Naqd"    },
  card: { Icon: CreditCard, cls: "bg-blue-50 text-blue-700 border-blue-200",        label: "Plastik" },
  bank: { Icon: Building2,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Bank"  },
};

const BAL_REASON_CFG: Record<string, { label: string; cls: string }> = {
  subscription_charge: { label: "Abonement yechimi", cls: "bg-red-50 text-red-700 border-red-200" },
  payment_topup:       { label: "To'lov (balans)",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  manual_adjustment:   { label: "Qo'lda",            cls: "bg-blue-50 text-blue-700 border-blue-200" },
  other:               { label: "Boshqa",             cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

// ─────────────────────────────────── components ───────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({
  icon: Icon, label, value, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  onClick?: () => void;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-none mb-1">{label}</p>
        {onClick ? (
          <button
            onClick={onClick}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2 transition-colors text-left"
          >
            {value}
          </button>
        ) : (
          <p className="text-sm font-semibold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

// ── Transaction table row ─────────────────────────────────────────────────────

function TxRow({ tx, onOpen }: { tx: any; onOpen: (tx: any) => void }) {
  const cfg = TX_ICON_CFG[tx.transaction_type] ?? TX_ICON_CFG.income;
  const method = METHOD_BADGE[tx.payment_method as string];
  const isCancelled = tx.status === "cancelled";
  const periods: string[] = tx.period_months?.length > 0 ? tx.period_months : tx.period_month ? [tx.period_month] : [];

  return (
    <tr
      onClick={() => onOpen(tx)}
      className={cn("hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0", isCancelled && "opacity-60")}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.iconBg)}>
            <cfg.Icon className={cn("w-3.5 h-3.5", cfg.iconCls)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-gray-800 truncate">
                {tx.category?.name ?? tx.transaction_type_display ?? cfg.sign}
              </span>
              {isCancelled && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                  <UserX className="w-2.5 h-2.5" />Bekor
                </span>
              )}
            </div>
            {periods.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                {periods.map((ym) => (
                  <span key={ym} className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                    {fmtPeriod(ym)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-[11px] text-gray-500">{tx.transaction_date ? formatDateUz(tx.transaction_date) : "—"}</span>
      </td>
      <td className="px-3 py-3">
        {method && (
          <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium border px-1.5 py-0.5 rounded-full", method.cls)}>
            <method.Icon className="w-2.5 h-2.5" />
            {method.label}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <p className={cn("text-sm font-bold tabular-nums", cfg.amtCls)}>
          {cfg.sign}{formatCurrency(Math.abs(tx.amount))}
        </p>
      </td>
    </tr>
  );
}

// ── Unified Transactions Section (Balance Audit) ─────────────────────────────

const REASON_LABEL: Record<string, string> = {
  subscription_charge: "Abonement yechimi",
  payment_topup:       "To'lov (kirim)",
  manual_adjustment:   "Qo'lda kiritilgan",
  other:               "Boshqa",
};

const FILTER_REASONS = [
  { value: "all",                 label: "Barcha sabablar" },
  { value: "subscription_charge", label: "Abonement yechimi" },
  { value: "payment_topup",       label: "To'lov (kirim)" },
  { value: "manual_adjustment",   label: "Qo'lda kiritilgan" },
];

function formatDateTime(dt?: string | null): string {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function whoLabel(tx: StudentBalanceTransaction): string {
  if (tx.reason === "subscription_charge") return "Billing tizimi";
  if (tx.processed_by_phone) return formatPhoneDisplay(tx.processed_by_phone);
  return "Tizim";
}

function TransactionsSection({ studentId }: { studentId: string }) {
  const PAGE_SIZE = 10;
  const [page, setPage] = React.useState(1);
  const [filterType, setFilterType] = React.useState("all");
  const [filterReason, setFilterReason] = React.useState("all");

  const { data: balancesData } = useQuery({
    queryKey: ["student-balance-record", studentId],
    queryFn: () => financeApi.getStudentBalances({ student_profile: studentId }),
    enabled: !!studentId,
  });
  const balanceId: string | null = (balancesData as any)?.results?.[0]?.id ?? null;
  const currentBalance: number = (balancesData as any)?.results?.[0]?.balance ?? 0;

  const { data: allTxs = [], isLoading } = useQuery<StudentBalanceTransaction[]>({
    queryKey: ["student-balance-tx", balanceId],
    queryFn: () => financeApi.getStudentBalanceTransactions(balanceId!, { ordering: "-occurred_at" }),
    enabled: !!balanceId,
  });

  const filtered = (allTxs as StudentBalanceTransaction[]).filter(tx => {
    if (filterType !== "all" && tx.transaction_type !== filterType) return false;
    if (filterReason !== "all" && tx.reason !== filterReason) return false;
    return true;
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedTxs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterType = (v: string) => { setFilterType(v); setPage(1); };
  const handleFilterReason = (v: string) => { setFilterReason(v); setPage(1); };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">Tranzaksiyalar</span>
        {(allTxs as any[]).length > 0 && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {(allTxs as any[]).length}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-wrap">
        <select
          value={filterType}
          onChange={e => handleFilterType(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-gray-400 cursor-pointer"
        >
          <option value="all">Barcha turlar</option>
          <option value="credit">Kirim (+)</option>
          <option value="debit">Chiqim (−)</option>
        </select>
        <select
          value={filterReason}
          onChange={e => handleFilterReason(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-gray-400 cursor-pointer"
        >
          {FILTER_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {(filterType !== "all" || filterReason !== "all") && (
          <>
            <button
              onClick={() => { setFilterType("all"); setFilterReason("all"); setPage(1); }}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Tozalash ×
            </button>
            <span className="text-[11px] text-gray-400 ml-auto">{totalCount} ta natija</span>
          </>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : !balanceId || (allTxs as any[]).length === 0 ? (
        <div className="py-10 text-center">
          <ArrowRightLeft className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Tranzaksiyalar yo&apos;q</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">Filter bo&apos;yicha natija yo&apos;q</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-[11px] uppercase tracking-wide">
                  <th className="px-3 py-2.5 text-center w-9">#</th>
                  <th className="px-3 py-2.5 text-left">Sana va vaqt</th>
                  <th className="px-3 py-2.5 text-left">Sabab</th>
                  <th className="px-3 py-2.5 text-left">Tafsilot</th>
                  <th className="px-3 py-2.5 text-right">Summa</th>
                  <th className="px-3 py-2.5 text-left">Balans o&apos;zgarishi</th>
                  <th className="px-4 py-2.5 text-left">Kim tomonidan</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTxs.map((tx, idx) => {
                  const isCredit = tx.transaction_type === "credit";
                  const meta = tx.metadata as any;
                  const billingMonth = meta?.year && meta?.month
                    ? `${UZ_MONTHS_MAP[String(meta.month).padStart(2, "0")] ?? meta.month} ${meta.year}`
                    : null;
                  const reasonLabel = REASON_LABEL[tx.reason] ?? "Boshqa";
                  const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                      <td className="px-3 py-3 text-center">
                        <span className="text-[11px] text-gray-300 tabular-nums">{globalIdx}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-gray-500 font-mono">{formatDateTime(tx.occurred_at)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-medium text-gray-700">{reasonLabel}</p>
                      </td>
                      <td className="px-3 py-3">
                        {billingMonth ? (
                          <p className="text-xs text-gray-500">{billingMonth} uchun</p>
                        ) : tx.description ? (
                          <p className="text-xs text-gray-500">{tx.description}</p>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          isCredit ? "text-emerald-600" : "text-red-500"
                        )}>
                          {isCredit ? "+" : "−"}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-gray-400 tabular-nums font-mono">
                          {formatCurrency(tx.previous_balance)}
                        </span>
                        <span className="text-[11px] text-gray-300 mx-1">→</span>
                        <span className="text-[11px] text-gray-600 tabular-nums font-mono font-medium">
                          {formatCurrency(tx.new_balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-gray-500">{whoLabel(tx)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{page} / {totalPages} sahifa · {totalCount} ta</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Oldingi
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Keyingi →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Document type config ─────────────────────────────────────────────────────

const DOC_TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; cls: string }> = {
  passport:           { label: "Pasport",               Icon: FileText,   cls: "text-blue-500 bg-blue-50" },
  birth_certificate:  { label: "Tug'ilganlik guvohnomasi", Icon: File,    cls: "text-emerald-500 bg-emerald-50" },
  certificate:        { label: "Sertifikat / Diplom",   Icon: FileText,   cls: "text-purple-500 bg-purple-50" },
  photo:              { label: "Foto",                  Icon: ImageIcon,  cls: "text-pink-500 bg-pink-50" },
  other:              { label: "Boshqa",                Icon: File,       cls: "text-gray-500 bg-gray-50" },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Files Section ─────────────────────────────────────────────────────────────

function FilesSection({ studentId }: { studentId: string }) {
  const qc = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = React.useState<{
    document_type: string; name: string; notes: string;
  }>({ document_type: "other", name: "", notes: "" });
  const [showUpload, setShowUpload] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery<StudentDocument[]>({
    queryKey: ["student-documents", studentId],
    queryFn: () => schoolApi.getStudentDocuments(studentId),
    enabled: !!studentId,
  });

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => schoolApi.uploadStudentDocument(studentId, fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-documents", studentId] });
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({ document_type: "other", name: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => schoolApi.deleteStudentDocument(studentId, fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-documents", studentId] });
      setDeleteId(null);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("document_type", uploadForm.document_type);
    fd.append("name", uploadForm.name || selectedFile.name);
    fd.append("file", selectedFile);
    if (uploadForm.notes) fd.append("notes", uploadForm.notes);
    uploadMutation.mutate(fd);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Fayllar va hujjatlar</span>
          {documents.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{documents.length}</span>
          )}
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Upload className="w-3.5 h-3.5" />
          Yuklash
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Hujjat turi</label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
                value={uploadForm.document_type}
                onChange={(e) => setUploadForm((s) => ({ ...s, document_type: e.target.value }))}
              >
                {Object.entries(DOC_TYPE_CONFIG).map(([v, cfg]) => (
                  <option key={v} value={v}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Nomi</label>
              <input
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
                placeholder="Fayl nomi (ixtiyoriy)"
                value={uploadForm.name}
                onChange={(e) => setUploadForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Fayl tanlash *</label>
            <input
              ref={fileInputRef}
              type="file"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white file:mr-3 file:text-xs file:border-0 file:bg-indigo-50 file:text-indigo-600 file:rounded file:px-2 file:py-1 file:font-medium"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Izoh</label>
            <input
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              placeholder="Qo'shimcha ma'lumot (ixtiyoriy)"
              value={uploadForm.notes}
              onChange={(e) => setUploadForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowUpload(false); setSelectedFile(null); }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-3 h-3" />
              {uploadMutation.isPending ? "Yuklanmoqda..." : "Yuklash"}
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="py-10 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Hujjatlar yo&apos;q</p>
          <p className="text-xs text-gray-300 mt-0.5">Yuqoridagi tugma orqali yuklang</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {documents.map((doc) => {
            const cfg = DOC_TYPE_CONFIG[doc.document_type] ?? DOC_TYPE_CONFIG.other;
            return (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.cls)}>
                  <cfg.Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {cfg.label}
                    </span>
                    {doc.file_extension && (
                      <span className="text-[10px] text-gray-300">{doc.file_extension.toUpperCase()}</span>
                    )}
                    {doc.file_size && (
                      <span className="text-[10px] text-gray-300">{formatFileSize(doc.file_size)}</span>
                    )}
                    <span className="text-[10px] text-gray-300">{formatDateFull(doc.created_at)}</span>
                  </div>
                  {doc.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Ko'rish / Yuklab olish"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {deleteId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        className="text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                      >
                        {deleteMutation.isPending ? "..." : "O'chirish"}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="text-[10px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                      >
                        Bekor
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(doc.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Activity Section ──────────────────────────────────────────────────────────

const ACTIVITY_ICON_CFG: Record<string, { Icon: React.ElementType; cls: string }> = {
  class_added:          { Icon: GraduationCap, cls: "bg-green-100 text-green-600" },
  class_removed:        { Icon: GraduationCap, cls: "bg-red-100 text-red-500" },
  class_transferred:    { Icon: ArrowRightLeft, cls: "bg-blue-100 text-blue-600" },
  group_added:          { Icon: Users,         cls: "bg-green-100 text-green-600" },
  group_removed:        { Icon: Users,         cls: "bg-red-100 text-red-500" },
  status_changed:       { Icon: Activity,      cls: "bg-orange-100 text-orange-600" },
  subscription_added:   { Icon: Package,       cls: "bg-indigo-100 text-indigo-600" },
  subscription_removed: { Icon: Package,       cls: "bg-red-100 text-red-500" },
  payment_made:         { Icon: Wallet,        cls: "bg-emerald-100 text-emerald-600" },
  profile_updated:      { Icon: Activity,      cls: "bg-blue-100 text-blue-600" },
  document_uploaded:    { Icon: Upload,        cls: "bg-purple-100 text-purple-600" },
  document_deleted:     { Icon: Trash2,        cls: "bg-red-100 text-red-500" },
  relative_added:       { Icon: User,          cls: "bg-yellow-100 text-yellow-600" },
  note:                 { Icon: FileText,      cls: "bg-gray-100 text-gray-500" },
};

function ActivitySection({ studentId }: { studentId: string }) {
  const { data: logs = [], isLoading } = useQuery<StudentActivityLog[]>({
    queryKey: ["student-activity", studentId],
    queryFn: () => schoolApi.getStudentActivityLog(studentId),
    enabled: !!studentId,
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Activity className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">Faoliyat jurnali</span>
        {logs.length > 0 && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{logs.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-10 text-center">
          <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Faoliyat yozuvlari yo&apos;q</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {logs.map((log, idx) => {
            const cfg = ACTIVITY_ICON_CFG[log.activity_type] ?? { Icon: Activity, cls: "bg-gray-100 text-gray-500" };
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col items-center shrink-0 mt-0.5">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cfg.cls)}>
                    <cfg.Icon className="w-3.5 h-3.5" />
                  </div>
                  {idx < logs.length - 1 && (
                    <div className="w-0.5 h-full min-h-[8px] bg-gray-100 mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-gray-400">
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                      {formatDateFull(log.created_at)}
                    </span>
                    {log.performed_by_name && (
                      <span className="text-[10px] text-gray-400">
                        · {log.performed_by_name}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full">
                      {log.activity_type_display}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────── page ─────────────────────────────────────

export default function StudentDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { currentBranch } = useAuth();
  const qc = useQueryClient();
  const branchId  = currentBranch?.branch_id;
  const studentId = params.id as string;

  // Status change
  const [statusDialog, setStatusDialog] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);

  // Class transfer
  const [transferDialog, setTransferDialog] = React.useState(false);
  const [targetClassId, setTargetClassId] = React.useState<string>("");

  // Subscription management
  const [isSubDialogOpen, setIsSubDialogOpen] = React.useState(false);
  const [editingSub, setEditingSub] = React.useState<any>(null);
  const [subForm, setSubForm] = React.useState({
    subscription_plan: "",
    start_date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  // Edit personal info modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    gender: "unspecified" as "male" | "female" | "other" | "unspecified",
    date_of_birth: "",
    address: "",
  });

  // Relative CRUD
  const [isRelativeDialogOpen, setIsRelativeDialogOpen] = React.useState(false);
  const [editingRelative, setEditingRelative] = React.useState<StudentRelative | null>(null);
  const [relativeForm, setRelativeForm] = React.useState<{
    relationship_type: RelationshipType;
    first_name: string;
    last_name: string;
    phone_number: string;
    is_primary_contact: boolean;
  }>({
    relationship_type: "father",
    first_name: "",
    last_name: "",
    phone_number: "",
    is_primary_contact: false,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateStudentRequest>) => schoolApi.updateStudent(branchId!, studentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setStatusDialog(false);
      setPendingStatus(null);
      setIsEditModalOpen(false);
      toast.success("Ma'lumotlar saqlandi");
    },
    onError: () => {
      toast.error("Xatolik yuz berdi");
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ classId, membershipId, targetClass }: { classId: string; membershipId: string; targetClass: string }) =>
      schoolApi.transferStudent(classId, membershipId, { target_class_id: targetClass }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setTransferDialog(false);
      setTargetClassId("");
    },
  });

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn:  () => schoolApi.getStudent(branchId!, studentId),
    enabled:  !!branchId,
  });

  const { data: relatives = [], refetch: refetchRelatives } = useQuery({
    queryKey: ["student-relatives", studentId],
    queryFn:  () => schoolApi.getStudentRelatives(studentId),
    enabled:  !!studentId,
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn:  () => schoolApi.getClasses(branchId!),
    enabled:  !!branchId && transferDialog,
  });

  const { data: subscriptionPlansData } = useQuery({
    queryKey: ["subscription-plans", branchId],
    queryFn:  () => financeApi.getSubscriptionPlans({ branch_id: branchId, is_active: true }),
    enabled:  !!branchId,
  });
  const subscriptionPlans = subscriptionPlansData?.results || [];

  const { data: subscriptionsData, refetch: refetchSubscriptions } = useQuery({
    queryKey: ["student-subscriptions", studentId, branchId],
    queryFn:  () => financeApi.getStudentSubscriptions({ student_profile: studentId, branch_id: branchId } as any),
    enabled:  !!studentId && !!branchId,
  });
  const liveSubscriptions = subscriptionsData?.results || [];

  // Relative mutations
  const addRelativeMutation = useMutation({
    mutationFn: (data: CreateStudentRelativeRequest) => schoolApi.addStudentRelative(studentId, data),
    onSuccess: () => {
      toast.success("Yaqin qo'shildi");
      refetchRelatives();
      setIsRelativeDialogOpen(false);
      resetRelativeForm();
    },
    onError: () => toast.error("Yaqin qo'shishda xatolik"),
  });

  const updateRelativeMutation = useMutation({
    mutationFn: ({ relativeId, data }: { relativeId: string; data: Partial<CreateStudentRelativeRequest> }) =>
      schoolApi.updateStudentRelative(studentId, relativeId, data),
    onSuccess: () => {
      toast.success("Yaqin ma'lumotlari yangilandi");
      refetchRelatives();
      setIsRelativeDialogOpen(false);
      setEditingRelative(null);
      resetRelativeForm();
    },
    onError: () => toast.error("Yangilashda xatolik"),
  });

  const deleteRelativeMutation = useMutation({
    mutationFn: (relativeId: string) => schoolApi.deleteStudentRelative(studentId, relativeId),
    onSuccess: () => {
      toast.success("Yaqin o'chirildi");
      refetchRelatives();
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const createSubMutation = useMutation({
    mutationFn: (data: any) =>
      financeApi.createStudentSubscription({
        student_profile: studentId,
        subscription_plan: data.subscription_plan,
        branch: branchId!,
        start_date: data.start_date,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Abonement muvaffaqiyatli qo'shildi");
      refetchSubscriptions();
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setIsSubDialogOpen(false);
      resetSubForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Abonement qo'shishda xatolik");
    },
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ subId, data }: { subId: string; data: any }) =>
      financeApi.updateStudentSubscription(subId, data),
    onSuccess: () => {
      toast.success("Abonement yangilandi");
      refetchSubscriptions();
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setIsSubDialogOpen(false);
      setEditingSub(null);
      resetSubForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Abonement yangilashda xatolik");
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: (subId: string) => financeApi.deactivateStudentSubscription(subId),
    onSuccess: () => {
      toast.success("Abonement to'xtatildi");
      refetchSubscriptions();
      qc.invalidateQueries({ queryKey: ["student", studentId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Abonement to'xtatishda xatolik");
    },
  });

  const resetSubForm = () => {
    setSubForm({ subscription_plan: "", start_date: new Date().toISOString().split('T')[0], notes: "" });
    setEditingSub(null);
  };

  const resetRelativeForm = () => {
    setRelativeForm({
      relationship_type: "father",
      first_name: "",
      last_name: "",
      phone_number: "",
      is_primary_contact: false,
    });
  };

  const openAddSub = () => { resetSubForm(); setIsSubDialogOpen(true); };

  const openEditSub = (sub: any) => {
    setEditingSub(sub);
    setSubForm({
      subscription_plan: sub.subscription_plan || "",
      start_date: sub.start_date || "",
      notes: sub.notes || "",
    });
    setIsSubDialogOpen(true);
  };

  const openEditModal = () => {
    if (!student) return;
    setEditForm({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      middle_name: student.middle_name || "",
      gender: ((student as any).gender as "male" | "female" | "other" | "unspecified") || "unspecified",
      date_of_birth: (student as any).date_of_birth || "",
      address: (student as any).address || "",
    });
    setIsEditModalOpen(true);
  };

  const openAddRelative = () => {
    setEditingRelative(null);
    resetRelativeForm();
    setIsRelativeDialogOpen(true);
  };

  const openEditRelative = (rel: StudentRelative) => {
    setEditingRelative(rel);
    setRelativeForm({
      relationship_type: rel.relationship_type,
      first_name: rel.first_name,
      last_name: rel.last_name,
      phone_number: rel.phone_number || "",
      is_primary_contact: rel.is_primary_contact,
    });
    setIsRelativeDialogOpen(true);
  };

  const handleSaveRelative = () => {
    if (!relativeForm.first_name.trim()) { toast.error("Ism kiritilishi shart"); return; }
    const payload: CreateStudentRelativeRequest = {
      relationship_type: relativeForm.relationship_type,
      first_name: relativeForm.first_name.trim(),
      last_name: relativeForm.last_name.trim(),
      phone_number: relativeForm.phone_number.trim() || undefined,
      is_primary_contact: relativeForm.is_primary_contact,
    };
    if (editingRelative) {
      updateRelativeMutation.mutate({ relativeId: editingRelative.id, data: payload });
    } else {
      addRelativeMutation.mutate(payload);
    }
  };

  const handleDeleteRelative = (rel: StudentRelative) => {
    if (confirm(`${rel.first_name} ${rel.last_name} ni o'chirishni tasdiqlaysizmi?`)) {
      deleteRelativeMutation.mutate(rel.id);
    }
  };

  const handleSaveSub = async () => {
    if (!subForm.subscription_plan) { toast.error("Abonement rejasini tanlang"); return; }
    if (!subForm.start_date) { toast.error("Boshlanish sanasini kiriting"); return; }
    if (editingSub) {
      updateSubMutation.mutate({ subId: editingSub.id, data: { notes: subForm.notes || undefined } });
    } else {
      const activeSubs = liveSubscriptions.filter((s: any) => s.is_active);
      if (activeSubs.length > 0) {
        const confirmed = confirm(
          "Bu o'quvchida allaqachon aktiv abonement bor. Yangi biriktirish uchun avvalgisi to'xtatiladi. Davom etasizmi?"
        );
        if (!confirmed) return;
        for (const sub of activeSubs) {
          await financeApi.deactivateStudentSubscription(sub.id);
        }
      }
      createSubMutation.mutate(subForm);
    }
  };

  const handleDeleteSub = (sub: any) => {
    if (confirm(`${sub.subscription_plan_name || "Abonement"} ni o'chirishni tasdiqlaysizmi?`)) {
      deleteSubMutation.mutate(sub.id);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      middle_name: editForm.middle_name || undefined,
      gender: editForm.gender,
      date_of_birth: editForm.date_of_birth || undefined,
      address: editForm.address || undefined,
    } as Partial<CreateStudentRequest>);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <XCircle className="w-7 h-7 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">O&apos;quvchi topilmadi</p>
          <p className="text-sm text-gray-400 mt-1">Bu profil mavjud emas yoki o&apos;chirilgan</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />Orqaga
        </Button>
      </div>
    );
  }

  const balance       = student.balance;
  const bal           = balance?.balance ?? 0;
  const transactions  = (student.recent_transactions ?? []) as any[];
  const subscriptions = (student.subscriptions      ?? []) as any[];
  const groups        = ((student as any).groups     ?? []) as any[];
  const membershipId  = (student as any).membership_id as string | undefined;
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

  const totalDebt = subscriptions.reduce((sum: number, s: any) => sum + (s.total_debt ?? 0), 0);
  const currentClassId = (student.current_class as any)?.id as string | undefined;

  const transferableClasses = (allClasses as any[]).filter(
    (c: any) => !c.is_archived && c.is_active && c.id !== currentClassId
  );

  const currentStatusCfg = STATUS_CONFIG[student.status] ?? STATUS_CONFIG.active;

  // Moderator info
  const moderatorName = (student as any).created_by_name
    || (student as any).added_by_name
    || (student as any).created_by?.full_name
    || null;

  const relativesList = (relatives as StudentRelative[]);

  return (
    <div className="space-y-4">

      {/* ── Nav ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/school/students")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          O&apos;quvchilar
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            className="h-9 gap-1.5 border-gray-200 text-gray-700"
            onClick={openEditModal}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Tahrirlash
          </Button>
          {currentClassId && membershipId && (
            <Button
              variant="outline" size="sm"
              className="h-9 gap-1.5 border-gray-200 text-gray-700"
              onClick={() => setTransferDialog(true)}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Sinf almashtirish
            </Button>
          )}
          <Button
            size="sm"
            className={`h-9 gap-1.5 border ${currentStatusCfg.btnColor}`}
            onClick={() => { setPendingStatus(student.status); setStatusDialog(true); }}
          >
            <Tag className="w-3.5 h-3.5" />
            {currentStatusCfg.label}
          </Button>
        </div>
      </div>

      {/* ── Header ── */}
      <Card className="border-gray-200 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 shrink-0 ring-2 ring-white shadow-sm">
                <AvatarImage src={student.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                  <StatusBadge status={student.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {student.phone_number && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {formatPhoneDisplay(student.phone_number)}
                    </span>
                  )}
                  {student.current_class?.name && (
                    <button
                      onClick={() => router.push(`/school/classes/${(student.current_class as any).id}`)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      {student.current_class.name}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Balance chip — moliyaviy holat */}
            <div className={`rounded-xl px-5 py-3 border ${
              totalDebt > 0 ? "bg-red-50 border-red-100"
              : bal > 0    ? "bg-emerald-50 border-emerald-100"
              : "bg-gray-50 border-gray-100"
            }`}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Moliyaviy holat</p>
              <p className={`text-2xl font-black tabular-nums mt-0.5 ${
                totalDebt > 0 ? "text-red-600" : bal > 0 ? "text-emerald-700" : "text-gray-500"
              }`}>
                {totalDebt > 0 ? `−${formatCurrency(totalDebt)}` : bal > 0 ? `+${formatCurrency(bal)}` : formatCurrency(0)}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${
                totalDebt > 0 ? "text-red-500" : bal > 0 ? "text-emerald-500" : "text-gray-400"
              }`}>
                {totalDebt > 0 ? "Qarzdorlik" : bal > 0 ? "Haqdorlik" : "Hisob-kitob yo'q"}
              </p>
              {totalDebt > 0 && bal > 0 && (
                <p className="text-[11px] text-gray-400 mt-1">Balans: +{formatCurrency(bal)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2-col: left info | right finance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── LEFT — personal info + relatives ── */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="px-5 pt-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Shaxsiy ma&apos;lumotlar
              </CardTitle>
              <button
                onClick={openEditModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Tahrirlash"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <InfoRow icon={Phone} label="Telefon raqam"
              value={student.phone_number ? formatPhoneDisplay(student.phone_number) : null} />
            <InfoRow icon={GraduationCap} label="Sinf"
              value={student.current_class?.name}
              onClick={() => student.current_class && router.push(`/school/classes/${(student.current_class as any).id}`)} />
            <InfoRow icon={Hash} label="Shaxsiy raqam"
              value={student.personal_number} />
            <InfoRow icon={Calendar} label="Tug'ilgan sana"
              value={(student as any).date_of_birth ? formatDateUz((student as any).date_of_birth) : null} />
            <InfoRow icon={User} label="Jinsi"
              value={
                ((student as any).gender)
                  ? (GENDER_MAP[(student as any).gender] ?? (student as any).gender)
                  : null
              } />
            <InfoRow icon={MapPin} label="Manzil"
              value={(student as any).address} />
            {moderatorName && (
              <InfoRow icon={Shield} label="Tizimga kiritgan"
                value={moderatorName} />
            )}
            <InfoRow icon={UserPlus} label="Qo'shilgan sana"
              value={(student as any).created_at ? formatDateFull((student as any).created_at) : null} />

            {/* ── Relatives CRUD ── */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Yaqinlar</p>
                <button
                  onClick={openAddRelative}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Qo&apos;shish
                </button>
              </div>

              {relativesList.length === 0 ? (
                <div className="py-4 text-center">
                  <User className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-400">Yaqinlar qo&apos;shilmagan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {relativesList.map((rel) => (
                    <div key={rel.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-transparent">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{rel.first_name} {rel.last_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {REL_MAP[rel.relationship_type] ?? rel.relationship_type_display}
                          {rel.phone_number && (
                            <> · <a href={`tel:${rel.phone_number}`} className="text-indigo-500 hover:underline">{formatPhoneDisplay(rel.phone_number)}</a></>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditRelative(rel)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRelative(rel)}
                          disabled={deleteRelativeMutation.isPending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Groups ── */}
            {groups.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Guruhlari</p>
                <div className="space-y-2">
                  {groups.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => router.push(`/school/groups/${g.id}`)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 truncate transition-colors">
                            {g.name}
                          </p>
                          {g.teacher_name && (
                            <p className="text-xs text-gray-400 truncate">{g.teacher_name}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT — subscriptions management ── */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Abonementlar
              </CardTitle>
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                onClick={openAddSub}
              >
                <Plus className="w-3.5 h-3.5" />
                Biriktirish
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {(() => {
              const activeSubs = liveSubscriptions.filter((s: any) => s.is_active);
              const inactiveSubs = liveSubscriptions.filter((s: any) => !s.is_active);

              if (liveSubscriptions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">Abonement biriktirilmagan</p>
                    <Button variant="outline" size="sm" className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={openAddSub}>
                      <Plus className="w-3.5 h-3.5" />
                      Abonement biriktirish
                    </Button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* ── Aktiv abonementlar ── */}
                  {activeSubs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center">
                      <p className="text-sm text-gray-400 mb-2">Aktiv abonement yo&apos;q</p>
                      <Button variant="outline" size="sm" className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs" onClick={openAddSub}>
                        <Plus className="w-3.5 h-3.5" />
                        Biriktirish
                      </Button>
                    </div>
                  ) : (
                    activeSubs.map((sub: any) => {
                      const price = sub.subscription_plan_price ?? 0;
                      const hasDebt = sub.total_debt > 0;
                      return (
                        <div key={sub.id} className="rounded-xl border border-emerald-200 overflow-hidden">
                          {/* Header row */}
                          <div className={`flex items-center justify-between gap-2 px-4 py-3 ${hasDebt ? "bg-red-50" : "bg-emerald-50"}`}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <p className="text-sm font-bold text-gray-900 truncate">{sub.subscription_plan_name}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 ml-4">
                                {formatCurrency(price)} / {sub.period_display ?? "oy"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => openEditSub(sub)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                title="Izoh tahrirlash"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteSub(sub)}
                                disabled={deleteSubMutation.isPending}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 text-[11px] font-semibold"
                                title="Abonementni tugatish"
                              >
                                {deleteSubMutation.isPending
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <XCircle className="w-3 h-3" />}
                                Tugatish
                              </button>
                            </div>
                          </div>
                          <SubscriptionCard
                            sub={sub}
                            price={price}
                            hasDebt={hasDebt}
                            bal={bal}
                            studentId={studentId}
                            branchId={branchId}
                            isFirst={false}
                          />
                        </div>
                      );
                    })
                  )}

                  {/* ── Tugagan abonementlar (collapsible) ── */}
                  {inactiveSubs.length > 0 && (
                    <InactiveSubscriptions
                      subs={inactiveSubs}
                      bal={bal}
                      studentId={studentId}
                      branchId={branchId}
                    />
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Personal Info Dialog ── */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { if (!open) setIsEditModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ma&apos;lumotlarni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ism <span className="text-red-500">*</span></Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="Ism"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Familiya</Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Familiya"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Otasining ismi</Label>
              <Input
                value={editForm.middle_name}
                onChange={(e) => setEditForm((f) => ({ ...f, middle_name: e.target.value }))}
                placeholder="Otasining ismi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jinsi</Label>
              <Select
                value={editForm.gender}
                onValueChange={(v) => setEditForm((f) => ({ ...f, gender: v as "male" | "female" | "other" | "unspecified" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Jinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkak</SelectItem>
                  <SelectItem value="female">Ayol</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                  <SelectItem value="unspecified">Belgilanmagan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tug&apos;ilgan sana</Label>
              <Input
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm((f) => ({ ...f, date_of_birth: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Manzil</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Manzil"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editForm.first_name.trim()}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Relative Add/Edit Dialog ── */}
      <Dialog
        open={isRelativeDialogOpen}
        onOpenChange={(open) => {
          if (!open) { setIsRelativeDialogOpen(false); setEditingRelative(null); resetRelativeForm(); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRelative ? "Yaqinni tahrirlash" : "Yaqin qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Munosabat turi <span className="text-red-500">*</span></Label>
              <Select
                value={relativeForm.relationship_type}
                onValueChange={(v) => setRelativeForm((f) => ({ ...f, relationship_type: v as RelationshipType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ism <span className="text-red-500">*</span></Label>
                <Input
                  value={relativeForm.first_name}
                  onChange={(e) => setRelativeForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="Ism"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Familiya</Label>
                <Input
                  value={relativeForm.last_name}
                  onChange={(e) => setRelativeForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Familiya"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Telefon raqam</Label>
              <Input
                value={relativeForm.phone_number}
                onChange={(e) => setRelativeForm((f) => ({ ...f, phone_number: e.target.value }))}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_primary"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                checked={relativeForm.is_primary_contact}
                onChange={(e) => setRelativeForm((f) => ({ ...f, is_primary_contact: e.target.checked }))}
              />
              <Label htmlFor="is_primary" className="cursor-pointer font-normal">Asosiy aloqa shaxsi</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setIsRelativeDialogOpen(false); setEditingRelative(null); resetRelativeForm(); }}
              >
                Bekor qilish
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSaveRelative}
                disabled={addRelativeMutation.isPending || updateRelativeMutation.isPending || !relativeForm.first_name.trim()}
              >
                {(addRelativeMutation.isPending || updateRelativeMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingRelative ? "Saqlash" : "Qo'shish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Subscription Dialog ── */}
      <Dialog open={isSubDialogOpen} onOpenChange={(open) => { if (!open) { setIsSubDialogOpen(false); resetSubForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSub ? "Abonementni tahrirlash" : "Abonement biriktirish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Abonement rejasi <span className="text-red-500">*</span></Label>
              <Select
                value={subForm.subscription_plan}
                onValueChange={(v) => setSubForm((f) => ({ ...f, subscription_plan: v }))}
                disabled={!!editingSub}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Reja tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {formatCurrency(plan.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!!editingSub && <p className="text-xs text-gray-400">Reja o&apos;zgartirib bo&apos;lmaydi</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Boshlanish sanasi <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={subForm.start_date}
                onChange={(e) => setSubForm((f) => ({ ...f, start_date: e.target.value }))}
                disabled={!!editingSub}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Izoh</Label>
              <Input
                placeholder="Qo'shimcha izoh..."
                value={subForm.notes}
                onChange={(e) => setSubForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setIsSubDialogOpen(false); resetSubForm(); }}>
                Bekor qilish
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSaveSub}
                disabled={createSubMutation.isPending || updateSubMutation.isPending}
              >
                {(createSubMutation.isPending || updateSubMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingSub ? "Saqlash" : "Biriktirish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Tranzaksiyalar (balans audit) ── */}
      <TransactionsSection studentId={studentId} />

      {/* ── Fayllar va Faoliyat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FilesSection studentId={studentId} />
        <ActivitySection studentId={studentId} />
      </div>


      {/* ── Status dialog ── */}
      {statusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Status o&apos;zgartirish</h2>
            <p className="text-sm text-gray-400 mb-4">{fullName}</p>
            <div className="space-y-2">
              {[
                { value: "active",      label: "Aktiv",             dot: "bg-emerald-500", icon: "✓", desc: "O'quvchi faol holda davom etadi",                         destructive: false },
                { value: "suspended",   label: "To'xtatilgan",      dot: "bg-red-500",     icon: "⏸", desc: "O'quvchi vaqtincha to'xtatiladi",                          destructive: true  },
                { value: "archived",    label: "Arxivlangan",       dot: "bg-gray-400",    icon: "📁", desc: "O'quvchi arxivga o'tkaziladi",                             destructive: true  },
                { value: "graduated",   label: "Bitirgan",          dot: "bg-blue-500",    icon: "🎓", desc: "O'quvchi maktabni tamomlagan deb belgilanadi",             destructive: true  },
                { value: "transferred", label: "Ko'chirilgan",      dot: "bg-orange-500",  icon: "➡", desc: "O'quvchi boshqa muassasaga o'tkazilgan",                   destructive: true  },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPendingStatus(opt.value)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    pendingStatus === opt.value
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${opt.dot}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                    {opt.destructive && pendingStatus === opt.value && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        ⚠ Diqqat: Bu amal o&apos;quvchining holati o&apos;zgaradi. Tasdiqlashdan oldin e&apos;tibor bering.
                      </p>
                    )}
                  </div>
                  {pendingStatus === opt.value && (
                    <span className="ml-auto text-indigo-600 text-xs font-bold shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
            {updateMutation.isError && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                Xatolik yuz berdi. Masalan, arxivlash uchun avval qarzlarni to&apos;lang.
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setStatusDialog(false); setPendingStatus(null); updateMutation.reset(); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Bekor
              </button>
              <button
                onClick={() => {
                  if (pendingStatus) {
                    const cfg = STATUS_CONFIG[pendingStatus];
                    updateMutation.mutate({ status: pendingStatus } as Partial<CreateStudentRequest>);
                  }
                }}
                disabled={!pendingStatus || pendingStatus === student.status || updateMutation.isPending}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 ${
                  pendingStatus && STATUS_CONFIG[pendingStatus]
                    ? STATUS_CONFIG[pendingStatus].btnColor
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {updateMutation.isPending
                  ? "Saqlanmoqda..."
                  : pendingStatus && STATUS_CONFIG[pendingStatus]
                    ? STATUS_CONFIG[pendingStatus].actionLabel
                    : "Saqlash"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer dialog ── */}
      {transferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Sinf almashtirish</h2>
            <p className="text-sm text-gray-400 mb-1">{fullName}</p>
            {student.current_class && (
              <p className="text-xs text-gray-400 mb-4">
                Joriy sinf: <span className="font-semibold text-gray-700">{student.current_class.name}</span>
              </p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {transferableClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Boshqa faol sinflar yo&apos;q</p>
              ) : transferableClasses.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setTargetClassId(c.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    targetClassId === c.id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.academic_year_name} · {c.current_students_count}/{c.max_students} o&apos;quvchi</p>
                  </div>
                  {targetClassId === c.id && (
                    <span className="text-indigo-600 text-xs font-bold shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
            {transferMutation.isError && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                Ko&apos;chirishda xatolik yuz berdi.
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setTransferDialog(false); setTargetClassId(""); transferMutation.reset(); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Bekor
              </button>
              <button
                onClick={() => {
                  if (currentClassId && membershipId && targetClassId) {
                    transferMutation.mutate({ classId: currentClassId, membershipId, targetClass: targetClassId });
                  }
                }}
                disabled={!targetClassId || transferMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {transferMutation.isPending ? "Ko'chirilmoqda..." : "Ko'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Inactive Subscriptions (collapsible) ─────────────────────────────────────

function InactiveSubscriptions({
  subs, bal, studentId, branchId,
}: {
  subs: any[];
  bal: number;
  studentId: string;
  branchId?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-500">
            Tugagan abonementlar ({subs.length} ta)
          </span>
        </div>
        <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <div className="divide-y divide-gray-50">
          {subs.map((sub: any) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              price={sub.subscription_plan_price ?? 0}
              hasDebt={sub.total_debt > 0}
              bal={bal}
              studentId={studentId}
              branchId={branchId}
              isFirst={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Subscription Card ─────────────────────────────────────────────────────────

function SubscriptionCard({
  sub, price, hasDebt, bal, studentId, branchId, isFirst = true,
}: {
  sub: any;
  price: number;
  hasDebt: boolean;
  bal: number;
  studentId: string;
  branchId?: string;
  isFirst?: boolean;
}) {
  const [showHistory, setShowHistory] = React.useState(false);

  // Fetch income transactions for this student that have period_month set
  const { data: paymentHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["sub-tx-history", studentId],
    queryFn: async () => {
      const data = await financeApi.getTransactions({
        student_profile: studentId,
        page_size: 200,
        ordering: "-transaction_date",
      } as any);
      const results: any[] = (data as any)?.results ?? [];
      // Collect all paid period months from income/payment transactions
      const entries: { period: string; amount: number; date: string; method: string }[] = [];
      for (const tx of results) {
        if (tx.transaction_type !== "income" && tx.transaction_type !== "payment") continue;
        if (tx.status === "cancelled") continue;
        const periods: string[] =
          tx.period_months?.length > 0
            ? tx.period_months
            : tx.period_month
            ? [tx.period_month]
            : [];
        for (const p of periods) {
          entries.push({
            period: p,
            amount: tx.amount,
            date: tx.transaction_date,
            method: tx.payment_method,
          });
        }
      }
      // Sort descending by period
      return entries.sort((a, b) => b.period.localeCompare(a.period));
    },
    enabled: showHistory && !!studentId,
  });

  return (
    <div
      className={`border overflow-hidden ${isFirst ? "rounded-xl" : "rounded-b-xl border-t-0"} ${
        !sub.is_active ? "border-gray-200"
        : hasDebt ? "border-red-200"
        : "border-emerald-200"
      }`}
    >
      {/* Sub header — only shown when standalone (isFirst=true) */}
      {isFirst && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 ${
          !sub.is_active ? "bg-gray-50" : hasDebt ? "bg-red-50" : "bg-emerald-50"
        }`}>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{sub.subscription_plan_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(price)} / {sub.period_display ?? "oy"}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
            sub.is_active
              ? "bg-white text-emerald-700 border-emerald-200"
              : "bg-white text-gray-500 border-gray-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sub.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
            {sub.is_active ? "Aktiv" : "Tugagan"}
          </span>
        </div>
      )}

      {/* Info rows */}
      <div className="px-4 divide-y divide-gray-50">

        {/* Last payment */}
        <div className="flex items-start gap-3 py-3">
          <Wallet className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Oxirgi billing to&apos;lovi</p>
            {sub.last_payment_info ? (
              <div className="mt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(sub.last_payment_info.amount)}
                  </p>
                  {sub.last_payment_info.period_month && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {formatPeriodMonth(sub.last_payment_info.period_month)} uchun
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateFull(sub.last_payment_info.date)}
                  {sub.last_payment_info.by && ` · ${sub.last_payment_info.by}`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-normal mt-0.5">
                Hisob-kitob amalga oshirilmagan
              </p>
            )}
          </div>
        </div>

        {/* Next payment */}
        {sub.next_payment_date && (
          <div className="flex items-start gap-3 py-3">
            <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Keyingi to&apos;lov</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {formatDateFull(sub.next_payment_date)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatCurrency(price)}
              </p>
            </div>
          </div>
        )}

        {/* Debt */}
        {hasDebt && (
          <div className="flex items-start gap-3 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs text-red-500 font-semibold">Qarzdorlik</p>
                <p className="text-sm font-bold text-red-600 tabular-nums">
                  {formatCurrency(sub.total_debt)}
                </p>
              </div>
              {Array.isArray(sub.unpaid_months) && sub.unpaid_months.length > 0 && (
                <div className="space-y-1.5">
                  {(sub.unpaid_months as any[]).map((item: any) => {
                    const m = typeof item === 'string' ? item : item.month;
                    const owed = item.owed ?? price;
                    const paid = item.paid ?? 0;
                    const isPartial = item.is_partial ?? false;
                    return (
                      <div key={m} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                        isPartial ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-semibold ${
                            isPartial ? 'text-amber-700' : 'text-red-600'
                          }`}>
                            {formatPeriodMonth(m)}
                          </span>
                          {isPartial && (
                            <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-semibold">
                              Chala
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-[11px] font-bold tabular-nums ${
                            isPartial ? 'text-amber-700' : 'text-red-600'
                          }`}>
                            {formatCurrency(owed)}
                          </p>
                          {isPartial && paid > 0 && (
                            <p className="text-[10px] text-gray-400 tabular-nums">
                              to&apos;langan: {formatCurrency(paid)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Surplus */}
        {bal > 0 && !hasDebt && (
          <div className="flex items-start gap-3 py-3">
            <Wallet className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-emerald-600 font-semibold">Haqdorlik</p>
              <p className="text-sm font-bold text-emerald-700 mt-0.5 tabular-nums">
                +{formatCurrency(bal)}
              </p>
            </div>
          </div>
        )}

        {/* Discount */}
        {sub.discount?.is_valid && (
          <div className="flex items-start gap-3 py-3">
            <Tag className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Chegirma</p>
              <p className="text-sm font-semibold text-orange-600 mt-0.5">
                {sub.discount.name} —{" "}
                {sub.discount.discount_type === "percentage"
                  ? `${sub.discount.amount}%`
                  : formatCurrency(sub.discount.amount)}
              </p>
            </div>
          </div>
        )}

        {/* Payment history by month (collapsible) */}
        <div className="py-2">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Calendar className="w-3.5 h-3.5" />
            Oylik to&apos;lovlar tarixi
            {showHistory
              ? <ChevronRight className="w-3 h-3 rotate-90 transition-transform" />
              : <ChevronRight className="w-3 h-3 transition-transform" />}
          </button>

          {showHistory && (
            <div className="mt-2">
              {historyLoading ? (
                <div className="space-y-1.5">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
                </div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">To&apos;lov tarixi yo&apos;q</p>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {paymentHistory.map((item, idx) => {
                    const method = METHOD_BADGE[item.method as string];
                    return (
                      <div key={`${item.period}-${idx}`} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-700">{fmtPeriod(item.period)}</span>
                            {method && (
                              <span className={cn("ml-1.5 text-[10px] font-medium border px-1 py-0.5 rounded-full", method.cls)}>
                                {method.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
