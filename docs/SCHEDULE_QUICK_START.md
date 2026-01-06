# Schedule System - Quick Start

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

Already includes:
- `@dnd-kit/core` - Drag & drop
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - Utilities
- `@radix-ui/react-tooltip` - Tooltips

### 2. Routes

**View Schedule** (Read-Only)
```
/branch-admin/schedule
```

**Edit Schedule** (Drag & Drop)
```
/branch-admin/schedule/edit
```

### 3. Usage

#### As Admin User
1. Login as branch admin
2. Navigate to "Schedule" in sidebar
3. See weekly timetable
4. Click "Edit Schedule" to modify
5. Drag lessons to reschedule
6. Click lessons to edit details
7. Click "View Mode" when done

---

## 📂 Key Files

### Pages
- `app/(dashboard)/branch-admin/schedule/page.tsx` - View mode
- `app/(dashboard)/branch-admin/schedule/edit/page.tsx` - Edit mode

### Components (Viewing)
- `WeeklyTimetableGrid.tsx` - Grid layout
- `LessonCard.tsx` - Individual lesson
- `LessonModal.tsx` - Detail modal
- `CurrentTimeIndicator.tsx` - Red time line

### Components (Editing)
- `DraggableLessonCard.tsx` - Draggable lesson
- `DroppableTimeSlot.tsx` - Drop target
- `EditLessonDrawer.tsx` - Quick edit

### Utilities
- `utils/time.ts` - Time calculations
- `utils/timetable.ts` - Lesson grouping

---

## 🔧 Common Tasks

### Add New Feature to View Mode

```typescript
// app/(dashboard)/branch-admin/schedule/page.tsx

export default function BranchAdminSchedulePage() {
  // Your feature here
  const handleMyFeature = () => {
    // Implementation
  };

  return (
    <div>
      <Button onClick={handleMyFeature}>My Feature</Button>
      {/* Rest of page */}
    </div>
  );
}
```

### Add New Feature to Edit Mode

```typescript
// app/(dashboard)/branch-admin/schedule/edit/page.tsx

export default function ScheduleEditPage() {
  // Your feature here
  const handleMyEditFeature = () => {
    // Implementation
  };

  return (
    <DndContext>
      <Button onClick={handleMyEditFeature}>My Edit Feature</Button>
      {/* Rest of page */}
    </DndContext>
  );
}
```

### Customize Drag Behavior

```typescript
// In edit/page.tsx

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Pixels before drag starts
    },
  })
);
```

### Add Custom Validation

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  // Your custom validation
  if (!myCustomValidation(lesson)) {
    toast.error('Custom validation failed');
    return;
  }

  // Proceed with update
  await updateLesson.mutateAsync({...});
};
```

---

## 🎨 Customization

### Change Subject Colors

Edit `lib/features/schedule/utils/timetable.ts`:

```typescript
export const getSubjectColor = (subjectName: string) => {
  const colors = {
    Mathematics: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    // Add your custom colors here
    'My Subject': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  };
  return colors[subjectName] || colors.default;
};
```

### Change Grid Layout

Edit `WeeklyTimetableGrid.tsx`:

```typescript
<div className="grid grid-cols-[120px_repeat(6,1fr)] gap-px">
  {/* Change column widths, gaps, etc. */}
</div>
```

### Add More Days

Edit `DAYS` constant in both pages:

```typescript
const DAYS = [
  { value: 1, label: 'Monday' },
  // ... existing days
  { value: 7, label: 'Sunday' }, // Add Sunday
];
```

---

## 🐛 Troubleshooting

### Drag & Drop Not Working

**Check:**
1. Is `@dnd-kit` installed?
   ```bash
   npm list @dnd-kit/core
   ```
2. Is `DndContext` wrapping the grid?
3. Are sensors configured?

**Fix:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Lessons Not Showing

**Check:**
1. Is branch selected?
2. Are lessons generated from templates?
3. Check network tab for API errors

**Debug:**
```typescript
console.log('Branch ID:', branchId);
console.log('Lessons:', lessons);
console.log('Date range:', formatDateForAPI(currentWeekStart), formatDateForAPI(weekEnd));
```

### Conflicts Not Detected

**Check:**
1. Backend API returns 409 status
2. Error handling in `handleDragEnd`

**Test:**
```bash
curl -X PATCH /api/v1/school/branches/{id}/lessons/{lesson_id}/ \
  -d '{"date": "2024-01-15", "start_time": "09:00:00"}'
