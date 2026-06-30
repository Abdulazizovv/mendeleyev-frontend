import apiClient from "./client";
import type { Branch, BranchMembership } from "@/types";
import type { PaginatedResponse, BranchSettings, UpdateBranchSettingsPayload } from "@/types/school";

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
  permissions: PermissionsData;
  description: string;
  is_active: boolean;
  salary_range_min?: number;
  salary_range_max?: number;
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

// ── Permission Types ──────────────────────────────────────────────────────
export type PermissionsData = Record<string, Record<string, boolean>>;

export interface PermissionModuleInfo {
  label: string;
  actions: string[];
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: PermissionsData;
  member_count: number;
  created_at?: string;
}

export interface StaffPermissionItem {
  membership_id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  role: string;
  title: string;
  permissions: PermissionsData;
  permission_group_id: string | null;
  permission_group_name: string | null;
}

export interface BranchPermissionsResponse {
  staff: StaffPermissionItem[];
  groups: PermissionGroup[];
  available_modules: Record<string, PermissionModuleInfo>;
}

export interface MembershipPermissionsResponse {
  membership_id: string;
  role: string;
  permissions: PermissionsData;
  permission_group_id: string | null;
  permission_group_name: string | null;
  available_modules?: Record<string, string[]>;
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
   * Filters: role, salary_type, user_id, is_active, balance, created_at, updated_at
   * Search: user first_name/last_name/phone_number, membership title
   * Ordering: created_at, updated_at, role, salary_type, balance (prefix - for desc)
   */
  getMemberships: async (
    branchId: string,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      role?: string;
      salary_type?: string;
      user_id?: string;
      is_active?: boolean;
      "teachable_subjects__id"?: string;
      balance?: number;
      balance__lt?: number;
      balance__lte?: number;
      balance__gt?: number;
      balance__gte?: number;
      created_at?: string;
      created_at__lt?: string;
      created_at__lte?: string;
      created_at__gt?: string;
      created_at__gte?: string;
      updated_at?: string;
      updated_at__lt?: string;
      updated_at__lte?: string;
      updated_at__gt?: string;
      updated_at__gte?: string;
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

  // ==================== BRANCH SETTINGS ====================

  /**
   * Filial sozlamalarini olish
   */
  getBranchSettings: async (branchId: string): Promise<BranchSettings> => {
    const response = await apiClient.get<BranchSettings>(
      `/branches/settings/${branchId}/`
    );
    return response.data;
  },

  /**
   * Filial sozlamalarini yangilash (qisman yangilash)
   */
  updateBranchSettings: async (
    branchId: string,
    data: UpdateBranchSettingsPayload
  ): Promise<BranchSettings> => {
    const response = await apiClient.patch<BranchSettings>(
      `/branches/settings/${branchId}/`,
      data
    );
    return response.data;
  },

  // ==================== PERMISSIONS ====================

  /**
   * Filial barcha xodimlarining ruxsatlarini olish (permissions sahifasi uchun)
   */
  getBranchPermissions: async (branchId: string): Promise<BranchPermissionsResponse> => {
    const response = await apiClient.get<BranchPermissionsResponse>(
      `/branches/${branchId}/permissions/`
    );
    return response.data;
  },

  /**
   * Bitta xodim ruxsatlarini olish
   */
  getMembershipPermissions: async (
    branchId: string,
    membershipId: string
  ): Promise<MembershipPermissionsResponse> => {
    const response = await apiClient.get<MembershipPermissionsResponse>(
      `/branches/${branchId}/memberships/${membershipId}/permissions/`
    );
    return response.data;
  },

  /**
   * Bitta xodim ruxsatlarini yangilash (shaxsiy, guruhni tozalaydi)
   */
  updateMembershipPermissions: async (
    branchId: string,
    membershipId: string,
    permissions: PermissionsData
  ): Promise<MembershipPermissionsResponse> => {
    const response = await apiClient.put<MembershipPermissionsResponse>(
      `/branches/${branchId}/memberships/${membershipId}/permissions/`,
      { permissions }
    );
    return response.data;
  },

  /**
   * Xodimga guruh ruxsatlarini qo'llash
   */
  applyPermissionGroup: async (
    branchId: string,
    membershipId: string,
    groupId: string | null
  ): Promise<MembershipPermissionsResponse> => {
    const response = await apiClient.post<MembershipPermissionsResponse>(
      `/branches/${branchId}/memberships/${membershipId}/apply-group/`,
      { group_id: groupId }
    );
    return response.data;
  },

  /**
   * Ruxsatlar guruhlarini olish
   */
  getPermissionGroups: async (branchId: string): Promise<PermissionGroup[]> => {
    const response = await apiClient.get<PermissionGroup[]>(
      `/branches/${branchId}/permission-groups/`
    );
    return response.data;
  },

  /**
   * Yangi ruxsatlar guruhi yaratish
   */
  createPermissionGroup: async (
    branchId: string,
    data: { name: string; description: string; permissions: PermissionsData }
  ): Promise<PermissionGroup> => {
    const response = await apiClient.post<PermissionGroup>(
      `/branches/${branchId}/permission-groups/`,
      data
    );
    return response.data;
  },

  /**
   * Ruxsatlar guruhini yangilash
   */
  updatePermissionGroup: async (
    branchId: string,
    groupId: string,
    data: { name?: string; description?: string; permissions?: PermissionsData; apply_to_members?: boolean }
  ): Promise<PermissionGroup> => {
    const response = await apiClient.patch<PermissionGroup>(
      `/branches/${branchId}/permission-groups/${groupId}/`,
      data
    );
    return response.data;
  },

  /**
   * Ruxsatlar guruhini o'chirish
   */
  deletePermissionGroup: async (branchId: string, groupId: string): Promise<void> => {
    await apiClient.delete(`/branches/${branchId}/permission-groups/${groupId}/`);
  },
};
