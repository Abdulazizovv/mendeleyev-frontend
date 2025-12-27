# Tranzaksiyalar API

Moliyaviy tranzaksiyalarni boshqarish uchun API'lar.

## Versiya Ma'lumotlari

### v2.2.0 (2025-12-23)
**Yangiliklar:**
- ✅ To'liq student ma'lumotlari (personal_number, status, current_class)
- ✅ To'liq employee ma'lumotlari (full_name, role, avatar)
- ✅ Kengaytirilgan filterlar:
  - `student_profile` - O'quvchi bo'yicha filter
  - `employee_membership` - Xodim bo'yicha filter
  - `date_from`, `date_to` - Sana oralig'i
  - `payment_method` - To'lov usuli
- ✅ Optimizatsiya: select_related va prefetch_related

### v2.0.0
- Asosiy CRUD operatsiyalari
- Kategoriyalar tizimi
- Soft delete

## Umumiy Ma'lumotlar

- **Base URL**: `/api/v1/school/finance/transactions/`
- **Authentication**: JWT Token talab qilinadi
- **Permissions**: 
  - Super Admin (barcha filiallar)
  - Branch Admin (o'z filiali)
  - Cashier (faqat ko'rish)
- **Pagination**: Default 20, max 100

---

## API Endpoints

### Tranzaksiyalar Ro'yxati

```
GET /api/v1/school/finance/transactions/
```

**Headers:**
- `Authorization: Bearer <token>`
- `X-Branch-Id: <branch_uuid>` (Branch Admin uchun)

**Query Parameters:**

| Parametr | Turi | Tavsif | Misol |
|----------|------|--------|-------|
| `transaction_type` | string | Tranzaksiya turi | `payment`, `income`, `expense` |
| `status` | string | Holat | `completed`, `pending`, `cancelled` |
| `cash_register` | UUID | Kassa ID | `uuid` |
| `category` | UUID | Kategoriya ID | `uuid` |
| `student_profile` | UUID | O'quvchi ID | `uuid` |
| `employee_membership` | UUID | Xodim membership ID | `uuid` |
| `payment_method` | string | To'lov usuli | `cash`, `card`, `bank_transfer` |
| `date_from` | date | Boshlanish sanasi | `2025-12-01` |
| `date_to` | date | Tugash sanasi | `2025-12-31` |
| `search` | string | Qidirish (description, reference_number) | `Dekabr` |
| `ordering` | string | Tartiblash | `-transaction_date`, `amount` |
| `page` | integer | Sahifa raqami | `1` |
| `page_size` | integer | Sahifadagi elementlar | `20` |

**Response:**
```json
{
  "count": 150,
  "next": "http://localhost:8080/api/v1/school/finance/transactions/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "branch": "uuid",
      "branch_name": "Markaziy filial",
      "cash_register": "uuid",
      "cash_register_name": "Asosiy kassa",
      "transaction_type": "payment",
      "transaction_type_display": "To'lov",
      "status": "completed",
      "status_display": "Bajarilgan",
      "category": "uuid",
      "category_name": "O'quvchi to'lovlari",
      "amount": 500000,
      "payment_method": "cash",
      "payment_method_display": "Naqd pul",
      "description": "Dekabr oylik to'lovi",
      "reference_number": "PAY-2025-001",
      "student_profile": "uuid",
      "student": {
        "id": "uuid",
        "personal_number": "TAS-25-0001",
        "full_name": "Ali Olim o'g'li Valiyev",
        "phone_number": "+998901234567",
        "status": "active",
        "status_display": "Aktiv",
        "current_class": {
          "id": "uuid",
          "name": "5-A"
        }
      },
      "employee_membership": "uuid",
      "employee": {
        "id": "uuid",
        "user_id": "uuid",
        "full_name": "Aziza Karimova",
        "phone_number": "+998901234999",
        "email": "aziza@example.com",
        "role": "cashier",
        "role_display": "Kassir",
        "is_active": true,
        "avatar": "/media/profiles/avatar123.jpg",
        "avatar_url": "http://localhost:8080/media/profiles/avatar123.jpg"
      },
      "transaction_date": "2025-12-23T10:30:00Z",
      "metadata": {},
      "created_at": "2025-12-23T10:30:00Z",
      "updated_at": "2025-12-23T10:30:00Z"
    }
  ]
}
```

**Transaksiya Turlari:**
- `income` - Kirim
- `expense` - Chiqim
- `transfer` - O'tkazma
- `payment` - To'lov
- `salary` - Maosh
- `refund` - Qaytarish

**Holat Turlari:**
- `pending` - Kutilmoqda
- `completed` - Bajarilgan
- `cancelled` - Bekor qilingan
- `failed` - Muvaffaqiyatsiz

**To'lov Usullari:**
- `cash` - Naqd pul
- `card` - Karta
- `bank_transfer` - Bank o'tkazmasi
- `mobile_payment` - Mobil to'lov
- `other` - Boshqa

---

### Tranzaksiya Yaratish

```
POST /api/v1/school/finance/transactions/
```

**Request Body:**
```json
{
  "cash_register": "uuid",
  "transaction_type": "payment",
  "category": "uuid",
  "amount": 500000,
  "payment_method": "cash",
  "description": "Dekabr oylik to'lovi",
  "reference_number": "PAY-2025-001",
  "student_profile": "uuid",
  "employee_membership": null,
  "transaction_date": "2025-12-23T10:30:00Z",
  "metadata": {}
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "branch": "uuid",
  "branch_name": "Markaziy filial",
  "cash_register": "uuid",
  "cash_register_name": "Asosiy kassa",
  "transaction_type": "payment",
  "transaction_type_display": "To'lov",
  "status": "completed",
  "status_display": "Bajarilgan",
  "category": "uuid",
  "category_name": "O'quvchi to'lovlari",
  "amount": 500000,
  "payment_method": "cash",
  "payment_method_display": "Naqd pul",
  "description": "Dekabr oylik to'lovi",
  "reference_number": "PAY-2025-001",
  "student_profile": "uuid",
  "student": {
    "id": "uuid",
    "personal_number": "TAS-25-0001",
    "full_name": "Ali Olim o'g'li Valiyev",
    "phone_number": "+998901234567",
    "status": "active",
    "status_display": "Aktiv",
    "current_class": {
      "id": "uuid",
      "name": "5-A"
    }
  },
  "employee_membership": null,
  "employee": null,
  "transaction_date": "2025-12-23T10:30:00Z",
  "metadata": {},
  "created_at": "2025-12-23T10:30:00Z",
  "updated_at": "2025-12-23T10:30:00Z"
}
```

---

### Tranzaksiya Tafsilotlari

```
GET /api/v1/school/finance/transactions/{transaction_id}/
```

**Response:**
```json
{
  "id": "uuid",
  "branch": "uuid",
  "branch_name": "Markaziy filial",
  "cash_register": "uuid",
  "cash_register_name": "Asosiy kassa",
  "transaction_type": "payment",
  "transaction_type_display": "To'lov",
  "status": "completed",
  "status_display": "Bajarilgan",
  "category": "uuid",
  "category_name": "O'quvchi to'lovlari",
  "amount": 500000,
  "payment_method": "cash",
  "payment_method_display": "Naqd pul",
  "description": "Dekabr oylik to'lovi",
  "reference_number": "PAY-2025-001",
  "student_profile": "uuid",
  "student": {
    "id": "uuid",
    "personal_number": "TAS-25-0001",
    "full_name": "Ali Olim o'g'li Valiyev",
    "phone_number": "+998901234567",
    "status": "active",
    "status_display": "Aktiv",
    "current_class": {
      "id": "uuid",
      "name": "5-A"
    }
  },
  "employee_membership": "uuid",
  "employee": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "Aziza Karimova",
    "phone_number": "+998901234999",
    "email": "aziza@example.com",
    "role": "cashier",
    "role_display": "Kassir",
    "is_active": true,
    "avatar": "/media/profiles/avatar123.jpg",
    "avatar_url": "http://localhost:8080/media/profiles/avatar123.jpg"
  },
  "transaction_date": "2025-12-23T10:30:00Z",
  "metadata": {},
  "created_at": "2025-12-23T10:30:00Z",
  "updated_at": "2025-12-23T10:30:00Z"
}
```

---

## Frontend Integratsiya

### TypeScript Interface

```typescript
// types/transaction.ts

export interface Transaction {
  id: string;
  branch: string;
  branch_name: string;
  cash_register: string;
  cash_register_name: string;
  transaction_type: 'income' | 'expense' | 'transfer' | 'payment' | 'salary' | 'refund';
  transaction_type_display: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  status_display: string;
  category: string | null;
  category_name: string | null;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | 'other';
  payment_method_display: string;
  description: string;
  reference_number: string;
  student_profile: string | null;
  student: StudentInfo | null;
  employee_membership: string | null;
  employee: EmployeeInfo | null;
  transaction_date: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StudentInfo {
  id: string;
  personal_number: string;
  full_name: string;
  phone_number: string;
  status: string;
  status_display: string;
  current_class: {
    id: string;
    name: string;
  } | null;
}

export interface EmployeeInfo {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  role: string;
  role_display: string;
  is_active: boolean;
  avatar: string | null;
  avatar_url: string | null;
}
```

### React Component

```tsx
// components/TransactionList.tsx

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';

interface TransactionFilters {
  transaction_type?: string;
  status?: string;
  student_profile?: string;
  employee_membership?: string;
  date_from?: string;
  date_to?: string;
  payment_method?: string;
  search?: string;
}

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({});

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `/api/v1/school/finance/transactions/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'X-Branch-Id': getBranchId(),
          }
        }
      );

      const data = await response.json();
      setTransactions(data.results);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-list">
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Qidirish..."
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        
        <select
          onChange={(e) => setFilters({...filters, transaction_type: e.target.value})}
        >
          <option value="">Barcha turlar</option>
          <option value="payment">To'lov</option>
          <option value="income">Kirim</option>
          <option value="expense">Chiqim</option>
        </select>

        <input
          type="date"
          onChange={(e) => setFilters({...filters, date_from: e.target.value})}
          placeholder="Dan"
        />

        <input
          type="date"
          onChange={(e) => setFilters({...filters, date_to: e.target.value})}
          placeholder="Gacha"
        />
      </div>

      {/* Transactions */}
      {loading ? (
        <div>Yuklanmoqda...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Turi</th>
              <th>Summa</th>
              <th>O'quvchi</th>
              <th>Xodim</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                <td>{transaction.transaction_type_display}</td>
                <td>{transaction.amount.toLocaleString()} so'm</td>
                <td>
                  {transaction.student ? (
                    <div>
                      <div>{transaction.student.full_name}</div>
                      <small>{transaction.student.personal_number}</small>
                    </div>
                  ) : '-'}
                </td>
                <td>
                  {transaction.employee ? (
                    <div className="employee-info">
                      {transaction.employee.avatar && (
                        <img src={transaction.employee.avatar_url} alt="" />
                      )}
                      <div>
                        <div>{transaction.employee.full_name}</div>
                        <small>{transaction.employee.role_display}</small>
                      </div>
                    </div>
                  ) : '-'}
                </td>
                <td>
                  <span className={`status ${transaction.status}`}>
                    {transaction.status_display}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionList;
```

---

## Filter Misollari

### O'quvchi bo'yicha filterlab

```
GET /api/v1/school/finance/transactions/?student_profile=uuid
```

### Xodim bo'yicha filterlash

```
GET /api/v1/school/finance/transactions/?employee_membership=uuid
```

### Sana oralig'i

```
GET /api/v1/school/finance/transactions/?date_from=2025-12-01&date_to=2025-12-31
```

### Kompleks filter

```
GET /api/v1/school/finance/transactions/?transaction_type=payment&status=completed&payment_method=cash&date_from=2025-12-01&ordering=-transaction_date
```

---

## Changelog

### v2.2.0 (2025-12-23)
- To'liq student ma'lumotlari qo'shildi
- To'liq employee ma'lumotlari (avatar bilan)
- Kengaytirilgan filterlar
- Optimizatsiya

### v2.0.0
- Asosiy release
- CRUD operatsiyalari
- Kategoriyalar tizimi
