/**
 * Finance Types - Cash Register and Transactions
 * Backend API: /api/v1/school/finance/
 */

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

// ==================== Paginated Response ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
