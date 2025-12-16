# AdvancedFilter Usage Example

## Minimal Integration Example (Transactions Page)

This example shows how to integrate AdvancedFilter into an existing page **without refactoring**.

### Step 1: Add Imports

```tsx
import { useState, useMemo } from 'react';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { TRANSACTION_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';
import { applyFilters } from '@/lib/filterUtils';
```

### Step 2: Add Filter State

```tsx
export function Transactions() {
  // Existing hooks
  const { transactions, loading, error } = useTransactions();
  
  // NEW: Add filter state
  const [filters, setFilters] = useState<Filter[]>([]);
  
  // ... rest of component
}
```

### Step 3: Apply Filters to Data

```tsx
// Apply filters to data (memoized for performance)
const filteredTransactions = useMemo(() => {
  return applyFilters(transactions, filters);
}, [transactions, filters]);

// Use filteredTransactions instead of transactions for rendering
const displayTransactions = filteredTransactions;
```

### Step 4: Add Component to UI

```tsx
return (
  <div className="space-y-4">
    {/* Existing page header */}
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Transactions</h1>
    </div>

    {/* NEW: Add AdvancedFilter */}
    <div className="flex items-center gap-4">
      <AdvancedFilter
        filters={filters}
        config={TRANSACTION_FILTER_CONFIG}
        onChange={setFilters}
        triggerLabel="Add Filter"
        shortcutHint="⌘K"
      />
      
      {/* Optional: Show filtered count */}
      {filters.length > 0 && (
        <span className="text-sm text-muted-foreground">
          Showing {displayTransactions.length} of {transactions.length} transactions
        </span>
      )}
    </div>

    {/* Existing transaction list - use displayTransactions */}
    <TransactionList transactions={displayTransactions} />
  </div>
);
```

### Complete Example

```tsx
import { useState, useMemo } from 'react';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { TRANSACTION_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';
import { applyFilters } from '@/lib/filterUtils';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionList } from '@/components/transactions/TransactionList';

export function Transactions() {
  // Existing hooks
  const { transactions, loading, error } = useTransactions();
  
  // NEW: Filter state
  const [filters, setFilters] = useState<Filter[]>([]);
  
  // NEW: Apply filters
  const filteredTransactions = useMemo(() => {
    return applyFilters(transactions, filters);
  }, [transactions, filters]);
  
  if (loading) return <LoadingFallback />;
  if (error) return <ErrorFallback error={error} />;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>

      {/* NEW: Advanced Filter */}
      <div className="flex items-center gap-4">
        <AdvancedFilter
          filters={filters}
          config={TRANSACTION_FILTER_CONFIG}
          onChange={setFilters}
          triggerLabel="Add Filter"
        />
        
        {filters.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length}
          </span>
        )}
      </div>

      {/* Transaction list with filtered data */}
      <TransactionList transactions={filteredTransactions} />
    </div>
  );
}
```

## Other Entity Examples

### Invoices Page

```tsx
import { INVOICE_FILTER_CONFIG } from '@/config/filterConfig';

export function Invoices() {
  const { invoices } = useInvoices();
  const [filters, setFilters] = useState<Filter[]>([]);
  
  const filteredInvoices = useMemo(() => {
    return applyFilters(invoices, filters);
  }, [invoices, filters]);

  return (
    <>
      <AdvancedFilter
        filters={filters}
        config={INVOICE_FILTER_CONFIG}
        onChange={setFilters}
      />
      <InvoiceList invoices={filteredInvoices} />
    </>
  );
}
```

### Bills Page

```tsx
import { BILL_FILTER_CONFIG } from '@/config/filterConfig';

export function Bills() {
  const { bills } = useBills();
  const [filters, setFilters] = useState<Filter[]>([]);
  
  const filteredBills = useMemo(() => {
    return applyFilters(bills, filters);
  }, [bills, filters]);

  return (
    <>
      <AdvancedFilter
        filters={filters}
        config={BILL_FILTER_CONFIG}
        onChange={setFilters}
      />
      <BillList bills={filteredBills} />
    </>
  );
}
```

### Journal Entries Page

```tsx
import { JOURNAL_ENTRY_FILTER_CONFIG } from '@/config/filterConfig';

export function JournalEntries() {
  const { journalEntries } = useJournalEntries();
  const [filters, setFilters] = useState<Filter[]>([]);
  
  const filteredEntries = useMemo(() => {
    return applyFilters(journalEntries, filters);
  }, [journalEntries, filters]);

  return (
    <>
      <AdvancedFilter
        filters={filters}
        config={JOURNAL_ENTRY_FILTER_CONFIG}
        onChange={setFilters}
      />
      <JournalEntryList entries={filteredEntries} />
    </>
  );
}
```

