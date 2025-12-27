"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { branchApi, schoolApi } from "@/lib/api";
import type { MembershipDetail, Role, PaginatedResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  DollarSign,
  TrendingUp,
  UserPlus,
  Shield,
  Loader2,
  ChevronRight,
  BadgeCheck,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/translations";
import { toast } from "sonner";
import { getDashboardWidgets, getStudentTerminology } from "@/lib/utils/branchType";
import type { BranchType } from "@/types/auth";

export default function BranchAdminDashboard() {
  const { user, currentBranch } = useAuth();
  const [memberships, setMemberships] = React.useState<MembershipDetail[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Get branch type and terminology
  const branchType = (currentBranch?.branch_type || "school") as BranchType;
  const studentTerm = getStudentTerminology(branchType);
  const widgets = getDashboardWidgets(branchType);
  
  // Helper to check if widget is visible
  const isWidgetVisible = (widgetId: string) => 
    widgets.some(w => w.id === widgetId && w.visible);

  // Fetch branch data
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
    const teachers = membershipsList.filter((m) => m.role === "teacher" || m.effective_role.toLowerCase().includes("teacher"));
    const students = membershipsList.filter((m) => m.role === "student");
    const totalBalance = membershipsList.reduce((sum, m) => sum + (m.balance || 0), 0);
    const totalSalary = membershipsList.reduce((sum, m) => sum + (m.monthly_salary || 0), 0);

    return {
      totalStaff: membershipsList.length - students.length, // Exclude students from staff count
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalRoles: rolesList.length,
      totalBalance,
      totalSalary,
    };
  }, [memberships, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

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
                {branchType === "school" ? "Maktab" : "O'quv Markazi"}
              </Badge>
            </div>
            <p className="text-purple-100 text-lg">
              {currentBranch?.branch_name} filiali boshqaruvi
            </p>
            <p className="text-sm text-purple-100 mt-2">
              {currentBranch?.effective_role || currentBranch?.role}
            </p>
          </div>
          <Building2 className="w-16 h-16 text-purple-200 opacity-50" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Staff Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Xodimlar
            </CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalStaff}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalTeachers} ta o'qituvchi
            </p>
          </CardContent>
        </Card>

        {/* Students Card */}
        {isWidgetVisible("students") && (
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {studentTerm.plural}
              </CardTitle>
              <GraduationCap className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">Aktiv {studentTerm.plural.toLowerCase()}</p>
            </CardContent>
          </Card>
        )}

        {/* Classes/Groups Card - Conditional */}
        {branchType === "school" ? (
          isWidgetVisible("classes") && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Sinflar
                </CardTitle>
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">-</div>
                <p className="text-xs text-gray-500 mt-1">Aktiv sinflar</p>
              </CardContent>
            </Card>
          )
        ) : (
          isWidgetVisible("groups") && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Guruhlar
                </CardTitle>
                <Users className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">-</div>
                <p className="text-xs text-gray-500 mt-1">Aktiv guruhlar</p>
              </CardContent>
            </Card>
          )
        )}

        {/* Finance Card */}
        {isWidgetVisible("finance") && (
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Moliya
              </CardTitle>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalSalary)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Oylik xarajat</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Staff */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Xodimlar</CardTitle>
            <Users className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {!Array.isArray(memberships) || memberships.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Xodimlar ro'yxati bo'sh</p>
              </div>
            ) : (
              <>
                {memberships
                  .filter((m) => m.role !== "student")
                  .slice(0, 5)
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.user_name}</h4>
                          <p className="text-sm text-gray-500">
                            {member.effective_role} • {member.user_phone}
                          </p>
                          {member.monthly_salary && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              Maosh: {formatCurrency(member.monthly_salary)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(member.balance)}
                        </p>
                        <p className="text-xs text-gray-500">Balans</p>
                      </div>
                    </div>
                  ))}
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Barcha xodimlarni ko'rish ({stats.totalStaff})
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Roles */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Rollar</CardTitle>
            <Shield className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {!Array.isArray(roles) || roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Rollar ro'yxati bo'sh</p>
              </div>
            ) : (
              <>
                {roles.slice(0, 5).map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{role.name}</h4>
                        <p className="text-sm text-gray-500">
                          {role.description || "Tavsif yo'q"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Barcha rollarni ko'rish ({stats.totalRoles})
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tez amallar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Add Staff */}
            <Button className="h-auto py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <div className="flex flex-col items-center space-y-2">
                <UserPlus className="w-6 h-6" />
                <span>Xodim qo'shish</span>
              </div>
            </Button>
            
            {/* Add Student */}
            {isWidgetVisible("students") && (
              <Button className="h-auto py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <div className="flex flex-col items-center space-y-2">
                  <GraduationCap className="w-6 h-6" />
                  <span>{studentTerm.singular} qo'shish</span>
                </div>
              </Button>
            )}
            
            {/* Conditional: Classes/Groups or Courses */}
            {branchType === "school" ? (
              isWidgetVisible("classes") && (
                <Button className="h-auto py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <div className="flex flex-col items-center space-y-2">
                    <BookOpen className="w-6 h-6" />
                    <span>Sinf qo'shish</span>
                  </div>
                </Button>
              )
            ) : (
              isWidgetVisible("groups") && (
                <Button className="h-auto py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="w-6 h-6" />
                    <span>Guruh qo'shish</span>
                  </div>
                </Button>
              )
            )}
            
            {/* Finance */}
            {isWidgetVisible("finance") && (
              <Button className="h-auto py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <div className="flex flex-col items-center space-y-2">
                  <DollarSign className="w-6 h-6" />
                  <span>To'lov qilish</span>
                </div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
