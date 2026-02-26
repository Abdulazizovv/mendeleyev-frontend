"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StudentImportResult, ImportStudentError, ImportedStudent } from "@/types";

interface ImportResultsProps {
  result: StudentImportResult;
  isDryRun: boolean;
}

export function ImportResults({ result, isDryRun }: ImportResultsProps) {
  const { total, success, failed, skipped, errors = [], students = [] } = result;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isDryRun ? "Tayyor" : "Muvaffaqiyatli"}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {success}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">O&apos;tkazib yuborilgan</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {skipped}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Xatolik</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {failed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Errors Section */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Xatoliklar topildi ({errors.length})</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.map((error: ImportStudentError, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm"
                >
                  <div className="font-medium">
                    Qator {error.row}
                    {error.student && ` - ${error.student}`}
                  </div>
                  <div className="text-red-700 dark:text-red-300 mt-1">
                    {error.error}
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Students Table */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isDryRun ? "Import uchun tayyor o'quvchilar" : "Import qilingan o'quvchilar"}
            </CardTitle>
            <CardDescription>
              {isDryRun
                ? "Tasdiqlash tugmasini bosing va haqiqiy import amalga oshiriladi"
                : "Quyidagi o'quvchilar muvaffaqiyatli import qilindi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">№</TableHead>
                    <TableHead>To&apos;liq ism</TableHead>
                    <TableHead>Telefon raqam</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: ImportedStudent, index: number) => (
                    <TableRow key={student.id || index}>
                      <TableCell className="font-medium">
                        {student.row || index + 1}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.phone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "created" || student.status === "ready"
                              ? "default"
                              : student.status === "skipped"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {student.status === "created"
                            ? "Yaratildi"
                            : student.status === "ready"
                            ? "Tayyor"
                            : student.status === "skipped"
                            ? "O'tkazib yuborilgan"
                            : "Xatolik"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
