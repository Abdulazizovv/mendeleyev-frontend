'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteTimetableTemplate } from '@/lib/features/schedule/hooks';
import type { TimetableTemplate } from '@/types/academic';

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  template: TimetableTemplate | null;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  branchId,
  template,
}: DeleteTemplateDialogProps) {
  const deleteTemplate = useDeleteTimetableTemplate(branchId);

  const handleDelete = async () => {
    if (!template) return;

    try {
      await deleteTemplate.mutateAsync(template.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Shablonni o&apos;chirish</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">{template?.name}</span> shablonini o&apos;chirmoqchimisiz?
            <br />
            <br />
            <span className="text-destructive font-medium">
              Diqqat: Ushbu shablon bilan bog&apos;liq barcha dars vaqtlari ham o&apos;chiriladi!
            </span>
            <br />
            <br />
            Bu amalni qaytarib bo&apos;lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTemplate.isPending}>
            Bekor qilish
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTemplate.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteTemplate.isPending ? 'O\'chirilmoqda...' : 'Ha, o\'chirish'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
