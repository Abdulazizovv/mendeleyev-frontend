"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { roleToPath } from "@/lib/utils/roleMapping";
import { getNavigationItems as getBranchNavigationItems } from "@/lib/utils/branchType";
import type { BranchType } from "@/types/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  GraduationCap,
  ClipboardList,
  DollarSign,
  Menu,
  X,
  Building2,
  Shield,
  FolderTree,
  FileText,
  Award,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  ChevronsUpDown,
  Check,
  Bell,
  ArrowLeft,
  // New icons
  Briefcase,
  Wallet,
  Target,
  BarChart2,
  Key,
  Users2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { translateRole } from "@/lib/translations";
import Link from "next/link";
import { toast } from "sonner";
import type { BranchMembership } from "@/types/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  permission?: string;
  roles?: string[];
}

const iconMap: Record<string, React.ElementType> = {
  "/students/archive": Award,
  "/students/new": Users,
  "/students": GraduationCap,
  "/classes": ClipboardList,
  "/subjects": BookOpen,
  "/teachers": Users,
  "/finance/categories": FolderTree,
  "/finance": Wallet,
  "/groups": Users2,
  "/courses": BookOpen,
  "/staff": Users,
  "/rooms": Building2,
  "/roles": Key,
  "/attendance": ClipboardList,
  "/grades": Award,
  "/homework": FileText,
  "/schedule": Shield,
  "/academic-years": BookOpen,
};

function getIconForRoute(href: string): React.ElementType {
  for (const [key, icon] of Object.entries(iconMap)) {
    if (href.includes(key)) return icon;
  }
  return LayoutDashboard;
}

function getInitials(firstName?: string, lastName?: string): string {
  return ((firstName?.charAt(0) || "") + (lastName?.charAt(0) || "")).toUpperCase() || "U";
}

function getBranchTypeLabel(branchType: string): string {
  return branchType === "school" ? "Maktab" : "O'quv Markazi";
}

