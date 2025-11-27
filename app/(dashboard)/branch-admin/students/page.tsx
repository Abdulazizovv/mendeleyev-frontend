"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api";
import type { Student, PaginatedResponse, Class, AcademicYear } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Search,
  Filter,
  UserPlus,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Download,
  RefreshCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

export default function StudentsManagement() {
  const { currentBranch } = useAuth();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = React.useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  
  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [genderFilter, setGenderFilter] = React.useState<"all" | "male" | "female">("all");
  const [classFilter, setClassFilter] = React.useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = React.useState<string>("all");
  
  // Ordering/Sorting
  const [orderBy, setOrderBy] = React.useState<string>("created_at");
  const [orderDirection, setOrderDirection] = React.useState<"asc" | "desc">("desc");

  // Load academic years and classes
  React.useEffect(() => {
    const loadFiltersData = async () => {
      if (!currentBranch?.branch_id) return;

      try {
        const [yearsData, classesData] = await Promise.all([
          schoolApi.getAcademicYears(currentBranch.branch_id),
          schoolApi.getClasses(currentBranch.branch_id),
        ]);

        setAcademicYears(yearsData);
        setClasses(classesData);
      } catch (error) {
        console.error("Error loading filters data:", error);
      }
    };

    loadFiltersData();
  }, [currentBranch?.branch_id]);

  // Fetch students
  const fetchStudents = React.useCallback(async () => {
    if (!currentBranch?.branch_id) return;

    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchQuery) params.search = searchQuery;
      if (genderFilter !== "all") params.gender = genderFilter;
      if (classFilter !== "all") params.class_id = classFilter;
      
      // Add ordering parameter
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
      setLoading(false);
    }
  }, [currentBranch?.branch_id, currentPage, pageSize, searchQuery, genderFilter, classFilter, orderBy, orderDirection]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filter change
  const handleGenderFilter = (value: string) => {
    setGenderFilter(value as "all" | "male" | "female");
    setCurrentPage(1);
  };

  const handleClassFilter = (value: string) => {
    setClassFilter(value);
    setCurrentPage(1);
  };

  const handleAcademicYearFilter = (value: string) => {
    setAcademicYearFilter(value);
    setCurrentPage(1);
    // Reset class filter when academic year changes
    setClassFilter("all");
  };

  // Filter classes by selected academic year
  const filteredClasses = React.useMemo(() => {
    if (!Array.isArray(classes)) return [];
    if (academicYearFilter === "all") return classes;
    return classes.filter((c) => c.academic_year === academicYearFilter);
  }, [classes, academicYearFilter]);

  // Format gender
  const formatGender = (gender: string) => {
    return gender === "male" ? "Erkak" : "Ayol";
  };

  // Handle column click for ordering
  const handleSort = (field: string) => {
    if (orderBy === field) {
      // Toggle direction if same field
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
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
  const handleStudentClick = async (studentId: string) => {
    if (!currentBranch?.branch_id) return;
    
    try {
      setLoadingStudent(true);
      const studentData = await schoolApi.getStudent(currentBranch.branch_id, studentId);
      setSelectedStudent(studentData);
    } catch (error) {
      console.error("Error loading student details:", error);
      toast.error("O'quvchi ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoadingStudent(false);
    }
  };

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
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Yangi o'quvchi
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Ism, telefon yoki ID bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
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
                {Array.isArray(academicYears) && academicYears.map((year) => (
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
                {Array.isArray(filteredClasses) && filteredClasses.map((cls) => (
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

          {/* Active Filters Display */}
          {(searchQuery || genderFilter !== "all" || classFilter !== "all" || academicYearFilter !== "all") && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-600">Faol filtrlar:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Qidiruv: {searchQuery}
                </span>
              )}
              {genderFilter !== "all" && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {formatGender(genderFilter)}
                </span>
              )}
              {academicYearFilter !== "all" && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {Array.isArray(academicYears) && academicYears.find(y => y.id === academicYearFilter)?.name}
                </span>
              )}
              {classFilter !== "all" && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {Array.isArray(classes) && classes.find(c => c.id === classFilter)?.name}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setGenderFilter("all");
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
              <div className="overflow-x-auto">
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
                          onClick={() => handleSort("gender")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          Jins
                          {getSortIcon("gender")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("date_of_birth")}
                          className="flex items-center hover:text-gray-900 font-semibold"
                        >
                          Tug'ilgan sana
                          {getSortIcon("date_of_birth")}
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
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
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.gender === "male"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }`}
                          >
                            {formatGender(student.gender)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>
                              {format(new Date(student.date_of_birth), "dd MMM, yyyy", {
                                locale: uz,
                              })}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    <SelectItem value="25">25 ta</SelectItem>
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
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">To'liq ism</label>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent.full_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Telefon</label>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent.phone_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Jins</label>
                  <p className="font-semibold text-gray-900">
                    {formatGender(selectedStudent.gender)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tug'ilgan sana</label>
                  <p className="font-semibold text-gray-900">
                    {format(
                      new Date(selectedStudent.date_of_birth),
                      "dd MMMM, yyyy",
                      { locale: uz }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent.email || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Shaxsiy raqam</label>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent.personal_number || "—"}
                  </p>
                </div>
              </div>

              {/* Class Info */}
              {selectedStudent.current_class && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Sinf ma'lumotlari
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-lg font-semibold text-green-700">
                      {selectedStudent.current_class.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedStudent.current_class.academic_year}
                    </p>
                  </div>
                </div>
              )}

              {/* Address */}
              {selectedStudent.address && (
                <div className="border-t pt-4">
                  <label className="text-sm text-gray-500">Manzil</label>
                  <p className="font-semibold text-gray-900">
                    {selectedStudent.address}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Qarindoshlar: {selectedStudent.relatives_count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Qo'shilgan:{" "}
                    {format(
                      new Date(selectedStudent.created_at),
                      "dd MMM, yyyy HH:mm",
                      { locale: uz }
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
