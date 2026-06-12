"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

const ROUTE_PERMISSIONS: Array<{ prefix: string; module: string; action: string }> = [
  { prefix: "/school/students",        module: "students",   action: "view" },
  { prefix: "/school/groups",          module: "students",   action: "view" },
  { prefix: "/school/staff",           module: "staff",      action: "view" },
  { prefix: "/school/roles",           module: "staff",      action: "view" },
  { prefix: "/school/classes",         module: "classes",    action: "view" },
  { prefix: "/school/subjects",        module: "classes",    action: "view" },
  { prefix: "/school/academic-years",  module: "classes",    action: "view" },
  { prefix: "/school/schedule",        module: "schedule",   action: "view" },
  { prefix: "/school/finance",         module: "finance",    action: "view" },
  { prefix: "/school/reports",         module: "reports",    action: "view" },
  { prefix: "/school/settings",        module: "settings",   action: "view" },
];

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, currentBranch, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !currentBranch) return;

    const matched = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
    if (!matched) return;

    if (!hasPermission(matched.module, matched.action)) {
      router.replace("/school");
    }
  }, [pathname, isLoading, currentBranch, hasPermission, router]);

  return <>{children}</>;
}
