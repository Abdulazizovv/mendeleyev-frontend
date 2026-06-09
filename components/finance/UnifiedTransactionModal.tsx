"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { financeApi, schoolApi, branchApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Loader2, Search, X, TrendingUp, TrendingDown, ArrowRightLeft,
  Users, Globe, HelpCircle, Banknote, CreditCard,
  GraduationCap, Check, Calendar, AlertTriangle, ArrowRight,
  ChevronDown, Wallet, BookOpen,
} from "lucide-react";
import type { FinanceCategory, CashRegister, StudentSubscription, StudentBalance } from "@/types/finance";
import type { Student } from "@/types/school";
import { cn } from "@/lib/utils";

type FlowType = "income" | "expense" | "transfer";

interface Props {
  type: FlowType;
  cashRegister: CashRegister;
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  methodBalance?: { cash_net: number; card_net: number } | null;
}

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${UZ_MONTHS[m - 1]} ${y}`;
}
function buildMonthOptions(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}
function parseAmt(val: string) { return parseInt(val.replace(/\D/g, ""), 10) || 0; }
function displayAmt(n: number) { return n ? n.toLocaleString("ru-RU") : ""; }

const FLOW = {
  income:   { label: "Kirim",    Icon: TrendingUp,    hdr: "bg-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700 text-white", ring: "border-emerald-500 bg-emerald-50 text-emerald-800" },
  expense:  { label: "Chiqim",   Icon: TrendingDown,  hdr: "bg-rose-600",    btn: "bg-rose-600 hover:bg-rose-700 text-white",       ring: "border-rose-500 bg-rose-50 text-rose-800"         },
  transfer: { label: "Transfer", Icon: ArrowRightLeft, hdr: "bg-blue-700",   btn: "bg-blue-700 hover:bg-blue-800 text-white",       ring: "border-blue-500 bg-blue-50 text-blue-800"         },
};

const CLIENT_ICONS: Record<string, React.ElementType> = {
  student: GraduationCap, employee: Users, third_party: Globe, other: HelpCircle,
};
const CLIENT_LABELS: Record<string, string> = {
  student: "O'quvchi", employee: "Xodim", third_party: "Uchinchi shaxs", other: "Boshqa",
};

export default function UnifiedTransactionModal({ type, cashRegister, branchId, isOpen, onClose, onSuccess, methodBalance }: Props) {
  const queryClient = useQueryClient();
  const cfg = FLOW[type];
  const FlowIcon = cfg.Icon;

  const [categoryId, setCategoryId]         = useState("");
  const [catOpen, setCatOpen]               = useState(false);
  const [catSearch, setCatSearch]           = useState("");
  const [amountStr, setAmountStr]           = useState("");
  const [paymentMethod, setPaymentMethod]   = useState<"cash" | "card">("cash");
  const [toMethod, setToMethod]             = useState<"cash" | "card">("card");
  const [description, setDescription]      = useState("");
  const [periodMonth, setPeriodMonth]       = useState(currentYearMonth);
  const [thirdPartyName, setThirdPartyName] = useState("");
  const [studentSearch, setStudentSearch]   = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; user_name: string; balance: number; user_phone?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCategoryId(""); setCatOpen(false); setCatSearch(""); setAmountStr("");
    setPaymentMethod("cash"); setToMethod("card");
    setDescription(""); setPeriodMonth(currentYearMonth()); setThirdPartyName("");
    setStudentSearch(""); setSelectedStudent(null); setEmployeeSearch(""); setSelectedEmployee(null);
  }, [isOpen, type]);

  // Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["finance-categories-modal", branchId, type],
    queryFn: () => financeApi.getCategories({ type: type === "income" ? "income" : "expense", is_active: true, page_size: 100 }),
    enabled: isOpen && type !== "transfer" && !!branchId,
    staleTime: 60_000,
  });
  const allCategories: FinanceCategory[] = categoriesData?.results ?? [];
  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return allCategories;
    const q = catSearch.toLowerCase();
    return allCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCategories, catSearch]);

  const selectedCategory = allCategories.find((c) => c.id === categoryId) ?? null;
  const clientType = selectedCategory?.client_type ?? "other";

  // Student subscription
  const { data: studentSubData } = useQuery({
    queryKey: ["student-sub-modal", selectedStudent?.id],
    queryFn: () => financeApi.getStudentSubscriptions({ student_profile: selectedStudent!.id, is_active: true }),
    enabled: !!selectedStudent && clientType === "student",
    staleTime: 60_000,
  });
  const activeSub = studentSubData?.results?.[0];
  useEffect(() => {
    if (activeSub && !amountStr) setAmountStr(displayAmt(activeSub.subscription_plan_price ?? 0));
  }, [activeSub]);

  // Student balance (wallet)
  const { data: studentBalanceData } = useQuery({
    queryKey: ["student-balance-modal", selectedStudent?.id, branchId],
    queryFn: () => financeApi.getStudentBalances({ student_profile: selectedStudent!.id, branch_id: branchId }),
    enabled: !!selectedStudent && clientType === "student",
    staleTime: 0,
  });
  const studentBalance = studentBalanceData?.results?.[0] ?? null;

  // Students
  const { data: studentsData, isFetching: searchingStudents } = useQuery({
    queryKey: ["students-modal", branchId, studentSearch],
    queryFn: () => schoolApi.getStudents(branchId, { search: studentSearch || undefined, page_size: 10 }),
    enabled: type !== "transfer" && clientType === "student" && !selectedStudent && !!branchId,
    staleTime: 30_000,
  });
  const students = studentsData?.results ?? [];

  // Employees
  const { data: employeesData, isFetching: searchingEmployees } = useQuery({
    queryKey: ["employees-modal", branchId, employeeSearch],
    queryFn: () => branchApi.getMemberships(branchId, { search: employeeSearch || undefined, is_active: true, page_size: 10 }),
    enabled: type !== "transfer" && clientType === "employee" && !selectedEmployee && !!branchId,
    staleTime: 0,
  });
  const employees = employeesData?.results ?? [];

  const amount = parseAmt(amountStr);
  const empBalanceNeg = selectedEmployee !== null && selectedEmployee.balance <= 0;
  const empBalanceLow = selectedEmployee !== null && amount > 0 && selectedEmployee.balance > 0 && amount > selectedEmployee.balance;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (amount <= 0) throw new Error("Summa 0 dan katta bo'lishi kerak");
      if (type === "transfer") {
        if (paymentMethod === toMethod) throw new Error("Manba va maqsad bir xil bo'lishi mumkin emas");
        return financeApi.internalTransfer({ cash_register: cashRegister.id, from_method: paymentMethod, to_method: toMethod, amount, description });
      }
      if (!categoryId) throw new Error("Tranzaksiya turini tanlang");
      if (clientType === "student"     && !selectedStudent)       throw new Error("O'quvchini tanlang");
      if (clientType === "employee"    && !selectedEmployee)      throw new Error("Xodimni tanlang");
      if (clientType === "third_party" && !thirdPartyName.trim()) throw new Error("Uchinchi shaxs nomini kiriting");
      return financeApi.createTransaction({
        branch: branchId, cash_register: cashRegister.id,
        transaction_type: type === "income" ? "income" : "expense",
        category: categoryId, amount, payment_method: paymentMethod, description,
        student_profile:     clientType === "student"     ? selectedStudent?.id  : undefined,
        employee_membership: clientType === "employee"    ? selectedEmployee?.id : undefined,
        period_month:        clientType === "student"     ? periodMonth          : undefined,
        third_party_name:    clientType === "third_party" ? thirdPartyName       : undefined,
        auto_approve: true,
      });
    },
    onSuccess: () => {
      toast.success(type === "income" ? "Kirim saqlandi" : type === "expense" ? "Chiqim saqlandi" : "Transfer amalga oshirildi");
      queryClient.invalidateQueries({ queryKey: ["employees-modal"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["tx-summary"] });
      onSuccess?.(); onClose();
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Xatolik yuz berdi"),
  });

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" hideClose className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0 overflow-hidden">

        {/* ── Colored header ── */}
        <div className={cn("px-5 py-4 shrink-0 relative", cfg.hdr)}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <FlowIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{cfg.label}</p>
              <p className="text-xs text-white/60 mt-0.5">
                {cashRegister.name} · <span className="text-white/80 font-medium">{formatCurrency(cashRegister.balance)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-5 space-y-5">

            {/* ═══ TRANSFER ═══ */}
            {type === "transfer" && (
              <TransferSection
                fromMethod={paymentMethod}
                toMethod={toMethod}
                cashNet={methodBalance?.cash_net}
                cardNet={methodBalance?.card_net}
                onChange={(from, to) => { setPaymentMethod(from); setToMethod(to); }}
              />
            )}

            {/* ═══ CATEGORY — collapsed dropdown ═══ */}
            {type !== "transfer" && (
              <section>
                <FL required>Tranzaksiya turi</FL>

                {selectedCategory ? (
                  /* Selected chip */
                  <div className={cn("flex items-center gap-3 px-3.5 py-3 rounded-xl border-2", cfg.ring)}>
                    {(() => { const I = CLIENT_ICONS[selectedCategory.client_type]; return <I className="w-4 h-4 shrink-0" />; })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{selectedCategory.name}</p>
                      <p className="text-xs opacity-70">{CLIENT_LABELS[selectedCategory.client_type]}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCategoryId(""); setCatSearch(""); setSelectedStudent(null); setSelectedEmployee(null); setAmountStr(""); }}
                      className="w-6 h-6 rounded-md flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/10 transition-all shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  /* Dropdown trigger + panel */
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCatOpen((v) => !v)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border-2 text-left transition-all",
                        catOpen ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="text-sm text-slate-400">Tur tanlang...</span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", catOpen && "rotate-180")} />
                    </button>

                    {catOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                              autoFocus
                              className="pl-8 h-8 text-sm border-slate-200 bg-slate-50"
                              placeholder="Qidirish..."
                              value={catSearch}
                              onChange={(e) => setCatSearch(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* List */}
                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                          {allCategories.length === 0 ? (
                            <div className="py-6 text-center">
                              <p className="text-sm text-slate-400">Tranzaksiya turlari yo'q</p>
                            </div>
                          ) : filteredCategories.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-sm text-slate-400">Topilmadi</p>
                            </div>
                          ) : (
                            filteredCategories.map((c) => {
                              const CIcon = CLIENT_ICONS[c.client_type] ?? HelpCircle;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setCategoryId(c.id); setCatOpen(false); setCatSearch("");
                                    setSelectedStudent(null); setSelectedEmployee(null);
                                    setStudentSearch(""); setEmployeeSearch(""); setAmountStr("");
                                  }}
                                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <CIcon className="w-3.5 h-3.5 text-slate-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                                    <p className="text-xs text-slate-400">{CLIENT_LABELS[c.client_type]}</p>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ═══ STUDENT PICKER ═══ */}
            {type !== "transfer" && clientType === "student" && (
              <section>
                <FL required>O'quvchi</FL>
                {selectedStudent ? (
                  <StudentCard
                    student={selectedStudent}
                    activeSub={activeSub}
                    studentBalance={studentBalance}
                    onClear={() => { setSelectedStudent(null); setAmountStr(""); }}
                  />
                ) : (
                  <PersonList
                    search={studentSearch} onSearch={setStudentSearch}
                    isLoading={searchingStudents} placeholder="Ism yoki raqam..."
                    emptyText="O'quvchi topilmadi"
                    items={students.map((s) => ({
                      id: s.id, name: s.full_name,
                      sub: [s.personal_number ? `#${s.personal_number}` : null, s.phone_number].filter(Boolean).join(" · "),
                    }))}
                    onSelect={(id) => { const s = students.find((x) => x.id === id); if (s) { setSelectedStudent(s); setStudentSearch(""); } }}
                  />
                )}
              </section>
            )}

            {/* ═══ MONTH ═══ */}
            {type !== "transfer" && clientType === "student" && selectedStudent && (
              <section>
                <FL><Calendar className="w-3.5 h-3.5 inline mr-1 mb-0.5" />Qaysi oy uchun</FL>
                <Select value={periodMonth} onValueChange={setPeriodMonth}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {buildMonthOptions(12).map((ym) => <SelectItem key={ym} value={ym}>{monthLabel(ym)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </section>
            )}

            {/* ═══ EMPLOYEE PICKER ═══ */}
            {type !== "transfer" && clientType === "employee" && (
              <section>
                <FL required>Xodim</FL>
                {selectedEmployee ? (
                  <>
                    <Chip
                      name={selectedEmployee.user_name}
                      sub={selectedEmployee.user_phone}
                      extra={`Balans: ${formatCurrency(selectedEmployee.balance)}`}
                      extraCls={selectedEmployee.balance <= 0 ? "text-rose-600 font-medium" : "text-slate-500"}
                      onClear={() => setSelectedEmployee(null)}
                    />
                    {empBalanceNeg && (
                      <div className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-rose-700">Balans nolda</p>
                          <p className="text-xs text-rose-600 mt-0.5">Balans manfiy bo'ladi. Tranzaksiya saqlanadi.</p>
                        </div>
                      </div>
                    )}
                    {!empBalanceNeg && empBalanceLow && (
                      <div className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-700">Balans yetarli emas</p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Mavjud {formatCurrency(selectedEmployee.balance)}, so'ralgan {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <PersonList
                    search={employeeSearch} onSearch={setEmployeeSearch}
                    isLoading={searchingEmployees} placeholder="Ism yoki telefon..."
                    emptyText="Xodim topilmadi"
                    items={employees.map((e) => ({
                      id: e.id, name: e.user_name, sub: e.user_phone,
                      extra: formatCurrency(e.balance),
                      extraCls: e.balance <= 0 ? "text-rose-500" : "text-slate-400",
                    }))}
                    onSelect={(id) => {
                      const e = employees.find((x) => x.id === id);
                      if (e) { setSelectedEmployee({ id: e.id, user_name: e.user_name, balance: e.balance, user_phone: e.user_phone }); setEmployeeSearch(""); }
                    }}
                  />
                )}
              </section>
            )}

            {/* ═══ THIRD PARTY ═══ */}
            {type !== "transfer" && clientType === "third_party" && (
              <section>
                <FL required>Uchinchi shaxs nomi</FL>
                <Input placeholder="Ism yoki tashkilot..." value={thirdPartyName} onChange={(e) => setThirdPartyName(e.target.value)} className="h-9" />
              </section>
            )}

            {/* ═══ AMOUNT ═══ */}
            <section>
              <FL required>Summa</FL>
              <div className="relative">
                <Input
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(displayAmt(parseAmt(e.target.value)))}
                  inputMode="numeric"
                  className="h-14 text-2xl font-bold tabular-nums pr-16"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">so'm</span>
              </div>
              {amount > 0 && <p className="text-xs text-slate-400 mt-1 tabular-nums">{formatCurrency(amount)}</p>}
            </section>

            {/* ═══ PAYMENT METHOD ═══ */}
            {type !== "transfer" && (
              <section>
                <FL>To'lov usuli</FL>
                <div className="grid grid-cols-2 gap-2">
                  {(["cash", "card"] as const).map((m) => {
                    const Icon = m === "cash" ? Banknote : CreditCard;
                    const active = paymentMethod === m;
                    return (
                      <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                        className={cn(
                          "flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all",
                          active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}>
                        <Icon className="w-4 h-4" />{m === "cash" ? "Naqd" : "Plastik"}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ═══ DESCRIPTION ═══ */}
            <section>
              <FL>Izoh</FL>
              <Textarea
                placeholder="Qo'shimcha ma'lumot (ixtiyoriy)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </section>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
          <Button variant="outline" className="h-10 px-4" onClick={onClose} disabled={isPending}>Bekor</Button>
          <Button className={cn("flex-1 h-10", cfg.btn)} disabled={isPending || amount <= 0} onClick={() => submit()}>
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saqlanmoqda...</>
            ) : type === "income" ? (
              <>↓ Kirim qilish</>
            ) : type === "expense" ? (
              <>↑ Chiqim qilish</>
            ) : (
              <><ArrowRightLeft className="w-4 h-4 mr-2" />Transfer</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Student financial card ────────────────────────────────────────────────────

function StudentCard({ student, activeSub, studentBalance, onClear }: {
  student: Student;
  activeSub?: StudentSubscription;
  studentBalance?: StudentBalance | null;
  onClear: () => void;
}) {
  const walletBal = studentBalance?.balance ?? null;
  const walletNeg = walletBal !== null && walletBal < 0;
  const hasDebt = activeSub && activeSub.total_debt > 0;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Identity row */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{student.full_name}</p>
          <p className="text-xs text-slate-400 truncate">
            {[student.personal_number ? `#${student.personal_number}` : null, student.phone_number].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button type="button" onClick={onClear}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Finance stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
        {/* Wallet */}
        <div className="px-3 py-2.5">
          <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
            <Wallet className="w-3 h-3" />Hamyon
          </p>
          {walletBal === null ? (
            <p className="text-xs text-slate-300">—</p>
          ) : (
            <p className={cn(
              "text-sm font-bold tabular-nums",
              walletNeg ? "text-rose-600" : walletBal > 0 ? "text-emerald-600" : "text-slate-400"
            )}>
              {walletBal >= 0 ? "+" : ""}{formatCurrency(walletBal)}
            </p>
          )}
        </div>

        {/* Subscription price */}
        <div className="px-3 py-2.5">
          <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />Abonement
          </p>
          {activeSub ? (
            <p className="text-sm font-bold tabular-nums text-slate-700">
              {formatCurrency(activeSub.subscription_plan_price)}
              <span className="text-xs font-normal text-slate-400">/oy</span>
            </p>
          ) : (
            <p className="text-xs text-slate-300">Yo'q</p>
          )}
        </div>

        {/* Debt */}
        <div className="px-3 py-2.5">
          <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />Qarz
          </p>
          {activeSub ? (
            <p className={cn("text-sm font-bold tabular-nums", hasDebt ? "text-rose-600" : "text-emerald-600")}>
              {hasDebt ? formatCurrency(activeSub.total_debt) : "Yo'q"}
            </p>
          ) : (
            <p className="text-xs text-slate-300">—</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(walletNeg || hasDebt) && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border-t border-amber-100">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            {walletNeg && hasDebt ? "Hamyon manfiy va qarzdor" :
             walletNeg ? "Hamyon balansi manfiy" : "To'lanmagan qarz mavjud"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Transfer section ──────────────────────────────────────────────────────────

function TransferSection({ fromMethod, toMethod, cashNet, cardNet, onChange }: {
  fromMethod: "cash" | "card";
  toMethod: "cash" | "card";
  cashNet?: number;
  cardNet?: number;
  onChange: (from: "cash" | "card", to: "cash" | "card") => void;
}) {
  const methods = [
    { value: "cash" as const,  label: "Naqd pul",   Icon: Banknote,    balance: cashNet },
    { value: "card" as const,  label: "Plastik",     Icon: CreditCard,  balance: cardNet },
  ];
  const from = methods.find((m) => m.value === fromMethod)!;
  const to   = methods.find((m) => m.value === toMethod)!;

  return (
    <section>
      <FL>O'tkazma yo'nalishi</FL>

      {/* Visual flow */}
      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex-1 rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3">
          <p className="text-xs text-white/50 mb-1.5">Manba</p>
          <div className="flex items-center gap-2">
            <from.Icon className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">{from.label}</span>
          </div>
          {from.balance !== undefined && (
            <p className="text-xs text-white/50 mt-1">{formatCurrency(from.balance)}</p>
          )}
        </div>

        <div className="flex items-center justify-center px-1">
          <button
            type="button"
            onClick={() => onChange(toMethod, fromMethod)}
            className="w-8 h-8 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-slate-400 hover:text-slate-800 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-400 mb-1.5">Maqsad</p>
          <div className="flex items-center gap-2">
            <to.Icon className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-700">{to.label}</span>
          </div>
          {to.balance !== undefined && (
            <p className="text-xs text-slate-400 mt-1">{formatCurrency(to.balance)}</p>
          )}
        </div>
      </div>

      {/* Quick direction buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { from: "cash" as const, to: "card" as const, label: "Naqd → Plastik" },
          { from: "card" as const, to: "cash" as const, label: "Plastik → Naqd"  },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.from, opt.to)}
            className={cn(
              "h-9 rounded-xl border-2 text-xs font-medium transition-all",
              fromMethod === opt.from && toMethod === opt.to
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Shared mini components ────────────────────────────────────────────────────

function FL({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
      {children}{required && <span className="text-rose-500 normal-case font-normal ml-1">*</span>}
    </Label>
  );
}

function Chip({ name, sub, extra, extraCls, onClear }: {
  name: string; sub?: string | null; extra?: string; extraCls?: string; onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
        {extra && <p className={cn("text-xs mt-0.5", extraCls ?? "text-slate-500")}>{extra}</p>}
      </div>
      <button type="button" onClick={onClear} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function PersonList({ search, onSearch, isLoading, placeholder, emptyText, items, onSelect }: {
  search: string; onSearch: (v: string) => void; isLoading: boolean;
  placeholder: string; emptyText: string;
  items: { id: string; name: string; sub?: string | null; extra?: string; extraCls?: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <Input className="pl-9 h-9 text-sm" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)} />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />}
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100 max-h-48 overflow-y-auto">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-5 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" /><span className="text-sm text-slate-400">Yuklanmoqda...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-5 text-center"><p className="text-sm text-slate-400">{emptyText}</p></div>
        ) : (
          items.map((item) => (
            <button key={item.id} type="button" onClick={() => onSelect(item.id)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {item.sub}
                  {item.extra && <span className={cn("ml-2", item.extraCls ?? "text-slate-400")}>{item.extra}</span>}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
