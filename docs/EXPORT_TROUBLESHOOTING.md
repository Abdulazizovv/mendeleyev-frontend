# Excel Export - Troubleshooting Guide

## ❌ Keng Tarqalgan Xatolar va Yechimlar

### ⚠️ MUHIM: Branch ID Header'da Yuboriladi

Backend API `X-Branch-Id` header'ini kutadi. Frontend avtomatik ravishda har bir request'ga bu header'ni qo'shadi:

```typescript
// lib/api/client.ts - Request Interceptor
Headers: {
  "Authorization": "Bearer <token>",
  "X-Branch-Id": "123"  // ← Avtomatik qo'shiladi
}
```

**Branch ID qayerdan olinadi:**
1. `localStorage.getItem(STORAGE_KEYS.CURRENT_BRANCH)`
2. JSON parse qilinadi
3. `currentBranch.branch_id` olinadi
4. Header'ga qo'shiladi

---

### 1. "Export qilish uchun ma'lumot topilmadi"

**Sabab:** Filtrlar juda qattiq yoki belgilangan sana oralig'ida ma'lumot yo'q.

**Yechimlar:**

#### ✅ A) Filtrlarni olib tashlash (Eng oson)
```
1. Export modalni oching
2. Sanalarni bo'sh qoldiring (ixtiyoriy)
3. Barcha boshqa filtrlarni "Barchasi" ga o'zgartiring
4. "Eksport qilish" tugmasini bosing
```

#### ✅ B) Sana oralig'ini kengaytirish
```
Juda qisqa oraliq emas:
❌ 2026-01-03 dan 2026-01-03 gacha (1 kun)
✅ 2026-01-01 dan 2026-01-31 gacha (1 oy)
✅ 2025-01-01 dan 2026-12-31 gacha (keng oraliq)
```

#### ✅ C) Branch to'g'riligini tekshirish
```typescript
// Browser Console'da:
const branch = JSON.parse(localStorage.getItem('CURRENT_BRANCH'));
console.log('Current branch:', branch);
console.log('Branch ID:', branch?.branch_id);

// Network tab'da request headers'ni ko'ring:
// X-Branch-Id: 123 ← Bu header borligini tasdiqlang
```

