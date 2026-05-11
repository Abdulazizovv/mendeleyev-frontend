"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { formatCurrency, formatDateUz, formatRelativeDate } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  CreditCard,
  Wallet,
  Phone,
  User,
  Calendar,
  Package,
  XCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Users,
  BookOpen,
  Hash,
  ChevronRight,
  Zap,
  PlusCircle,
} from "lucide-react";
import { PaymentDueCard } from "@/components/school/students/detail/PaymentDueCard";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktiv",        cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  archived: { label: "Arxivlangan",  cls: "bg-gray-100 text-gray-600 border-gray-200" },
  suspended:{ label: "To'xtatilgan", cls: "bg-red-100 text-red-700 border-red-200" },
};

function statusBadge(status: string) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.active;
  return <Badge className={`border ${s.cls} font-medium`}>{s.label}</Badge>;
}

function txIcon(type: string) {
  if (type === "credit") return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
  return <ArrowUpRight className="w-4 h-4 text-red-500" />;
}

const QUICK_AMOUNTS = [500_000, 1_000_000, 2_200_000, 5_000_000];

// ── Balance top-up modal ───────────────────────────────────────────────────────

function BalanceModal({
  open,
  onClose,
  studentId,
  currentBalance,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  currentBalance: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");

  const parsed = parseInt(amount.replace(/\D/g, ""), 10);
  const valid = !isNaN(parsed) && parsed > 0;

  const handleQuick = (v: number) => setAmount(v.toString());

  const handleGoToPayment = () => {
    if (!valid) { toast.error("Summani kiriting"); return; }
    router.push(`/school/finance/payments/create?student=${studentId}&amount=${parsed}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Balansni to&apos;ldirish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Current balance chip */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-500">Hozirgi balans</span>
            <span className={`text-base font-bold ${currentBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {currentBalance > 0 && "+"}{formatCurrency(currentBalance)}
            </span>
          </div>

          {/* Quick amounts */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Tez tanlash</Label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuick(v)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    parsed === v
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <Label htmlFor="amount" className="text-xs text-gray-500 mb-1.5 block">Boshqa summa</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount ? parseInt(amount.replace(/\D/g, "") || "0", 10).toLocaleString("ru-RU") : ""}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              className="text-base font-semibold"
            />
          </div>

          {/* Actions */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!valid}
            onClick={handleGoToPayment}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            To&apos;lov sahifasiga o&apos;tish
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const studentId = params.id as string;

  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  const {
    data: student,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => schoolApi.getStudent(branchId!, studentId),
    enabled: !!branchId,
  });

  const { data: relatives = [] } = useQuery({
    queryKey: ["student-relatives", studentId],
    queryFn: () => schoolApi.getStudentRelatives(studentId),
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">O&apos;quvchi topilmadi</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
        </Button>
      </div>
    );
  }

  const balance = student.balance;
  const bal = balance?.balance ?? 0;
  const transactions = student.recent_transactions ?? [];
  const subscriptions = student.subscriptions ?? [];
  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Color band with back button */}
        <div className="h-20 bg-linear-to-r from-blue-600 to-indigo-600 relative">
          <button
            onClick={() => router.push("/school/students")}
            className="absolute top-3 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            O&apos;quvchilar
          </button>
        </div>

        <div className="px-6 pb-5 -mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar + name */}
            <div className="flex items-end gap-4">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src={student.avatar_url || undefined} />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{fullName}</h1>
                  {statusBadge(student.status)}
                </div>
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                  {student.personal_number && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />{student.personal_number}
                    </span>
                  )}
                  {student.phone_number && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />{student.phone_number}
                    </span>
                  )}
                  {student.current_class && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />{student.current_class.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBalanceModalOpen(true)}
                className="gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Balans
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                onClick={() => router.push(`/school/finance/payments/create?student=${studentId}`)}
              >
                <CreditCard className="w-4 h-4" />
                To&apos;lov
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/school/students/${studentId}/edit`)}
                className="gap-1.5"
              >
                <Edit className="w-4 h-4" />
                Tahrirlash
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left column (3/5) */}
        <div className="lg:col-span-3 space-y-5">

          {/* Balance card */}
          <Card className="border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Joriy balans</p>
                  <p className={`text-3xl font-bold mt-0.5 ${bal > 0 ? "text-emerald-600" : bal < 0 ? "text-red-600" : "text-gray-900"}`}>
                    {bal > 0 && "+"}{formatCurrency(bal)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bal > 0 ? "Ortiqcha mablag' mavjud" : bal < 0 ? "Qarz mavjud" : "Balans nol"}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bal >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                  <Wallet className={`w-6 h-6 ${bal >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Jami kirim</span>
                  </div>
                  <p className="text-base font-bold text-emerald-700">
                    {formatCurrency(balance?.transactions_summary?.total_income ?? balance?.payments_summary?.total_payments ?? 0)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-red-600 mb-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Jami chiqim</span>
                  </div>
                  <p className="text-base font-bold text-red-600">
                    {formatCurrency(balance?.transactions_summary?.total_expense ?? 0)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                  onClick={() => setBalanceModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Mablag&apos; kiritish
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={() => router.push(`/school/finance/payments/create?student=${studentId}`)}
                >
                  <CreditCard className="w-4 h-4 mr-1.5" />
                  To&apos;lov
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment due */}
          <PaymentDueCard
            paymentDue={student.payment_due}
            studentId={studentId}
            formatCurrency={formatCurrency}
            onChargeSuccess={refetch}
          />

          {/* Recent transactions */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-400" />
                  So&apos;nggi tranzaksiyalar
                </CardTitle>
                <span className="text-xs text-gray-400">{transactions.length} ta</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Tranzaksiya mavjud emas</p>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, 8).map((tx: any, i: number) => (
                    <div key={tx.id ?? i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.transaction_type === "credit" ? "bg-emerald-100" : "bg-red-50"}`}>
                        {txIcon(tx.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {tx.description || (tx.transaction_type === "credit" ? "Kirim" : "Chiqim")}
                        </p>
                        <p className="text-xs text-gray-400">{formatRelativeDate(tx.occurred_at ?? tx.created_at)}</p>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${tx.transaction_type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.transaction_type === "credit" ? "+" : "−"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (2/5) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Abonementlar */}
          {subscriptions.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  Abonementlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {subscriptions.map((sub: any) => (
                  <div key={sub.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{sub.subscription_plan?.name}</p>
                      <Badge className={sub.is_active ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-gray-100 text-gray-500 text-[10px]"}>
                        {sub.is_active ? "Aktiv" : "Tugagan"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Narxi</span>
                        <span className="font-medium text-gray-700">{formatCurrency(sub.subscription_plan?.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Davr</span>
                        <span className="font-medium text-gray-700">{sub.subscription_plan?.period_display}</span>
                      </div>
                      {sub.next_payment_date && (
                        <div className="flex justify-between">
                          <span>Keyingi to&apos;lov</span>
                          <span className="font-medium text-gray-700">{formatDateUz(sub.next_payment_date)}</span>
                        </div>
                      )}
                      {sub.total_debt > 0 && (
                        <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                          <span className="text-red-600 font-medium">Qarz</span>
                          <span className="font-bold text-red-600">{formatCurrency(sub.total_debt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Personal info */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Shaxsiy ma&apos;lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2.5">
                {[
                  { label: "Telefon", value: student.phone_number, icon: Phone },
                  { label: "Sinf", value: student.current_class?.name, icon: BookOpen },
                  { label: "Shaxsiy raqam", value: student.personal_number, icon: Hash },
                  { label: "Tug'ilgan sana", value: (student as any).birth_date ? formatDateUz((student as any).birth_date) : null, icon: Calendar },
                  { label: "Jinsi", value: student.gender === "male" ? "Erkak" : student.gender === "female" ? "Ayol" : null, icon: User },
                ].filter((r) => r.value).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                ))}
                {(student as any).address && (
                  <div className="text-sm pt-1 border-t border-gray-100">
                    <p className="text-gray-500 mb-0.5">Manzil</p>
                    <p className="text-gray-800 font-medium">{(student as any).address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Relatives */}
          {Array.isArray(relatives) && relatives.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  Yaqinlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2.5">
                {relatives.map((rel: any) => (
                  <div key={rel.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {rel.first_name} {rel.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{rel.relation} · {rel.phone_number}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Tezkor harakatlar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { label: "To'lov qabul qilish", icon: CreditCard, color: "text-emerald-600", bg: "hover:bg-emerald-50 hover:border-emerald-200", action: () => router.push(`/school/finance/payments/create?student=${studentId}`) },
                { label: "O'quvchini tahrirlash", icon: Edit, color: "text-blue-600", bg: "hover:bg-blue-50 hover:border-blue-200", action: () => router.push(`/school/students/${studentId}/edit`) },
                { label: "Yaqinlar boshqaruvi", icon: Users, color: "text-orange-600", bg: "hover:bg-orange-50 hover:border-orange-200", action: () => router.push(`/school/students/${studentId}/edit#relatives`) },
              ].map(({ label, icon: Icon, color, bg, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors ${bg}`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  {label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Balance Modal */}
      <BalanceModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        studentId={studentId}
        currentBalance={bal}
      />
    </div>
  );
}
