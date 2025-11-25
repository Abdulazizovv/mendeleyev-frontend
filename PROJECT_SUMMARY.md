# Mendeleyev Frontend - Loyiha Umumiy Ko'rinishi

## 📊 Yaratilgan Fayllar

### Core Configuration
- ✅ `package.json` - Dependencies va scripts
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tailwind.config.ts` - Tailwind CSS config
- ✅ `components.json` - shadcn/ui config
- ✅ `.env.local` - Environment variables
- ✅ `.env.example` - Environment template
- ✅ `.prettierrc` - Code formatting rules
- ✅ `.prettierignore` - Prettier ignore rules

### Type Definitions (types/)
- ✅ `types/auth.ts` - Auth-related types (User, Branch, Membership, Auth flow)
- ✅ `types/api.ts` - API response types
- ✅ `types/index.ts` - Barrel export

### API Client (lib/api/)
- ✅ `lib/api/client.ts` - Axios instance with interceptors (auto token refresh)
- ✅ `lib/api/auth.ts` - Auth API methods (login, OTP, password, etc.)
- ✅ `lib/api/index.ts` - API exports

### State Management (lib/stores/)
- ✅ `lib/stores/auth.ts` - Zustand auth store (user, tokens, branch)
- ✅ `lib/stores/index.ts` - Store exports

### Custom Hooks (lib/hooks/)
- ✅ `lib/hooks/useAuth.ts` - Auth hook (login, logout, switchBranch, hasRole)
- ✅ `lib/hooks/index.ts` - Hooks exports

### Configuration (lib/)
- ✅ `lib/config.ts` - App config, API endpoints, storage keys
- ✅ `lib/utils.ts` - Utility functions (shadcn/ui)

### UI Components (components/)
#### Auth Components
- ✅ `components/auth/PhoneInput.tsx` - O'zbek telefon raqami input (+998)
- ✅ `components/auth/OTPInput.tsx` - 6-digit OTP input component

#### UI Components (shadcn/ui)
- ✅ `components/ui/button.tsx`
- ✅ `components/ui/input.tsx`
- ✅ `components/ui/label.tsx`
- ✅ `components/ui/card.tsx`
- ✅ `components/ui/dialog.tsx`
- ✅ `components/ui/form.tsx`
- ✅ `components/ui/select.tsx`
- ✅ `components/ui/checkbox.tsx`
- ✅ `components/ui/dropdown-menu.tsx`
- ✅ `components/ui/avatar.tsx`
- ✅ `components/ui/badge.tsx`
- ✅ `components/ui/separator.tsx`
- ✅ `components/ui/sonner.tsx` - Toast notifications

#### Providers
- ✅ `components/providers.tsx` - TanStack Query provider + Toaster

### Pages (app/)
- ✅ `app/layout.tsx` - Root layout (metadata, fonts, providers)
- ✅ `app/page.tsx` - Home page (redirect logic)
- ✅ `app/(auth)/login/page.tsx` - Login page with full auth flow
- ✅ `app/(dashboard)/dashboard/page.tsx` - Dashboard with role-based UI
- ✅ `app/globals.css` - Global styles + Tailwind directives

### Documentation
- ✅ `README.md` - Project documentation (O'zbek tilida)
- ✅ `DEVELOPMENT.md` - Development guide va best practices
- ✅ `docs/` - Backend API documentation (allaqachon mavjud)

## 🎯 Asosiy Xususiyatlar

### 1. Authentication System
- **Phone number validation** - +998 format
- **OTP verification** - 6-digit code input
- **Password management** - Set, change, reset
- **Multi-branch support** - Branch selection UI
- **JWT token management** - Auto refresh, secure storage
- **Auth states** - NOT_FOUND, NOT_VERIFIED, NEEDS_PASSWORD, READY, NO_BRANCH, MULTI_BRANCH

### 2. State Management
- **Zustand** - Client state (auth, user, branch)
- **TanStack Query** - Server state caching (keyinroq)
- **localStorage** - Token persistence

### 3. API Integration
- **Axios client** - Base URL, timeout, headers
- **Request interceptor** - Auto add auth token
- **Response interceptor** - Auto token refresh on 401
- **Error handling** - Centralized error handler
- **Type-safe** - Full TypeScript support

### 4. UI/UX
- **shadcn/ui components** - 13 ta component
- **Tailwind CSS** - Utility-first styling
- **Responsive design** - Mobile-first approach
- **Toast notifications** - Sonner library
- **Loading states** - Skeleton screens (keyinroq)
- **Error boundaries** (keyinroq)

### 5. Role-Based Access
- **Role detection** - useAuth hook
- **Role-based UI** - Conditional rendering
- **Route protection** - Middleware (keyinroq)
- **Permissions** - hasRole, isSuperAdmin, isBranchAdmin helpers

## 📈 Backend API Integratsiyasi

### Qo'llab-quvvatlanadigan Endpointlar:

#### Auth Endpoints
1. ✅ `POST /api/v1/auth/phone/check/` - Telefon holatini tekshirish
2. ✅ `POST /api/v1/auth/phone/verification/request/` - OTP so'rash
3. ✅ `POST /api/v1/auth/phone/verification/confirm/` - OTP tasdiqlash
4. ✅ `POST /api/v1/auth/password/set/` - Parol o'rnatish
5. ✅ `POST /api/v1/auth/password/change/` - Parol o'zgartirish
6. ✅ `POST /api/v1/auth/password/reset/request-otp/` - Parolni tiklash (OTP)
7. ✅ `POST /api/v1/auth/password/reset/confirm/` - Parolni tiklash (tasdiqlash)
8. ✅ `POST /api/v1/auth/login/` - Login
9. ✅ `POST /api/v1/auth/refresh/` - Token yangilash
10. ✅ `GET /api/v1/auth/me/` - Foydalanuvchi ma'lumotlari
11. ✅ `GET /api/v1/auth/branches/mine/` - Filialllar ro'yxati
12. ✅ `POST /api/v1/auth/branch/switch/` - Filial almashtirish

#### Profile Endpoints (keyinroq)
- `GET /api/v1/profile/me/` - Global profil
- `PATCH /api/v1/profile/me/` - Profilni yangilash
- `GET /api/v1/profile/branch/<id>/` - Branch profil
- `PATCH /api/v1/profile/branch/<id>/` - Branch profilni yangilash

#### Branch Management (keyinroq)
- `GET /api/branches/managed/` - Boshqariladigan filiallar
- `GET /api/branches/<id>/roles/` - Filial rollari
- `GET /api/branches/<id>/memberships/` - Filial a'zolari

## 🔄 Auth Flow

```
1. User enters phone number
   ↓
