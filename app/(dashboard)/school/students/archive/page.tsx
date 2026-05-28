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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Archive,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  RefreshCcw,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

type ArchiveStatus = "archived" | "graduated" | "transferred" | "suspended";

const STATUS_OPTIONS: { value: ArchiveStatus; label: string; color: string; bg: string }[] = [
  { value: "archived", label: "Arxivlangan", color: "text-gray-700", bg: "bg-gray-100" },
  { value: "graduated", label: "Bitirgan", color: "text-blue-700", bg: "bg-blue-100" },
  { value: "transferred", label: "O'tkazilgan", color: "text-orange-700", bg: "bg-orange-100" },
  { value: "suspended", label: "Muzlatilgan", color: "text-red-700", bg: "bg-red-100" },
];

const formatDateSafe = (value?: string | null, pattern = "dd MMM, yyyy") => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, pattern, { locale: uz });
};

export default function ArchiveStudentsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const firstLoadRef = React.useRef(true);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const pageSize = 20;

  const [searchValue, setSearchValue] = React.useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [statusFilter, setStatusFilter] = React.useState<ArchiveStatus>("archived");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchStudents = React.useCallback(async () => {
    if (!currentBranch?.branch_id) return;

    if (firstLoadRef.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const params: Parameters<typeof schoolApi.getStudents>[1] = {
        page: currentPage,
        page_size: pageSize,
        ordering: "-created_at",
        status: statusFilter,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const response: PaginatedResponse<Student> = await schoolApi.getStudents(
        currentBranch.branch_id,
        params
      );
      setStudents(response.results);
      setTotalCount(response.count);
    } catch {
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      if (firstLoadRef.current) {
        setLoading(false);
        firstLoadRef.current = false;
      } else {
        setRefreshing(false);
      }
    }
  }, [currentBranch?.branch_id, currentPage, debouncedSearch, statusFilter]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Arxiv yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Arxiv</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              <Archive className="w-3.5 h-3.5" />
              Faol bo'lmagan o'quvchilar
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Jami: {totalCount} ta o'quvchi
          </p>
        </div>
        <Button variant="outline" onClick={fetchStudents} disabled={loading || refreshing}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Yangilash
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Ism-familiyasi, telefon raqami yoki shaxsiy raqam bo'yicha qidirish..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Ban className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Holat:</span>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    statusFilter === opt.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : `${opt.bg} ${opt.color} border-transparent hover:border-gray-300`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>O'quvchi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Oxirgi sinf</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Qo'shilgan
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refreshing ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Yangilanmoqda...</p>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Arxivda o'quvchilar topilmadi</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {getStatusInfo(statusFilter).label} holatdagi o'quvchilar topilmadi
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => {
                  const statusInfo = getStatusInfo(student.status);
                  const fullName =
                    student.full_name ||
                    `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
                    "—";
                  const classInfo = student.current_class?.name ?? "—";

                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                      onClick={() => router.push(`/school/students/${student.id}`)}
                    >
                      <TableCell className="text-center text-gray-400 text-sm">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {(student.first_name?.charAt(0) ?? "").toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{fullName}</p>
                            {student.personal_number && (
                              <p className="text-xs text-gray-400">{student.personal_number}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {student.phone_number ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{classInfo}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDateSafe(student.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-500">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} / {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
