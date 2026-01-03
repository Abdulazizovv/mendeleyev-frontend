# Academic System - Quick Start Guide

## 🚀 Getting Started

This guide will help you integrate the academic system into your application.

---

## 📦 Prerequisites

All core dependencies are already installed:
- ✅ React Query (`@tanstack/react-query`)
- ✅ React Hook Form (`react-hook-form`)
- ✅ Sonner (`sonner` for toasts)
- ✅ shadcn/ui components
- ✅ Next.js 14+ with App Router

---

## 🏗️ Project Structure

```
/types/
  academic.ts              # All TypeScript interfaces

/lib/features/
  schedule/
    api.ts                 # Schedule/Lessons API functions
    hooks.ts               # React Query hooks
    components/
      TimetableGrid.tsx    # Weekly timetable view
      LessonList.tsx       # Lessons with filters
  
  attendance/
    api.ts                 # Attendance API functions
    hooks.ts               # React Query hooks
    components/
      AttendanceSheet.tsx  # Bulk marking interface
  
  grades/
    api.ts                 # Grades/Assessments API
    hooks.ts               # React Query hooks
    components/
      GradeEntrySheet.tsx     # Bulk grading
      StudentReportCard.tsx   # Report card view
  
  homework/
    api.ts                 # Homework API functions
    hooks.ts               # React Query hooks
    components/
      HomeworkAssignmentForm.tsx  # Create/Edit form

/app/(dashboard)/
  teacher/
    lessons/page.tsx       # Teacher lessons page
  student/
    grades/page.tsx        # Student grades page
```

---

## 💻 Usage Examples

### 1. Display Weekly Timetable

```tsx
'use client';

import { useTimetableSlots } from '@/lib/features/schedule/hooks';
import { TimetableGrid } from '@/lib/features/schedule/components/TimetableGrid';

export default function TimetablePage() {
  const { data, isLoading } = useTimetableSlots({ template_id: 'xxx' });

  return (
    <TimetableGrid
      slots={data?.results || []}
      isLoading={isLoading}
      editable={true}
      onSlotClick={(slot) => console.log('Clicked:', slot)}
    />
  );
}
```

### 2. Mark Attendance

```tsx
'use client';

import { useAttendanceSheet, useBulkMarkAttendance } from '@/lib/features/attendance/hooks';
import { AttendanceSheetComponent } from '@/lib/features/attendance/components/AttendanceSheet';

export default function MarkAttendancePage({ lessonId }: { lessonId: string }) {
  const { data: sheet, isLoading } = useAttendanceSheet(lessonId);
  const bulkMark = useBulkMarkAttendance();

  const handleSave = async (records) => {
    await bulkMark.mutateAsync({ lesson_id: lessonId, records });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <AttendanceSheetComponent
      sheet={sheet!}
      onSave={handleSave}
      canLock={true}
    />
  );
}
```

### 3. Grade Students

```tsx
'use client';

import { useAssessment, useGradeEntries, useBulkCreateGradeEntries } from '@/lib/features/grades/hooks';
import { GradeEntrySheet } from '@/lib/features/grades/components/GradeEntrySheet';

export default function GradingPage({ assessmentId }: { assessmentId: string }) {
  const { data: assessment } = useAssessment(assessmentId);
  const { data: entries } = useGradeEntries({ assessment_id: assessmentId });
  const bulkGrade = useBulkCreateGradeEntries();

  const handleSave = async (grades) => {
    await bulkGrade.mutateAsync({ assessment_id: assessmentId, grades });
  };

  return (
    <GradeEntrySheet
      assessment={assessment!}
      entries={entries?.results || []}
      onSave={handleSave}
      canLock={true}
    />
  );
}
```

### 4. Create Homework Assignment

```tsx
'use client';

import { useCreateHomeworkAssignment } from '@/lib/features/homework/hooks';
import { HomeworkAssignmentForm } from '@/lib/features/homework/components/HomeworkAssignmentForm';
import { useRouter } from 'next/navigation';

export default function CreateHomeworkPage() {
  const router = useRouter();
  const createHomework = useCreateHomeworkAssignment();

  const handleSubmit = async (data) => {
    await createHomework.mutateAsync(data);
    router.push('/teacher/homework');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Create Homework</h1>
      <HomeworkAssignmentForm
        onSubmit={handleSubmit}
        subjects={[/* fetch subjects */]}
        classes={[/* fetch classes */]}
      />
    </div>
  );
}
```

### 5. View Student Report Card

