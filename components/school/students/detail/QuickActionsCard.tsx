import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Users, Edit, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsCardProps {
  studentId: string;
}

export function QuickActionsCard({ studentId }: QuickActionsCardProps) {
  const router = useRouter();

  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="w-5 h-5 text-indigo-600" />
          Tezkor Harakatlar
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-green-50 hover:border-green-300 transition-colors"
          onClick={() =>
            router.push(
              `/branch-admin/finance/payments/create?student=${studentId}`
            )
          }
        >
          <CreditCard className="w-4 h-4 mr-2 text-green-600" />
          To&apos;lov Qabul Qilish
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors"
          onClick={() => router.push(`/branch-admin/students/${studentId}/edit`)}
        >
          <Edit className="w-4 h-4 mr-2 text-blue-600" />
          O&apos;quvchini Tahrirlash
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-orange-50 hover:border-orange-300 transition-colors"
          onClick={() => router.push(`/branch-admin/students/${studentId}/edit#relatives`)}
        >
          <Users className="w-4 h-4 mr-2 text-orange-600" />
          Yaqinlar Boshqaruvi
        </Button>
      </CardContent>
    </Card>
  );
}
