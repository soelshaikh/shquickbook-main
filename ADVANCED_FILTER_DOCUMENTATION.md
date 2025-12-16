# AdvancedFilter Component Documentation

## Overview

A production-ready, reusable advanced filter component for entity lists in the accounting application. Built with keyboard-first navigation, accessibility, and entity-agnostic design.

## Architecture

### Component Responsibility
- **AdvancedFilter**: UI + state machine only
- **Filtering Logic**: Lives in hooks/pages (not in component)
- **Data Access**: Never touches stores, IndexedDB, or API

### Data Flow
```
User Input → AdvancedFilter → Normalized Filter Object → Parent Component → Apply to Data
```

## Key Features

✅ **Progressive Disclosure**: Field → Operator → Value flow  
✅ **Keyboard-First**: Arrow keys, Enter, Escape navigation  
✅ **Accessible**: ARIA labels, focus management, screen reader support  
✅ **Entity-Agnostic**: Configured via `FilterConfig`, no entity logic inside  
✅ **Type-Safe**: Full TypeScript support  
✅ **Design System**: Uses shadcn/ui components only  
✅ **Backend-Ready**: Filter schema can be sent to API without changes  

## File Structure

```
src/
├── types/
│   └── filter.ts                 # Type definitions
├── config/
│   └── filterConfig.ts           # Entity filter configurations
├── components/shared/
│   └── AdvancedFilter.tsx        # Main component
└── lib/
    └── filterUtils.ts            # Client-side filter application helpers
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { TRANSACTION_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';

function TransactionsPage() {
  const [filters, setFilters] = useState<Filter[]>([]);
  
  return (
    <AdvancedFilter
      filters={filters}
      config={TRANSACTION_FILTER_CONFIG}
      onChange={setFilters}
    />
  );
}
```

### With Client-Side Filtering

```tsx
import { useMemo } from 'react';
import { applyFilters } from '@/lib/filterUtils';

function TransactionsPage() {
  const { transactions } = useTransactions();
  const [filters, setFilters] = useState<Filter[]>([]);
  
  const filteredData = useMemo(() => {
    return applyFilters(transactions, filters);
  }, [transactions, filters]);
  
  return (
    <>
      <AdvancedFilter
        filters={filters}
        config={TRANSACTION_FILTER_CONFIG}
        onChange={setFilters}
      />
      <TransactionList transactions={filteredData} />
    </>
  );
}
```

### With Backend Filtering (Future)

```tsx
function TransactionsPage() {
  const [filters, setFilters] = useState<Filter[]>([]);
  
  // Backend hook receives filters and applies them server-side
  const { transactions } = useTransactions({ filters });
  
  return (
    <>
      <AdvancedFilter
        filters={filters}
        config={TRANSACTION_FILTER_CONFIG}
        onChange={setFilters}
      />
      <TransactionList transactions={transactions} />
    </>
  );
}
```

## Configuration

### Adding a New Entity

1. **Define Filter Config** in `src/config/filterConfig.ts`:

```tsx
export const MY_ENTITY_FILTER_CONFIG: FilterConfig = {
  entity: 'MyEntity',
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter name...',
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ],
};
```

2. **Use in Component**:

```tsx
<AdvancedFilter
  filters={filters}
  config={MY_ENTITY_FILTER_CONFIG}
  onChange={setFilters}
/>
```

### Field Types

| Type | Input Component | Operators | Example |
|------|----------------|-----------|---------|
| `text` | Text input | equals, contains, startsWith, etc. | Description, Name |
| `number` | Number input | equals, greaterThan, between, etc. | Amount, Quantity |
| `date` | Date picker | equals, greaterThan, between, etc. | Issue Date, Due Date |
| `select` | Dropdown | equals, in, notIn | Status, Category |
| `boolean` | (Future) | equals | Is Active |

### Operator Types

