# Filtering, Ordering & Search Implementation Guide

This guide shows how to implement filtering, ordering, and search features in the Branch Admin dashboard and other modules.

## 📚 Backend API Documentation

All backend APIs support:
- **Pagination**: `page`, `page_size` (default: 20, max: 100)
- **Search**: `search` parameter (searches multiple fields)
- **Filtering**: Specific field filters
- **Ordering**: `ordering` parameter (use `-` prefix for descending order)

Full API documentation: `/docs/api/filtering-search-ordering.md`

## ✅ Implementation Status

### Students Page (`/branch-admin/students`)

**Implemented:**
- ✅ Pagination (page, page_size)
- ✅ Search (personal_number, first_name, last_name, phone_number, email)
- ✅ Filters:
  - `gender` (male/female)
  - `academic_year_id` (via class filter)
  - `class_id`
- ✅ Ordering:
  - `created_at` (default)
  - `first_name`
  - `last_name`
  - `personal_number`
  - `date_of_birth`
- ✅ Order direction (asc/desc)

**API Endpoint:** `GET /api/v1/school/students/`

**Additional Available Filters (from docs):**
- `date_of_birth` - Exact date
- `date_of_birth__gte` - From date
- `date_of_birth__lte` - To date
- `grade_level` - Grade level filter
- `created_at__gte` - Created from date
- `created_at__lte` - Created to date

**Code Reference:**
```typescript
// lib/api/school.ts
getStudents: async (
  branchId: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    gender?: "male" | "female";
    class_id?: string;
    ordering?: string; // ✅ Added
  }
): Promise<PaginatedResponse<Student>>
```

## 📋 Implementation Template

### 1. API Service Function

```typescript
// Example: lib/api/branch.ts
getMemberships: async (
  branchId: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    ordering?: string; // Add this
  }
): Promise<PaginatedResponse<MembershipDetail>> => {
  const response = await apiClient.get<PaginatedResponse<MembershipDetail>>(
    `/branches/${branchId}/memberships/`,
    { params }
  );
  return response.data;
}
```

### 2. Component State

```typescript
// State for filters
const [searchQuery, setSearchQuery] = React.useState("");
const [roleFilter, setRoleFilter] = React.useState<string>("all");

// State for ordering
const [orderBy, setOrderBy] = React.useState<string>("created_at");
const [orderDirection, setOrderDirection] = React.useState<"asc" | "desc">("desc");

// Pagination state
const [currentPage, setCurrentPage] = React.useState(1);
const [pageSize, setPageSize] = React.useState(10);
```

### 3. Fetch Function

```typescript
const fetchData = React.useCallback(async () => {
  if (!currentBranch?.branch_id) return;

  try {
    setLoading(true);
    
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    };

    // Add filters
    if (searchQuery) params.search = searchQuery;
    if (roleFilter !== "all") params.role = roleFilter;
    
    // Add ordering (use - prefix for descending)
    const ordering = orderDirection === "desc" ? `-${orderBy}` : orderBy;
    params.ordering = ordering;

    const response = await branchApi.getMemberships(
      currentBranch.branch_id,
      params
    );

    setData(response.results);
    setTotalCount(response.count);
  } catch (error) {
    console.error("Error fetching data:", error);
    toast.error("Ma'lumotlarni yuklashda xatolik");
  } finally {
    setLoading(false);
  }
}, [currentBranch?.branch_id, currentPage, pageSize, searchQuery, roleFilter, orderBy, orderDirection]);
```

### 4. UI Components

```tsx
{/* Ordering Controls */}
<Select value={orderBy} onValueChange={setOrderBy}>
  <SelectTrigger>
    <SelectValue placeholder="Tartiblash" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="created_at">Qo'shilgan sana</SelectItem>
    <SelectItem value="user_name">Ism</SelectItem>
    <SelectItem value="monthly_salary">Maosh</SelectItem>
    <SelectItem value="balance">Balans</SelectItem>
  </SelectContent>
</Select>

<Select value={orderDirection} onValueChange={(v) => setOrderDirection(v as "asc" | "desc")}>
  <SelectTrigger>
    <SelectValue placeholder="Yo'nalish" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="asc">O'sish</SelectItem>
    <SelectItem value="desc">Kamayish</SelectItem>
  </SelectContent>
</Select>
```

## 🎯 API-Specific Ordering Fields

### Students API
- `personal_number` - ID raqam
- `first_name` - Ism
- `last_name` - Familiya
- `created_at` - Qo'shilgan sana
- `date_of_birth` - Tug'ilgan sana
- `gender` - Jins

### Memberships API (Staff)
- `created_at` - Qo'shilgan sana
- `user_name` - Xodim ismi
- `monthly_salary` - Oylik maosh
- `balance` - Balans
- `role_name` - Lavozim

### Classes API
- `name` - Sinf nomi
- `grade_level` - Sinf darajasi
- `created_at` - Yaratilgan sana
- `academic_year__start_date` - O'quv yili

### Subjects API
- `name` - Fan nomi
- `code` - Fan kodi
- `created_at` - Yaratilgan sana

### Rooms API
- `name` - Xona nomi
- `number` - Xona raqami
- `created_at` - Yaratilgan sana

### Buildings API
- `name` - Bino nomi
- `created_at` - Yaratilgan sana

### Academic Years API
- `start_date` - Boshlanish sanasi
- `end_date` - Tugash sanasi
- `created_at` - Yaratilgan sana
- `name` - Yil nomi

### Quarters API
- `start_date` - Boshlanish sanasi
- `end_date` - Tugash sanasi
- `created_at` - Yaratilgan sana
- `number` - Chorak raqami

## 🔧 Best Practices

1. **Always include pagination** - Don't load all data at once
2. **Use search for general queries** - The `search` parameter searches multiple fields
3. **Use specific filters for exact matches** - Like `gender=male` or `role=teacher`
4. **Default ordering** - Usually `created_at` descending (newest first)
5. **Reset to page 1** - When filters change
6. **Show active filters** - Display badges for active filters
7. **Combine parameters** - You can use search + filters + ordering together

## 📝 Example API Calls

```javascript
// Search + Filter + Ordering
GET /api/v1/school/students/?search=Ali&gender=male&ordering=-created_at&page=1&page_size=20

// Multiple filters
GET /api/v1/school/students/?class_id=123&date_of_birth__gte=2010-01-01&ordering=first_name

// Staff with role filter and salary ordering
GET /api/branches/{branch_id}/memberships/?role=teacher&ordering=-monthly_salary&page=1
```

## 🚀 Next Steps for Other Pages

### Staff Management Page
- [ ] Implement search (user_name, user_phone)
- [ ] Add role filter
- [ ] Add ordering (user_name, monthly_salary, balance, created_at)
- [ ] Add salary range filter

### Roles Management Page
- [ ] Implement search (name)
- [ ] Add is_active filter
- [ ] Add ordering (name, created_at)

### Classes Management Page
- [ ] Implement search (name)
- [ ] Add grade_level filter
- [ ] Add academic_year filter
- [ ] Add is_active filter
- [ ] Add ordering (grade_level, name, created_at)

### Subjects Management Page
- [ ] Implement search (name, code)
- [ ] Add is_active filter
- [ ] Add ordering (name, code, created_at)

## 📖 Reference Documentation

- Full API documentation: `/docs/api/filtering-search-ordering.md`
- Branch API: `/docs/api/branch.md`
- Students implementation: `/app/(dashboard)/branch-admin/students/page.tsx`
