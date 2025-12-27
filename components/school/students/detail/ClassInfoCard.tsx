import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ClassInfoCardProps {
  classInfo: any;
}

export function ClassInfoCard({ classInfo }: ClassInfoCardProps) {
  if (!classInfo) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Sinf Ma&apos;lumotlari
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Sinf nomi:</span>
          <span className="font-medium">{classInfo.name}</span>
        </div>
        {classInfo.teacher_name && (
          <div className="flex justify-between">
            <span className="text-gray-600">O&apos;qituvchi:</span>
            <span className="font-medium">{classInfo.teacher_name}</span>
          </div>
        )}
        {classInfo.student_count !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-600">O&apos;quvchilar soni:</span>
            <span className="font-medium">{classInfo.student_count}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
