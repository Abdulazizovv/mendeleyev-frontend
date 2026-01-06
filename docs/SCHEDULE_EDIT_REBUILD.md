# Timetable Edit Page Rebuild - Complete Summary

## Problem Statement
The original timetable edit page had **critical architectural flaws**:

1. **Wrong Data Model**: Used `LessonInstances` (actual lessons) instead of `TimetableSlots` (template definitions)
2. **Incorrect API**: Called wrong endpoints (`useLessonInstances`, `useUpdateLessonInstance`) instead of TimetableSlot APIs
3. **No Lesson Number Derivation**: Hardcoded lesson numbers instead of computing from time
4. **Broken Drag & Drop**: Sent malformed API payloads missing required fields

## Solution Overview
**Completely rebuilt the edit page with TIME-BASED architecture**:

- ✅ Rows = **Time Slots** (08:00-08:45, 08:55-09:40, etc.)
- ✅ Columns = **Classes**
- ✅ Cells = **TimetableSlots** (draggable)
- ✅ `lesson_number` automatically derived from `start_time`
- ✅ Proper API payloads with all required fields

## Files Created/Modified

### 1. `/lib/features/schedule/utils/lessonNumberMapping.ts` (NEW)
**Source of truth for time → lesson_number mapping**

```typescript
const STANDARD_TIME_SLOTS: TimeSlotDefinition[] = [
  { lesson_number: 1, start_time: '08:00:00', end_time: '08:45:00', label: 'Period 1' },
  { lesson_number: 2, start_time: '08:55:00', end_time: '09:40:00', label: 'Period 2' },
  { lesson_number: 3, start_time: '09:50:00', end_time: '10:35:00', label: 'Period 3' },
  { lesson_number: 4, start_time: '10:55:00', end_time: '11:40:00', label: 'Period 4' },
  { lesson_number: 5, start_time: '11:50:00', end_time: '12:35:00', label: 'Period 5' },
  { lesson_number: 6, start_time: '13:30:00', end_time: '14:15:00', label: 'Period 6' },
  { lesson_number: 7, start_time: '14:25:00', end_time: '15:10:00', label: 'Period 7' },
  { lesson_number: 8, start_time: '15:20:00', end_time: '16:05:00', label: 'Period 8' },
];
```

**Key Functions:**
- `getLessonNumberFromTime(startTime)`: Derives lesson_number from time string
- `createSlotPayload(...)`: Creates correct API payload with validation
- `getAllTimeSlots()`: Returns all 8 standard periods for grid rendering
- `isValidTimeRange()`: Validates start/end time pairs

### 2. `/lib/features/schedule/components/TimeBasedGrid.tsx` (NEW)
**TIME-DRIVEN grid for editing timetable templates**

**Features:**
- Grid layout with time slots as rows, classes as columns
- Drag & drop with @dnd-kit
- Click empty cells to add lessons
- Edit/delete buttons on lesson cards
- Color-coded by subject
- Conflict prevention on drop

**Components:**
- `TimeBasedGrid`: Main container with DndContext
- `DroppableCell`: Drop zone for each cell
- `DraggableSlot`: Individual lesson card with drag handle

### 3. `/app/(dashboard)/branch-admin/schedule/edit/page.tsx` (REBUILT)
**Complete rewrite using correct data model**

**Data Flow:**
```typescript
// OLD (WRONG) ❌
useLessonInstances() → LessonInstance[] → useUpdateLessonInstance()

// NEW (CORRECT) ✅
useTimetableTemplates() → TimetableTemplate (active)
  ↓
useTimetableSlots(branchId, templateId) → TimetableSlot[]
  ↓
useCreateTimetableSlot / useUpdateTimetableSlot / useDeleteTimetableSlot
```

**Key Changes:**
1. **Correct Hooks**: Uses `useTimetableSlots` instead of `useLessonInstances`
2. **Proper Mutations**: `useCreateTimetableSlot`, `useUpdateTimetableSlot`, `useDeleteTimetableSlot`
3. **Time-Based UI**: Day tabs + time grid (not lesson number grid)
4. **Auto Derivation**: `createSlotPayload()` computes `lesson_number` from `start_time`
5. **Class Subjects**: Fetches from `schoolApi.getClassSubjects(classId)`

**Workflow:**
1. Select day (Monday-Saturday tabs)
2. Click empty cell → Select subject → Create slot
3. Drag existing slot → Drops to new time/class
4. Edit/delete buttons on each slot

## API Payload Format

