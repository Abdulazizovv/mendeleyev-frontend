"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, formatDateUz } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Phone, User, Package, XCircle,
  ArrowRightLeft, Users, Hash, ChevronRight,
  GraduationCap, Wallet, AlertCircle, MapPin, Calendar,
  Clock, Tag, Receipt, Banknote, CreditCard, Building2,
  TrendingUp, TrendingDown, RotateCcw, UserX, UserPlus,
  ArrowUpCircle, ArrowDownCircle, FileText, File, ImageIcon,
  Upload, Trash2, Download, Activity,
} from "lucide-react";
import { TransactionDetailSheet } from "@/components/finance/transactions/TransactionDetailSheet";
import { cn } from "@/lib/utils";
import type { Transaction, StudentBalanceTransaction } from "@/types/finance";
import type { StudentDocument, StudentActivityLog, CreateStudentRequest } from "@/types/school";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:      { label: "Aktiv",        color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  archived:    { label: "Arxivlangan",  color: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
  suspended:   { label: "To'xtatilgan", color: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500" },
  graduated:   { label: "Bitirgan",     color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  transferred: { label: "Ko'chirilgan", color: "bg-orange-50 text-orange-700 border-orange-200",    dot: "bg-orange-500" },
};

const GENDER_MAP: Record<string, string> = {
  male: "Erkak", female: "Ayol", other: "Boshqa", unspecified: "Belgilanmagan",
};

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

// ── Balance Transaction row ───────────────────────────────────────────────────

function BalTxRow({ tx }: { tx: StudentBalanceTransaction }) {
  const isCredit = tx.transaction_type === "credit";
  const reasonCfg = BAL_REASON_CFG[tx.reason] ?? BAL_REASON_CFG.other;
  const meta = tx.metadata as any;
  const billingMonth = meta?.year && meta?.month
    ? `${UZ_MONTHS_MAP[String(meta.month).padStart(2, "0")] ?? meta.month} ${meta.year}`
    : null;

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isCredit ? "bg-emerald-50" : "bg-red-50")}>
            {isCredit
              ? <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
              : <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-[10px] font-semibold border px-1.5 py-0.5 rounded-full", reasonCfg.cls)}>
                {reasonCfg.label}
              </span>
            </div>
            {billingMonth && (
              <p className="text-[10px] text-slate-500 mt-0.5">{billingMonth} uchun</p>
            )}
            {tx.description && !billingMonth && (
              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{tx.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-[11px] text-gray-500">{tx.occurred_at ? formatDateUz(tx.occurred_at) : "—"}</span>
      </td>
      <td className="px-3 py-3">
        <span className="text-[11px] text-gray-400 tabular-nums">
          {formatCurrency(tx.previous_balance)} → {formatCurrency(tx.new_balance)}
        </span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <p className={cn("text-sm font-bold tabular-nums", isCredit ? "text-emerald-600" : "text-red-500")}>
          {isCredit ? "+" : "−"}{formatCurrency(tx.amount)}
        </p>
      </td>
    </tr>
  );
}

// ── Unified Transactions Section ──────────────────────────────────────────────

function TransactionsSection({
  transactions, studentId, onOpenTx,
}: {
  transactions: any[];
  studentId: string;
  onOpenTx: (tx: any) => void;
}) {
  const [showAll, setShowAll] = React.useState(false);

  const { data: allTxData, isLoading: allTxLoading } = useQuery({
    queryKey: ["student-all-tx", studentId],
    queryFn: () => financeApi.getTransactions({ student_profile: studentId, page_size: 200, ordering: "-transaction_date" } as any),
    enabled: showAll && !!studentId,
  });

  const shownTxs = showAll ? ((allTxData as any)?.results ?? []) : transactions.slice(0, 8);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Tranzaksiyalar</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{transactions.length}</span>
        </div>
        {!showAll && transactions.length > 8 && (
          <button onClick={() => setShowAll(true)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
            Barchasini ko&apos;rish <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
        {showAll && (
          <button onClick={() => setShowAll(false)} className="text-xs text-gray-500 hover:text-gray-700">Kamroq</button>
        )}
      </div>
      {transactions.length === 0 ? (
        <div className="py-8 text-center">
          <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Tranzaksiyalar yo&apos;q</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Tranzaksiya</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500">Sana</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500">Usul</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Summa</th>
              </tr>
            </thead>
            <tbody>
              {allTxLoading
                ? [...Array(3)].map((_, i) => (
                    <tr key={i}><td colSpan={4} className="px-4 py-3"><Skeleton className="h-8 rounded-lg" /></td></tr>
                  ))
                : shownTxs.map((tx: any) => <TxRow key={tx.id} tx={tx} onOpen={onOpenTx} />)}
            </tbody>
          </table>
        </div>
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
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  // Status change
  const [statusDialog, setStatusDialog] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);

  // Class transfer
  const [transferDialog, setTransferDialog] = React.useState(false);
  const [targetClassId, setTargetClassId] = React.useState<string>("");

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateStudentRequest>) => schoolApi.updateStudent(branchId!, studentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setStatusDialog(false);
      setPendingStatus(null);
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

  const { data: relatives = [] } = useQuery({
    queryKey: ["student-relatives", studentId],
    queryFn:  () => schoolApi.getStudentRelatives(studentId),
    enabled:  !!studentId,
  });

  const { data: allClasses = [] } = useQuery({
    queryKey: ["classes", branchId],
    queryFn:  () => schoolApi.getClasses(branchId!),
    enabled:  !!branchId && transferDialog,
  });

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
  const groups        = ((student as any).groups ?? []) as any[];
  const membershipId  = (student as any).membership_id as string | undefined;
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

  const totalDebt = subscriptions.reduce((sum: number, s: any) => sum + (s.total_debt ?? 0), 0);
  const balanceId = (balance as any)?.id ?? null;
  const currentClassId = (student.current_class as any)?.id as string | undefined;

  const transferableClasses = (allClasses as any[]).filter(
    (c: any) => !c.is_archived && c.is_active && c.id !== currentClassId
  );

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
            variant="outline" size="sm"
            className="h-9 gap-1.5 border-gray-200 text-gray-700"
            onClick={() => { setPendingStatus(student.status); setStatusDialog(true); }}
          >
            <Tag className="w-3.5 h-3.5" />
            Status
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

        {/* ── LEFT — personal info + groups + relatives ── */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Shaxsiy ma&apos;lumotlar
            </CardTitle>
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
              value={student.gender ? (GENDER_MAP[student.gender] ?? student.gender) : null} />
            <InfoRow icon={MapPin} label="Manzil"
              value={(student as any).address} />
            <InfoRow icon={UserPlus} label="Qo'shilgan sana"
              value={(student as any).created_at ? formatDateFull((student as any).created_at) : null} />

            {/* Groups */}
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

            {/* Relatives */}
            {Array.isArray(relatives) && (relatives as any[]).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Yaqinlar</p>
                <div className="space-y-2">
                  {(relatives as any[]).map((rel: any) => (
                    <div key={rel.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{rel.first_name} {rel.last_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {rel.relation}{rel.phone_number && ` · ${rel.phone_number}`}
                        </p>
                      </div>
                      {rel.phone_number && (
                        <a
                          href={`tel:${rel.phone_number}`}
                          className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 flex items-center justify-center transition-colors shrink-0"
                        >
                          <Phone className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT — subscriptions + financial status ── */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="px-5 pt-5 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Abonement va moliya
              </CardTitle>
              {subscriptions.length > 0 && (
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {subscriptions.length} ta
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {subscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Abonement biriktirilmagan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub: any) => {
                  const price   = sub.subscription_plan?.price ?? 0;
                  const hasDebt = sub.total_debt > 0;

                  return (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      price={price}
                      hasDebt={hasDebt}
                      bal={bal}
                      balanceId={balanceId}
                      branchId={branchId}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tranzaksiyalar ── */}
      <TransactionsSection
        transactions={transactions}
        studentId={studentId}
        onOpenTx={(tx) => setSelectedTx(tx as Transaction)}
      />

      {/* ── Fayllar va Faoliyat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FilesSection studentId={studentId} />
        <ActivitySection studentId={studentId} />
      </div>

      {/* ── Tranzaksiya detail ── */}
      <TransactionDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />

      {/* ── Status dialog ── */}
      {statusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Status o&apos;zgartirish</h2>
            <p className="text-sm text-gray-400 mb-4">{fullName}</p>
            <div className="space-y-2">
              {[
                { value: "active",      label: "Aktiv",          dot: "bg-emerald-500" },
                { value: "suspended",   label: "To'xtatilgan",   dot: "bg-red-500" },
                { value: "archived",    label: "Arxivlangan",    dot: "bg-gray-400" },
                { value: "graduated",   label: "Bitirgan",       dot: "bg-blue-500" },
                { value: "transferred", label: "Ko'chirilgan",   dot: "bg-orange-500" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPendingStatus(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    pendingStatus === opt.value
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                  <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                  {pendingStatus === opt.value && (
                    <span className="ml-auto text-indigo-600 text-xs font-bold">✓</span>
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
                onClick={() => { if (pendingStatus) updateMutation.mutate({ status: pendingStatus } as Partial<CreateStudentRequest>); }}
                disabled={!pendingStatus || pendingStatus === student.status || updateMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
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

// ── Subscription Card ─────────────────────────────────────────────────────────

function SubscriptionCard({
  sub, price, hasDebt, bal, balanceId, branchId,
}: {
  sub: any;
  price: number;
  hasDebt: boolean;
  bal: number;
  balanceId?: string | null;
  branchId?: string;
}) {
  const [showHistory, setShowHistory] = React.useState(false);

  const { data: balTxHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["sub-billing-history", sub.id, balanceId],
    queryFn: async () => {
      if (!balanceId) return [];
      const txs = await financeApi.getStudentBalanceTransactions(balanceId, { branch_id: branchId });
      return txs.filter((t: any) =>
        t.subscription === sub.id &&
        t.reason === "subscription_charge" &&
        t.metadata && Object.keys(t.metadata).length > 0
      );
    },
    enabled: showHistory && !!balanceId,
  });

  const UZ_MAP: Record<string, string> = {
    "01":"Yanvar","02":"Fevral","03":"Mart","04":"Aprel","05":"May","06":"Iyun",
    "07":"Iyul","08":"Avgust","09":"Sentabr","10":"Oktabr","11":"Noyabr","12":"Dekabr",
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        !sub.is_active ? "border-gray-200"
        : hasDebt ? "border-red-200"
        : "border-emerald-200"
      }`}
    >
      {/* Sub header */}
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${
        !sub.is_active ? "bg-gray-50" : hasDebt ? "bg-red-50" : "bg-emerald-50"
      }`}>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{sub.subscription_plan?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatCurrency(price)} / {sub.subscription_plan?.period_display ?? "oy"}
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
              ) : balTxHistory.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">To&apos;lov tarixi yo&apos;q</p>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {balTxHistory.map((tx: any) => {
                    const meta = tx.metadata || {};
                    const mn = String(meta.month ?? "").padStart(2, "0");
                    const monthName = meta.year && meta.month
                      ? `${UZ_MAP[mn] ?? mn} ${meta.year}`
                      : tx.occurred_at ? `${new Date(tx.occurred_at).toLocaleDateString("uz")}` : "—";
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[11px] font-semibold text-emerald-700">{monthName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                            {formatCurrency(meta.base ?? tx.amount)}
                          </span>
                          {meta.discount > 0 && (
                            <span className="text-[10px] text-orange-600 ml-1">(-{formatCurrency(meta.discount)})</span>
                          )}
                        </div>
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
