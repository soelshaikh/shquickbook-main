# Implementation Plan: Payments, Credit Memos, Deposits

## Audit Summary: Invoice Implementation Pattern

Based on audit of `src/pages/Invoices.tsx`, `src/hooks/useInvoices.ts`, `src/stores/invoiceStore.ts`, and related files.

---

## ✅ What Invoice Has (Complete Feature Set)

### 1. **Form Validation (Zod Schemas)**
- **File:** `src/schemas/invoiceSchema.ts`
- **Features:**
  - Zod schema with common schemas (dates, line items, etc.)
  - Cross-field validation (dueDate >= txnDate)
  - Default form values helper
  - Form-to-domain model converter
  - Domain-to-form model converter

### 2. **Data Hooks (TanStack Query)**
- **File:** `src/hooks/useInvoices.ts`
- **Hooks:**
  - `useInvoices(companyId, filters)` - List query
  - `useInvoiceById(id)` - Single item query
  - `useCreateInvoice()` - Create mutation
  - `useUpdateInvoice()` - Update mutation
  - `useDeleteInvoice()` - Delete mutation
- **Features:**
  - 5 min stale time, 10 min gc time
  - Query invalidation on mutations
  - Returns totalCount for warnings

### 3. **State Management (Zustand Store)**
- **File:** `src/stores/invoiceStore.ts`
- **State:**
  - Selection state (selectedIds, focusedId)
  - Filter state (filters object)
  - UI state (isCreating, editingId)
- **Actions:**
  - Selection: select, deselect, toggle, clear, selectMultiple, setFocused
  - Filters: setFilters, clearFilters
  - UI: startCreating, cancelCreating, startEditing, cancelEditing

### 4. **Advanced Filtering**
- **File:** `src/config/filterConfig.ts`
- **Features:**
  - Filter configuration per entity
  - Field definitions (key, label, type, operators, options)
  - Support for text, number, date, select, boolean fields
  - Multiple operators per field type
- **Usage:** `INVOICE_FILTER_CONFIG` with 7 filterable fields

### 5. **Filter Logic**
- **File:** `src/lib/filterUtils.ts`
- **Functions:**
  - `applyFilter(item, filter)` - Apply single filter
  - `applyFilters(data, filters)` - Apply multiple filters (AND logic)
  - `getFilteredCount(data, filters)` - Get count
- **Operators:** equals, notEquals, contains, startsWith, endsWith, greaterThan, lessThan, between, in, notIn, isEmpty, isNotEmpty

### 6. **Search Functionality**
- **Location:** `src/pages/Invoices.tsx` (lines 106-112)
- **Features:**
  - Search across customer, docNumber, memo
  - Case-insensitive
  - Only when filter bar is closed
  - Part of useMemo filtering pipeline

### 7. **Export Functionality**
- **File:** `src/lib/exportConfigs.ts`
- **Features:**
  - Column definitions for CSV export
  - Custom formatters (currency, date)
  - Export filtered data only
  - Toast notification with count
- **Usage:** `invoiceExportColumns` array

### 8. **Page Implementation**
- **File:** `src/pages/Invoices.tsx`
- **Features:**
  - FilterBar with chips (status, email)
  - AdvancedFilter component integration
  - Search input (ref for focus)
  - Export button
  - RenderLimitWarning (1000 items)
  - UndoToast for mutations
  - Keyboard shortcuts (N = new, F = filter, E = export)
  - Performance tracking
  - Error boundary
  - Loading states

### 9. **Filtering Pipeline (useMemo)**
```typescript
1. Start with full dataset
2. Apply filter chips (status, email)
3. Apply search query (if filter bar closed)
4. Apply advanced filters
5. Slice to render limit (1000)
```

---

## 📋 What Needs to Be Implemented

### **For Each Entity: Customer Payments, Vendor Payments, Credit Memos, Deposits**

