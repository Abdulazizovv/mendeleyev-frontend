"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDebounce } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Student, PaginatedResponse, Class } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GraduationCap,
  Search,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  CalendarDays,
  RefreshCcw,
  Clock,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, subMonths } from "date-fns";
import { uz } from "date-fns/locale";

// ─── helpers ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: "Aktiv",        color: "text-green-700",  bg: "bg-green-100"  },
  archived:    { label: "Arxivlangan",  color: "text-gray-700",   bg: "bg-gray-100"   },
  suspended:   { label: "Muzlatilgan",  color: "text-red-700",    bg: "bg-red-100"    },
  graduated:   { label: "Bitirgan",     color: "text-blue-700",   bg: "bg-blue-100"   },
  transferred: { label: "O'tkazilgan",  color: "text-orange-700", bg: "bg-orange-100" },
};

function statusInfo(status: string) {
  return STATUS_MAP[status] ?? { label: status, color: "text-gray-700", bg: "bg-gray-100" };
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy", { locale: uz });
}

function fmtDateShort(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, "dd.MM.yyyy");
}

// ─── period config ─────────────────────────────────────────────────────────

type PeriodKey = "month" | "30d" | "3m" | "all" | "custom";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "month", label: "Joriy oy"      },
  { key: "30d",   label: "Oxirgi 30 kun" },
  { key: "3m",    label: "Oxirgi 3 oy"   },
  { key: "all",   label: "Barcha vaqt"   },
  { key: "custom",label: "Maxsus sana"   },
];

function periodToRange(key: PeriodKey, customFrom: string, customTo: string) {
  const now = new Date();
  switch (key) {
    case "month":  return { gte: startOfMonth(now).toISOString(), lte: undefined };
    case "30d":    return { gte: subDays(now, 30).toISOString(),  lte: undefined };
    case "3m":     return { gte: subMonths(now, 3).toISOString(), lte: undefined };
    case "all":    return { gte: undefined, lte: undefined };
    case "custom": return {
      gte: customFrom ? new Date(customFrom).toISOString() : undefined,
      lte: customTo   ? new Date(customTo + "T23:59:59").toISOString() : undefined,
    };
  }
}

// ─── sort config ───────────────────────────────────────────────────────────

type SortField = "created_at" | "first_name" | "last_name";

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: "created_at", label: "Qo'shilgan sana" },
  { field: "first_name", label: "Ism"              },
  { field: "last_name",  label: "Familiya"         },
];

// ─── component ─────────────────────────────────────────────────────────────

