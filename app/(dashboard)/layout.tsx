"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { roleToPath } from "@/lib/utils/roleMapping";
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
  ChevronDown,
  Building2,
  Shield,
  ArrowLeft,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, currentBranch, logout, isLoading, loadUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Invalidate all queries when pathname changes (user navigates)
  React.useEffect(() => {
    queryClient.invalidateQueries();
  }, [pathname, queryClient]);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load user data on mount
  React.useEffect(() => {
    if (user && !isLoading) {
      loadUser();
    }
  }, []);

  // Role-based redirect
  React.useEffect(() => {
    if (!isLoading && user && currentBranch) {
      const pathname = window.location.pathname;
      const role = currentBranch.role;
      const rolePath = roleToPath(role);
      
      // If user is on wrong dashboard, redirect to their role's dashboard
      if (!pathname.startsWith(`/${rolePath}`) && !pathname.startsWith("/dashboard")) {
        router.push(`/${rolePath}`);
      }
    }
  }, [user, currentBranch, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user || !currentBranch) {
    return null;
  }

  const role = currentBranch.role;
  const rolePath = roleToPath(role);

  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { name: "Asosiy", href: `/${rolePath}`, icon: LayoutDashboard },
    ];

    if (role === "branch_admin") {
      return [
        ...baseItems,
        { name: "Xodimlar", href: `/${rolePath}/staff`, icon: Users },
        { name: "O'quvchilar", href: `/${rolePath}/students`, icon: GraduationCap },
        { name: "Sinflar", href: `/${rolePath}/classes`, icon: ClipboardList },
        { name: "Fanlar", href: `/${rolePath}/subjects`, icon: BookOpen },
        { name: "Xonalar", href: `/${rolePath}/rooms`, icon: Home },
        { name: "Rollar", href: `/${rolePath}/roles`, icon: Shield },
        { name: "Moliya", href: `/${rolePath}/finance`, icon: DollarSign },
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
      ];
    }

    if (role === "student") {
      return [
        ...baseItems,
        { name: "Darslarim", href: `/${rolePath}/lessons`, icon: BookOpen },
        { name: "Jadval", href: `/${rolePath}/schedule`, icon: Calendar },
        { name: "Baholar", href: `/${rolePath}/grades`, icon: GraduationCap },
        { name: "To'lovlar", href: `/${rolePath}/payments`, icon: DollarSign },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mendeleyev</h1>
                <p className="text-xs text-gray-500">{translateRole(role)}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Branch Info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Filial</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentBranch.branch_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/80">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Orqaga"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="hidden lg:block">
                <h2 className="text-2xl font-bold text-gray-900">
                  Dashboard
                </h2>
              </div>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 h-auto py-2 px-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user.phone_number}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mening akkauntim</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${rolePath}/profile`} className="cursor-pointer">
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
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