#### **1. Validation Schemas** ✨ NEW
- `src/schemas/customerPaymentSchema.ts`
- `src/schemas/vendorPaymentSchema.ts`
- `src/schemas/creditMemoSchema.ts`
- `src/schemas/depositSchema.ts`

#### **2. Hooks** ✨ NEW
- `src/hooks/useCustomerPayments.ts`
- `src/hooks/useVendorPayments.ts`
- `src/hooks/useCreditMemos.ts`
- `src/hooks/useDeposits.ts`

#### **3. Stores** ✨ NEW
- `src/stores/customerPaymentStore.ts`
- `src/stores/vendorPaymentStore.ts`
- `src/stores/creditMemoStore.ts`
- `src/stores/depositStore.ts`

#### **4. Filter Configs** ✨ EXTEND
- Add to `src/config/filterConfig.ts`:
  - `CUSTOMER_PAYMENT_FILTER_CONFIG`
  - `VENDOR_PAYMENT_FILTER_CONFIG`
  - `CREDIT_MEMO_FILTER_CONFIG`
  - `DEPOSIT_FILTER_CONFIG`
- Update `getFilterConfig()` to support new types

#### **5. Export Configs** ✨ EXTEND
- Add to `src/lib/exportConfigs.ts`:
  - `customerPaymentExportColumns`
  - `vendorPaymentExportColumns`
  - `creditMemoExportColumns`
  - `depositExportColumns`

#### **6. Page Updates** ✨ UPDATE
- Update existing pages to add:
  - FilterBar with filter chips
  - AdvancedFilter integration
  - Search functionality
  - Export button
  - RenderLimitWarning
  - UndoToast
  - Keyboard shortcuts
  - Complete filtering pipeline

---

## 🎯 Implementation Order (Recommended)

### **Phase 1: Customer Payments** (Priority: High)
1. Create `customerPaymentSchema.ts`
2. Create `useCustomerPayments.ts` hook
3. Create `customerPaymentStore.ts`
4. Add `CUSTOMER_PAYMENT_FILTER_CONFIG`
5. Add `customerPaymentExportColumns`
6. Update `CustomerPayments.tsx` page

### **Phase 2: Vendor Payments** (Priority: High)
1. Create `vendorPaymentSchema.ts`
2. Create `useVendorPayments.ts` hook
3. Create `vendorPaymentStore.ts`
4. Add `VENDOR_PAYMENT_FILTER_CONFIG`
5. Add `vendorPaymentExportColumns`
6. Update `VendorPayments.tsx` page

### **Phase 3: Credit Memos** (Priority: Medium)
1. Create `creditMemoSchema.ts`
2. Create `useCreditMemos.ts` hook
3. Create `creditMemoStore.ts`
4. Add `CREDIT_MEMO_FILTER_CONFIG`
5. Add `creditMemoExportColumns`
6. Update `CreditMemos.tsx` page

### **Phase 4: Deposits** (Priority: Low)
1. Create `depositSchema.ts`
2. Create `useDeposits.ts` hook
3. Create `depositStore.ts`
4. Add `DEPOSIT_FILTER_CONFIG`
5. Add `depositExportColumns`
6. Update `Deposits.tsx` page

---

## 📊 Field Definitions for Each Entity

### **Customer Payments**
**Filterable Fields:**
- `referenceNumber` (text) - Payment reference
- `customerName` (text) - Customer name
- `amount` (number) - Payment amount
- `txnDate` (date) - Payment date
- `paymentMethod` (select) - Check, Wire, ACH, Credit Card, Cash
- `syncStatus` (select) - SYNCED, PENDING_SYNC, FAILED

**Searchable Fields:** customerName, referenceNumber, memo

**Export Columns:** Reference #, Date, Customer, Amount, Method, Status

---

### **Vendor Payments**
**Filterable Fields:**
- `referenceNumber` (text) - Payment reference
- `vendorName` (text) - Vendor name
- `amount` (number) - Payment amount
- `txnDate` (date) - Payment date
- `paymentMethod` (select) - Check, Wire, ACH, Credit Card
- `syncStatus` (select) - SYNCED, PENDING_SYNC, FAILED

