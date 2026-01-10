# Routing Refactor - School & Training-Center Separation

## ✅ Changes Made

### 1. **New Route Structure**

```
(dashboard)/
├── school/              ← For maktab (schools)
│   ├── page.tsx         ← Dashboard
│   ├── students/
│   ├── classes/
│   ├── academic-years/
│   ├── subjects/
│   ├── schedule/
│   ├── staff/
│   ├── finance/
│   ├── rooms/
│   ├── roles/
│   └── settings/
│
├── training-center/     ← For o'quv markazi (training centers)
│   ├── page.tsx         ← Dashboard
│   ├── students/
│   ├── groups/
│   ├── courses/
│   ├── academic-years/
│   ├── schedule/
│   ├── staff/
│   ├── finance/
│   ├── rooms/
│   ├── roles/
│   └── settings/
│
├── branch-admin/        ← Redirect layer (backward compatible)
│   ├── layout.tsx       ← Auto-redirects to /school or /training-center
│   └── ... (subfolders for internal routing)
│
├── student/
├── teacher/
└── dashboard/
```

### 2. **Routing Utilities Updated**

#### `lib/utils/roleMapping.ts`
- **New**: `roleToPath(role, branchType?)` function
- Maps `branch_admin` role to `/school` or `/training-center` based on `branchType`
- Backward compatible with old `/branch-admin` paths

#### `lib/utils/branchType.ts`
- **Updated**: `getNavigationItems(branchType)` function
- Now generates correct href paths based on branch type
- School branch: `/school/*`
- Training center branch: `/training-center/*`

### 3. **Layout Updates**

#### `app/(dashboard)/layout.tsx`
- Updated redirect logic to use new routing
- Pass `branchType` to `roleToPath()` function for correct redirects

#### `app/(dashboard)/branch-admin/layout.tsx` (NEW)
- Redirect layer for backward compatibility
- Automatically redirects `/branch-admin/*` to `/school/*` or `/training-center/*`
- Prevents 404s for existing bookmarks/links

### 4. **Navigation Paths Updated**

Example navigation items:

**Before:**
```
/branch-admin/students
/branch-admin/classes
/branch-admin/staff
```

**After - School:**
```
/school/students
/school/classes
/school/staff
```

**After - Training Center:**
```
/training-center/students
/training-center/groups
/training-center/courses
```

## 🔄 Backward Compatibility

✅ **Old links still work!**
- `/branch-admin/*` URLs automatically redirect to appropriate `/school/*` or `/training-center/*` routes
- Existing bookmarks and links won't break
- Gradual migration possible

## 🎯 Benefits

1. **Clear separation** between school and training center functionality
2. **Branch-type specific navigation** shows relevant features
3. **Better UX** - different branch types see different menu options
4. **Maintainability** - easier to extend features for each branch type
5. **Backward compatible** - no breaking changes

## 📝 For Developers

### To navigate to admin dashboard:
```typescript
// Instead of hardcoding paths, use the utility:
import { roleToPath } from "@/lib/utils/roleMapping";

const adminPath = roleToPath("branch_admin", branchType);
// Returns: "school" or "training-center"

router.push(`/${adminPath}/students`);
```

### To get navigation items:
```typescript
import { getNavigationItems } from "@/lib/utils/branchType";

const items = getNavigationItems(branchType);
// Navigation items will have correct paths:
// school: /school/students, /school/classes, etc.
// training_center: /training-center/students, /training-center/groups, etc.
```

## 🚀 Deployment Notes

- No database changes required
- No API changes required
- Safe to deploy - backward compatibility maintained
- Existing user sessions won't break
- Cookies and auth tokens unchanged

## 📋 Checklist

- [x] New `/school` routes created
- [x] New `/training-center` routes created
- [x] Role mapping utility updated
- [x] Navigation generation updated
- [x] Layout updated with new routing logic
- [x] Backward compatibility layer added
- [x] Dashboard statistics API integrated
- [x] Today's lessons list component added