```tsx
'use client';

import { useStudentReportCard } from '@/lib/features/grades/hooks';
import { StudentReportCard } from '@/lib/features/grades/components/StudentReportCard';

export default function StudentReportPage({ studentId }: { studentId: string }) {
  const [quarter, setQuarter] = React.useState(1);
  const { data, isLoading } = useStudentReportCard(studentId, quarter);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Quarter Selector */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((q) => (
          <button key={q} onClick={() => setQuarter(q)}>
            Quarter {q}
          </button>
        ))}
      </div>

      {/* Report Card */}
      <StudentReportCard
        summaries={data || []}
        quarter={quarter}
        isLoading={isLoading}
      />
    </div>
  );
}
```

---

## 🔐 Permission Handling

Add permission checks to your pages:

```tsx
'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { redirect } from 'next/navigation';

export default function TeacherOnlyPage() {
  const { user, hasPermission } = useAuthStore();

  if (!hasPermission('view_lessoninstance')) {
    redirect('/dashboard');
  }

  return <YourComponent />;
}
```

---

## 🎨 Component Props Reference

### TimetableGrid

```typescript
interface TimetableGridProps {
  slots: TimetableSlot[];              // Timetable slots data
  isLoading?: boolean;                 // Loading state
  onSlotClick?: (slot) => void;        // Click handler
  onSlotEdit?: (slot) => void;         // Edit handler
  onSlotDelete?: (slot) => void;       // Delete handler
  editable?: boolean;                  // Show edit/delete buttons
  className?: string;
}
```

### AttendanceSheetComponent

```typescript
interface AttendanceSheetProps {
  sheet: AttendanceSheet;              // Attendance data
  isLoading?: boolean;
  onSave: (records) => Promise<void>;  // Save handler
  onLock?: () => void;                 // Lock handler
  onUnlock?: () => void;               // Unlock handler (admin)
  canLock?: boolean;                   // Show lock button
  canUnlock?: boolean;                 // Show unlock button
  className?: string;
}
```

### GradeEntrySheet

```typescript
interface GradeEntrySheetProps {
  assessment: Assessment;              // Assessment details
  entries: GradeEntry[];               // Student grades
  isLoading?: boolean;
  onSave: (grades) => Promise<void>;   // Save handler
  onLock?: () => void;                 // Lock handler
  onUnlock?: () => void;               // Unlock handler
  canLock?: boolean;
  canUnlock?: boolean;
  className?: string;
}
```

### StudentReportCard

```typescript
interface StudentReportCardProps {
  summaries: GradeSummary[];           // Grade summaries
  studentName?: string;
  quarter: number;                     // Current quarter
  isLoading?: boolean;
  className?: string;
}
```

---

## 🔧 API Configuration

Ensure your API client is configured:

```typescript
// /lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const branchId = localStorage.getItem('CURRENT_BRANCH');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (branchId) {
    config.headers['X-Branch-Id'] = branchId;
  }
  
  return config;
});

// Add error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logout and redirect
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📊 Common Patterns

### 1. Filtering Data

```tsx
const { data } = useLessonInstances({
  class_id: 'xxx',
  date_from: '2024-01-01',
  date_to: '2024-01-31',
  status: 'planned',
});
```

### 2. Optimistic Updates

```tsx
const updateLesson = useUpdateLessonInstance();

await updateLesson.mutateAsync(
  { id: 'xxx', data: { notes: 'Updated' } },
  {
    onSuccess: () => {
      // Query automatically invalidated by hook
    },
  }
);
```

### 3. Error Handling

```tsx
const createAssessment = useCreateAssessment();

try {
  await createAssessment.mutateAsync(data);
} catch (error: any) {
  if (error.response?.status === 403) {
    alert('Permission denied');
  } else if (error.response?.status === 409) {
    alert('Conflict detected');
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot read property 'id' of undefined"

**Solution:** Add null checks and loading states:

```tsx
const { data, isLoading } = useAssessment(id);

if (isLoading) return <Skeleton />;
if (!data) return <div>Not found</div>;

return <YourComponent data={data} />;
```

### Issue: "Network Error"

**Solution:** Check API client configuration and CORS settings.

### Issue: "Permission Denied (403)"

**Solution:** Verify user has correct permissions in backend.

---

## 📚 Next Steps

1. ✅ Implement remaining pages (see ACADEMIC_IMPLEMENTATION_PLAN.md)
2. ✅ Add permission guards to all routes
3. ✅ Implement export functionality (PDF/Excel)
4. ✅ Add real-time notifications (optional)
5. ✅ Write integration tests
6. ✅ Deploy to production

---

## 🤝 Support

For issues or questions:
1. Check [ACADEMIC_SYSTEM_IMPLEMENTATION_SUMMARY.md](./ACADEMIC_SYSTEM_IMPLEMENTATION_SUMMARY.md)
2. Review [Backend API Documentation](./ACADEMIC_SYSTEM_FRONTEND_API.md)
3. Check component source code for JSDoc comments

---

**Happy Coding! 🚀**