// ── Branch Switcher ───────────────────────────────────────────────────────────
function BranchSwitcher({
  currentBranch,
  memberships,
  onSwitch,
  collapsed,
}: {
  currentBranch: BranchMembership;
  memberships: BranchMembership[];
  onSwitch: (branchId: string) => Promise<unknown>;
  collapsed?: boolean;
}) {
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (branchId: string) => {
    if (branchId === currentBranch.branch_id || switching) return;
    const target = memberships.find((m) => m.branch_id === branchId);
    if (!target) return;
    try {
      setSwitching(true);
      await onSwitch(branchId);
      toast.success("Filial muvaffaqiyatli o'zgartirildi");
      const rolePath = roleToPath(target.role, target.branch_type as BranchType);
      window.location.href = `/${rolePath}`;
    } catch {
      toast.error("Filialni o'zgartirishda xatolik");
    } finally {
      setSwitching(false);
    }
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center py-1 cursor-default">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-[18px] h-[18px] text-blue-600" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {currentBranch.branch_name}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (memberships.length <= 1) {
    return (
      <div className="mx-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{currentBranch.branch_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{getBranchTypeLabel(currentBranch.branch_type)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="mx-2.5 w-[calc(100%-20px)] px-3 py-2.5 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors text-left flex items-center gap-2.5"
          disabled={switching}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{currentBranch.branch_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{getBranchTypeLabel(currentBranch.branch_type)}</p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60 mb-1">
        <DropdownMenuLabel className="text-xs text-gray-400 font-normal pb-1">Filial tanlash</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.branch_id}
            onClick={() => handleSwitch(m.branch_id)}
            className="flex items-center gap-2.5 cursor-pointer py-2.5"
          >
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.branch_name}</p>
              <p className="text-xs text-gray-400">{translateRole(m.role)}</p>
            </div>
            {m.branch_id === currentBranch.branch_id && (
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, currentBranch, memberships, logout, isLoading, loadUser, switchBranch, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hover flyout for group items (both collapsed & expanded)
  const [flyout, setFlyout] = useState<{ name: string; top: number; left: number } | null>(null);
  const flyoutTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openFlyout = (name: string, rect: DOMRect) => {
    clearTimeout(flyoutTimerRef.current);
    setFlyout({ name, top: rect.top, left: rect.right + 4 });
  };
  const closeFlyout = () => {
    flyoutTimerRef.current = setTimeout(() => setFlyout(null), 100);
  };
  const keepFlyout = () => clearTimeout(flyoutTimerRef.current);

  useEffect(() => {
    queryClient.invalidateQueries();
  }, [pathname, queryClient]);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userIsSuperAdmin = memberships?.some((m) => m.role === "super_admin") ?? false;

  useEffect(() => {
    if (!isLoading && user) {
      const currentPath = window.location.pathname;
      if (userIsSuperAdmin) {
        if (!currentPath.startsWith("/super-admin") && !currentPath.startsWith("/dashboard")) {
          router.push("/super-admin");
        }
        return;
      }
      if (currentBranch) {
        const branchType = currentBranch.branch_type as BranchType;
        const rolePath = roleToPath(currentBranch.role, branchType);
        if (!currentPath.startsWith(`/${rolePath}`) && !currentPath.startsWith("/dashboard")) {
          router.push(`/${rolePath}`);
        }
      }
    }
  }, [user, currentBranch, isLoading, router, userIsSuperAdmin]);

  const handleLogout = useCallback(async () => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const role = userIsSuperAdmin ? "super_admin" : (currentBranch?.role ?? "branch_admin");
  const branchType = (currentBranch?.branch_type ?? "school") as BranchType;
  const rolePath = currentBranch ? roleToPath(role, branchType) : "";

  const isBranchStaff = ["branch_admin", "admin", "accountant", "manager", "director"].includes(role);

  const navigationItems: NavItem[] = useMemo(() => {
    if (role === "super_admin") {
      return [
        { name: "Dashboard",        href: "/super-admin",            icon: LayoutDashboard },
        { name: "Filiallar",        href: "/super-admin/branches",   icon: Building2 },
        { name: "Foydalanuvchilar", href: "/super-admin/users",      icon: Users },
        { name: "Moliya",           href: "/super-admin/finance",    icon: Wallet },
        { name: "Statistika",       href: "/super-admin/statistics", icon: BarChart2 },
      ];
    }

    if (!currentBranch) return [];

    const baseItems: NavItem[] = [
      { name: "Asosiy", href: `/${rolePath}`, icon: LayoutDashboard },
    ];

    if (isBranchStaff) {
      if (branchType === "school") {
        const schoolNavItems: NavItem[] = [
          { name: "Topshiriqlar", href: "/school/tasks",  icon: CheckSquare },
          { name: "Lidlar",       href: "/school/leads",  icon: Target },
          { name: "Guruh",        href: "/school/groups", icon: Users2, permission: "groups.view" },
          {
            name: "O'quvchilar",
            icon: GraduationCap,
            permission: "students.view",
            children: [
              { name: "Barcha o'quvchilar", href: "/school/students",         icon: GraduationCap },
              { name: "Yangi o'quvchilar",  href: "/school/students/new",     icon: Users },
              { name: "Arxiv",              href: "/school/students/archive", icon: Award },
            ],
          },
          {
            name: "Boshqaruv",
            icon: Briefcase,
            permission: "staff.view",
            children: [
              { name: "Xodimlar",   href: "/school/staff",           icon: Users },
              { name: "Rollar",     href: "/school/roles",           icon: Key },
              { name: "Sinflar",    href: "/school/classes",         icon: ClipboardList },
              { name: "Fanlar",     href: "/school/subjects",        icon: BookOpen },
              { name: "O'quv yili", href: "/school/academic-years",  icon: Calendar },
            ],
          },
          { name: "Nazorat",    href: "/school/schedule", icon: Shield,   permission: "attendance.view" },
          {
            name: "Moliya",
            icon: Wallet,
            permission: "finance.view",
            children: [
              { name: "Kassalar",                   href: "/school/finance/cash-registers",    icon: Wallet },
              { name: "Abonementlar & Chegirmalar",  href: "/school/finance/subscription-plans", icon: FileText },
              { name: "Tranzaksiya turlari",         href: "/school/finance/transaction-types", icon: ClipboardList },
              { name: "Hisobotlar",                  href: "/school/finance/statistics",        icon: BarChart2 },
            ],
          },
          { name: "Hisobotlar", href: "/school/reports",   icon: BarChart2, permission: "reports.view" },
          { name: "Sozlamalar", href: "/school/settings",  icon: Settings },
        ];

        return schoolNavItems.reduce<NavItem[]>((acc, item) => {
          if (item.roles && !item.roles.includes(role)) return acc;
          if (item.permission) {
            const [mod, action] = item.permission.split(".");
            if (!hasPermission(mod, action)) return acc;
          }
          if (item.children) {
            const visible = item.children.filter((c) => {
              if (c.roles && !c.roles.includes(role)) return false;
              if (!c.permission) return true;
              const [m, a] = c.permission.split(".");
              return hasPermission(m, a);
            });
            if (visible.length === 0) return acc;
            acc.push({ ...item, children: visible });
          } else {
            acc.push(item);
          }
          return acc;
        }, []);
      }

      const branchItems = getBranchNavigationItems(branchType);
      return [
        ...baseItems,
        ...branchItems.map((item) => ({
          name: item.name,
          href: item.href,
          icon: getIconForRoute(item.href ?? item.name),
          children: item.children?.map((child) => ({
            name: child.name,
            href: child.href,
            icon: getIconForRoute(child.href ?? child.name),
          })),
        })),
        { name: "Sozlamalar", href: `/${rolePath}/settings`, icon: Settings },
      ];
    }

    if (role === "teacher") {
      return [
        ...baseItems,
        { name: "Guruhlar",      href: `/${rolePath}/groups`,    icon: Users2 },
        { name: "Darslar",       href: `/${rolePath}/lessons`,   icon: BookOpen },
        { name: "Jadval",        href: `/${rolePath}/schedule`,  icon: Calendar },
        { name: "Davomat",       href: `/${rolePath}/attendance`,icon: ClipboardList },
        { name: "Baholar",       href: `/${rolePath}/grades`,    icon: Award },
        { name: "Uyga vazifalar",href: `/${rolePath}/homework`,  icon: FileText },
      ];
    }

    if (role === "student") {
      return [
        ...baseItems,
        { name: "Darslarim",     href: `/${rolePath}/lessons`,   icon: BookOpen },
        { name: "Jadval",        href: `/${rolePath}/schedule`,  icon: Calendar },
        { name: "Baholar",       href: `/${rolePath}/grades`,    icon: GraduationCap },
        { name: "Uyga vazifalar",href: `/${rolePath}/homework`,  icon: CheckSquare },
        { name: "Davomat",       href: `/${rolePath}/attendance`,icon: ClipboardList },
        { name: "To'lovlar",     href: `/${rolePath}/payments`,  icon: Wallet },
      ];
    }

    return baseItems;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, branchType, rolePath, currentBranch, isBranchStaff, hasPermission]);


  const currentPageName = useMemo(() => {
    const allItems: NavItem[] = [];
    navigationItems.forEach((item) => {
      allItems.push(item);
      item.children?.forEach((child) => allItems.push(child));
    });
    const matched = allItems.find((item) => {
      const href = item.href;
      if (!href) return false;
      if (pathname === href) return true;
      if (href === `/${rolePath}`) return false;
      return (
        pathname.startsWith(href) &&
        !allItems.some(
          (other) =>
            other.href &&
            other.href !== href &&
            pathname.startsWith(other.href) &&
            other.href.length > href.length
        )
      );
    });
    return matched?.name ?? "Dashboard";
  }, [navigationItems, pathname, rolePath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (!userIsSuperAdmin && !currentBranch) return null;

  // The hovered group's data for the flyout panel
  const flyoutGroup = flyout
    ? navigationItems.find((i) => i.name === flyout.name && !!i.children?.length)
    : null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-200 ease-in-out
            ${sidebarCollapsed ? "lg:w-16" : "lg:w-64"}
            ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0"}`}
        >
          {/* Logo row */}
          <div className={`flex items-center border-b border-gray-100 h-16 relative ${sidebarCollapsed ? "justify-center px-0" : "px-4"}`}>
            {sidebarCollapsed ? (
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 leading-tight">Mendeleyev</p>
                  <p className="text-xs text-gray-400 leading-tight">{translateRole(role)}</p>
                </div>
              </div>
            )}
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors z-10"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
            {/* Mobile close */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
            {navigationItems.map((item) => {
              const hasChildren = !!item.children?.length;

              // ── GROUP ITEM — hover flyout (both collapsed & expanded) ──
              if (hasChildren) {
                const isGroupActive = item.children!.some(
                  (child) => child.href && pathname.startsWith(child.href)
                );
                const isFlyoutOpen = flyout?.name === item.name;

                if (sidebarCollapsed) {
                  return (
                    <button
                      key={item.name}
                      onMouseEnter={(e) => openFlyout(item.name, e.currentTarget.getBoundingClientRect())}
                      onMouseLeave={closeFlyout}
                      className={`w-full flex items-center justify-center py-3 rounded-xl transition-colors ${
                        isGroupActive || isFlyoutOpen
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  );
                }

                // Expanded: show name + chevron, open flyout on hover
                return (
                  <button
                    key={item.name}
                    onMouseEnter={(e) => openFlyout(item.name, e.currentTarget.getBoundingClientRect())}
                    onMouseLeave={closeFlyout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isGroupActive || isFlyoutOpen
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] shrink-0 ${isGroupActive || isFlyoutOpen ? "text-blue-500" : "text-gray-400"}`} />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isGroupActive || isFlyoutOpen ? "text-blue-400" : "text-gray-300"}`} />
                  </button>
                );
              }

              // ── FLAT ITEM ───────────────────────────────────────────────
              if (!item.href) return null;
              const itemHref = item.href;
              const isActive =
                itemHref === `/${rolePath}`
                  ? pathname === itemHref
                  : pathname === itemHref ||
                    (pathname.startsWith(itemHref) &&
                      !navigationItems.some(
                        (other) =>
                          other.href &&
                          other.href !== itemHref &&
                          pathname.startsWith(other.href) &&
                          other.href.length > itemHref.length
                      ));

              // COLLAPSED: icon + tooltip
              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-center py-3 rounded-xl transition-all ${
                          isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // EXPANDED: icon + label
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="border-t border-gray-100 py-2.5 space-y-1">
            {!userIsSuperAdmin && currentBranch && (
              <BranchSwitcher
                currentBranch={currentBranch}
                memberships={memberships ?? []}
                onSwitch={switchBranch}
                collapsed={sidebarCollapsed}
              />
            )}
            <div className={`px-2.5 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
              {sidebarCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center w-full py-3 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-[18px] h-[18px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">Chiqish</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="w-[18px] h-[18px] shrink-0" />
                  <span>Chiqish</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Hover flyout panel (group children) ── */}
        {flyoutGroup && flyout && (
          <div
            className="fixed z-[60] bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-52"
            style={{ top: flyout.top, left: flyout.left }}
            onMouseEnter={keepFlyout}
            onMouseLeave={closeFlyout}
          >
            <p className="px-4 pt-1 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
              {flyoutGroup.name}
            </p>
            {flyoutGroup.children!.map((child) => {
              if (!child.href) return null;
              const allChildHrefs = flyoutGroup.children!.map((c) => c.href).filter(Boolean) as string[];
              const isChildActive =
                pathname === child.href ||
                (pathname.startsWith(child.href) &&
                  !allChildHrefs.some(
                    (other) => other !== child.href && pathname.startsWith(other) && other.length > child.href!.length
                  ));
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => { setFlyout(null); setSidebarOpen(false); }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isChildActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <child.icon className={`w-4 h-4 shrink-0 ${isChildActive ? "text-blue-500" : "text-gray-400"}`} />
                  <span className="flex-1">{child.name}</span>
                  {isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Main content ── */}
        <div className={`flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100">
                <Menu className="w-5 h-5" />
              </button>

              {/* Back button */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Orqaga</span>
              </button>

              <div className="w-px h-5 bg-gray-200 hidden sm:block" />

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm text-gray-400 hidden md:block truncate">
                  {userIsSuperAdmin ? "Super Admin" : currentBranch?.branch_name}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden md:block shrink-0" />
                <span className="text-sm font-semibold text-gray-800 truncate">{currentPageName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 relative">
                <Bell className="w-5 h-5" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-400 leading-tight">{translateRole(role)}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 hidden md:block rotate-90" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal py-2.5">
                    <p className="text-sm font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.phone_number}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!userIsSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href={`/${rolePath}/settings`} className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2 text-gray-400" />
                        Sozlamalar
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
