import apiClient from "./client";
import type {
  Role,
  StaffMember,
  StaffMemberDetail,
  StaffStatistics,
  BalanceTransaction,
  SalaryPayment,
  CreateRoleRequest,
  CreateStaffRequest,
  UpdateStaffRequest,
  AddBalanceRequest,
  ChangeBalanceRequest,
  ChangeBalanceResponse,
  PaySalaryRequest,
  AddSalaryAccrualRequest,
  PaySalaryNewRequest,
  CalculateSalaryResponse,
  MonthlySummaryResponse,
  PaginatedResponse,
} from "@/types";
import type { EmploymentType, StaffStatus } from "@/types/staff";

/**
 * Staff Management API v2
 * Backend: /api/v1/branches/staff/
 * Documentation: staff-management.md v2
 * 
 * Key changes in v2:
 * - Phone-based user creation (no need for user UUID)
 * - Enhanced statistics with financial data
 * - Role clarity (BranchRole vs Role model)
 * - Soft delete with no unique constraint issues
 */

const unwrapResults = <T>(payload: T[] | PaginatedResponse<T>): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

export const staffApi = {
  // ==================== ROLES ====================

  /**
   * Get roles for a branch
   * GET /api/branches/{branch_id}/roles/
   */
  getRoles: async (branchId: string): Promise<Role[]> => {
    const response = await apiClient.get<Role[] | PaginatedResponse<Role>>(
      `/branches/${branchId}/roles/`
    );
    return unwrapResults(response.data);
  },

  /**
   * Create role
   * POST /api/branches/{branch_id}/roles/
   */
  createRole: async (branchId: string, data: CreateRoleRequest): Promise<Role> => {
    const response = await apiClient.post<Role>(`/branches/${branchId}/roles/`, data);
    return response.data;
  },

  /**
   * Get role details
   * GET /api/branches/{branch_id}/roles/{id}/
   */
  getRole: async (branchId: string, roleId: string): Promise<Role> => {
    const response = await apiClient.get<Role>(`/branches/${branchId}/roles/${roleId}/`);
    return response.data;
  },

  /**
   * Update role
   * PATCH /api/branches/{branch_id}/roles/{id}/
   */
  updateRole: async (
    branchId: string,
    roleId: string,
    data: Partial<CreateRoleRequest>
  ): Promise<Role> => {
    const response = await apiClient.patch<Role>(
      `/branches/${branchId}/roles/${roleId}/`,
      data
    );
    return response.data;
  },

  /**
   * Delete role
   * DELETE /api/branches/{branch_id}/roles/{id}/
   */
  deleteRole: async (branchId: string, roleId: string): Promise<void> => {
    await apiClient.delete(`/branches/${branchId}/roles/${roleId}/`);
  },

  // ==================== STAFF ====================

  /**
   * List staff members (Compact)
   * GET /api/v1/branches/staff/
   * 
   * Query params:
   * - branch: UUID (filter by branch)
   * - role: BranchRole (teacher, branch_admin, other, etc.)
   * - role_ref: UUID (filter by custom Role model)
   * - employment_type: full_time, part_time, contract
   * - status: active, terminated
   * - search: search by name, phone, passport
   * - ordering: hire_date, monthly_salary, balance, created_at
   */
  getStaff: async (
    params?: {
      branch?: string;
      role?: string; // BranchRole
      role_ref?: string; // Custom Role UUID
      employment_type?: EmploymentType;
      status?: StaffStatus;
      search?: string;
      ordering?: string;
    }
  ): Promise<StaffMember[]> => {
    const response = await apiClient.get<
      StaffMember[] | PaginatedResponse<StaffMember>
    >(`branches/staff/`, { params });
    return unwrapResults(response.data);
  },

  /**
   * Get staff statistics
   * GET /api/v1/branches/staff/stats/
   * Query param: branch (UUID)
   */
  getStaffStats: async (params?: { branch?: string }): Promise<StaffStatistics> => {
    const response = await apiClient.get<StaffStatistics>(
      `branches/staff/stats/`,
      { params }
    );
    return response.data;
  },

  /**
   * Create staff member
   * POST /api/v1/branches/staff/
   * 
   * v2: Creates user and membership in one request
   * - Uses phone_number instead of user UUID
   * - Auto-generates password if not provided
   * - Returns complete StaffDetailSerializer
   */
  createStaff: async (data: CreateStaffRequest): Promise<StaffMemberDetail> => {
    const response = await apiClient.post<StaffMemberDetail>(`branches/staff/`, data);
    return response.data;
  },

  /**
   * Get staff member details (Full)
   * GET /api/v1/branches/staff/{id}/
   * Includes transactions, payments, and complete info
   */
  getStaffMember: async (id: string): Promise<StaffMemberDetail> => {
    const response = await apiClient.get<StaffMemberDetail>(`branches/staff/${id}/`);
    return response.data;
  },

  /**
   * Update staff member
   * PATCH /api/v1/branches/staff/{id}/
   * 
   * v2: Cannot update user or branch fields
   */
  updateStaff: async (id: string, data: UpdateStaffRequest): Promise<StaffMemberDetail> => {
    const response = await apiClient.patch<StaffMemberDetail>(`branches/staff/${id}/`, data);
    return response.data;
  },

  /**
   * Delete staff member (Soft delete)
   * DELETE /api/v1/branches/staff/{id}/
   */
  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(`branches/staff/${id}/`);
  },

  /**
   * Change balance (New API with cash register integration)
   * POST /api/v1/branches/staff/{id}/change-balance/
   * 
   * Transaction types:
   * - salary_accrual: Adds to balance (no cash out)
   * - bonus: Adds to balance (no cash out)
   * - advance: Adds to balance (no cash out)
   * - adjustment: Adds to balance (no cash out)
   * - deduction: Subtracts from balance (cash out if create_cash_transaction=true)
   * - fine: Subtracts from balance (cash out if create_cash_transaction=true)
   * - other: Adds to balance (no cash out)
   */
  changeBalance: async (
    id: string,
    data: ChangeBalanceRequest
  ): Promise<ChangeBalanceResponse> => {
    const response = await apiClient.post<ChangeBalanceResponse>(
      `branches/staff/${id}/change-balance/`,
      data
    );
    return response.data;
  },

  /**
   * Add balance transaction (DEPRECATED - use changeBalance instead)
   * POST /api/v1/branches/staff/{id}/add_balance/
   * 
   * Transaction types:
   * - salary: Monthly salary
   * - bonus: Performance bonus
   * - deduction: Deduction from balance
   * - advance: Salary advance
   * - fine: Penalty/fine
   * - refund: Refund
   */
  addBalance: async (
    id: string,
    data: AddBalanceRequest
  ): Promise<StaffMemberDetail> => {
    const response = await apiClient.post<StaffMemberDetail>(
      `branches/staff/${id}/add_balance/`,
      data
    );
    return response.data;
  },

  /**
   * Record salary payment
   * POST /api/v1/branches/staff/{id}/pay_salary/
   * 
   * Payment methods: cash, bank_transfer, card
   * Payment status: pending, completed, failed
   */
  paySalary: async (
    id: string,
    data: PaySalaryRequest
  ): Promise<StaffMemberDetail> => {
    const response = await apiClient.post<StaffMemberDetail>(
      `branches/staff/${id}/pay_salary/`,
      data
    );
    return response.data;
  },

  // ==================== SALARY MANAGEMENT ====================

  /**
   * Add salary accrual (hisoblash)
   * POST /api/v1/branches/staff/{id}/add-salary/
   * 
   * Adds salary to staff balance
   */
  addSalaryAccrual: async (
    id: string,
    data: AddSalaryAccrualRequest
  ): Promise<StaffMemberDetail> => {
    const response = await apiClient.post<StaffMemberDetail>(
      `branches/staff/${id}/add-salary/`,
      data
    );
    return response.data;
  },

  /**
   * Pay salary (new API)
   * POST /api/v1/branches/staff/{id}/pay_salary/
   * 
   * Records salary payment with month tracking
   * Prevents duplicate payments for same month
   */
  paySalaryNew: async (
    id: string,
    data: PaySalaryNewRequest
  ): Promise<StaffMemberDetail> => {
    const response = await apiClient.post<StaffMemberDetail>(
      `branches/staff/${id}/pay_salary/`,
      data
    );
    return response.data;
  },

  /**
   * Calculate salary
   * GET /api/v1/branches/staff/{id}/calculate-salary/
   * 
   * Calculates how much to pay for a given month
   * Query params: year (optional), month (optional)
   */
  calculateSalary: async (
    id: string,
    params?: { year?: number; month?: number }
  ): Promise<CalculateSalaryResponse> => {
    const response = await apiClient.get<CalculateSalaryResponse>(
      `branches/staff/${id}/calculate-salary/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get monthly summary
   * GET /api/v1/branches/staff/{id}/monthly-summary/
   * 
   * Shows accrued vs paid for a given month
   * Query params: year (optional), month (optional)
   */
  getMonthlySummary: async (
    id: string,
    params?: { year?: number; month?: number }
  ): Promise<MonthlySummaryResponse> => {
    const response = await apiClient.get<MonthlySummaryResponse>(
      `branches/staff/${id}/monthly-summary/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get balance transactions list
   * GET /api/v1/branches/transactions/
   * 
   * List all balance transactions with filters
   */
  getTransactions: async (params?: {
    transaction_type?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    reference?: string;
    membership?: string;
    processed_by?: string;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<BalanceTransaction>> => {
    const response = await apiClient.get<PaginatedResponse<BalanceTransaction>>(
      `branches/transactions/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get transaction detail
   * GET /api/v1/branches/transactions/{id}/
   */
  getTransactionDetail: async (id: string): Promise<BalanceTransaction> => {
    const response = await apiClient.get<BalanceTransaction>(
      `branches/transactions/${id}/`
    );
    return response.data;
  },

  /**
   * Get salary payments list
   * GET /api/v1/branches/payments/
   * 
   * List all salary payments with filters
   */
  getPayments: async (params?: {
    status?: string;
    payment_method?: string;
    month?: string;
    month_from?: string;
    month_to?: string;
    payment_date_from?: string;
    payment_date_to?: string;
    amount_min?: number;
    amount_max?: number;
    reference_number?: string;
    membership?: string;
    processed_by?: string;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<SalaryPayment>> => {
    const response = await apiClient.get<PaginatedResponse<SalaryPayment>>(
      `branches/payments/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get payment detail
   * GET /api/v1/branches/payments/{id}/
   */
  getPaymentDetail: async (id: string): Promise<SalaryPayment> => {
    const response = await apiClient.get<SalaryPayment>(
      `branches/payments/${id}/`
    );
    return response.data;
  },
};
