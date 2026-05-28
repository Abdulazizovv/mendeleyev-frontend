"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDebounce } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Student, PaginatedResponse, Class, AcademicYear } from "@/lib/api";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  Upload,
  X,
  SlidersHorizontal,
  Filter,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { formatCurrency } from "@/lib/translations";

// ─── helpers ───────────────────────────────────────────────────────────────


function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  const suffix = d.startsWith("998") ? d.slice(3) : d.startsWith("8") ? d.slice(1) : d;
  const parts = [suffix.slice(0, 2), suffix.slice(2, 5), suffix.slice(5, 7), suffix.slice(7, 9)].filter(Boolean);
  return "+998 " + parts.join(" ");
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy", { locale: uz });
}
function fmtDateShort(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : format(d, "dd.MM.yyyy");
}

type SortField = "first_name" | "last_name" | "created_at" | "personal_number";

const SORT_LABELS: Record<SortField, string> = {
  first_name:      "Ism",
  last_name:       "Familiya",
  created_at:      "Qo'shilgan",
  personal_number: "Shaxsiy raqam",
};

// ─── component ─────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();

  // data
  const [students,      setStudents]      = React.useState<Student[]>([]);
  const [classes,       setClasses]       = React.useState<Class[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [loading,       setLoading]       = React.useState(true);
  const [refreshing,    setRefreshing]    = React.useState(false);
  const firstLoad = React.useRef(true);

  // pagination
  const [page,     setPage]     = React.useState(1);
  const [total,    setTotal]    = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);

  // search
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 500);

  // filters
  const [academicYear, setAcademicYear] = React.useState("all");
  const [classFilter,  setClassFilter]  = React.useState("all");
  const [genderFilter, setGenderFilter] = React.useState("all");

  // sort
  const [sortField, setSortField] = React.useState<SortField>("created_at");
  const [sortDir,   setSortDir]   = React.useState<"asc" | "desc">("desc");

  // mobile panel
  const [showFilters, setShowFilters] = React.useState(false);

  // reset page on filter change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, academicYear, classFilter, genderFilter, pageSize]);

  // reset state when branch changes
  React.useEffect(() => {
    firstLoad.current = true;
    setStudents([]);
    setTotal(0);
    setClassFilter("all");
    setAcademicYear("all");
  }, [currentBranch?.branch_id]);

  // load academic years
  React.useEffect(() => {
    if (!currentBranch?.branch_id) return;
    let alive = true;
    schoolApi.getAcademicYears(currentBranch.branch_id)
      .then(data => { if (alive) setAcademicYears(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currentBranch?.branch_id]);

  // load classes (filtered by academic year for the dropdown)
  React.useEffect(() => {
    if (!currentBranch?.branch_id) return;
    let alive = true;
    const params = academicYear !== "all" ? { academic_year_id: academicYear } : undefined;
    schoolApi.getClasses(currentBranch.branch_id, params)
      .then(data => { if (alive) setClasses(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currentBranch?.branch_id, academicYear]);

  // when academic year changes, reset class filter
  React.useEffect(() => { setClassFilter("all"); }, [academicYear]);

  // fetch students
  const fetchStudents = React.useCallback(async () => {
    if (!currentBranch?.branch_id) return;
    firstLoad.current ? setLoading(true) : setRefreshing(true);

    try {
      const ordering = sortDir === "desc" ? `-${sortField}` : sortField;
      const params: Parameters<typeof schoolApi.getStudents>[1] = {
        page,
        page_size: pageSize,
        ordering,
      };
      // NOTE: academic_year_id is NOT passed to students API (not supported).
      // It only filters the classes dropdown above.
      params.status = "active";
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
  }, [
    currentBranch?.branch_id, page, pageSize,
    debouncedSearch, genderFilter, classFilter,
    sortField, sortDir,
  ]);

  React.useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const totalPages = Math.ceil(total / pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-35 ml-1 shrink-0" />;
    return sortDir === "asc"
      ? <ArrowUp   className="w-3.5 h-3.5 ml-1 text-blue-600 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-blue-600 shrink-0" />;
  }

  const hasFilters =
    search !== "" || genderFilter !== "all" ||
    classFilter !== "all" || academicYear !== "all";

  function clearFilters() {
    setSearch(""); setGenderFilter("all");
    setClassFilter("all"); setAcademicYear("all");
  }

  // active filter chips data
  const filterChips = [
    search       !== ""    && { label: `"${search}"`,                                                                        onRemove: () => setSearch("") },
    genderFilter !== "all" && { label: genderFilter === "male" ? "O'g'il" : "Qiz",                                          onRemove: () => setGenderFilter("all") },
    academicYear !== "all" && { label: academicYears.find(y => y.id === academicYear)?.name ?? "O'quv yili",                onRemove: () => setAcademicYear("all") },
    classFilter  !== "all" && { label: classes.find(c => c.id === classFilter)?.name ?? "Sinf",                             onRemove: () => setClassFilter("all") },
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  // ─── loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">O'quvchilar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Aktiv O&apos;quvchilar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Jami: {total} ta aktiv o&apos;quvchi</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchStudents} disabled={refreshing}>
            <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1.5">Yangilash</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/school/students/import")}>
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Import</span>
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => router.push("/school/students/create")}
          >
            <UserPlus className="w-4 h-4" />
            <span className="ml-1.5">Yangi o'quvchi</span>
          </Button>
        </div>
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Ism, familiya, telefon yoki shaxsiy raqam..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <Button
          variant="outline" size="sm"
          className={`sm:hidden h-10 px-3 relative ${hasFilters ? "border-blue-400 text-blue-600" : ""}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasFilters && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />}
        </Button>

        {/* Desktop filters inline */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="h-10 w-36 text-sm">
              <SelectValue placeholder="O'quv yili" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha yillar</SelectItem>
              {academicYears.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-10 w-32 text-sm">
              <SelectValue placeholder="Sinf" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha sinflar</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="h-10 w-28 text-sm">
              <SelectValue placeholder="Jins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha jins</SelectItem>
              <SelectItem value="male">O'g'il</SelectItem>
              <SelectItem value="female">Qiz</SelectItem>
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
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-10 text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
              onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" /> Tozalash
            </Button>
          )}
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
                <label className="text-xs text-gray-500 mb-1 block">O'quv yili</label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sinf</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Jins</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="male">O'g'il</SelectItem>
                    <SelectItem value="female">Qiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sahifa hajmi</label>
                <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                  <SelectTrigger className="h-9 w-24 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 ta</SelectItem>
                    <SelectItem value="20">20 ta</SelectItem>
                    <SelectItem value="50">50 ta</SelectItem>
                    <SelectItem value="100">100 ta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-4">
                  <X className="w-3 h-3" /> Filtrlarni tozalash
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active filter chips ── */}
      {filterChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400">Faol:</span>
          {filterChips.map(chip => (
            <span key={chip.label}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
              {chip.label}
              <button onClick={chip.onRemove} className="hover:text-blue-900 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 ml-1">
            Barchasini tozalash
          </button>
        </div>
      )}

      {/* ── Sort pills (mobile) ── */}
      <div className="flex items-center gap-2 sm:hidden overflow-x-auto pb-1">
        <span className="text-xs text-gray-400 shrink-0">Saralash:</span>
        {(Object.entries(SORT_LABELS) as [SortField, string][]).map(([field, label]) => (
          <button key={field} onClick={() => toggleSort(field)}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              sortField === field
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}>
            {label}
            {sortField === field && (sortDir === "asc"
              ? <ArrowUp className="w-3 h-3" />
              : <ArrowDown className="w-3 h-3" />)}
          </button>
        ))}
      </div>

      {/* ── Table / Cards ── */}
      <Card className="border-0 shadow-lg overflow-hidden">

        {refreshing && (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 border-b border-blue-100">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Yangilanmoqda...</span>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-10 text-center text-xs">#</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("first_name")}
                    className="flex items-center text-xs font-semibold hover:text-blue-600">
                    O'quvchi <SortIcon field="first_name" />
                  </button>
                </TableHead>
                <TableHead className="text-xs">Sinf</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("personal_number")}
                    className="flex items-center text-xs font-semibold hover:text-blue-600">
                    Shaxsiy raqam <SortIcon field="personal_number" />
                  </button>
                </TableHead>
                <TableHead className="text-xs">Telefon</TableHead>
                <TableHead className="text-xs text-right">Balans</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("created_at")}
                    className="flex items-center text-xs font-semibold hover:text-blue-600">
                    Qo'shilgan <SortIcon field="created_at" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">O'quvchilar topilmadi</p>
                    {hasFilters && (
                      <button onClick={clearFilters}
                        className="mt-2 text-xs text-blue-500 hover:text-blue-700">
                        Filtrlarni tozalash
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => {
                  const fullName = student.full_name ||
                    `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
                  const balance = student.balance?.balance;
                  return (
                    <TableRow key={student.id}
                      className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                      onClick={() => router.push(`/school/students/${student.id}`)}>
                      <TableCell className="text-center text-xs text-gray-400">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                          </div>
                          <p className="font-medium text-gray-900 text-sm leading-tight">{fullName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.current_class ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
                            <BookOpen className="w-3.5 h-3.5" />
                            {student.current_class.name}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-gray-600">
                          {student.personal_number || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatPhoneDisplay(student.phone_number)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {balance !== undefined ? (
                          <span className={`text-sm font-semibold ${balance >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {formatCurrency(balance)}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{fmtDate(student.created_at)}</span>
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
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">O'quvchilar topilmadi</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-2 text-xs text-blue-500">
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map(student => {
                const fullName = student.full_name ||
                  `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
                const balance = student.balance?.balance;
                return (
                  <div key={student.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/40 active:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/school/students/${student.id}`)}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{fullName}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{formatPhoneDisplay(student.phone_number)}
                        </span>
                        {student.current_class && (
                          <span className="text-xs text-green-700 font-medium">
                            {student.current_class.name}
                          </span>
                        )}
                        {balance !== undefined && (
                          <span className={`text-xs font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(balance)}
                          </span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              {/* page number buttons (up to 5) */}
              {(() => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const end   = Math.min(totalPages, start + 4);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                  <Button key={p} variant={page === p ? "default" : "outline"}
                    size="sm" className="h-8 w-8 p-0 text-xs"
                    onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ));
              })()}

              <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
