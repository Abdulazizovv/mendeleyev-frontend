"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, formatDateUz } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Edit, Phone, User, Package, XCircle,
  ArrowUpRight, ArrowDownLeft, History, Users, Hash, ChevronRight,
  GraduationCap, Wallet, AlertCircle, MapPin, Calendar,
  UserCheck, Clock, MessageSquare,
} from "lucide-react";

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

function formatMonth(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : `${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatFullDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getUnpaidMonths(lastPaymentDate?: string | null): string[] {
  if (!lastPaymentDate) return [];
  const last = new Date(lastPaymentDate);
  if (isNaN(last.getTime())) return [];
  const now = new Date();
  const months: string[] = [];
  let y = last.getFullYear();
  let m = last.getMonth() + 1;
  if (m > 11) { y++; m = 0; }
  while (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth())) {
    months.push(UZ_MONTHS[m]);
    m++;
    if (m > 11) { y++; m = 0; }
  }
  return months;
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

// ─────────────────────────────────── page ─────────────────────────────────────

export default function StudentDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { currentBranch } = useAuth();
  const branchId  = currentBranch?.branch_id;
  const studentId = params.id as string;

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
  const groups        = ((student as any).groups ?? (student as any).student_groups ?? []) as any[];
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-4">

      {/* ── Nav ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/training-center/students")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          O&apos;quvchilar
        </button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 border-gray-200 text-gray-700"
          onClick={() => router.push(`/training-center/students/${studentId}/edit`)}
        >
          <Edit className="w-3.5 h-3.5" />
          Tahrirlash
        </Button>
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
                      onClick={() => router.push(`/training-center/classes/${(student.current_class as any).id}`)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      {student.current_class.name}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Balance chip */}
            <div className={`rounded-xl px-5 py-3 border ${
              bal >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
            }`}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Balans</p>
              <p className={`text-2xl font-black tabular-nums mt-0.5 ${
                bal >= 0 ? "text-emerald-700" : "text-red-600"
              }`}>
                {bal > 0 ? "+" : ""}{formatCurrency(bal)}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${
                bal > 0 ? "text-emerald-500" : bal < 0 ? "text-red-500" : "text-gray-400"
              }`}>
                {bal > 0 ? "Yetarli" : bal < 0 ? "Qarzdorlik" : "Nol"}
              </p>
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
              onClick={() => student.current_class && router.push(`/training-center/classes/${(student.current_class as any).id}`)} />
            <InfoRow icon={Hash} label="Shaxsiy raqam"
              value={student.personal_number} />
            <InfoRow icon={Calendar} label="Tug'ilgan sana"
              value={(student as any).birth_date ? formatDateUz((student as any).birth_date) : null} />
            <InfoRow icon={User} label="Jinsi"
              value={student.gender ? (GENDER_MAP[student.gender] ?? student.gender) : null} />
            <InfoRow icon={MapPin} label="Manzil"
              value={(student as any).address} />

            {/* Groups */}
            {groups.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Guruhlari</p>
                <div className="space-y-2">
                  {groups.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => router.push(`/training-center/groups/${g.id}`)}
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
                  const lastPaid = (sub as any).last_payment_date
                    ?? (sub as any).last_charged_date
                    ?? (sub as any).last_deduction_date;
                  const price         = sub.subscription_plan?.price ?? 0;
                  const unpaidMonths  = getUnpaidMonths(lastPaid);
                  const hasDebt       = sub.total_debt > 0 || unpaidMonths.length > 0;

                  return (
                    <div
                      key={sub.id}
                      className={`rounded-xl border overflow-hidden ${
                        !sub.is_active
                          ? "border-gray-200"
                          : hasDebt
                          ? "border-red-200"
                          : "border-emerald-200"
                      }`}
                    >
                      {/* Sub header */}
                      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${
                        !sub.is_active ? "bg-gray-50" : hasDebt ? "bg-red-50" : "bg-emerald-50"
                      }`}>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{sub.subscription_plan?.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(price)} / oy</p>
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
                        {lastPaid ? (
                          <div className="flex items-start gap-3 py-3">
                            <Wallet className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Oxirgi to&apos;lov</p>
                              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                {formatMonth(lastPaid)} uchun{" "}
                                <span className="text-emerald-700 tabular-nums">{formatCurrency(price)}</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-3">
                            <Wallet className="w-4 h-4 text-gray-300 shrink-0" />
                            <p className="text-sm text-gray-400">To&apos;lov amalga oshirilmagan</p>
                          </div>
                        )}

                        {/* Debt months */}
                        {unpaidMonths.length > 0 && (
                          <div className="flex items-start gap-3 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-red-500 font-semibold">Qarzdorlik</p>
                              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                {unpaidMonths.join(", ")} {unpaidMonths.length > 1 ? "oylari" : "oyi"} uchun to&apos;lov amalga oshirilmagan
                              </p>
                              {sub.total_debt > 0 && (
                                <p className="text-sm font-bold text-red-600 mt-1 tabular-nums">
                                  Jami qarz: {formatCurrency(sub.total_debt)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Transactions — full width, detailed ── */}
      <Card className="border-gray-200 shadow-none">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <History className="w-4 h-4" />
              So&apos;nggi tranzaksiyalar
            </CardTitle>
            <button
              onClick={() => router.push(`/training-center/students/${studentId}/transactions`)}
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Barchasini ko&apos;rish
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <History className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Hali tranzaksiya mavjud emas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.slice(0, 5).map((tx: any, i: number) => {
                const isCredit = tx.transaction_type === "credit";
                const typeLabel = tx.transaction_type_display || (isCredit ? "Kirim" : "Chiqim");
                const who = tx.processed_by_name ?? tx.created_by_name ?? tx.operator_name;
                return (
                  <div key={tx.id ?? i} className="flex items-start gap-4 py-4">
                    {/* Type icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCredit ? "bg-emerald-50" : "bg-red-50"
                    }`}>
                      {isCredit
                        ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                        : <ArrowUpRight className="w-5 h-5 text-red-500" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: type + amount */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-bold text-gray-900 leading-snug">{typeLabel}</p>
                        <p className={`text-base font-black tabular-nums shrink-0 leading-snug ${
                          isCredit ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {isCredit ? "+" : "−"}{formatCurrency(tx.amount)}
                        </p>
                      </div>

                      {/* Meta grid */}
                      <div className="space-y-1.5">
                        {(tx.occurred_at || tx.created_at) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <span>{formatFullDateTime(tx.occurred_at ?? tx.created_at)}</span>
                          </div>
                        )}
                        {who && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <UserCheck className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <span>{who}</span>
                          </div>
                        )}
                        {tx.description && (
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                            <span>{tx.description}</span>
                          </div>
                        )}
                        {tx.new_balance !== undefined && tx.new_balance !== null && (
                          <div className="flex items-center gap-2 text-xs">
                            <Wallet className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <span className="text-gray-500">Tranzaksiyadan keyingi balans:</span>
                            <span className={`font-bold tabular-nums ${
                              tx.new_balance >= 0 ? "text-emerald-600" : "text-red-500"
                            }`}>
                              {formatCurrency(tx.new_balance)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
