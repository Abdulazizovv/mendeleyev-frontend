"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Target,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/translations";

export default function StudentDashboard() {
  const { user, currentBranch } = useAuth();

  // Mock data - keyinchalik real API dan keladi
  const stats = {
    totalCourses: 6,
    completedAssignments: 18,
    upcomingClasses: 4,
    averageGrade: 4.5,
  };

  const upcomingClasses = [
    {
      id: "1",
      subject: "Matematika",
      teacher: "Abbos Karimov",
      time: "09:00 - 10:30",
      room: "301-xona",
      date: "Bugun",
    },
    {
      id: "2",
      subject: "Fizika",
      teacher: "Malika Rashidova",
      time: "11:00 - 12:30",
      room: "205-xona",
      date: "Bugun",
    },
    {
      id: "3",
      subject: "Ingliz tili",
      teacher: "John Smith",
      time: "14:00 - 15:30",
      room: "105-xona",
      date: "Ertaga",
    },
  ];

  const subjects = [
    {
      id: "1",
      name: "Matematika",
      grade: 4.8,
      progress: 85,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "2",
      name: "Fizika",
      grade: 4.5,
      progress: 78,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "3",
      name: "Ingliz tili",
      grade: 4.2,
      progress: 72,
      color: "from-green-500 to-green-600",
    },
    {
      id: "4",
      name: "Kimyo",
      grade: 4.6,
      progress: 80,
      color: "from-orange-500 to-orange-600",
    },
  ];

  const recentAssignments = [
    {
      id: "1",
      title: "Kvadrat tenglamalar",
      subject: "Matematika",
      deadline: "2 kun qoldi",
      status: "pending",
    },
    {
      id: "2",
      title: "Newton qonunlari",
      subject: "Fizika",
      deadline: "Bajarildi",
      status: "completed",
    },
    {
      id: "3",
      title: "Past Simple tense",
      subject: "Ingliz tili",
      deadline: "1 hafta qoldi",
      status: "pending",
    },
  ];

  const payments = {
    totalPaid: 15000000,
    totalDebt: 5000000,
    nextPaymentDate: "15 Dekabr",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Salom, {user?.first_name}!
            </h1>
            <p className="text-purple-100 text-lg">
              {currentBranch?.title || "O'quvchi"}
            </p>
            <div className="mt-4 flex items-center space-x-6">
              <div>
                <p className="text-sm text-purple-100">O'rtacha baho</p>
                <p className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-purple-100">Bajarilgan topshiriqlar</p>
                <p className="text-2xl font-bold">{stats.completedAssignments}</p>
              </div>
            </div>
          </div>
          <Award className="w-16 h-16 text-purple-200 opacity-50" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fanlar
            </CardTitle>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">Aktiv fanlar</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Topshiriqlar
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completedAssignments}</div>
            <p className="text-xs text-gray-500 mt-1">Bajarilgan</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Yaqin darslar
            </CardTitle>
            <Clock className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.upcomingClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Kelasi 24 soatda</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              O'rtacha
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.averageGrade.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">Umumiy baho</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Yaqin darslar</CardTitle>
            <Calendar className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{lesson.subject}</h4>
                    <p className="text-sm text-gray-500">
                      {lesson.teacher} • {lesson.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {lesson.date}
                  </span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              To'liq jadval
            </Button>
          </CardContent>
        </Card>

        {/* Subject Progress */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Fanlar bo'yicha</CardTitle>
            <Target className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {subject.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {subject.grade.toFixed(1)}
                  </span>
                </div>
                <Progress value={subject.progress} className="h-2" />
                <p className="text-xs text-gray-500">{subject.progress}% bajarildi</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Topshiriqlar</CardTitle>
            <CheckCircle className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      assignment.status === "completed"
                        ? "bg-green-100"
                        : "bg-orange-100"
                    }`}
                  >
                    {assignment.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                    <p className="text-sm text-gray-500">{assignment.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      assignment.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {assignment.deadline}
                  </span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Barcha topshiriqlar
            </Button>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">To'lovlar</CardTitle>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">To'langan</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(payments.totalPaid)}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Qoldiq</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatCurrency(payments.totalDebt)}
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Keyingi to'lov</p>
                <p className="text-lg font-semibold text-gray-900">
                  {payments.nextPaymentDate}
                </p>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <DollarSign className="w-4 h-4 mr-2" />
              To'lov qilish
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
