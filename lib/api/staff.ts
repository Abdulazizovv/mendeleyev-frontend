import apiClient from "./client";
import type {
  Role,
  StaffMember,
  StaffStatistics,
  BalanceTransaction,
  SalaryPayment,
  CreateRoleRequest,
  CreateStaffRequest,
  UpdateStaffRequest,
  AddBalanceRequest,
  PaySalaryRequest,
  PaginatedResponse,
} from "@/types";
import type { EmploymentType, StaffStatus } from "@/types/staff";

/**
 * Staff Management API
 * Backend: /api/branches/{branch_id}/memberships/ (BranchMembership based)
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
   * List staff members
   * GET /api/branches/{branch_id}/memberships/
   */
  getStaff: async (branchId: string, params?: {
    role?: string;
    employment_type?: EmploymentType;
    status?: StaffStatus;
    search?: string;
    ordering?: string;
  }): Promise<StaffMember[]> => {
    const response = await apiClient.get<
      StaffMember[] | PaginatedResponse<StaffMember>
    >(`/branches/${branchId}/memberships/`, { params });
    return unwrapResults(response.data);
  },

  /**
   * Get staff statistics
   * Note: Stats endpoint not available in backend, calculate client-side
   */
  getStaffStats: async (branchId: string): Promise<StaffStatistics> => {
    // Get all staff for the branch
    const staff = await staffApi.getStaff(branchId);
    
    // Calculate statistics client-side
    const activeStaff = staff.filter(s => s.is_active_employment);
    const terminatedStaff = staff.filter(s => !s.is_active_employment);
    
    const byEmploymentType = staff.reduce((acc, s) => {
      if (!s.employment_type) return acc;
      const existing = acc.find(item => item.employment_type === s.employment_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ employment_type: s.employment_type, count: 1 });
      }
      return acc;
    }, [] as Array<{ employment_type: EmploymentType; count: number }>);
    
    const byRole = staff.reduce((acc, s) => {
      const roleName = s.effective_role || s.role_name || "Unknown";
      const existing = acc.find(item => item.role__name === roleName);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ role__name: roleName, count: 1 });
      }
      return acc;
    }, [] as Array<{ role__name: string; count: number }>);
    
    const totalBalance = staff.reduce((sum, s) => sum + s.balance, 0);
    const totalSalary = staff.reduce((sum, s) => sum + s.monthly_salary, 0);
    const averageSalary = staff.length > 0 ? totalSalary / staff.length : 0;
    
    return {
      total_staff: staff.length,
      active_staff: activeStaff.length,
      terminated_staff: terminatedStaff.length,
      total_balance: totalBalance,
      total_base_salary: totalSalary,
      by_employment_type: byEmploymentType,
      by_role: byRole,
      average_salary: averageSalary,
    };
  },

  /**
   * Create staff member
   * POST /api/branches/{branch_id}/memberships/
   */
  createStaff: async (branchId: string, data: CreateStaffRequest): Promise<StaffMember> => {
    const response = await apiClient.post<StaffMember>(`/branches/${branchId}/memberships/`, data);
    return response.data;
  },

  /**
   * Get staff member details
   * GET /api/branches/{branch_id}/memberships/{id}/
   */
  getStaffMember: async (branchId: string, id: string): Promise<StaffMember> => {
    const response = await apiClient.get<StaffMember>(`/branches/${branchId}/memberships/${id}/`);
    return response.data;
  },

  /**
   * Update staff member
   * PATCH /api/branches/{branch_id}/memberships/{id}/
   */
  updateStaff: async (branchId: string, id: string, data: UpdateStaffRequest): Promise<StaffMember> => {
    const response = await apiClient.patch<StaffMember>(`/branches/${branchId}/memberships/${id}/`, data);
    return response.data;
  },

  /**
   * Delete staff member
   * DELETE /api/branches/{branch_id}/memberships/{id}/
   */
  deleteStaff: async (branchId: string, id: string): Promise<void> => {
    await apiClient.delete(`/branches/${branchId}/memberships/${id}/`);
  },

  /**
   * Add balance transaction
   * POST /api/branches/{branch_id}/memberships/{membership_id}/balance/
   */
  addBalance: async (
    branchId: string,
    membershipId: string,
    data: { amount: number; note?: string }
  ): Promise<StaffMember> => {
    const response = await apiClient.post<StaffMember>(
      `/branches/${branchId}/memberships/${membershipId}/balance/`,
      data
    );
    return response.data;
  },

  /**
   * Pay salary (using balance endpoint)
   * POST /api/branches/{branch_id}/memberships/{membership_id}/balance/
   */
  paySalary: async (
    branchId: string,
    membershipId: string,
    data: PaySalaryRequest
  ): Promise<StaffMember> => {
    // Convert to balance transaction
    const balanceData = {
      amount: -data.amount, // Negative to deduct from balance
      note: data.description || `Salary payment via ${data.payment_method}`
    };
    const response = await apiClient.post<StaffMember>(
      `/branches/${branchId}/memberships/${membershipId}/balance/`,
      balanceData
    );
    return response.data;
  },
};
