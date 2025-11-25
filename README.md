# Mendeleyev Frontend

O'zbekiston maktablari va o'quv markazlari uchun zamonaviy ta'lim boshqaruv platformasi (Frontend qismi).

## 🚀 Texnologiyalar

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (client) + TanStack Query (server)
- **Authentication**: JWT + OTP flow
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **UI Components**: Radix UI + shadcn/ui

## 📋 Talablar

- Node.js 20.9.0 yoki yuqori (hozirda 18.19.1 bilan ham ishlaydi, lekin warning beradi)
- npm yoki yarn yoki pnpm

## 🛠 O'rnatish

### 1. Repositoriyani clone qiling

```bash
git clone <repository-url>
cd mendeleyev-frontend
```

### 2. Paketlarni o'rnating

```bash
npm install
```

### 3. Environment o'zgaruvchilarni sozlang

`.env.local` faylini yarating va quyidagi o'zgaruvchilarni qo'shing:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Mendeleyev
NEXT_PUBLIC_DEFAULT_LOCALE=uz

# Auth Configuration
NEXT_PUBLIC_OTP_LENGTH=6
NEXT_PUBLIC_OTP_COOLDOWN=60

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=false
NEXT_PUBLIC_ENABLE_WEBSOCKET=false
```

### 4. Development serverni ishga tushiring

```bash
npm run dev
```

Brauzerda http://localhost:3000 ga o'ting.

## 📁 Loyiha strukturasi

```
mendeleyev-frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, etc.)
│   │   └── login/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   └── dashboard/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page (redirect logic)
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── auth/               # Auth-related components
│   │   ├── PhoneInput.tsx
│   │   └── OTPInput.tsx
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard components
│   ├── ui/                 # shadcn/ui components
│   └── providers.tsx       # App providers (TanStack Query, etc.)
├── lib/                     # Library code
│   ├── api/                # API client and services
│   │   ├── client.ts       # Axios instance with interceptors
│   │   ├── auth.ts         # Auth API methods
│   │   └── index.ts
│   ├── stores/             # Zustand stores
│   │   ├── auth.ts         # Auth state management
│   │   └── index.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Auth hook
│   │   └── index.ts
│   ├── config.ts           # App configuration and constants
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript type definitions
│   ├── auth.ts             # Auth-related types
│   ├── api.ts              # API response types
│   └── index.ts
├── public/                  # Static files
└── docs/                    # Backend documentation
```

## 🔐 Authentication Flow

Loyiha backend bilan to'liq integratsiya qilingan authentication sistemasiga ega:

### 1. Telefon raqamini tekshirish
- Foydalanuvchi telefon raqamini kiritadi
- Backend `/api/v1/auth/phone/check/` endpointiga so'rov yuboriladi
- Backend quyidagi holatlardan birini qaytaradi:
  - `NOT_FOUND` - Foydalanuvchi topilmadi
  - `NOT_VERIFIED` - Telefon tasdiqlanmagan
  - `NEEDS_PASSWORD` - Parol kerak
  - `READY` - Tizimga kirish mumkin
  - `NO_BRANCH` - Filialga biriktirilmagan

### 2. OTP Tasdiqlash (agar kerak bo'lsa)
- OTP kodi so'raladi: `/api/v1/auth/phone/verification/request/`
- Kod tasdiqlash: `/api/v1/auth/phone/verification/confirm/`

### 3. Parol o'rnatish (agar kerak bo'lsa)
- `/api/v1/auth/password/set/` orqali parol o'rnatiladi

### 4. Login
- `/api/v1/auth/login/` orqali login qilinadi
- Agar ko'p filial bo'lsa, foydalanuvchi filial tanlaydi
- Token olindi va localStorage ga saqlanadi

### 5. Token yangilash
- Access token muddati tugashi bilan avtomatik yangilanadi
- Axios interceptor orqali qo'llab-quvvatlanadi

## 🎨 UI Components

shadcn/ui komponentlaridan foydalanilgan:
- Button
- Input
- Label
- Card
- Dialog
- Form
- Select
- Checkbox
- Dropdown Menu
- Avatar
- Badge
- Separator
- Sonner (toast notifications)

## 🔧 Asosiy Xususiyatlar

### ✅ Bajarilgan:
- [x] Next.js 14 loyihasi setup
- [x] TypeScript konfiguratsiyasi
- [x] Tailwind CSS + shadcn/ui
- [x] Axios API client with interceptors
- [x] Zustand auth store
- [x] Custom useAuth hook
- [x] Phone input component
- [x] OTP input component
- [x] Login page with full flow
- [x] Dashboard page
- [x] Token management va auto-refresh
- [x] Role-based UI

### 🚧 Keyingi qadamlar:
- [ ] Middleware va route protection
- [ ] Internationalization (next-intl)
- [ ] Dashboard layouts (sidebar, header)
- [ ] Role-specific pages (teacher, student, admin)
- [ ] Profile management
- [ ] PWA konfiguratsiyasi
- [ ] WebSocket integratsiyasi
- [ ] Dark/Light mode
- [ ] Error boundaries
- [ ] Loading states va skeletons
- [ ] E2E testlar

## 🧪 Testlash

```bash
# Unit tests (keyinroq qo'shiladi)
npm run test

# E2E tests (keyinroq qo'shiladi)
npm run test:e2e
```

## 📦 Build

Production uchun build qilish:

```bash
npm run build
npm run start
```

## 📚 Backend Dokumentatsiya

Backend API hujjatlari `docs/` folderida mavjud:
- `docs/api/auth.md` - Auth API hujjatlari
- `docs/permissions-rbac.md` - RBAC tizimi
- `docs/frontend/auth-integration.md` - Frontend integratsiya qo'llanma

## 🤝 Hissa qo'shish

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. Commit qiling (`git commit -m 'feat: add amazing feature'`)
4. Push qiling (`git push origin feature/amazing-feature`)
5. Pull Request oching

## 📝 Litsenziya

MIT

## 👥 Muallif

Mendeleyev Development Team

