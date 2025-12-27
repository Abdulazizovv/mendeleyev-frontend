"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { schoolApi, financeApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit } from "lucide-react";

// Import components
import { StudentBalanceCard } from "@/components/school/students/detail/StudentBalanceCard";
import { StudentInfoCard } from "@/components/school/students/detail/StudentInfoCard";
import { RecentPaymentsCard } from "@/components/school/students/detail/RecentPaymentsCard";
import { RecentTransactionsCard } from "@/components/school/students/detail/RecentTransactionsCard";
import { AdditionalInfoCard } from "@/components/school/students/detail/AdditionalInfoCard";
import { ClassInfoCard } from "@/components/school/students/detail/ClassInfoCard";
import { RelativesCard } from "@/components/school/students/detail/RelativesCard";
import { SubscriptionsCard } from "@/components/school/students/detail/SubscriptionsCard";
import { PaymentDueCard } from "@/components/school/students/detail/PaymentDueCard";
import { QuickActionsCard } from "@/components/school/students/detail/QuickActionsCard";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const studentId = params.id as string;

  // Fetch student data
  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => schoolApi.getStudent(branchId!, studentId),
    enabled: !!branchId,
  });

  // Use balance from student detail API (already included in response)
  const balance = student?.balance;

  // Use payments_summary from balance (API student_profile filter not working properly)
  const recentPayments = student?.balance?.payments_summary?.last_payment 
    ? [student.balance.payments_summary.last_payment]
    : [];

  // Use recent_transactions from student detail API (v2.2.0)
  const transactions = student?.recent_transactions || [];

  // Fetch relatives
  const { data: relatives = [] } = useQuery({
    queryKey: ["student-relatives", studentId],
    queryFn: () => schoolApi.getStudentRelatives(studentId),
    enabled: !!studentId,
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-300",
      archived: "bg-gray-100 text-gray-800 border-gray-300",
      suspended: "bg-red-100 text-red-800 border-red-300",
    };
    const labels: Record<string, string> = {
      active: "Aktiv",
      archived: "Arxivlangan",
      suspended: "To'xtatilgan",
    };
    return (
      <Badge className={variants[status] || variants.active}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getBalanceBg = (amount: number) => {
    if (amount > 0) return "bg-green-50 border-green-200";
    if (amount < 0) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Not found state
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          O&apos;quvchi topilmadi
        </h2>
        <Button onClick={() => router.push("/branch-admin/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Orqaga
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/branch-admin/students")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {student.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={student.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{student.first_name.charAt(0)}{student.last_name?.charAt(0) || ''}</span>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {student.first_name} {student.middle_name} {student.last_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Shaxsiy raqam: {student.personal_number}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/branch-admin/students/${studentId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Tahrirlash
            </Button>
            {getStatusBadge(student.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <StudentBalanceCard
              balance={balance}
              studentId={studentId}
              formatCurrency={formatCurrency}
              getBalanceColor={getBalanceColor}
              getBalanceBg={getBalanceBg}
            />

            {/* Student Info */}
            <StudentInfoCard student={student} formatDate={formatDate} />

            {/* Recent Payments - Show if available */}
            {recentPayments.length > 0 && (
              <RecentPaymentsCard
                payments={recentPayments}
                studentId={studentId}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            )}

            {/* Recent Transactions */}
            <RecentTransactionsCard
              transactions={transactions}
              studentId={studentId}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />

            {/* Class Info */}
            <ClassInfoCard classInfo={(student as any).class_info} />

            {/* Additional Info */}
            <AdditionalInfoCard student={student} formatDate={formatDate} />

            {/* Relatives */}
            <RelativesCard relatives={relatives} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Subscriptions */}
            <SubscriptionsCard
              subscriptions={student.subscriptions || []}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />

            {/* Payment Due */}
            <PaymentDueCard
              paymentDue={student.payment_due}
              studentId={studentId}
              formatCurrency={formatCurrency}
            />

            {/* Quick Actions */}
            <QuickActionsCard studentId={studentId} />
          </div>
        </div>
      </div>
    </div>
  );
}
