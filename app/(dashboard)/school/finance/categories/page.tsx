"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { financeApi } from "@/lib/api/finance";
import type {
  FinanceCategory,
  CreateFinanceCategoryRequest,
  CategoryType,
} from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Filter,
  ChevronRight,
} from "lucide-react";

export default function CategoriesPage() {
  const router = useRouter();
  const { currentBranch } = useAuthStore();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory | null>(null);

  // Form states - code fieldni olib tashladik
  const [formData, setFormData] = useState({
    name: "",
    type: "income" as CategoryType,
    description: "",
    parent: null as string | null,
    is_active: true,
  });

  useEffect(() => {
    if (currentBranch) {
      loadCategories();
    }
  }, [currentBranch, typeFilter, showActiveOnly]);

  const loadCategories = async () => {
    if (!currentBranch) return;

    try {
      setIsLoading(true);
      const params: any = {};
      
      if (typeFilter !== "all") {
        params.type = typeFilter;
      }
      
      if (showActiveOnly) {
        params.is_active = true;
      }

      const response = await financeApi.getCategories(params);
      setCategories(response.results);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Kategoriyalarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!currentBranch) return;
    if (!formData.name.trim()) {
      toast.error("Kategoriya nomini kiriting");
      return;
    }

    try {
      // Auto-generate code from name
      const code = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");

      await financeApi.createCategory({
        ...formData,
        code,
      });
      toast.success("Kategoriya muvaffaqiyatli yaratildi");
      setIsCreateOpen(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Kategoriya yaratishda xatolik");
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;
    if (!formData.name.trim()) {
      toast.error("Kategoriya nomini kiriting");
      return;
    }

    try {
      await financeApi.updateCategory(selectedCategory.id, {
        name: formData.name,
        description: formData.description,
        parent: formData.parent,
        is_active: formData.is_active,
      });
      toast.success("Kategoriya muvaffaqiyatli yangilandi");
      setIsEditOpen(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Kategoriya yangilashda xatolik");
    }
  };

  const handleDelete = async (category: FinanceCategory) => {
    if (!confirm(`"${category.name}" kategoriyasini o'chirmoqchimisiz?`)) return;

    try {
      await financeApi.deleteCategory(category.id);
      toast.success("Kategoriya muvaffaqiyatli o'chirildi");
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Kategoriya o'chirishda xatolik");
    }
  };

  const openEditDialog = (category: FinanceCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      parent: category.parent,
      is_active: category.is_active,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "income",
      description: "",
      parent: null,
      is_active: true,
    });
    setSelectedCategory(null);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const incomeCategories = filteredCategories.filter((c) => c.type === "income");
  const expenseCategories = filteredCategories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/branch-admin/finance")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moliya Kategoriyalari</h1>
            <p className="text-muted-foreground mt-1">
              Kirim va chiqim kategoriyalarini boshqarish
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yangi kategoriya
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Kategoriya qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="income">Kirim</SelectItem>
              <SelectItem value="expense">Chiqim</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showActiveOnly ? "default" : "outline"}
            onClick={() => setShowActiveOnly(!showActiveOnly)}
          >
            {showActiveOnly ? "Faqat faol" : "Hammasi"}
          </Button>
        </div>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-48 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Categories */}
          {(typeFilter === "all" || typeFilter === "income") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-8 bg-green-500 rounded-full" />
                  Kirim Kategoriyalari
                  <Badge variant="secondary" className="ml-auto">
                    {incomeCategories.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incomeCategories.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Kirim kategoriyalari topilmadi</p>
                  </div>
                ) : (
                  incomeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="group flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {category.name}
                          </p>
                          {category.branch === null && (
                            <Badge variant="outline" className="text-xs">
                              Global
                            </Badge>
                          )}
                          {!category.is_active && (
                            <Badge variant="destructive" className="text-xs">
                              Faol emas
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {category.description}
                          </p>
                        )}
                        {category.parent_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <ChevronRight className="w-3 h-3" />
                            {category.parent_name}
                          </div>
                        )}
                      </div>
                      {category.branch !== null && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(category)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Expense Categories */}
          {(typeFilter === "all" || typeFilter === "expense") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-8 bg-red-500 rounded-full" />
                  Chiqim Kategoriyalari
                  <Badge variant="secondary" className="ml-auto">
                    {expenseCategories.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expenseCategories.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Chiqim kategoriyalari topilmadi</p>
                  </div>
                ) : (
                  expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="group flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {category.name}
                          </p>
                          {category.branch === null && (
                            <Badge variant="outline" className="text-xs">
                              Global
                            </Badge>
                          )}
                          {!category.is_active && (
                            <Badge variant="destructive" className="text-xs">
                              Faol emas
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {category.description}
                          </p>
                        )}
                        {category.parent_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <ChevronRight className="w-3 h-3" />
                            {category.parent_name}
                          </div>
                        )}
                      </div>
                      {category.branch !== null && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(category)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yangi kategoriya qo&apos;shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kategoriya nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masalan: Xodimlar maoshi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Turi *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: CategoryType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Kirim</SelectItem>
                  <SelectItem value="expense">Chiqim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Qisqacha tavsif (ixtiyoriy)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreate}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Kategoriyani tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Kategoriya nomi *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Tavsif</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Faol kategoriya
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEdit}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
