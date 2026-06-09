"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Landmark,
  Package,
  BadgePercent,
  LayoutList,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Kassalar", href: "/school/finance/cash-registers", icon: Landmark },
  { label: "Abonementlar", href: "/school/finance/subscription-plans", icon: Package },
  { label: "Chegirmalar", href: "/school/finance/discounts", icon: BadgePercent },
  { label: "Tranzaksiya turlari", href: "/school/finance/transaction-types", icon: LayoutList },
  { label: "Hisobotlar", href: "/school/finance/statistics", icon: BarChart3 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/school/finance") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="bg-white border-b shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto scrollbar-hide -mb-px">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0",
                    active
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
