"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Users, Search, Shield, ShieldOff, ChevronLeft, ChevronRight,
  Building2, Phone, Mail, UserCheck, UserX, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  branch_admin: "Filial admini",
  teacher: "O'qituvchi",
  student: "O'quvchi",
  parent: "Ota-ona",
  other: "Boshqa",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  branch_admin: "bg-blue-100 text-blue-700",
  teacher: "bg-green-100 text-green-700",
  student: "bg-orange-100 text-orange-700",
  parent: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
};

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-semibold text-white">{initials || "?"}</span>
    </div>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperuser = currentUser?.is_superuser === true;

  const [search, setSearch] = useState("");
  const [superuserFilter, setSuperuserFilter] = useState("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string | number | boolean> = {
    page,
    page_size: 20,
  };
  if (search) params.search = search;
  if (superuserFilter === "superuser") params.is_superuser = true;
  if (superuserFilter === "regular") params.is_superuser = false;

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "users", params],
    queryFn: () => superadminApi.getUsers(params).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) => superadminApi.toggleSuperuser(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });
      toast.success(res.data.message);
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  const startIdx = (page - 1) * 20 + 1;
  const endIdx = Math.min(page * 20, totalCount);

  const superuserCount = users.filter((u) => u.is_superuser).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Jami {totalCount} ta foydalanuvchi
            {superuserCount > 0 && ` · ${superuserCount} ta superadmin`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
          <Users className="w-3.5 h-3.5" />
          <span>
            {startIdx}–{endIdx} / {totalCount}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Ism, familiya yoki telefon raqami..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={superuserFilter}
          onValueChange={(v) => {
            setSuperuserFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Huquq turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha foydalanuvchilar</SelectItem>
            <SelectItem value="superuser">Faqat superadminlar</SelectItem>
            <SelectItem value="regular">Oddiy foydalanuvchilar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Foydalanuvchi</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefon</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Filiallar</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Huquq</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amal</span>
        </div>

        {isLoading ? (
          <div>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-b-0"
              >
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded animate-pulse w-40" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-28" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">Foydalanuvchilar topilmadi</p>
            <p className="text-xs text-gray-500 mt-1">
              {search ? `"${search}" bo'yicha natija yo'q` : "Hali foydalanuvchilar qo'shilmagan"}
            </p>
          </div>
        ) : (
          <div>
            {users.map((user, idx) => (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] ${
                  idx < users.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={user.full_name || user.phone_number} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.full_name || user.phone_number}
                      </p>
                      {user.is_superuser && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold shrink-0">
                          <Shield className="w-2.5 h-2.5" />
                          Superadmin
                        </span>
                      )}
                    </div>
                    {user.email && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    )}
                    {/* Memberships (mobile only) */}
                    <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                      {user.memberships_summary.slice(0, 2).map((m, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            ROLE_COLORS[m.role] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m.branch__name}
                        </span>
                      ))}
                      {user.memberships_summary.length > 2 && (
                        <span className="text-[10px] text-gray-400">
                          +{user.memberships_summary.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {user.phone_number}
                </div>

                {/* Branch count */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{user.branch_count}</span>
                  </div>
                </div>

                {/* Memberships */}
                <div className="hidden md:flex flex-wrap gap-1">
                  {user.memberships_summary.slice(0, 2).map((m, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        ROLE_COLORS[m.role] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROLE_LABELS[m.role] ?? m.role}
                    </span>
                  ))}
                  {user.memberships_summary.length > 2 && (
                    <span className="text-xs text-gray-400 self-center">
                      +{user.memberships_summary.length - 2}
                    </span>
                  )}
                  {user.memberships_summary.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Yo'q</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end shrink-0">
                  {isSuperuser ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {user.is_superuser ? (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => {
                              if (confirm("Bu foydalanuvchidan superadmin huquqini olishni tasdiqlaysizmi?")) {
                                toggleMutation.mutate(user.id);
                              }
                            }}
                          >
                            <ShieldOff className="w-4 h-4 mr-2" />
                            Huquqni olish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                            onClick={() => {
                              if (confirm("Bu foydalanuvchiga superadmin huquqini berishni tasdiqlaysizmi?")) {
                                toggleMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Superadmin berish
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center">
                      {user.is_active !== false ? (
                        <UserCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <UserX className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {startIdx}–{endIdx} / {totalCount} ta foydalanuvchi
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
