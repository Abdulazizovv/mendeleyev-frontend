import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, GraduationCap } from "lucide-react";

interface AdditionalInfoCardProps {
  student: any;
  formatDate: (date: string) => string;
}

export function AdditionalInfoCard({ student, formatDate }: AdditionalInfoCardProps) {
  const hasAdditionalInfo = student.birth_certificate || 
                            student.membership_id || 
                            student.status_display ||
                            student.created_at;

  if (!hasAdditionalInfo) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Qo&apos;shimcha Ma&apos;lumotlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {student.birth_certificate && (
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Tug&apos;ilganlik guvohnomasi</p>
              <p className="font-medium">{student.birth_certificate}</p>
            </div>
          </div>
        )}

        {student.membership_id && (
          <div className="flex items-center gap-3">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">A&apos;zolik ID</p>
              <p className="font-medium">{student.membership_id}</p>
            </div>
          </div>
        )}

        {student.status_display && (
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <Badge className="mt-1">{student.status_display}</Badge>
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Yaratilgan:</span>
            <span className="font-medium">{formatDate(student.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Yangilangan:</span>
            <span className="font-medium">{formatDate(student.updated_at)}</span>
          </div>
        </div>

        {student.additional_fields && Object.keys(student.additional_fields).length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Maxsus maydonlar:</p>
            <div className="space-y-2">
              {Object.entries(student.additional_fields).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