### Before (BROKEN) ❌
```json
{
  "lesson_instance_id": "...",
  "date": "2024-01-15",
  "start_time": "09:00:00",
  // Missing: lesson_number, template_id, day_of_week
}
```

### After (CORRECT) ✅
```json
{
  "template_id": "uuid-here",
  "class_subject_id": "uuid-here",
  "day_of_week": 1,
  "lesson_number": 2,  // ← Automatically derived from start_time
  "start_time": "08:55:00",
  "end_time": "09:40:00",
  "room": "Room 101"
}
```

## Time → Lesson Number Mapping

| Period | Start Time | End Time  | Lesson Number |
|--------|-----------|-----------|---------------|
| 1      | 08:00     | 08:45     | 1             |
| 2      | 08:55     | 09:40     | 2             |
| 3      | 09:50     | 10:35     | 3             |
| 4      | 10:55     | 11:40     | 4             |
| 5      | 11:50     | 12:35     | 5             |
| 6      | 13:30     | 14:15     | 6             |
| 7      | 14:25     | 15:10     | 7             |
| 8      | 15:20     | 16:05     | 8             |

**Admin never sees lesson_number** — they work with times (09:00-10:00), and the system automatically maps to correct lesson_number.

## Mental Model

### Old System (BROKEN)
```
Admin thinks: "Move lesson to slot 3"
System needs: lesson_number = 3
Problem: What time IS slot 3? Hardcoded and confusing.
```

### New System (CORRECT)
```
Admin thinks: "Move lesson to 09:50-10:35"
System derives: start_time "09:50:00" → lesson_number = 3
Result: Natural, intuitive, correct.
```

## Conflict Detection
When dragging a slot to a new location, the system:

1. **Checks** if another slot already exists at target time/class
2. **Shows error** if conflict found
3. **Reverts UI** (no change)
4. **Backend validates** on PATCH (409 Conflict response)

## Testing Checklist

To verify the rebuild works correctly:

- [ ] **View Active Template**: Page loads and shows active template name/dates
- [ ] **Switch Days**: Monday-Saturday tabs work
- [ ] **View Grid**: 8 time rows × N class columns displayed
- [ ] **Create Slot**: Click empty cell → Select subject → Room → Create
- [ ] **Drag Slot**: Drag existing lesson to different time/class
- [ ] **Conflict**: Try to drag to occupied cell → Shows error
- [ ] **Edit Slot**: Click edit button (drawer opens - TODO)
- [ ] **Delete Slot**: Click delete → Confirm → Slot removed
- [ ] **API Payload**: Check network tab - payload has `lesson_number` field
- [ ] **Persistence**: Refresh page → Slots remain in correct positions

## Backend Requirements

The backend **MUST**:
1. Accept `lesson_number` field (derived from `start_time`)
2. Validate time ranges match STANDARD_TIME_SLOTS
3. Return 409 Conflict for overlapping slots
4. Include `class_subject` nested object in GET responses

## Future Improvements

1. **Edit Drawer**: Quick edit for room/subject without drag
2. **Bulk Operations**: Copy template to another week
3. **Validation Feedback**: Show warning before creating slot
4. **Undo/Redo**: Revert accidental changes
5. **Keyboard Navigation**: Arrow keys to move between cells

## Key Learnings

1. **Data Model Matters**: TimetableSlots ≠ LessonInstances
2. **Time is Primary**: Lesson numbers are DERIVED, not primary
3. **Source of Truth**: One mapping file (lessonNumberMapping.ts)
4. **User Mental Model**: Admin thinks in TIME, not numbers
5. **Type Safety**: Proper imports prevent runtime errors

## Migration Notes

**DO NOT USE** these hooks/APIs in edit mode:
- ❌ `useLessonInstances`
- ❌ `useUpdateLessonInstance`
- ❌ `useDeleteLessonInstance`

**USE THESE INSTEAD**:
- ✅ `useTimetableSlots`
- ✅ `useCreateTimetableSlot`
- ✅ `useUpdateTimetableSlot`
- ✅ `useDeleteTimetableSlot`

## Documentation References

- [TIMETABLE_IMPLEMENTATION.md](../TIMETABLE_IMPLEMENTATION.md) - Original design doc
- [TIMETABLE_MIGRATION.md](../TIMETABLE_MIGRATION.md) - Migration guide
- [SCHEDULE_REBUILD_GUIDE.md](../SCHEDULE_REBUILD_GUIDE.md) - This rebuild

---

**Status**: ✅ Edit page rebuilt and error-free  
**Next Step**: Test complete workflow with real backend  
**Priority**: HIGH - Critical for admin timetable management
