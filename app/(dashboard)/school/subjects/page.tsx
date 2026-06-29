"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Subject } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { CreateSubjectForm } from "@/components/dashboard/CreateSubjectForm";
import { EditSubjectForm } from "@/components/dashboard/EditSubjectForm";
import {
  BookOpen,
  Search,
  Plus,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit,
  Trash2,
  RefreshCcw,
  ArrowUpDown,
  Layers,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function SubjectsPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;

  // State
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"name" | "created_at">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Dialog states
  const [createFormOpen, setCreateFormOpen] = React.useState(false);
  const [editFormOpen, setEditFormOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);

  // Fetch subjects
  const fetchSubjects = React.useCallback(async () => {
    if (!branchId) return;

    try {
      setLoading(true);
      const params: { is_active?: boolean } = {};
      
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;

      const data = await schoolApi.getSubjects(branchId, params);
      setSubjects(data);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      toast.error("Fanlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [branchId, statusFilter]);

  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Search filter and sorting
  const filteredSubjects = React.useMemo(() => {
    const filtered = subjects.filter((subject) => {
      const query = searchQuery.toLowerCase();
      return (
        subject.name.toLowerCase().includes(query) ||
        (subject.description?.toLowerCase().includes(query) ?? false)
      );
    });

    return filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === "name") {
        compareValue = a.name.localeCompare(b.name, "uz-UZ");
      } else if (sortBy === "created_at") {
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });
  }, [subjects, searchQuery, sortBy, sortOrder]);

  // Handlers
  const handleCreateSuccess = () => {
    setCreateFormOpen(false);
    fetchSubjects();
    toast.success("Fan muvaffaqiyatli yaratildi");
  };

  const handleEditSuccess = () => {
    setEditFormOpen(false);
    setSelectedSubject(null);
    fetchSubjects();
    toast.success("Fan ma'lumotlari yangilandi");
  };

  const handleDelete = async (subject: Subject) => {
    if (!branchId) return;
    try {
      setDeletingId(subject.id);
      await schoolApi.deleteSubject(branchId, subject.id);
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      toast.success(`"${subject.name}" fani o'chirildi`);
    } catch (error) {
      console.error("Failed to delete subject:", error);
      toast.error("Fanni o'chirishda xatolik yuz berdi");
      fetchSubjects();
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditFormOpen(true);
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            Fanlar
          </h1>
          <p className="text-sm text-gray-500">
            Filialdagi fanlarni boshqaring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={fetchSubjects}
            disabled={loading}
            className="w-auto"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yangilash
          </Button>
          <Button onClick={() => setCreateFormOpen(true)} size="default" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Yangi fan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Jami fanlar</p>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
              </div>
              <BookOpen className="w-10 h-10 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Faol fanlar</p>
                <p className="text-2xl font-bold text-green-600">
                  {subjects.filter((s) => s.is_active).length}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nofaol fanlar</p>
                <p className="text-2xl font-bold text-red-600">
                  {subjects.filter((s) => !s.is_active).length}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                Qidiruv
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Fan nomi, kod yoki tavsif bo'yicha qidiring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                Holat
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Fanlar ro'yxati
            <Badge variant="secondary" className="ml-2">
              {filteredSubjects.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Fanlar topilmadi</p>
              <p className="text-sm text-gray-400">
                {searchQuery || statusFilter !== "all"
                  ? "Boshqa filtrlarni sinab ko'ring"
                  : "Yangi fan qo'shish uchun yuqoridagi tugmani bosing"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => {
                          if (sortBy === "name") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("name");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Fan nomi
                        {sortBy === "name" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Darajalar</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => {
                          if (sortBy === "created_at") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("created_at");
                            setSortOrder("desc");
                          }
                        }}
                      >
                        Yaratilgan
                        {sortBy === "created_at" ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow
                      key={subject.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/school/subjects/${subject.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border shrink-0"
                            style={{ backgroundColor: subject.color || '#3b82f6' }}
                          />
                          <span>{subject.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          {subject.levels_count ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {subject.description || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {subject.is_active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Faol
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Nofaol
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(subject.created_at).toLocaleDateString("uz-UZ")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(subject);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubject(subject);
                              setDeleteConfirmOpen(true);
                            }}
                            disabled={deletingId === subject.id}
                          >
                            {deletingId === subject.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Form Dialog */}
      <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Yangi fan qo'shish
            </DialogTitle>
            <DialogDescription>
              Fan ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <CreateSubjectForm
            branchId={branchId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      {selectedSubject && (
        <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-6 h-6 text-blue-600" />
                Fanni tahrirlash
              </DialogTitle>
              <DialogDescription>
                Fan ma'lumotlarini yangilang
              </DialogDescription>
            </DialogHeader>
            <EditSubjectForm
              branchId={branchId}
              subject={selectedSubject}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fanni o'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSubject && (
                <>
                  <span className="font-semibold text-gray-900">\"{selectedSubject.name}\"</span> fanini
                  o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSubject) {
                  handleDelete(selectedSubject);
                  setDeleteConfirmOpen(false);
                }
              }}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  O&apos;chirilmoqda...
                </>
              ) : (
                "O'chirish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
