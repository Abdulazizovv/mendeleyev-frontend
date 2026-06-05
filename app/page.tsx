"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { roleToPath } from "@/lib/utils/roleMapping";
import type { BranchType } from "@/types/auth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentBranch, loadUser } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (currentBranch) {
      const rolePath = roleToPath(currentBranch.role, currentBranch.branch_type as BranchType);
      router.replace(`/${rolePath}`);
      return;
    }
    // Authenticated but no branch data — fetch from API
    loadUser();
  }, [isAuthenticated, isLoading, currentBranch, router, loadUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
