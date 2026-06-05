"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superadminApi, type BranchListItem } from "@/lib/api/superadmin";
import {
  Building2, Plus, Search, CheckCircle, XCircle, Archive,
  Eye, Pencil, MoreVertical, ChevronLeft, ChevronRight,
  Filter, GraduationCap, Users, UserCog, Phone, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:   { label: "Faol",        className: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Nofaol",      className: "bg-gray-100 text-gray-600 border-gray-200" },
  pending:  { label: "Kutilmoqda",  className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  archived: { label: "Arxivlangan", className: "bg-red-100 text-red-700 border-red-200" },
};
const TYPE_LABELS: Record<string, string> = { school: "Maktab", center: "O'quv markazi" };

function BranchCard({ branch, onActivate, onDeactivate, onArchive }: {
  branch: BranchListItem;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[branch.status] ?? STATUS_CONFIG.inactive;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-4.5 h-4.5 text-blue-600" style={{ width: 18, height: 18 }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{branch.name}</p>
            <p className="text-xs text-gray-400">{TYPE_LABELS[branch.type] ?? branch.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${cfg.className}`}>
            {cfg.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/super-admin/branches/${branch.id}`} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Ko'rish
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/super-admin/branches/${branch.id}/edit`} className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Tahrirlash
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {branch.status !== "active" && (
                <DropdownMenuItem
                  onClick={() => onActivate(branch.id)}
                  className="text-green-600 focus:text-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Faollashtirish
                </DropdownMenuItem>
              )}
              {branch.status === "active" && (
                <DropdownMenuItem
                  onClick={() => onDeactivate(branch.id)}
                  className="text-gray-600"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Nofaol qilish
                </DropdownMenuItem>
              )}
              {branch.status !== "archived" && (
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm(`"${branch.name}" ni arxivlashni tasdiqlaysizmi?`)) {
                      onArchive(branch.id);
                    }
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Archive className="w-4 h-4 mr-2" /> Arxivlash
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { icon: GraduationCap, value: branch.student_count, label: "O'quvchi" },
          { icon: Users, value: branch.staff_count, label: "Xodim" },
          { icon: UserCog, value: branch.admin_count, label: "Admin" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-base font-bold text-gray-900">{stat.value}</p>
            <p className="text-[10px] text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="space-y-1">
        {branch.phone_number && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="w-3 h-3" />
            <span>{branch.phone_number}</span>
          </div>
        )}
        {branch.address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{branch.address}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <Link
          href={`/super-admin/branches/${branch.id}`}
          className="flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          Batafsil ko'rish
        </Link>
      </div>
    </div>
  );
}

function BranchRow({ branch, onActivate, onDeactivate, onArchive }: {
  branch: BranchListItem;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[branch.status] ?? STATUS_CONFIG.inactive;
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{branch.name}</p>
            {branch.code && <p className="text-xs text-gray-400">{branch.code}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{TYPE_LABELS[branch.type] ?? branch.type}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.className}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-right">{branch.student_count}</td>
      <td className="px-4 py-3 text-sm text-gray-700 text-right">{branch.staff_count}</td>
      <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
        {branch.phone_number ?? "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/super-admin/branches/${branch.id}`}>
            <button className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </button>
          </Link>
          <Link href={`/super-admin/branches/${branch.id}/edit`}>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {branch.status !== "active" && (
                <DropdownMenuItem onClick={() => onActivate(branch.id)} className="text-green-600 focus:text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" /> Faollashtirish
                </DropdownMenuItem>
              )}
              {branch.status === "active" && (
                <DropdownMenuItem onClick={() => onDeactivate(branch.id)}>
                  <XCircle className="w-4 h-4 mr-2" /> Nofaol qilish
                </DropdownMenuItem>
              )}
              {branch.status !== "archived" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm(`"${branch.name}" ni arxivlashni tasdiqlaysizmi?`)) {
                        onArchive(branch.id);
                      }
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Archive className="w-4 h-4 mr-2" /> Arxivlash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export default function BranchesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const params: Record<string, string | number> = { page, page_size: 20 };
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;
  if (typeFilter !== "all") params.type = typeFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin", "branches", params],
    queryFn: () => superadminApi.getBranches(params).then((r) => r.data),
  });

  const mutation = (fn: (id: string) => Promise<unknown>, successMsg: string) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] });
        queryClient.invalidateQueries({ queryKey: ["superadmin", "statistics"] });
        toast.success(successMsg);
      },
      onError: () => toast.error("Xatolik yuz berdi"),
    });

  const activateMutation = useMutation({
    mutationFn: (id: string) => superadminApi.activateBranch(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] }); toast.success("Faollashtirildi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => superadminApi.deactivateBranch(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] }); toast.success("Nofaol qilindi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });
  const archiveMutation = useMutation({
    mutationFn: (id: string) => superadminApi.archiveBranch(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["superadmin", "branches"] }); toast.success("Arxivlandi"); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const branches = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filiallar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Jami <span className="font-semibold text-gray-700">{totalCount}</span> ta filial
          </p>
        </div>
        <Button
          onClick={() => router.push("/super-admin/branches/new")}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Yangi filial
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Nomi, kodi yoki telefon..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9 border-gray-200">
            <Filter className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
            <SelectItem value="pending">Kutilmoqda</SelectItem>
            <SelectItem value="archived">Arxivlangan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-9 border-gray-200">
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            <SelectItem value="school">Maktab</SelectItem>
            <SelectItem value="center">O'quv markazi</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg text-xs transition-colors ${viewMode === "table" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg text-xs transition-colors ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`bg-gray-100 rounded-xl animate-pulse ${viewMode === "grid" ? "h-48" : "h-14"}`} />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Filiallar topilmadi</p>
          <p className="text-sm text-gray-400 mt-1">Qidiruv yoki filterni o'zgartiring</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              onActivate={(id) => activateMutation.mutate(id)}
              onDeactivate={(id) => deactivateMutation.mutate(id)}
              onArchive={(id) => archiveMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Filial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Turi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Holat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">O'quvchi</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Xodim</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Telefon</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {branches.map((b) => (
                <BranchRow
                  key={b.id}
                  branch={b}
                  onActivate={(id) => activateMutation.mutate(id)}
                  onDeactivate={(id) => deactivateMutation.mutate(id)}
                  onArchive={(id) => archiveMutation.mutate(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-gray-500">
            {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} / {totalCount} ta
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
