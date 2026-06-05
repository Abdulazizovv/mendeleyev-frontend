import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";

const { SUPERADMIN } = API_ENDPOINTS;

export interface BranchListItem {
  id: string;
  name: string;
  type: "school" | "center";
  status: "pending" | "active" | "inactive" | "archived";
  code: string | null;
  slug: string;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  student_count: number;
  staff_count: number;
  admin_count: number;
}

export interface BranchSettings {
  lesson_duration_minutes: number;
  break_duration_minutes: number;
  school_start_time: string;
  school_end_time: string;
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  academic_year_start_month: number;
  academic_year_end_month: number;
  currency: string;
  currency_symbol: string;
  salary_calculation_day: number;
  auto_calculate_salary: boolean;
  work_days_per_week: number;
  work_hours_per_day: number;
  working_days: string[];
  holidays: string[];
  max_lessons_per_day: number;
  late_payment_penalty_percent: string;
  early_payment_discount_percent: string;
  additional_settings: Record<string, unknown>;
}

export interface BranchDetail extends BranchListItem {
  updated_at: string;
  settings: BranchSettings | null;
}

export interface BranchAdmin {
  id: string;
  user_id: string;
  phone_number: string;
  full_name: string;
  role: string;
  hire_date: string | null;
  is_super_admin: boolean;
}

export interface UserListItem {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  branch_count: number;
  memberships_summary: Array<{ branch__name: string; role: string }>;
}

export interface UserDetail extends UserListItem {
  is_staff: boolean;
  phone_verified: boolean;
  memberships: Array<{
    id: string;
    branch__id: string;
    branch__name: string;
    branch__type: string;
    branch__status: string;
    role: string;
  }>;
}

export interface GlobalStatistics {
  branches: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    archived: number;
    schools: number;
    centers: number;
  };
  users: {
    total: number;
    superadmins: number;
    branch_admins: number;
    teachers: number;
    students: number;
  };
  today: {
    new_branches: number;
    new_users: number;
  };
  top_branches: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    student_count: number;
    staff_count: number;
  }>;
}

export interface BranchStudentItem {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  balance: number;
  created_at: string | null;
}

export interface BranchStaffItem {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  role: string;
  role_label: string;
  title: string;
  balance: number;
  created_at: string | null;
}

export interface BranchFinance {
  total_income: number;
  total_expense: number;
  net_balance: number;
  cash_balance: number;
  monthly_income: number;
  monthly_expense: number;
  monthly_net: number;
}

export interface GlobalFinance {
  total_income: number;
  total_expense: number;
  total_salary: number;
  net_balance: number;
  total_cash_balance: number;
  monthly_income: number;
  monthly_expense: number;
  monthly_net: number;
  branch_balances: Array<{
    branch_id: string;
    branch_name: string;
    balance: number;
  }>;
}

export interface BranchClassItem {
  id: string;
  name: string;
  grade_level: number;
  academic_year: string;
  is_active: boolean;
  student_count: number;
  max_students: number;
  class_teacher: string | null;
}

export interface SearchResult {
  branches: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    code: string | null;
  }>;
  users: Array<{
    id: string;
    full_name: string;
    phone_number: string;
    is_superuser: boolean;
    branch_count: number;
  }>;
  classes: Array<{
    id: string;
    name: string;
    branch_id: string;
    branch_name: string;
    grade_level: number;
    academic_year: string;
  }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BranchCreateData {
  name: string;
  type: "school" | "center";
  code?: string;
  address?: string;
  phone_number?: string;
  email?: string;
}

export interface BranchUpdateData {
  name?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  code?: string;
}

export const superadminApi = {
  // --- Branches ---
  getBranches: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<BranchListItem>>(SUPERADMIN.BRANCHES, { params }),

  createBranch: (data: BranchCreateData) =>
    apiClient.post<BranchListItem>(SUPERADMIN.BRANCHES, data),

  getBranch: (id: string) =>
    apiClient.get<BranchDetail>(SUPERADMIN.BRANCH(id)),

  updateBranch: (id: string, data: BranchUpdateData) =>
    apiClient.patch<BranchDetail>(SUPERADMIN.BRANCH(id), data),

  activateBranch: (id: string) =>
    apiClient.post<{ status: string; message: string }>(SUPERADMIN.BRANCH_ACTION(id, "activate")),

  deactivateBranch: (id: string) =>
    apiClient.post<{ status: string; message: string }>(SUPERADMIN.BRANCH_ACTION(id, "deactivate")),

  archiveBranch: (id: string) =>
    apiClient.post<{ status: string; message: string }>(SUPERADMIN.BRANCH_ACTION(id, "archive")),

  getBranchSettings: (id: string) =>
    apiClient.get<BranchSettings>(SUPERADMIN.BRANCH_SETTINGS(id)),

  updateBranchSettings: (id: string, data: Partial<BranchSettings>) =>
    apiClient.patch<BranchSettings>(SUPERADMIN.BRANCH_SETTINGS(id), data),

  getBranchAdmins: (id: string) =>
    apiClient.get<BranchAdmin[]>(SUPERADMIN.BRANCH_ADMINS(id)),

  assignAdmin: (id: string, data: { user_id: string; role?: string }) =>
    apiClient.post<BranchAdmin>(SUPERADMIN.ASSIGN_ADMIN(id), data),

  removeAdmin: (id: string, data: { membership_id: string }) =>
    apiClient.delete(SUPERADMIN.REMOVE_ADMIN(id), { data }),

  // --- Users ---
  getUsers: (params?: Record<string, string | number | boolean>) =>
    apiClient.get<PaginatedResponse<UserListItem>>(SUPERADMIN.USERS, { params }),

  getUser: (id: string) =>
    apiClient.get<UserDetail>(SUPERADMIN.USER(id)),

  updateUser: (id: string, data: Partial<Pick<UserDetail, "first_name" | "last_name" | "email" | "is_active">>) =>
    apiClient.patch<UserDetail>(SUPERADMIN.USER(id), data),

  toggleSuperuser: (id: string) =>
    apiClient.post<{ id: string; is_superuser: boolean; message: string }>(
      SUPERADMIN.TOGGLE_SUPERUSER(id)
    ),

  // --- Per-branch detail ---
  getBranchStudents: (id: string, params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<BranchStudentItem>>(SUPERADMIN.BRANCH_STUDENTS(id), { params }),

  getBranchStaff: (id: string, params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<BranchStaffItem>>(SUPERADMIN.BRANCH_STAFF(id), { params }),

  getBranchFinance: (id: string) =>
    apiClient.get<BranchFinance>(SUPERADMIN.BRANCH_FINANCE(id)),

  getBranchClasses: (id: string) =>
    apiClient.get<BranchClassItem[]>(SUPERADMIN.BRANCH_CLASSES(id)),

  // --- Statistics ---
  getStatistics: () =>
    apiClient.get<GlobalStatistics>(SUPERADMIN.STATISTICS),

  // --- Finance ---
  getFinance: (params?: { branch_id?: string }) =>
    apiClient.get<GlobalFinance>(SUPERADMIN.FINANCE, { params }),

  // --- Search ---
  search: (q: string) =>
    apiClient.get<SearchResult>(SUPERADMIN.SEARCH, { params: { q } }),
};
