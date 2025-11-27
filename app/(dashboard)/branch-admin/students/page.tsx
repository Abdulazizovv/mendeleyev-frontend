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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateStudentForm } from "@/components/dashboard/CreateStudentForm";
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
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [selectedStudentRelatives, setSelectedStudentRelatives] = React.useState<StudentRelative[]>([]);
  const [loadingStudent, setLoadingStudent] = React.useState(false);
  const [loadingRelatives, setLoadingRelatives] = React.useState(false);
  const [createFormOpen, setCreateFormOpen] = React.useState(false);
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

  // Load student details from API
  const handleStudentClick = React.useCallback(
    async (studentId: string, options: { updateUrl?: boolean } = {}) => {
      if (!currentBranch?.branch_id) return;
      
      try {
        setLoadingStudent(true);
        setLoadingRelatives(true);
        
        const [studentData, relativesData] = await Promise.all([
          schoolApi.getStudent(currentBranch.branch_id, studentId),
          schoolApi.getStudentRelatives(studentId).catch(() => [] as StudentRelative[]),
        ]);
        
        setSelectedStudent(studentData);
        setSelectedStudentRelatives(Array.isArray(relativesData) ? relativesData : []);
        
        if (options.updateUrl !== false) {
          updateQueryParams((params) => params.set("studentId", studentId));
        }
      } catch (error) {
        console.error("Error loading student details:", error);
        toast.error("O'quvchi ma'lumotlarini yuklashda xatolik");
      } finally {
        setLoadingStudent(false);
        setLoadingRelatives(false);
      }
    },
    [currentBranch?.branch_id, updateQueryParams]
  );

  React.useEffect(() => {
    const studentIdFromQuery = searchParams.get("studentId");
    if (studentIdFromQuery && studentIdFromQuery !== selectedStudent?.id) {
      handleStudentClick(studentIdFromQuery, { updateUrl: false });
    }
  }, [searchParams, selectedStudent?.id, handleStudentClick]);

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

  const handleStudentDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedStudent(null);
      setSelectedStudentRelatives([]);
      updateQueryParams((params) => params.delete("studentId"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">O'quvchilar</h1>
          <p className="text-gray-500 mt-1">
            Jami: {totalCount} ta o'quvchi
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
            onClick={() => setCreateFormOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Yangi o'quvchi
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Ism, telefon yoki ID bo'yicha qidirish..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Academic Year Filter */}
            <Select value={academicYearFilter} onValueChange={handleAcademicYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="O'quv yili" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha yillar</SelectItem>
                {academicYearsLoading && (
                  <SelectItem value="__loading_years" disabled>
                    Akademik yillar yuklanmoqda...
                  </SelectItem>
                )}
                {!academicYearsLoading && academicYears.length === 0 && (
                  <SelectItem value="__no_years" disabled>
                    Akademik yil topilmadi
                  </SelectItem>
                )}
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select value={classFilter} onValueChange={handleClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sinf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sinflar</SelectItem>
                {classesLoading && (
                  <SelectItem value="__loading_classes" disabled>
                    Sinflar yuklanmoqda...
                  </SelectItem>
                )}
                {!classesLoading && classes.length === 0 && (
                  <SelectItem value="__no_classes" disabled>
                    Sinflar topilmadi
                  </SelectItem>
                )}
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={handleGenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Jins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="male">Erkak</SelectItem>
                <SelectItem value="female">Ayol</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="archived">Arxivlangan</SelectItem>
                <SelectItem value="suspended">Muzlatilgan</SelectItem>
                <SelectItem value="graduated">Bitirgan</SelectItem>
                <SelectItem value="transferred">O'tkazilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(searchValue || genderFilter !== "all" || statusFilter !== "all" || classFilter !== "all" || academicYearFilter !== "all") && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-600">Faol filtrlar:</span>
              {searchValue && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Qidiruv: {searchValue}
                </Badge>
              )}
              {genderFilter !== "all" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {translateGender(genderFilter)}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className={getStatusInfo(statusFilter).bgColor + " " + getStatusInfo(statusFilter).color}>
                  {getStatusInfo(statusFilter).label}
                </Badge>
              )}
              {academicYearFilter !== "all" && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {Array.isArray(academicYears) && academicYears.find(y => y.id === academicYearFilter)?.name}
                </Badge>
              )}
              {classFilter !== "all" && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {Array.isArray(classes) && classes.find(c => c.id === classFilter)?.name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchValue("");
                  setGenderFilter("all");
                  setStatusFilter("all");
                  setClassFilter("all");
                  setAcademicYearFilter("all");
                  setCurrentPage(1);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Tozalash
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            O'quvchilar ro'yxati
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
              <p className="text-gray-500 text-lg">O'quvchilar topilmadi</p>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                {tableRefreshing && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="mt-2 text-sm text-gray-600">
                      O'quvchilar ro'yxati yangilanmoqda...
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
                                <p className="text-sm text-gray-500">
                                  {student.email || "Email mavjud emas"}
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
                  {Math.min(currentPage * pageSize, totalCount)} / {totalCount} ta o'quvchi
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

      {/* Student Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={handleStudentDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              O'quvchi ma'lumotlari
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.full_name} haqida to'liq ma'lumot
            </DialogDescription>
          </DialogHeader>
          
          {loadingStudent ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
              </div>
            </div>
          ) : selectedStudent ? (
            <div className="space-y-6 mt-4">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shaxsiy ma'lumotlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">To'liq ism</label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {selectedStudent.full_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Shaxsiy raqam</label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {selectedStudent.personal_number || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Telefon
                      </label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {selectedStudent.phone_number}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {selectedStudent.email || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Jins</label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {translateGender(selectedStudent.gender)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tug'ilgan sana
                      </label>
                      <p className="font-semibold text-gray-900 mt-1">
                        {formatDateSafe(selectedStudent.date_of_birth, "dd MMMM, yyyy")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Holat</label>
                      <div className="mt-1">
                        <Badge className={`${getStatusInfo(selectedStudent.status || "active").bgColor} ${getStatusInfo(selectedStudent.status || "active").color} border-0`}>
                          {getStatusInfo(selectedStudent.status || "active").label}
                        </Badge>
                      </div>
                    </div>
                    {selectedStudent.address && (
                      <div className="col-span-2">
                        <label className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Manzil
                        </label>
                        <p className="font-semibold text-gray-900 mt-1">
                          {selectedStudent.address}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Class Info */}
              {selectedStudent.current_class && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Sinf ma'lumotlari
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-lg font-semibold text-green-700">
                        {selectedStudent.current_class.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedStudent.current_class.academic_year}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Info */}
              {(selectedStudent.balance || selectedStudent.transactions_summary || selectedStudent.payments_summary) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Moliya ma'lumotlari
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStudent.balance && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Joriy balans</p>
                            <p className={`text-2xl font-bold mt-1 ${selectedStudent.balance.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {formatCurrency(selectedStudent.balance.balance)}
                            </p>
                          </div>
                          <Wallet className="w-10 h-10 text-blue-600" />
                        </div>
                      </div>
                    )}

                    {selectedStudent.transactions_summary && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-gray-600">Jami kirim</p>
                          </div>
                          <p className="text-lg font-semibold text-green-700">
                            {formatCurrency(selectedStudent.transactions_summary.total_income)}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <p className="text-sm text-gray-600">Jami chiqim</p>
                          </div>
                          <p className="text-lg font-semibold text-red-700">
                            {formatCurrency(selectedStudent.transactions_summary.total_expense)}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">Tranzaksiyalar</p>
                          <p className="text-lg font-semibold text-blue-700">
                            {selectedStudent.transactions_summary.transactions_count} ta
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedStudent.payments_summary && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700">To'lovlar statistikasi</p>
                          <CreditCard className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Jami to'lovlar</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatCurrency(selectedStudent.payments_summary.total_payments)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedStudent.payments_summary.payments_count} ta to'lov
                            </p>
                          </div>
                          {selectedStudent.payments_summary.last_payment && (
                            <div>
                              <p className="text-sm text-gray-600">Oxirgi to'lov</p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                {formatCurrency(selectedStudent.payments_summary.last_payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateSafe(selectedStudent.payments_summary.last_payment.date, "dd MMM, yyyy")} • {selectedStudent.payments_summary.last_payment.period}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Relatives */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Yaqinlar ({selectedStudentRelatives.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRelatives ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : selectedStudentRelatives.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Yaqinlar qo'shilmagan</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedStudentRelatives.map((relative) => (
                        <div key={relative.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">{relative.full_name}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {relative.relationship_type_display}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {relative.is_primary_contact && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Asosiy kontakt
                                </Badge>
                              )}
                              {relative.is_guardian && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Vasiy
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {relative.phone_number && (
                              <div>
                                <span className="text-gray-500">Telefon:</span>
                                <p className="font-medium">{relative.phone_number}</p>
                              </div>
                            )}
                            {relative.email && (
                              <div>
                                <span className="text-gray-500">Email:</span>
                                <p className="font-medium">{relative.email}</p>
                              </div>
                            )}
                            {relative.workplace && (
                              <div>
                                <span className="text-gray-500">Ish joyi:</span>
                                <p className="font-medium">{relative.workplace}</p>
                              </div>
                            )}
                            {relative.position && (
                              <div>
                                <span className="text-gray-500">Lavozim:</span>
                                <p className="font-medium">{relative.position}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Qo'shilgan: {formatDateSafe(selectedStudent.created_at, "dd MMM, yyyy HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Student Form */}
      <CreateStudentForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        onSuccess={fetchStudents}
        classes={Array.isArray(classes) ? classes : []}
      />
    </div>
  );
}
