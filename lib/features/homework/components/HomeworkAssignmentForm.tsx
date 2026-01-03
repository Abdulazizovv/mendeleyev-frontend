/**
 * Homework Assignment Form Component
 * Create/Edit homework assignments (Teacher view)
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import type { HomeworkAssignment } from '@/types/academic';

interface HomeworkAssignmentFormData {
  subject_id: string;
  class_id: string;
  topic_id?: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  max_score?: number;
}

interface HomeworkAssignmentFormProps {
  defaultValues?: Partial<HomeworkAssignment>;
  onSubmit: (data: HomeworkAssignmentFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  subjects?: Array<{ id: string; name: string }>;
  classes?: Array<{ id: string; name: string }>;
  topics?: Array<{ id: string; name: string }>;
}

export const HomeworkAssignmentForm: React.FC<HomeworkAssignmentFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  subjects = [],
  classes = [],
  topics = [],
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<HomeworkAssignmentFormData>({
    defaultValues: {
      subject_id: defaultValues?.subject_id || '',
      class_id: defaultValues?.class_id || '',
      topic_id: defaultValues?.topic_id || '',
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      assigned_date: defaultValues?.assigned_date || new Date().toISOString().split('T')[0],
      due_date: defaultValues?.due_date || '',
      max_score: defaultValues?.max_score || undefined,
    },
  });

  const selectedSubject = watch('subject_id');

  const handleFormSubmit = async (data: HomeworkAssignmentFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {defaultValues ? 'Edit Homework Assignment' : 'Create Homework Assignment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Subject & Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject_id">
                Subject <span className="text-red-500">*</span>
              </Label>
              <select
                id="subject_id"
                {...register('subject_id', { required: 'Subject is required' })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isLoading}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subject_id && (
                <p className="text-sm text-red-500">{errors.subject_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class_id">
                Class <span className="text-red-500">*</span>
              </Label>
              <select
                id="class_id"
                {...register('class_id', { required: 'Class is required' })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isLoading}
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {errors.class_id && (
                <p className="text-sm text-red-500">{errors.class_id.message}</p>
              )}
            </div>
          </div>

          {/* Topic (Optional) */}
          {topics.length > 0 && selectedSubject && (
            <div className="space-y-2">
              <Label htmlFor="topic_id">Topic (Optional)</Label>
              <select
                id="topic_id"
                {...register('topic_id')}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isLoading}
              >
                <option value="">No specific topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
              })}
              placeholder="e.g., Chapter 5 Practice Problems"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
              })}
              placeholder="Provide detailed instructions for the homework..."
              rows={5}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_date">
                Assigned Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="assigned_date"
                  type="date"
                  {...register('assigned_date', { required: 'Assigned date is required' })}
                  disabled={isLoading}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.assigned_date && (
                <p className="text-sm text-red-500">{errors.assigned_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="due_date"
                  type="date"
                  {...register('due_date', {
                    required: 'Due date is required',
                    validate: (value) => {
                      const assigned = watch('assigned_date');
                      return (
                        new Date(value) >= new Date(assigned) ||
                        'Due date must be after assigned date'
                      );
                    },
                  })}
                  disabled={isLoading}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.due_date && (
                <p className="text-sm text-red-500">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          {/* Max Score (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="max_score">Maximum Score (Optional)</Label>
            <Input
              id="max_score"
              type="number"
              min={0}
              step={1}
              {...register('max_score', {
                valueAsNumber: true,
                min: { value: 0, message: 'Score must be positive' },
              })}
              placeholder="e.g., 100"
              disabled={isLoading}
            />
            {errors.max_score && (
              <p className="text-sm text-red-500">{errors.max_score.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : defaultValues ? 'Update' : 'Create'} Homework
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