| Operator | Label | Requires Value | Example |
|----------|-------|----------------|---------|
| `equals` | equals | ✅ | Amount equals 100 |
| `notEquals` | does not equal | ✅ | Status not equals "draft" |
| `contains` | contains | ✅ | Description contains "invoice" |
| `notContains` | does not contain | ✅ | Name not contains "test" |
| `startsWith` | starts with | ✅ | Invoice number starts with "INV" |
| `endsWith` | ends with | ✅ | Email ends with "@example.com" |
| `greaterThan` | greater than | ✅ | Amount > 1000 |
| `greaterThanOrEqual` | greater than or equal to | ✅ | Amount >= 1000 |
| `lessThan` | less than | ✅ | Amount < 1000 |
| `lessThanOrEqual` | less than or equal to | ✅ | Amount <= 1000 |
| `between` | between | ✅ (2 values) | Date between Jan 1 - Dec 31 |
| `in` | is one of | ✅ (array) | Status in ["paid", "sent"] |
| `notIn` | is not one of | ✅ (array) | Category not in ["test"] |
| `isEmpty` | is empty | ❌ | Description is empty |
| `isNotEmpty` | is not empty | ❌ | Email is not empty |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Arrow Up/Down` | Navigate suggestions |
| `Enter` | Select item / Submit |
| `Escape` | Close popover / Cancel |
| `Tab` | Navigate between inputs |

## API

### AdvancedFilter Props

```tsx
interface AdvancedFilterProps {
  /** Current active filters */
  filters: Filter[];
  
  /** Filter configuration for the entity */
  config: FilterConfig;
  
  /** Called when filters change */
  onChange: (filters: Filter[]) => void;
  
  /** Optional trigger button label (default: "Add Filter") */
  triggerLabel?: string;
  
  /** Optional keyboard shortcut hint to display */
  shortcutHint?: string;
}
```

### Filter Object

```tsx
interface Filter {
  /** Field key being filtered */
  field: string;
  
  /** Operator applied to the field */
  operator: FilterOperator;
  
  /** Filter value(s) */
  value: string | number | boolean | Date | [Date, Date] | Array<string | number>;
}
```

### FilterConfig

```tsx
interface FilterConfig {
  /** Entity name (for display) */
  entity: string;
  
  /** Available filterable fields */
  fields: FilterField[];
}

interface FilterField {
  /** Unique field identifier */
  key: string;
  
  /** Human-readable label */
  label: string;
  
  /** Data type of the field */
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  
  /** Available operators for this field */
  operators: FilterOperator[];
  
  /** For 'select' type: available options */
  options?: Array<{ label: string; value: string | number }>;
  
  /** Optional placeholder for value input */
  placeholder?: string;
}
```

## Helper Functions

### applyFilter
Applies a single filter to a data item.

```tsx
function applyFilter<T>(item: T, filter: Filter): boolean
```

### applyFilters
Applies multiple filters to a dataset (AND logic).

```tsx
function applyFilters<T>(data: T[], filters: Filter[]): T[]
```

### getFilteredCount
Returns count of items matching filters.

```tsx
function getFilteredCount<T>(data: T[], filters: Filter[]): number
```

## Alignment with Requirements

### ✅ Frontend Requirements Compliance

| Requirement | Implementation |
|-------------|----------------|
| Keyboard-first UX | Arrow keys, Enter, Escape navigation |
| Accessible | ARIA labels, focus management, screen readers |
| Design System | Uses shadcn/ui components only |
| Type-Safe | Full TypeScript with strict types |
| Performance | No data filtering in component, memo-friendly |
| Client-side filtering | Works with 1k render cap |
| Entity-agnostic | Config-driven, no entity conditionals |

### ✅ Architecture Compliance

| Rule | Implementation |
|------|----------------|
| Component is stateless (data) | ✅ No data access, only UI state |
| No IndexedDB access | ✅ Component never touches storage |
| No store access | ✅ Component never imports stores |
| No data fetching | ✅ Component receives props only |
| Emits normalized objects | ✅ Filter schema is standardized |

### ✅ Safe Without Backend

The component works entirely client-side because:
1. **No data dependencies**: Component only manages UI state
2. **Filter application is separate**: `applyFilters` helper is explicit
3. **Performance-conscious**: Only filters displayed data (1k cap)
4. **Explicit control**: Parent decides when/how to apply filters

### ✅ Backend Integration Path

When backend filtering is ready:

```tsx
// BEFORE (Client-side)
const { transactions } = useTransactions();
const filtered = applyFilters(transactions, filters);

