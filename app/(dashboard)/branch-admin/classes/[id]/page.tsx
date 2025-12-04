"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { schoolApi } from "@/lib/api/school";
import { branchApi, type MembershipDetail } from "@/lib/api/branch";
import type { Class, ClassSubject, ClassStudent, Subject, Student } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, X, UserPlus, User, Phone, Mail, Calendar, GraduationCap, Wallet, ArrowRightLeft } from "lucide-react";

export default function ClassDetailPage() {
	const params = useParams<{ id: string }>();
	const classId = params?.id;
	const { currentBranch } = useAuth();
	const branchId = currentBranch?.branch_id;
	const qc = useQueryClient();

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

	const { data: classSubjects = [], isLoading: csLoading, error: csError } = useQuery<ClassSubject[]>({
		queryKey: ["classSubjects", classId],
		queryFn: () => schoolApi.getClassSubjects(classId!),
		enabled: !!classId,
	});

	const { data: classStudents = [], isLoading: cstLoading, error: cstError } = useQuery<ClassStudent[]>({
		queryKey: ["classStudents", classId],
		queryFn: () => schoolApi.getClassStudents(classId!),
		enabled: !!classId,
	});

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
			// Available students cache'ni yangilash
			qc.invalidateQueries({ queryKey: ["availableStudents", branchId, classId] });
		},
	});

	const removeStudentMutation = useMutation({
		mutationFn: (studentId: string) => schoolApi.removeStudentFromClass(classId!, studentId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["classStudents", classId] });
			// Available students cache'ni yangilash
			qc.invalidateQueries({ queryKey: ["availableStudents", branchId, classId] });
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
			// Barcha sinflar uchun cache yangilanadi
			qc.invalidateQueries({ queryKey: ["classStudents"] });
			qc.invalidateQueries({ queryKey: ["availableStudents"] });
		},
	});

	const [openAddSubject, setOpenAddSubject] = React.useState(false);
	const [openAddStudent, setOpenAddStudent] = React.useState(false);
	const [studentSearch, setStudentSearch] = React.useState("");
	const debouncedStudentSearch = useDebounce(studentSearch, 300);
	const [deleteConfirm, setDeleteConfirm] = React.useState<{ open: boolean; type: 'subject' | 'student'; id?: string; name?: string }>({ open: false, type: 'subject' });
	const [transferDialog, setTransferDialog] = React.useState<{ open: boolean; membershipId?: string; studentName?: string }>({ open: false });
	const [transferForm, setTransferForm] = React.useState<{ targetClassId?: string; notes?: string }>({});

	const [subjectForm, setSubjectForm] = React.useState<{ subject?: string; teacher?: string; hours_per_week?: number; is_active?: boolean }>({
		subject: undefined,
		teacher: undefined,
		hours_per_week: 2,
		is_active: true,
	});

	const [studentForm, setStudentForm] = React.useState<{ students: MembershipDetail[]; is_active?: boolean; notes?: string }>({
		students: [],
		is_active: true,
		notes: "",
	});

	const { data: availableStudents = [], isLoading: smLoading, error: smError } = useQuery<MembershipDetail[]>({
		queryKey: ["availableStudents", branchId, classId, debouncedStudentSearch],
		queryFn: () => schoolApi.getAvailableStudents(branchId!, classId!, { search: debouncedStudentSearch || undefined, ordering: "user_name", page_size: 50 }),
		enabled: !!branchId && !!classId && openAddStudent,
	});

	const { data: allClasses = [] } = useQuery<Class[]>({
		queryKey: ["classes", branchId],
		queryFn: () => schoolApi.getClasses(branchId!, { page_size: 100, is_active: true }),
		enabled: !!branchId && transferDialog.open,
	});

	const [openStudentDetail, setOpenStudentDetail] = React.useState<{ open: boolean; classId?: string; membershipId?: string }>({ open: false });
	const { data: selectedStudent, isLoading: selLoading } = useQuery<ClassStudent | undefined>({
		queryKey: ["classStudent", openStudentDetail.classId, openStudentDetail.membershipId],
		queryFn: () => schoolApi.getClassStudent(openStudentDetail.classId!, openStudentDetail.membershipId!),
		enabled: !!openStudentDetail.classId && !!openStudentDetail.membershipId,
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Sinf ma'lumotlari</h1>
					<p className="text-muted-foreground mt-1">Sinf fanlari va o'quvchilarini boshqaring</p>
				</div>
			</div>

			{classLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="flex flex-col items-center gap-3">
						<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
						<p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
					</div>
				</div>
			) : classError ? (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-red-600">Sinfni olishda xatolik yoki ruxsat mavjud emas.</p>
					</CardContent>
				</Card>
			) : cls ? (
				<Card className="border-2">
					<CardHeader className="pb-4">
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-2xl">{cls.name}</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">{cls.academic_year_name}</p>
							</div>
							<div className={`px-3 py-1 rounded-full text-xs font-medium ${cls.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
								{cls.is_active ? "Faol" : "Nofaol"}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground uppercase tracking-wide">Sinf darajasi</div>
								<div className="text-2xl font-bold text-blue-600">{cls.grade_level}</div>
							</div>
							{cls.section && (
								<div className="space-y-1">
									<div className="text-xs text-muted-foreground uppercase tracking-wide">Bo'lim</div>
									<div className="text-2xl font-bold text-blue-600">{cls.section}</div>
								</div>
							)}
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground uppercase tracking-wide">O'quvchilar soni</div>
								<div className="text-2xl font-bold text-green-600">{cls.current_students_count || 0} / {cls.max_students || 0}</div>
							</div>
							{cls.class_teacher_name && (
								<div className="space-y-1 col-span-2">
									<div className="text-xs text-muted-foreground uppercase tracking-wide">Sinf rahbari</div>
									<div className="text-lg font-semibold">{cls.class_teacher_name}</div>
								</div>
							)}
							{cls.room_name && (
								<div className="space-y-1">
									<div className="text-xs text-muted-foreground uppercase tracking-wide">Dars xonasi</div>
									<div className="text-lg font-semibold">{cls.room_name}</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			) : null}

			{/* Subjects */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Sinf fanlari</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">Fanlar, o'qituvchilar va haftalik dars soatlari</p>
					</div>
					<Dialog open={openAddSubject} onOpenChange={setOpenAddSubject}>
						<DialogTrigger asChild>
							<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Fan qo'shish</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle className="text-xl">Sinfga fan qo'shish</DialogTitle>
								<p className="text-sm text-muted-foreground">Fan, o'qituvchi va haftalik dars soatlarini belgilang</p>
							</DialogHeader>
							<Separator className="my-2" />
							<div className="space-y-5">
								{subjects.length === 0 ? (
									<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
										<p className="text-sm text-yellow-800">
											⚠️ Hozircha fanlar mavjud emas. Avval fanlar sahifasidan fan qo'shing.
										</p>
									</div>
								) : (
									<>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label className="text-sm font-medium">
													Fan nomi <span className="text-red-500">*</span>
												</Label>
												<Select
													value={subjectForm.subject || ""}
													onValueChange={(v) => setSubjectForm((s) => ({ ...s, subject: v }))}
												>
													<SelectTrigger className="h-10">
														<SelectValue placeholder="Fanni tanlang..." />
													</SelectTrigger>
													<SelectContent>
														{subjects.map((s) => (
															<SelectItem key={s.id} value={s.id}>
																{s.name} {s.code && <span className="text-muted-foreground">({s.code})</span>}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<p className="text-xs text-muted-foreground">O'qitiladigan fanni belgilang</p>
											</div>

											<div className="space-y-2">
												<Label className="text-sm font-medium">
													O'qituvchi
												</Label>
												<Select
													value={subjectForm.teacher || ""}
													onValueChange={(v) => setSubjectForm((s) => ({ ...s, teacher: v }))}
												>
													<SelectTrigger className="h-10">
														<SelectValue placeholder="O'qituvchini tanlang..." />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">O'qituvchisiz</SelectItem>
														{teachers.map((t) => (
															<SelectItem key={t.id} value={t.id}>
																{t.user_name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<p className="text-xs text-muted-foreground">Fanni o'qituvchini belgilang (ixtiyoriy)</p>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label className="text-sm font-medium">
													Haftalik dars soatlari <span className="text-red-500">*</span>
												</Label>
												<Input
													type="number"
													className="h-10"
													placeholder="2"
													value={String(subjectForm.hours_per_week ?? "")}
													onChange={(e) => setSubjectForm((s) => ({ ...s, hours_per_week: Number(e.target.value) }))}
													min={1}
													max={20}
													required
												/>
												<p className="text-xs text-muted-foreground">Haftasiga necha soat dars o'tiladi (1-20)</p>
											</div>

											<div className="space-y-2">
												<Label className="text-sm font-medium">Holat</Label>
												<div className="flex items-center space-x-2 h-10">
													<Checkbox
														id="sub_is_active"
														checked={!!subjectForm.is_active}
														onCheckedChange={(v) => setSubjectForm((s) => ({ ...s, is_active: Boolean(v) }))}
													/>
													<Label htmlFor="sub_is_active" className="text-sm font-normal cursor-pointer">
														Fan faol holda
													</Label>
												</div>
												<p className="text-xs text-muted-foreground">Nofaol fanlar ko'rinmaydi</p>
											</div>
										</div>
									</>
								)}
							</div>
							<Separator className="my-2" />
							<DialogFooter className="gap-2">
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
													setSubjectForm({ subject: undefined, teacher: undefined, hours_per_week: 2, is_active: true });
												}
											}
										);
									}}
									disabled={addSubjectMutation.isPending || !subjectForm.subject}
									className="min-w-[120px]"
								>
									{addSubjectMutation.isPending ? (
										<span className="flex items-center gap-2">
											<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
											Saqlanmoqda...
										</span>
									) : (
										"Qo'shish"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{csLoading ? (
						<div className="p-4 text-sm text-muted-foreground">Yuklanmoqda...</div>
					) : csError ? (
						<div className="p-4 text-sm text-red-600">Sinf fanlarini olishda xatolik yoki ruxsat yo'q.</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fan</TableHead>
										<TableHead>O'qituvchi</TableHead>
										<TableHead>Haftalik soat</TableHead>
										<TableHead>Holat</TableHead>
										<TableHead className="w-24">Amal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{classSubjects.map((cs) => (
										<TableRow key={cs.id}>
											<TableCell className="font-medium">{cs.subject_name}</TableCell>
											<TableCell>{cs.teacher_name || "-"}</TableCell>
											<TableCell>{cs.hours_per_week}</TableCell>
											<TableCell>
												<span className={`px-2 py-1 text-xs rounded ${cs.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
													{cs.is_active ? "Faol" : "NoFaol"}
												</span>
											</TableCell>
											<TableCell>
												<Button
													variant="destructive"
													size="icon"
													aria-label="O'chirish"
													onClick={() => setDeleteConfirm({ open: true, type: 'subject', id: cs.id, name: cs.subject_name })}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Students */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Sinf o'quvchilari</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">Sinfda o'qiyotgan barcha o'quvchilar ro'yxati</p>
					</div>
					<Dialog open={openAddStudent} onOpenChange={setOpenAddStudent}>
						<DialogTrigger asChild>
							<Button size="sm"><UserPlus className="w-4 h-4 mr-2" /> O'quvchi qo'shish</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
							<DialogHeader>
								<DialogTitle className="text-xl">O'quvchilarni tanlash</DialogTitle>
								<p className="text-sm text-muted-foreground">Sinfga qo'shish uchun o'quvchilarni tanlang</p>
							</DialogHeader>
							<Separator className="my-2" />
							<div className="flex-1 overflow-hidden flex flex-col gap-4">
								{/* Search Bar with Selected Tags */}
								<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Qidiruv va tanlash</Label>
						<div className="relative flex items-center gap-2 flex-wrap min-h-[42px] border rounded-lg px-3 py-2 bg-white focus-within:border-gray-300 transition-all">
										<Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
										{studentForm.students.map((student) => (
											<span key={student.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
												<span className="font-medium">{student.user_name}</span>
												<button
													className="text-blue-600 hover:text-blue-900 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
													onClick={() => setStudentForm((s) => ({ ...s, students: s.students.filter((st) => st.id !== student.id) }))}
													aria-label="Olib tashlash"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
										<input
											type="text"
											className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
											placeholder={studentForm.students.length > 0 ? "Qidirish davom eting..." : "Ism, familiya yoki telefon raqam..."}
											value={studentSearch}
											onChange={(e) => setStudentSearch(e.target.value)}
										/>
										{studentSearch && (
											<button
												className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
												onClick={() => setStudentSearch("")}
												aria-label="Clear search"
											>
												<X className="w-4 h-4" />
											</button>
										)}
									</div>
									{studentForm.students.length > 0 && (
										<p className="text-xs text-muted-foreground">
											{studentForm.students.length} ta o'quvchi tanlandi
										</p>
									)}
								</div>
								{/* Student List */}
								<div className="flex-1 overflow-y-auto -mx-6 px-6">
									{smLoading ? (
										<div className="flex items-center justify-center py-8 text-muted-foreground">
											<div className="flex flex-col items-center gap-2">
												<div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
												<span className="text-sm">Yuklanmoqda...</span>
											</div>
										</div>
									) : smError ? (
										<div className="text-sm text-red-600 text-center py-8">O'quvchilar ro'yxatini olishda xatolik.</div>
									) : availableStudents.length === 0 ? (
										<div className="text-center py-12 text-muted-foreground">
											<UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
											<p className="text-sm">Hech qanday o'quvchi topilmadi</p>
											<p className="text-xs mt-1">Qidiruv sozlamalarini o'zgartiring yoki yangisini qo'shing</p>
										</div>
									) : (
										<div className="grid grid-cols-1 gap-2">
											{availableStudents.map((student) => {
												const selected = studentForm.students.some(s => s.id === student.id);
												return (
													<button
														key={student.id}
														type="button"
														className={`text-left p-4 rounded-lg border-2 transition-all ${
															selected
																? 'border-blue-500 bg-blue-50 shadow-sm'
																: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
														}`}
														onClick={() => {
															setStudentForm((s) => ({
																...s,
																students: selected
																	? s.students.filter((st) => st.id !== student.id)
																	: [...s.students, student],
															}));
														}}
													>
														<div className="flex items-center gap-3">
															<div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
																selected ? 'bg-blue-600' : 'bg-gray-400'
															}`}>
																{(student.user_name || '?').charAt(0).toUpperCase()}
															</div>
															<div className="flex-1 min-w-0">
																<div className="font-semibold text-sm truncate">{student.user_name}</div>
																<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
																	<Phone className="w-3 h-3" />
																	<span className="truncate">{student.user_phone}</span>
																</div>
																<div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-0.5">
																	<Wallet className="w-3 h-3" />
																	<span>{student.balance.toLocaleString()} so'm</span>
																</div>
															</div>
															{selected && (
																<div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
																	<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
																	</svg>
																</div>
															)}
														</div>
													</button>
												);
											})}
										</div>
									)}
								</div>

								{/* Notes */}
								<div>
									<Label>Izoh (ixtiyoriy)</Label>
									<Input
										className="mt-1"
										placeholder="Sinfga qo'shish haqida izoh..."
										value={studentForm.notes || ""}
										onChange={(e) => setStudentForm((s) => ({ ...s, notes: e.target.value }))}
									/>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="stu_is_active"
										checked={!!studentForm.is_active}
										onCheckedChange={(v) => setStudentForm((s) => ({ ...s, is_active: Boolean(v) }))}
									/>
									<Label htmlFor="stu_is_active" className="text-sm font-normal">Faol sifatida qo'shish</Label>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => {
									setOpenAddStudent(false);
									setStudentSearch("");
								}}>Bekor qilish</Button>
							<Button
								onClick={async () => {
									if (!studentForm.students.length) return;
									await Promise.all(
										studentForm.students
											.filter((student) => student.id) // Filter out students without id
											.map((student) =>
												addStudentMutation.mutateAsync({
													membership: student.id,
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
								{addStudentMutation.isPending ? "Qo'shilmoqda..." : `Qo'shish${studentForm.students.length > 0 ? ` (${studentForm.students.length})` : ""}`}
							</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{cstLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="flex flex-col items-center gap-3">
								<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
								<p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
							</div>
						</div>
					) : cstError ? (
						<div className="p-8 text-center">
							<p className="text-red-600">Sinf o'quvchilarini olishda xatolik yoki ruxsat yo'q.</p>
						</div>
					) : classStudents.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">
							<UserPlus className="w-16 h-16 mx-auto mb-4 opacity-40" />
							<h3 className="text-lg font-semibold mb-2">Hech qanday o'quvchi yo'q</h3>
							<p className="text-sm">Yuqoridagi tugma orqali o'quvchi qo'shing</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{classStudents.map((st) => (
								<Card key={st.id} className="hover:shadow-md transition-shadow">
									<CardContent className="pt-6">
										<div className="flex items-start justify-between mb-3">
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
													<User className="w-6 h-6 text-white" />
												</div>
												<div className="flex-1 min-w-0">
													<button
														className="font-semibold hover:underline text-blue-600 truncate block w-full text-left"
														onClick={() => setOpenStudentDetail({ open: true, classId: classId, membershipId: st.membership_id })}
														title={st.student_name}
													>
														{st.student_name}
													</button>
													<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
														<Phone className="w-3 h-3" />
														<span className="truncate">{st.student_phone}</span>
													</div>
												</div>
											</div>
										</div>

										<div className="space-y-2 mb-4">
											<div className="flex items-center justify-between text-xs">
												<span className="text-muted-foreground">Balans:</span>
												<div className="flex items-center gap-1.5 font-medium text-green-600">
													<Wallet className="w-3.5 h-3.5" />
													<span>{st.student_balance.toLocaleString()} so'm</span>
												</div>
											</div>
											<div className="flex items-center justify-between text-xs">
												<span className="text-muted-foreground">Holat:</span>
												<Badge variant={st.is_active ? "default" : "secondary"} className="text-xs">
													{st.is_active ? "Faol" : "Nofaol"}
												</Badge>
											</div>
											{st.notes && (
												<div className="text-xs">
													<span className="text-muted-foreground">Izoh:</span>
													<p className="text-foreground mt-1 line-clamp-2">{st.notes}</p>
												</div>
											)}
										</div>

										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setOpenStudentDetail({ open: true, classId: classId, membershipId: st.membership_id })}
											>
												<User className="w-3.5 h-3.5 mr-1.5" />
												Ko'rish
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setTransferDialog({ open: true, membershipId: st.membership_id, studentName: st.student_name })}
											>
												<ArrowRightLeft className="w-3.5 h-3.5" />
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => setDeleteConfirm({ open: true, type: 'student', id: st.membership_id, name: st.student_name })}
											>
												<Trash2 className="w-3.5 h-3.5" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
						</CardContent>
			</Card>

						{/* Student Detail Dialog */}
						<Dialog open={openStudentDetail.open} onOpenChange={(v) => setOpenStudentDetail((s) => ({ open: v, classId: v ? s.classId : undefined, membershipId: v ? s.membershipId : undefined }))}>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle className="text-xl">O'quvchi ma'lumotlari</DialogTitle>
									<p className="text-sm text-muted-foreground">To'liq ma'lumotlar va profil</p>
								</DialogHeader>
								<Separator />
								{selLoading ? (
									<div className="flex items-center justify-center py-12">
										<div className="flex flex-col items-center gap-3">
											<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
											<p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
										</div>
									</div>
								) : selectedStudent ? (
									<div className="space-y-6 py-2">
										{/* Header with Avatar */}
										<div className="flex items-center gap-4">
											<div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white">
												{(selectedStudent.student_name || '?').charAt(0).toUpperCase()}
											</div>
											<div className="flex-1">
												<h3 className="text-2xl font-bold">{selectedStudent.student_name}</h3>
												<div className="flex items-center gap-2 mt-2">
													<Badge variant={selectedStudent.is_active ? "default" : "secondary"}>
														{selectedStudent.is_active ? "Faol" : "Nofaol"}
													</Badge>
												</div>
											</div>
										</div>

										<Separator />

										{/* Contact Information */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-3">
												<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Aloqa ma'lumotlari</h4>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<Phone className="w-4 h-4 text-muted-foreground" />
														<span className="text-sm">{selectedStudent.student_phone || "-"}</span>
													</div>
												</div>
											</div>

											<div className="space-y-3">
												<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Moliyaviy ma'lumotlar</h4>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<Wallet className="w-4 h-4 text-green-600" />
														<div className="text-sm">
															<span className="text-muted-foreground">Balans: </span>
															<span className="font-semibold text-green-600">{selectedStudent.student_balance.toLocaleString()} so'm</span>
														</div>
													</div>
												</div>
											</div>
										</div>

										<Separator />

										{/* Enrollment Information */}
										<div className="space-y-3">
											<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sinf ma'lumotlari</h4>
											<div className="space-y-2">
												<div className="text-sm">
													<span className="text-muted-foreground">Qo'shilgan sana: </span>
													<span className="font-medium">{new Date(selectedStudent.enrollment_date).toLocaleDateString('uz-UZ')}</span>
												</div>
												{selectedStudent.notes && (
													<div className="text-sm">
														<span className="text-muted-foreground">Izohlar: </span>
														<p className="mt-1 text-foreground">{selectedStudent.notes}</p>
													</div>
												)}
											</div>
										</div>
									</div>
								) : (
									<div className="p-8 text-center">
										<p className="text-red-600">Ma'lumot topilmadi</p>
									</div>
								)}
								<Separator />
								<DialogFooter>
									<Button variant="outline" onClick={() => setOpenStudentDetail({ open: false })}>
										Yopish
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Delete Confirmation Dialog */}
						<AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
									<AlertDialogDescription>
										{deleteConfirm.type === 'subject' 
											? `"${deleteConfirm.name}" fanini sinfdan olib tashlash. Bu amalni qaytarib bo'lmaydi.` 
											: `"${deleteConfirm.name}" o'quvchisini sinfdan olib tashlash. Bu amalni qaytarib bo'lmaydi.`}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}>
										Bekor qilish
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											if (deleteConfirm.type === 'subject' && deleteConfirm.id) {
												removeSubjectMutation.mutate(deleteConfirm.id);
											} else if (deleteConfirm.type === 'student' && deleteConfirm.id) {
												removeStudentMutation.mutate(deleteConfirm.id);
											}
											setDeleteConfirm((prev) => ({ ...prev, open: false }));
										}}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										O'chirish
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						{/* Transfer Dialog */}
						<Dialog open={transferDialog.open} onOpenChange={(v) => setTransferDialog((s) => ({ open: v, membershipId: v ? s.membershipId : undefined, studentName: v ? s.studentName : undefined }))}>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>O'quvchini boshqa sinfga ko'chirish</DialogTitle>
									<p className="text-sm text-muted-foreground">
										<span className="font-semibold">{transferDialog.studentName}</span> ni qaysi sinfga ko'chirmoqchisiz?
									</p>
								</DialogHeader>
								<Separator />
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Label htmlFor="target_class">Yangi sinf *</Label>
										<Select
											value={transferForm.targetClassId}
											onValueChange={(value) => setTransferForm((s) => ({ ...s, targetClassId: value }))}
										>
											<SelectTrigger id="target_class">
												<SelectValue placeholder="Sinfni tanlang" />
											</SelectTrigger>
											<SelectContent>
												{allClasses
													.filter((c) => c.id !== classId && c.can_add_student)
													.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.name} ({c.current_students_count}/{c.max_students} o'quvchi)
														</SelectItem>
													))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">Faqat bo'sh joyi bo'lgan sinflar ko'rsatiladi</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="transfer_notes">Izoh</Label>
										<Input
											id="transfer_notes"
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

