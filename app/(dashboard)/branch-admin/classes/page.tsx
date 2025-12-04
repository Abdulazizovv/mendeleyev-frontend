"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import type { Class, CreateClassRequest, AcademicYear, Room } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Search, Users, GraduationCap, Building2, FilterX, AlertTriangle } from "lucide-react";

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
		section: initial?.section || "",
		max_students: initial?.max_students ?? 30,
		room: initial?.room || rooms[0]?.id,
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
					section: form.section || undefined,
					class_teacher: form.class_teacher || undefined,
					max_students: Number(form.max_students ?? 30),
					room: form.room || undefined,
					is_active: Boolean(form.is_active ?? true),
				});
			}}
			className="space-y-6"
		>
			{/* Asosiy ma'lumotlar */}
			<div className="space-y-4">
				<div>
					<h3 className="text-sm font-semibold text-foreground mb-3">Asosiy ma'lumotlar</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-sm font-medium">
								Sinf nomi <span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								placeholder="Masalan: 5-A sinf"
								className="h-10"
								value={form.name || ""}
								onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
								required
							/>
							<p className="text-xs text-muted-foreground">Sinfning to'liq nomini kiriting</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="academic_year" className="text-sm font-medium">
								Akademik yil <span className="text-red-500">*</span>
							</Label>
							<Select
								value={String(form.academic_year || "")}
								onValueChange={(v) => setForm((s) => ({ ...s, academic_year: v }))}
							>
								<SelectTrigger id="academic_year" className="h-10">
									<SelectValue placeholder="O'quv yilini tanlang" />
								</SelectTrigger>
								<SelectContent>
									{years.map((y) => (
										<SelectItem key={y.id} value={y.id}>
											{y.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">Joriy o'quv yilini belgilang</p>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			{/* Sinf tuzilmasi */}
			<div className="space-y-4">
				<div>
					<h3 className="text-sm font-semibold text-foreground mb-3">Sinf tuzilmasi</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="grade_level" className="text-sm font-medium">
								Sinf darajasi <span className="text-red-500">*</span>
							</Label>
							<Input
								id="grade_level"
								type="number"
								placeholder="1-11"
								className="h-10"
								value={String(form.grade_level ?? "")}
								onChange={(e) => setForm((s) => ({ ...s, grade_level: Number(e.target.value) }))}
								min={1}
								max={11}
								required
							/>
							<p className="text-xs text-muted-foreground">1 dan 11 gacha (masalan: 5)</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="section" className="text-sm font-medium">
								Bo'lim (ixtiyoriy)
							</Label>
							<Input
								id="section"
								placeholder="A, B, C..."
								className="h-10 uppercase"
								value={form.section || ""}
								onChange={(e) => setForm((s) => ({ ...s, section: e.target.value.toUpperCase() }))}
								maxLength={3}
							/>
							<p className="text-xs text-muted-foreground">Harf yoki raqam (masalan: A, B)</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="max_students" className="text-sm font-medium">
								Maksimal o'quvchilar <span className="text-red-500">*</span>
							</Label>
							<Input
								id="max_students"
								type="number"
								placeholder="20-40"
								className="h-10"
								value={String(form.max_students ?? "")}
								onChange={(e) => setForm((s) => ({ ...s, max_students: Number(e.target.value) }))}
								min={1}
								max={100}
								required
							/>
							<p className="text-xs text-muted-foreground">Sinfga qabul qilinadigan maksimal o'quvchilar soni</p>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			{/* Xona va holat */}
			<div className="space-y-4">
				<div>
					<h3 className="text-sm font-semibold text-foreground mb-3">Xona va holat</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="room" className="text-sm font-medium">
								Dars xonasi
							</Label>
							{rooms.length === 0 && (
								<div className="bg-orange-50 border border-orange-200 rounded-md p-2 mb-2">
									<p className="text-xs text-orange-800">
										⚠️ Hozircha xonalar mavjud emas. Iltimos, avval xona qo'shing.
									</p>
								</div>
							)}
							<Select
								value={String(form.room || "")}
								onValueChange={(v) => setForm((s) => ({ ...s, room: v }))}
								disabled={rooms.length === 0}
							>
								<SelectTrigger id="room" className="h-10">
									<SelectValue placeholder={rooms.length === 0 ? "Xonalar yo'q" : "Xonani tanlang"} />
								</SelectTrigger>
								<SelectContent>
									{rooms.map((r) => (
										<SelectItem key={r.id} value={r.id}>
											{r.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">Darslar o'tkaziladigan xonani belgilang</p>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium">Holat</Label>
							<div className="flex items-center space-x-2 h-10">
								<Checkbox
									id="is_active"
									checked={!!form.is_active}
									onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: Boolean(v) }))}
								/>
								<Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
									Sinf faol holda
								</Label>
							</div>
							<p className="text-xs text-muted-foreground">Nofaol sinflar tizimda ko'rinmaydi</p>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			<DialogFooter>
				<Button type="submit" disabled={submitting} className="min-w-[120px]">
					{submitting ? (
						<span className="flex items-center gap-2">
							<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Saqlanmoqda...
						</span>
					) : (
						"Saqlash"
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}

export default function ClassesPage() {
	const { currentBranch } = useAuth();
	const branchId = currentBranch?.branch_id;
	const qc = useQueryClient();

	// Filters and search state
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedYear, setSelectedYear] = React.useState<string>("all");
	const [selectedGrade, setSelectedGrade] = React.useState<string>("all");

	const { data: years = [], isLoading: yearsLoading, error: yearsError } = useQuery<AcademicYear[]>({
		queryKey: ["academicYears", branchId],
		queryFn: () => schoolApi.getAcademicYears(branchId!),
		enabled: !!branchId,
	});

	const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useQuery<Room[]>({
		queryKey: ["rooms", branchId],
		queryFn: () => schoolApi.getRooms(branchId!),
		enabled: !!branchId,
	});

	const { data: classes = [], isLoading, error } = useQuery<Class[]>({
		queryKey: ["classes", branchId, searchQuery, selectedYear, selectedGrade],
		queryFn: () => schoolApi.getClasses(branchId!, {
			search: searchQuery || undefined,
			academic_year_id: selectedYear !== "all" ? selectedYear : undefined,
			grade_level: selectedGrade !== "all" ? Number(selectedGrade) : undefined,
		}),
		enabled: !!branchId,
	});

	const createMutation = useMutation({
		mutationFn: (payload: CreateClassRequest) => schoolApi.createClass(branchId!, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classes", branchId] }),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<CreateClassRequest> }) =>
			schoolApi.updateClass(branchId!, id, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classes", branchId] }),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => schoolApi.deleteClass(branchId!, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classes", branchId] }),
	});

	const [open, setOpen] = React.useState(false);
	const [editId, setEditId] = React.useState<string | null>(null);
	const [deleteConfirm, setDeleteConfirm] = React.useState<{ open: boolean; id?: string; name?: string; studentsCount?: number }>({ open: false });

	const editing = editId ? classes.find((c) => c.id === editId) : undefined;

	// Calculate stats
	const stats = React.useMemo(() => {
		const totalClasses = classes.length;
		const activeClasses = classes.filter(c => c.is_active).length;
		const totalStudents = classes.reduce((sum, c) => sum + (c.current_students_count || 0), 0);
		const totalCapacity = classes.reduce((sum, c) => sum + (c.max_students || 0), 0);
		return { totalClasses, activeClasses, totalStudents, totalCapacity };
	}, [classes]);

	const hasActiveFilters = searchQuery || selectedYear !== "all" || selectedGrade !== "all";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Sinflar</h1>
					<p className="text-muted-foreground mt-1">Barcha sinflarni boshqaring va monitoring qiling</p>
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button onClick={() => setEditId(null)} size="lg">
							<Plus className="w-4 h-4 mr-2" /> Yangi sinf
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-xl">{editId ? "Sinfni tahrirlash" : "Yangi sinf yaratish"}</DialogTitle>
							<p className="text-sm text-muted-foreground">Sinf ma'lumotlarini to'ldiring</p>
						</DialogHeader>
						<Separator className="my-2" />
						{yearsLoading || roomsLoading ? (
							<div className="p-8 text-center">
								<div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
								<p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
							</div>
						) : yearsError || roomsError ? (
							<div className="p-8 text-center text-red-600">
								<p className="text-sm">Ma'lumotlarni yuklashda xatolik. Iltimos, keyinroq qayta urinib ko'ring.</p>
							</div>
						) : (
							<ClassForm
								branchId={branchId!}
								initial={
									editId
										? {
												branch: editing?.branch,
												academic_year: editing?.academic_year,
												name: editing?.name,
												grade_level: editing?.grade_level,
												section: editing?.section,
												max_students: editing?.max_students,
												room: editing?.room,
												is_active: editing?.is_active,
												class_teacher: editing?.class_teacher,
											}
										: undefined
								}
								years={years}
								rooms={rooms}
								submitting={createMutation.isPending || updateMutation.isPending}
								onSubmit={(data) => {
									if (editId) {
										updateMutation.mutate(
											{ id: editId, data },
											{ onSuccess: () => setOpen(false) }
										);
									} else {
										createMutation.mutate(data as CreateClassRequest, {
											onSuccess: () => setOpen(false),
										});
									}
								}}
							/>
						)}
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Jami Sinflar</CardTitle>
						<GraduationCap className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalClasses}</div>
						<p className="text-xs text-muted-foreground mt-1">{stats.activeClasses} faol</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Jami O'quvchilar</CardTitle>
						<Users className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalStudents}</div>
						<p className="text-xs text-muted-foreground mt-1">Barcha sinflarda</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">O'rtacha To'ldirilish</CardTitle>
						<Building2 className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.totalCapacity > 0 ? Math.round((stats.totalStudents / stats.totalCapacity) * 100) : 0}%
						</div>
						<p className="text-xs text-muted-foreground mt-1">{stats.totalStudents}/{stats.totalCapacity} joy</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Akademik Yillar</CardTitle>
						<GraduationCap className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{years.length}</div>
						<p className="text-xs text-muted-foreground mt-1">Registrlangan</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Filter va Qidiruv</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="md:col-span-2">
							<Label className="text-xs text-muted-foreground">Qidiruv</Label>
							<div className="relative mt-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									className="pl-10"
									placeholder="Sinf nomi, o'qituvchi..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Akademik Yil</Label>
							<Select value={selectedYear} onValueChange={setSelectedYear}>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Barchasi</SelectItem>
									{years.map((y) => (
										<SelectItem key={y.id} value={y.id}>
											{y.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Sinf Darajasi</Label>
							<Select value={selectedGrade} onValueChange={setSelectedGrade}>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Barchasi</SelectItem>
									{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
										<SelectItem key={g} value={String(g)}>
											{g}-sinf
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{hasActiveFilters && (
						<Button
							variant="outline"
							size="sm"
							className="mt-4"
							onClick={() => {
								setSearchQuery("");
								setSelectedYear("all");
								setSelectedGrade("all");
							}}
						>
							<FilterX className="w-4 h-4 mr-2" />
							Filterlarni tozalash
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Classes Grid */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="flex flex-col items-center gap-3">
						<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
						<p className="text-sm text-muted-foreground">Sinflar yuklanmoqda...</p>
					</div>
				</div>
			) : error ? (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-red-600">Sinflarni yuklashda xatolik yoki ruxsat yo'q.</p>
					</CardContent>
				</Card>
			) : classes.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
						<h3 className="text-lg font-semibold mb-2">Hech qanday sinf topilmadi</h3>
						<p className="text-sm text-muted-foreground mb-6">
							{hasActiveFilters
								? "Filter sozlamalarini o'zgartiring yoki yangisini qo'shing"
								: "Birinchi sinfni yaratish uchun yuqoridagi tugmani bosing"}
						</p>
						{!hasActiveFilters && (
							<Button onClick={() => setOpen(true)}>
								<Plus className="w-4 h-4 mr-2" /> Yangi sinf yaratish
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{classes.map((cls) => (
						<Card key={cls.id} className="hover:shadow-lg transition-shadow duration-200">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-xl">{cls.name}</CardTitle>
										<CardDescription className="mt-1">{cls.academic_year_name}</CardDescription>
									</div>
									<Badge variant={cls.is_active ? "default" : "secondary"}>
										{cls.is_active ? "Faol" : "NoFaol"}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<p className="text-muted-foreground text-xs">Daraja</p>
										<p className="font-medium">{cls.grade_level}{cls.section ? `-${cls.section}` : ""}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Xona</p>
										<p className="font-medium truncate">{cls.room_name || "-"}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">O'quvchilar</p>
										<p className="font-medium">{cls.current_students_count || 0} / {cls.max_students}</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">To'ldirilish</p>
										<div className="flex items-center gap-2">
											<div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div
													className="h-full bg-blue-600 rounded-full transition-all"
													style={{
														width: `${cls.max_students > 0 ? ((cls.current_students_count || 0) / cls.max_students) * 100 : 0}%`,
													}}
												/>
											</div>
											<span className="text-xs font-medium">
												{cls.max_students > 0 ? Math.round(((cls.current_students_count || 0) / cls.max_students) * 100) : 0}%
											</span>
										</div>
									</div>
								</div>
								
								{cls.class_teacher_name && (
									<div className="pt-2 border-t">
										<p className="text-xs text-muted-foreground">Sinf rahbari</p>
										<p className="text-sm font-medium truncate">{cls.class_teacher_name}</p>
									</div>
								)}

								<Separator />
								
								<div className="flex items-center gap-2 pt-1">
									<Link href={`/branch-admin/classes/${cls.id}`} className="flex-1">
										<Button variant="outline" size="sm" className="w-full">
											<Eye className="w-4 h-4 mr-2" />
											Ko'rish
										</Button>
									</Link>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setEditId(cls.id);
											setOpen(true);
										}}
									>
										<Pencil className="w-4 h-4" />
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setDeleteConfirm({ 
											open: true, 
											id: cls.id, 
											name: cls.name,
											studentsCount: cls.current_students_count || 0
										})}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
				))}
			</div>
		)}

		{/* Delete Confirmation Dialog */}
		<AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
							<AlertTriangle className="w-6 h-6 text-red-600" />
						</div>
						<div>
							<AlertDialogTitle className="text-xl">Sinfni o'chirish</AlertDialogTitle>
						</div>
					</div>
					<div className="space-y-3">
						<AlertDialogDescription className="font-medium text-foreground text-base">
							<span className="font-bold text-red-600">&quot;{deleteConfirm.name}&quot;</span> sinfni butunlay o'chirmoqchimisiz?
						</AlertDialogDescription>
						{(deleteConfirm.studentsCount ?? 0) > 0 && (
							<div className="bg-orange-50 border border-orange-200 rounded-md p-3">
								<span className="text-sm text-orange-800">
									⚠️ <span className="font-semibold">Diqqat:</span> Ushbu sinfda <span className="font-bold">{deleteConfirm.studentsCount}</span> ta o'quvchi mavjud.
								</span>
							</div>
						)}
						<div className="text-sm text-muted-foreground">
							Bu amal qaytarib bo&apos;lmaydi. Sinf bilan bog&apos;liq barcha ma&apos;lumotlar o&apos;chiriladi.
						</div>
					</div>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2 sm:gap-0">
					<AlertDialogCancel onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}>
						Bekor qilish
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (deleteConfirm.id) {
								deleteMutation.mutate(deleteConfirm.id);
							}
							setDeleteConfirm((prev) => ({ ...prev, open: false }));
						}}
						className="bg-red-600 hover:bg-red-700 text-white"
						disabled={deleteMutation.isPending}
					>
						{deleteMutation.isPending ? (
							<span className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								O&apos;chirilmoqda...
							</span>
						) : (
							"Ha, o'chirish"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
);
}