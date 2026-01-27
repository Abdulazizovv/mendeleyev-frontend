"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { BranchType } from "@/types/auth";

/**
 * Branch Admin Redirect Layout
 * Redirects /branch-admin/* to /school/* or /training-center/* based on branch type
 */
export default function BranchAdminRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentBranch, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && currentBranch) {
      const branchType = currentBranch.branch_type as BranchType;
      const newPath = branchType === "center" ? "/training-center" : "/school";
      
      // Get current path and replace branch-admin with new path
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/branch-admin")) {
        const restOfPath = currentPath.replace("/branch-admin", "");
        router.replace(`${newPath}${restOfPath}`);
      }
    }
  }, [isLoading, currentBranch, router]);

  return <>{children}</>;
}