```

### TypeScript Errors

**Clear cache:**
```bash
rm -rf .next
npm run dev
```

**Check imports:**
```typescript
// Correct
import { WeeklyTimetableGrid } from '@/lib/features/schedule/components/WeeklyTimetableGrid';

// Wrong
import { WeeklyTimetableGrid } from '@/lib/features/schedule';
```

---

## 📊 Performance Tips

1. **Reduce Drag Distance**
   ```typescript
   activationConstraint: { distance: 5 }
   ```

2. **Debounce Updates**
   ```typescript
   import { useDebouncedCallback } from 'use-debounce';
   
   const debouncedUpdate = useDebouncedCallback(
     (data) => updateLesson.mutateAsync(data),
     500
   );
   ```

3. **Virtualize Long Lists**
   ```bash
   npm install react-virtual
   ```

4. **Optimize Re-renders**
   ```typescript
   const MemoizedLessonCard = React.memo(LessonCard);
   ```

---

## 🧪 Testing

### Manual Testing Checklist

**View Mode:**
- [ ] Week navigation works
- [ ] Lessons display correctly
- [ ] Current time indicator shows
- [ ] Modal opens on click
- [ ] Navigate to edit mode

**Edit Mode:**
- [ ] Drag lesson to new time
- [ ] Drag lesson to new day
- [ ] Edit drawer opens
- [ ] Save changes works
- [ ] Delete confirmation shows
- [ ] Navigate back to view mode

### API Testing

```bash
# Get lessons
curl http://localhost:8000/api/v1/school/branches/{id}/lessons/?date_from=2024-01-15&date_to=2024-01-20

# Update lesson
curl -X PATCH http://localhost:8000/api/v1/school/branches/{id}/lessons/{lesson_id}/ \
  -H "Content-Type: application/json" \
  -d '{"start_time": "10:00:00"}'
```

---

## 📝 Code Snippets

### Get Lessons for Week

```typescript
const { data, isLoading } = useLessonInstances(branchId, {
  date_from: formatDateForAPI(weekStart),
  date_to: formatDateForAPI(weekEnd),
});
```

### Update Lesson

```typescript
const updateLesson = useUpdateLessonInstance(branchId);

await updateLesson.mutateAsync({
  id: lessonId,
  data: {
    start_time: "09:00:00",
    end_time: "09:45:00",
    room_name: "Room 101",
  },
});
```

### Handle Drag

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  const lessonId = active.id as string;
  const { dayOfWeek, timeSlot } = over.data.current;
  
  await updateLesson.mutateAsync({
    id: lessonId,
    data: { /* new date/time */ },
  });
};
```

---

## 🔗 Useful Links

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [date-fns](https://date-fns.org/)

---

## ❓ FAQ

**Q: Can I add Sunday to the schedule?**
A: Yes, update the `DAYS` constant and adjust backend if needed.

**Q: How do I change the time format?**
A: Edit `formatTimeForDisplay()` in `utils/time.ts`.

**Q: Can I disable drag & drop?**
A: Yes, wrap grid without `DndContext` or add a toggle.

**Q: How do I add bulk operations?**
A: Add selection state and process multiple lessons in loop.

**Q: Can I integrate with calendar apps?**
A: Yes, add iCal/ICS export using library like `ics`.

---

## 🎓 Learning Resources

1. **Drag & Drop Tutorial**: Read dnd-kit examples
2. **React Query Guide**: TanStack Query docs
3. **Component Patterns**: Existing components as reference
4. **API Integration**: Backend docs in `/docs`

---

**Need Help?** Check the full guide: [SCHEDULE_REBUILD_GUIDE.md](./SCHEDULE_REBUILD_GUIDE.md)
