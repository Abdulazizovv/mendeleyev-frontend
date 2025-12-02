import apiClient from "./client";
import type {
  AcademicYear,
  Quarter,
  Class,
  ClassStudent,
  Subject,
  ClassSubject,
  Building,
  Room,
  TeacherClass,
  TeacherSubject,
  TeacherStudent,
  StudentClass,
  StudentSubject,
  Student,
  StudentRelative,
  StudentPhoneCheckResponse,
  PaginatedResponse,
  CreateAcademicYearRequest,
  CreateQuarterRequest,
  CreateClassRequest,
  AddStudentToClassRequest,
  CreateSubjectRequest,
  AddSubjectToClassRequest,
  CreateBuildingRequest,
  CreateRoomRequest,
  CreateStudentRequest,
  CreateStudentRelativeRequest,
} from "@/types";

const unwrapResults = <T>(payload: T[] | PaginatedResponse<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

/**
 * School API Service
 * Maktab moduli uchun barcha API endpointlari
 */
export const schoolApi = {
  // ==================== ACADEMIC YEARS ====================
  
  /**
   * Filialdagi barcha akademik yillarni olish
   */
  getAcademicYears: async (branchId: string): Promise<AcademicYear[]> => {
    const response = await apiClient.get<AcademicYear[] | PaginatedResponse<AcademicYear>>(
      `/school/branches/${branchId}/academic-years/`
    );
    return unwrapResults(response.data);
  },

  /**
   * Joriy akademik yilni olish
   */
  getCurrentAcademicYear: async (branchId: string): Promise<AcademicYear> => {
    const response = await apiClient.get<AcademicYear>(
      `/school/branches/${branchId}/academic-years/current/`
    );
    return response.data;
  },

  /**
   * Akademik yil yaratish
   */
  createAcademicYear: async (
    branchId: string,
    data: CreateAcademicYearRequest
  ): Promise<AcademicYear> => {
    const response = await apiClient.post<AcademicYear>(
      `/school/branches/${branchId}/academic-years/`,
      data
    );
    return response.data;
  },

  /**
   * Akademik yilni yangilash
   */
  updateAcademicYear: async (
    branchId: string,
    yearId: string,
    data: Partial<CreateAcademicYearRequest>
  ): Promise<AcademicYear> => {
    const response = await apiClient.patch<AcademicYear>(
      `/school/branches/${branchId}/academic-years/${yearId}/`,
      data
    );
    return response.data;
  },

  /**
   * Akademik yilni o'chirish
   */
  deleteAcademicYear: async (branchId: string, yearId: string): Promise<void> => {
    await apiClient.delete(`/school/branches/${branchId}/academic-years/${yearId}/`);
  },

  // ==================== QUARTERS ====================

  /**
   * Akademik yildagi choraklarni olish
   */
  getQuarters: async (academicYearId: string): Promise<Quarter[]> => {
    const response = await apiClient.get<Quarter[]>(
      `/school/academic-years/${academicYearId}/quarters/`
    );
    return response.data;
  },

  /**
   * Chorak yaratish
   */
  createQuarter: async (
    academicYearId: string,
    data: CreateQuarterRequest
  ): Promise<Quarter> => {
    const response = await apiClient.post<Quarter>(
      `/school/academic-years/${academicYearId}/quarters/`,
      data
    );
    return response.data;
  },

  /**
   * Chorakni yangilash
   */
  updateQuarter: async (
    academicYearId: string,
    quarterId: string,
    data: Partial<CreateQuarterRequest>
  ): Promise<Quarter> => {
    const response = await apiClient.patch<Quarter>(
      `/school/academic-years/${academicYearId}/quarters/${quarterId}/`,
      data
    );
    return response.data;
  },

  /**
   * Chorakni o'chirish
   */
  deleteQuarter: async (academicYearId: string, quarterId: string): Promise<void> => {
    await apiClient.delete(`/school/academic-years/${academicYearId}/quarters/${quarterId}/`);
  },

  // ==================== CLASSES ====================

  /**
   * Filialdagi sinflarni olish
   */
  getClasses: async (
    branchId: string,
    params?: {
      academic_year_id?: string;
      grade_level?: number;
      section?: string;
      is_active?: boolean;
      search?: string;
      ordering?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<Class[]> => {
    const response = await apiClient.get<Class[] | PaginatedResponse<Class>>(
      `/school/branches/${branchId}/classes/`,
      {
        params,
      }
    );
    return unwrapResults(response.data);
  },

  /**
   * Filialdagi sinflarni olish (paginated)
   */
  getClassesPaginated: async (
    branchId: string,
    params?: {
      academic_year_id?: string;
      grade_level?: number;
      section?: string;
      is_active?: boolean;
      search?: string;
      ordering?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<PaginatedResponse<Class>> => {
    const response = await apiClient.get<PaginatedResponse<Class>>(
      `/school/branches/${branchId}/classes/`,
      { params }
    );
    return response.data;
  },

  /**
   * Bitta sinf detallari
   */
  getClass: async (
    branchId: string,
    classId: string
  ): Promise<Class> => {
    // Some deployments serve class detail under branch scope, others globally.
    // Try branch-scoped first, then fallback to global class detail.
    try {
      const response = await apiClient.get<Class>(
        `/school/branches/${branchId}/classes/${classId}/`
      );
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        const fallback = await apiClient.get<Class>(`/school/classes/${classId}/`);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Sinf yaratish
   */
  createClass: async (branchId: string, data: CreateClassRequest): Promise<Class> => {
    const response = await apiClient.post<Class>(`/school/branches/${branchId}/classes/`, data);
    return response.data;
  },

  /**
   * Sinfni yangilash
   */
  updateClass: async (
    branchId: string,
    classId: string,
    data: Partial<CreateClassRequest>
  ): Promise<Class> => {
    const response = await apiClient.patch<Class>(
      `/school/branches/${branchId}/classes/${classId}/`,
      data
    );
    return response.data;
  },

  /**
   * Sinfni o'chirish
   */
  deleteClass: async (branchId: string, classId: string): Promise<void> => {
    await apiClient.delete(`/school/branches/${branchId}/classes/${classId}/`);
  },

  // ==================== CLASS STUDENTS ====================

  /**
   * Sinf o'quvchilarini olish
   */
  getClassStudents: async (
    classId: string,
    params?: { 
      page?: number;
      page_size?: number;
      search?: string;
      ordering?: string;
      is_active?: boolean; 
    }
  ): Promise<ClassStudent[]> => {
    const response = await apiClient.get<ClassStudent[] | PaginatedResponse<ClassStudent>>(`/school/classes/${classId}/students/`, {
      params,
    });
    return unwrapResults(response.data);
  },

  /**
   * Sinfga o'quvchi qo'shish
   */
  addStudentToClass: async (
    classId: string,
    data: AddStudentToClassRequest
  ): Promise<ClassStudent> => {
    const response = await apiClient.post<ClassStudent>(
      `/school/classes/${classId}/students/`,
      data
    );
    return response.data;
  },

  /**
   * O'quvchini sinfdan olib tashlash
   */
  removeStudentFromClass: async (classId: string, studentId: string): Promise<void> => {
    await apiClient.delete(`/school/classes/${classId}/students/${studentId}/`);
  },

  // ==================== SUBJECTS ====================

  /**
   * Filialdagi fanlarni olish
   */
  getSubjects: async (
    branchId: string,
    params?: { is_active?: boolean }
  ): Promise<Subject[]> => {
    const response = await apiClient.get<Subject[] | PaginatedResponse<Subject>>(
      `/school/branches/${branchId}/subjects/`,
      { params }
    );
    return unwrapResults(response.data);
  },

  /**
   * Fan yaratish
   */
  createSubject: async (branchId: string, data: CreateSubjectRequest): Promise<Subject> => {
    // Backend yangilanishi bilan branch va bo'sh qiymatlar uchun tozalash
    const payload: CreateSubjectRequest = {
      ...data,
      branch: data.branch || branchId, // Agar body da talab qilinsa
      // Bo'sh stringlar o'rniga undefined
      code: data.code?.trim() ? data.code.trim() : undefined,
      description: data.description?.trim() ? data.description.trim() : undefined,
      color: data.color?.trim() ? data.color.trim() : undefined,
    };

    const response = await apiClient.post<Subject>(
      `/school/branches/${branchId}/subjects/`,
      payload
    );
    return response.data;
  },

  /**
   * Fanni yangilash
   */
  updateSubject: async (
    branchId: string,
    subjectId: string,
    data: Partial<CreateSubjectRequest>
  ): Promise<Subject> => {
    const payload: Partial<CreateSubjectRequest> = {
      ...data,
      branch: data.branch || branchId,
      code: data.code?.trim() ? data.code.trim() : undefined,
      description: data.description?.trim() ? data.description.trim() : undefined,
      color: data.color?.trim() ? data.color.trim() : undefined,
    };

    const response = await apiClient.patch<Subject>(
      `/school/branches/${branchId}/subjects/${subjectId}/`,
      payload
    );
    return response.data;
  },

  /**
   * Fan detali (created_by, updated_by, full audit) olish
   */
  getSubject: async (branchId: string, subjectId: string): Promise<Subject> => {
    const response = await apiClient.get<Subject>(
      `/school/branches/${branchId}/subjects/${subjectId}/`
    );
    return response.data;
  },

  /**
   * Fanni o'chirish
   */
  deleteSubject: async (branchId: string, subjectId: string): Promise<void> => {
    await apiClient.delete(`/school/branches/${branchId}/subjects/${subjectId}/`);
  },

  // ==================== CLASS SUBJECTS ====================

  /**
   * Sinf fanlarini olish
   */
  getClassSubjects: async (
    classId: string,
    params?: { 
      page?: number;
      page_size?: number;
      search?: string;
      ordering?: string;
      is_active?: boolean; 
    }
  ): Promise<ClassSubject[]> => {
    const response = await apiClient.get<ClassSubject[] | PaginatedResponse<ClassSubject>>(
      `/school/classes/${classId}/subjects/`,
      { params }
    );
    return unwrapResults(response.data);
  },

  /**
   * Sinfga fan qo'shish
   */
  addSubjectToClass: async (
    classId: string,
    data: AddSubjectToClassRequest
  ): Promise<ClassSubject> => {
    const response = await apiClient.post<ClassSubject>(
      `/school/classes/${classId}/subjects/`,
      data
    );
    return response.data;
  },

  /**
   * Sinf fanini yangilash
   */
  updateClassSubject: async (
    classId: string,
    classSubjectId: string,
    data: Partial<AddSubjectToClassRequest>
  ): Promise<ClassSubject> => {
    const response = await apiClient.patch<ClassSubject>(
      `/school/classes/${classId}/subjects/${classSubjectId}/`,
      data
    );
    return response.data;
  },

  /**
   * Sinf fanini olib tashlash
   */
  removeSubjectFromClass: async (classId: string, classSubjectId: string): Promise<void> => {
    await apiClient.delete(`/school/classes/${classId}/subjects/${classSubjectId}/`);
  },

  // ==================== BUILDINGS ====================

  /**
   * Filialdagi binolarni olish
   */
  getBuildings: async (
    branchId: string,
    params?: { is_active?: boolean }
  ): Promise<Building[]> => {
    const response = await apiClient.get<Building[] | PaginatedResponse<Building>>(
      `/school/branches/${branchId}/buildings/`,
      { params }
    );
    return unwrapResults(response.data);
  },

  /**
   * Bino yaratish
   */
  createBuilding: async (branchId: string, data: CreateBuildingRequest): Promise<Building> => {
    const response = await apiClient.post<Building>(
      `/school/branches/${branchId}/buildings/`,
      data
    );
    return response.data;
  },

  // ==================== ROOMS ====================

  /**
   * Filialdagi xonalarni olish
   */
  getRooms: async (
    branchId: string,
    params?: {
      building_id?: string;
      room_type?: string;
      is_active?: boolean;
    }
  ): Promise<Room[]> => {
    const response = await apiClient.get<Room[] | PaginatedResponse<Room>>(`/school/branches/${branchId}/rooms/`, {
      params,
    });
    return unwrapResults(response.data);
  },

  /**
   * Xona yaratish
   */
  createRoom: async (branchId: string, data: CreateRoomRequest): Promise<Room> => {
    const response = await apiClient.post<Room>(`/school/branches/${branchId}/rooms/`, data);
    return response.data;
  },

  // ==================== TEACHER DASHBOARD ====================

  /**
   * O'qituvchining sinflarini olish
   */
  getTeacherClasses: async (params?: {
    branch_id?: string;
    academic_year_id?: string;
    is_active?: boolean;
  }): Promise<TeacherClass[]> => {
    const response = await apiClient.get<TeacherClass[]>(
      `/school/dashboard/teacher/classes/`,
      { params }
    );
    return response.data;
  },

  /**
   * O'qituvchining fanlarini olish
   */
  getTeacherSubjects: async (params?: {
    branch_id?: string;
    class_id?: string;
    is_active?: boolean;
  }): Promise<TeacherSubject[]> => {
    const response = await apiClient.get<TeacherSubject[]>(
      `/school/dashboard/teacher/subjects/`,
      { params }
    );
    return response.data;
  },

  /**
   * O'qituvchining o'quvchilarini olish
   */
  getTeacherStudents: async (params?: {
    branch_id?: string;
    class_id?: string;
  }): Promise<TeacherStudent[]> => {
    const response = await apiClient.get<TeacherStudent[]>(
      `/school/dashboard/teacher/students/`,
      { params }
    );
    return response.data;
  },

  // ==================== STUDENT DASHBOARD ====================

  /**
   * O'quvchining sinfini olish
   */
  getStudentClass: async (params?: { branch_id?: string }): Promise<StudentClass> => {
    const response = await apiClient.get<StudentClass>(`/school/dashboard/student/class/`, {
      params,
    });
    return response.data;
  },

  // ==================== STUDENTS ====================

  /**
   * Filialdagi barcha o'quvchilarni olish (paginated)
   * API: GET /api/v1/school/students/?branch_id={branchId}
   */
  getStudents: async (
    branchId: string,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      gender?: "male" | "female";
      class_id?: string;
      status?: Student["status"];
      academic_year_id?: string;
      ordering?: string;
    }
  ): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get<PaginatedResponse<Student>>(
      `/school/students/`,
      { 
        params: {
          branch_id: branchId,
          ...params
        }
      }
    );
    return response.data;
  },

  /**
   * Bitta o'quvchi haqida to'liq ma'lumot
   * API: GET /api/v1/school/students/{studentId}/?branch_id={branchId}
   */
  getStudent: async (branchId: string, studentId: string): Promise<Student> => {
    const response = await apiClient.get<Student>(
      `/school/students/${studentId}/`,
      { 
        params: { branch_id: branchId }
      }
    );
    return response.data;
  },

  /**
   * O'quvchi yaratish
   * API: POST /api/v1/school/students/create/
   */
  createStudent: async (
    branchId: string,
    data: CreateStudentRequest
  ): Promise<Student> => {
    const response = await apiClient.post<Student>(
      `/school/students/create/`,
      {
        ...data,
        branch_id: branchId,
      }
    );
    return response.data;
  },

  /**
   * O'quvchi ma'lumotlarini yangilash
   * API: PATCH /api/v1/school/students/{studentId}/
   */
  updateStudent: async (
    branchId: string,
    studentId: string,
    data: Partial<CreateStudentRequest>
  ): Promise<Student> => {
    const response = await apiClient.patch<Student>(
      `/school/students/${studentId}/`,
      {
        ...data,
        branch_id: branchId,
      }
    );
    return response.data;
  },

  // ==================== DASHBOARDS ====================

  /**
   * O'quvchining fanlarini olish
   */
  getStudentSubjects: async (params?: { branch_id?: string }): Promise<StudentSubject[]> => {
    const response = await apiClient.get<StudentSubject[]>(
      `/school/dashboard/student/subjects/`,
      { params }
    );
    return response.data;
  },

  // ==================== STUDENT RELATIVES ====================

  /**
   * O'quvchi yaqinlarini olish
   * API: GET /api/v1/school/students/{studentId}/relatives/
   */
  getStudentRelatives: async (studentId: string): Promise<StudentRelative[]> => {
    const response = await apiClient.get<StudentRelative[]>(
      `/school/students/${studentId}/relatives/`
    );
    return response.data;
  },

  /**
   * O'quvchiga yaqin qo'shish
   * API: POST /api/v1/school/students/{studentId}/relatives/
   */
  addStudentRelative: async (
    studentId: string,
    data: CreateStudentRelativeRequest
  ): Promise<StudentRelative> => {
    const response = await apiClient.post<StudentRelative>(
      `/school/students/${studentId}/relatives/`,
      data
    );
    return response.data;
  },

  /**
   * Telefon raqami orqali mavjud o'quvchini tekshirish
   * API: GET /api/v1/school/students/check-user/
   */
  checkStudentByPhone: async (
    phoneNumber: string,
    branchId?: string
  ): Promise<StudentPhoneCheckResponse> => {
    const response = await apiClient.get<StudentPhoneCheckResponse>(
      `/school/students/check-user/`,
      {
        params: {
          phone_number: phoneNumber,
          branch_id: branchId,
        },
      }
    );
    return response.data;
  },
};