export default function NewStudentsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();

  // data state
  const [students,   setStudents]   = React.useState<Student[]>([]);
  const [classes,    setClasses]    = React.useState<Class[]>([]);
  const [loading,    setLoading]    = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const firstLoad = React.useRef(true);

  // pagination
  const [page,      setPage]      = React.useState(1);
  const [total,     setTotal]     = React.useState(0);
  const [pageSize,  setPageSize]  = React.useState(20);

  // search
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 500);

  // period filter
  const [period,     setPeriod]     = React.useState<PeriodKey>("month");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo,   setCustomTo]   = React.useState("");

  // other filters
  const [genderFilter, setGenderFilter] = React.useState("all");
  const [classFilter,  setClassFilter]  = React.useState("all");

  // sorting
  const [sortField, setSortField] = React.useState<SortField>("created_at");
  const [sortDir,   setSortDir]   = React.useState<"asc" | "desc">("desc");

  // mobile filter panel
  const [showFilters, setShowFilters] = React.useState(false);

  // reset page when any filter changes
  React.useEffect(() => { setPage(1); }, [debouncedSearch, period, customFrom, customTo, genderFilter, classFilter, pageSize]);

  // load classes for filter
  React.useEffect(() => {
    if (!currentBranch?.branch_id) return;
    let alive = true;
    schoolApi.getClasses(currentBranch.branch_id)
      .then((data) => { if (alive) setClasses(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currentBranch?.branch_id]);

  // fetch students
  const fetchStudents = React.useCallback(async () => {
    if (!currentBranch?.branch_id) return;
    firstLoad.current ? setLoading(true) : setRefreshing(true);

    try {
      const { gte, lte } = periodToRange(period, customFrom, customTo);
      const ordering = sortDir === "desc" ? `-${sortField}` : sortField;

      const params: Parameters<typeof schoolApi.getStudents>[1] = {
        page,
        page_size: pageSize,
        ordering,
        created_at__gte: gte,
        created_at__lte: lte,
      };
      if (debouncedSearch)        params.search   = debouncedSearch;
      if (genderFilter !== "all") params.gender   = genderFilter as "male" | "female";
      if (classFilter  !== "all") params.class_id = classFilter;

      const res: PaginatedResponse<Student> = await schoolApi.getStudents(
        currentBranch.branch_id,
        params,
      );
      setStudents(res.results);
      setTotal(res.count);
    } catch {
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      if (firstLoad.current) { setLoading(false); firstLoad.current = false; }
      else setRefreshing(false);
    }
  }, [currentBranch?.branch_id, page, pageSize, debouncedSearch, period, customFrom, customTo, genderFilter, classFilter, sortField, sortDir]);

  React.useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const totalPages = Math.ceil(total / pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 ml-1" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-blue-600" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-blue-600" />;
  }

  const activePeriodLabel = PERIODS.find(p => p.key === period)?.label ?? "";
  const hasActiveFilters = genderFilter !== "all" || classFilter !== "all" || period !== "month";

  // ─── loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Yangi O'quvchilar</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              {activePeriodLabel}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Jami: {total} ta o'quvchi</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchStudents} disabled={refreshing}>
            <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-2">Yangilash</span>
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => router.push("/school/students/create")}
          >
            <UserPlus className="w-4 h-4" />
            <span className="ml-2">Yangi</span>
          </Button>
        </div>
      </div>

      {/* ── Period Pills ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              period === key
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Custom date inputs (shown only when period = custom) ── */}
      {period === "custom" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Dan</label>
            <Input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Gacha</label>
            <Input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* ── Search + Filter toggle ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Ism, telefon yoki shaxsiy raqam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle (mobile) */}
        <Button
          variant="outline"
          size="sm"
          className={`sm:hidden h-10 px-3 relative ${hasActiveFilters ? "border-blue-400 text-blue-600" : ""}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Button>

        {/* Filters inline (desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="h-10 w-32 text-sm">
              <SelectValue placeholder="Jins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha jins</SelectItem>
              <SelectItem value="male">O'g'il</SelectItem>
              <SelectItem value="female">Qiz</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-10 w-36 text-sm">
              <SelectValue placeholder="Sinf" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha sinflar</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
            <SelectTrigger className="h-10 w-20 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Mobile filter panel ── */}
      {showFilters && (
        <Card className="sm:hidden border border-blue-100 shadow-sm">
          <CardContent className="pt-4 pb-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtrlar
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Jins</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="male">O'g'il</SelectItem>
                    <SelectItem value="female">Qiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sinf</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sahifa hajmi</label>
              <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                <SelectTrigger className="h-9 text-sm w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 ta</SelectItem>
                  <SelectItem value="20">20 ta</SelectItem>
                  <SelectItem value="50">50 ta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setGenderFilter("all"); setClassFilter("all"); setPeriod("month"); }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Filtrlarni tozalash
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Table (desktop) / Cards (mobile) ── */}
      <Card className="border-0 shadow-lg overflow-hidden">

        {/* Refreshing overlay */}
        {refreshing && (
          <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 border-b border-blue-100">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Yangilanmoqda...</span>
          </div>
        )}

        {/* ── Desktop table ── */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-10 text-center text-xs">#</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("first_name")}
                    className="flex items-center text-xs font-semibold hover:text-blue-600 transition-colors"
                  >
                    O'quvchi <SortIcon field="first_name" />
                  </button>
                </TableHead>
                <TableHead className="text-xs">Telefon</TableHead>
                <TableHead className="text-xs">Sinf</TableHead>
                <TableHead className="text-xs">Holat</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center text-xs font-semibold hover:text-blue-600 transition-colors"
                  >
                    Qo'shilgan <SortIcon field="created_at" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">O'quvchilar topilmadi</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {activePeriodLabel} uchun ma'lumot yo'q
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => {
                  const si = statusInfo(student.status);
                  const fullName = student.full_name ||
                    `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                      onClick={() => router.push(`/school/students/${student.id}`)}
                    >
                      <TableCell className="text-center text-gray-400 text-xs">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm leading-tight">{fullName}</p>
                            {student.personal_number && (
                              <p className="text-xs text-gray-400">{student.personal_number}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{student.phone_number || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{student.current_class?.name ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${si.bg} ${si.color}`}>
                          {si.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{fmtDate(student.created_at)}</span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden">
          {students.length === 0 ? (
            <div className="text-center py-16 px-4">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">O'quvchilar topilmadi</p>
              <p className="text-gray-400 text-xs mt-1">{activePeriodLabel} uchun ma'lumot yo'q</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((student, idx) => {
                const si = statusInfo(student.status);
                const fullName = student.full_name ||
                  `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/40 cursor-pointer transition-colors active:bg-blue-50"
                    onClick={() => router.push(`/school/students/${student.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">{fullName}</p>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${si.bg} ${si.color}`}>
                          {si.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {student.phone_number || "—"}
                        </span>
                        {student.current_class && (
                          <span className="text-xs text-gray-500">{student.current_class.name}</span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                          <CalendarDays className="w-3 h-3" />
                          {fmtDateShort(student.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-medium text-gray-700 px-1.5 min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
