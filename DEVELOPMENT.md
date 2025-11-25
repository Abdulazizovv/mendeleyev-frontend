# Mendeleyev Frontend Development Guide

## 🏗 Arxitektura

### State Management
- **Zustand** - Client state (auth, UI state)
- **TanStack Query** - Server state (API data caching)

### API Integration
- **Axios** - HTTP client
- **Auto token refresh** - Axios interceptorlar orqali
- **Error handling** - Centralized error handling

### Routing
- **App Router** - Next.js 14 App Router
- **Route Groups** - `(auth)`, `(dashboard)` organizatsiya uchun
- **Protected Routes** - Middleware orqali himoyalangan

## 📝 Kod Standartlari

### TypeScript
- Strict mode yoqilgan
- Barcha komponentlar type-safe
- API responses uchun interface/type yaratish majburiy

### Component Structure
```tsx
// 1. Imports
import * as React from "react";
import { useForm } from "react-hook-form";

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component
export const Component: React.FC<ComponentProps> = ({ prop }) => {
  // 4. Hooks
  const [state, setState] = React.useState();
  
  // 5. Handlers
  const handleClick = () => {
    // ...
  };
  
  // 6. Effects
  React.useEffect(() => {
    // ...
  }, []);
  
  // 7. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
};
```

### Naming Conventions
- **Components**: PascalCase (e.g., `PhoneInput.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Utils**: camelCase (e.g., `formatPhone.ts`)
- **Types**: PascalCase (e.g., `User`, `AuthState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

## 🎨 Styling Guide

### Tailwind Classes Order
1. Layout (flex, grid, block, inline)
2. Positioning (absolute, relative, top, left)
3. Size (w-, h-, min-, max-)
4. Spacing (p-, m-)
5. Typography (text-, font-)
6. Visual (bg-, border-, shadow-)
7. Other (cursor-, transition-)

### Component Variants
shadcn/ui komponentlar variant pattern ishlatadi:
```tsx
<Button variant="default" size="lg">
  Click me
</Button>
```

## 🔐 Auth Flow Implementation

### Token Storage
```typescript
// localStorage da saqlanadi:
- mendeleyev_access_token
- mendeleyev_refresh_token
- mendeleyev_user
- mendeleyev_current_branch
```

### Protected Route Pattern
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";

export default function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <LoadingState />;
  if (!isAuthenticated) return null;

  return <PageContent />;
}
```

## 📡 API Integration

### API Call Pattern
```typescript
// 1. Define types
interface LoginRequest {
  phone_number: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

// 2. Create API method
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login/", data);
    return response.data;
  },
};

// 3. Use in component
const { mutate: login, isLoading } = useMutation({
  mutationFn: authApi.login,
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  },
});
```

## 🎯 Feature Development Workflow

### 1. Create Types
```typescript
// types/feature.ts
export interface Feature {
  id: string;
  name: string;
}
```

### 2. Create API Service
```typescript
// lib/api/feature.ts
export const featureApi = {
  getAll: async () => {
    const response = await apiClient.get<Feature[]>("/features/");
    return response.data;
  },
};
```

### 3. Create Store (if needed)
```typescript
// lib/stores/feature.ts
interface FeatureState {
  features: Feature[];
  setFeatures: (features: Feature[]) => void;
}

export const useFeatureStore = create<FeatureState>((set) => ({
  features: [],
  setFeatures: (features) => set({ features }),
}));
```

### 4. Create Hook (if needed)
```typescript
// lib/hooks/useFeature.ts
export const useFeature = () => {
  const { features, setFeatures } = useFeatureStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ["features"],
    queryFn: featureApi.getAll,
    onSuccess: setFeatures,
  });
  
  return { features: data || features, isLoading };
};
```

### 5. Create Component
```typescript
// components/feature/FeatureList.tsx
export const FeatureList = () => {
  const { features, isLoading } = useFeature();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {features.map((feature) => (
        <FeatureCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
};
```

### 6. Create Page
```typescript
// app/(dashboard)/features/page.tsx
export default function FeaturesPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Features" />
      <FeatureList />
    </DashboardLayout>
  );
}
```

## 🐛 Debugging

### React DevTools
- Install React DevTools extension
- Components tab uchun state inspect qilish
- Profiler tab uchun performance

### Network Tab
- API calls ko'rish
- Request/Response headers
- Timing information

### Console Logs
```typescript
// Development only
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

## 🚀 Performance Tips

### 1. Code Splitting
```typescript
// Dynamic imports
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
});
```

### 2. Memoization
```typescript
// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensive(data);
}, [data]);

// useCallback for event handlers
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);
```

### 3. Image Optimization
```tsx
import Image from "next/image";

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // for above-the-fold images
/>
```

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Mobile: full width */}
  {/* Tablet: half width */}
  {/* Desktop: third width */}
</div>
```

## 🔍 Testing (Keyinroq)

### Unit Tests
```typescript
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";

describe("Component", () => {
  it("should render", () => {
    render(<Component />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });
});
```

### E2E Tests
```typescript
import { test, expect } from "@playwright/test";

test("login flow", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="phone"]', "+998901234567");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## 🎓 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
