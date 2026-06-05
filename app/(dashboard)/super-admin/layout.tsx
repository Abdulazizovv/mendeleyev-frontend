"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { GlobalSearch, useGlobalSearch } from "@/components/super-admin/GlobalSearch";
import { Search } from "lucide-react";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const { open, openSearch, closeSearch } = useGlobalSearch();

  useEffect(() => {
    if (!isLoading && user && !isSuperAdmin()) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, isSuperAdmin, router]);

  if (isLoading) return null;
  if (!user || !isSuperAdmin()) return null;

  return (
    <>
      {/* Global search trigger bar */}
      <div className="mb-5">
        <button
          onClick={openSearch}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-gray-600 transition-all shadow-sm group"
        >
          <Search className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
          <span className="flex-1 text-left">Filial, o'quvchi, sinf qidirish...</span>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] text-gray-500">Ctrl</kbd>
            <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] text-gray-500">K</kbd>
          </div>
        </button>
      </div>

      {children}

      <GlobalSearch open={open} onClose={closeSearch} />
    </>
  );
}
