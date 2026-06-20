"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { schoolApi } from "@/lib/api/school";
import { branchApi, type MembershipDetail } from "@/lib/api/branch";
import type { Class, ClassSubject, ClassStudent, Subject } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
	Plus, Trash2, Search, X, UserPlus, Phone, Wallet,
	ArrowLeft, ArrowRightLeft, Users, BookOpen, TrendingUp, TrendingDown, AlertTriangle, Archive, ArchiveRestore
} from "lucide-react";

function formatCurrency(amount: number) {
	return amount.toLocaleString("uz-UZ") + " so'm";
}

export default function ClassDetailPage() {
	const params = useParams<{ id: string }>();
	const classId = params?.id;
	const { currentBranch } = useAuth();
	const branchId = currentBranch?.branch_id;
	const qc = useQueryClient();

	// Queries
	const { data: cls, isLoading: classLoading, error: classError } = useQuery<Class | undefined>({
		queryKey: ["class", branchId, classId],
		queryFn: () => schoolApi.getClass(branchId!, classId!),
		enabled: !!branchId && !!classId,
	});

	const { data: subjects = [] } = useQuery<Subject[]>({
		queryKey: ["subjects", branchId],
		queryFn: () => schoolApi.getSubjects(branchId!),
		enabled: !!branchId,
	});

	const { data: teachersData } = useQuery({
		queryKey: ["teachers", branchId],
		queryFn: () => branchApi.getMemberships(branchId!, { role: "teacher", is_active: true, page_size: 100 }),
		enabled: !!branchId,
	});
	const teachers = teachersData?.results || [];

	const { data: classSubjects = [], isLoading: csLoading } = useQuery<ClassSubject[]>({
		queryKey: ["classSubjects", classId],
		queryFn: () => schoolApi.getClassSubjects(classId!),
		enabled: !!classId,
	});

	const { data: classStudents = [], isLoading: cstLoading } = useQuery<ClassStudent[]>({
		queryKey: ["classStudents", classId],
		queryFn: () => schoolApi.getClassStudents(classId!),
		enabled: !!classId,
	});

	// Mutations
	const addSubjectMutation = useMutation({
		mutationFn: (payload: { subject: string; hours_per_week: number; is_active: boolean }) =>
			schoolApi.addSubjectToClass(classId!, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classSubjects", classId] }),
	});

	const removeSubjectMutation = useMutation({
		mutationFn: (id: string) => schoolApi.removeSubjectFromClass(classId!, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classSubjects", classId] }),
	});

	const addStudentMutation = useMutation({
		mutationFn: (payload: { membership: string; is_active: boolean; notes?: string }) =>
			schoolApi.addStudentToClass(classId!, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classStudents", classId] });
			qc.invalidateQueries({ queryKey: ["availableStudents", branchId, classId] });
			qc.invalidateQueries({ queryKey: ["class", branchId, classId] });
		},
	});

	const removeStudentMutation = useMutation({
		mutationFn: (studentId: string) => schoolApi.removeStudentFromClass(classId!, studentId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classStudents", classId] });
			qc.invalidateQueries({ queryKey: ["availableStudents", branchId, classId] });
			qc.invalidateQueries({ queryKey: ["class", branchId, classId] });
		},
	});

	const transferStudentMutation = useMutation({
		mutationFn: (payload: { membershipId: string; targetClassId: string; notes?: string }) =>
			schoolApi.transferStudent(classId!, payload.membershipId, {
				target_class_id: payload.targetClassId,
				notes: payload.notes,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classStudents", classId] });
			qc.invalidateQueries({ queryKey: ["classStudents"] });
			qc.invalidateQueries({ queryKey: ["availableStudents"] });
		},
	});

	const archiveMutation = useMutation({
		mutationFn: () => schoolApi.archiveClass(branchId!, classId!),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["class", branchId, classId] }),
	});

	const unarchiveMutation = useMutation({
		mutationFn: () => schoolApi.unarchiveClass(branchId!, classId!),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["class", branchId, classId] }),
	});

	// UI state
	const [openAddSubject, setOpenAddSubject] = React.useState(false);
	const [openAddStudent, setOpenAddStudent] = React.useState(false);
	const [studentSearch, setStudentSearch] = React.useState("");
	const debouncedStudentSearch = useDebounce(studentSearch, 300);
	const [deleteConfirm, setDeleteConfirm] = React.useState<{
		open: boolean;
		type: "subject" | "student";
		id?: string;
		name?: string;
	}>({ open: false, type: "subject" });
	const [transferDialog, setTransferDialog] = React.useState<{
		open: boolean;
		membershipId?: string;
		studentName?: string;
	}>({ open: false });
	const [transferForm, setTransferForm] = React.useState<{ targetClassId?: string; notes?: string }>({});

	const [subjectForm, setSubjectForm] = React.useState<{
		subject?: string;
		teacher?: string;
		hours_per_week?: number;
		is_active?: boolean;
	}>({ hours_per_week: 2, is_active: true });

	const [studentForm, setStudentForm] = React.useState<{
		students: MembershipDetail[];
		is_active?: boolean;
		notes?: string;
	}>({ students: [], is_active: true, notes: "" });

	const { data: availableStudents = [], isLoading: smLoading } = useQuery<MembershipDetail[]>({
		queryKey: ["availableStudents", branchId, classId, debouncedStudentSearch],
		queryFn: () =>
			schoolApi.getAvailableStudents(branchId!, classId!, {
				search: debouncedStudentSearch || undefined,
				ordering: "user_name",
				page_size: 50,
			}),
		enabled: !!branchId && !!classId && openAddStudent,
	});

	const { data: allClasses = [] } = useQuery<Class[]>({
		queryKey: ["classes", branchId],
		queryFn: () => schoolApi.getClasses(branchId!, { page_size: 100, is_active: true }),
		enabled: !!branchId && transferDialog.open,
	});

	// Finance stats from classStudents
	const financeStats = React.useMemo(() => {
		const positive = classStudents.filter((s) => s.student_balance > 0);
		const negative = classStudents.filter((s) => s.student_balance < 0);
		const zero = classStudents.filter((s) => s.student_balance === 0);
		const totalDebt = negative.reduce((sum, s) => sum + Math.abs(s.student_balance), 0);
		const totalPrepaid = positive.reduce((sum, s) => sum + s.student_balance, 0);
		return { positive, negative, zero, totalDebt, totalPrepaid };
	}, [classStudents]);

	if (classLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (classError || !cls) {
		return (
			<Card>
				<CardContent className="py-12 text-center text-sm text-red-600">
					Sinfni yuklashda xatolik yoki ruxsat yo'q.
				</CardContent>
			</Card>
		);
	}

	const fill = cls.max_students > 0
		? Math.round(((cls.current_students_count || 0) / cls.max_students) * 100)
		: 0;

	return (
		<div className="space-y-5">
			{/* Back + Header */}
			<div className="flex items-start gap-4">
				<Link href="/school/classes">
					<Button variant="ghost" size="icon" className="mt-0.5">
						<ArrowLeft className="w-4 h-4" />
					</Button>
				</Link>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold">{cls.name}</h1>
						<Badge variant={cls.is_active ? "default" : "secondary"}>
							{cls.is_active ? "Faol" : "Nofaol"}
						</Badge>
						{cls.is_archived && (
							<Badge variant="outline" className="text-amber-600 border-amber-300">
								Arxivlangan
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground mt-0.5">{cls.academic_year_name}</p>
				</div>
				{cls.is_archived ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => unarchiveMutation.mutate()}
						disabled={unarchiveMutation.isPending}
					>
						<ArchiveRestore className="w-4 h-4 mr-2" />
						{unarchiveMutation.isPending ? "..." : "Arxivdan chiqarish"}
					</Button>
				) : (
					<Button
						variant="outline"
						size="sm"
						className="text-amber-600 border-amber-300 hover:bg-amber-50"
						onClick={() => archiveMutation.mutate()}
						disabled={archiveMutation.isPending}
					>
						<Archive className="w-4 h-4 mr-2" />
						{archiveMutation.isPending ? "..." : "Arxivlash"}
					</Button>
				)}
			</div>

			{/* Info Strip */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Sinf darajasi</p>
						<p className="text-3xl font-bold text-primary mt-1">{cls.grade_level}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">O'quvchilar</p>
						<p className="text-3xl font-bold text-green-600 mt-1">
							{cls.current_students_count || 0}
						</p>
						<div className="flex items-center gap-2 mt-1">
							<div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
								<div
									className={`h-full rounded-full ${fill >= 90 ? "bg-red-500" : fill >= 70 ? "bg-amber-500" : "bg-green-500"}`}
									style={{ width: `${fill}%` }}
								/>
							</div>
							<span className="text-xs text-muted-foreground">{fill}%</span>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Sinf rahbari</p>
						<p className="text-sm font-semibold mt-1 line-clamp-2">{cls.class_teacher_name || "—"}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Dars xonasi</p>
						<p className="text-sm font-semibold mt-1">{cls.room_name || "—"}</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="students">
				<TabsList>
					<TabsTrigger value="students">
						<Users className="w-4 h-4 mr-2" />
						O'quvchilar ({cls.current_students_count || 0})
					</TabsTrigger>
					<TabsTrigger value="subjects">
						<BookOpen className="w-4 h-4 mr-2" />
						Fanlar ({classSubjects.length})
					</TabsTrigger>
					<TabsTrigger value="finance">
						<Wallet className="w-4 h-4 mr-2" />
						Moliya
					</TabsTrigger>
				</TabsList>

				{/* ===== O'QUVCHILAR TAB ===== */}
				<TabsContent value="students" className="mt-4 space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">Sinfga qo'shilgan o'quvchilar</p>
						<Dialog open={openAddStudent} onOpenChange={setOpenAddStudent}>
							<DialogTrigger asChild>
								<Button size="sm">
									<UserPlus className="w-4 h-4 mr-2" /> O'quvchi qo'shish
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
								<DialogHeader>
									<DialogTitle>O'quvchilarni tanlash</DialogTitle>
									<p className="text-sm text-muted-foreground">Sinfga qo'shish uchun o'quvchilarni belgilang</p>
								</DialogHeader>
								<Separator />
								<div className="flex-1 overflow-hidden flex flex-col gap-4">
									{/* Search + selected tags */}
									<div className="space-y-2">
										<div className="relative flex flex-wrap items-center gap-1.5 min-h-10 border rounded-md px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-ring">
											<Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
											{studentForm.students.map((st) => (
												<span
													key={st.id}
													className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-primary/10 text-primary"
												>
													{st.user_name}
													<button
														onClick={() =>
															setStudentForm((s) => ({
																...s,
																students: s.students.filter((x) => x.id !== st.id),
															}))
														}
													>
														<X className="w-3 h-3" />
													</button>
												</span>
											))}
											<input
												type="text"
												className="flex-1 min-w-[100px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
												placeholder="Ism yoki telefon..."
												value={studentSearch}
												onChange={(e) => setStudentSearch(e.target.value)}
											/>
										</div>
										{studentForm.students.length > 0 && (
											<p className="text-xs text-muted-foreground">
												{studentForm.students.length} ta tanlandi
											</p>
										)}
									</div>

									{/* Student list */}
									<div className="flex-1 overflow-y-auto space-y-1">
										{smLoading ? (
											<div className="py-8 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
										) : availableStudents.length === 0 ? (
											<div className="py-8 text-center text-sm text-muted-foreground">
												O'quvchi topilmadi
											</div>
										) : (
											availableStudents.map((st) => {
												const selected = studentForm.students.some((s) => s.id === st.id);
												return (
													<button
														key={st.id}
														type="button"
														className={`w-full text-left p-3 rounded-md border transition-colors ${
															selected
																? "border-primary bg-primary/5"
																: "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
														}`}
														onClick={() =>
															setStudentForm((s) => ({
																...s,
																students: selected
																	? s.students.filter((x) => x.id !== st.id)
																	: [...s.students, st],
															}))
														}
													>
														<div className="flex items-center gap-3">
															<div
																className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
																	selected ? "bg-primary" : "bg-muted-foreground/40"
																}`}
															>
																{(st.user_name || "?").charAt(0).toUpperCase()}
															</div>
															<div className="flex-1 min-w-0">
																<p className="text-sm font-medium truncate">{st.user_name}</p>
																<p className="text-xs text-muted-foreground">{st.user_phone}</p>
															</div>
															<span className="text-xs text-green-600 font-medium">
																{formatCurrency(st.balance)}
															</span>
														</div>
													</button>
												);
											})
										)}
									</div>

									<div className="space-y-2 border-t pt-3">
										<div className="flex items-center gap-2">
											<Checkbox
												id="stu_is_active"
												checked={!!studentForm.is_active}
												onCheckedChange={(v) => setStudentForm((s) => ({ ...s, is_active: Boolean(v) }))}
											/>
											<Label htmlFor="stu_is_active" className="text-sm font-normal cursor-pointer">
												Faol sifatida qo'shish
											</Label>
										</div>
										<Input
											placeholder="Izoh (ixtiyoriy)"
											value={studentForm.notes || ""}
											onChange={(e) => setStudentForm((s) => ({ ...s, notes: e.target.value }))}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => {
											setOpenAddStudent(false);
											setStudentSearch("");
										}}
									>
										Bekor qilish
									</Button>
									<Button
										onClick={async () => {
											if (!studentForm.students.length) return;
											await Promise.all(
												studentForm.students.map((st) =>
													addStudentMutation.mutateAsync({
														membership: st.id,
														is_active: Boolean(studentForm.is_active ?? true),
														notes: studentForm.notes || undefined,
													})
												)
											);
											setOpenAddStudent(false);
											setStudentForm({ students: [], is_active: true, notes: "" });
											setStudentSearch("");
										}}
										disabled={addStudentMutation.isPending || !studentForm.students.length}
									>
										{addStudentMutation.isPending
											? "Qo'shilmoqda..."
											: `Qo'shish${studentForm.students.length > 0 ? ` (${studentForm.students.length})` : ""}`}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					{cstLoading ? (
						<div className="py-8 flex justify-center">
							<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						</div>
					) : classStudents.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<UserPlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
								<p className="text-sm font-medium mb-1">O'quvchilar yo'q</p>
								<p className="text-xs text-muted-foreground">Yuqoridagi tugma orqali o'quvchi qo'shing</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>O'quvchi</TableHead>
										<TableHead>Telefon</TableHead>
										<TableHead className="text-right">Balans</TableHead>
										<TableHead className="text-center w-24">Holat</TableHead>
										<TableHead className="w-36"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{classStudents.map((st) => (
										<TableRow key={st.id}>
											<TableCell className="font-medium">
												<Link
													href={`/school/students/${st.student_id}`}
													className="hover:text-indigo-600 hover:underline transition-colors"
												>
													{st.student_name}
												</Link>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Phone className="w-3 h-3" />
													{st.student_phone}
												</div>
											</TableCell>
											<TableCell className="text-right">
												<span
													className={`text-sm font-medium ${
														st.student_balance > 0
															? "text-green-600"
															: st.student_balance < 0
															? "text-red-600"
															: "text-muted-foreground"
													}`}
												>
													{formatCurrency(st.student_balance)}
												</span>
											</TableCell>
											<TableCell className="text-center">
												<Badge variant={st.is_active ? "default" : "secondary"} className="text-xs">
													{st.is_active ? "Faol" : "Nofaol"}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1 justify-end">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														title="Boshqa sinfga ko'chirish"
														onClick={() =>
															setTransferDialog({
																open: true,
																membershipId: st.membership_id,
																studentName: st.student_name,
															})
														}
													>
														<ArrowRightLeft className="w-3.5 h-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
														onClick={() =>
															setDeleteConfirm({
																open: true,
																type: "student",
																id: st.membership_id,
																name: st.student_name,
															})
														}
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Card>
					)}
				</TabsContent>

				{/* ===== FANLAR TAB ===== */}
				<TabsContent value="subjects" className="mt-4 space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">Sinf o'quv rejasi</p>
						<Dialog open={openAddSubject} onOpenChange={setOpenAddSubject}>
							<DialogTrigger asChild>
								<Button size="sm">
									<Plus className="w-4 h-4 mr-2" /> Fan qo'shish
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-lg">
								<DialogHeader>
									<DialogTitle>Sinfga fan qo'shish</DialogTitle>
								</DialogHeader>
								<Separator />
								{subjects.length === 0 ? (
									<div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
										Hozircha fanlar yo'q. Avval "Fanlar" bo'limidan fan qo'shing.
									</div>
								) : (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>
													Fan <span className="text-red-500">*</span>
												</Label>
												<Select
													value={subjectForm.subject}
													onValueChange={(v) => setSubjectForm((s) => ({ ...s, subject: v }))}
												>
													<SelectTrigger>
														<SelectValue placeholder="Fanni tanlang" />
													</SelectTrigger>
													<SelectContent>
														{subjects.map((s) => (
															<SelectItem key={s.id} value={s.id}>
																{s.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>O'qituvchi</Label>
												<Select
													value={subjectForm.teacher}
													onValueChange={(v) =>
														setSubjectForm((s) => ({ ...s, teacher: v === "_none" ? undefined : v }))
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Tanlang (ixtiyoriy)" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="_none">O'qituvchisiz</SelectItem>
														{teachers.map((t) => (
															<SelectItem key={t.id} value={t.id}>
																{t.user_name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>
													Haftalik soat <span className="text-red-500">*</span>
												</Label>
												<Input
													type="number"
													placeholder="2"
													value={String(subjectForm.hours_per_week ?? "")}
													onChange={(e) =>
														setSubjectForm((s) => ({ ...s, hours_per_week: Number(e.target.value) }))
													}
													min={1}
													max={20}
												/>
											</div>
											<div className="space-y-2">
												<Label>Holat</Label>
												<div className="flex items-center gap-2 h-10">
													<Checkbox
														id="sub_active"
														checked={!!subjectForm.is_active}
														onCheckedChange={(v) => setSubjectForm((s) => ({ ...s, is_active: Boolean(v) }))}
													/>
													<Label htmlFor="sub_active" className="font-normal cursor-pointer">
														Faol
													</Label>
												</div>
											</div>
										</div>
									</div>
								)}
								<Separator />
								<DialogFooter>
									<Button variant="outline" onClick={() => setOpenAddSubject(false)}>
										Bekor qilish
									</Button>
									<Button
										onClick={() => {
											if (!subjectForm.subject) return;
											addSubjectMutation.mutate(
												{
													subject: subjectForm.subject,
													teacher: subjectForm.teacher || undefined,
													hours_per_week: Number(subjectForm.hours_per_week ?? 2),
													is_active: Boolean(subjectForm.is_active ?? true),
												} as any,
												{
													onSuccess: () => {
														setOpenAddSubject(false);
														setSubjectForm({ hours_per_week: 2, is_active: true });
													},
												}
											);
										}}
										disabled={addSubjectMutation.isPending || !subjectForm.subject}
									>
										{addSubjectMutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					{csLoading ? (
						<div className="py-8 flex justify-center">
							<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						</div>
					) : classSubjects.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
								<p className="text-sm font-medium mb-1">Fanlar yo'q</p>
								<p className="text-xs text-muted-foreground">Yuqoridagi tugma orqali fan qo'shing</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fan</TableHead>
										<TableHead>O'qituvchi</TableHead>
										<TableHead className="text-center w-32">Haftalik soat</TableHead>
										<TableHead className="text-center w-24">Holat</TableHead>
										<TableHead className="w-16"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{classSubjects.map((cs) => (
										<TableRow key={cs.id}>
											<TableCell className="font-medium">{cs.subject_name}</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{cs.teacher_name || "—"}
											</TableCell>
											<TableCell className="text-center text-sm">{cs.hours_per_week}</TableCell>
											<TableCell className="text-center">
												<Badge variant={cs.is_active ? "default" : "secondary"} className="text-xs">
													{cs.is_active ? "Faol" : "Nofaol"}
												</Badge>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
													onClick={() =>
														setDeleteConfirm({
															open: true,
															type: "subject",
															id: cs.id,
															name: cs.subject_name,
														})
													}
												>
													<Trash2 className="w-3.5 h-3.5" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Card>
					)}
				</TabsContent>

				{/* ===== MOLIYA TAB ===== */}
				<TabsContent value="finance" className="mt-4 space-y-4">
					{cstLoading ? (
						<div className="py-8 flex justify-center">
							<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						</div>
					) : (
						<>
							{/* Finance summary cards */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								<Card>
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-xs text-muted-foreground">Ijobiy balans</p>
											<TrendingUp className="w-4 h-4 text-green-600" />
										</div>
										<p className="text-2xl font-bold text-green-600">{financeStats.positive.length}</p>
										<p className="text-xs text-muted-foreground mt-1">
											{formatCurrency(financeStats.totalPrepaid)}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-xs text-muted-foreground">Sifr balans</p>
											<Users className="w-4 h-4 text-muted-foreground" />
										</div>
										<p className="text-2xl font-bold">{financeStats.zero.length}</p>
										<p className="text-xs text-muted-foreground mt-1">Hisob-kitob yo'q</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-xs text-muted-foreground">Qarzdorlar</p>
											<TrendingDown className="w-4 h-4 text-red-600" />
										</div>
										<p className="text-2xl font-bold text-red-600">{financeStats.negative.length}</p>
										<p className="text-xs text-muted-foreground mt-1">
											—{formatCurrency(financeStats.totalDebt)}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-xs text-muted-foreground">Jami o'quvchi</p>
											<Users className="w-4 h-4 text-muted-foreground" />
										</div>
										<p className="text-2xl font-bold">{classStudents.length}</p>
										<p className="text-xs text-muted-foreground mt-1">Sinfda jami</p>
									</CardContent>
								</Card>
							</div>

							{/* Debt warning */}
							{financeStats.negative.length > 0 && (
								<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
									<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-red-800">
											{financeStats.negative.length} ta o'quvchi qarzdor
										</p>
										<p className="text-xs text-red-700 mt-0.5">
											Jami qarz: {formatCurrency(financeStats.totalDebt)}
										</p>
									</div>
								</div>
							)}

							{/* Finance table sorted by balance */}
							{classStudents.length === 0 ? (
								<Card>
									<CardContent className="py-12 text-center text-sm text-muted-foreground">
										O'quvchilar qo'shilmagan
									</CardContent>
								</Card>
							) : (
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base">O'quvchilar moliyaviy holati</CardTitle>
									</CardHeader>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>O'quvchi</TableHead>
												<TableHead>Telefon</TableHead>
												<TableHead className="text-right">Balans</TableHead>
												<TableHead className="text-center w-28">Holat</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{[...classStudents]
												.sort((a, b) => a.student_balance - b.student_balance)
												.map((st) => (
													<TableRow key={st.id}>
														<TableCell className="font-medium">
															<Link
																href={`/school/students/${st.student_id}`}
																className="hover:text-indigo-600 hover:underline transition-colors"
															>
																{st.student_name}
															</Link>
														</TableCell>
														<TableCell className="text-sm text-muted-foreground">
															{st.student_phone}
														</TableCell>
														<TableCell className="text-right">
															<span
																className={`text-sm font-semibold ${
																	st.student_balance > 0
																		? "text-green-600"
																		: st.student_balance < 0
																		? "text-red-600"
																		: "text-muted-foreground"
																}`}
															>
																{st.student_balance < 0 ? "—" : ""}
																{formatCurrency(Math.abs(st.student_balance))}
															</span>
														</TableCell>
														<TableCell className="text-center">
															<Badge
																variant={
																	st.student_balance > 0
																		? "default"
																		: st.student_balance < 0
																		? "destructive"
																		: "secondary"
																}
																className="text-xs"
															>
																{st.student_balance > 0
																	? "To'langan"
																	: st.student_balance < 0
																	? "Qarzdor"
																	: "Nol"}
															</Badge>
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</Card>
							)}
						</>
					)}
				</TabsContent>
			</Tabs>

			{/* Delete Confirmation */}
			<AlertDialog
				open={deleteConfirm.open}
				onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{deleteConfirm.type === "subject" ? "Fanni olib tashlash" : "O'quvchini olib tashlash"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteConfirm.type === "subject"
								? `"${deleteConfirm.name}" fanini sinfdan olib tashlash. Bu amalni qaytarib bo'lmaydi.`
								: `"${deleteConfirm.name}" o'quvchisini sinfdan olib tashlash. Bu amalni qaytarib bo'lmaydi.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteConfirm.type === "subject" && deleteConfirm.id) {
									removeSubjectMutation.mutate(deleteConfirm.id);
								} else if (deleteConfirm.type === "student" && deleteConfirm.id) {
									removeStudentMutation.mutate(deleteConfirm.id);
								}
								setDeleteConfirm({ open: false, type: "subject" });
							}}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Transfer Dialog */}
			<Dialog
				open={transferDialog.open}
				onOpenChange={(v) =>
					setTransferDialog((s) => ({
						open: v,
						membershipId: v ? s.membershipId : undefined,
						studentName: v ? s.studentName : undefined,
					}))
				}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Boshqa sinfga ko'chirish</DialogTitle>
						<p className="text-sm text-muted-foreground">
							<span className="font-medium">{transferDialog.studentName}</span> ni qaysi sinfga ko'chirmoqchisiz?
						</p>
					</DialogHeader>
					<Separator />
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label>
								Yangi sinf <span className="text-red-500">*</span>
							</Label>
							<Select
								value={transferForm.targetClassId}
								onValueChange={(v) => setTransferForm((s) => ({ ...s, targetClassId: v }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Sinfni tanlang" />
								</SelectTrigger>
								<SelectContent>
									{allClasses
										.filter((c) => c.id && c.id !== classId && c.can_add_student)
										.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name} ({c.current_students_count}/{c.max_students})
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">Faqat bo'sh joyi bo'lgan sinflar</p>
						</div>
						<div className="space-y-2">
							<Label>Izoh</Label>
							<Input
								placeholder="Transfer sababi (ixtiyoriy)"
								value={transferForm.notes || ""}
								onChange={(e) => setTransferForm((s) => ({ ...s, notes: e.target.value }))}
							/>
						</div>
					</div>
					<Separator />
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setTransferDialog({ open: false });
								setTransferForm({});
							}}
						>
							Bekor qilish
						</Button>
						<Button
							onClick={async () => {
								if (!transferForm.targetClassId || !transferDialog.membershipId) return;
								await transferStudentMutation.mutateAsync({
									membershipId: transferDialog.membershipId,
									targetClassId: transferForm.targetClassId,
									notes: transferForm.notes,
								});
								setTransferDialog({ open: false });
								setTransferForm({});
							}}
							disabled={!transferForm.targetClassId || transferStudentMutation.isPending}
						>
							{transferStudentMutation.isPending ? "Ko'chirilmoqda..." : "Ko'chirish"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
