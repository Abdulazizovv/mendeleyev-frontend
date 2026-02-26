"use client";

import { useCallback } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const isExcelFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  const hasValidMimeType = ALLOWED_TYPES.includes(file.type);
  
  // Accept if either extension or MIME type is valid
  return hasValidExtension || hasValidMimeType;
};

export function FileUpload({ file, onFileSelect, disabled }: FileUploadProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      // Validate file type
      if (!isExcelFile(selectedFile)) {
        alert("Faqat Excel fayllar (.xlsx yoki .xls) qabul qilinadi");
        event.target.value = "";
        return;
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert("Fayl hajmi 10MB dan oshmasligi kerak");
        event.target.value = "";
        return;
      }

      onFileSelect(selectedFile);
    },
    [onFileSelect]
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null);
    const input = document.getElementById("file-upload") as HTMLInputElement;
    if (input) input.value = "";
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      if (!isExcelFile(droppedFile)) {
        alert("Faqat Excel fayllar (.xlsx yoki .xls) qabul qilinadi");
        return;
      }

      if (droppedFile.size > MAX_FILE_SIZE) {
        alert("Fayl hajmi 10MB dan oshmasligi kerak");
        return;
      }

      onFileSelect(droppedFile);
    },
    [onFileSelect]
  );

  return (
    <Card>
      <CardContent className="p-6">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              disabled
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            )}
          >
            <label
              htmlFor="file-upload"
              className={cn(
                "flex flex-col items-center gap-4",
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Excel faylni tanlang yoki bu yerga tashlang
                </p>
                <p className="text-sm text-muted-foreground">
                  .xlsx yoki .xls formatida, maksimal 10MB
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
              />
              <Button type="button" disabled={disabled}>
                Fayl tanlash
              </Button>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-green-100 dark:bg-green-900/30">
                <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
