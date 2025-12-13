import apiClient from "./client";
import type {
  StaffRole,
  StaffProfile,
  BalanceTransaction,
  SalaryPayment,
  CreateStaffRoleRequest,
  CreateStaffProfileRequest,
  CreateTransactionRequest,
  CreateSalaryPaymentRequest,
  CheckStaffUserResponse,
  StaffStatisticsResponse,
  PaginatedResponse,
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
 * HR API Service
 * Xodimlar boshqaruvi uchun barcha API endpointlari
 * 
 * Hamma ID'lar UUID (string) formatida
 */
export const hrApi = {
  // ==================== STAFF ROLES ====================

  /**
   * Rollar ro'yxati
   * API: GET /api/v1/hr/roles/
   */
  getRoles: async (params?: {
    branch?: string; // UUID
    is_active?: boolean;
    search?: string;
    ordering?: string;
  }): Promise<StaffRole[]> => {
    const response = await apiClient.get<StaffRole[] | PaginatedResponse<StaffRole>>(
      `/hr/roles/`,
      { params }
    );
    return unwrapResults(response.data);
  },

  /**
   * Rol tafsilotlari
   * API: GET /api/v1/hr/roles/{id}/
   */
  getRole: async (id: string): Promise<StaffRole> => {
    const response = await apiClient.get<StaffRole>(`/hr/roles/${id}/`);
    return response.data;
  },

  /**
   * Rol yaratish
   * API: POST /api/v1/hr/roles/
   */
  createRole: async (data: CreateStaffRoleRequest): Promise<StaffRole> => {
    const response = await apiClient.post<StaffRole>(`/hr/roles/`, data);
    return response.data;
  },

  /**
   * Rolni yangilash
   * API: PATCH /api/v1/hr/roles/{id}/
   */
  updateRole: async (
    id: string,
    data: Partial<CreateStaffRoleRequest>
  ): Promise<StaffRole> => {
    const response = await apiClient.patch<StaffRole>(`/hr/roles/${id}/`, data);
    return response.data;
  },

  /**
   * Rolni o'chirish
   * API: DELETE /api/v1/hr/roles/{id}/
   */
  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr/roles/${id}/`);
  },

  /**
   * Rol ruxsatlari
   * API: GET /api/v1/hr/roles/{id}/permissions/
   */
  getRolePermissions: async (id: string): Promise<{ id: string; name: string; permissions: string[] }> => {
    const response = await apiClient.get(`/hr/roles/${id}/permissions/`);
    return response.data;
  },

  // ==================== STAFF PROFILES ====================

  /**
   * Xodimlar ro'yxati
   * API: GET /api/v1/hr/staff/
   */
  getStaff: async (params?: {
    branch?: string; // UUID
    staff_role?: string; // UUID
    employment_type?: string;
    status?: string;
    active?: boolean;
    balance_status?: "positive" | "negative" | "zero";
    hire_date_from?: string;
    hire_date_to?: string;
    search?: string;
    ordering?: string;
  }): Promise<StaffProfile[]> => {
    const response = await apiClient.get<StaffProfile[] | PaginatedResponse<StaffProfile>>(
      `/hr/staff/`,
      { params }
    );
    return unwrapResults(response.data);
  },

  /**
   * Xodimlar statistikasi
   * API: GET /api/v1/hr/staff/stats/
   */
  getStaffStats: async (params?: {
    branch?: string;
    staff_role?: string;
    employment_type?: string;
    status?: string;
    active?: boolean;
    balance_status?: "positive" | "negative" | "zero";
    hire_date_from?: string;
    hire_date_to?: string;
  }): Promise<StaffStatisticsResponse> => {
    const response = await apiClient.get<StaffStatisticsResponse>(
      `/hr/staff/stats/`,
      { params }
    );
    return response.data;
  },

  /**
   * Xodim tafsilotlari
   * API: GET /api/v1/hr/staff/{id}/
   */
  getStaffProfile: async (id: string): Promise<StaffProfile> => {
    const response = await apiClient.get<StaffProfile>(`/hr/staff/${id}/`);
    return response.data;
  },

  /**
   * Xodim yaratish (Basic - deprecated)
   * API: POST /api/v1/hr/staff/
   * 
   * @deprecated Yangi loyihalar uchun createStaffEnhanced'dan foydalaning
   */
  createStaff: async (data: CreateStaffProfileRequest): Promise<StaffProfile> => {
    const response = await apiClient.post<StaffProfile>(`/hr/staff/`, data);
    return response.data;
  },

  /**
   * Xodim yaratish (Enhanced - recommended)
   * API: POST /api/v1/hr/staff/create/
   * 
   * User, BranchMembership va StaffProfile'ni atomik yaratadi
   * Telefon raqamni avtomatik normalizatsiya qiladi
   * Mavjud userlarni qayta ishlata oladi
   */
  createStaffEnhanced: async (data: EnhancedCreateStaffRequest): Promise<StaffProfile> => {
    const response = await apiClient.post<StaffProfile>(`/hr/staff/create/`, data);
    return response.data;
  },

  /**
   * Xodim mavjudligini tekshirish
   * API: GET/POST /api/v1/hr/staff/check-user/
   * 
   * Telefon raqam orqali xodim mavjudligini tekshiradi
   * branch_id berilsa, shu filialdagi ma'lumotni qaytaradi
   */
  checkStaffUser: async (params: {
    phone_number: string;
    branch_id?: string;
  }): Promise<CheckStaffUserResponse> => {
    const response = await apiClient.get<CheckStaffUserResponse>(
      `/hr/staff/check-user/`,
      { params }
    );
    return response.data;
  },

  /**
   * Xodimni yangilash
   * API: PATCH /api/v1/hr/staff/{id}/
   */
  updateStaff: async (
    id: string,
    data: Partial<CreateStaffProfileRequest>
  ): Promise<StaffProfile> => {
    const response = await apiClient.patch<StaffProfile>(`/hr/staff/${id}/`, data);
    return response.data;
  },

  /**
   * Xodimni o'chirish
   * API: DELETE /api/v1/hr/staff/{id}/
   */
  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr/staff/${id}/`);
  },

  /**
   * Maoshni yangilash
   * API: PATCH /api/v1/hr/staff/{id}/salary/
   */
  updateSalary: async (
    id: string,
    base_salary: number
  ): Promise<{ message: string; old_salary: number; new_salary: number }> => {
    const response = await apiClient.patch(`/hr/staff/${id}/salary/`, {
      base_salary,
    });
    return response.data;
  },

  /**
   * Xodim tranzaksiyalari
   * API: GET /api/v1/hr/staff/{id}/transactions/
   */
  getStaffTransactions: async (id: string): Promise<BalanceTransaction[]> => {
    const response = await apiClient.get<
      BalanceTransaction[] | PaginatedResponse<BalanceTransaction>
    >(`/hr/staff/${id}/transactions/`);
    return unwrapResults(response.data);
  },

  /**
   * Tranzaksiya yaratish
   * API: POST /api/v1/hr/staff/{id}/create_transaction/
   */
  createTransaction: async (
    id: string,
    data: CreateTransactionRequest
  ): Promise<BalanceTransaction> => {
    const response = await apiClient.post<BalanceTransaction>(
      `/hr/staff/${id}/create_transaction/`,
      data
    );
    return response.data;
  },

  // ==================== BALANCE TRANSACTIONS ====================

  /**
   * Barcha tranzaksiyalar
   * API: GET /api/v1/hr/transactions/
   */
  getTransactions: async (params?: {
    staff?: string; // UUID
    transaction_type?: string;
    branch?: string; // UUID
    search?: string;
    ordering?: string;
  }): Promise<BalanceTransaction[]> => {
    const response = await apiClient.get<
      BalanceTransaction[] | PaginatedResponse<BalanceTransaction>
    >(`/hr/transactions/`, { params });
    return unwrapResults(response.data);
  },

  // ==================== SALARY PAYMENTS ====================

  /**
   * Maosh to'lovlari ro'yxati
   * API: GET /api/v1/hr/salaries/
   */
  getSalaryPayments: async (params?: {
    staff?: string; // UUID
    status?: string;
    payment_method?: string;
    branch?: string; // UUID
    month?: string;
    search?: string;
    ordering?: string;
  }): Promise<SalaryPayment[]> => {
    const response = await apiClient.get<
      SalaryPayment[] | PaginatedResponse<SalaryPayment>
    >(`/hr/salaries/`, { params });
    return unwrapResults(response.data);
  },

  /**
   * Maosh to'lovi yaratish
   * API: POST /api/v1/hr/salaries/
   */
  createSalaryPayment: async (
    data: CreateSalaryPaymentRequest
  ): Promise<SalaryPayment> => {
    const response = await apiClient.post<SalaryPayment>(`/hr/salaries/`, data);
    return response.data;
  },

  /**
   * Maosh to'lovini yangilash
   * API: PATCH /api/v1/hr/salaries/{id}/
   */
  updateSalaryPayment: async (
    id: string,
    data: Partial<CreateSalaryPaymentRequest>
  ): Promise<SalaryPayment> => {
    const response = await apiClient.patch<SalaryPayment>(
      `/hr/salaries/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Maosh to'lovini o'chirish
   * API: DELETE /api/v1/hr/salaries/{id}/
   */
  deleteSalaryPayment: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr/salaries/${id}/`);
  },

  /**
   * Maosh to'lovini tasdiqlash (paid holatga o'tkazish)
   * API: POST /api/v1/hr/salaries/{id}/mark_paid/
   */
  markSalaryPaid: async (
    id: number,
    payment_date?: string,
    payment_method?: string
  ): Promise<SalaryPayment> => {
    const response = await apiClient.post<SalaryPayment>(
      `/hr/salaries/${id}/mark_paid/`,
      { payment_date, payment_method }
    );
    return response.data;
  },

  /**
   * Maosh to'lovini bekor qilish
   * API: POST /api/v1/hr/salaries/{id}/cancel/
   */
  cancelSalaryPayment: async (id: string): Promise<SalaryPayment> => {
    const response = await apiClient.post<SalaryPayment>(
      `/hr/salaries/${id}/cancel/`
    );
    return response.data;
  },
};
