'use client';

import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTimetableSlot } from '@/lib/features/schedule/hooks';
import type { CreateTimetableSlot } from '@/types/academic';

interface CreateSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  templateId: string;
  classSubjects?: Array<{ id: string; class_name: string; subject_name: string }>;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
  { value: 7, label: 'Yakshanba' },
];

export function CreateSlotDialog({
  open,
  onOpenChange,
  branchId,
  templateId,
  classSubjects = [],
}: CreateSlotDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateTimetableSlot>();

  const createSlot = useCreateTimetableSlot(branchId, templateId);

  const onSubmit = async (data: CreateTimetableSlot) => {
    try {
      await createSlot.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yangi dars vaqti qo&apos;shish</DialogTitle>
          <DialogDescription>
            Dars jadvaliga yangi dars vaqtini qo&apos;shing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class_subject_id">Sinf va fan *</Label>
            <Select
              onValueChange={(value) => setValue('class_subject', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sinf va fanni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {classSubjects.map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.class_name} - {cs.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class_subject && (
              <p className="text-sm text-destructive">{errors.class_subject.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Hafta kuni *</Label>
              <Select
                onValueChange={(value) => {
                  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  setValue('day_of_week', dayNames[parseInt(value, 10) - 1] as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kunni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.day_of_week && (
                <p className="text-sm text-destructive">{errors.day_of_week.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson_number">Dars raqami *</Label>
              <Input
                id="lesson_number"
                type="number"
                min="1"
                {...register('lesson_number', {
                  required: 'Dars raqami majburiy',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Minimum 1' },
                })}
                placeholder="Masalan: 1"
              />
              {errors.lesson_number && (
                <p className="text-sm text-destructive">{errors.lesson_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Boshlanish vaqti *</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time', { required: 'Vaqt majburiy' })}
              />
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Tugash vaqti *</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time', { required: 'Vaqt majburiy' })}
              />
              {errors.end_time && (
                <p className="text-sm text-destructive">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Xona</Label>
            <Input
              id="room"
              {...register('room')}
              placeholder="Masalan: 201 xona"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSlot.isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={createSlot.isPending}>
              {createSlot.isPending ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
