"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Check,
  Bell,
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
import { translateRole } from "@/lib/translations";
import Link from "next/link";
import { toast } from "sonner";
import type { BranchMembership } from "@/types/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Nav item type
interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const iconMap: Record<string, React.ElementType> = {
  "/students/archive": Award,
  "/students/new": Users,
  "/students": GraduationCap,
  "/classes": ClipboardList,
  "/subjects": BookOpen,
  "/teachers": Users,
  "/finance/categories": FolderTree,
  "/finance": DollarSign,
  "/groups": Users,
  "/courses": BookOpen,
  "/staff": Users,
  "/rooms": Building2,
  "/roles": Shield,
  "/attendance": ClipboardList,
  "/grades": Award,
  "/homework": FileText,
  "/schedule": Calendar,
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

// Branch Switcher Component
function BranchSwitcher({
  currentBranch,
  memberships,
  onSwitch,
}: {
  currentBranch: BranchMembership;
  memberships: BranchMembership[];
  onSwitch: (branchId: string) => Promise<unknown>;
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
      // Compute the correct dashboard path for the new branch
      const rolePath = roleToPath(target.role, target.branch_type as BranchType);
      window.location.href = `/${rolePath}`;
    } catch {
      toast.error("Filialni o'zgartirishda xatolik");
    } finally {
      setSwitching(false);
    }
  };

  if (memberships.length <= 1) {
    return (
      <div className="px-3 py-3 mx-2 mb-1 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{currentBranch.branch_name}</p>
            <p className="text-[10px] text-gray-500">{getBranchTypeLabel(currentBranch.branch_type)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full mx-2 px-3 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors text-left flex items-center gap-2.5 group"
          disabled={switching}
          style={{ width: "calc(100% - 16px)" }}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{currentBranch.branch_name}</p>
            <p className="text-[10px] text-gray-500">{getBranchTypeLabel(currentBranch.branch_type)}</p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60 mb-1">
        <DropdownMenuLabel className="text-xs text-gray-500">Filial tanlash</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.branch_id}
            onClick={() => handleSwitch(m.branch_id)}
            className="flex items-center gap-2.5 cursor-pointer py-2.5"
          >
            <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.branch_name}</p>
              <p className="text-xs text-gray-500">
                {getBranchTypeLabel(m.branch_type)} · {translateRole(m.role)}
              </p>
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, currentBranch, memberships, logout, isLoading, loadUser, switchBranch } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    queryClient.invalidateQueries();
  }, [pathname, queryClient]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && !isLoading) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading && user && currentBranch) {
      const currentPath = window.location.pathname;
      const role = currentBranch.role;
      const branchType = currentBranch.branch_type as BranchType;
      const rolePath = roleToPath(role, branchType);
      if (!currentPath.startsWith(`/${rolePath}`) && !currentPath.startsWith("/dashboard")) {
        router.push(`/${rolePath}`);
      }
    }
  }, [user, currentBranch, isLoading, router]);

  const handleLogout = useCallback(async () => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const role = currentBranch?.role ?? "branch_admin";
  const branchType = (currentBranch?.branch_type ?? "school") as BranchType;
  const rolePath = currentBranch ? roleToPath(role, branchType) : "";

  const navigationItems: NavItem[] = useMemo(() => {
    if (!currentBranch) return [];

    const baseItems: NavItem[] = [
      { name: "Asosiy", href: `/${rolePath}`, icon: LayoutDashboard },
    ];

    if (role === "branch_admin") {
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
        { name: "Guruhlar", href: `/${rolePath}/groups`, icon: Users },
        { name: "Darslar", href: `/${rolePath}/lessons`, icon: BookOpen },
        { name: "Jadval", href: `/${rolePath}/schedule`, icon: Calendar },
        { name: "Davomat", href: `/${rolePath}/attendance`, icon: ClipboardList },
        { name: "Baholar", href: `/${rolePath}/grades`, icon: Award },
        { name: "Uyga vazifalar", href: `/${rolePath}/homework`, icon: FileText },
      ];
    }
    if (role === "student") {
      return [
        ...baseItems,
        { name: "Darslarim", href: `/${rolePath}/lessons`, icon: BookOpen },
        { name: "Jadval", href: `/${rolePath}/schedule`, icon: Calendar },
        { name: "Baholar", href: `/${rolePath}/grades`, icon: GraduationCap },
        { name: "Uyga vazifalar", href: `/${rolePath}/homework`, icon: CheckSquare },
        { name: "Davomat", href: `/${rolePath}/attendance`, icon: ClipboardList },
        { name: "To'lovlar", href: `/${rolePath}/payments`, icon: DollarSign },
      ];
    }
    return baseItems;
  }, [role, branchType, rolePath, currentBranch]);

  // Auto-expand groups that contain the active route
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      navigationItems.forEach((item) => {
        if (item.children?.some((child) => child.href && pathname.startsWith(child.href))) {
          next.add(item.name);
        }
      });
      return next;
    });
  }, [pathname, navigationItems]);

  // Get current page name for header (checks children too)
  const currentPageName = useMemo(() => {
    // Flatten all items including children for matching
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user || !currentBranch) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">Mendeleyev</p>
              <p className="text-[10px] text-gray-400 leading-tight">{translateRole(role)}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user.phone_number}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {navigationItems.map((item) => {
            const hasChildren = !!item.children?.length;

            if (hasChildren) {
              const isGroupActive = item.children!.some(
                (child) => child.href && pathname.startsWith(child.href)
              );
              const isOpen = expandedGroups.has(item.name);

              return (
                <div key={item.name}>
                  <button
                    onClick={() =>
                      setExpandedGroups((prev) => {
                        const next = new Set(prev);
                        next.has(item.name) ? next.delete(item.name) : next.add(item.name);
                        return next;
                      })
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isGroupActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`shrink-0 ${isGroupActive ? "text-blue-500" : "text-gray-400"}`}
                      style={{ width: 18, height: 18 }}
                    />
                    <span className="truncate flex-1 text-left">{item.name}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      } ${isGroupActive ? "text-blue-400" : "text-gray-300"}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-0.5 ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5">
                      {item.children!.map((child) => {
                        if (!child.href) return null;
                        const allChildHrefs = item.children!.map((c) => c.href).filter(Boolean) as string[];
                        const isChildActive =
                          pathname === child.href ||
                          (
                            pathname.startsWith(child.href) &&
                            !allChildHrefs.some(
                              (other) =>
                                other !== child.href &&
                                pathname.startsWith(other) &&
                                other.length > child.href!.length
                            )
                          );
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isChildActive
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            }`}
                          >
                            <child.icon
                              className={`shrink-0 ${isChildActive ? "text-white" : "text-gray-400"}`}
                              style={{ width: 16, height: 16 }}
                            />
                            <span className="truncate">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular (non-grouped) item
            const itemHref = item.href!;
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

            if (!item.href) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                  style={{ width: 18, height: 18 }}
                />
                <span className="truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Branch Switcher */}
        <div className="pt-1 pb-2 border-t border-gray-100">
          <p className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Joriy filial
          </p>
          <BranchSwitcher
            currentBranch={currentBranch}
            memberships={memberships ?? []}
            onSwitch={switchBranch}
          />
        </div>

        {/* Logout */}
        <div className="px-3 pb-3 border-t border-gray-100 pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 hidden sm:inline">{currentBranch.branch_name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
              <span className="font-semibold text-gray-800">{currentPageName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification placeholder */}
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-xs">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{translateRole(role)}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user.phone_number}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${rolePath}/settings`} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Sozlamalar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