**Searchable Fields:** vendorName, referenceNumber, memo

**Export Columns:** Reference #, Date, Vendor, Amount, Method, Status

---

### **Credit Memos**
**Filterable Fields:**
- `customerName` (text) - Customer name
- `totalAmount` (number) - Memo amount
- `txnDate` (date) - Memo date
- `status` (select) - draft, pending, applied, voided
- `invoiceId` (text) - Referenced invoice
- `syncStatus` (select) - SYNCED, PENDING_SYNC, FAILED

**Searchable Fields:** customerName, memo, invoiceId

**Export Columns:** Memo #, Date, Customer, Amount, Status, Sync Status

---

### **Deposits**
**Filterable Fields:**
- `depositToAccountName` (text) - Account name
- `totalAmount` (number) - Deposit amount
- `txnDate` (date) - Deposit date
- `syncStatus` (select) - SYNCED, PENDING_SYNC, FAILED

**Searchable Fields:** depositToAccountName, memo

**Export Columns:** Deposit #, Date, Account, Amount, Items, Status

---

## 🔧 Template Code Structure

### **Schema Template** (`{entity}Schema.ts`)
```typescript
import { z } from 'zod';
import { dateSchema, memoSchema, idSchema } from './commonSchemas';

export const {entity}FormSchema = z.object({
  // Define fields
});

export type {Entity}FormData = z.infer<typeof {entity}FormSchema>;

export const default{Entity}FormValues = (): {Entity}FormData => ({
  // Default values
});

export const {entity}FormDataToDomainModel = (formData, ...args) => {
  // Conversion logic
};

export const domainModelTo{Entity}FormData = (entity) => {
  // Conversion logic
};
```

### **Hook Template** (`use{Entities}.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';

export function use{Entities}(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['{entities}', companyId, filters],
    queryFn: () => dataService.get{Entities}(companyId, filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    ...query,
    data: query.data || [],
    totalCount: query.data?.length ?? 0,
  };
}

export function use{Entity}ById(id: string) { ... }
export function useCreate{Entity}() { ... }
export function useUpdate{Entity}() { ... }
export function useDelete{Entity}() { ... }
```

### **Store Template** (`{entity}Store.ts`)
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface {Entity}Filters {
  // Define filter fields
}

interface {Entity}State {
  selectedIds: Set<string>;
  focusedId: string | null;
  filters: {Entity}Filters;
  isCreating: boolean;
  editingId: string | null;
  
  // Actions
  selectItem: (id: string) => void;
  // ... more actions
}

export const use{Entity}Store = create<{Entity}State>()(
  devtools((set) => ({
    // Implementation
  }), { name: '{Entity}Store' })
);
```

---

## ✅ Acceptance Criteria

For each entity, verify:

- [ ] Zod schema with validation
- [ ] 5 TanStack Query hooks (list, byId, create, update, delete)
- [ ] Zustand store with selection, filters, UI state
- [ ] Filter config with 4-6 filterable fields
- [ ] Export config with 5-7 columns
- [ ] Page with FilterBar, AdvancedFilter, Search, Export
- [ ] RenderLimitWarning at 1000 items
- [ ] Keyboard shortcuts (N, F, E)
- [ ] Search works across key fields
- [ ] Export generates CSV with filtered data
- [ ] Undo toast for mutations

---

## 📈 Estimated Effort

**Per Entity:**
- Schema: 30 min
- Hooks: 20 min
- Store: 30 min
- Filter Config: 20 min
- Export Config: 10 min
- Page Updates: 40 min
**Total per entity:** ~2.5 hours

**All 4 Entities:** ~10 hours

---

## 🚀 Ready to Implement

All patterns are clear from invoice implementation. Let's proceed with Phase 1: Customer Payments!
