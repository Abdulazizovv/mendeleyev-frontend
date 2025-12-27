# Branch Type Conditional Rendering Implementation

## Overview
This document describes the implementation of branch type-specific UI and navigation in the Mendeleyev frontend application. The system differentiates between **Schools** (Maktab) and **Learning Centers** (O'quv Markazi) to provide a tailored user experience.

## Implementation Date
December 22, 2024

## Approach
**Variant #1: Conditional Rendering** was chosen for this implementation:
- Single codebase with conditional logic
- Dynamic navigation based on branch type
- Adaptive terminology throughout the application
- Feature availability checks

### Advantages
- No code duplication
- Single maintenance point
- Cleaner architecture
- Easy to add new branch types in the future

## Core Components

### 1. Branch Type Utilities (`lib/utils/branchType.ts`)

A centralized utility file containing all branch type-specific logic:

#### **Branch Type Labels**
```typescript
export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  school: "Maktab",
  center: "O'quv Markazi",
};
```

#### **Navigation Items**
```typescript
getNavigationItems(branchType: BranchType): NavigationItem[]
```
- **School Navigation**: Dashboard, Students, Classes, Subjects, Teachers, Finance
- **Center Navigation**: Dashboard, Students, Groups, Courses, Finance

#### **Feature Availability**
```typescript
isFeatureAvailable(branchType: BranchType, feature: string): boolean
```
Controls which features are available for each branch type.

#### **Dashboard Widgets**
```typescript
getDashboardWidgets(branchType: BranchType)
```
Returns widget configuration showing what dashboard components to display.

#### **Student Terminology**
```typescript
getStudentTerminology(branchType: BranchType)
```
Returns adaptive terminology:
- **School**: "O'quvchi" / "O'quvchilar"
- **Center**: "Talaba" / "Talabalar"

#### **Finance Features**
```typescript
getFinanceFeatures(branchType: BranchType)
```
Returns finance module feature set for each branch type.

## Modified Files

### 2. Dashboard Layout (`app/(dashboard)/layout.tsx`)

**Changes:**
1. **Import branch type utilities**
   ```typescript
   import { getNavigationItems as getBranchNavigationItems } from "@/lib/utils/branchType";
   import type { BranchType } from "@/types/auth";
   ```

2. **Extract branch type**
   ```typescript
   const branchType = currentBranch.branch_type as BranchType;
   ```

3. **Dynamic navigation**
   ```typescript
   if (currentBranch.role === "branch_admin") {
     return getBranchNavigationItems(branchType);
   }
   ```

4. **Icon mapping function**
   ```typescript
   const getIconForRoute = (href: string) => {
     // Maps routes to appropriate icons
   }
   ```

5. **Branch type badge in sidebar**
   - Displays "Maktab" or "O'quv Markazi" label
   - Visual indicator of current branch type

### 3. Branch Admin Dashboard (`app/(dashboard)/branch-admin/page.tsx`)

**Changes:**
1. **Import utilities**
   ```typescript
   import { getDashboardWidgets, getStudentTerminology } from "@/lib/utils/branchType";
   ```

2. **Extract branch type and terminology**
   ```typescript
   const branchType = (currentBranch?.branch_type || "school") as BranchType;
   const studentTerm = getStudentTerminology(branchType);
   const widgets = getDashboardWidgets(branchType);
   ```

3. **Branch type badge in header**
   - Added badge showing "Maktab" or "O'quv Markazi" in welcome section

4. **Conditional stats widgets**
   - Staff card (conditional based on `widgets.staff`)
   - Students card with adaptive terminology
   - Classes/Groups card (conditional based on branch type)
     - **School**: Shows "Sinflar" (Classes)
     - **Center**: Shows "Guruhlar" (Groups)
   - Finance card (conditional based on `widgets.finance`)

5. **Conditional quick actions**
   - Add Staff button
   - Add Student button (with adaptive terminology)
   - Add Class/Group button (conditional based on branch type)
   - Finance button

### 4. Students Page (`app/(dashboard)/branch-admin/students/page.tsx`)

**Changes:**
1. **Import utilities**
   ```typescript
   import { getStudentTerminology } from "@/lib/utils/branchType";
   import type { BranchType } from "@/types/auth";
   ```

2. **Extract terminology**
   ```typescript
   const branchType = (currentBranch?.branch_type || "school") as BranchType;
   const studentTerm = getStudentTerminology(branchType);
   ```

3. **Updated all occurrences of "O'quvchi/O'quvchilar"**
   - Page title: Uses `studentTerm.plural`
   - Count text: Uses `studentTerm.singular.toLowerCase()`
   - Create button: "Yangi {studentTerm.singular.toLowerCase()}"
   - Search placeholder: Uses `studentTerm.singular`
   - Table title: Uses `studentTerm.plural`
   - Empty state: Uses `studentTerm.plural`
   - Loading message: Uses `studentTerm.plural`
   - Dialog title: Uses `studentTerm.singular`

## Branch Type Mapping

### Backend → Frontend
- `SCHOOL` → `"school"` → "Maktab"
- `LEARNING_CENTER` → `"center"` → "O'quv Markazi"
- `PRIVATE_TUTORING` → (Future implementation)

## Navigation Differences

| Feature | School | Learning Center |
|---------|--------|-----------------|
| Dashboard | ✅ | ✅ |
| Students/Talabalar | ✅ O'quvchilar | ✅ Talabalar |
| Classes | ✅ Sinflar | ❌ |
| Groups | ❌ | ✅ Guruhlar |
| Subjects | ✅ Fanlar | ❌ |
| Courses | ❌ | ✅ Kurslar |
| Teachers | ✅ O'qituvchilar | ✅ O'qituvchilar |
| Finance | ✅ Moliya | ✅ Moliya |

## Terminology Differences

| Concept | School | Learning Center |
|---------|--------|-----------------|
| Student (Singular) | O'quvchi | Talaba |
| Students (Plural) | O'quvchilar | Talabalar |
| Group | Sinf | Guruh |
| Subject | Fan | Kurs |

## Dashboard Widgets

### School Dashboard
- ✅ Staff widget
- ✅ Students widget (O'quvchilar)
- ✅ Classes widget (Sinflar)
- ✅ Finance widget

### Learning Center Dashboard
- ✅ Staff widget
- ✅ Students widget (Talabalar)
- ✅ Groups widget (Guruhlar)
- ✅ Finance widget

## Testing Checklist

- [x] Branch type utilities compile without errors
- [x] Dashboard layout accepts branch type
- [x] Sidebar navigation is dynamic
- [x] Branch type badge displays correctly
- [x] Dashboard widgets are conditional
- [x] Students page uses adaptive terminology
- [ ] Test with actual school branch data
- [ ] Test with actual learning center branch data
- [ ] Verify all navigation links work correctly
- [ ] Test finance module with both branch types
- [ ] Verify role-based permissions still work

## Future Enhancements

1. **Add Private Tutoring Support**
   - Extend `BranchType` to include `"private_tutoring"`
   - Define navigation and terminology for private tutors
   - Update utilities to handle third branch type

2. **Page-Level Conditional Rendering**
   - Apply conditional rendering to all dashboard pages
   - Update Classes page to show Groups for centers
   - Update Subjects page to show Courses for centers

3. **Conditional Forms**
   - Adapt student creation forms based on branch type
   - Update class/group creation forms
   - Modify subject/course forms

4. **Analytics and Reports**
   - Branch type-specific dashboard widgets
   - Custom reports for schools vs centers
   - Different KPIs based on branch type

5. **Settings and Configuration**
   - Branch type-specific settings pages
   - Feature toggles per branch type
   - Custom workflows for different branch types

## Implementation Notes

### Design Decisions

1. **Single Codebase**: Chose conditional rendering over separate routes to avoid code duplication
2. **Centralized Logic**: All branch type logic in one utility file for easy maintenance
3. **Graceful Degradation**: Default to "school" if branch type is undefined
4. **Type Safety**: Use TypeScript types to ensure type-safe branch type handling

### Known Limitations

1. Stats widgets show "-" for classes/groups count (not yet fetching from API)
2. Quick action buttons don't have navigation implemented yet
3. Some pages still use hardcoded "O'quvchi" terminology (to be updated)

### Performance Considerations

- Branch type extraction happens once per component render
- Navigation items are computed on-demand (could be memoized)
- Icon mapping is done inline (could be optimized with a lookup table)

## Code Quality

- **TypeScript Errors**: ✅ None
- **ESLint Warnings**: ✅ None
- **Type Safety**: ✅ All branch type operations are type-safe
- **Code Duplication**: ✅ Minimal, centralized in utilities

## Rollout Plan

### Phase 1: ✅ Complete
- Branch type utilities created
- Dashboard layout updated
- Branch admin dashboard updated
- Students page updated

### Phase 2: Pending
- Update all remaining pages
- Add API integration for class/group counts
- Implement navigation for quick action buttons
- Add branch type filter in admin views

### Phase 3: Future
- Add private tutoring support
- Create branch type-specific analytics
- Implement conditional forms
- Add branch type settings

## Conclusion

The branch type conditional rendering system provides a flexible, maintainable solution for differentiating between schools and learning centers. The implementation follows best practices with centralized logic, type safety, and minimal code duplication. Future enhancements can easily build upon this foundation.