// AFTER (Backend)
const { transactions } = useTransactions({ filters });
// Backend receives Filter[] and applies server-side
```

**No component changes needed!** The Filter schema is already backend-ready:

```json
{
  "field": "amount",
  "operator": "greaterThan",
  "value": 1000
}
```

Backend can serialize this to:
- Query params: `?field=amount&op=gt&value=1000`
- GraphQL: `{ transactions(where: { amount: { gt: 1000 } }) }`
- SQL: `WHERE amount > 1000`

## Superhuman UX Pattern Analysis

### ✅ Adopted Patterns
- **Keyboard-first navigation**: Core interaction model
- **Progressive disclosure**: Field → Operator → Value flow
- **Visual feedback**: Active states, hover effects
- **Quick access**: Keyboard shortcut support
- **Inline editing**: Popover-based interface

### ❌ Not Adopted (Not Required)
- **Email-specific filters**: Entity-agnostic approach instead
- **Smart content suggestions**: Not in requirements
- **Natural language parsing**: Out of scope
- **Saved filter presets**: Not in requirements (can add later)

### 🔄 Adapted Patterns
- **Filter suggestions** → Entity field suggestions
- **Context-aware operators** → Type-based operator sets
- **Value inputs** → Type-aware components (text, number, date, select)

## Performance Considerations

### ✅ Optimizations Included
- Component doesn't filter data (avoids re-renders)
- Small suggestion lists (fields/operators only, not data)
- Memoized filtered results in parent (via useMemo)
- No inline styles or custom CSS

### ✅ Works with Constraints
- **1k render cap**: Filters before rendering, not after
- **Virtualized lists**: Compatible (filters data, not UI)
- **Client-side only**: Safe with current architecture
- **Backend ready**: Drop-in replacement when available

## Testing Strategy

### Component Tests
```tsx
// Test filter building flow
- Field selection
- Operator selection
- Value input
- Filter completion
- Filter removal
```

### Integration Tests
```tsx
// Test with real data
- Apply filters to mock data
- Verify filtered results
- Test multiple filters (AND logic)
- Test edge cases (empty, null values)
```

### Accessibility Tests
```tsx
// Test keyboard navigation
- Tab order
- Arrow key navigation
- Enter/Escape behavior
- Screen reader announcements
```

## Future Enhancements

### Potential Additions (Not in Current Scope)
- [ ] OR logic between filters
- [ ] Filter groups (nested conditions)
- [ ] Saved filter presets
- [ ] Natural language date parsing
- [ ] Filter templates
- [ ] Export/import filters

### Backend Integration Checklist
- [ ] API endpoint accepts Filter[] schema
- [ ] Backend validates filter operators per field type
- [ ] Backend handles all operator types
- [ ] Backend handles date range queries
- [ ] Backend returns filtered + paginated results
- [ ] Error handling for invalid filters

## Troubleshooting

### Filters not applying?
- Check that `onChange` is called correctly
- Verify parent uses `applyFilters` helper
- Ensure data structure matches filter field keys

### Date filters not working?
- Verify dates are Date objects, not strings
- Check date comparison logic in `applyFilter`
- Ensure date fields in data are parsed correctly

### Select filters showing wrong options?
- Check `options` array in FilterField config
- Verify option values match data field values
- Ensure value types match (string vs number)

## Support

For questions or issues:
1. Check this documentation
2. Review existing entity configs in `src/config/filterConfig.ts`
3. See example usage in `EXAMPLE_USAGE_Transactions.tsx`
4. Consult `FRONTEND_MASTER_REQUIREMENTS.md` for architecture decisions
