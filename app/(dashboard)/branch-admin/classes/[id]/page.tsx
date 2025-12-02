"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { schoolApi } from "@/lib/api/school";
import type { Class, ClassSubject, ClassStudent, Subject } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

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
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classStudents", classId] }),
	});

	const removeStudentMutation = useMutation({
		mutationFn: (studentId: string) => schoolApi.removeStudentFromClass(classId!, studentId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["classStudents", classId] }),
	});

	const [openAddSubject, setOpenAddSubject] = React.useState(false);
	const [openAddStudent, setOpenAddStudent] = React.useState(false);

	const [subjectForm, setSubjectForm] = React.useState<{ subject?: string; hours_per_week?: number; is_active?: boolean }>({
		subject: undefined,
		hours_per_week: 2,
		is_active: true,
	});

	const [studentForm, setStudentForm] = React.useState<{ membership?: string; is_active?: boolean; notes?: string }>({
		membership: undefined,
		is_active: true,
		notes: "",
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Sinf detali</h1>
			</div>

			{classLoading ? (
				<div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
			) : classError ? (
				<div className="text-sm text-red-600">Sinfni olishda xatolik yoki ruxsat mavjud emas.</div>
			) : cls ? (
				<Card>
					<CardHeader>
						<CardTitle>
							{cls.name} • {cls.academic_year_name}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							<div>
								<div className="text-muted-foreground">Daraja</div>
								<div className="font-medium">{cls.grade_level}{cls.section ? `-${cls.section}` : ""}</div>
							</div>
							<div>
								<div className="text-muted-foreground">Xona</div>
								<div className="font-medium">{cls.room_name || "-"}</div>
							</div>
							<div>
								<div className="text-muted-foreground">O'quvchilar</div>
								<div className="font-medium">{cls.current_students_count}</div>
							</div>
						</div>
					</CardContent>
				</Card>
			) : null}

			{/* Subjects */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Sinf fanlari</CardTitle>
					<Dialog open={openAddSubject} onOpenChange={setOpenAddSubject}>
						<DialogTrigger asChild>
							<Button size="sm"><Plus className="w-4 h-4 mr-2" /> Fan qo'shish</Button>
						</DialogTrigger>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>Fan qo'shish</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<div>
									<Label>Fan</Label>
									<Select
										value={subjectForm.subject || ""}
										onValueChange={(v) => setSubjectForm((s) => ({ ...s, subject: v }))}
									>
										<SelectTrigger className="mt-1" aria-label="Fan">
											<SelectValue placeholder="Fan tanlang" />
										</SelectTrigger>
										<SelectContent>
											{subjects.map((s) => (
												<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Haftalik soat</Label>
									<Input
										type="number"
										className="mt-1"
										value={String(subjectForm.hours_per_week ?? 2)}
										onChange={(e) => setSubjectForm((s) => ({ ...s, hours_per_week: Number(e.target.value) }))}
										min={1}
										required
									/>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="sub_is_active"
										checked={!!subjectForm.is_active}
										onCheckedChange={(v) => setSubjectForm((s) => ({ ...s, is_active: Boolean(v) }))}
									/>
									<Label htmlFor="sub_is_active">Faol</Label>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={() => {
										if (!subjectForm.subject) return;
										addSubjectMutation.mutate(
											{
												subject: subjectForm.subject,
												hours_per_week: Number(subjectForm.hours_per_week ?? 2),
												is_active: Boolean(subjectForm.is_active ?? true),
											},
											{ onSuccess: () => setOpenAddSubject(false) }
										);
									}}
									disabled={addSubjectMutation.isPending}
								>
									{addSubjectMutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
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
													onClick={() => removeSubjectMutation.mutate(cs.id)}
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
					<CardTitle>Sinf o'quvchilari</CardTitle>
					<Dialog open={openAddStudent} onOpenChange={setOpenAddStudent}>
						<DialogTrigger asChild>
							<Button size="sm"><Plus className="w-4 h-4 mr-2" /> O'quvchi qo'shish</Button>
						</DialogTrigger>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>O'quvchi qo'shish</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<div>
									<Label>Membership ID</Label>
									<Input
										className="mt-1"
										placeholder="Membership UUID"
										value={studentForm.membership || ""}
										onChange={(e) => setStudentForm((s) => ({ ...s, membership: e.target.value }))}
									/>
								</div>
								<div>
									<Label>Izoh (ixtiyoriy)</Label>
									<Input
										className="mt-1"
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
									<Label htmlFor="stu_is_active">Faol</Label>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={() => {
										if (!studentForm.membership) return;
										addStudentMutation.mutate(
											{
												membership: studentForm.membership,
												is_active: Boolean(studentForm.is_active ?? true),
												notes: studentForm.notes || undefined,
											},
											{ onSuccess: () => setOpenAddStudent(false) }
										);
									}}
									disabled={addStudentMutation.isPending}
								>
									{addStudentMutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{cstLoading ? (
						<div className="p-4 text-sm text-muted-foreground">Yuklanmoqda...</div>
					) : cstError ? (
						<div className="p-4 text-sm text-red-600">Sinf o'quvchilarini olishda xatolik yoki ruxsat yo'q.</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>FIO</TableHead>
										<TableHead>Telefon</TableHead>
										<TableHead>Holat</TableHead>
										<TableHead className="w-24">Amal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{classStudents.map((st) => (
										<TableRow key={st.id}>
											<TableCell className="font-medium">{st.student_name}</TableCell>
											<TableCell>{st.student_phone}</TableCell>
											<TableCell>
												<span className={`px-2 py-1 text-xs rounded ${st.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
													{st.is_active ? "Faol" : "NoFaol"}
												</span>
											</TableCell>
											<TableCell>
												<Button
													variant="destructive"
													size="icon"
													aria-label="Olib tashlash"
													onClick={() => removeStudentMutation.mutate(st.student_id)}
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
		</div>
	);
}

