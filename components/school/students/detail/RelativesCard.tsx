import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail } from "lucide-react";

interface RelativesCardProps {
  relatives: any[];
}

export function RelativesCard({ relatives }: RelativesCardProps) {
  if (relatives.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Yaqinlar ({relatives.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {relatives.map((relative: any) => (
          <div
            key={relative.id}
            className="p-4 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">
                  {relative.first_name} {relative.middle_name}{" "}
                  {relative.last_name}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {relative.relationship_type}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {relative.phone_number}
                  </p>
                  {relative.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {relative.email}
                    </p>
                  )}
                  {relative.workplace && (
                    <p className="text-sm text-gray-600">
                      {relative.workplace}
                      {relative.position && ` • ${relative.position}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {relative.is_primary_contact && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Asosiy
                  </Badge>
                )}
                {relative.is_guardian && (
                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                    Vasiy
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
