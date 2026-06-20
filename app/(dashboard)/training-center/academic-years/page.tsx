"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolApi } from "@/lib/api/school";
import type { AcademicYear, Quarter, CreateAcademicYearRequest } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AcademicYearsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id;

  const [expandedYear, setExpandedYear] = React.useState<string | null>(null);
  const [yearDialog, setYearDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: AcademicYear;
  }>({ open: false, mode: "create" });
  const [quarterDialog, setQuarterDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    academicYear?: AcademicYear;
    data?: Quarter;
  }>({ open: false, mode: "create" });
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    id?: string;
    name?: string;
  }>({ open: false });

  const {
    data: academicYears = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["academic-years", branchId],
    queryFn: () => schoolApi.getAcademicYears(branchId!),
    enabled: !!branchId,
  });

  const createYearMutation = useMutation({
    mutationFn: (data: CreateAcademicYearRequest) =>
      schoolApi.createAcademicYear(branchId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      toast.success("Akademik yil yaratildi");
      setYearDialog({ open: false, mode: "create" });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const updateYearMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAcademicYearRequest> }) =>
      schoolApi.updateAcademicYear(branchId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      toast.success("Akademik yil yangilandi");
      setYearDialog({ open: false, mode: "create" });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const deleteYearMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteAcademicYear(branchId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      toast.success("Akademik yil o'chirildi");
      setDeleteDialog({ open: false });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const createQuarterMutation = useMutation({
    mutationFn: ({ academicYearId, data }: { academicYearId: string; data: any }) =>
      schoolApi.createQuarter(academicYearId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      queryClient.invalidateQueries({ queryKey: ["quarters", vars.academicYearId] });
      toast.success("Chorak yaratildi");
      setQuarterDialog({ open: false, mode: "create" });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const updateQuarterMutation = useMutation({
    mutationFn: ({ academicYearId, quarterId, data }: { academicYearId: string; quarterId: string; data: any }) =>
      schoolApi.updateQuarter(academicYearId, quarterId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      queryClient.invalidateQueries({ queryKey: ["quarters", vars.academicYearId] });
      toast.success("Chorak yangilandi");
      setQuarterDialog({ open: false, mode: "create" });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Xatolik yuz berdi"),
  });

  const handleDeleteConfirm = () => {
    if (deleteDialog.id) {
      deleteYearMutation.mutate(deleteDialog.id);
    }
  };

  const activeYear = academicYears.find((y) => y.is_active);
  const totalQuarters = academicYears.reduce((sum, y) => sum + (y.quarters?.length || 0), 0);

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-600">Filial tanlanmagan</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-500 text-sm">Akademik yillar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-gray-600">Yuklashda xatolik yuz berdi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Akademik Yillar</h1>
          <p className="text-sm text-gray-500 mt-0.5">O'quv yillari va choraklarni boshqarish</p>
        </div>
        <Button
          onClick={() => setYearDialog({ open: true, mode: "create" })}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yangi yil
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{academicYears.length}</p>
            <p className="text-xs text-gray-500">Jami o'quv yillari</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeYear?.name || "—"}</p>
            <p className="text-xs text-gray-500">Joriy o'quv yili</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <CalendarRange className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalQuarters}</p>
            <p className="text-xs text-gray-500">Jami choraklar</p>
          </div>
        </div>
      </div>

      {/* Academic Years List */}
      {academicYears.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">Akademik yillar topilmadi</h3>
          <p className="text-sm text-gray-500 mb-4">Yangi o'quv yilini qo'shing</p>
          <Button onClick={() => setYearDialog({ open: true, mode: "create" })} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Yaratish
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {academicYears.map((year) => {
            const isExpanded = expandedYear === year.id;
            const quarters = year.quarters || [];
            return (
              <div
                key={year.id}
                className={`bg-white rounded-xl border transition-all ${
                  year.is_active ? "border-blue-200 shadow-sm" : "border-gray-100"
                }`}
              >
                {/* Year Header Row */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => setExpandedYear(isExpanded ? null : year.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        year.is_active ? "bg-blue-600" : "bg-gray-100"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className={`w-4 h-4 ${year.is_active ? "text-white" : "text-gray-400"}`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 ${year.is_active ? "text-white" : "text-gray-400"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{year.name}</span>
                        {year.is_active && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-2">Faol</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(year.start_date)} — {formatDate(year.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg mr-2">
                      <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">{quarters.length} ta chorak</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-gray-700"
                      onClick={() => setYearDialog({ open: true, mode: "edit", data: year })}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() =>
                        setDeleteDialog({ open: true, id: year.id, name: year.name })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded: Quarters */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Choraklar</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          setQuarterDialog({ open: true, mode: "create", academicYear: year })
                        }
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Chorak qo'shish
                      </Button>
                    </div>

                    {quarters.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Choraklar yo'q</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 text-xs text-blue-600"
                          onClick={() =>
                            setQuarterDialog({ open: true, mode: "create", academicYear: year })
                          }
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Birinchi chorakni qo'shing
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {quarters
                          .slice()
                          .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
                          .map((quarter) => (
                            <div
                              key={quarter.id}
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                quarter.is_active ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                  quarter.is_active
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-600 border border-gray-200"
                                }`}
                              >
                                {quarter.number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-800">{quarter.name}</span>
                                  {quarter.is_active && (
                                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-1.5 py-0">Faol</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatDate(quarter.start_date)} — {formatDate(quarter.end_date)}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-gray-400 hover:text-gray-700 flex-shrink-0"
                                onClick={() =>
                                  setQuarterDialog({
                                    open: true,
                                    mode: "edit",
                                    academicYear: year,
                                    data: quarter,
                                  })
                                }
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Academic Year Dialog */}
      <AcademicYearDialog
        open={yearDialog.open}
        mode={yearDialog.mode}
        academicYear={yearDialog.data}
        onOpenChange={(open) => setYearDialog((s) => ({ ...s, open }))}
        onSubmit={(data) => {
          if (yearDialog.mode === "create") {
            createYearMutation.mutate(data as CreateAcademicYearRequest);
          } else if (yearDialog.data) {
            updateYearMutation.mutate({ id: yearDialog.data.id, data });
          }
        }}
        isPending={createYearMutation.isPending || updateYearMutation.isPending}
      />

      {/* Quarter Dialog */}
      {quarterDialog.academicYear && (
        <QuarterDialog
          open={quarterDialog.open}
          mode={quarterDialog.mode}
          academicYear={quarterDialog.academicYear}
          quarter={quarterDialog.data}
          onOpenChange={(open) => setQuarterDialog((s) => ({ ...s, open }))}
          onSubmit={(data) => {
            const ayId = quarterDialog.academicYear!.id;
            if (quarterDialog.mode === "create") {
              createQuarterMutation.mutate({ academicYearId: ayId, data });
            } else if (quarterDialog.data) {
              updateQuarterMutation.mutate({
                academicYearId: ayId,
                quarterId: quarterDialog.data.id,
                data,
              });
            }
          }}
          isPending={createQuarterMutation.isPending || updateQuarterMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteDialog.name}&quot; akademik yili o&apos;chiriladi. Barcha choraklar ham o&apos;chadi.
              Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteYearMutation.isPending}
            >
              {deleteYearMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Academic Year Dialog
function AcademicYearDialog({
  open,
  mode,
  academicYear,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: "create" | "edit";
  academicYear?: AcademicYear;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<CreateAcademicYearRequest>) => void;
  isPending: boolean;
}) {
  const [form, setForm] = React.useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: academicYear?.name || "",
        start_date: academicYear?.start_date || "",
        end_date: academicYear?.end_date || "",
        is_active: academicYear?.is_active || false,
      });
    }
  }, [open, academicYear]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Yangi Akademik Yil" : "Akademik Yilni Tahrirlash"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Yangi o'quv yili ma'lumotlarini kiriting" : `${academicYear?.name} ma'lumotlarini yangilash`}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Nomi *</Label>
            <Input
              placeholder="2024-2025"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Boshlanish *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((s) => ({ ...s, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tugash *</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((s) => ({ ...s, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Faol o'quv yili</p>
              <p className="text-xs text-gray-500">Boshqa yillar nofaol bo'ladi</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: v }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Yaratish" : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Quarter Dialog
function QuarterDialog({
  open,
  mode,
  academicYear,
  quarter,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: "create" | "edit";
  academicYear: AcademicYear;
  quarter?: Quarter;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = React.useState({
    name: "",
    number: 1,
    start_date: "",
    end_date: "",
    is_active: false,
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: quarter?.name || "",
        number: quarter?.number || 1,
        start_date: quarter?.start_date || "",
        end_date: quarter?.end_date || "",
        is_active: quarter?.is_active || false,
      });
    }
  }, [open, quarter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Yangi Chorak" : "Chorakni Tahrirlash"} — {academicYear.name}
          </DialogTitle>
          <DialogDescription>
            Chorak sanasi {formatDate(academicYear.start_date)} — {formatDate(academicYear.end_date)} oralig'ida bo'lishi kerak
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input
                placeholder="1-chorak"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Raqami *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.number}
                onChange={(e) => setForm((s) => ({ ...s, number: parseInt(e.target.value) }))}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}-chorak
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Boshlanish *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((s) => ({ ...s, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tugash *</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((s) => ({ ...s, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Faol chorak</p>
              <p className="text-xs text-gray-500">Joriy chorak sifatida belgilash</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: v }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Yaratish" : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
