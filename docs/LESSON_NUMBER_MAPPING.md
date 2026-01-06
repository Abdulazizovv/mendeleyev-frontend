# Lesson Number Mapping - Quick Reference

## Overview
**Source of truth** for converting between TIME and LESSON_NUMBER in the timetable system.

## Standard School Day (8 Periods)

| # | Start | End   | Break After | Duration |
|---|-------|-------|-------------|----------|
| 1 | 08:00 | 08:45 | 10 min      | 45 min   |
| 2 | 08:55 | 09:40 | 10 min      | 45 min   |
| 3 | 09:50 | 10:35 | 20 min      | 45 min   |
| 4 | 10:55 | 11:40 | 10 min      | 45 min   |
| 5 | 11:50 | 12:35 | 55 min      | 45 min   |
| 6 | 13:30 | 14:15 | 10 min      | 45 min   |
| 7 | 14:25 | 15:10 | 10 min      | 45 min   |
| 8 | 15:20 | 16:05 | -           | 45 min   |

**Total**: 8 periods × 45 min = 6 hours of instruction  
**School Day**: 08:00 - 16:05 (8 hours 5 minutes including breaks)

## API Usage

### Create/Update TimetableSlot

```typescript
import { createSlotPayload } from '@/lib/features/schedule/utils/lessonNumberMapping';

// ✅ CORRECT: Use helper function
const payload = createSlotPayload(
  classSubjectId,  // string (UUID)
  dayOfWeek,       // 1-7 (Monday=1)
  startTime,       // "09:50:00"
  endTime,         // "10:35:00"
  room,            // "Room 101" (optional)
  templateId       // string (UUID, optional)
);

if (payload) {
  // payload.lesson_number is automatically 3 (derived from startTime)
  await createTimetableSlot(payload);
}

// ❌ WRONG: Manual construction
const wrongPayload = {
  class_subject_id: classSubjectId,
  day_of_week: dayOfWeek,
  lesson_number: 3,  // NEVER HARDCODE THIS!
  start_time: startTime,
  end_time: endTime,
};
```

### Get Lesson Number from Time

```typescript
import { getLessonNumberFromTime } from '@/lib/features/schedule/utils/lessonNumberMapping';

const lessonNumber = getLessonNumberFromTime("09:50:00");
// Returns: 3

const invalid = getLessonNumberFromTime("09:45:00");
// Returns: null (not a valid start time)
```

### Get All Time Slots for Grid

```typescript
import { getAllTimeSlots } from '@/lib/features/schedule/utils/lessonNumberMapping';

const timeSlots = getAllTimeSlots();
// Returns array of 8 TimeSlotDefinitions

timeSlots.forEach(slot => {
  console.log(`${slot.label}: ${slot.start_time} - ${slot.end_time}`);
});
```

### Validate Time Range

```typescript
import { isValidTimeRange } from '@/lib/features/schedule/utils/lessonNumberMapping';

const valid = isValidTimeRange("09:50:00", "10:35:00");
// Returns: true (matches Period 3)

const invalid = isValidTimeRange("09:50:00", "10:30:00");
// Returns: false (end time doesn't match any period)
```

## Component Integration

### TimeBasedGrid
```typescript
import { TimeBasedGrid } from '@/lib/features/schedule/components/TimeBasedGrid';
import { getAllTimeSlots } from '@/lib/features/schedule/utils/lessonNumberMapping';

const timeSlots = getAllTimeSlots();

<TimeBasedGrid
  classes={classes}
  slots={slots}
  dayOfWeek={1}
  onSlotClick={(classId, timeSlot) => {
    // timeSlot.lesson_number is pre-computed
    // timeSlot.start_time, timeSlot.end_time are available
  }}
/>
```

