"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import type { Class, CreateClassRequest, AcademicYear, Room } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

function ClassForm({
	initial,
	years,
	rooms,
	onSubmit,
	submitting,
}: {
	initial?: Partial<CreateClassRequest>;
	years: AcademicYear[];
	rooms: Room[];
	onSubmit: (data: CreateClassRequest | Partial<CreateClassRequest>) => void;
	submitting: boolean;
}) {
	const [form, setForm] = React.useState<Partial<CreateClassRequest>>({
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
			className="space-y-4"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label>Akademik yil</Label>
					<Select
						value={String(form.academic_year || "")}
						onValueChange={(v) => setForm((s) => ({ ...s, academic_year: v }))}
					>
						<SelectTrigger className="mt-1" aria-label="Akademik yil">
							<SelectValue placeholder="Akademik yil tanlang" />
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
				<div>
					<Label>Xona</Label>
					<Select
						value={String(form.room || "")}
						onValueChange={(v) => setForm((s) => ({ ...s, room: v }))}
					>
						<SelectTrigger className="mt-1" aria-label="Xona">
							<SelectValue placeholder="Xona tanlang" />
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
				<div>
					<Label>Nomi</Label>
					<Input
						className="mt-1"
						value={form.name || ""}
						onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
						required
					/>
				</div>
				<div>
					<Label>Sinf darajasi</Label>
					<Input
						type="number"
						className="mt-1"
						value={String(form.grade_level ?? "")}
						onChange={(e) => setForm((s) => ({ ...s, grade_level: Number(e.target.value) }))}
						min={1}
						required
					/>
				</div>
				<div>
					<Label>Bo'lim (A/B/...)</Label>
					<Input
						className="mt-1"
						value={form.section || ""}
						onChange={(e) => setForm((s) => ({ ...s, section: e.target.value }))}
					/>
				</div>
				<div>
					<Label>Maks o'quvchi</Label>
					<Input
						type="number"
						className="mt-1"
						value={String(form.max_students ?? "")}
						onChange={(e) => setForm((s) => ({ ...s, max_students: Number(e.target.value) }))}
						min={1}
						required
					/>
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<Checkbox
					id="is_active"
					checked={!!form.is_active}
					onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: Boolean(v) }))}
				/>
				<Label htmlFor="is_active">Faol</Label>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={submitting}>
					{submitting ? "Saqlanmoqda..." : "Saqlash"}
				</Button>
			</DialogFooter>
		</form>
	);
}

export default function ClassesPage() {
	const { currentBranch } = useAuth();
	const branchId = currentBranch?.branch_id;
	const qc = useQueryClient();

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
		queryKey: ["classes", branchId],
		queryFn: () => schoolApi.getClasses(branchId!),
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

	const editing = editId ? classes.find((c) => c.id === editId) : undefined;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Sinflar</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button onClick={() => setEditId(null)}>
							<Plus className="w-4 h-4 mr-2" /> Yangi sinf
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-xl">
						<DialogHeader>
							<DialogTitle>{editId ? "Sinfni tahrirlash" : "Yangi sinf"}</DialogTitle>
						</DialogHeader>
						<Separator className="my-2" />
						{yearsLoading || roomsLoading ? (
							<div className="p-4 text-sm text-muted-foreground">Yuklanmoqda...</div>
						) : yearsError || roomsError ? (
							<div className="p-4 text-sm text-red-600">
								Ma'lumotlarni yuklashda xatolik. Iltimos, keyinroq qayta urinib ko'ring.
							</div>
						) : (
							<ClassForm
								initial={
									editId
										? {
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

			<Card>
				<CardHeader>
					<CardTitle>Sinflar ro'yxati</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="p-4 text-sm text-muted-foreground">Yuklanmoqda...</div>
					) : error ? (
						<div className="p-4 text-sm text-red-600">
							Sinflarni yuklashda xatolik yoki ruxsat yo'q.
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nomi</TableHead>
										<TableHead>Daraja</TableHead>
										<TableHead>Bo'lim</TableHead>
										<TableHead>Akademik yil</TableHead>
										<TableHead>Xona</TableHead>
										<TableHead>O'quvchilar</TableHead>
										<TableHead>Holat</TableHead>
										<TableHead className="w-40">Amallar</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{classes.map((c) => (
										<TableRow key={c.id}>
											<TableCell className="font-medium">{c.name}</TableCell>
											<TableCell>{c.grade_level}</TableCell>
											<TableCell>{c.section || "-"}</TableCell>
											<TableCell>{c.academic_year_name}</TableCell>
											<TableCell>{c.room_name || "-"}</TableCell>
											<TableCell>{c.current_students_count}</TableCell>
											<TableCell>
												<span
													className={`px-2 py-1 text-xs rounded ${
														c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
													}`}
												>
													{c.is_active ? "Faol" : "NoFaol"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Link href={`/branch-admin/classes/${c.id}`} className="inline-flex">
														<Button variant="outline" size="icon" aria-label="Ko'rish">
															<Eye className="w-4 h-4" />
														</Button>
													</Link>
													<Button
														variant="outline"
														size="icon"
														aria-label="Tahrirlash"
														onClick={() => {
															setEditId(c.id);
															setOpen(true);
														}}
													>
														<Pencil className="w-4 h-4" />
													</Button>
													<Button
														variant="destructive"
														size="icon"
														aria-label="O'chirish"
														onClick={() => deleteMutation.mutate(c.id)}
													>
														<Trash2 className="w-4 h-4" />
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
		</div>
	);
}

