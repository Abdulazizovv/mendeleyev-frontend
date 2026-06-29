"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { schoolApi } from "@/lib/api";
import { toast } from "sonner";
import type { SimpleImportResult } from "@/types";

interface StudentImportFormProps {
  branchId: string;
}

export function StudentImportForm({ branchId }: StudentImportFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const importingRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimpleImportResult | null>(null);

  const handleFileChange = (selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Faqat .xlsx yoki .xls fayl qabul qilinadi");
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleImport = async () => {
    if (!file || importingRef.current) return;
    importingRef.current = true;
    setIsLoading(true);
    try {
      const data = await schoolApi.importStudentsSimple(file, branchId);
      setResult(data);
      if (data.success > 0) {
        toast.success(`${data.success} ta o'quvchi muvaffaqiyatli import qilindi`);
      } else if (data.skipped > 0 && data.failed === 0) {
        toast.info("Barcha o'quvchilar allaqachon tizimda mavjud");
      } else {
        toast.warning("Import qilingan o'quvchilar yo'q");
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(
        apiErr?.response?.data?.detail || apiErr?.message || "Import xatolik bilan tugadi"
      );
    } finally {
      setIsLoading(false);
      importingRef.current = false;
    }
  };

  const downloadTemplate = () => {
    const csv = "﻿Ism,Familiya,Telefon\nAli,Valiyev,+998901234567\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "o_quvchilar_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Namuna fayl yuklab olindi");
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Format instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5" />
            Excel fayl formati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-sm text-center">
            {[
              { col: "A", label: "Ism" },
              { col: "B", label: "Familiya" },
              { col: "C", label: "Telefon raqam" },
            ].map(({ col, label }) => (
              <div key={col} className="rounded-md border bg-muted/40 py-3">
                <div className="text-lg font-bold">{col}</div>
                <div className="text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Birinchi qator sarlavha sifatida o&apos;tkazib yuboriladi. Telefon raqam
            +998XXXXXXXXX formatida bo&apos;lishi tavsiya etiladi.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate} type="button">
            <Download className="h-4 w-4 mr-2" />
            Namuna fayl yuklab olish
          </Button>
        </CardContent>
      </Card>

      {/* File upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
        onDragLeave={(e) => { e.stopPropagation(); setDragging(false); }}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-colors
          ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />

        {file ? (
          /* File selected — show info, no click-to-reopen */
          <div className="flex items-center gap-3 p-6">
            <FileSpreadsheet className="h-8 w-8 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 text-muted-foreground hover:text-destructive rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* No file — click to open dialog */
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 p-10 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg"
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-sm">Excel faylni shu yerga tashlang</p>
              <p className="text-xs text-muted-foreground mt-1">
                yoki bosib tanlang (.xlsx, .xls)
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Import button */}
      {file && !result && (
        <Button
          type="button"
          onClick={handleImport}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isLoading ? "Import qilinmoqda..." : "Import qilish"}
        </Button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
              Jami: <span className="font-bold">{result.total}</span>
            </Badge>
            {result.success > 0 && (
              <Badge className="gap-1.5 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Yangi: <span className="font-bold">{result.success}</span>
              </Badge>
            )}
            {result.skipped > 0 && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <SkipForward className="h-3.5 w-3.5" />
                Mavjud: <span className="font-bold">{result.skipped}</span>
              </Badge>
            )}
            {result.failed > 0 && (
              <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm">
                <XCircle className="h-3.5 w-3.5" />
                Xatolik: <span className="font-bold">{result.failed}</span>
              </Badge>
            )}
          </div>

          {/* Successfully added */}
          {result.students.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Qo&apos;shilgan o&apos;quvchilar ({result.students.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Qator</TableHead>
                      <TableHead>Ism Familiya</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Raqam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.students.map((s) => (
                      <TableRow key={s.row}>
                        <TableCell className="text-muted-foreground">{s.row}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.phone}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.personal_number}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Already existed (skipped) */}
          {result.skipped_list && result.skipped_list.length > 0 && (
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Allaqachon tizimda mavjud — o&apos;tkazib yuborildi (
                  {result.skipped_list.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Qator</TableHead>
                      <TableHead>Ism Familiya</TableHead>
                      <TableHead>Telefon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.skipped_list.map((s, i) => (
                      <TableRow key={i} className="text-muted-foreground">
                        <TableCell>{s.row}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.phone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Real errors */}
          {result.errors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Xatoliklar ({result.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Qator</TableHead>
                      <TableHead>Ism Familiya</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Xatolik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((e, i) => (
                      <TableRow key={i} className="bg-destructive/5">
                        <TableCell className="text-muted-foreground">{e.row}</TableCell>
                        <TableCell>{e.name || "—"}</TableCell>
                        <TableCell>{e.phone || "—"}</TableCell>
                        <TableCell className="text-destructive text-sm">{e.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={reset} className="flex-1">
              Yana import qilish
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/school/students")}
              className="flex-1"
            >
              O&apos;quvchilar ro&apos;yxatiga o&apos;tish
            </Button>
          </div>
        </div>
      )}

      {!file && !result && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Telefon raqami allaqachon tizimda mavjud bo&apos;lgan o&apos;quvchilar o&apos;tkazib
            yuboriladi (takrorlanmaydi).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