## Integration Checklist

When adding AdvancedFilter to a page:

- [ ] Import `Filter` type from `@/types/filter`
- [ ] Import `AdvancedFilter` component from `@/components/shared/AdvancedFilter`
- [ ] Import entity config from `@/config/filterConfig`
- [ ] Import `applyFilters` from `@/lib/filterUtils`
- [ ] Add filter state: `useState<Filter[]>([])`
- [ ] Apply filters with `useMemo`
- [ ] Add component to page toolbar/header
- [ ] Use filtered data in list component

## Future Backend Integration

When backend filtering is ready, the integration becomes even simpler:

### Before (Client-side)
```tsx
const { transactions } = useTransactions();
const [filters, setFilters] = useState<Filter[]>([]);
const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);
```

### After (Backend)
```tsx
const [filters, setFilters] = useState<Filter[]>([]);
const { transactions } = useTransactions({ filters }); // Backend applies filters
// No applyFilters needed!
```

**Component code stays the same!** Only the data fetching logic changes.

## Common Patterns

### Filter with Pagination

```tsx
const [filters, setFilters] = useState<Filter[]>([]);
const [page, setPage] = useState(1);

const filtered = useMemo(() => {
  return applyFilters(transactions, filters);
}, [transactions, filters]);

const paginated = useMemo(() => {
  const start = (page - 1) * PAGE_SIZE;
  return filtered.slice(start, start + PAGE_SIZE);
}, [filtered, page]);

return (
  <>
    <AdvancedFilter filters={filters} config={config} onChange={setFilters} />
    <TransactionList transactions={paginated} />
    <Pagination page={page} total={filtered.length} onChange={setPage} />
  </>
);
```

### Filter with Search

```tsx
const [filters, setFilters] = useState<Filter[]>([]);
const [search, setSearch] = useState('');

const filtered = useMemo(() => {
  let result = applyFilters(transactions, filters);
  
  if (search) {
    result = result.filter(t => 
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  return result;
}, [transactions, filters, search]);

return (
  <>
    <SearchInput value={search} onChange={setSearch} />
    <AdvancedFilter filters={filters} config={config} onChange={setFilters} />
    <TransactionList transactions={filtered} />
  </>
);
```

### Filter with Sort

```tsx
const [filters, setFilters] = useState<Filter[]>([]);
const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

const processed = useMemo(() => {
  const filtered = applyFilters(transactions, filters);
  return filtered.sort((a, b) => {
    if (sortBy === 'date') return b.date.getTime() - a.date.getTime();
    return b.amount - a.amount;
  });
}, [transactions, filters, sortBy]);

return (
  <>
    <div className="flex gap-4">
      <AdvancedFilter filters={filters} config={config} onChange={setFilters} />
      <SortSelect value={sortBy} onChange={setSortBy} />
    </div>
    <TransactionList transactions={processed} />
  </>
);
```

## Performance Tips

1. **Always use `useMemo`** for filter application to avoid re-filtering on every render
2. **Apply filters before pagination** to ensure correct page counts
3. **Combine multiple filters** with AND logic for more precise results
4. **Clear filters** when navigating away to reset state

## Accessibility Notes

- Filter button has keyboard shortcut hint (optional)
- All filter badges are removable via keyboard
- Filter builder has full keyboard navigation
- Screen readers announce filter additions/removals
- Focus management handles step transitions

## Testing Integration

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Transactions } from './Transactions';

test('filters transactions by amount', () => {
  render(<Transactions />);
  
  // Open filter builder
  fireEvent.click(screen.getByText('Add Filter'));
  
  // Select field
  fireEvent.click(screen.getByText('Amount'));
  
  // Select operator
  fireEvent.click(screen.getByText('greater than'));
  
  // Enter value
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1000' } });
  
  // Submit filter
  fireEvent.click(screen.getByText('Add Filter'));
  
  // Verify filtered results
  const transactions = screen.getAllByRole('row');
  transactions.forEach(row => {
    expect(parseAmount(row)).toBeGreaterThan(1000);
  });
});
```

---

This example demonstrates the minimal changes needed to add filtering to existing pages without refactoring.
