"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { branchApi } from "@/lib/api";
import { useDashboardStatistics, useTodaysLessons } from "@/lib/hooks/dashboard";
import { DashboardStatisticsCards } from "@/components/dashboard/DashboardStatisticsCards";
import { TodaysLessonsList } from "@/components/dashboard/TodaysLessonsList";
import type { MembershipDetail, Role } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  DollarSign,
  UserPlus,
  Shield,
  Loader2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, translateRole } from "@/lib/translations";
import { toast } from "sonner";
import { getDashboardWidgets, getStudentTerminology } from "@/lib/utils/branchType";
import type { BranchType } from "@/types/auth";

export default function BranchAdminDashboard() {
  const { user, currentBranch, refreshUserData, getCacheStatus } = useAuth();
  const [memberships, setMemberships] = React.useState<MembershipDetail[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Get branch type and terminology
  const branchTypeRaw = (currentBranch?.branch_type || "school") as BranchType;
  const branchTypeApi = branchTypeRaw === "center" ? "training_center" : branchTypeRaw;
  const studentTerm = getStudentTerminology(branchTypeRaw);
  const widgets = getDashboardWidgets(branchTypeRaw);
  
  // Helper to check if widget is visible
  const isWidgetVisible = (widgetId: string) => 
    widgets.some(w => w.id === widgetId && w.visible);

  // Fetch dashboard statistics
  const {
    data: dashboardStats,
    isLoading: statsLoading,
  } = useDashboardStatistics(branchTypeApi);

  // Fetch today's lessons
  const {
    data: todaysLessonsData,
    isLoading: lessonsLoading,
  } = useTodaysLessons(currentBranch?.branch_id);

  // Fetch branch data (memberships and roles)
  React.useEffect(() => {
    const fetchData = async () => {
      if (!currentBranch?.branch_id) return;

      try {
        setLoading(true);

        // Fetch memberships and roles in parallel
        const [membershipsResponse, rolesData] = await Promise.all([
          branchApi.getMemberships(currentBranch.branch_id, { page_size: 1000 }),
          branchApi.getRoles(currentBranch.branch_id),
        ]);

        setMemberships(membershipsResponse.results);
        setRoles(rolesData);
      } catch (error: any) {
        console.error("Error fetching branch data:", error);
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentBranch?.branch_id]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    // Ensure memberships and roles are arrays
    const membershipsList = Array.isArray(memberships) ? memberships : [];
    const rolesList = Array.isArray(roles) ? roles : [];
    const teachers = membershipsList.filter((m) => m.role === "teacher" || m.effective_role?.toLowerCase().includes("teacher"));
    const students = membershipsList.filter((m) => m.role === "student");
    const totalBalance = membershipsList.reduce((sum, m) => sum + (m.balance || 0), 0);
    const totalSalary = membershipsList.reduce((sum, m) => sum + (m.monthly_salary || 0), 0);

    return {
      totalStaff: membershipsList.length - students.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalRoles: rolesList.length,
      totalBalance,
      totalSalary,
    };
  }, [memberships, roles]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUserData();
      toast.success("Ma'lumotlar yangilandi");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Ma'lumotlarni yangilashda xatolik");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && statsLoading && lessonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const todaysLessons = todaysLessonsData?.results || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                Xush kelibsiz, {user?.first_name}!
              </h1>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {branchTypeRaw === "school" ? "Maktab" : "O'quv Markazi"}
              </Badge>
            </div>
            <p className="text-purple-100 text-lg">
              {currentBranch?.branch_name} filiali boshqaruvi
            </p>
            <p className="text-sm text-purple-100 mt-2">
              {translateRole(currentBranch?.effective_role || currentBranch?.role)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Building2 className="w-16 h-16 text-purple-200 opacity-50" />
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Yangilanmoqda..." : "Yangilash"}
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <DashboardStatisticsCards
        statistics={dashboardStats}
        isLoading={statsLoading}
        branchType={branchTypeApi}
      />

      {/* Today's Lessons */}
      <TodaysLessonsList
        lessons={todaysLessons}
        isLoading={lessonsLoading}
      />


    </div>
  );
}
