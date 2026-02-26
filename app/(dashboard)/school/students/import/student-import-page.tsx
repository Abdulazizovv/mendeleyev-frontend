"use client";

import { useAuth } from "@/lib/hooks";
import { StudentImportForm } from "@/components/school/students/import";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function StudentImportPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();

  // Check permissions
  const canImport = currentBranch?.role === "super_admin" || currentBranch?.role === "branch_admin";

  if (!currentBranch) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Xatolik</AlertTitle>
          <AlertDescription>
            Filial tanlanmagan. Iltimos, avval filialni tanlang.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!canImport) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ruxsat yo&apos;q</AlertTitle>
          <AlertDescription>
            Sizda o&apos;quvchilarni import qilish huquqi yo&apos;q. Faqat super_admin va branch_admin
            import qilishi mumkin.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/school/students")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga qaytish
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/school/students")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Upload className="h-8 w-8" />
              O&apos;quvchilarni import qilish
            </h1>
            <p className="text-muted-foreground mt-1">
              Excel fayl orqali bir necha o&apos;quvchini bir vaqtda qo&apos;shing
            </p>
          </div>
        </div>
      </div>

      {/* Import Form */}
      <StudentImportForm branchId={currentBranch.branch_id} />
    </div>
  );
}
