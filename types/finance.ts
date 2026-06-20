/**
 * Finance Types - Complete Finance System
 * Backend API: /api/v1/school/finance/
 */

// ==================== Finance Category ====================

export type FinanceCategoryClientType = "student" | "employee" | "third_party" | "other";

export const FINANCE_CATEGORY_CLIENT_TYPE_LABELS: Record<FinanceCategoryClientType, string> = {
  student: "O'quvchi",
  employee: "Xodim",
  third_party: "Uchinchi shaxs",
  other: "Boshqa",
};

export interface FinanceCategory {
  id: string;
  branch: string | null;
  branch_name: string;
  type: CategoryType;
  client_type: FinanceCategoryClientType;
  client_type_display: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFinanceCategoryRequest {
  name: string;
  type: CategoryType;
  client_type?: FinanceCategoryClientType;
  description?: string;
  is_active?: boolean;
}

export interface UpdateFinanceCategoryRequest {
  name?: string;
  client_type?: FinanceCategoryClientType;
  description?: string;
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
  period_month?: string;
  period_months?: string[];
  third_party_name?: string;
  metadata?: {
    balance_before?: number;
    balance_after?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null;
  created_by_info?: {
    id: string;
    full_name: string;
    phone_number: string;
  } | null;
  updated_by_info?: {
    id: string;
    full_name: string;
    phone_number: string;
  } | null;
  cancelled_by_info?: {
    id: string;
    full_name: string;
    phone_number: string;
  } | null;
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
  period_month?: string;
  period_months?: string[];
  third_party_name?: string;
  transaction_date?: string;
  metadata?: Record<string, any>;
  auto_approve?: boolean;
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
  received_by?: string | null;
  received_by_name?: string | null;
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

export interface FinanceStatisticsSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  total_cash_balance: number;
  cash_income: number;
  cash_expense: number;
  cash_net: number;
  card_income: number;
  card_expense: number;
  card_net: number;
  total_student_balance: number;
  total_payments: number;
  payments_count: number;
}

export interface PaymentMethodStat {
  label: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface TransactionTypeStat {
  label: string;
  total: number;
  count: number;
}

export interface CategoryStat {
  category__name: string;
  total: number;
  count: number;
}

export interface RegisterStat {
  id: string;
  name: string;
  balance: number;
  cash_net: number;
  card_net: number;
  location?: string;
}

export interface MonthlyStat {
  month: string;
  income: number;
  expense: number;
}

export interface DailyStat {
  day: string;
  income: number;
  expense: number;
}

export interface FinanceStatistics {
  summary: FinanceStatisticsSummary;
  by_payment_method: Record<string, PaymentMethodStat>;
  registers: RegisterStat[];
  by_transaction_type: Record<string, TransactionTypeStat>;
  top_income_categories: CategoryStat[];
  top_expense_categories: CategoryStat[];
  monthly_stats: MonthlyStat[];
  daily_stats: DailyStat[];
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

export type PaymentMethod = "cash" | "card" | "bank";

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
  card: "Plastik karta",
  bank: "Bank orqali",
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

// ==================== Student Subscription ====================

export interface StudentSubscription {
  id: string;
  student_profile: string;
  student_name: string;
  subscription_plan: string;
  subscription_plan_name: string;
  subscription_plan_price: number;
  period_display: string;
  branch: string;
  branch_name: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  next_payment_date: string;
  total_debt: number;
  last_payment_date: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentSubscriptionRequest {
  student_profile: string;
  subscription_plan: string;
  branch: string;
  start_date: string;
  end_date?: string | null;
  next_payment_date: string;
  notes?: string;
}

export interface UpdateStudentSubscriptionRequest {
  is_active?: boolean;
  end_date?: string | null;
  next_payment_date?: string;
  notes?: string;
}

// ==================== Export System ====================

export type ExportTaskStatus = 
  | "PENDING" 
  | "STARTED" 
  | "SUCCESS" 
  | "FAILURE" 
  | "REVOKED";

export interface ExportFilters {
  // Transactions filters
  transaction_type?: "income" | "expense" | "transfer" | "payment" | "salary" | "refund";
  payment_method?: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE";
  status?: "pending" | "completed" | "cancelled" | "failed";
  date_from?: string;
  date_to?: string;
  cash_register?: string;
  category?: string;
  student_profile?: string;
  employee_membership?: string;
  
