"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolApi } from "@/lib/api/school";
import type { AcademicYear, CreateAcademicYearRequest } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AcademicYearsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.branch_id;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<AcademicYear | null>(null);
  const [quartersDialogOpen, setQuartersDialogOpen] = React.useState(false);

  // Fetch academic years
  const {
    data: academicYears = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["academic-years", branchId],
    queryFn: () => schoolApi.getAcademicYears(branchId!),
    enabled: !!branchId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAcademicYearRequest) =>
      schoolApi.createAcademicYear(branchId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      toast.success("Akademik yil muvaffaqiyatli yaratildi");
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ yearId, data }: { yearId: string; data: Partial<CreateAcademicYearRequest> }) =>
      schoolApi.updateAcademicYear(branchId!, yearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      toast.success("Akademik yil muvaffaqiyatli yangilandi");
      setEditDialogOpen(false);
      setSelectedYear(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (yearId: string) => schoolApi.deleteAcademicYear(branchId!, yearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years", branchId] });
      toast.success("Akademik yil o'chirildi");
      setDeleteDialogOpen(false);
      setSelectedYear(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(message);
    },
  });

  // Filter academic years
  const filteredYears = academicYears.filter((year) =>
    year.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Filial tanlanmagan</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Akademik yillar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Akademik yillarni yuklashda xatolik yuz berdi</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Akademik Yillar</h1>
          <p className="text-gray-600 mt-1">
            O'quv yillari va choraklarni boshqarish
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yangi yil
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Akademik yil qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Academic Years Grid */}
      {filteredYears.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Akademik yillar topilmadi
            </h3>
            <p className="text-gray-600 mb-4">
              Yangi akademik yil yaratish uchun yuqoridagi tugmani bosing
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Birinchi yilni yaratish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredYears.map((year) => (
            <Card
              key={year.id}
              className={`hover:shadow-lg transition-shadow ${
                year.is_active ? "border-blue-500 border-2" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{year.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(year.start_date).toLocaleDateString("uz-UZ")} -{" "}
                      {new Date(year.end_date).toLocaleDateString("uz-UZ")}
                    </CardDescription>
                  </div>
                  {year.is_active && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Faol
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quarters */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {year.quarters?.length || 0} ta chorak
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedYear(year);
                      setQuartersDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Choraklar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedYear(year);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedYear(year);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateAcademicYearDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {selectedYear && (
        <EditAcademicYearDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          academicYear={selectedYear}
          onSubmit={(data) =>
            updateMutation.mutate({ yearId: selectedYear.id, data })
          }
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akademik yilni o'chirish</DialogTitle>
            <DialogDescription>
              <span className="font-semibold">{selectedYear?.name}</span> akademik yilini o'chirishni xohlaysizmi?
              Bu amaldan qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedYear(null);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedYear && deleteMutation.mutate(selectedYear.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  O'chirilmoqda...
                </>
              ) : (
                "O'chirish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quarters Dialog */}
      {selectedYear && (
        <ManageQuartersDialog
          open={quartersDialogOpen}
          onOpenChange={setQuartersDialogOpen}
          academicYear={selectedYear}
        />
      )}
    </div>
  );
}

// Create Academic Year Dialog Component
function CreateAcademicYearDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAcademicYearRequest) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = React.useState<CreateAcademicYearRequest>({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  React.useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        start_date: "",
        end_date: "",
        is_active: false,
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi Akademik Yil</DialogTitle>
          <DialogDescription>
            Yangi o'quv yilini yaratish uchun ma'lumotlarni kiriting
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Akademik yil nomi *</Label>
            <Input
              id="name"
              placeholder="2024-2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Boshlanish sanasi *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Tugash sanasi *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="is_active">Faol akademik yil</Label>
              <p className="text-xs text-gray-600">
                Agar faol qilsangiz, boshqa yillar nofaol bo'ladi
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                "Yaratish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Academic Year Dialog Component
function EditAcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear;
  onSubmit: (data: Partial<CreateAcademicYearRequest>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = React.useState<Partial<CreateAcademicYearRequest>>({
    name: academicYear.name,
    start_date: academicYear.start_date,
    end_date: academicYear.end_date,
    is_active: academicYear.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: academicYear.name,
        start_date: academicYear.start_date,
        end_date: academicYear.end_date,
        is_active: academicYear.is_active,
      });
    }
  }, [open, academicYear]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Akademik Yilni Tahrirlash</DialogTitle>
          <DialogDescription>
            {academicYear.name} akademik yil ma'lumotlarini yangilash
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_name">Akademik yil nomi *</Label>
            <Input
              id="edit_name"
              placeholder="2024-2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_start_date">Boshlanish sanasi *</Label>
              <Input
                id="edit_start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_end_date">Tugash sanasi *</Label>
              <Input
                id="edit_end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="edit_is_active">Faol akademik yil</Label>
              <p className="text-xs text-gray-600">
                Agar faol qilsangiz, boshqa yillar nofaol bo'ladi
              </p>
            </div>
            <Switch
              id="edit_is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Manage Quarters Dialog Component
function ManageQuartersDialog({
  open,
  onOpenChange,
  academicYear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear;
}) {
  const queryClient = useQueryClient();
  const [createQuarterOpen, setCreateQuarterOpen] = React.useState(false);
  const [editQuarterOpen, setEditQuarterOpen] = React.useState(false);
  const [selectedQuarter, setSelectedQuarter] = React.useState<any>(null);
  const [deleteQuarterOpen, setDeleteQuarterOpen] = React.useState(false);

  // Fetch quarters
  const {
    data: quarters = [],
    isLoading: quartersLoading,
    error: quartersError,
  } = useQuery({
    queryKey: ["quarters", academicYear.id],
    queryFn: async () => {
      const result = await schoolApi.getQuarters(academicYear.id);
      console.log("Quarters response:", result);
      return result;
    },
    enabled: open,
  });

  // Create quarter mutation
  const createQuarterMutation = useMutation({
    mutationFn: (data: any) => schoolApi.createQuarter(academicYear.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarters", academicYear.id] });
      toast.success("Chorak muvaffaqiyatli yaratildi");
      setCreateQuarterOpen(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(message);
    },
  });

  // Update quarter mutation
  const updateQuarterMutation = useMutation({
    mutationFn: ({ quarterId, data }: { quarterId: string; data: any }) =>
      schoolApi.updateQuarter(academicYear.id, quarterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarters", academicYear.id] });
      toast.success("Chorak muvaffaqiyatli yangilandi");
      setEditQuarterOpen(false);
      setSelectedQuarter(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(message);
    },
  });

  // Delete quarter mutation
  const deleteQuarterMutation = useMutation({
    mutationFn: (quarterId: string) => schoolApi.deleteQuarter(academicYear.id, quarterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarters", academicYear.id] });
      toast.success("Chorak o'chirildi");
      setDeleteQuarterOpen(false);
      setSelectedQuarter(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Xatolik yuz berdi";
      toast.error(message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{academicYear.name} - Choraklar</DialogTitle>
          <DialogDescription>
            Akademik yil uchun choraklarni boshqarish
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Quarter Button */}
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setCreateQuarterOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Chorak qo'shish
            </Button>
          </div>

          {/* Quarters List */}
          {quartersLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : quartersError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Choraklarni yuklashda xatolik yuz berdi
              </AlertDescription>
            </Alert>
          ) : !Array.isArray(quarters) ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Backend noto'g'ri format qaytardi. Console'ni tekshiring.
              </AlertDescription>
            </Alert>
          ) : quarters.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Choraklar topilmadi</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateQuarterOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Birinchi chorakni yaratish
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quarters.map((quarter: any) => (
                <Card
                  key={quarter.id}
                  className={`${quarter.is_active ? "border-green-500 border-2" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{quarter.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(quarter.start_date).toLocaleDateString("uz-UZ")} -{" "}
                          {new Date(quarter.end_date).toLocaleDateString("uz-UZ")}
                        </CardDescription>
                      </div>
                      {quarter.is_active && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Faol
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQuarter(quarter);
                          setEditQuarterOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Tahrirlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQuarter(quarter);
                          setDeleteQuarterOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Quarter Dialog */}
        <Dialog open={createQuarterOpen} onOpenChange={setCreateQuarterOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yangi Chorak</DialogTitle>
              <DialogDescription>Chorak ma'lumotlarini kiriting</DialogDescription>
            </DialogHeader>
            <QuarterForm
              onSubmit={(data) => createQuarterMutation.mutate(data)}
              isPending={createQuarterMutation.isPending}
              onCancel={() => setCreateQuarterOpen(false)}
              academicYear={academicYear}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Quarter Dialog */}
        {selectedQuarter && (
          <Dialog open={editQuarterOpen} onOpenChange={setEditQuarterOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Chorakni Tahrirlash</DialogTitle>
                <DialogDescription>{selectedQuarter.name}</DialogDescription>
              </DialogHeader>
              <QuarterForm
                quarter={selectedQuarter}
                onSubmit={(data) =>
                  updateQuarterMutation.mutate({ quarterId: selectedQuarter.id, data })
                }
                isPending={updateQuarterMutation.isPending}
                onCancel={() => {
                  setEditQuarterOpen(false);
                  setSelectedQuarter(null);
                }}
                academicYear={academicYear}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Quarter Dialog */}
        <Dialog open={deleteQuarterOpen} onOpenChange={setDeleteQuarterOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chorakni o'chirish</DialogTitle>
              <DialogDescription>
                <span className="font-semibold">{selectedQuarter?.name}</span> chorakni o'chirishni
                xohlaysizmi? Bu amaldan qaytarib bo'lmaydi.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteQuarterOpen(false);
                  setSelectedQuarter(null);
                }}
              >
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedQuarter && deleteQuarterMutation.mutate(selectedQuarter.id)}
                disabled={deleteQuarterMutation.isPending}
              >
                {deleteQuarterMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    O'chirilmoqda...
                  </>
                ) : (
                  "O'chirish"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Quarter Form Component
function QuarterForm({
  quarter,
  onSubmit,
  isPending,
  onCancel,
  academicYear,
}: {
  quarter?: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
  academicYear: AcademicYear;
}) {
  const [formData, setFormData] = React.useState({
    name: quarter?.name || "",
    number: quarter?.number || 1,
    start_date: quarter?.start_date || "",
    end_date: quarter?.end_date || "",
    is_active: quarter?.is_active || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quarter_name">Chorak nomi *</Label>
        <Input
          id="quarter_name"
          placeholder="1-chorak"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quarter_number">Chorak raqami *</Label>
        <select
          id="quarter_number"
          className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
          required
        >
          <option value={1}>1-chorak</option>
          <option value={2}>2-chorak</option>
          <option value={3}>3-chorak</option>
          <option value={4}>4-chorak</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quarter_start_date">Boshlanish *</Label>
          <Input
            id="quarter_start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            min={academicYear.start_date}
            max={academicYear.end_date}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quarter_end_date">Tugash *</Label>
          <Input
            id="quarter_end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            min={academicYear.start_date}
            max={academicYear.end_date}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="space-y-1">
          <Label htmlFor="quarter_is_active">Faol chorak</Label>
          <p className="text-xs text-gray-600">Joriy chorak sifatida belgilash</p>
        </div>
        <Switch
          id="quarter_is_active"
          checked={formData.is_active}
          onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Chorak sanalari {new Date(academicYear.start_date).toLocaleDateString("uz-UZ")} dan{" "}
          {new Date(academicYear.end_date).toLocaleDateString("uz-UZ")} gacha bo'lishi kerak
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {quarter ? "Saqlanmoqda..." : "Yaratilmoqda..."}
            </>
          ) : quarter ? (
            "Saqlash"
          ) : (
            "Yaratish"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
