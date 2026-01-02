import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, Calendar, MapPin, FileText, Globe, Hash, Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface StudentInfoCardProps {
  student: any;
  formatDate: (date: string) => string;
}

export function StudentInfoCard({ student, formatDate }: StudentInfoCardProps) {
  const passportNumber = student.additional_fields?.passport_number || student.passport_number;
  const nationality = student.additional_fields?.nationality || student.nationality;
  const passportIssuedDate = student.additional_fields?.passport_issued_date;
  const passportExpiryDate = student.additional_fields?.passport_expiry_date;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-blue-600" />
          Asosiy Ma&apos;lumotlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Aloqa Ma&apos;lumotlari
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Telefon raqam</p>
                <p className="font-semibold text-gray-900 break-all">{student.phone_number}</p>
              </div>
            </div>
            {student.email && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 rounded-md bg-green-100 text-green-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Email manzil</p>
                  <p className="font-semibold text-gray-900 break-all">{student.email}</p>
                </div>
              </div>
            )}
          </div>
          {student.address && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-2 rounded-md bg-purple-100 text-purple-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Manzil</p>
                <p className="font-semibold text-gray-900">{student.address}</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Shaxsiy Ma&apos;lumotlar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {student.date_of_birth && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 rounded-md bg-orange-100 text-orange-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Tug&apos;ilgan sana</p>
                  <p className="font-semibold text-gray-900">{formatDate(student.date_of_birth)}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-2 rounded-md bg-pink-100 text-pink-600">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Jins</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {student.gender === "male" ? "Erkak" : student.gender === "female" ? "Ayol" : "Belgilanmagan"}
                </p>
              </div>
            </div>
            {nationality && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 rounded-md bg-indigo-100 text-indigo-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Millati</p>
                  <p className="font-semibold text-gray-900">{nationality}</p>
                </div>
              </div>
            )}
            {student.personal_number && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 rounded-md bg-teal-100 text-teal-600">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Shaxsiy raqam</p>
                  <p className="font-semibold text-gray-900">{student.personal_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Passport Information */}
        {(passportNumber || passportIssuedDate || passportExpiryDate) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Pasport Ma&apos;lumotlari
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {passportNumber && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="p-2 rounded-md bg-amber-100 text-amber-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Pasport seriya va raqam</p>
                      <p className="font-semibold text-gray-900">{passportNumber}</p>
                    </div>
                  </div>
                )}
                {passportIssuedDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="p-2 rounded-md bg-cyan-100 text-cyan-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Berilgan sana</p>
                      <p className="font-semibold text-gray-900">{formatDate(passportIssuedDate)}</p>
                    </div>
                  </div>
                )}
                {passportExpiryDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="p-2 rounded-md bg-red-100 text-red-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Amal qilish muddati</p>
                      <p className="font-semibold text-gray-900">{formatDate(passportExpiryDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Additional Documents */}
        {(student.birth_certificate || student.membership_id) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Qo&apos;shimcha Hujjatlar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {student.birth_certificate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="p-2 rounded-md bg-emerald-100 text-emerald-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Tug&apos;ilganlik guvohnomasi</p>
                      <p className="font-semibold text-gray-900">{student.birth_certificate}</p>
                    </div>
                  </div>
                )}
                {student.membership_id && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="p-2 rounded-md bg-violet-100 text-violet-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">A&apos;zolik ID</p>
                      <p className="font-semibold text-gray-900">{student.membership_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
