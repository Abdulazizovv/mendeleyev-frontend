"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDebounce } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Student, PaginatedResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  GraduationCap, Search, Loader2, ChevronLeft, ChevronRight,
  Phone, RefreshCcw, X, AlertCircle, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/translations";

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

function formatPeriod(ym: string) {
  const [y, m] = ym.split("-");
  return `${UZ_MONTHS[parseInt(m) - 1]} ${y}`;
}

function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  const suffix = d.startsWith("998") ? d.slice(3) : d.startsWith("8") ? d.slice(1) : d;
  const parts = [suffix.slice(0, 2), suffix.slice(2, 5), suffix.slice(5, 7), suffix.slice(7, 9)].filter(Boolean);
  return "+998 " + parts.join(" ");
}

type UnpaidMonth = { month: string; owed: number; paid: number; is_partial: boolean };

function MonthBadge({ m }: { m: UnpaidMonth }) {
  if (m.is_partial) {
    return (
      <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
        <span>{formatPeriod(m.month)}</span>
        <span className="opacity-70">({formatCurrency(m.owed)})</span>
      </span>
    );
  }
  return (
    <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-medium">
      {formatPeriod(m.month)}
    </span>
  );
}

export default function DebtorsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();

  const [students,   setStudents]   = React.useState<Student[]>([]);
  const [loading,    setLoading]    = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const firstLoad = React.useRef(true);
  const [page,     setPage]     = React.useState(1);
  const [total,    setTotal]    = React.useState(0);
  const [pageSize] = React.useState(20);
  const [search,   setSearch]   = React.useState("");
  const debouncedSearch = useDebounce(search, 500);

  React.useEffect(() => { setPage(1); }, [debouncedSearch]);
  React.useEffect(() => {
    firstLoad.current = true;
    setStudents([]);
    setTotal(0);
  }, [currentBranch?.branch_id]);

  const fetchStudents = React.useCallback(async () => {
    if (!currentBranch?.branch_id) return;
    firstLoad.current ? setLoading(true) : setRefreshing(true);
    try {
      const params: Parameters<typeof schoolApi.getStudents>[1] = {
        page, page_size: pageSize,
        status: "active",
        has_debt: true,
        ordering: "-created_at",
      };
      if (debouncedSearch) params.search = debouncedSearch;
      const res: PaginatedResponse<Student> = await schoolApi.getStudents(currentBranch.branch_id, params);
      setStudents(res.results);
      setTotal(res.count);
    } catch {
      toast.error("Qarzdorlarni yuklashda xatolik");
    } finally {
      if (firstLoad.current) { setLoading(false); firstLoad.current = false; }
      else setRefreshing(false);
    }
  }, [currentBranch?.branch_id, page, pageSize, debouncedSearch]);

  React.useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Qarzdorlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Qarzdorlar</h1>
              <p className="text-gray-500 text-sm mt-0.5">Jami: {total} ta qarzdor o&apos;quvchi</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStudents} disabled={refreshing}>
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline ml-1.5">Yangilash</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Ism, familiya, telefon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {refreshing && (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-red-50 border-b border-red-100">
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            <span className="text-sm text-red-700">Yangilanmoqda...</span>
          </div>
        )}

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-10 text-center text-xs">#</TableHead>
                <TableHead className="text-xs">O&apos;quvchi</TableHead>
                <TableHead className="text-xs">Sinf</TableHead>
                <TableHead className="text-xs">Telefon</TableHead>
                <TableHead className="text-xs text-right text-red-600">Qarzdorlik</TableHead>
                <TableHead className="text-xs">To&apos;lanmagan oylar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">Qarzdor o&apos;quvchilar topilmadi</p>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => {
                  const fullName = student.full_name || `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
                  const totalDebt = student.balance?.total_debt ?? 0;
                  const bal = student.balance?.balance ?? 0;
                  const netBalance = bal - totalDebt;
                  const unpaidMonths: UnpaidMonth[] = student.balance?.debt_subscription?.unpaid_months ?? [];
                  return (
                    <TableRow key={student.id}
                      className="cursor-pointer hover:bg-red-50/30 transition-colors"
                      onClick={() => router.push(`/school/students/${student.id}`)}>
                      <TableCell className="text-center text-xs text-gray-400">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm leading-tight">{fullName}</p>
                            {netBalance < 0 && (
                              <p className="text-[10px] text-red-500 tabular-nums">{formatCurrency(netBalance)} holat</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.current_class ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
                            <BookOpen className="w-3.5 h-3.5" />{student.current_class.name}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatPhoneDisplay(student.phone_number)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold text-red-600 tabular-nums">
                          {formatCurrency(totalDebt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {unpaidMonths.slice(0, 4).map(m => (
                            <MonthBadge key={m.month} m={m} />
                          ))}
                          {unpaidMonths.length > 4 && (
                            <span className="text-[10px] text-red-400">+{unpaidMonths.length - 4}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden">
          {students.length === 0 ? (
            <div className="text-center py-16 px-4">
              <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">Qarzdor o&apos;quvchilar topilmadi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map(student => {
                const fullName = student.full_name || `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
                const totalDebt = student.balance?.total_debt ?? 0;
                const unpaidMonths: UnpaidMonth[] = student.balance?.debt_subscription?.unpaid_months ?? [];
                return (
                  <div key={student.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-red-50/30 active:bg-red-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/school/students/${student.id}`)}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5">
                      {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{fullName}</p>
                        <span className="text-sm font-bold text-red-600 tabular-nums shrink-0">
                          {formatCurrency(totalDebt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{formatPhoneDisplay(student.phone_number)}
                        </span>
                      </div>
                      {unpaidMonths.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {unpaidMonths.slice(0, 3).map(m => (
                            <MonthBadge key={m.month} m={m} />
                          ))}
                          {unpaidMonths.length > 3 && (
                            <span className="text-[10px] text-red-400">+{unpaidMonths.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
