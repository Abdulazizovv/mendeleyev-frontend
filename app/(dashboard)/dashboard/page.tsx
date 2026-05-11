"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { roleToPath } from "@/lib/utils/roleMapping";
import type { BranchType } from "@/types/auth";

/**
 * /dashboard — faqat redirect sahifasi.
 * Foydalanuvchi roli va filial turiga qarab to'g'ri yo'lga yo'naltiradi.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentBranch } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (currentBranch) {
      const rolePath = roleToPath(currentBranch.role, currentBranch.branch_type as BranchType);
      router.replace(`/${rolePath}`);
    }
  }, [isAuthenticated, isLoading, currentBranch, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Yo'naltirilmoqda...</p>
      </div>
    </div>
  );
}
