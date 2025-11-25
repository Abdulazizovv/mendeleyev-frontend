"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { translateBranchType, translateRole, formatCurrency } from "@/lib/translations";

export default function DashboardPage() {
  const router = useRouter();
  const { user, currentBranch, memberships, isAuthenticated, isLoading, logout, switchBranch, loadUser } =
    useAuth();

  React.useEffect(() => {
    // Load user data if authenticated
    if (isAuthenticated && !user) {
      loadUser();
    }
  }, [isAuthenticated, user, loadUser]);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = `${user.first_name[0] || ""}${user.last_name[0] || ""}`.toUpperCase();

  const handleBranchSwitch = async (branchId: string) => {
    try {
      await switchBranch(branchId);
    } catch (error) {
      console.error("Branch switch error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Mendeleyev</h1>
            {currentBranch && (
              <Badge variant="outline" className="text-sm">
                {currentBranch.branch_name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-muted-foreground">{user.phone_number}</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              Chiqish
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome card */}
          <Card>
            <CardHeader>
              <CardTitle>
                Xush kelibsiz, {user.first_name} {user.last_name}!
              </CardTitle>
              <CardDescription>
                {currentBranch
                  ? `${currentBranch.branch_name} ${translateBranchType(currentBranch.branch_type)}ida ${translateRole(currentBranch.role)} sifatida faoliyat yuritmoqdasiz`
                  : "Hozircha hech qanday filial tanlanmagan"}
              </CardDescription>
            </CardHeader>
            {currentBranch && (
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rol:</span>
                    <span className="font-medium">{translateRole(currentBranch.role)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turi:</span>
                    <span className="font-medium">{translateBranchType(currentBranch.branch_type)}</span>
                  </div>
                  {currentBranch.title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lavozim:</span>
                      <span className="font-medium">{currentBranch.title}</span>
                    </div>
                  )}
                  {currentBranch.salary !== undefined && currentBranch.salary !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maosh:</span>
                      <span className="font-medium">{formatCurrency(currentBranch.salary)}</span>
                    </div>
                  )}
                  {currentBranch.balance !== undefined && currentBranch.balance !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balans:</span>
                      <span className="font-medium">{formatCurrency(currentBranch.balance)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Branches card */}
          {memberships.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Filiallaringiz</CardTitle>
                <CardDescription>Boshqa filialga o'tish uchun tanlang</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {memberships.map((membership) => (
                    <Button
                      key={membership.branch_id}
                      variant={
                        currentBranch?.branch_id === membership.branch_id ? "default" : "outline"
                      }
                      className="justify-start h-auto py-3"
                      onClick={() => handleBranchSwitch(membership.branch_id)}
                      disabled={currentBranch?.branch_id === membership.branch_id}
                    >
                      <div className="text-left">
                        <div className="font-semibold">{membership.branch_name}</div>
                        <div className="text-sm opacity-80">
                          {translateRole(membership.role)} • {translateBranchType(membership.branch_type)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature cards based on role */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentBranch?.role === "super_admin" && (
              <>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Filiallar boshqaruvi</CardTitle>
                    <CardDescription>Barcha filiallarni boshqarish</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Foydalanuvchilar</CardTitle>
                    <CardDescription>Foydalanuvchilarni boshqarish</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Sozlamalar</CardTitle>
                    <CardDescription>Tizim sozlamalari</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}

            {currentBranch?.role === "branch_admin" && (
              <>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Xodimlar</CardTitle>
                    <CardDescription>Xodimlarni boshqarish</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">O'quvchilar</CardTitle>
                    <CardDescription>O'quvchilarni boshqarish</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Hisobotlar</CardTitle>
                    <CardDescription>Moliyaviy va boshqa hisobotlar</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}

            {currentBranch?.role === "teacher" && (
              <>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Darslar</CardTitle>
                    <CardDescription>Dars jadvali va materiallar</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Davomat</CardTitle>
                    <CardDescription>O'quvchilar davomati</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Baholar</CardTitle>
                    <CardDescription>Baholash va o'rtacha ball</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}

            {currentBranch?.role === "student" && (
              <>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Dars jadvali</CardTitle>
                    <CardDescription>Haftalik dars jadvali</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Baholarim</CardTitle>
                    <CardDescription>Barcha fanlar bo'yicha baholar</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:bg-accent cursor-pointer transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Uy vazifalar</CardTitle>
                    <CardDescription>Topshirilgan va topshirilmagan vazifalar</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