  // Payments filters
  period?: string;
  subscription_plan?: string;
  discount?: string;
  
  // Common
  branch_id?: string; // UUID string, sent in both body AND X-Branch-Id header
  search?: string;
  ordering?: string;
}

export interface ExportTaskResponse {
  message: string;
  task_id: string;
  status: ExportTaskStatus;
}

export interface ExportTaskStatusResponse {
  task_id: string;
  status: ExportTaskStatus;
  message: string;
  file_url?: string;
  filename?: string;
  records_count?: number;
  error?: string;
  progress?: number;
}

// ==================== Query Params ====================

export interface BaseQueryParams {
  branch_id?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface TransactionQueryParams extends BaseQueryParams {
  transaction_type?: string;
  payment_method?: string;
  status?: string;
  cash_register?: string;
  category?: string;
  student_profile?: string;
  employee_membership?: string;
  date_from?: string;
  date_to?: string;
  client_filter?: string;
}

export interface PaymentQueryParams extends BaseQueryParams {
  student_profile?: string;
  subscription_plan?: string;
  discount?: string;
  payment_method?: string;
  payment_date_from?: string;
  payment_date_to?: string;
}

// ==================== Revenue Plan ====================

export type RevenuePlanStudentStatus = "paid" | "partial" | "unpaid" | "overdue";

export interface RevenuePlanStudentClass {
  name: string;
  grade_level: number;
}

export interface RevenuePlanStudent {
  student_id: string;
  student_name: string;
  plan_name: string;
  plan_period: string;
  expected: number;
  collected: number;
  debt: number;
  credit: number;
  student_class: RevenuePlanStudentClass | null;
  next_payment_date: string | null;
  status: RevenuePlanStudentStatus;
}

export interface RevenuePlanMonthlyHistory {
  month: string;
  month_label: string;
  collected: number;
  is_current: boolean;
}

export interface RevenuePlanSummary {
  expected: number;
  collected: number;
  uncollected: number;
  collection_rate: number;
  total_debt: number;
  active_subscriptions: number;
}

export interface RevenuePlan {
  month: string;
  month_label: string;
  summary: RevenuePlanSummary;
  students: RevenuePlanStudent[];
  monthly_history: RevenuePlanMonthlyHistory[];
}

// ==================== Paginated Response ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== Billing Run ====================

export type BillingRunStatus = "running" | "completed" | "failed";

export interface BillingRunItem {
  id: string;
  student_name: string;
  student_personal_no: string;
  student_profile_id: string;
  subscription_plan: string;
  status: "charged" | "debt_added" | "skipped" | "error";
  status_display: string;
  charged_amount: number;
  debt_amount: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  created_at: string;
}

export interface StudentBalanceTransaction {
  id: string;
  student_balance: string;
  student_profile_id: string;
  subscription: string | null;
  transaction_type: "credit" | "debit";
  transaction_type_display: string;
  status: "completed" | "failed";
  status_display: string;
  reason: string;
  reason_display: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  reference: string;
  description: string;
  metadata: Record<string, unknown>;
  processed_by: string | null;
  processed_by_phone: string | null;
  occurred_at: string;
  created_at: string;
}

export interface BillingRun {
  id: string;
  branch: string;
  month: string;
  status: BillingRunStatus;
  status_display: string;
  triggered_by: string | null;
  triggered_by_name: string | null;
  total_subscriptions: number;
  charged_count: number;
  charged_amount: number;
  debt_count: number;
  debt_amount: number;
  skipped_count: number;
  error_message: string;
  created_at: string;
  updated_at: string;
  items?: BillingRunItem[];
}

export interface BillingRunTriggerRequest {
  month?: string;
  force?: boolean;
}
