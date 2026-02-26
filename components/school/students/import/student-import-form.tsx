"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUpload } from "./file-upload";
import { ImportResults } from "./import-results";
import { schoolApi } from "@/lib/api";
import { toast } from "sonner";
import type { StudentImportResult } from "@/types";

interface StudentImportFormProps {
  branchId: string;
}

export function StudentImportForm({ branchId }: StudentImportFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [previewResult, setPreviewResult] = useState<StudentImportResult | null>(null);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling intervalini to'xtatish
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Cleanup: component unmount bo'lganda polling to'xtatish
  useEffect(() => {
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Task statusini tekshirish (polling)
  const pollTaskStatus = async (taskId: string, isDryRun: boolean) => {
    try {
      const statusData = await schoolApi.checkImportStatus(taskId);

      if (statusData.status === 'SUCCESS' && statusData.result) {
        stopPolling();
        setIsLoading(false);
        
        if (isDryRun) {
          setPreviewResult(statusData.result);
          if (statusData.result.success > 0) {
            toast.success(
              `${statusData.result.success} ta o'quvchi import uchun tayyor`,
              {
                description: statusData.result.failed > 0 
                  ? `${statusData.result.failed} ta o'quvchida xatolik topildi`
                  : undefined
              }
            );
          } else {
            toast.error("Import uchun tayyor o'quvchilar topilmadi");
          }
        } else {
          setImportResult(statusData.result);
          setPreviewResult(null);
          if (statusData.result.success > 0) {
            toast.success(
              `${statusData.result.success} ta o'quvchi muvaffaqiyatli import qilindi`,
              {
                description: statusData.result.failed > 0 
                  ? `${statusData.result.failed} ta o'quvchida xatolik yuz berdi`
                  : undefined
              }
            );
          } else {
            toast.error("Import qilingan o'quvchilar yo'q");
          }
        }
      } else if (statusData.status === 'FAILURE') {
        stopPolling();
        setIsLoading(false);
        toast.error("Import jarayonida xatolik yuz berdi", {
          description: statusData.error || "Noma'lum xatolik"
        });
      } else if (statusData.status === 'STARTED') {
        setLoadingMessage("Import jarayoni davom etmoqda...");
      } else if (statusData.status === 'PENDING') {
        setLoadingMessage("Navbatda kutmoqda...");
      }
    } catch (error: unknown) {
      console.error("Status check error:", error);
      stopPolling();
      setIsLoading(false);
      const apiError = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error("Status tekshirishda xatolik", {
        description: apiError?.response?.data?.detail || apiError?.message || "Iltimos, qaytadan urinib ko'ring"
      });
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error("Iltimos, faylni tanlang");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Fayl yuklanmoqda...");
    setPreviewResult(null);
    setImportResult(null);

    try {
      const taskResponse = await schoolApi.importStudents(file, branchId, true);
      
      // Polling boshlash (har 2 soniyada)
      pollingIntervalRef.current = setInterval(() => {
        pollTaskStatus(taskResponse.task_id, true);
      }, 2000);
      
      // Birinchi marta darhol tekshirish
      pollTaskStatus(taskResponse.task_id, true);
      
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } }; message?: string };
      console.error("Preview error:", error);
      setIsLoading(false);
      toast.error("Xatolik yuz berdi", {
        description: apiError?.response?.data?.detail || apiError?.message || "Faylni tekshirishda xatolik"
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Iltimos, faylni tanlang");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Fayl yuklanmoqda...");
    setImportResult(null);

    try {
      const taskResponse = await schoolApi.importStudents(file, branchId, false);
      
      // Polling boshlash (har 2 soniyada)
      pollingIntervalRef.current = setInterval(() => {
        pollTaskStatus(taskResponse.task_id, false);
      }, 2000);
      
      // Birinchi marta darhol tekshirish
      pollTaskStatus(taskResponse.task_id, false);
      
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } }; message?: string };
      console.error("Import error:", error);
      setIsLoading(false);
      toast.error("Import jarayonida xatolik yuz berdi", {
        description: apiError?.response?.data?.detail || apiError?.message || "Iltimos, qaytadan urinib ko'ring"
      });
    }
  };

  const handleReset = () => {
    stopPolling();
    setFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setLoadingMessage("");
  };

  const handleGoToStudents = () => {
    stopPolling();
    router.push(`/school/students`);
  };

  const handleFileSelect = (selectedFile: File | null) => {
    // Agar yangi fayl tanlansa, oldingi pollingni to'xtatish
    if (selectedFile !== file) {
      stopPolling();
      setPreviewResult(null);
      setImportResult(null);
      setLoadingMessage("");
      setIsLoading(false);
    }
    setFile(selectedFile);
  };

  const downloadTemplate = () => {
    // Create Excel template with headers
    const headers = [
      "Shartnoma Raqam FIO",
      "Balans",
      "Smil",
      "Guruh",
      "Telefon Raqam",
      "Sinf Rahbari",
      "Jinsi",
      "Tug'ilgan sanai",
      "Manzil",
      "Shartnoma sanasi",
      "Shartnoma tugasi",
      "Passport",
      "Aboniment",
      "1-Yaqinl Turi",
      "1-Yaqini FIO",
      "1-Yaqini Telefon",
      "2-Yaqini Turi",
      "2-Yaqini FIO",
      "2-Yaqini Telefon",
    ];

    // Create sample data
    const sampleData = [
      [
        "Ali Karim o'g'li Valiyev",
        "0",
        "",
        "5-A",
        "+998901234567",
        "Javohirbek Bahromov",
        "male",
        "2010-05-15",
        "Toshkent shahri, Chilonzor tumani",
        "",
        "",
        "AB1234567",
        "",
        "ota",
        "Karim Olim o'g'li Valiyev",
        "+998901234568",
        "ona",
        "Nodira Aziz qizi Valiyeva",
        "+998901234569",
      ],
    ];

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "students_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Template yuklab olindi", {
      description: "CSV faylni Excel da ochib, ma'lumotlarni to'ldiring",
    });
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            O&apos;quvchilarni Excel orqali import qilish
          </CardTitle>
          <CardDescription>
            Excel fayl orqali bir necha o&apos;quvchini bir vaqtda import qiling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Eslatma</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                <li>Excel fayl (.xlsx yoki .xls formatida) bo&apos;lishi kerak</li>
                <li>Fayl hajmi 10MB dan oshmasligi kerak</li>
                <li>Telefon raqamlar unique bo&apos;lishi kerak</li>
                <li>Avval &quot;Oldindan ko&apos;rish&quot; tugmasini bosib tekshiring</li>
                <li>Keyin &quot;Import qilish&quot; tugmasini bosing</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template yuklab olish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <FileUpload
        file={file}
        onFileSelect={handleFileSelect}
        disabled={isLoading}
      />

      {/* Action Buttons */}
      {file && !importResult && (
        <div className="flex gap-3">
          <Button
            onClick={handlePreview}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? loadingMessage || "Tekshirilmoqda..." : "Oldindan ko'rish"}
          </Button>
          {previewResult && (
            <Button
              onClick={handleImport}
              disabled={isLoading || previewResult.success === 0}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? loadingMessage || "Import qilinmoqda..." : "Import qilish"}
            </Button>
          )}
        </div>
      )}

      {/* Preview Results */}
      {previewResult && !importResult && (
        <ImportResults result={previewResult} isDryRun={true} />
      )}

      {/* Import Results */}
      {importResult && (
        <>
          <ImportResults result={importResult} isDryRun={false} />
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Yana import qilish
            </Button>
            <Button onClick={handleGoToStudents} className="flex-1">
              O&apos;quvchilar ro&apos;yxatiga o&apos;tish
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
