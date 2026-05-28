"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Package,
  BarChart3,
  BadgePercent,
  Settings2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const operations = [
  { label: "Umumiy", href: "/school/finance", exact: true, icon: LayoutDashboard },
  { label: "Tranzaksiyalar", href: "/school/finance/transactions", icon: Receipt },
  { label: "To'lovlar", href: "/school/finance/payments", icon: CreditCard },
  { label: "Balanslar", href: "/school/finance/student-balances", icon: Users },
];

const settingsItems = [
  { label: "Kassalar", href: "/school/finance/cash-registers", icon: Building2 },
  { label: "Abonement tariflari", href: "/school/finance/subscription-plans", icon: Package },
  { label: "Kategoriyalar", href: "/school/finance/categories", icon: BarChart3 },
  { label: "Chegirmalar", href: "/school/finance/discounts", icon: BadgePercent },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/school/finance") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const settingsActive = settingsItems.some((s) => isActive(pathname, s.href));

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto scrollbar-hide -mb-px">
            {operations.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0",
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

            <div className="h-4 w-px bg-gray-200 mx-1 shrink-0 self-center" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 outline-none",
                    settingsActive
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  )}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Sozlamalar
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {settingsItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer",
                          active && "text-blue-700 bg-blue-50 font-medium"
                        )}
                      >
                        <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
