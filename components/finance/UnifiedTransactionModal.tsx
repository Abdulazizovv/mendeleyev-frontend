"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { extractApiError } from "@/lib/error-messages";
import { financeApi, schoolApi, branchApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Loader2, Search, X, TrendingUp, TrendingDown, ArrowRightLeft,
  Users, Globe, HelpCircle, Banknote, CreditCard, Building2,
  GraduationCap, Check, Calendar, AlertTriangle, ArrowRight,
  ChevronDown, Plus, Lock, ChevronRight,
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
  methodBalance?: { cash_net: number; card_net: number; bank_net?: number } | null;
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
function buildMonthOptions(pastCount = 5, futureCount = 3) {
  const now = new Date();
  const options: string[] = [];
  for (let i = pastCount; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  for (let i = 1; i <= futureCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return options;
}
type DebtMonth = { month: string; owed: number; is_partial: boolean };

function getUnpaidMonths(sub?: StudentSubscription | null): DebtMonth[] {
  if (!sub || !sub.total_debt || sub.total_debt <= 0 || !sub.subscription_plan_price || !sub.next_payment_date) return [];
  const price = sub.subscription_plan_price;
  const fullMonths = Math.floor(sub.total_debt / price);
  const partial = sub.total_debt % price;
  const totalPeriods = fullMonths + (partial > 0 ? 1 : 0);
  const result: DebtMonth[] = [];
  for (let i = totalPeriods; i >= 1; i--) {
    const nextDate = new Date(sub.next_payment_date + "T00:00:00");
    const d = new Date(nextDate.getFullYear(), nextDate.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isPartial = i === totalPeriods && partial > 0;
    result.push({ month: ym, owed: isPartial ? partial : price, is_partial: isPartial });
  }
  return result;
}

// Keyingi oyni hisoblash (YYYY-MM)
function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1); // m — 0-indexed bo'lgani uchun to'g'ri
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  const [paymentMethod, setPaymentMethod]   = useState<"cash" | "card" | "bank">("cash");
  const [toMethod, setToMethod]             = useState<"cash" | "card">("card");
  const [description, setDescription]      = useState("");
  // ordered array of YYYY-MM strings (first item = default/oldest debt)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([currentYearMonth()]);
  const [thirdPartyName, setThirdPartyName] = useState("");
  const [studentSearch, setStudentSearch]   = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; user_name: string; balance: number; user_phone?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCategoryId(""); setCatOpen(false); setCatSearch(""); setAmountStr("");
    setPaymentMethod("cash"); setToMethod("card");
    setDescription(""); setSelectedMonths([currentYearMonth()]); setThirdPartyName("");
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
  const activeSub = studentSubData?.results?.[0] ?? null;
  const debtMonths = useMemo(() => getUnpaidMonths(activeSub), [activeSub]);

  // Debt oylarini avtomatik belgilash
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedStudent) {
      setSelectedMonths([currentYearMonth()]);
      return;
    }
    if (debtMonths.length > 0) {
      // Faqat birinchi qarz oyini avtomatik qo'yamiz
      setSelectedMonths([debtMonths[0].month]);
    } else {
      setSelectedMonths([currentYearMonth()]);
    }
  }, [isOpen, selectedStudent, activeSub]);

  // Tanlangan oylar asosida summani avtomatik hisoblash
  function getMonthAmount(ym: string): number {
    const debt = debtMonths.find((m) => m.month === ym);
    if (debt) return debt.owed;
    return activeSub?.subscription_plan_price ?? 0;
  }

  useEffect(() => {
    if (clientType !== "student" || !activeSub) return;
    if (selectedMonths.length === 0) return;
    const total = selectedMonths.reduce((sum, ym) => sum + getMonthAmount(ym), 0);
    if (total > 0) setAmountStr(displayAmt(total));
  }, [selectedMonths, activeSub?.subscription_plan_price, clientType]);

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
        return financeApi.internalTransfer({ cash_register: cashRegister.id, from_method: paymentMethod as "cash" | "card", to_method: toMethod, amount, description });
      }
      if (!categoryId) throw new Error("Tranzaksiya turini tanlang");
      if (clientType === "student"     && !selectedStudent)           throw new Error("O'quvchini tanlang");
      if (clientType === "student"     && selectedMonths.length === 0) throw new Error("Kamida bitta oy tanlang");
      if (clientType === "employee"    && !selectedEmployee)           throw new Error("Xodimni tanlang");
      if (clientType === "third_party" && !thirdPartyName.trim())      throw new Error("Uchinchi shaxs nomini kiriting");

      const commonPayload = {
        branch: branchId, cash_register: cashRegister.id,
        transaction_type: type === "income" ? "income" : "expense",
        category: categoryId, payment_method: paymentMethod, description,
        student_profile:     clientType === "student"     ? selectedStudent?.id  : undefined,
        employee_membership: clientType === "employee"    ? selectedEmployee?.id : undefined,
        third_party_name:    clientType === "third_party" ? thirdPartyName       : undefined,
        auto_approve: true,
      } as const;

      // O'quvchi to'lovi — bitta tranzaksiya, period_months ro'yxati bilan
      if (clientType === "student") {
        const sortedMonths = [...selectedMonths].sort();
        return financeApi.createTransaction({
          ...commonPayload,
          amount,
          period_month: sortedMonths[0],
          period_months: sortedMonths.length > 1 ? sortedMonths : undefined,
        });
      }

      return financeApi.createTransaction({ ...commonPayload, amount });
    },
    onSuccess: () => {
      toast.success(type === "income" ? "Kirim saqlandi" : type === "expense" ? "Chiqim saqlandi" : "Transfer amalga oshirildi");
      queryClient.invalidateQueries({ queryKey: ["employees-modal"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["tx-summary"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onSuccess?.(); onClose();
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Xatolik yuz berdi"),
  });

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" hideClose className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0 overflow-hidden">
        <SheetTitle className="sr-only">{cfg.label}</SheetTitle>

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
                fromMethod={paymentMethod as "cash" | "card"}
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
                    debtMonths={debtMonths}
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
              <MonthPicker
                debtMonths={debtMonths}
                activeSub={activeSub}
                selectedMonths={selectedMonths}
                onChange={setSelectedMonths}
              />
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
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "cash",  Icon: Banknote,   label: "Naqd"    },
                    { value: "card",  Icon: CreditCard,  label: "Plastik" },
                    { value: "bank",  Icon: Building2,   label: "Bank"    },
                  ] as const).map(({ value, Icon, label }) => {
                    const active = paymentMethod === value;
                    return (
                      <button key={value} type="button" onClick={() => setPaymentMethod(value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 h-10 rounded-xl border-2 text-sm font-medium transition-all",
                          active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}>
                        <Icon className="w-4 h-4" />{label}
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

function StudentCard({ student, activeSub, studentBalance, debtMonths, onClear }: {
  student: Student;
  activeSub?: StudentSubscription | null;
  studentBalance?: StudentBalance | null;
  debtMonths: DebtMonth[];
  onClear: () => void;
}) {
  const walletBal = studentBalance?.balance ?? 0;
  const totalDebt = activeSub?.total_debt ?? 0;
  const hasDebt = totalDebt > 0;
  const [debtExpanded, setDebtExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Header: ism va o'chirish tugmasi */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50">
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

      {/* Balans va qarz */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
        <div className="px-3 py-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Balans</p>
          <p className={cn("text-sm font-bold tabular-nums",
            walletBal > 0 ? "text-emerald-600" : walletBal < 0 ? "text-rose-600" : "text-slate-400"
          )}>
            {walletBal > 0 ? "+" : ""}{formatCurrency(walletBal)}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
            {hasDebt ? "Qarz" : activeSub ? "Oylik to'lov" : "Abonement"}
          </p>
          {hasDebt ? (
            <p className="text-sm font-bold tabular-nums text-rose-600">
              {formatCurrency(totalDebt)}
              <span className="text-[10px] font-normal text-rose-400 ml-1">{debtMonths.length} oy</span>
            </p>
          ) : activeSub ? (
            <p className="text-sm font-bold tabular-nums text-slate-700">
              {formatCurrency(activeSub.subscription_plan_price)}
              <span className="text-[10px] font-normal text-slate-400">/oy</span>
            </p>
          ) : (
            <p className="text-xs text-slate-300">Yo'q</p>
          )}
        </div>
      </div>

      {/* Qarz oylar batafsil */}
      {hasDebt && debtMonths.length > 0 && (
        <div className="border-t border-rose-100">
          <button
            type="button"
            onClick={() => setDebtExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-rose-50 transition-colors"
          >
            <span className="text-xs font-medium text-rose-600">
              Qarz oylar ro'yxati ({debtMonths.length} ta)
            </span>
            <ChevronRight className={cn("w-3.5 h-3.5 text-rose-400 transition-transform", debtExpanded && "rotate-90")} />
          </button>
          {debtExpanded && (
            <div className="divide-y divide-rose-50 bg-rose-50/50">
              {debtMonths.map((dm, i) => (
                <div key={dm.month} className="flex items-center justify-between px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-rose-700 font-medium">{monthLabel(dm.month)}</span>
                    {dm.is_partial && (
                      <span className="text-[9px] text-rose-400 bg-rose-100 px-1.5 py-0.5 rounded">qisman</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-rose-700 tabular-nums">{formatCurrency(dm.owed)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Month picker ─────────────────────────────────────────────────────────────

function MonthPicker({ debtMonths, activeSub, selectedMonths, onChange }: {
  debtMonths: DebtMonth[];
  activeSub?: StudentSubscription | null;
  selectedMonths: string[];
  onChange: (months: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const price = activeSub?.subscription_plan_price ?? 0;
  const debtSet = new Set(debtMonths.map((m) => m.month));
  const nowYm = currentYearMonth();

  function getAmount(ym: string): number {
    const debt = debtMonths.find((m) => m.month === ym);
    return debt ? debt.owed : price;
  }

  // To'lanmagan qarz oylari (tanlanmagan)
  const unpaidDebtMonths = debtMonths.filter((dm) => !selectedMonths.includes(dm.month));
  const hasUnpaidDebt = unpaidDebtMonths.length > 0;
  const firstDebt = debtMonths[0];

  // Tanlash uchun mavjud oylar ro'yxati
  const availableMonths: Array<{ ym: string; locked: boolean; reason?: string }> = useMemo(() => {
    const selected = new Set(selectedMonths);

    if (hasUnpaidDebt) {
      // Faqat birinchi to'lanmagan qarz oyi tanlanishi mumkin
      return unpaidDebtMonths.map((dm, i) => ({
        ym: dm.month,
        locked: i > 0, // Birinchidan tashqari qolganlar qulflangan
        reason: i > 0 ? `Avval ${monthLabel(unpaidDebtMonths[i - 1].month)} to'lang` : undefined,
      }));
    }

    // Qarz yo'q — erkin oy tanlash (o'tgan 6 + kelajak 6, allaqachon tanlanganlar bundan tashqari)
    return buildMonthOptions(6, 6)
      .filter((ym) => !selected.has(ym))
      .map((ym) => ({ ym, locked: false }));
  }, [selectedMonths, unpaidDebtMonths, hasUnpaidDebt]);

  function handleSelect(ym: string) {
    if (!selectedMonths.includes(ym)) {
      onChange([...selectedMonths, ym]);
    }
    setPickerOpen(false);
  }

  function handleRemove(idx: number) {
    // Oxirgi oydan yuqorisini olib tashlash mumkin emas (ketma-ketlik)
    const newMonths = selectedMonths.slice(0, idx);
    onChange(newMonths.length > 0 ? newMonths : [selectedMonths[0]]);
  }

  const totalSelected = selectedMonths.reduce((s, ym) => s + getAmount(ym), 0);
  const canOpenPicker = availableMonths.length > 0;

  return (
    <section>
      <FL><Calendar className="w-3.5 h-3.5 inline mr-1 mb-0.5" />To'lov oyi</FL>

      <div className="space-y-2">
        {/* Tanlangan oylar */}
        {selectedMonths.map((ym, idx) => {
          const isDebt = debtSet.has(ym);
          const amt = getAmount(ym);
          const debtInfo = debtMonths.find((m) => m.month === ym);
          const canRemove = idx > 0;

          return (
            <div
              key={ym}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2",
                isDebt ? "border-rose-300 bg-rose-50" : "border-emerald-300 bg-emerald-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                isDebt ? "bg-rose-200 text-rose-700" : "bg-emerald-200 text-emerald-700"
              )}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-sm font-semibold", isDebt ? "text-rose-800" : "text-emerald-800")}>
                    {monthLabel(ym)}
                  </span>
                  {isDebt && (
                    <span className="text-[9px] font-medium bg-rose-200 text-rose-700 px-1.5 py-0.5 rounded-full">
                      qarz{debtInfo?.is_partial ? " · qisman" : ""}
                    </span>
                  )}
                </div>
                <span className={cn("text-xs tabular-nums font-medium", isDebt ? "text-rose-600" : "text-emerald-600")}>
                  {formatCurrency(amt)}
                </span>
              </div>

              {canRemove ? (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0",
                    isDebt
                      ? "text-rose-400 hover:text-rose-700 hover:bg-rose-200"
                      : "text-emerald-400 hover:text-emerald-700 hover:bg-emerald-200"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <div className="w-6 h-6 shrink-0" />
              )}
            </div>
          );
        })}

        {/* + Oy qo'shish */}
        {canOpenPicker && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className={cn(
                "w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed text-sm font-medium transition-all",
                pickerOpen
                  ? "border-slate-400 bg-slate-50 text-slate-700"
                  : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Oy qo'shish
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", pickerOpen && "rotate-180")} />
            </button>

            {/* Oy tanlash paneli */}
            {pickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {hasUnpaidDebt ? (
                  /* Qarz oylari — ketma-ket */
                  <div className="p-2 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide px-2 py-1">Qarz oylar</p>
                    {availableMonths.map(({ ym, locked, reason }) => {
                      const dm = debtMonths.find((m) => m.month === ym)!;
                      return (
                        <button
                          key={ym}
                          type="button"
                          disabled={locked}
                          onClick={() => !locked && handleSelect(ym)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                            locked
                              ? "opacity-40 cursor-not-allowed bg-slate-50"
                              : "hover:bg-rose-50 active:bg-rose-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {locked
                              ? <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              : <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 shrink-0" />
                            }
                            <div>
                              <p className="text-sm font-medium text-slate-800">{monthLabel(ym)}</p>
                              {reason && <p className="text-[10px] text-slate-400">{reason}</p>}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-rose-600 tabular-nums">{formatCurrency(dm.owed)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Erkin oy tanlash */
                  <div className="p-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide px-2 py-1">Oy tanlang</p>
                    <div className="grid grid-cols-3 gap-1">
                      {availableMonths.map(({ ym }) => {
                        const isFuture = ym > nowYm;
                        const isCurrent = ym === nowYm;
                        return (
                          <button
                            key={ym}
                            type="button"
                            onClick={() => handleSelect(ym)}
                            className={cn(
                              "px-2 py-2 rounded-lg text-xs font-medium text-center transition-colors",
                              isCurrent
                                ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                : isFuture
                                ? "text-blue-700 hover:bg-blue-50"
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {monthLabel(ym)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Qarz bor, lekin birinchi tanlangan oy noto'g'ri */}
        {!canOpenPicker && hasUnpaidDebt && firstDebt && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Avval <span className="font-bold">{monthLabel(firstDebt.month)}</span> qarzini to'lang
            </p>
          </div>
        )}
      </div>

      {/* Jami */}
      {selectedMonths.length > 1 && totalSelected > 0 && (
        <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100">
          <span className="text-xs text-slate-500">{selectedMonths.length} ta oy · jami:</span>
          <span className="text-sm font-bold text-slate-800 tabular-nums">{formatCurrency(totalSelected)}</span>
        </div>
      )}
    </section>
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
