/**
 * Staff Management Types - BranchMembership based
 * Backend API: /api/branch/staff/
 */

// ==================== Enums ====================

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export type StaffStatus = "active" | "terminated";

export type BalanceStatus = "positive" | "negative" | "zero";

export type TransactionType = "salary" | "bonus" | "deduction" | "advance" | "fine" | "refund" | "salary_accrual" | "adjustment" | "other";

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
 * Staff Member - List Response (Compact)
 * Endpoint: GET /api/v1/branches/staff/
 * Based on staff-management.md v2 documentation
 */
export interface StaffMember {
  id: string; // UUID
  full_name: string;
  phone_number: string;
  role: string; // BranchRole CharField: teacher, branch_admin, other, etc.
  role_display: string;
  role_ref_name?: string; // Custom Role name
  title?: string;
  employment_type?: EmploymentType;
  employment_type_display?: string;
  hire_date?: string;
  balance: number; // Integer, so'm
  monthly_salary: number; // Integer, so'm
  is_active: boolean; // Active employment status
}

/**
 * Staff Member Details - Full Response
 * Endpoint: GET /api/v1/branches/staff/{id}/
 * v2: Enhanced with complete data
 */
export interface StaffMemberDetail extends StaffMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  
  branch: string; // UUID
  branch_name: string;
  branch_type?: string;
  
  role_ref?: string; // UUID (nullable)
  role_ref_id?: string; // UUID (nullable)
  role_ref_permissions?: Record<string, string[]>; // {"academic": ["view_grades", "edit_grades"]}
  
  balance_status: BalanceStatus;
  salary: number;
  salary_type: string; // "monthly", "hourly", "per_lesson"
  hourly_rate?: number | null;
  per_lesson_rate?: number | null;
  
  termination_date?: string | null;
  days_employed: number;
  years_employed: number;
  is_active_employment: boolean;
  
  passport_serial?: string;
  passport_number?: string;
  address?: string;
  emergency_contact?: string;
  notes?: Record<string, any>; // JSON field
  
  recent_transactions: BalanceTransaction[];
  recent_payments: SalaryPayment[];
  
  transaction_summary: {
    total_transactions: number;
    total_received: number;
    total_deducted: number;
  };
  
  payment_summary: {
    total_payments: number;
    total_amount_paid: number;
    pending_payments: number;
  };
  
  created_at: string;
  updated_at: string;
}

/**
 * Staff Statistics
 * Endpoint: GET /api/v1/branches/staff/stats/
 * v2: Enhanced with financial and payment data
 */
export interface StaffStatistics {
  // Basic counts
  total_staff: number;
  active_staff: number;
  terminated_staff: number;
  
  // Distribution
  by_employment_type: Array<{
    employment_type: EmploymentType;
    count: number;
  }>;
  by_role: Array<{
    role: string; // BranchRole
    count: number;
  }>;
  by_custom_role: Array<{
    role_ref__id: string;
    role_ref__name: string;
    count: number;
  }>;
  
  // Financial data (salary budgets)
  average_salary: number;
  total_salary_budget: number;
  max_salary: number;
  min_salary: number;
  
  // Payment data (actual payments)
  total_paid: number;
  total_pending: number;
  paid_payments_count: number;
  pending_payments_count: number;
  
  // Balance data
  total_balance: number;
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
 * Create Staff Request
 * POST /api/v1/branches/staff/
 * v2: Creates user and membership in one request
 */
export interface CreateStaffRequest {
  // User fields (creates new user or uses existing)
  phone_number: string; // REQUIRED - Unique identifier
  first_name: string; // REQUIRED
  last_name: string; // REQUIRED
  email?: string;
  password?: string; // Optional, auto-generated if omitted
  
  // Membership fields
  branch_id: string; // UUID - REQUIRED
  role: string; // BranchRole - REQUIRED (teacher, branch_admin, other, etc.)
  role_ref_id?: string; // UUID - REQUIRED if role="other"
  title?: string;
  
  // Salary fields
  monthly_salary?: number; // Default: 0
  salary_type?: string; // Default: "monthly"
  hire_date?: string; // ISO date
  employment_type?: EmploymentType; // Default: "full_time"
  
  // Personal info
  passport_serial?: string;
  passport_number?: string;
  address?: string;
  emergency_contact?: string;
  notes?: Record<string, any>; // JSON object
}

/**
 * Update Staff Request
 * PATCH /api/v1/branches/staff/{id}/
 * v2: Cannot change user or branch
 */
export interface UpdateStaffRequest {
  // Role fields
  role?: string; // BranchRole
  role_ref_id?: string; // UUID
  title?: string;
  
