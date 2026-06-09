"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { schoolApi } from "@/lib/api";
import type { Subject, SubjectLevel, CreateSubjectLevelRequest } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Code,
  FileText,
  Edit,
  Trash2,
  RefreshCcw,
  ArrowUpDown,
  DollarSign,
  Layers,
  ArrowUp,
  ArrowDown,
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
  const [sortBy, setSortBy] = React.useState<"name" | "code" | "created_at">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  
  // Dialog states
  const [createFormOpen, setCreateFormOpen] = React.useState(false);
  const [editFormOpen, setEditFormOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // SubjectLevel state
  const [levels, setLevels] = React.useState<SubjectLevel[]>([]);
  const [levelsLoading, setLevelsLoading] = React.useState(false);
  const [levelForm, setLevelForm] = React.useState<Partial<CreateSubjectLevelRequest>>({});
  const [editingLevel, setEditingLevel] = React.useState<SubjectLevel | null>(null);
  const [levelFormOpen, setLevelFormOpen] = React.useState(false);
  const [savingLevel, setSavingLevel] = React.useState(false);
  const [deletingLevelId, setDeletingLevelId] = React.useState<string | null>(null);

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
        (subject.code?.toLowerCase().includes(query) ?? false) ||
        (subject.description?.toLowerCase().includes(query) ?? false)
      );
    });

    // Sort
    return filtered.sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === "name") {
        compareValue = a.name.localeCompare(b.name, "uz-UZ");
      } else if (sortBy === "code") {
        compareValue = (a.code || "").localeCompare(b.code || "", "uz-UZ");
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
    setDetailDialogOpen(false);
    setSelectedSubject(null);
    fetchSubjects();
    toast.success("Fan ma'lumotlari yangilandi");
  };

  const handleDelete = async (subject: Subject) => {
    if (!branchId) return;

    try {
      setDeletingId(subject.id);
      await schoolApi.deleteSubject(branchId, subject.id);
      
      // Optimistic update
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      toast.success(`"${subject.name}" fani o'chirildi`);
    } catch (error) {
      console.error("Failed to delete subject:", error);
      toast.error("Fanni o'chirishda xatolik yuz berdi");
      // Refresh on error
      fetchSubjects();
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setSelectedSubject(subject); // show basic list data immediately
    setDetailDialogOpen(true);
  };

  // Load full details when dialog opens
  React.useEffect(() => {
    const loadDetail = async () => {
      if (!branchId || !detailDialogOpen || !selectedSubjectId) return;
      try {
        setDetailLoading(true);
        const full = await schoolApi.getSubject(branchId, selectedSubjectId);
        setSelectedSubject(full);
      } catch (e) {
        console.error("Subject detail load error", e);
        toast.error("Fan detali yuklanmadi");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [branchId, detailDialogOpen, selectedSubjectId]);

  // Load levels when dialog opens
  React.useEffect(() => {
    const loadLevels = async () => {
      if (!branchId || !detailDialogOpen || !selectedSubjectId) return;
      try {
        setLevelsLoading(true);
        const data = await schoolApi.getSubjectLevels(branchId, selectedSubjectId);
        setLevels(data);
      } catch {
        setLevels([]);
      } finally {
        setLevelsLoading(false);
      }
    };
    loadLevels();
  }, [branchId, detailDialogOpen, selectedSubjectId]);

  const handleSaveLevel = async () => {
    if (!branchId || !selectedSubjectId) return;
    if (!levelForm.name?.trim()) { toast.error("Daraja nomi kiritilishi shart"); return; }
    if (levelForm.lesson_price === undefined || levelForm.lesson_price < 0) {
      toast.error("Dars narxi noto'g'ri"); return;
    }
    try {
      setSavingLevel(true);
      const payload: CreateSubjectLevelRequest = {
        name: levelForm.name.trim(),
        lesson_price: levelForm.lesson_price,
        is_active: levelForm.is_active ?? true,
      };
      if (editingLevel) {
        await schoolApi.updateSubjectLevel(branchId, selectedSubjectId, editingLevel.id, payload);
        toast.success("Daraja yangilandi");
      } else {
        await schoolApi.createSubjectLevel(branchId, selectedSubjectId, payload);
        toast.success("Daraja yaratildi");
      }
      const updated = await schoolApi.getSubjectLevels(branchId, selectedSubjectId);
      setLevels(updated);
      setLevelFormOpen(false);
      setEditingLevel(null);
      setLevelForm({});
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, unknown> } };
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : "Saqlashda xatolik";
      toast.error(msg);
    } finally {
      setSavingLevel(false);
    }
  };

  const handleDeleteLevel = async (level: SubjectLevel) => {
    if (!branchId || !selectedSubjectId) return;
    try {
      setDeletingLevelId(level.id);
      await schoolApi.deleteSubjectLevel(branchId, selectedSubjectId, level.id);
      setLevels((prev) => prev.filter((l) => l.id !== level.id));
      toast.success(`"${level.name}" darajasi o'chirildi`);
    } catch {
      toast.error("O'chirishda xatolik");
    } finally {
      setDeletingLevelId(null);
    }
  };

  const openEditLevel = (level: SubjectLevel) => {
    setEditingLevel(level);
    setLevelForm({ name: level.name, lesson_price: level.lesson_price, is_active: level.is_active });
    setLevelFormOpen(true);
  };

  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({ name: "", lesson_price: 0, is_active: true });
    setLevelFormOpen(true);
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={() => {
                          if (sortBy === "code") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("code");
                            setSortOrder("asc");
                          }
                        }}
                      >
                        Kod
                        {sortBy === "code" ? (
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
                      onClick={() => openDetail(subject)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: subject.color || '#3b82f6' }}
                          />
                          <span>{subject.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subject.code ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {subject.code}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
        setDetailDialogOpen(open);
        if (!open) { setLevelFormOpen(false); setEditingLevel(null); setLevelForm({}); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="w-6 h-6" style={{ color: selectedSubject.color || '#2563eb' }} />
                      {selectedSubject.name}
                      {detailLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    </DialogTitle>
                    <DialogDescription>Fan ma'lumotlari va darajalari</DialogDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailDialogOpen(false);
                      openEdit(selectedSubject);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Tahrirlash
                  </Button>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Ma'lumotlar
                  </TabsTrigger>
                  <TabsTrigger value="levels" className="flex-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Darajalar
                    <Badge variant="secondary" className="ml-1 text-xs py-0 px-1.5">{levels.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fan nomi</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="inline-flex h-4 w-4 rounded-full border" style={{ backgroundColor: selectedSubject.color || '#3b82f6' }} />
                        {selectedSubject.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fan kodi</p>
                      {selectedSubject.code ? (
                        <Badge variant="outline" className="font-mono">{selectedSubject.code}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Tavsif</p>
                      <p className="text-gray-900 text-sm">
                        {selectedSubject.description || <span className="text-gray-400">Tavsif kiritilmagan</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Holat</p>
                      {selectedSubject.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />Faol
                        </Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Nofaol</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rang</p>
                      <p className="flex items-center gap-2 text-sm font-mono">
                        <span className="h-5 w-5 rounded-md border" style={{ backgroundColor: selectedSubject.color || '#3b82f6' }} />
                        {selectedSubject.color ?? <span className="text-gray-400">#3b82f6</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Yaratilgan</p>
                      <p className="text-xs text-gray-900">{new Date(selectedSubject.created_at).toLocaleString("uz-UZ")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Yangilangan</p>
                      <p className="text-xs text-gray-900">{new Date(selectedSubject.updated_at).toLocaleString("uz-UZ")}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Levels Tab */}
                <TabsContent value="levels" className="pt-3 space-y-3">
                  {/* Level Form */}
                  {levelFormOpen ? (
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      <h4 className="font-medium text-sm">
                        {editingLevel ? "Darajani tahrirlash" : "Yangi daraja"}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Daraja nomi *</Label>
                          <Input
                            placeholder="Masalan: Asosiy, Chuqur"
                            value={levelForm.name ?? ""}
                            onChange={(e) => setLevelForm((f) => ({ ...f, name: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dars narxi (so'm) *</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={levelForm.lesson_price ?? ""}
                            onChange={(e) =>
                              setLevelForm((f) => ({ ...f, lesson_price: parseInt(e.target.value) || 0 }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={levelForm.is_active ?? true}
                          onCheckedChange={(v) => setLevelForm((f) => ({ ...f, is_active: v }))}
                        />
                        <Label className="text-xs">Faol</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveLevel} disabled={savingLevel}>
                          {savingLevel ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                          {editingLevel ? "Saqlash" : "Yaratish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setLevelFormOpen(false); setEditingLevel(null); setLevelForm({}); }}
                          disabled={savingLevel}
                        >
                          Bekor
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={openCreateLevel} className="w-full">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Yangi daraja qo'shish
                    </Button>
                  )}

                  {levelsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : levels.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      Hali daraja qo'shilmagan
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {levels.map((level) => (
                        <div
                          key={level.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{level.name}</p>
                              <p className="text-xs text-gray-500">
                                {level.lesson_price.toLocaleString("uz-UZ")} so'm / dars
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {level.is_active ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Faol</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Nofaol</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditLevel(level)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDeleteLevel(level)}
                              disabled={deletingLevelId === level.id}
                            >
                              {deletingLevelId === level.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

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