**Agar X-Branch-Id header yo'q bo'lsa:**
1. Login qiling (branch tanlash sahifasiga o'tadi)
2. Branch tanlang
3. Dashboard'ga o'ting
4. Qayta export qiling

---

### 2. Backend API Errors

#### Error: 400 Bad Request
```
Sabab: Noto'g'ri filter formati
Yechim: Filterlarni tekshiring, noto'g'ri qiymatlarni olib tashlang
```

#### Error: 403 Forbidden
```
Sabab: Export qilish uchun ruxsat yo'q
Yechim: Admin yoki mas'ul xodim sifatida kiring
```

#### Error: 500 Internal Server Error
```
Sabab: Backend xatolik
Yechim: Backend loglarni tekshiring, Celery worker ishlab turganini tasdiqlang
```

---

## 🔧 Debugging Steps

### 1. Console'da Filterlarni Tekshirish

ExportModal'da filtrlar yuborilishidan oldin:

```javascript
// Browser console'da
console.log('Export filters:', filters);

// Expected output (minimal):
{
  branch_id: 123
}

// Expected output (with filters):
{
  branch_id: 123,
  date_from: "2026-01-01",
  date_to: "2026-01-31",
  status: "completed"
}
```

### 2. Network Request'ni Tekshirish

**Browser DevTools → Network → XHR/Fetch:**

```
POST /api/v1/school/finance/export/transactions/
Headers:
  Authorization: Bearer xxx...
  X-Branch-Id: 123  ← MUHIM: Bu header borligini tekshiring!
  Content-Type: application/json
Body:
  {
    "date_from": "2026-01-01",
    "date_to": "2026-01-31"
    // branch_id body'da YO'Q - header'da!
  }
```

### 3. Backend Response'ni Tekshirish

**Success Response:**
```json
{
  "message": "Export jarayoni boshlandi",
  "task_id": "abc-123-def-456",
  "status": "PENDING"
}
```

**Error Response:**
```json
{
  "error": "Export qilish uchun ma'lumot topilmadi",
  "details": "No transactions found for the given filters"
}
```

---

## 📋 Test Checklist

### Minimal Export (No Filters)
- [ ] Open export modal
- [ ] Leave all fields empty
- [ ] Click "Eksport qilish"
- [ ] Should export ALL data from branch

### Date Range Only
- [ ] Set date_from: 2025-01-01
- [ ] Set date_to: 2026-12-31
- [ ] Leave other filters empty
- [ ] Should export data within date range

### With All Filters
- [ ] Set date range
- [ ] Select status
- [ ] Select payment method (transactions)
- [ ] Should export only matching records

### Edge Cases
- [ ] Empty result set (no data)
- [ ] Very large dataset (10,000+ records)
- [ ] Invalid date range (from > to)
- [ ] Non-existent branch_id

---

## 🎯 Best Practices

### ✅ Do's

1. **Keng sana oralig'idan boshlang:**
   ```
   date_from: "2025-01-01"
   date_to: "2026-12-31"
   ```

2. **Filtrlarni bosqichma-bosqich qo'shing:**
   ```
   Step 1: Faqat sanalar
   Step 2: + Status
   Step 3: + Payment method
   ```

3. **Branch'ni doim yuborish:**
   ```typescript
   branch_id: branchId ? Number(branchId) : undefined
   ```

### ❌ Don'ts

1. **Juda qisqa sana oraliq:**
   ```
   ❌ 1 kunlik: 2026-01-03 to 2026-01-03
   ✅ Kamida 1 oy: 2026-01-01 to 2026-01-31
   ```

2. **Barcha filtrlarni bir vaqtda qo'shish:**
   ```
   ❌ Darhol 5-6 ta filtr
   ✅ Ketma-ket qo'shish va tekshirish
   ```

3. **Empty string yuborish:**
   ```typescript
   ❌ { date_from: "", date_to: "" }
   ✅ { date_from: undefined, date_to: undefined }
   // Backend uchun undefined yaxshiroq
   ```

---

## 🔍 Common Scenarios

### Scenario 1: "Barcha tranzaksiyalarni export qilish"

```typescript
// Modal'ni oching
// Hech narsa o'zgartirmang
// Eksport tugmasini bosing

Request Headers:
  X-Branch-Id: 123  ← Avtomatik qo'shiladi

Request Body:
  {}  // Bo'sh body - barcha ma'lumotlar

Result: Branch 123'dagi BARCHA tranzaksiyalar
```

### Scenario 2: "Faqat o'tgan oy"

```typescript
// date_from: 2025-12-01
// date_to: 2025-12-31
// Boshqa filtrlar: bo'sh

Filters sent:
{
  branch_id: 123,
  date_from: "2025-12-01",
  date_to: "2025-12-31"
}

Result: Dekabr oyidagi barcha tranzaksiyalar
```

### Scenario 3: "Faqat completed payments"

```typescript
// date_from: 2026-01-01
// date_to: 2026-01-31
// status: completed

Filters sent:
{
  branch_id: 123,
  date_from: "2026-01-01",
  date_to: "2026-01-31",
  status: "completed"
}

Result: Yanvar oyidagi completed tranzaksiyalar
```

---

## 🛠️ Backend Requirements

### Celery Worker
```bash
# Worker ishlab turganini tekshirish
celery -A config inspect active

# Worker yo'q bo'lsa, ishga tushirish
celery -A config worker -l info
```

### Database
```sql
-- Tranzaksiyalar borligini tekshirish
SELECT COUNT(*) FROM finance_transaction WHERE branch_id = 123;

-- Sana oralig'ida
SELECT COUNT(*) FROM finance_transaction 
WHERE branch_id = 123 
  AND transaction_date >= '2026-01-01' 
  AND transaction_date <= '2026-01-31';
```

---

## 📊 Success Metrics

### Expected Behavior

1. **Empty filters → All data:**
   - Request: `{}`
   - Result: Branchdagi barcha ma'lumotlar

2. **Date range only → Filtered by date:**
   - Request: `{ date_from, date_to }`
   - Result: Sana oralig'idagi ma'lumotlar

3. **With filters → Precise match:**
   - Request: `{ date_from, date_to, status, ... }`
   - Result: Barcha filtrlarga mos ma'lumotlar

4. **No results → Clear error:**
   - Backend: `"error": "No data found"`
   - Frontend: Toast with helpful message

---

## 📞 Support

Agar muammo davom etsa:

1. **Console loglarni tekshiring:** Browser DevTools → Console
2. **Network request'larni ko'ring:** DevTools → Network
3. **Backend loglarni o'qing:** Server console yoki log files
4. **Celery worker statusini tekshiring:** `celery inspect`
5. **Database'ni query qiling:** Direct SQL check

**Remember:** Empty filters = export ALL data! 🎉