  // Salary fields
  monthly_salary?: number;
  salary_type?: string;
  employment_type?: EmploymentType;
  
  // Personal info
  passport_serial?: string;
  passport_number?: string;
  address?: string;
  emergency_contact?: string;
  notes?: Record<string, any>;
  
  // Termination
  termination_date?: string | null; // ISO date for termination
}

/**
 * Add Balance Transaction Request
 * POST /api/v1/branches/staff/{id}/add_balance/
 * v2: amount is number, not string
 * ⚠️ DEPRECATED - use ChangeBalanceRequest instead
 */
export interface AddBalanceRequest {
  amount: number; // Integer, so'm
  transaction_type: TransactionType;
  description?: string;
}

/**
 * Change Balance Request (New API)
 * POST /api/v1/branches/staff/{id}/change-balance/
 * Replaces add_balance with cash register integration
 */
export interface ChangeBalanceRequest {
  transaction_type: 'salary_accrual' | 'bonus' | 'advance' | 'adjustment' | 'deduction' | 'fine' | 'other';
  amount: number; // Integer, so'm (always positive)
  description: string; // Required
  create_cash_transaction?: boolean; // Default: false
  cash_register_id?: string; // UUID, required if create_cash_transaction=true
  payment_method?: 'cash' | 'bank_transfer' | 'card' | 'mobile_payment' | 'other'; // Default: cash
  reference?: string; // Optional reference number
}

/**
 * Change Balance Response
 */
export interface ChangeBalanceResponse {
  staff: {
    id: string;
    full_name: string;
    phone_number: string;
    role: string;
    monthly_salary: number;
    balance: number;
    hire_date: string;
  };
  balance_transaction_id: string;
  cash_transaction_id?: string;
  previous_balance: number;
  new_balance: number;
}

/**
 * Pay Salary Request
 * POST /api/v1/branches/staff/{id}/pay_salary/
 * v2: amount is number, not string
 */
export interface PaySalaryRequest {
  amount: number; // Integer, so'm
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  notes?: string;
}

/**
 * Add Salary Accrual Request
 * POST /api/v1/branches/staff/{id}/add-salary/
 */
export interface AddSalaryAccrualRequest {
  amount: number; // Integer, so'm (positive)
  description: string; // Required
  reference?: string; // Optional reference number
}

/**
 * Pay Salary (New API) Request
 * POST /api/v1/branches/staff/{id}/pay_salary/
 */
export interface PaySalaryNewRequest {
  amount: number; // Integer, so'm (positive)
  payment_date: string; // YYYY-MM-DD (cannot be future)
  payment_method: PaymentMethod; // cash, bank_transfer, card, other
  month: string; // YYYY-MM-01 (first day of month)
  notes?: string;
  reference_number?: string;
}

/**
 * Calculate Salary Response
 * GET /api/v1/branches/staff/{id}/calculate-salary/
 */
export interface CalculateSalaryResponse {
  success: boolean;
  monthly_salary?: number;
  days_in_month?: number;
  daily_salary?: number;
  total_amount?: number;
  year?: number;
  month?: number;
  reason?: string; // If success is false
}

/**
 * Monthly Summary Response
 * GET /api/v1/branches/staff/{id}/monthly-summary/
 */
export interface MonthlySummaryResponse {
  year: number;
  month: number;
  total_accrued: number; // Total amount added to balance
  total_paid: number; // Total amount paid from balance
  balance_change: number; // accrued - paid
  payments_count: number;
  transactions_count: number;
}

// Balance Transaction (from transactions list)
export interface BalanceTransaction {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_phone: string;
  staff_role: string;
  transaction_type: TransactionType;
  transaction_type_display: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  balance_change: number;
  reference: string;
  description: string;
  salary_payment_id: string | null;
  salary_payment_month: string | null;
  processed_by_name: string;
  processed_by_phone: string | null;
  created_at: string;
  updated_at: string;
}

// Salary Payment (from payments list)
export interface SalaryPayment {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_phone: string;
  staff_role: string;
  staff_monthly_salary: number;
  month: string;
  month_display: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  payment_method_display: string;
  status: string;
  status_display: string;
  notes: string;
  reference_number: string;
  transactions_count: number;
  processed_by_name: string;
  processed_by_phone: string | null;
  created_at: string;
  updated_at: string;
}

// Paginated List Response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
  refund: "Qaytarish",
  salary_accrual: "Oylik hisoblash",
  adjustment: "To'g'rilash",
  other: "Boshqa",
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

// Additional status values from API
export const salaryPaymentStatusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  paid: "To'langan",
  cancelled: "Bekor qilingan",
};
