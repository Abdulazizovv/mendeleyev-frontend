"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth, useDebounce } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Student, PaginatedResponse, Class, AcademicYear, StudentRelative } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStudentTerminology } from "@/lib/utils/branchType";
import type { BranchType } from "@/types/auth";
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
  Users,
  Phone,
  Calendar,
  BookOpen,
  Download,
  RefreshCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  UserCheck,
  UserX,
  Archive,
  Ban,
  School,
  Mail,
  MapPin,
  Clock,
  FileText,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { formatCurrency, translateGender } from "@/lib/translations";

// Status translations and colors
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    active: { label: "Aktiv", color: "text-green-700", bgColor: "bg-green-100" },
    archived: { label: "Arxivlangan", color: "text-gray-700", bgColor: "bg-gray-100" },
    suspended: { label: "Muzlatilgan", color: "text-red-700", bgColor: "bg-red-100" },
    graduated: { label: "Bitirgan", color: "text-blue-700", bgColor: "bg-blue-100" },
    transferred: { label: "O'tkazilgan", color: "text-orange-700", bgColor: "bg-orange-100" },
  };
  return statusMap[status] || { label: status, color: "text-gray-700", bgColor: "bg-gray-100" };
};

const formatDateSafe = (value?: string | null, pattern = "dd MMM, yyyy") => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, pattern, { locale: uz });
};

