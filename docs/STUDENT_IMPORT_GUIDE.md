# O'quvchilarni Excel orqali Import qilish funksiyasi

## Umumiy ma'lumot

Maktablar uchun o'quvchilarni Excel fayl orqali bir vaqtda import qilish imkonini beruvchi professional interfeys.

## Fayllar strukturasi

```
app/(dashboard)/school/students/import/
├── page.tsx                        # Route entry point
└── student-import-page.tsx         # Main page component

components/school/students/import/
├── file-upload.tsx                 # File upload with drag & drop
├── import-results.tsx              # Results display component
├── student-import-form.tsx         # Main import form
└── index.ts                        # Barrel export

lib/api/school.ts
└── importStudents()                # API function

types/school.ts
└── StudentImportResult             # Import result types
    ImportStudentError
    ImportedStudent
    StudentImportRequest
```

## Xususiyatlar

### 1. File Upload
- ✅ Drag & drop qo'llab-quvvatlash
- ✅ .xlsx va .xls formatlarni qabul qilish
- ✅ 10MB maksimal fayl hajmi
- ✅ Fayl validatsiyasi
- ✅ Upload progress ko'rsatish

### 2. Dry Run (Oldindan ko'rish)
- ✅ Import qilishdan oldin validatsiya
- ✅ Xatolarni aniqlab ko'rsatish
- ✅ Muvaffaqiyatli/Xatolikli/O'tkazilgan statistika
- ✅ Batafsil xatolik xabarlari

### 3. Import
- ✅ Bir vaqtda ko'p o'quvchilarni import qilish
- ✅ Atomic transaction (hammasi yoki hech narsa)
- ✅ Yaqinlar bilan birga import
- ✅ Auto-generated personal number

### 4. Results Display
- ✅ Visual statistika kartochalari
- ✅ Import qilingan o'quvchilar ro'yxati
- ✅ Xatoliklar batafsil ko'rsatilishi
- ✅ Success/Failed/Skipped statuslar

### 5. Template
- ✅ CSV template yuklab olish
- ✅ Sample data bilan
- ✅ Barcha kerakli ustunlar

### 6. Permissions
- ✅ Faqat super_admin va branch_admin
- ✅ Filial bo'yicha cheklash
- ✅ Role-based access control

## Foydalanish

### 1. Import sahifasiga o'tish
```
/school/students/import
```

### 2. Template yuklab olish
- "Template yuklab olish" tugmasini bosing
- CSV fayl yuklab olinadi
- Excel da ochib ma'lumotlarni to'ldiring

### 3. Excel faylni tayyorlash

Quyidagi ustunlar bo'lishi kerak:

| Ustun | Tavsif | Majburiy | Misol |
|-------|--------|----------|-------|
| Shartnoma Raqam FIO | To'liq ism | Ha | Ali Karim o'g'li Valiyev |
| Telefon Raqam | Telefon | Ha | +998901234567 |
| Jinsi | Jinsi | Ha | male/female |
| Tug'ilgan sanai | Tug'ilgan sana | Yo'q | 2010-05-15 |
| Manzil | Manzil | Yo'q | Toshkent |
| Passport | Passport | Yo'q | AB1234567 |
| 1-Yaqinl Turi | Yaqinlik turi | Yo'q | ota/ona/vasiy |
| 1-Yaqini FIO | Yaqin ismi | Yo'q | Karim Valiyev |
| 1-Yaqini Telefon | Yaqin telefoni | Yo'q | +998901234568 |

### 4. Import qilish
1. Faylni tanlang yoki tashlang
2. "Oldindan ko'rish" tugmasini bosing
3. Natijalarni tekshiring
4. Xatoliklar bo'lsa tuzating
5. "Import qilish" tugmasini bosing
6. Natijalarni ko'ring

## API endpoint

```typescript
POST /api/school/students/import/

FormData:
- file: Excel fayl
- branch_id: UUID
- dry_run: boolean (optional, default: false)

Response: StudentImportResult {
  total: number
  success: number
  failed: number
  skipped: number
  errors: ImportStudentError[]
  students: ImportedStudent[]
}
```

## Type definitions

```typescript
interface StudentImportResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: ImportStudentError[];
  students: ImportedStudent[];
}

interface ImportStudentError {
  row: number;
  error: string;
  student?: string;
}

interface ImportedStudent {
  id?: string;
  row?: number;
  name: string;
  phone: string;
  status: "created" | "ready" | "skipped" | "failed";
}
```

## Muhim eslatmalar

1. **Telefon raqamlar unique** - Har bir telefon raqam faqat bir marta bo'lishi mumkin
2. **Atomic transaction** - Xatolik bo'lsa hech narsa saqlanmaydi
3. **Auto-generated personal_number** - Avtomatik yaratiladi
4. **Yaqinlar optional** - Majburiy emas
5. **Import history** - `additional_fields.imported_from_excel: true`

## Kelajakdagi takomillashlar

- [ ] Background task bilan import (Celery)
- [ ] Import tarixi va log
- [ ] Excel template download endpoint (backend)
- [ ] Guruhlarni avtomatik yaratish
- [ ] Duplicate detection strategiyasi
- [ ] Batch import (chunking)
- [ ] Email notification

## Muammolarni hal qilish

### Fayl yuklanmayapti
- Fayl formatini tekshiring (.xlsx yoki .xls)
- Fayl hajmini tekshiring (max 10MB)
- Browser console'da xatolarni ko'ring

### Import xatolik bermoqda
- Telefon raqamlar unique ekanligini tekshiring
- Barcha majburiy ustunlar to'ldirilganligini tekshiring
- Date formatini tekshiring (YYYY-MM-DD yoki DD.MM.YYYY)

### Permissions xatoligi
- Role tekshiring (super_admin yoki branch_admin)
- Filial tanlanganligini tekshiring

## Texnik detallar

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui
- **Validation**: Client-side + Server-side
- **File Processing**: FormData API
- **State Management**: React useState
- **Error Handling**: try-catch + toast notifications
