import { useQuery } from "@tanstack/react-query";
import { schoolApi } from "@/lib/api";
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
