"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import type { Class, CreateClassRequest, AcademicYear, Room } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Search, Users, GraduationCap, BookOpen, X } from "lucide-react";

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
					<Label htmlFor="name">
						Sinf nomi <span className="text-red-500">*</span>
					</Label>
					<Input
						id="name"
						placeholder="5-A sinf"
						value={form.name || ""}
						onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="academic_year">
						Akademik yil <span className="text-red-500">*</span>
					</Label>
					<Select
						value={String(form.academic_year || "")}
						onValueChange={(v) => setForm((s) => ({ ...s, academic_year: v }))}
					>
						<SelectTrigger id="academic_year">
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
				</div>
				<div className="space-y-2">
					<Label htmlFor="grade_level">
						Sinf darajasi <span className="text-red-500">*</span>
					</Label>
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
					<Label htmlFor="max_students">
						Maks. o'quvchilar <span className="text-red-500">*</span>
					</Label>
					<Input
						id="max_students"
						type="number"
						placeholder="30"
						value={String(form.max_students ?? "")}
						onChange={(e) => setForm((s) => ({ ...s, max_students: Number(e.target.value) }))}
						min={1}
						max={100}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="room">Dars xonasi</Label>
					<Select
						value={String(form.room || "")}
						onValueChange={(v) => setForm((s) => ({ ...s, room: v }))}
						disabled={rooms.length === 0}
					>
						<SelectTrigger id="room">
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
				</div>
				<div className="space-y-2">
					<Label>Holat</Label>
					<div className="flex items-center gap-2 h-10">
						<Checkbox
							id="is_active"
							checked={!!form.is_active}
							onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: Boolean(v) }))}
						/>
						<Label htmlFor="is_active" className="font-normal cursor-pointer">
							Faol sinf
						</Label>
					</div>
				</div>
			</div>

			<Separator />

			<DialogFooter>
				<Button type="submit" disabled={submitting}>
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

	const [search, setSearch] = React.useState("");
	const [selectedYear, setSelectedYear] = React.useState<string>("all");
	const [selectedGrade, setSelectedGrade] = React.useState<string>("all");
	const [open, setOpen] = React.useState(false);
	const [editId, setEditId] = React.useState<string | null>(null);
	const [deleteConfirm, setDeleteConfirm] = React.useState<{
		open: boolean;
		id?: string;
		name?: string;
		studentsCount?: number;
	}>({ open: false });

	const { data: years = [], isLoading: yearsLoading } = useQuery<AcademicYear[]>({
		queryKey: ["academicYears", branchId],
		queryFn: () => schoolApi.getAcademicYears(branchId!),
		enabled: !!branchId,
	});

	const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
		queryKey: ["rooms", branchId],
		queryFn: () => schoolApi.getRooms(branchId!),
		enabled: !!branchId,
	});

	const { data: classes = [], isLoading, error } = useQuery<Class[]>({
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

	const editing = editId ? classes.find((c) => c.id === editId) : undefined;

	const stats = React.useMemo(() => ({
		total: classes.length,
		active: classes.filter((c) => c.is_active).length,
		students: classes.reduce((s, c) => s + (c.current_students_count || 0), 0),
		capacity: classes.reduce((s, c) => s + (c.max_students || 0), 0),
	}), [classes]);

	const hasFilters = search || selectedYear !== "all" || selectedGrade !== "all";

	return (
		<div className="space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Sinflar</h1>
					<p className="text-sm text-muted-foreground mt-0.5">Barcha sinflar va o'quvchilar</p>
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button onClick={() => setEditId(null)}>
							<Plus className="w-4 h-4 mr-2" /> Yangi sinf
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>{editId ? "Sinfni tahrirlash" : "Yangi sinf"}</DialogTitle>
						</DialogHeader>
						<Separator />
						{yearsLoading || roomsLoading ? (
							<div className="py-8 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
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

			{/* Stats Strip */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">Jami sinflar</p>
								<p className="text-2xl font-bold mt-1">{stats.total}</p>
								<p className="text-xs text-muted-foreground">{stats.active} faol</p>
							</div>
							<GraduationCap className="w-8 h-8 text-muted-foreground/40" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">O'quvchilar</p>
								<p className="text-2xl font-bold mt-1">{stats.students}</p>
								<p className="text-xs text-muted-foreground">{stats.capacity} joy</p>
							</div>
							<Users className="w-8 h-8 text-muted-foreground/40" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">To'ldirilish</p>
								<p className="text-2xl font-bold mt-1">
									{stats.capacity > 0 ? Math.round((stats.students / stats.capacity) * 100) : 0}%
								</p>
								<p className="text-xs text-muted-foreground">{stats.students}/{stats.capacity}</p>
							</div>
							<BookOpen className="w-8 h-8 text-muted-foreground/40" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">Akademik yillar</p>
								<p className="text-2xl font-bold mt-1">{years.length}</p>
								<p className="text-xs text-muted-foreground">Faol yillar</p>
							</div>
							<GraduationCap className="w-8 h-8 text-muted-foreground/40" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder="Sinf nomini qidiring..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select value={selectedYear} onValueChange={setSelectedYear}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="O'quv yili" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha yillar</SelectItem>
						{years.map((y) => (
							<SelectItem key={y.id} value={y.id}>
								{y.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={selectedGrade} onValueChange={setSelectedGrade}>
					<SelectTrigger className="w-36">
						<SelectValue placeholder="Daraja" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha daraja</SelectItem>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
							<SelectItem key={g} value={String(g)}>
								{g}-sinf
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{hasFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSearch("");
							setSelectedYear("all");
							setSelectedGrade("all");
						}}
					>
						<X className="w-4 h-4 mr-1" /> Tozalash
					</Button>
				)}
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : error ? (
				<Card>
					<CardContent className="py-12 text-center text-sm text-red-600">
						Sinflarni yuklashda xatolik yoki ruxsat yo'q.
					</CardContent>
				</Card>
			) : classes.length === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
						<p className="font-medium mb-1">Sinflar topilmadi</p>
						<p className="text-sm text-muted-foreground mb-4">
							{hasFilters ? "Boshqa filter qiymatlarini sinab ko'ring" : "Yangi sinf yaratish uchun yuqoridagi tugmani bosing"}
						</p>
						{!hasFilters && (
							<Button size="sm" onClick={() => setOpen(true)}>
								<Plus className="w-4 h-4 mr-2" /> Yangi sinf
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Sinf nomi</TableHead>
								<TableHead>O'quv yili</TableHead>
								<TableHead className="w-20 text-center">Daraja</TableHead>
								<TableHead>Xona</TableHead>
								<TableHead>O'quvchilar</TableHead>
								<TableHead>Sinf rahbari</TableHead>
								<TableHead className="w-24 text-center">Holat</TableHead>
								<TableHead className="w-32"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{classes.map((cls) => {
								const fill = cls.max_students > 0
									? Math.round(((cls.current_students_count || 0) / cls.max_students) * 100)
									: 0;
								return (
									<TableRow key={cls.id} className="group">
										<TableCell className="font-medium">{cls.name}</TableCell>
										<TableCell className="text-muted-foreground text-sm">{cls.academic_year_name}</TableCell>
										<TableCell className="text-center">
											<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
												{cls.grade_level}
											</span>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">{cls.room_name || "—"}</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{cls.current_students_count || 0}/{cls.max_students}
												</span>
												<div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
													<div
														className={`h-full rounded-full ${fill >= 90 ? "bg-red-500" : fill >= 70 ? "bg-amber-500" : "bg-green-500"}`}
														style={{ width: `${fill}%` }}
													/>
												</div>
												<span className="text-xs text-muted-foreground">{fill}%</span>
											</div>
										</TableCell>
										<TableCell className="text-sm">{cls.class_teacher_name || "—"}</TableCell>
										<TableCell className="text-center">
											<Badge variant={cls.is_active ? "default" : "secondary"} className="text-xs">
												{cls.is_active ? "Faol" : "Nofaol"}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 justify-end">
												<Link href={`/school/classes/${cls.id}`}>
													<Button variant="ghost" size="icon" className="h-8 w-8">
														<Eye className="w-4 h-4" />
													</Button>
												</Link>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => {
														setEditId(cls.id);
														setOpen(true);
													}}
												>
													<Pencil className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
													onClick={() =>
														setDeleteConfirm({
															open: true,
															id: cls.id,
															name: cls.name,
															studentsCount: cls.current_students_count || 0,
														})
													}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Card>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				open={deleteConfirm.open}
				onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
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
										<span>⚠️ Ushbu sinfda <strong>{deleteConfirm.studentsCount}</strong> ta o'quvchi mavjud.</span>
									</div>
								)}
								<p className="text-sm">Bu amal qaytarib bo'lmaydi.</p>
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
