# Filter Field Mapping Fix

## Issue Identified

The filter configurations were using **incorrect field names** that didn't match the actual data structure. This caused filters to return 0 results even when data existed.

## Root Cause

The filter configs were designed with assumed field names instead of the actual field names from the data interfaces.

## Fixes Applied

### 1. **Invoice Filter Configuration**

**Before** (Incorrect):
- `invoiceNumber` → ❌ Field doesn't exist
- `customerName` → ❌ Field doesn't exist
- `amount` → ❌ Field doesn't exist
- `issueDate` → ❌ Field doesn't exist
- Missing status values

**After** (Correct):
- `docNumber` → ✅ Matches `Invoice.docNumber`
- `customer` → ✅ Matches `Invoice.customer`
- `total` → ✅ Matches `Invoice.total`
- `balance` → ✅ Added (Matches `Invoice.balance`)
- `txnDate` → ✅ Matches `Invoice.txnDate`
- `dueDate` → ✅ Matches `Invoice.dueDate`
- `status` → ✅ Updated with correct values: draft, sent, viewed, partial, paid, overdue, voided

### 2. **Bill Filter Configuration**

**Before** (Incorrect):
- `billNumber` → ❌ Field doesn't exist
- `amount` → ❌ Field doesn't exist
- `issueDate` → ❌ Field doesn't exist
- Incorrect status values

**After** (Correct):
- `docNumber` → ✅ Matches `Bill.docNumber`
- `vendorName` → ✅ Matches `Bill.vendorName`
- `total` → ✅ Matches `Bill.total`
- `balance` → ✅ Added (Matches `Bill.balance`)
- `txnDate` → ✅ Matches `Bill.txnDate`
- `dueDate` → ✅ Matches `Bill.dueDate`
- `status` → ✅ Updated with correct values: draft, pending, paid, overdue, partial

### 3. **Transaction Filter Configuration**

**Before** (Incorrect):
- `description` → ❌ Field doesn't exist
- `category` → ❌ Field doesn't exist
- Incorrect type values

**After** (Correct):
- `entity` → ✅ Matches `Transaction.entity`
- `memo` → ✅ Matches `Transaction.memo`
- `docNumber` → ✅ Matches `Transaction.docNumber`
- `amount` → ✅ Matches `Transaction.amount`
- `balance` → ✅ Added (Matches `Transaction.balance`)
- `date` → ✅ Matches `Transaction.date`
- `account` → ✅ Matches `Transaction.account`
- `type` → ✅ Updated with correct values: invoice, bill, payment, expense, journal, deposit
- `status` → ✅ Added with values: synced, pending, error, conflict

### 4. **Journal Entry Filter Configuration**

**Before** (Incorrect):
- `entryNumber` → ❌ Field doesn't exist
- `description` → ❌ Field doesn't exist
- `date` → ❌ Field doesn't exist
- Incorrect status value

**After** (Correct):
- `docNumber` → ✅ Matches `JournalEntry.docNumber`
- `memo` → ✅ Matches `JournalEntry.memo`
- `txnDate` → ✅ Matches `JournalEntry.txnDate`
- `totalDebit` → ✅ Matches `JournalEntry.totalDebit`
- `totalCredit` → ✅ Matches `JournalEntry.totalCredit`
- `status` → ✅ Updated with correct values: draft, posted, voided

### 5. **Date Comparison Fix**

**Issue**: Data stores dates as strings (e.g., `"2024-01-15"`), but filter comparisons were expecting Date objects.

**Solution**: Added `toComparableDate()` helper function in `filterUtils.ts`:
- Converts both date strings and Date objects to timestamps
- Handles date comparisons correctly for all operators
- Supports "equals" comparison ignoring time (same day)

**Operators Fixed**:
- `equals` - Compares same day (ignoring time)
- `notEquals` - Compares different days
- `greaterThan`, `greaterThanOrEqual` - Timestamp comparison
- `lessThan`, `lessThanOrEqual` - Timestamp comparison
- `between` - Range comparison with timestamps

## Data Interface Reference

### Invoice Interface
```typescript
interface Invoice {
  docNumber: string;      // "INV-01000"
  customer: string;       // "Acme Corporation"
  total: number;          // 5123.45
  balance: number;        // 2500.00
  txnDate: string;        // "2024-01-15"
  dueDate: string;        // "2024-02-14"
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'voided';
}
```

### Bill Interface
```typescript
interface Bill {
  docNumber: string;      // "BILL-00001"
  vendorName: string;     // "Office Depot"
  total: number;          // 342.67
  balance: number;        // 342.67
  txnDate: string;        // "2024-01-15"
  dueDate: string;        // "2024-02-14"
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'partial';
}
```

### Transaction Interface
```typescript
interface Transaction {
  entity: string;         // "Acme Corp"
  memo: string;           // "Monthly retainer"
  docNumber: string;      // "I-01234"
  amount: number;         // 1500.00
  balance: number;        // 125000.00
  date: string;           // "2024-01-15"
  account: string;        // "Checking ••4521"
  type: 'invoice' | 'bill' | 'payment' | 'expense' | 'journal' | 'deposit';
  status: 'synced' | 'pending' | 'error' | 'conflict';
}
```

### JournalEntry Interface
```typescript
interface JournalEntry {
  docNumber: string;      // "JE-00001"
  memo: string;           // "Adjusting entry"
  txnDate: string;        // "2024-01-15"
  totalDebit: number;     // 5000.00
  totalCredit: number;    // 5000.00
  status: 'draft' | 'posted' | 'voided';
}
```

## Files Modified

1. `src/config/filterConfig.ts`
   - Fixed all 4 entity filter configurations
   - Updated field keys to match actual data
   - Updated select options to match enum values
   - Added missing fields (balance, status)

2. `src/lib/filterUtils.ts`
   - Added `toComparableDate()` helper
   - Updated all date comparison operators
   - Fixed "equals" to compare same day
   - Fixed "between" for date ranges

## Testing

### Verification Steps
1. ✅ TypeScript compilation passes
2. ✅ All field names match data interfaces
3. ✅ All status/type options match enum values
4. ✅ Date comparisons handle string dates

### Expected Behavior Now

**Invoice Filter Example**:
```
Filter: "Invoice Number" equals "INV-01898"
Before: 0 results (field name mismatch)
After: 1 result (correctly matches docNumber field)
```

**Date Filter Example**:
```
Filter: "Transaction Date" equals "Jan 16, 2025"
Before: 0 results (Date object vs string mismatch)
After: All transactions from that day (correct string date comparison)
```

**Status Filter Example**:
```
Filter: "Status" equals "sent"
Before: 0 results (status value "sent" not in options)
After: All sent invoices (status value now included)
```

## Impact

### What's Fixed
- ✅ Filters now return correct results
- ✅ All field names match actual data
- ✅ Date filtering works correctly
- ✅ Status/Type filters show correct options
- ✅ Number filtering works (total, balance)

### What Remains Unchanged
- ✅ Component code unchanged
- ✅ UI/UX unchanged
- ✅ Integration code unchanged
- ✅ All existing functionality preserved

## Summary

The filter system is now **fully functional**. The issue was simply field name mismatches between the filter configuration and the actual data interfaces. All configurations have been corrected to use the proper field names, and date handling has been enhanced to support both string dates and Date objects.

**Status**: ✅ **RESOLVED**
