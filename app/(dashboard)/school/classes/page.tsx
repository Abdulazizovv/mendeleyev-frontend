"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import type { Class, CreateClassRequest, AcademicYear, Room } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  GraduationCap,
  X,
  Archive,
  ArchiveRestore,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// ── Class form ────────────────────────────────────────────────────────────────

function ClassForm({
  initial,
  years,
  rooms,
  branchId,
  onSubmit,
  submitting,
}: {
  initial?: Partial<CreateClassRequest>;
  years: AcademicYear[];
  rooms: Room[];
  branchId: string;
  onSubmit: (data: CreateClassRequest | Partial<CreateClassRequest>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = React.useState<Partial<CreateClassRequest>>({
    branch: initial?.branch || branchId,
    academic_year: initial?.academic_year || (years[0]?.id ?? ""),
    name: initial?.name || "",
    grade_level: initial?.grade_level ?? 1,
    max_students: initial?.max_students ?? 30,
    room: initial?.room || undefined,
    is_active: initial?.is_active ?? true,
    class_teacher: initial?.class_teacher,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          branch: branchId,
          academic_year: String(form.academic_year || ""),
          name: String(form.name || ""),
          grade_level: Number(form.grade_level ?? 1),
          class_teacher: form.class_teacher || undefined,
          max_students: Number(form.max_students ?? 30),
          room: form.room || undefined,
          is_active: Boolean(form.is_active ?? true),
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Sinf nomi <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="5-A"
            value={form.name || ""}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade_level">Sinf darajasi <span className="text-red-500">*</span></Label>
          <Input
            id="grade_level"
            type="number"
            placeholder="1–11"
            value={String(form.grade_level ?? "")}
            onChange={(e) => setForm((s) => ({ ...s, grade_level: Number(e.target.value) }))}
            min={1}
            max={11}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="academic_year">Akademik yil <span className="text-red-500">*</span></Label>
          <Select
            value={String(form.academic_year || "")}
            onValueChange={(v) => setForm((s) => ({ ...s, academic_year: v }))}
          >
            <SelectTrigger id="academic_year">
              <SelectValue placeholder="Tanlang" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_students">Maks. o'quvchi <span className="text-red-500">*</span></Label>
          <Input
            id="max_students"
            type="number"
            placeholder="30"
            value={String(form.max_students ?? "")}
            onChange={(e) => setForm((s) => ({ ...s, max_students: Number(e.target.value) }))}
            min={1}
            max={200}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Xona</Label>
          <Select
            value={form.room || "_none"}
            onValueChange={(v) => setForm((s) => ({ ...s, room: v === "_none" ? undefined : v }))}
          >
            <SelectTrigger id="room">
              <SelectValue placeholder="Ixtiyoriy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Xonasiz</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Holat</Label>
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id="is_active"
              checked={!!form.is_active}
              onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: Boolean(v) }))}
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">Faol sinf</Label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const branchId = currentBranch?.branch_id;
  const qc = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState<string>("all");
  const [selectedGrade, setSelectedGrade] = React.useState<string>("all");
  const [showArchived, setShowArchived] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    id?: string;
    name?: string;
    studentsCount?: number;
  }>({ open: false });

  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ["academicYears", branchId],
    queryFn: () => schoolApi.getAcademicYears(branchId!),
    enabled: !!branchId,
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["rooms", branchId],
    queryFn: () => schoolApi.getRooms(branchId!),
    enabled: !!branchId,
  });

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ["classes", branchId, search, selectedYear, selectedGrade],
    queryFn: () =>
      schoolApi.getClasses(branchId!, {
        search: search || undefined,
        academic_year_id: selectedYear !== "all" ? selectedYear : undefined,
        grade_level: selectedGrade !== "all" ? Number(selectedGrade) : undefined,
      }),
    enabled: !!branchId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateClassRequest) => schoolApi.createClass(branchId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", branchId] });
      toast.success("Sinf yaratildi");
      setOpen(false);
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClassRequest> }) =>
      schoolApi.updateClass(branchId!, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", branchId] });
      toast.success("Sinf yangilandi");
      setOpen(false);
    },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schoolApi.deleteClass(branchId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", branchId] });
      toast.success("Sinf o'chirildi");
    },
    onError: () => toast.error("O'chirib bo'lmadi"),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => schoolApi.archiveClass(branchId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", branchId] });
      toast.success("Arxivlandi");
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => schoolApi.unarchiveClass(branchId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", branchId] });
      toast.success("Faollashtirildi");
    },
  });

  const editing = editId ? classes.find((c) => c.id === editId) : undefined;

  const filteredClasses = React.useMemo(
    () => classes.filter((c) => (showArchived ? c.is_archived : !c.is_archived)),
    [classes, showArchived]
  );

  const stats = React.useMemo(() => ({
    total: classes.filter((c) => !c.is_archived).length,
    archived: classes.filter((c) => c.is_archived).length,
    students: classes
      .filter((c) => !c.is_archived)
      .reduce((s, c) => s + (c.current_students_count || 0), 0),
  }), [classes]);

  const hasFilters = search || selectedYear !== "all" || selectedGrade !== "all";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sinflar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} ta sinf · {stats.students} o'quvchi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="w-4 h-4 mr-1.5" />
            {showArchived ? "Faol sinflar" : `Arxiv${stats.archived > 0 ? ` (${stats.archived})` : ""}`}
          </Button>
          {!showArchived && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditId(null)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Yangi sinf
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editId ? "Sinfni tahrirlash" : "Yangi sinf"}</DialogTitle>
                </DialogHeader>
                {roomsLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">Yuklanmoqda...</div>
                ) : (
                  <ClassForm
                    branchId={branchId!}
                    initial={
                      editing
                        ? {
                            branch: editing.branch,
                            academic_year: editing.academic_year,
                            name: editing.name,
                            grade_level: editing.grade_level,
                            max_students: editing.max_students,
                            room: editing.room,
                            is_active: editing.is_active,
                            class_teacher: editing.class_teacher,
                          }
                        : undefined
                    }
                    years={years}
                    rooms={rooms}
                    submitting={createMutation.isPending || updateMutation.isPending}
                    onSubmit={(data) => {
                      if (editId) {
                        updateMutation.mutate({ id: editId, data });
                      } else {
                        createMutation.mutate(data as CreateClassRequest);
                      }
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9 h-9"
            placeholder="Sinf nomini qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="O'quv yili" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha yillar</SelectItem>
            {years.map((y) => (
              <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Daraja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha daraja</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
              <SelectItem key={g} value={String(g)}>{g}-sinf</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => { setSearch(""); setSelectedYear("all"); setSelectedGrade("all"); }}
          >
            <X className="w-4 h-4 mr-1" /> Tozalash
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-8 text-center font-semibold text-gray-500">#</TableHead>
              <TableHead className="font-semibold text-gray-500">Sinf nomi</TableHead>
              <TableHead className="font-semibold text-gray-500">Daraja</TableHead>
              <TableHead className="font-semibold text-gray-500">O'quv yili</TableHead>
              <TableHead className="font-semibold text-gray-500">O'quvchilar</TableHead>
              <TableHead className="font-semibold text-gray-500">Sinf rahbari</TableHead>
              <TableHead className="font-semibold text-gray-500">Xona</TableHead>
              <TableHead className="font-semibold text-gray-500">Holat</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <GraduationCap className="w-8 h-8" />
                    <p className="text-sm">
                      {showArchived ? "Arxivlangan sinflar yo'q" : hasFilters ? "Hech narsa topilmadi" : "Sinflar mavjud emas"}
                    </p>
                    {!hasFilters && !showArchived && (
                      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" /> Yangi sinf
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((cls, idx) => {
                const fill = cls.max_students > 0
                  ? Math.round(((cls.current_students_count || 0) / cls.max_students) * 100)
                  : 0;

                return (
                  <TableRow
                    key={cls.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/school/classes/${cls.id}`)}
                  >
                    <TableCell className="text-center text-gray-400 text-sm">{idx + 1}</TableCell>

                    <TableCell>
                      <span className="font-semibold text-gray-900">{cls.name}</span>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                        {cls.grade_level}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {cls.academic_year_name || "—"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">{cls.current_students_count || 0}</span>
                          <span className="text-gray-400">/{cls.max_students}</span>
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${fill >= 90 ? "bg-red-500" : fill >= 70 ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{ width: `${fill}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {cls.class_teacher_name || <span className="text-gray-300">—</span>}
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {cls.room_name || <span className="text-gray-300">—</span>}
                    </TableCell>

                    <TableCell>
                      {cls.is_archived ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                          Arxiv
                        </Badge>
                      ) : cls.is_active ? (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50">
                          Faol
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                          Nofaol
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/school/classes/${cls.id}`)}>
                            <ChevronRight className="h-4 w-4 mr-2" /> Ko'rish
                          </DropdownMenuItem>
                          {!cls.is_archived && (
                            <DropdownMenuItem onClick={() => { setEditId(cls.id); setOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Tahrirlash
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {cls.is_archived ? (
                            <DropdownMenuItem
                              className="text-emerald-600"
                              onClick={() => unarchiveMutation.mutate(cls.id)}
                            >
                              <ArchiveRestore className="h-4 w-4 mr-2" /> Faollashtirish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-amber-600"
                              onClick={() => archiveMutation.mutate(cls.id)}
                            >
                              <Archive className="h-4 w-4 mr-2" /> Arxivlash
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                id: cls.id,
                                name: cls.name,
                                studentsCount: cls.current_students_count || 0,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm((p) => ({ ...p, open: v }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sinfni o'chirish</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold text-foreground">"{deleteConfirm.name}"</span> sinfini o'chirmoqchimisiz?
                </p>
                {(deleteConfirm.studentsCount ?? 0) > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                    Ushbu sinfda <strong className="mx-1">{deleteConfirm.studentsCount}</strong> ta o'quvchi mavjud.
                  </div>
                )}
                <p className="text-sm text-gray-500">Bu amal qaytarib bo'lmaydi.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm.id) deleteMutation.mutate(deleteConfirm.id);
                setDeleteConfirm({ open: false });
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