2. Check phone status → Backend API
   ↓
3. Based on state:
   - NOT_FOUND → Show contact admin message
   - NOT_VERIFIED → Request OTP → Verify OTP
   - NEEDS_PASSWORD → Set password form
   - READY → Login form
   - NO_BRANCH → Show contact admin message
   ↓
4. Login with phone + password
   ↓
5. Based on response:
   - MULTI_BRANCH → Select branch
   - Success → Get tokens → Redirect to dashboard
   ↓
6. Store tokens in localStorage
   ↓
7. Fetch user data (/me endpoint)
   ↓
8. Render dashboard with role-based UI
```

## 🎨 Component Hierarchy

```
RootLayout (app/layout.tsx)
├── Providers (TanStack Query + Toaster)
└── Children
    ├── HomePage (/) → Redirect logic
    ├── LoginPage (/login)
    │   ├── PhoneInput
    │   ├── OTPInput
    │   └── Forms (phone, otp, password, login, branch selection)
    └── DashboardPage (/dashboard)
        ├── Header (logo, branch badge, user avatar, logout)
        ├── Welcome Card (user info, branch info)
        ├── Branches Card (branch switcher)
        └── Feature Cards (role-based)
            ├── SuperAdmin → Filiallar, Users, Sozlamalar
            ├── BranchAdmin → Xodimlar, O'quvchilar, Hisobotlar
            ├── Teacher → Darslar, Davomat, Baholar
            └── Student → Jadval, Baholar, Uy vazifalar
