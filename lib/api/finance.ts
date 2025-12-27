import apiClient from "./client"; // Direct client without interceptor
import type { 
  FinanceCategory,
  CreateFinanceCategoryRequest,
  UpdateFinanceCategoryRequest,
  CashRegister, 
  CreateCashRegisterRequest,
  Transaction,
  CreateTransactionRequest,
  StudentBalance,
  SubscriptionPlan,
  CreateSubscriptionPlanRequest,
  Discount,
  CreateDiscountRequest,
  Payment,
  CreatePaymentRequest,
  FinanceStatistics,
  PaginatedResponse 
} from "@/types/finance";

/**
 * Finance API Service
 * Backend: /api/v1/school/finance/
 * Documentation: finance.md
 */

export const financeApi = {
  // ==================== CATEGORIES ====================

  /**
   * Get categories list
   * GET /api/v1/school/finance/categories/
   */
  getCategories: async (params?: {
    type?: "income" | "expense";
    is_active?: boolean;
    is_global?: boolean;
    parent?: string;
    search?: string;
  }): Promise<PaginatedResponse<FinanceCategory>> => {
    const response = await apiClient.get<PaginatedResponse<FinanceCategory>>(
      `/school/finance/categories/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get category detail
   * GET /api/v1/school/finance/categories/{id}/
   */
  getCategory: async (id: string): Promise<FinanceCategory> => {
    const response = await apiClient.get<FinanceCategory>(
      `/school/finance/categories/${id}/`
    );
    return response.data;
  },

  /**
   * Create category
   * POST /api/v1/school/finance/categories/
   */
  createCategory: async (data: CreateFinanceCategoryRequest): Promise<FinanceCategory> => {
    const response = await apiClient.post<FinanceCategory>(
      `/school/finance/categories/`,
      data
    );
    return response.data;
  },

  /**
   * Update category
   * PATCH /api/v1/school/finance/categories/{id}/
   */
  updateCategory: async (id: string, data: UpdateFinanceCategoryRequest): Promise<FinanceCategory> => {
    const response = await apiClient.patch<FinanceCategory>(
      `/school/finance/categories/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Delete category
   * DELETE /api/v1/school/finance/categories/{id}/
   */
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/school/finance/categories/${id}/`);
  },

  // ==================== CASH REGISTERS ====================

  /**
   * Get cash registers list
   * GET /api/v1/school/finance/cash-registers/
   */
  getCashRegisters: async (params?: {
    branch_id?: string;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<CashRegister>> => {
    const response = await apiClient.get<PaginatedResponse<CashRegister>>(
      `/school/finance/cash-registers/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get cash register detail
   * GET /api/v1/school/finance/cash-registers/{id}/
   */
  getCashRegister: async (id: string): Promise<CashRegister> => {
    const response = await apiClient.get<CashRegister>(
      `/school/finance/cash-registers/${id}/`
    );
    return response.data;
  },

  /**
   * Create cash register
   * POST /api/v1/school/finance/cash-registers/
   */
  createCashRegister: async (data: CreateCashRegisterRequest): Promise<CashRegister> => {
    const response = await apiClient.post<CashRegister>(
      `/school/finance/cash-registers/`,
      data
    );
    return response.data;
  },

  /**
   * Update cash register
   * PATCH /api/v1/school/finance/cash-registers/{id}/
   */
  updateCashRegister: async (id: string, data: Partial<CreateCashRegisterRequest>): Promise<CashRegister> => {
    const response = await apiClient.patch<CashRegister>(
      `/school/finance/cash-registers/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Delete cash register
   * DELETE /api/v1/school/finance/cash-registers/{id}/
   */
  deleteCashRegister: async (id: string): Promise<void> => {
    await apiClient.delete(`/school/finance/cash-registers/${id}/`);
  },

  // ==================== TRANSACTIONS ====================

  /**
   * Get transactions list
   * GET /api/v1/school/finance/transactions/
   */
  getTransactions: async (params?: {
    branch_id?: string;
    transaction_type?: string;
    status?: string;
    cash_register?: string;
    category?: string;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<PaginatedResponse<Transaction>>(
      `/school/finance/transactions/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get transaction detail
   * GET /api/v1/school/finance/transactions/{id}/
   */
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(
      `/school/finance/transactions/${id}/`
    );
    return response.data;
  },

  /**
   * Create transaction
   * POST /api/v1/school/finance/transactions/
   */
  createTransaction: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>(
      `/school/finance/transactions/`,
      data
    );
    return response.data;
  },

  // ==================== STUDENT BALANCES ====================

  /**
   * Get student balances list
   * GET /api/v1/school/finance/student-balances/
   */
  getStudentBalances: async (params?: {
    branch_id?: string;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<StudentBalance>> => {
    const response = await apiClient.get<PaginatedResponse<StudentBalance>>(
      `/school/finance/student-balances/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get student balance detail
   * GET /api/v1/school/finance/student-balances/{id}/
   */
  getStudentBalance: async (id: string): Promise<StudentBalance> => {
    const response = await apiClient.get<StudentBalance>(
      `/school/finance/student-balances/${id}/`
    );
    return response.data;
  },

  // ==================== SUBSCRIPTION PLANS ====================

  /**
   * Get subscription plans list
   * GET /api/v1/school/finance/subscription-plans/
   */
  getSubscriptionPlans: async (params?: {
    branch_id?: string;
    is_active?: boolean;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<SubscriptionPlan>> => {
    const response = await apiClient.get<PaginatedResponse<SubscriptionPlan>>(
      `/school/finance/subscription-plans/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get subscription plan detail
   * GET /api/v1/school/finance/subscription-plans/{id}/
   */
  getSubscriptionPlan: async (id: string): Promise<SubscriptionPlan> => {
    const response = await apiClient.get<SubscriptionPlan>(
      `/school/finance/subscription-plans/${id}/`
    );
    return response.data;
  },

  /**
   * Create subscription plan
   * POST /api/v1/school/finance/subscription-plans/
   */
  createSubscriptionPlan: async (data: CreateSubscriptionPlanRequest): Promise<SubscriptionPlan> => {
    const response = await apiClient.post<SubscriptionPlan>(
      `/school/finance/subscription-plans/`,
      data
    );
    return response.data;
  },

  /**
   * Update subscription plan
   * PATCH /api/v1/school/finance/subscription-plans/{id}/
   */
  updateSubscriptionPlan: async (id: string, data: Partial<CreateSubscriptionPlanRequest>): Promise<SubscriptionPlan> => {
    const response = await apiClient.patch<SubscriptionPlan>(
      `/school/finance/subscription-plans/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Delete subscription plan
   * DELETE /api/v1/school/finance/subscription-plans/{id}/
   */
  deleteSubscriptionPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/school/finance/subscription-plans/${id}/`);
  },

  // ==================== DISCOUNTS ====================

  /**
   * Get discounts list
   * GET /api/v1/school/finance/discounts/
   */
  getDiscounts: async (params?: {
    branch_id?: string;
    is_active?: boolean;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Discount>> => {
    const response = await apiClient.get<PaginatedResponse<Discount>>(
      `/school/finance/discounts/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get discount detail
   * GET /api/v1/school/finance/discounts/{id}/
   */
  getDiscount: async (id: string): Promise<Discount> => {
    const response = await apiClient.get<Discount>(
      `/school/finance/discounts/${id}/`
    );
    return response.data;
  },

  /**
   * Create discount
   * POST /api/v1/school/finance/discounts/
   */
  createDiscount: async (data: CreateDiscountRequest): Promise<Discount> => {
    const response = await apiClient.post<Discount>(
      `/school/finance/discounts/`,
      data
    );
    return response.data;
  },

  /**
   * Update discount
   * PATCH /api/v1/school/finance/discounts/{id}/
   */
  updateDiscount: async (id: string, data: Partial<CreateDiscountRequest>): Promise<Discount> => {
    const response = await apiClient.patch<Discount>(
      `/school/finance/discounts/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Delete discount
   * DELETE /api/v1/school/finance/discounts/{id}/
   */
  deleteDiscount: async (id: string): Promise<void> => {
    await apiClient.delete(`/school/finance/discounts/${id}/`);
  },

  // ==================== PAYMENTS ====================

  /**
   * Get payments list
   * GET /api/v1/school/finance/payments/
   */
  getPayments: async (params?: {
    branch_id?: string;
    student_profile?: string;
    period_start?: string;
    period_end?: string;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get<PaginatedResponse<Payment>>(
      `/school/finance/payments/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get payment detail
   * GET /api/v1/school/finance/payments/{id}/
   */
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(
      `/school/finance/payments/${id}/`
    );
    return response.data;
  },

  /**
   * Create payment
   * POST /api/v1/school/finance/payments/
   */
  createPayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/school/finance/payments/`,
      data
    );
    return response.data;
  },

  // ==================== STATISTICS ====================

  /**
   * Get finance statistics
   * GET /api/v1/school/finance/statistics/
   */
  getStatistics: async (params?: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<FinanceStatistics> => {
    const response = await apiClient.get<FinanceStatistics>(
      `/school/finance/statistics/`,
      { params }
    );
    return response.data;
  },
};