export default function StudentsManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { currentBranch } = useAuth();

  // Get branch type and terminology
  const branchType = (currentBranch?.branch_type || "school") as BranchType;
  const studentTerm = getStudentTerminology(branchType);
  
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tableRefreshing, setTableRefreshing] = React.useState(false);
  const firstLoadRef = React.useRef(true);
  const [academicYearsLoading, setAcademicYearsLoading] = React.useState(false);
  const [classesLoading, setClassesLoading] = React.useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);
  
  // Filters
  const [searchValue, setSearchValue] = React.useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [genderFilter, setGenderFilter] = React.useState<"all" | "male" | "female">("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [classFilter, setClassFilter] = React.useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = React.useState<string>("all");
  
  // Ordering/Sorting
  const [orderBy, setOrderBy] = React.useState<string>("created_at");
  const [orderDirection, setOrderDirection] = React.useState<"asc" | "desc">("desc");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    firstLoadRef.current = true;
    setStudents([]);
    setTotalCount(0);
    setClassFilter("all");
    setAcademicYearFilter("all");
    setTableRefreshing(false);
  }, [currentBranch?.branch_id]);

  // Load academic years
  React.useEffect(() => {
    if (!currentBranch?.branch_id) return;
    let active = true;

    setAcademicYearsLoading(true);
    schoolApi
      .getAcademicYears(currentBranch.branch_id)
      .then((years) => {
        if (!active) return;
        setAcademicYears(years);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error loading academic years:", error);
        setAcademicYears([]);
      })
      .finally(() => {
        if (!active) return;
        setAcademicYearsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentBranch?.branch_id]);

  // Load classes when branch or academic year changes
  React.useEffect(() => {
    if (!currentBranch?.branch_id) return;
    let active = true;

    setClassesLoading(true);
    const params =
      academicYearFilter !== "all" ? { academic_year_id: academicYearFilter } : undefined;

    schoolApi
      .getClasses(currentBranch.branch_id, params)
      .then((data) => {
        if (!active) return;
        setClasses(data);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error loading classes:", error);
        setClasses([]);
      })
      .finally(() => {
        if (!active) return;
        setClassesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentBranch?.branch_id, academicYearFilter]);

  const updateQueryParams = React.useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutator(params);
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch students
  const fetchStudents = React.useCallback(async () => {
    if (!currentBranch?.branch_id) return;

    const showFullSkeleton = firstLoadRef.current;
    if (showFullSkeleton) {
      setLoading(true);
    } else {
      setTableRefreshing(true);
    }

    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (genderFilter !== "all") params.gender = genderFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (classFilter !== "all") params.class_id = classFilter;
      if (academicYearFilter !== "all") params.academic_year_id = academicYearFilter;

      const ordering = orderDirection === "desc" ? `-${orderBy}` : orderBy;
      params.ordering = ordering;

      const response: PaginatedResponse<Student> = await schoolApi.getStudents(
        currentBranch.branch_id,
        params
      );

      setStudents(response.results);
      setTotalCount(response.count);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      if (showFullSkeleton) {
        setLoading(false);
        firstLoadRef.current = false;
      } else {
        setTableRefreshing(false);
      }
    }
  }, [
    currentBranch?.branch_id,
    currentPage,
    pageSize,
    debouncedSearch,
    genderFilter,
    statusFilter,
    classFilter,
    academicYearFilter,
    orderBy,
    orderDirection,
  ]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle filter change
  const handleGenderFilter = (value: string) => {
    setGenderFilter(value as "all" | "male" | "female");
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleClassFilter = (value: string) => {
    setClassFilter(value);
    setCurrentPage(1);
  };

  const handleAcademicYearFilter = (value: string) => {
    setAcademicYearFilter(value);
    setCurrentPage(1);
    setClassFilter("all");
  };

  // Handle column click for ordering
  const handleSort = (field: string) => {
    if (orderBy === field) {
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(field);
      setOrderDirection("desc");
    }
  };

  // Get sort icon for column
  const getSortIcon = (field: string) => {
    if (orderBy !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return orderDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  // Navigate to student detail page
  const handleStudentClick = React.useCallback(
    (studentId: string) => {
      router.push(`/branch-admin/students/${studentId}`);
    },
    [router]
  );

  if (loading && students.length === 0) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{studentTerm.plural}</h1>
          <p className="text-gray-500 mt-1">
            Jami: {totalCount} ta {studentTerm.singular.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={fetchStudents}
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yangilash
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => router.push('/branch-admin/students/create')}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Yangi {studentTerm.singular.toLowerCase()}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="pt-6 space-y-6">
          {/* Search Bar - Full Width with Better Styling */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={`${studentTerm.singular} ism-familiyasi, telefon raqami yoki shaxsiy raqam bo'yicha qidirish...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Ban className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Filtrlar</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {/* Academic Year Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 ml-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  O'quv yili
                </label>
                <Select value={academicYearFilter} onValueChange={handleAcademicYearFilter}>
                  <SelectTrigger className="h-10 border-gray-200 hover:border-gray-300 transition-colors">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {academicYearsLoading && (
                      <SelectItem value="__loading_years" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Yuklanmoqda...</span>
                        </div>
                      </SelectItem>
                    )}
                    {!academicYearsLoading && academicYears.length === 0 && (
                      <SelectItem value="__no_years" disabled>
                        Ma'lumot topilmadi
                      </SelectItem>
                    )}
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 ml-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Sinf
                </label>
                <Select value={classFilter} onValueChange={handleClassFilter}>
                  <SelectTrigger className="h-10 border-gray-200 hover:border-gray-300 transition-colors">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {classesLoading && (
                      <SelectItem value="__loading_classes" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Yuklanmoqda...</span>
                        </div>
                      </SelectItem>
                    )}
                    {!classesLoading && classes.length === 0 && (
                      <SelectItem value="__no_classes" disabled>
                        Ma'lumot topilmadi
                      </SelectItem>
                    )}
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 ml-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Holat
                </label>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="h-10 border-gray-200 hover:border-gray-300 transition-colors">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Aktiv</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <Archive className="w-3 h-3 text-gray-500" />
                        <span>Arxivlangan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="suspended">
                      <div className="flex items-center gap-2">
                        <UserX className="w-3 h-3 text-red-500" />
                        <span>Muzlatilgan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="graduated">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-blue-500" />
                        <span>Bitirgan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="transferred">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-3 h-3 text-orange-500" />
                        <span>O'tkazilgan</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 ml-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Jins
                </label>
                <Select value={genderFilter} onValueChange={handleGenderFilter}>
                  <SelectTrigger className="h-10 border-gray-200 hover:border-gray-300 transition-colors">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="male">Erkak</SelectItem>
                    <SelectItem value="female">Ayol</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters Button - Takes remaining space */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
                <label className="text-xs font-medium text-transparent ml-1">.</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchValue("");
                    setGenderFilter("all");
                    setStatusFilter("all");
                    setClassFilter("all");
                    setAcademicYearFilter("all");
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all"
                  disabled={searchValue === "" && genderFilter === "all" && statusFilter === "all" && classFilter === "all" && academicYearFilter === "all"}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Tozalash
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchValue || genderFilter !== "all" || statusFilter !== "all" || classFilter !== "all" || academicYearFilter !== "all") && (
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Faol filtrlar:</span>
              {searchValue && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-colors">
                  <Search className="w-3 h-3 mr-1" />
                  {searchValue}
                </Badge>
              )}
              {genderFilter !== "all" && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 transition-colors">
                  <Users className="w-3 h-3 mr-1" />
                  {translateGender(genderFilter)}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge className={`${getStatusInfo(statusFilter).bgColor} ${getStatusInfo(statusFilter).color} border transition-colors`}>
                  <UserCheck className="w-3 h-3 mr-1" />
                  {getStatusInfo(statusFilter).label}
                </Badge>
              )}
              {academicYearFilter !== "all" && (
                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-colors">
                  <Calendar className="w-3 h-3 mr-1" />
                  {Array.isArray(academicYears) && academicYears.find(y => y.id === academicYearFilter)?.name}
                </Badge>
              )}
              {classFilter !== "all" && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 transition-colors">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {Array.isArray(classes) && classes.find(c => c.id === classFilter)?.name}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {studentTerm.plural} ro'yxati
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Excel export
          </Button>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{studentTerm.plural} topilmadi</p>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                {tableRefreshing && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="mt-2 text-sm text-gray-600">
                      {studentTerm.plural} ro'yxati yangilanmoqda...
                    </span>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">№</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("first_name")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          To'liq ism
                          {getSortIcon("first_name")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("current_class")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          Sinfi
                          {getSortIcon("current_class")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("personal_number")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          Shaxsiy raqam
                          {getSortIcon("personal_number")}
                        </button>
                      </TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          Holat
                          {getSortIcon("status")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("balance")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          Balans
                          {getSortIcon("balance")}
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => {
                      const statusInfo = getStatusInfo(student.status || "active");
                      return (
                        <TableRow 
                          key={student.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleStudentClick(student.id)}
                        >
                          <TableCell className="font-medium">
                            {(currentPage - 1) * pageSize + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {student.first_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.full_name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.current_class ? (
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-700">
                                  {student.current_class.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-gray-700">
                              {student.personal_number || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{student.phone_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {student.balance ? (
                              <div className="flex items-center space-x-2">
                                <Wallet className="w-4 h-4 text-green-600" />
                                <span className={`font-semibold ${student.balance.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  {formatCurrency(student.balance.balance)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  {(currentPage - 1) * pageSize + 1} -{" "}
                  {Math.min(currentPage * pageSize, totalCount)} / {totalCount} ta {studentTerm.singular.toLowerCase()}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Oldingi
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Keyingi
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 ta</SelectItem>
                    <SelectItem value="20">20 ta</SelectItem>
                    <SelectItem value="50">50 ta</SelectItem>
                    <SelectItem value="100">100 ta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
