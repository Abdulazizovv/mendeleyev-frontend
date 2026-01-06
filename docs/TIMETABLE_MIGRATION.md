# Migration Guide: Old Schedule → New Timetable

## Overview
This guide helps you migrate from the old template-based schedule page to the new lesson-based timetable page.

## Key Differences

### Old System (Template-Based)
- **Path**: `/branch-admin/schedule`
- **Data**: TimetableTemplates & TimetableSlots
- **Purpose**: Template management (abstract definitions)
- **UI**: List of templates with slot management dialogs

### New System (Lesson-Based)
- **Path**: `/branch-admin/timetable`
- **Data**: LessonInstances (actual lessons)
- **Purpose**: Weekly schedule viewing and management
- **UI**: Visual weekly grid with real lessons

## File Changes

### Created Files
```
✅ app/(dashboard)/branch-admin/timetable/page.tsx
✅ lib/features/schedule/components/WeeklyTimetableGrid.tsx
✅ lib/features/schedule/components/LessonCard.tsx
✅ lib/features/schedule/components/CurrentTimeIndicator.tsx
✅ lib/features/schedule/components/LessonModal.tsx
✅ lib/features/schedule/utils/time.ts
✅ lib/features/schedule/utils/timetable.ts
✅ lib/features/schedule/index.ts
✅ components/ui/tooltip.tsx
✅ docs/TIMETABLE_IMPLEMENTATION.md
```

### Preserved Files
```
✓ app/(dashboard)/branch-admin/schedule/page.tsx (template management)
✓ lib/features/schedule/components/TimetableGrid.tsx (legacy)
✓ lib/features/schedule/components/LessonList.tsx (legacy)
✓ components/schedule/*.tsx (dialogs for template management)
```

## Navigation Update

### Option 1: Replace Schedule Route
If you want to completely replace the old page:

**Rename/Move:**
```bash
mv app/(dashboard)/branch-admin/schedule/page.tsx \
   app/(dashboard)/branch-admin/schedule-templates/page.tsx
   
mv app/(dashboard)/branch-admin/timetable/page.tsx \
   app/(dashboard)/branch-admin/schedule/page.tsx
```

### Option 2: Keep Both (Recommended)
Keep both pages with different purposes:

**Routes:**
- `/branch-admin/schedule` → Template Management (old)
- `/branch-admin/timetable` → Weekly View (new)

**Update Navigation:**
```tsx
// In your sidebar/navigation
<nav>
  <NavItem href="/branch-admin/timetable" icon={CalendarDays}>
    Weekly Timetable
  </NavItem>
  <NavItem href="/branch-admin/schedule" icon={Settings}>
    Schedule Templates
  </NavItem>
</nav>
```

## Usage Workflow

### Complete Admin Workflow
1. **Create Templates** (`/schedule`)
   - Define weekly schedule patterns
   - Set up time slots for classes
   
2. **Generate Lessons** (link from `/schedule` or separate page)
   - Convert templates to actual lessons
   - Specify date range
   
3. **View & Manage** (`/timetable`)
   - See all lessons in visual grid
   - Complete/cancel lessons
   - Monitor weekly schedule

## API Usage

### Old Page (Templates)
```typescript
const { data: templates } = useTimetableTemplates(branchId, { is_active: true });
const { data: slots } = useTimetableSlots(branchId, templateId, {});
```

### New Page (Lessons)
```typescript
const { data: lessons } = useLessonInstances(branchId, {
  date_from: '2024-01-15',
  date_to: '2024-01-20',
});
```

## Component Migration

### If you want to use the new grid elsewhere:

```tsx
import { WeeklyTimetableGrid } from '@/lib/features/schedule';

<WeeklyTimetableGrid
  lessons={lessons}
  weekStart={weekStart}
  onLessonClick={handleLessonClick}
  isLoading={isLoading}
/>
```

### For Teacher's View:
```tsx
// Filter lessons by teacher
const teacherLessons = lessons.filter(l => l.teacher_id === currentTeacherId);

<WeeklyTimetableGrid
  lessons={teacherLessons}
  weekStart={weekStart}
  onLessonClick={handleLessonClick}
/>
```

## Feature Comparison

| Feature | Old Schedule | New Timetable |
|---------|-------------|---------------|
| View Type | List/Tabs | Visual Grid |
| Data Type | Templates | Real Lessons |
| Time View | By template | Weekly |
| Current Time | No | Yes (red line) |
| Status Tracking | No | Yes |
| Lesson Actions | No | Complete/Cancel |
| Navigation | Template tabs | Week arrows |
| Mobile | Responsive | Scroll |

## Package Installation

New dependency added:
```bash
npm install @radix-ui/react-tooltip
```

Already included in package.json after first install.

## Backward Compatibility

✅ **All existing code still works**
- Old schedule page unchanged
- Template management intact
- All hooks preserved
- No breaking changes

## Testing Checklist

After migration, verify:
- [ ] Old schedule page still accessible
- [ ] New timetable page loads
- [ ] Week navigation works
- [ ] Lessons display correctly
- [ ] Click lesson opens modal
- [ ] Complete/cancel actions work
- [ ] Current time indicator appears
- [ ] Stats cards show correct numbers

## Rollback Plan

If issues arise, simply:
1. Keep using `/schedule` (old page)
2. Fix issues in `/timetable` (new page)
3. No data loss (separate endpoints)

## Next Steps

1. **Add Navigation Link** to sidebar
2. **Generate Lessons** from templates
3. **Test with Real Data** in production
4. **Collect User Feedback** from admins
5. **Iterate on Features** (edit, filters, etc.)

## Support

If you encounter issues:
1. Check console for errors
2. Verify API responses
3. Test with different date ranges
4. Review [TIMETABLE_IMPLEMENTATION.md](./TIMETABLE_IMPLEMENTATION.md)

---

**Migration Difficulty**: Easy
**Breaking Changes**: None
**Recommended Approach**: Option 2 (Keep Both)