```

## 📦 Dependencies

### Production
- next@16.0.4 - Framework
- react@19 - UI library
- typescript@5 - Type safety
- zustand@5 - State management
- @tanstack/react-query@5 - Server state
- axios@1 - HTTP client
- react-hook-form@7 - Form handling
- zod@3 - Schema validation
- next-intl@3 - i18n (o'rnatilgan, sozlanmagan)
- recharts@2 - Charts (o'rnatilgan, ishlatilmagan)
- socket.io-client@4 - WebSocket (o'rnatilgan, ishlatilmagan)

### Development
- tailwindcss@4 - Styling
- eslint@9 - Linting
- prettier@3 - Code formatting
- @types/* - TypeScript types

## ⚠️ Ma'lum Muammolar

### 1. Node.js Version
- **Muammo**: Next.js 16 requires Node.js >=20.9.0
- **Hozirgi versiya**: 18.19.1
- **Yechim**: Node.js ni 20.9.0 yoki yuqoriga yangilash
- **Vaqtinchalik**: Development mode (`npm run dev`) ishlaydi

### 2. Type Errors
- OTPInput component ref type issue - ✅ Tuzatildi

## ✅ Tayyor Funksionallik

1. ✅ Project setup (Next.js 14, TypeScript, Tailwind)
2. ✅ shadcn/ui component library
3. ✅ API client with interceptors
4. ✅ Auth store (Zustand)
5. ✅ Custom useAuth hook
6. ✅ Phone input component (O'zbek format)
7. ✅ OTP input component (6 digit)
8. ✅ Login page (full auth flow)
9. ✅ Dashboard page (role-based UI)
10. ✅ Token management (auto-refresh)
11. ✅ Branch switcher
12. ✅ Type definitions (complete)
13. ✅ Documentation (README, DEVELOPMENT)

## 🚧 Keyingi Qadamlar

### Fase 2: Middleware va Route Protection (Hafta 2-3)
- [ ] Middleware yaratish (authentication check)
- [ ] Protected routes setup
- [ ] Role-based route access
- [ ] Redirect logic optimization

### Fase 3: Dashboard Layout (Hafta 3-4)
- [ ] Sidebar navigation component
- [ ] Header component (notifications, profile dropdown)
- [ ] Footer component
- [ ] Breadcrumb navigation
- [ ] Theme switcher (dark/light mode)

### Fase 4: Core Features (Hafta 4-6)
- [ ] Teacher dashboard (attendance, grades, schedule)
- [ ] Student dashboard (grades, homework, schedule)
- [ ] Parent dashboard (children monitoring)
- [ ] Admin panel (user management, branch management)
- [ ] Profile management pages

### Fase 5: Advanced Features (Hafta 6-8)
- [ ] WebSocket integration (real-time updates)
- [ ] PWA configuration (next-pwa)
- [ ] Offline support (service workers)
- [ ] next-intl setup (O'zbek, Rus, Ingliz)
- [ ] Charts integration (Recharts)
- [ ] Performance optimization
- [ ] Error boundaries
- [ ] Loading states & skeletons
- [ ] Testing setup (Jest, Playwright)

### Fase 6: Mobile & Polish (Hafta 8-10)
- [ ] Capacitor setup (mobile apps)
- [ ] Push notifications
- [ ] App icons & splash screens
- [ ] Performance monitoring
- [ ] Analytics integration
- [ ] Final testing
- [ ] Deployment preparation

## 🎓 Kod Namunalari

### useAuth Hook Ishlatish
```typescript
const { 
  user, 
  currentBranch, 
  isAuthenticated, 
  login, 
  logout,
  hasRole,
  isSuperAdmin 
} = useAuth();

// Login
await login({ phone_number: "+998901234567", password: "secret" });

// Check role
if (hasRole("teacher")) {
  // Show teacher features
}

// Check super admin
if (isSuperAdmin()) {
  // Show admin features
}
```

### API Call
```typescript
import { authApi } from "@/lib/api";

// Check phone
const result = await authApi.checkPhone({ phone_number: "+998901234567" });

// Login
const response = await authApi.login({
  phone_number: "+998901234567",
  password: "secret"
});
```

### Protected Component
```typescript
"use client";

import { useAuth } from "@/lib/hooks";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Unauthorized</div>;

  return <div>Protected Content</div>;
}
```

## 📞 Qo'llab-quvvatlash

Savollar yoki muammolar bo'lsa:
1. README.md ni o'qing
2. DEVELOPMENT.md ni ko'rib chiqing
3. Backend docs/ folderini tekshiring
4. TypeScript type definitions ni o'rganing

---

**Loyiha holati**: ✅ Foundation Complete (Phase 1)  
**Keyingi vazifa**: Middleware va Route Protection (Phase 2)  
**Tavsiya**: Node.js ni 20.9.0+ ga yangilang
