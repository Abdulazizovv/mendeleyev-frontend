'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import type { Timetable } from '@/types/academic';
import { formatDateUz } from '../constants/translations';

interface GenerateLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplateId: string; // Use current template automatically
  currentTemplateName?: string; // Display name in UI
  onSubmit: (data: GenerateLessonsData) => void;
  isGenerating?: boolean;
  generationResult?: {
    created: number;
    skipped: number;
    updated: number;
  } | null;
}

export interface GenerateLessonsData {
  timetable_id: string; // Changed to string to match backend
  start_date: string;
  end_date: string;
  skip_existing: boolean;
}

type DateRangePreset = 'this_week' | 'next_week' | 'this_month' | 'next_month' | 'custom';

export function GenerateLessonsDialog({
  open,
  onOpenChange,
  currentTemplateId,
  currentTemplateName,
  onSubmit,
  isGenerating = false,
  generationResult = null,
}: GenerateLessonsDialogProps) {
  const [preset, setPreset] = useState<DateRangePreset>('this_week');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [skipExisting, setSkipExisting] = useState(true);

  // Calculate date range based on preset
  const getDateRange = (): { start: Date; end: Date } => {
    const today = new Date();
    
    switch (preset) {
      case 'this_week':
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 }),
        };
      case 'next_week':
        return {
          start: startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }),
          end: endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }),
        };
      case 'this_month':
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        };
      case 'next_month':
        return {
          start: startOfMonth(addMonths(today, 1)),
          end: endOfMonth(addMonths(today, 1)),
        };
      case 'custom':
        return {
          start: customStartDate || today,
          end: customEndDate || today,
        };
      default:
        return { start: today, end: today };
    }
  };

  const handleGenerate = () => {
    if (!currentTemplateId) return;
    
    const { start, end } = getDateRange();
    
    onSubmit({
      timetable_id: currentTemplateId,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
      skip_existing: skipExisting,
    });
  };

  const { start, end } = getDateRange();
  const isFormValid = currentTemplateId && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Darslar generatsiya qilish
          </DialogTitle>
          <DialogDescription>
            Jadval asosida avtomatik ravishda darslar yaratiladi
          </DialogDescription>
        </DialogHeader>

        {generationResult ? (
          // Success result view
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Generatsiya muvaffaqiyatli yakunlandi!
              </h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-700">
                    {generationResult.created}
                  </p>
                  <p className="text-xs text-gray-600">Yaratildi</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-2xl font-bold text-blue-700">
                    {generationResult.updated || 0}
                  </p>
                  <p className="text-xs text-gray-600">Yangilandi</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-gray-700">
                    {generationResult.skipped}
                  </p>
                  <p className="text-xs text-gray-600">O'tkazildi</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full">
                Yopish
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Form view
          <div className="space-y-6 py-4">
            {/* Current Template Info */}
            {currentTemplateName && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Aktiv jadval</p>
                    <p className="text-sm text-blue-700">{currentTemplateName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date Range Preset */}
            <div className="space-y-2">
              <Label>Davr</Label>
              <Select
                value={preset}
                onValueChange={(value) => setPreset(value as DateRangePreset)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">Shu hafta</SelectItem>
                  <SelectItem value="next_week">Keyingi hafta</SelectItem>
                  <SelectItem value="this_month">Shu oy</SelectItem>
                  <SelectItem value="next_month">Keyingi oy</SelectItem>
                  <SelectItem value="custom">Boshqa davr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Boshlanish sanasi</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate ? format(customStartDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Tugash sanasi</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate ? format(customEndDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}

            {/* Date Range Preview */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Davr:</span>{' '}
                {formatDateUz(start)} - {formatDateUz(end)}
              </p>
            </div>

            {/* Skip Existing Option */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="skip-existing"
                checked={skipExisting}
                onCheckedChange={(checked) => setSkipExisting(checked as boolean)}
                disabled={isGenerating}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="skip-existing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mavjud darslarni o'tkazib yuborish
                </label>
                <p className="text-xs text-gray-500">
                  Agar ushbu vaqtda dars mavjud bo'lsa, yangi dars yaratilmaydi
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!isFormValid}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generatsiya qilinmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generatsiya qilish
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
