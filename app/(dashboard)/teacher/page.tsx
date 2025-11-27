"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  Award,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/translations";
import type { TeacherClass, TeacherSubject } from "@/types";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { user, currentBranch } = useAuth();
  const [classes, setClasses] = React.useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = React.useState<TeacherSubject[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch teacher data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!currentBranch?.branch_id) return;

      try {
        setLoading(true);
        
        // Fetch teacher's classes and subjects in parallel
        const [classesData, subjectsData] = await Promise.all([
          schoolApi.getTeacherClasses({ branch_id: currentBranch.branch_id, is_active: true }),
          schoolApi.getTeacherSubjects({ branch_id: currentBranch.branch_id, is_active: true }),
        ]);

        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (error: any) {
        console.error("Error fetching teacher data:", error);
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentBranch?.branch_id]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalStudents = classes.reduce((sum, cls) => sum + cls.current_students_count, 0);
    const totalSubjectsCount = subjects.length;
    
    return {
      totalClasses: classes.length,
      totalStudents,
      totalSubjects: totalSubjectsCount,
      upcomingLessons: 3, // TODO: Get from schedule API
      completedLessons: 24, // TODO: Get from schedule API
    };
  }, [classes, subjects]);

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

  const upcomingLessons = [
    {
      id: "1",
      title: "Matematika - 9A",
      time: "09:00 - 10:30",
      room: "301-xona",
      date: "Bugun",
    },
    {
      id: "2",
      title: "Fizika - 10B",
      time: "11:00 - 12:30",
      room: "205-xona",
      date: "Bugun",
    },
    {
      id: "3",
      title: "Matematika - 8C",
      time: "14:00 - 15:30",
      room: "301-xona",
      date: "Ertaga",
    },
  ];

  const recentGroups = [
    {
      id: "1",
      name: "Matematika 9A",
      students: 28,
      attendance: 96,
    },
    {
      id: "2",
      name: "Fizika 10B",
      students: 25,
      attendance: 92,
    },
    {
      id: "3",
      name: "Matematika 8C",
      students: 22,
      attendance: 88,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Xush kelibsiz, {user?.first_name}!
            </h1>
            <p className="text-blue-100 text-lg">
              {currentBranch?.title || currentBranch?.effective_role}
            </p>
            {currentBranch?.salary && (
              <p className="text-sm text-blue-100 mt-2">
                Oylik maosh: <span className="font-semibold">{formatCurrency(currentBranch.salary)}</span>
              </p>
            )}
          </div>
          <Award className="w-16 h-16 text-blue-200 opacity-50" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sinflar
            </CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Aktiv sinflar</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              O'quvchilar
            </CardTitle>
            <Users className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Jami o'quvchilar</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fanlar
            </CardTitle>
            <BookOpen className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalSubjects}</div>
            <p className="text-xs text-gray-500 mt-1">O'qitiladigan fanlar</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bajarilgan
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completedLessons}</div>
            <p className="text-xs text-gray-500 mt-1">Oy davomida</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher's Classes */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Mening sinflarim</CardTitle>
            <Users className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Sizga hali sinf biriktirilmagan</p>
              </div>
            ) : (
              <>
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                        <p className="text-sm text-gray-500">
                          {cls.current_students_count} o'quvchi
                          {cls.subjects_count ? ` • ${cls.subjects_count} fan` : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Barcha sinflarni ko'rish ({classes.length})
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Teacher's Subjects */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Mening fanlarim</CardTitle>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Sizga hali fan biriktirilmagan</p>
              </div>
            ) : (
              <>
                {subjects.slice(0, 5).map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {subject.subject_name}
                          {subject.subject_code && (
                            <span className="text-xs text-gray-500 ml-2">({subject.subject_code})</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {subject.class_name} • {subject.students_count} o'quvchi • {subject.hours_per_week} soat/hafta
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Barcha fanlarni ko'rish ({subjects.length})
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <div className="flex flex-col items-center space-y-2">
                <Plus className="w-6 h-6" />
                <span>Yangi dars</span>
              </div>
            </Button>
            <Button className="h-auto py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <div className="flex flex-col items-center space-y-2">
                <ClipboardList className="w-6 h-6" />
                <span>Davomat qilish</span>
              </div>
            </Button>
            <Button className="h-auto py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <div className="flex flex-col items-center space-y-2">
                <BookOpen className="w-6 h-6" />
                <span>Baho qo'yish</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
