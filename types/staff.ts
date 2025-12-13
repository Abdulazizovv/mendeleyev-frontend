/**
 * Staff Management Types - BranchMembership based
 * Backend API: /api/branch/staff/
 */

// ==================== Enums ====================

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export type StaffStatus = "active" | "terminated";

export type BalanceStatus = "positive" | "negative" | "zero";

export type TransactionType = "salary" | "bonus" | "deduction" | "advance" | "fine";

export type PaymentMethod = "cash" | "bank_transfer" | "card";

export type PaymentStatus = "pending" | "completed" | "failed";

// ==================== Core Types ====================

/**
 * Role - Position/Job Title
 * Endpoint: /api/branches/{branch_id}/roles/
 */
export interface Role {
  id: string; // UUID
  name: string;
  code: string;
  branch: string; // UUID
  branch_name?: string;
  permissions: Record<string, string[]>; // {"academic": ["view_grades", "edit_grades"]}
  description?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Staff Member (BranchMembership)
 * Endpoint: /api/branches/{branch_id}/memberships/
 * Based on branch.md documentation
 */
export interface StaffMember {
  id: string; // UUID
  user: string; // UUID
  user_phone: string;
  user_name: string;
  branch: string; // UUID
  branch_name: string;
  role: string; // Legacy role (CharField)
  role_ref: string; // UUID - new Role FK
  role_name: string;
  effective_role: string;
  title?: string;
  monthly_salary: number; // Integer, so'm
  balance: number; // Integer, so'm
  salary: number; // Computed field from monthly_salary
  employment_type?: EmploymentType;
  hire_date?: string;
  termination_date?: string | null;
  passport_serial?: string;
  passport_number?: string;
  address?: string;
  emergency_contact?: string;
  notes?: string;
  is_active_employment: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Balance Transaction
 */
export interface BalanceTransaction {
  id: string; // UUID
  membership: string; // UUID
  transaction_type: TransactionType;
  amount: string; // Decimal string
  balance_before: string;
  balance_after: string;
  description?: string;
  created_at: string;
  created_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Salary Payment
 */
export interface SalaryPayment {
  id: string; // UUID
  membership: string; // UUID
  amount: string; // Decimal string
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  paid_at?: string;
  created_at: string;
  created_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Staff Statistics
 * Endpoint: /api/branch/staff/stats/
 */
export interface StaffStatistics {
  total_staff: number;
  active_staff: number;
  terminated_staff: number;
  total_balance: number;
  total_base_salary: number;
  by_employment_type: Array<{
    employment_type: EmploymentType;
    count: number;
  }>;
  by_role: Array<{
    role__name: string;
    count: number;
  }>;
  average_salary: number;
}

// ==================== Request Types ====================

/**
 * Create Role Request
 */
export interface CreateRoleRequest {
  name: string;
  code?: string;
  permissions?: Record<string, string[]>;
  description?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  is_active?: boolean;
}

/**
 * Create Staff Request (BranchMembership)
 * Based on branch.md - memberships creation
 */
export interface CreateStaffRequest {
  user: string; // UUID
  branch: string; // UUID
  role_ref: string; // UUID - new Role FK
  title?: string;
  monthly_salary: number; // Integer, so'm
  hire_date?: string; // ISO date
  employment_type?: EmploymentType;
  passport_serial?: string;
  passport_number?: string;
  address?: string;
  emergency_contact?: string;
  notes?: string;
}

/**
 * Update Staff Request
 */
export interface UpdateStaffRequest {
  role_ref?: string; // UUID
  title?: string;
  monthly_salary?: number;
  employment_type?: EmploymentType;
  address?: string;
  emergency_contact?: string;
  notes?: string;
  termination_date?: string | null; // ISO date
}

/**
 * Add Balance Transaction Request
 */
export interface AddBalanceRequest {
  amount: number;
  transaction_type: TransactionType;
  description?: string;
}

/**
 * Pay Salary Request
 */
export interface PaySalaryRequest {
  amount: number;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  description?: string;
  notes?: string;
}

// ==================== Labels ====================

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "To'liq stavka",
  part_time: "Yarim stavka",
  contract: "Shartnoma asosida",
  intern: "Amaliyotchi",
};

export const EMPLOYMENT_STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Faol",
  terminated: "Ishdan bo'shatilgan",
};

// Legacy export names for backward compatibility
export const employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
export const staffStatusLabels = EMPLOYMENT_STATUS_LABELS;

export const transactionTypeLabels: Record<TransactionType, string> = {
  salary: "Maosh",
  bonus: "Bonus",
  deduction: "Ushlab qolish",
  advance: "Avans",
  fine: "Jarima",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Naqd",
  bank_transfer: "Bank o'tkazma",
  card: "Karta",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Kutilmoqda",
  completed: "To'langan",
  failed: "Muvaffaqiyatsiz",
};
