'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateTimetableTemplate } from '@/lib/features/schedule/hooks';
import type { CreateTimetableTemplate } from '@/types/academic';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  branchId,
}: CreateTemplateDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTimetableTemplate>();

  const createTemplate = useCreateTimetableTemplate(branchId);

  const onSubmit = async (data: CreateTimetableTemplate) => {
    try {
      await createTemplate.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yangi dars jadvali shabloni</DialogTitle>
          <DialogDescription>
            Yangi o&apos;quv yili uchun dars jadvali shablonini yarating
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Shablon nomi *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Shablon nomi majburiy' })}
              placeholder="Masalan: 2024-2025 o'quv yili"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_year">O&apos;quv yili *</Label>
            <Input
              id="academic_year"
              {...register('academic_year', { required: 'O\'quv yili majburiy' })}
              placeholder="Masalan: 2024-2025"
            />
            {errors.academic_year && (
              <p className="text-sm text-destructive">{errors.academic_year.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Boshlanish sanasi *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date', { required: 'Sana majburiy' })}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Tugash sanasi *</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date', { required: 'Sana majburiy' })}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Ushbu shablon haqida qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTemplate.isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={createTemplate.isPending}>
              {createTemplate.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
