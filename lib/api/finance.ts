import apiClient from "./client";
import type { CashRegister, PaginatedResponse } from "@/types/finance";

/**
 * Finance API Service
 * Backend: /api/v1/school/finance/
 * Documentation: finance.md
 */

export const financeApi = {
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
};