### Drag & Drop Handler
```typescript
import { createSlotPayload } from '@/lib/features/schedule/utils/lessonNumberMapping';

const handleDrop = async (slotId, newClassId, newTimeSlot) => {
  const slot = findSlot(slotId);
  
  // Automatically derives lesson_number from newTimeSlot.start_time
  const payload = createSlotPayload(
    slot.class_subject_id,
    selectedDay,
    newTimeSlot.start_time,
    newTimeSlot.end_time,
    slot.room,
    templateId
  );
  
  await updateSlot(slotId, payload);
};
```

## Type Definitions

```typescript
interface TimeSlotDefinition {
  lesson_number: number;  // 1-8
  start_time: string;     // "HH:mm:ss"
  end_time: string;       // "HH:mm:ss"
  label: string;          // "Period 1", "Period 2", etc.
}

interface SlotAPIPayload {
  template_id?: string;
  class_subject_id: string;
  day_of_week: number;
  lesson_number: number;  // ← Automatically derived
  start_time: string;
  end_time: string;
  room?: string;
}
```

## Common Patterns

### Pattern 1: Display Time Grid
```typescript
const timeSlots = getAllTimeSlots();

{timeSlots.map(slot => (
  <div key={slot.lesson_number}>
    <span>{formatTimeDisplay(slot.start_time)}</span>
    <span>-</span>
    <span>{formatTimeDisplay(slot.end_time)}</span>
  </div>
))}
```

### Pattern 2: Create Slot on Cell Click
```typescript
const handleCellClick = async (classId, timeSlot) => {
  const payload = createSlotPayload(
    selectedSubjectId,
    currentDay,
    timeSlot.start_time,
    timeSlot.end_time,
    room
  );
  
  if (!payload) {
    toast.error("Invalid time slot");
    return;
  }
  
  await createSlot(payload);
};
```

### Pattern 3: Find Next Available Period
```typescript
import { getNextTimeSlot } from '@/lib/features/schedule/utils/lessonNumberMapping';

const currentLesson = 3;
const nextSlot = getNextTimeSlot(currentLesson);
// Returns: { lesson_number: 4, start_time: "10:55:00", ... }
```

## Validation Rules

1. **Start Time Must Match**: Only 8 valid start times allowed
2. **End Time Must Match**: Must pair correctly with start time
3. **Lesson Number Derived**: NEVER set manually, always derived
4. **Time Format**: Must be "HH:mm:ss" (with seconds)

## Error Handling

```typescript
const payload = createSlotPayload(classSubjectId, day, start, end);

if (!payload) {
  // Invalid time - does not match any standard period
  console.error("Invalid start/end time:", { start, end });
  toast.error("Please select a valid time slot");
  return;
}

// Payload is valid, proceed
await api.createSlot(payload);
```

## Best Practices

1. ✅ **Always use `createSlotPayload()`** - Never construct payloads manually
2. ✅ **Validate before API calls** - Check payload !== null
3. ✅ **Display times to users** - Show "09:50-10:35", not "Period 3"
4. ✅ **Derive lesson_number** - Never ask users for it
5. ✅ **Use utility functions** - `getLessonNumberFromTime()`, `isValidTimeRange()`

## Anti-Patterns

❌ **Hardcoding lesson_number**
```typescript
const payload = { lesson_number: 3, ... };  // BAD!
```

❌ **Manual time parsing**
```typescript
const hour = parseInt(time.substring(0, 2));
const lessonNumber = calculateFromHour(hour);  // BAD!
```

❌ **Inconsistent time formats**
```typescript
const time1 = "09:50";     // Missing seconds
const time2 = "9:50:00";   // Missing leading zero
// Use: "09:50:00" everywhere
```

## References

- **Source**: `/lib/features/schedule/utils/lessonNumberMapping.ts`
- **Grid Component**: `/lib/features/schedule/components/TimeBasedGrid.tsx`
- **Edit Page**: `/app/(dashboard)/branch-admin/schedule/edit/page.tsx`
- **Rebuild Doc**: `/docs/SCHEDULE_EDIT_REBUILD.md`
