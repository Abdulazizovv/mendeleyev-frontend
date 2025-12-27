import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Users, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsCardProps {
  studentId: string;
}

export function QuickActionsCard({ studentId }: QuickActionsCardProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tezkor Harakatlar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() =>
            router.push(
              `/branch-admin/finance/payments/create?student=${studentId}`
            )
          }
        >
          <CreditCard className="w-4 h-4 mr-2" />
          To&apos;lov Qabul Qilish
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() =>
            router.push(`/branch-admin/students/${studentId}/relatives/add`)
          }
        >
          <Users className="w-4 h-4 mr-2" />
          Yaqin Qo&apos;shish
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() =>
            router.push(`/branch-admin/students/${studentId}/change-class`)
          }
        >
          <FileText className="w-4 h-4 mr-2" />
          Sinfni O&apos;zgartirish
        </Button>
      </CardContent>
    </Card>
  );
}
