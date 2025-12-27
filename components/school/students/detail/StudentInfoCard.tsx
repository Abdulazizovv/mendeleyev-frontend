import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, Calendar, MapPin, FileText } from "lucide-react";

interface StudentInfoCardProps {
  student: any;
  formatDate: (date: string) => string;
}

export function StudentInfoCard({ student, formatDate }: StudentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Asosiy Ma&apos;lumotlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Telefon</p>
              <p className="font-medium">{student.phone_number}</p>
            </div>
          </div>
          {student.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
          )}
          {student.date_of_birth && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Tug&apos;ilgan sana</p>
                <p className="font-medium">{formatDate(student.date_of_birth)}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Jins</p>
              <p className="font-medium capitalize">
                {student.gender === "male" ? "Erkak" : "Ayol"}
              </p>
            </div>
          </div>
        </div>

        {student.address && (
          <div className="flex items-start gap-3 pt-4 border-t">
            <MapPin className="w-4 h-4 text-gray-500 mt-1" />
            <div>
              <p className="text-xs text-gray-500">Manzil</p>
              <p className="font-medium">{student.address}</p>
            </div>
          </div>
        )}

        {(student.passport_number || student.nationality) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            {student.passport_number && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Pasport</p>
                  <p className="font-medium">{student.passport_number}</p>
                </div>
              </div>
            )}
            {student.nationality && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Millati</p>
                  <p className="font-medium">{student.nationality}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
