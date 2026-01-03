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
import { useDeleteTimetableSlot } from '@/lib/features/schedule/hooks';
import type { TimetableSlot } from '@/types/academic';

interface DeleteSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  templateId: string;
  slot: TimetableSlot | null;
}

const DAYS_OF_WEEK: Record<number, string> = {
  1: 'Dushanba',
  2: 'Seshanba',
  3: 'Chorshanba',
  4: 'Payshanba',
  5: 'Juma',
  6: 'Shanba',
  7: 'Yakshanba',
};

export function DeleteSlotDialog({
  open,
  onOpenChange,
  branchId,
  templateId,
  slot,
}: DeleteSlotDialogProps) {
  const deleteSlot = useDeleteTimetableSlot(branchId, templateId);

  const handleDelete = async () => {
    if (!slot) return;

    try {
      await deleteSlot.mutateAsync(slot.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dars vaqtini o&apos;chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Quyidagi dars vaqtini o&apos;chirmoqchimisiz?
            <br />
            <br />
            <div className="space-y-1 text-foreground">
              <div>
                <span className="font-semibold">Sinf-Fan:</span>{' '}
                {slot?.class_subject?.class_name} - {slot?.class_subject?.subject_name}
              </div>
              <div>
                <span className="font-semibold">Kun:</span>{' '}
                {slot?.day_of_week ? DAYS_OF_WEEK[slot.day_of_week] : '-'}
              </div>
              <div>
                <span className="font-semibold">Vaqt:</span> {slot?.start_time} - {slot?.end_time}
              </div>
              {slot?.room && (
                <div>
                  <span className="font-semibold">Xona:</span> {slot.room}
                </div>
              )}
            </div>
            <br />
            Bu amalni qaytarib bo&apos;lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSlot.isPending}>
            Bekor qilish
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSlot.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteSlot.isPending ? 'O\'chirilmoqda...' : 'Ha, o\'chirish'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
