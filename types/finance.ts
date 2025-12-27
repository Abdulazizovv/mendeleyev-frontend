/**
 * Finance Types - Complete Finance System
 * Backend API: /api/v1/school/finance/
 */

// ==================== Finance Category ====================

export interface FinanceCategory {
  id: string;
  branch: string | null;
  branch_name: string;
  type: CategoryType;
  code: string;
  name: string;
  description?: string;
  parent: string | null;
  parent_name: string | null;
  subcategories_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFinanceCategoryRequest {
  name: string;
  type: CategoryType;
  code: string;
  description?: string;
  parent?: string | null;
  is_active?: boolean;
}

export interface UpdateFinanceCategoryRequest {
  name?: string;
  description?: string;
  parent?: string | null;
  is_active?: boolean;
}

// ==================== Cash Register ====================

export interface CashRegister {
  id: string;
  branch: string;
  branch_name: string;
  name: string;
  description?: string;
  balance: number;
  is_active: boolean;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCashRegisterRequest {
  branch: string;
  name: string;
  description?: string;
  location?: string;
  is_active?: boolean;
}

// ==================== Transaction ====================

export interface Transaction {
  id: string;
  branch: string;
  branch_name: string;
  cash_register: string;
  cash_register_name: string;
  category?: string;
  category_name?: string;
  transaction_type: TransactionType;
  transaction_type_display: string;
  status: TransactionStatus;
  status_display: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_method_display: string;
  description?: string;
  reference_number?: string;
  student_profile?: string;
  student?: {
    id: string;
    personal_number: string;
    full_name: string;
    phone_number: string;
    status: string;
    status_display: string;
    current_class?: {
      id: string;
      name: string;
    };
  };
  employee_membership?: string;
  employee?: {
    id: string;
    user_id: string;
    full_name: string;
    phone_number: string;
    email?: string;
    role: string;
    role_display: string;
    is_active: boolean;
    avatar?: string;
    avatar_url?: string;
  };
  transaction_date: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  branch: string;
  cash_register: string;
  transaction_type: TransactionType;
  category?: string;
  amount: number;
  payment_method: PaymentMethod;
  description?: string;
  reference_number?: string;
  student_profile?: string;
  employee_membership?: string;
  transaction_date?: string;
  metadata?: Record<string, any>;
}

// ==================== Student Balance ====================

export interface StudentBalance {
  id: string;
  student_profile: string;
  student_name: string;
  student_personal_number: string;
  balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== Subscription Plan ====================

export interface SubscriptionPlan {
  id: string;
  branch: string | null;
  branch_name?: string;
  name: string;
  description?: string;
  grade_level_min: number;
  grade_level_max: number;
  grade_level_range: string;
  period: PeriodType;
  period_display: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPlanRequest {
  branch?: string | null;
  name: string;
  description?: string;
  grade_level_min: number;
  grade_level_max: number;
  period: PeriodType;
  price: number;
  is_active?: boolean;
}

// ==================== Discount ====================

export interface Discount {
  id: string;
  branch: string | null;
  branch_name?: string;
  name: string;
  discount_type: DiscountType;
  discount_type_display: string;
  amount: number;
  discount_display: string;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  description?: string;
  conditions?: Record<string, any>;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountRequest {
  branch?: string | null;
  name: string;
  discount_type: DiscountType;
  amount: number;
  is_active?: boolean;
  valid_from?: string;
  valid_until?: string;
  description?: string;
  conditions?: Record<string, any>;
}

// ==================== Payment ====================

export interface Payment {
  id: string;
  student_profile: string;
  student?: {
    id: string;
    personal_number: string;
    full_name: string;
    phone_number: string;
    email: string;
    status: string;
    status_display: string;
    current_class?: {
      id: string;
      name: string;
    };
    avatar?: string;
    avatar_url?: string;
  };
  // Legacy fields (for backward compatibility)
  student_name?: string;
  student_personal_number?: string;
  branch: string;
  branch_name: string;
  subscription_plan: string;
  subscription_plan_name: string;
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  discount?: string;
  discount_name?: string;
  payment_method: PaymentMethod;
  payment_method_display: string;
  period: PeriodType;
  period_display: string;
  payment_date: string;
  period_start: string;
  period_end: string;
  transaction: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  student_profile: string;
  branch: string;
  subscription_plan: string;
  base_amount: number;
  discount?: string;
  payment_method: PaymentMethod;
  period: PeriodType;
  payment_date: string;
  period_start: string;
  period_end: string;
  cash_register: string;
  notes?: string;
}

// ==================== Statistics ====================

export interface FinanceStatistics {
  summary: {
    total_income: number;
    total_expense: number;
    net_balance: number;
    total_cash_balance: number;
    total_student_balance: number;
    total_payments: number;
    payments_count: number;
  };
  monthly_stats: {
    month: string;
    income: number;
    expense: number;
  }[];
}

// ==================== Enums ====================

export type CategoryType = "income" | "expense";

export type TransactionType = 
  | "income" 
  | "expense" 
  | "transfer" 
  | "payment" 
  | "salary" 
  | "refund";

export type TransactionStatus = 
  | "pending" 
  | "completed" 
  | "cancelled" 
  | "failed";

export type PaymentMethod = 
  | "cash" 
  | "card" 
  | "bank_transfer" 
  | "mobile_payment" 
  | "other";

export type PeriodType = 
  | "monthly" 
  | "yearly" 
  | "quarterly" 
  | "semester";

export type DiscountType = 
  | "percentage" 
  | "fixed";

// ==================== Labels ====================

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: "Kirim",
  expense: "Chiqim",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Kirim",
  expense: "Chiqim",
  transfer: "O'tkazma",
  payment: "To'lov",
  salary: "Maosh",
  refund: "Qaytarish",
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: "Kutilmoqda",
  completed: "Bajarilgan",
  cancelled: "Bekor qilingan",
  failed: "Muvaffaqiyatsiz",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Naqd pul",
  card: "Karta",
  bank_transfer: "Bank o'tkazmasi",
  mobile_payment: "Mobil to'lov",
  other: "Boshqa",
};

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  monthly: "Oylik",
  yearly: "Yillik",
  quarterly: "Choraklik",
  semester: "Semestr",
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Foiz",
  fixed: "Aniq summa",
};

// ==================== Paginated Response ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
