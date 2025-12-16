# Remaining Pages - Filter Fix Needed

## ✅ Already Fixed
- Hooks: `useInvoices`, `useBills`, `useTransactions`, `useJournalEntries` - Return full dataset
- Page: `Invoices.tsx` - Filters all data, then slices to 1k for display

## ⏳ Need Same Fix

### Bills.tsx
### Transactions.tsx  
### Journal Entries.tsx

## Required Changes for Each Page

### Step 1: Add `displayData` variable
After the `filteredXXX` useMemo, add:

```typescript
const displayBills = useMemo(() => {
  const MAX_RENDER_LIMIT = 1000;
  return filteredBills.slice(0, MAX_RENDER_LIMIT);
}, [filteredBills]);
```

### Step 2: Update render calls
Change list component from:
```typescript
<BillList bills={filteredBills} />
```
To:
```typescript
<BillList bills={displayBills} />
```

### Step 3: Update empty state check
Change from:
```typescript
filteredBills.length === 0
```
To:
```typescript
displayBills.length === 0
```

### Step 4: Update filter summary
Keep `filteredBills.length` for counts, but show warning if exceeds 1k:

```typescript
{advancedFilters.length > 0 && (
  <div>
    Showing <strong>{displayBills.length}</strong> of <strong>{filteredBills.length}</strong> filtered bills
    {filteredBills.length > displayBills.length && (
      <span className="text-amber-600 font-medium">
        - Displaying first 1,000 results, refine filters to see more
      </span>
    )}
  </div>
)}
```

## Why This Matters

**Without this fix:**
- Filters only search first 1,000 records
- Records at position 1,001+ are never found
- Users get 0 results for valid queries

**With this fix:**
- Filters search ALL records (e.g., all 11,000 bills)
- Finds records at any position
- Displays first 1,000 of matching results
- Users see accurate results

## Current Status

✅ **Invoices**: FIXED - Searches all 12,000, displays max 1,000  
⏳ **Bills**: Needs fix - Currently searches only first 1,000  
⏳ **Transactions**: Needs fix - Currently searches only first 1,000  
⏳ **Journal Entries**: Needs fix - Currently searches only first 1,000  

## Testing

After applying fixes, test each page:
1. Create a filter that should match records beyond position 1,000
2. Verify the filter finds those records
3. Verify max 1,000 are displayed
4. Verify warning shows if results exceed 1,000
