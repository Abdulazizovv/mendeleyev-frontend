import { useQuery } from "@tanstack/react-query";
import { schoolApi, financeApi } from "@/lib/api";
import type { DashboardStatistics, TodaysLesson } from "@/types";
import type { PaginatedResponse } from "@/types/api";

/**
 * Dashboard statistics query keys
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  statistics: (branchType: "school" | "training_center") =>
    [...dashboardKeys.all, "statistics", branchType] as const,
  todaysLessons: (branchId: string) =>
    [...dashboardKeys.all, "todaysLessons", branchId] as const,
};

/**
 * Filialdagi dashboard statistikasini olish
 */
export const useDashboardStatistics = (branchType?: "school" | "training_center") => {
  return useQuery({
    queryKey: dashboardKeys.statistics(branchType || "school"),
    queryFn: () => schoolApi.getDashboardStatistics(branchType || "school"),
    enabled: !!branchType,
  });
};

/**
 * Bugungi darslarni olish
 */
export const useTodaysLessons = (branchId?: string) => {
  return useQuery<PaginatedResponse<TodaysLesson>>({
    queryKey: dashboardKeys.todaysLessons(branchId || ""),
    queryFn: () => schoolApi.getTodaysLessons(branchId!),
    enabled: !!branchId,
  });
};

function currentMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

/**
 * Dashboard uchun shu oyning moliya statistikasi
 */
export const useDashboardFinanceStats = (branchId?: string) => {
  const monthStart = currentMonthStart();
  return useQuery({
    queryKey: ["dashboard", "finance-stats", branchId, monthStart],
    queryFn: () => financeApi.getStatistics({ branch_id: branchId, start_date: monthStart }),
    enabled: !!branchId,
  });
};

/**
 * Dashboard uchun so'nggi operatsiyalar (shu oy)
 */
export const useDashboardRecentTransactions = (branchId?: string) => {
  const monthStart = currentMonthStart();
  return useQuery({
    queryKey: ["dashboard", "recent-transactions", branchId, monthStart],
    queryFn: () =>
      financeApi.getTransactions({
        branch_id: branchId,
        date_from: monthStart,
        ordering: "-transaction_date",
        page_size: 5,
      }),
    enabled: !!branchId,
  });
};
