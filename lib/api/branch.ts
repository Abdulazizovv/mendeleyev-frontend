import apiClient from "./client";
import type { Branch, BranchMembership } from "@/types";
import type { PaginatedResponse } from "@/types/school";

/**
 * Role interface - Branch rollar
 */
export interface Role {
  id: string;
  name: string;
  branch: string | null;
  branch_name: string | null;
  permissions: Record<string, string[]>;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Membership interface - Xodimlar a'zoligi
 */
export interface MembershipDetail {
  id: string;
  user: string;
  user_phone: string;
  user_name: string;
  branch: string;
  branch_name: string;
  role: string;
  role_ref: string | null;
  role_name: string | null;
  effective_role: string;
  title: string | null;
  monthly_salary: number | null;
  balance: number;
  salary: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Balance update request
 */
export interface BalanceUpdateRequest {
  amount: number;
  note: string;
}

/**
 * Role create/update request
 */
export interface RoleRequest {
  name: string;
  permissions: Record<string, string[]>;
  description: string;
  is_active: boolean;
}

/**
 * Managed branches update request (SuperAdmin only)
 */
export interface ManagedBranchesUpdateRequest {
  user_id: string;
  branch_ids: string[];
}

/**
 * Branch Admin statistics
 */
export interface BranchStatistics {
  total_staff: number;
  total_students: number;
  total_classes: number;
  total_subjects: number;
  total_balance: number;
  total_salary_expense: number;
  active_academic_year?: {
    id: string;
    name: string;
  };
}

/**
 * Branch API Service
 * Filial boshqaruvi uchun API endpointlari
 */
export const branchApi = {
  // ==================== MANAGED BRANCHES ====================

  /**
   * Boshqariladigan filiallarni olish
   * SuperAdmin: barcha filiallar
   * BranchAdmin: faqat o'z filiallari
   */
  getManagedBranches: async (): Promise<Branch[]> => {
    const response = await apiClient.get<Branch[]>("/branches/managed/");
    return response.data;
  },

  /**
   * Managed branches yangilash (SuperAdmin only)
   */
  updateManagedBranches: async (
    data: ManagedBranchesUpdateRequest
  ): Promise<{ detail: string }> => {
    const response = await apiClient.patch<{ detail: string }>("/branches/managed/", data);
    return response.data;
  },

  // ==================== ROLES ====================

  /**
   * Filialdagi rollarni olish
   * Backend pagination qilishi mumkin yoki oddiy array qaytarishi mumkin
   */
  getRoles: async (branchId: string): Promise<Role[]> => {
    const response = await apiClient.get<Role[] | PaginatedResponse<Role>>(`/branches/${branchId}/roles/`);
    
    // Check if response is paginated
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return (response.data as PaginatedResponse<Role>).results;
    }
    
    // Otherwise return as array
    return response.data as Role[];
  },

  /**
   * Rol yaratish
   */
  createRole: async (branchId: string, data: RoleRequest): Promise<Role> => {
    const response = await apiClient.post<Role>(`/branches/${branchId}/roles/`, data);
    return response.data;
  },

  /**
   * Rol detallari
   */
  getRole: async (branchId: string, roleId: string): Promise<Role> => {
    const response = await apiClient.get<Role>(`/branches/${branchId}/roles/${roleId}/`);
    return response.data;
  },

  /**
   * Rolni yangilash
   */
  updateRole: async (branchId: string, roleId: string, data: Partial<RoleRequest>): Promise<Role> => {
    const response = await apiClient.patch<Role>(`/branches/${branchId}/roles/${roleId}/`, data);
    return response.data;
  },

  /**
   * Rolni o'chirish
   */
  deleteRole: async (branchId: string, roleId: string): Promise<void> => {
    await apiClient.delete(`/branches/${branchId}/roles/${roleId}/`);
  },

  // ==================== MEMBERSHIPS ====================

  /**
   * Filialdagi xodimlarni olish (paginated)
   */
  getMemberships: async (
    branchId: string,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      role?: string;
      ordering?: string;
    }
  ): Promise<PaginatedResponse<MembershipDetail>> => {
    const response = await apiClient.get<PaginatedResponse<MembershipDetail>>(
      `/branches/${branchId}/memberships/`,
      { params }
    );
    return response.data;
  },

  /**
   * Xodim balansini yangilash
   */
  updateBalance: async (
    branchId: string,
    membershipId: string,
    data: BalanceUpdateRequest
  ): Promise<MembershipDetail> => {
    const response = await apiClient.post<MembershipDetail>(
      `/branches/${branchId}/memberships/${membershipId}/balance/`,
      data
    );
    return response.data;
  },

  // ==================== STATISTICS ====================

  /**
   * Branch statistikasini olish
   * Bu endpoint backend da bo'lmasligi mumkin, kerak bo'lsa qo'shamiz
   */
  getBranchStatistics: async (branchId: string): Promise<BranchStatistics> => {
    // TODO: Backend da endpoint yaratish kerak
    // Hozircha memberships va school data dan hisoblash mumkin
    const response = await apiClient.get<BranchStatistics>(
      `/branches/${branchId}/statistics/`
    );
    return response.data;
  },
};
