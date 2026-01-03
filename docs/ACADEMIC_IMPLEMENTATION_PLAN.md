# Academic System Implementation Plan

## 📋 Overview
Implementation roadmap for Schedule, Lessons, Attendance, Grades, and Homework modules.

---

## 🏗️ Architecture

### Folder Structure
```
lib/
  features/
    schedule/
      api.ts          # API calls
      hooks.ts        # React Query hooks
      types.ts        # TypeScript types
      components/     # Feature-specific components
      utils.ts        # Helper functions
    attendance/
    grades/
    homework/
    lessons/
    shared/
      api/
        client.ts     # Enhanced API client with interceptors
        endpoints.ts  # Centralized endpoint constants
      components/     # Reusable components
      hooks/          # Shared hooks
      utils/          # Common utilities
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Priority: HIGH)
**Duration:** Day 1

#### 1.1 Enhanced API Client
- ✅ Already exists: `/lib/api/client.ts`
- ⚠️ Need to enhance:
  - Better 401 handling (logout + redirect)
  - 403 → Permission error UI
  - 409 → Conflict modal
  - Retry logic
  - Loading states

#### 1.2 Feature Structure Setup
- Create `lib/features/` directory
- Set up base types for each module
- Create shared components library

---

### Phase 2: Schedule Module (Priority: HIGH)
**Duration:** Days 2-3

#### API Implementation
- `GET /schedule/timetable-templates/` - List templates
- `POST /schedule/timetable-templates/` - Create template
- `GET /schedule/timetable-slots/` - Get slots
- `POST /schedule/timetable-slots/bulk-create/` - Bulk create
- `PATCH /schedule/timetable-slots/{id}/` - Update slot
- `DELETE /schedule/timetable-slots/{id}/` - Delete slot

#### UI Components
1. **TimetableGrid** (Weekly view)
   - Mon-Sat columns
   - Time slots rows
   - Color-coded by subject
   - Drag-and-drop (optional)

2. **TimetableTemplateManager**
   - List templates
   - Create/Edit template
   - Activate/Deactivate

3. **SlotEditor**
   - Create slot form
   - Conflict detection
   - Teacher/Room availability check

#### Features
- Weekly calendar view
- Conflict detection (409 handling)
- Print timetable
- Export to PDF/Excel
- Admin-only editing

---

### Phase 3: Lessons Module (Priority: HIGH)
**Duration:** Days 3-4

#### API Implementation
- `GET /schedule/lesson-instances/` - List lessons
- `POST /schedule/lesson-instances/generate/` - Generate lessons
- `PATCH /schedule/lesson-instances/{id}/` - Update lesson
- `POST /schedule/lesson-instances/{id}/complete/` - Complete lesson
- `POST /schedule/lesson-instances/{id}/cancel/` - Cancel lesson

#### UI Components
1. **LessonList**
   - Filter: date range, class, subject, status
   - Status badges (planned/completed/cancelled)
   - Quick actions

2. **LessonDetail**
   - Topic assignment
   - Complete/Cancel actions
   - Attendance link
   - Homework link

3. **LessonGenerator** (Admin only)
   - Date range selection
   - Preview before generation
   - Bulk operations

#### Features
- Auto-generate from timetable
- Lesson completion workflow
- Topic management
- Teacher-only completion
- Read-only for students

---

### Phase 4: Attendance Module (Priority: HIGH)
**Duration:** Days 4-5

#### API Implementation
- `GET /attendance/records/` - List records
- `POST /attendance/records/mark/` - Mark attendance
- `POST /attendance/records/bulk-mark/` - Bulk mark
- `POST /attendance/records/{id}/lock/` - Lock attendance
- `POST /attendance/records/{id}/unlock/` - Unlock (Admin)
- `GET /attendance/statistics/` - Get stats

#### UI Components
1. **AttendanceSheet**
   - Student list with checkboxes
   - Present/Absent/Late/Excused
   - Bulk select options
   - Lock indicator

2. **AttendanceCalendar**
   - Monthly view
   - Color-coded attendance
   - Click to mark

3. **AttendanceStatistics**
   - Attendance rate
   - Charts (daily/weekly/monthly)
   - Student-specific stats

#### Features
- Quick bulk marking
- Lock mechanism (read-only when locked)
- Admin-only unlock
- Attendance statistics
- Export attendance reports
- Permission-based UI (teacher mark, student view)

---

### Phase 5: Grades Module (Priority: HIGH)
**Duration:** Days 5-6

#### API Implementation
- `GET /grades/assessment-types/` - List types
- `GET /grades/assessments/` - List assessments
- `POST /grades/assessments/` - Create assessment
- `POST /grades/grade-entries/bulk-create/` - Bulk grade
- `POST /grades/assessments/{id}/lock/` - Lock assessment
- `GET /grades/grade-summaries/` - Get summaries
- `POST /grades/grade-overrides/` - Manual override

#### UI Components
1. **AssessmentManager**
   - List assessments
   - Create assessment form
   - Weight configuration
   - Lock/Unlock

2. **GradingSheet**
   - Student list with grade inputs
   - Auto-calculate percentages
   - Bulk save
   - Lock indicator

3. **GradeSummary**
   - Quarter grades
   - Subject averages
   - Grade distribution chart
   - Student report card

4. **GradeOverride** (Admin/Teacher)
   - Manual grade adjustment
   - Reason input
   - Audit trail

#### Features
- Multiple assessment types
- Weighted grading
- Auto-calculation + manual override
- Lock mechanism
- Grade reports
- Student grade view (read-only)

---

### Phase 6: Homework Module (Priority: MEDIUM)
**Duration:** Days 6-7

#### API Implementation
- `GET /homework/assignments/` - List assignments
- `POST /homework/assignments/` - Create assignment
- `GET /homework/submissions/` - List submissions
- `POST /homework/submissions/` - Submit homework
- `PATCH /homework/submissions/{id}/` - Update submission
- `GET /homework/statistics/` - Get stats

#### UI Components
1. **HomeworkAssignmentForm** (Teacher)
   - Title, description, due date
   - Subject, class, topic
   - Attachments (future)

2. **HomeworkList**
   - Student view: Assigned to me
   - Teacher view: Created by me
   - Filter: status, date, class
   - Late indicators

3. **HomeworkSubmission** (Student)
   - View assignment
   - Submit answer
   - File upload (if supported)
   - Edit before due date

4. **HomeworkReview** (Teacher)
   - View submissions
   - Grading/Feedback
   - Statistics (completion rate)

#### Features
- Assignment creation (teacher)
- Submission workflow (student)
- Late submission tracking
- Statistics per class
- Notification system (future)

---

### Phase 7: Dashboard Views (Priority: MEDIUM)
**Duration:** Days 7-8

#### Student Dashboard
- Today's schedule
- Upcoming homework
- Recent grades
- Attendance summary

#### Teacher Dashboard
- Today's lessons
- Pending attendance marking
- Pending homework reviews
- Class statistics

#### Admin Dashboard
- System overview
- Timetable management
- Lock/Unlock controls
- Reports

---

## 🎨 UI/UX Standards

### Component Library (shadcn/ui)
- Button, Card, Badge
- Table, DataTable
- Dialog, Sheet, Popover
- Calendar, DatePicker
- Form components
- Loading Skeletons

### Design Principles
- Clean, modern, corporate
- Consistent spacing
- Color system:
  - Primary: Blue (actions)
  - Success: Green (completed, present)
  - Warning: Yellow (late, pending)
  - Error: Red (absent, failed)
  - Muted: Gray (disabled, locked)

### Responsive Design
- Desktop-first
- Tablet-friendly
- Mobile (basic support)

---

## 🔐 Security & Permissions

### Role-Based Rendering
```typescript
// Example
if (hasRole('teacher')) {
  return <TeacherView />;
} else if (hasRole('student')) {
  return <StudentView />;
}
```

### API Error Handling
- **401** → Logout + redirect `/login`
- **403** → Permission error modal
- **409** → Conflict resolution UI
- **422** → Validation errors shown in forms

---

## 📊 State Management

### React Query
- Caching strategy
- Optimistic updates
- Background refetch
- Pagination
- Infinite scroll (optional)

### Local State
- Form state (React Hook Form)
- UI state (useState)
- Global UI state (Zustand if needed)

---

## 🧪 Quality Checklist

### Per Module
- [ ] Types defined
- [ ] API functions created
- [ ] React Query hooks
- [ ] Components implemented
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Permission checks
- [ ] Responsive design
- [ ] Manual testing

---

## 📈 Success Metrics

### Completion Criteria
1. All API endpoints integrated
2. All user stories covered
3. No TypeScript errors
4. Clean code structure
5. Reusable components
6. Error boundaries
7. Production-ready

---

## 🚀 Next Steps

1. Review and approve this plan
2. Start Phase 1 (Foundation)
3. Implement module by module
4. Test each module
5. Iterate based on feedback

---

**Estimated Total Duration:** 7-8 days (1 week)  
**Team Size:** 1 Senior Frontend Developer  
**Status:** Ready to start

