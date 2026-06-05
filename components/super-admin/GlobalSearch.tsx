"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { superadminApi } from "@/lib/api/superadmin";
import {
  Search, Building2, Users, BookOpen, X, ArrowRight,
  GraduationCap, Shield, Loader2,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  archived: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Faol", inactive: "Nofaol", pending: "Kutilmoqda", archived: "Arxivlangan",
};
const TYPE_LABELS: Record<string, string> = { school: "Maktab", center: "O'quv markazi" };

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["superadmin", "search", debouncedQuery],
    queryFn: () => superadminApi.search(debouncedQuery).then((r) => r.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasResults =
    data && (data.branches.length > 0 || data.users.length > 0 || data.classes.length > 0);
  const noResults = debouncedQuery.length >= 2 && !isFetching && !hasResults;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          {isFetching ? (
            <Loader2 className="w-5 h-5 text-blue-500 shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filial, o'quvchi, sinf qidirish..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto">
          {/* Empty/Initial state */}
          {!query && (
            <div className="px-4 py-10 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Kamida 2 ta belgi kiriting</p>
            </div>
          )}

          {/* Loading */}
          {query.length >= 2 && isFetching && !data && (
            <div className="px-4 py-10 text-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Qidirilmoqda...</p>
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-gray-500">"{debouncedQuery}" bo'yicha natija topilmadi</p>
            </div>
          )}

          {/* Branches */}
          {data && data.branches.length > 0 && (
            <section className="py-2">
              <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Filiallar
              </p>
              {data.branches.map((b) => (
                <Link
                  key={b.id}
                  href={`/super-admin/branches/${b.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                    <p className="text-xs text-gray-400">
                      {TYPE_LABELS[b.type] ?? b.type}
                      {b.code && ` · ${b.code}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 shrink-0" />
                </Link>
              ))}
            </section>
          )}

          {/* Users */}
          {data && data.users.length > 0 && (
            <section className="py-2 border-t border-gray-50">
              <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Foydalanuvchilar
              </p>
              {data.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/super-admin/users`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                    {u.is_superuser ? (
                      <Shield className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Users className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {u.phone_number}
                      {u.branch_count > 0 && ` · ${u.branch_count} ta filial`}
                    </p>
                  </div>
                  {u.is_superuser && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      Superuser
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-500 shrink-0" />
                </Link>
              ))}
            </section>
          )}

          {/* Classes */}
          {data && data.classes.length > 0 && (
            <section className="py-2 border-t border-gray-50">
              <p className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Sinflar
              </p>
              {data.classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/super-admin/branches/${c.branch_id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group transition-colors"
                >
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">
                      {c.branch_name} · {c.academic_year} · {c.grade_level}-sinf
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-green-500 shrink-0" />
                </Link>
              ))}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-xs text-gray-400">
            {hasResults
              ? `${(data?.branches.length ?? 0) + (data?.users.length ?? 0) + (data?.classes.length ?? 0)} ta natija`
              : "Ctrl+K bilan qayta ochish"}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px]">↑↓</kbd>
              navigatsiya
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px]">Enter</kbd>
              ochish
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { open, openSearch, closeSearch };
}
