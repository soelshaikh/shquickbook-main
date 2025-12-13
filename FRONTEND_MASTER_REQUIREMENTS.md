# Frontend Master Requirements
## Superhuman for QuickBooks - Frontend Developer Guide

**Version:** 1.0  
**Last Updated:** December 2024  
**Role:** Frontend Developer (React + Vite)  

---

## Table of Contents

1. [Role & Scope](#role--scope)
2. [Core Frontend Goals](#core-frontend-goals)
3. [Tech Stack & Architecture](#tech-stack--architecture)
4. [State Management Strategy](#state-management-strategy)
5. [Data Flow & Caching](#data-flow--caching)
6. [Performance Guidelines](#performance-guidelines)
7. [Keyboard Navigation & Accessibility](#keyboard-navigation--accessibility)
8. [Backend API Contracts](#backend-api-contracts)
9. [Component Architecture](#component-architecture)
10. [Development Workflow](#development-workflow)
11. [Open Questions (Frontend)](#open-questions-frontend)

---

## Role & Scope

### Your Responsibilities
- ✅ Build all React components and UI logic
- ✅ Implement local-first data layer (memory cache + IndexedDB)
- ✅ Handle optimistic updates and undo functionality
- ✅ Implement keyboard shortcuts and command palette
- ✅ Create responsive, accessible UI components
- ✅ Write frontend unit tests and E2E tests
- ✅ Optimize for <20ms UI response time

### NOT Your Responsibilities
- ❌ Backend API implementation (handled by backend team)
- ❌ Database schema design (Prisma migrations)
- ❌ OAuth token management (backend only)
- ❌ QuickBooks API integration
- ❌ WebSocket server implementation
- ❌ Background job queue (Bull/Redis)

### Important AI Instructions
🚨 **When working with AI assistants:**
- Focus ONLY on frontend concerns
- Do NOT write backend code or assume backend implementation details
- Define backend contracts as TypeScript interfaces only
- Ask questions if frontend assumptions are required
- Backend APIs may change - use interfaces to isolate changes

---

## Core Frontend Goals

### 1. Performance Targets
| Metric | Target | Maximum | Priority |
|--------|--------|---------|----------|
| UI keypress response | <10ms | 20ms | 🔴 Critical |
| Button click feedback | <10ms | 20ms | 🔴 Critical |
| Command palette open (⌘K) | <30ms | 50ms | 🔴 Critical |
| Memory cache read | <5ms | 10ms | 🔴 Critical |
| IndexedDB read | <15ms | 30ms | 🟡 High |
| Search 10K records | <50ms | 100ms | 🟡 High |
| Initial page load (FCP) | <1.5s | 2s | 🟡 High |

### 2. User Experience Principles
- **Keyboard-first:** Every action accessible via keyboard
- **Instant feedback:** No loading spinners for cached data
- **Optimistic updates:** Show changes immediately, sync in background
- **Forgiving:** 3-second undo window for destructive actions
- **Discoverable:** ? key shows all keyboard shortcuts

### 3. Accessibility Requirements (WCAG 2.1 AA)
- ✅ Full keyboard operability (no mouse required)
- ✅ Logical tab order (sequential navigation)
- ✅ Focus indicators visible at all times
- ✅ ARIA labels for screen readers (only where semantic HTML insufficient)
- ✅ Color contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text
- ✅ Supports browser zoom up to 200%

### 4. Offline-First Behavior
- ✅ App works without network (read-only)
- ✅ Writes queued in IndexedDB when offline
- ✅ Auto-sync when connection restored
- ✅ Clear offline indicator in UI
- ✅ No data loss during network interruptions

---

## Tech Stack & Architecture

### Core Technologies
```json
{
  "framework": "React 18.2+",
  "buildTool": "Vite 5.0+",
  "language": "TypeScript 5.0+ (strict mode)",
  "styling": "Tailwind CSS 3.4+",
  "uiComponents": "shadcn/ui (customizable)",
  "routing": "React Router 6+",
  "stateManagement": "Zustand 4.4+",
  "serverState": "TanStack Query (React Query) 5.0+",
  "localStorage": "Dexie.js 3.2+ (IndexedDB)",
  "websocket": "Socket.io-client 4.6+",
  "forms": "React Hook Form 7.48+",
  "validation": "Zod 3.22+",
  "dateHandling": "date-fns 3.0+",
  "testing": "Vitest + Testing Library + Playwright"
}
```

### Folder Structure (Feature-Based)
```
src/
├── features/              # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── invoices/
│   │   ├── components/
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   └── InvoiceRow.tsx
│   │   ├── hooks/
│   │   │   ├── useInvoices.ts
│   │   │   ├── useInvoiceForm.ts
│   │   │   └── useInvoiceActions.ts
│   │   ├── services/
│   │   │   └── invoiceService.ts
│   │   └── types.ts
│   ├── transactions/
│   ├── bills/
│   ├── journal-entries/
│   └── command-palette/
├── shared/                # Shared utilities
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/
│   │   └── common/
│   ├── hooks/            # Reusable hooks
│   ├── services/         # Core services
│   │   ├── dataService.ts      # 3-tier cache
│   │   ├── cacheManager.ts     # Memory cache
│   │   ├── indexedDB.ts        # Dexie setup
│   │   ├── apiClient.ts        # HTTP client
│   │   └── websocketClient.ts  # WebSocket client
│   ├── stores/           # Zustand stores
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Utility functions
├── pages/                # Route components
├── styles/               # Global styles
└── App.tsx
```

### Architecture Layers

**Layer 1: UI Components**
- Pure presentational components
- Receive data via props
- Emit events via callbacks
- No direct API calls or business logic

**Layer 2: Feature Hooks**
- Encapsulate component logic
- Use React Query for server state
- Use Zustand for global UI state
- Handle optimistic updates

**Layer 3: Services**
- DataService: 3-tier cache (memory → IndexedDB → API)
- CacheManager: LRU memory cache
- API Client: HTTP requests with retry logic
- WebSocket Client: Real-time updates

**Layer 4: Data Storage**
- Memory cache: Hot data (<5ms access)
- IndexedDB: Persistent cache (<30ms access)
- Backend API: Source of truth (200-500ms)

---

## State Management Strategy

### 1. Local UI State (React State)
**Use for:** Component-specific state that doesn't need to be shared

```typescript
// Example: Form field state, modal open/close, accordion expand/collapse
const [isOpen, setIsOpen] = useState(false)
const [searchQuery, setSearchQuery] = useState('')
```

### 2. Global UI State (Zustand)
**Use for:** App-wide UI state that needs to be shared across components

```typescript
// Example: Theme, sidebar open/close, selected company
// stores/uiStore.ts
import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  selectedCompanyId: string | null
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  setSelectedCompany: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  selectedCompanyId: null,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSelectedCompany: (id) => set({ selectedCompanyId: id }),
}))
```

### 3. Server State (React Query)
**Use for:** Data fetched from backend, cached with automatic invalidation

```typescript
// Example: Invoices, transactions, customers
// hooks/useInvoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataService } from '@/shared/services/dataService'

export function useInvoices(companyId: string, filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', companyId, filters],
    queryFn: () => dataService.getInvoices(companyId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => dataService.createInvoice(data),
    onMutate: async (newInvoice) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['invoices'] })
      const previousInvoices = queryClient.getQueryData(['invoices'])
      
      queryClient.setQueryData(['invoices'], (old: Invoice[]) => [
        ...old,
        { ...newInvoice, id: 'temp-' + Date.now(), status: 'PENDING_SYNC' }
      ])
      
      return { previousInvoices }
    },
    onError: (err, newInvoice, context) => {
      // Rollback on error
      queryClient.setQueryData(['invoices'], context?.previousInvoices)
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
```

### 4. Form State (React Hook Form + Zod)
**Use for:** Form inputs with validation

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  txnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  lines: z.array(z.object({
    accountId: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1, 'At least one line item required'),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

export function useInvoiceForm(defaultValues?: Partial<InvoiceFormData>) {
  return useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      txnDate: new Date().toISOString().split('T')[0],
      lines: [{ accountId: '', description: '', quantity: 1, unitPrice: 0 }],
      ...defaultValues,
    },
  })
}
```

### State Management Decision Matrix

| State Type | Storage | Example | Tool |
|------------|---------|---------|------|
| Ephemeral UI | Component | Modal open/close | `useState` |
| Shared UI | Global | Theme, sidebar state | Zustand |
| Server data | Cached | Invoices, customers | React Query |
| Form inputs | Component | Invoice form fields | React Hook Form |
| Optimistic writes | Temporary | Pending invoice creation | React Query mutations |

---

## Data Flow & Caching

### 3-Tier Cache Architecture

**Priority Order:**
1. **Memory Cache** → 0-5ms (instant)
2. **IndexedDB** → 10-30ms (fast)
3. **Backend API** → 200-500ms (slower, but authoritative)

**Cache Hit Rate Target:** >80%

### Read Flow Diagram

```
User Action (e.g., view invoices)
    ↓
DataService.getInvoices()
    ↓
Check Memory Cache
    ↓
  HIT? ──Yes──> Return (0-5ms) ✅ INSTANT
    │
    No
    ↓
Check IndexedDB
    ↓
  HIT? ──Yes──> Return (10-30ms) ✅ FAST
    │           │
    │           └──> Update Memory Cache
    │
    No
    ↓
Fetch from Backend API
    ↓
Return (200-500ms) ⚠️ SLOWER
    │
    ├──> Update Memory Cache
    └──> Update IndexedDB
```

### Write Flow (Optimistic Updates)

```
User Action (e.g., create invoice)
    ↓
Update Memory Cache + IndexedDB IMMEDIATELY
    ↓
Show invoice in UI (feels instant!) ✅
    ↓
Show Undo Toast (3 seconds)
    ↓
User cancels? ──Yes──> Rollback (delete from caches)
    │                       ↓
    No                     Done
    ↓
POST to Backend API (async, don't block UI)
    ↓
Backend handles QuickBooks sync
    ↓
WebSocket pushes confirmation
    ↓
Replace temp ID with confirmed ID in caches
    ↓
Update sync status: PENDING_SYNC → SYNCED
```

### Key Implementation Files

**1. DataService (services/dataService.ts)**
- Main entry point for all data operations
- Implements 3-tier cache logic
- Handles optimistic updates
- Processes WebSocket events

**2. CacheManager (services/cacheManager.ts)**
- In-memory LRU cache
- Max size: 1000 entries
- TTL: 10 minutes
- Pattern-based invalidation

**3. IndexedDB (services/indexedDB.ts)**
- Dexie.js wrapper
- Compound indexes for efficient queries
- Stores all synced entities

**4. API Client (services/apiClient.ts)**
- Axios wrapper with retry logic
- Request/response interceptors
- Error handling

**5. WebSocket Client (services/websocketClient.ts)**
- Socket.io-client wrapper
- Auto-reconnect with exponential backoff
- Event handlers for real-time updates

### Cache Invalidation Rules

| Event | Action |
|-------|--------|
| User creates entity | Invalidate list caches for entity type |
| User updates entity | Invalidate entity + list caches |
| User deletes entity | Remove from all caches |
| WebSocket update | Update entity cache + invalidate lists |
| Sync completed | Refresh stale data (>5 min old) |
| User logs out | Clear all caches |
| Offline → Online | Trigger background sync |

---

## Performance Guidelines

### Code Splitting Strategy

**Route-Based Splitting (Lazy Loading)**
```typescript
// App.tsx - Split by route
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Invoices = lazy(() => import('@/pages/Invoices'))
const Bills = lazy(() => import('@/pages/Bills'))
const Transactions = lazy(() => import('@/pages/Transactions'))
const JournalEntries = lazy(() => import('@/pages/JournalEntries'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/journal-entries" element={<JournalEntries />} />
      </Routes>
    </Suspense>
  )
}
```

**Component-Based Splitting (Heavy Components)**
```typescript
// Only load heavy components when needed
const InvoiceForm = lazy(() => import('@/features/invoices/components/InvoiceForm'))
const CommandPalette = lazy(() => import('@/features/command-palette/CommandPalette'))

// Usage with state-driven rendering
{showInvoiceForm && (
  <Suspense fallback={<Skeleton />}>
    <InvoiceForm />
  </Suspense>
)}
```

### Virtualized Lists (react-window)

**For Large Datasets (10K+ rows)**
```typescript
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TransactionRow transaction={transactions[index]} />
    </div>
  )

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={transactions.length}
          itemSize={48} // Row height in pixels
          width={width}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  )
}
```

### Memoization Strategy

**Expensive Calculations (useMemo)**
```typescript
import { useMemo } from 'react'

function InvoiceList({ invoices, filters }: Props) {
  // Memoize filtered results (only recalculate when inputs change)
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filters.status && !filters.status.includes(inv.status)) return false
      if (filters.customerId && inv.customerId !== filters.customerId) return false
      if (filters.dateFrom && new Date(inv.txnDate) < new Date(filters.dateFrom)) return false
      return true
    })
  }, [invoices, filters])

  // Memoize totals
  const totals = useMemo(() => ({
    total: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    count: filteredInvoices.length,
  }), [filteredInvoices])

  return (
    <div>
      <p>Total: ${totals.total} ({totals.count} invoices)</p>
      {filteredInvoices.map(invoice => (
        <InvoiceRow key={invoice.id} invoice={invoice} />
      ))}
    </div>
  )
}
```

**Callback Functions (useCallback)**
```typescript
import { useCallback } from 'react'

function InvoiceForm() {
  const [lines, setLines] = useState<InvoiceLine[]>([])

  // Memoize callback to prevent child re-renders
  const handleAddLine = useCallback(() => {
    setLines(prev => [...prev, createEmptyLine()])
  }, [])

  const handleRemoveLine = useCallback((index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div>
      {lines.map((line, index) => (
        <InvoiceLineItem
          key={line.id}
          line={line}
          onRemove={handleRemoveLine} // Same reference on every render
        />
      ))}
      <Button onClick={handleAddLine}>Add Line</Button>
    </div>
  )
}
```

**Component Memoization (React.memo)**
```typescript
import { memo } from 'react'

interface InvoiceRowProps {
  invoice: Invoice
  onSelect: (id: string) => void
}

// Only re-render if props change
export const InvoiceRow = memo(({ invoice, onSelect }: InvoiceRowProps) => {
  return (
    <div onClick={() => onSelect(invoice.id)}>
      <span>{invoice.docNumber}</span>
      <span>{invoice.customerName}</span>
      <span>${invoice.totalAmount}</span>
    </div>
  )
})
```

### Debouncing & Throttling

**Search Input Debouncing**
```typescript
import { useDeferredValue, useState } from 'react'

function SearchInput() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // deferredQuery updates with lower priority
  const results = useSearch(deferredQuery)

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)} // Immediate UI update
      placeholder="Search..."
    />
  )
}
```

**Or using lodash debounce:**
```typescript
import { debounce } from 'lodash'
import { useMemo } from 'react'

function CommandPalette() {
  const [results, setResults] = useState([])

  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      const searchResults = fuzzySearch(query, data)
      setResults(searchResults)
    }, 100), // 100ms delay
    []
  )

  return (
    <input
      onChange={e => debouncedSearch(e.target.value)}
    />
  )
}
```

### Avoid Unnecessary Re-renders

**❌ Bad: Inline object/array creation**
```typescript
// Creates new object on every render → child re-renders unnecessarily
<InvoiceRow invoice={invoice} filters={{ status: 'PAID' }} />
```

**✅ Good: Move static objects outside component**
```typescript
const PAID_FILTER = { status: 'PAID' }

function InvoiceList() {
  return <InvoiceRow invoice={invoice} filters={PAID_FILTER} />
}
```

**❌ Bad: Inline function in render**
```typescript
// Creates new function on every render
<Button onClick={() => handleClick(invoice.id)} />
```

**✅ Good: useCallback or extract to handler**
```typescript
const handleClick = useCallback(() => {
  handleInvoiceClick(invoice.id)
}, [invoice.id])

<Button onClick={handleClick} />
```

### Bundle Size Optimization

**Tree-shaking Friendly Imports**
```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash'
const result = _.debounce(fn, 100)

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce'
const result = debounce(fn, 100)
```

**Analyze Bundle Size**
```bash
# Build with analysis
npm run build -- --analyze

# Check bundle sizes
npm run preview
```

### Performance Monitoring

**Use React DevTools Profiler**
```typescript
import { Profiler } from 'react'

function App() {
  const onRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number
  ) => {
    if (actualDuration > 16) { // >16ms = missed frame
      console.warn(`Slow render: ${id} took ${actualDuration}ms`)
    }
  }

  return (
    <Profiler id="App" onRender={onRender}>
      <Routes />
    </Profiler>
  )
}
```

**Custom Performance Tracking**
```typescript
// utils/performance.ts
export function measurePerformance(label: string, fn: () => void) {
  const start = performance.now()
  fn()
  const duration = performance.now() - start
  
  if (duration > 20) {
    console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`)
  }
  
  return duration
}

// Usage
measurePerformance('Filter 10K invoices', () => {
  const filtered = invoices.filter(/* complex filter */)
})
```

---

## Keyboard Navigation & Accessibility

### Global Keyboard Shortcuts

**Implementation with useKeyPress Hook**
```typescript
// hooks/useKeyPress.ts
import { useEffect } from 'react'

type KeyCombo = string // e.g., 'Meta+k', 'Ctrl+s', 'j'

export function useKeyPress(
  keyCombo: KeyCombo | KeyCombo[],
  callback: (e: KeyboardEvent) => void,
  options?: { preventDefault?: boolean }
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const combos = Array.isArray(keyCombo) ? keyCombo : [keyCombo]
      const pressed = combos.some(combo => matchesKeyCombo(e, combo))

      if (pressed) {
        if (options?.preventDefault) e.preventDefault()
        callback(e)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyCombo, callback, options])
}

function matchesKeyCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.split('+')
  const key = parts[parts.length - 1].toLowerCase()
  const modifiers = parts.slice(0, -1).map(m => m.toLowerCase())

  const keyMatches = e.key.toLowerCase() === key
  const metaMatches = !modifiers.includes('meta') || e.metaKey
  const ctrlMatches = !modifiers.includes('ctrl') || e.ctrlKey
  const shiftMatches = !modifiers.includes('shift') || e.shiftKey
  const altMatches = !modifiers.includes('alt') || e.altKey

  return keyMatches && metaMatches && ctrlMatches && shiftMatches && altMatches
}
```

**Usage in Components**
```typescript
import { useKeyPress } from '@/shared/hooks/useKeyPress'

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // ⌘K or Ctrl+K opens command palette
  useKeyPress(['Meta+k', 'Ctrl+k'], () => {
    setCommandPaletteOpen(true)
  }, { preventDefault: true })

  // ? shows keyboard shortcuts help
  useKeyPress('?', () => {
    setShowShortcuts(true)
  }, { preventDefault: true })

  // Escape closes modals
  useKeyPress('Escape', () => {
    setCommandPaletteOpen(false)
    setShowShortcuts(false)
  })

  return (
    <>
      {commandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  )
}
```

### Keyboard Navigation in Lists

**j/k Navigation (Vim-style)**
```typescript
function TransactionList({ transactions }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyPress('j', () => {
    setSelectedIndex(prev => Math.min(prev + 1, transactions.length - 1))
  })

  useKeyPress('k', () => {
    setSelectedIndex(prev => Math.max(prev - 1, 0))
  })

  useKeyPress('Enter', () => {
    openTransaction(transactions[selectedIndex].id)
  })

  useKeyPress('Space', () => {
    toggleSelect(transactions[selectedIndex].id)
  }, { preventDefault: true })

  return (
    <div>
      {transactions.map((txn, index) => (
        <TransactionRow
          key={txn.id}
          transaction={txn}
          selected={index === selectedIndex}
        />
      ))}
    </div>
  )
}
```

### Focus Management

**Focus Trap for Modals**
```typescript
import { useEffect, useRef } from 'react'

function Modal({ children, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    // Get all focusable elements
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus first element on mount
    firstElement?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    modal.addEventListener('keydown', handleTab)
    return () => modal.removeEventListener('keydown', handleTab)
  }, [])

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  )
}
```

### ARIA Labels & Roles

**Proper Semantic HTML First**
```tsx
// ✅ Good: Use semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/invoices">Invoices</a></li>
    <li><a href="/bills">Bills</a></li>
  </ul>
</nav>

// ❌ Bad: Div soup with ARIA
<div role="navigation" aria-label="Main navigation">
  <div role="list">
    <div role="listitem"><div role="link">Invoices</div></div>
  </div>
</div>
```

**ARIA Only When Necessary**
```tsx
// Screen reader announcements for dynamic content
<div role="status" aria-live="polite" aria-atomic="true">
  {syncStatus === 'SYNCING' && 'Syncing data...'}
  {syncStatus === 'SYNCED' && 'Sync complete'}
</div>

// Skip navigation link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Accessible Forms

```tsx
// Proper form field labeling
<div>
  <label htmlFor="customer-select">Customer</label>
  <select
    id="customer-select"
    aria-required="true"
    aria-invalid={errors.customerId ? 'true' : 'false'}
    aria-describedby={errors.customerId ? 'customer-error' : undefined}
  >
    <option value="">Select customer</option>
    {customers.map(c => (
      <option key={c.id} value={c.id}>{c.displayName}</option>
    ))}
  </select>
  {errors.customerId && (
    <span id="customer-error" role="alert">
      {errors.customerId.message}
    </span>
  )}
</div>
```

### Color Contrast

**Tailwind Classes for Accessibility**
```css
/* Light mode - meets WCAG AA */
.text-primary { color: #059669; } /* Green 600 - 4.5:1 contrast */
.text-secondary { color: #6b7280; } /* Gray 500 - 4.6:1 contrast */
.text-danger { color: #dc2626; } /* Red 600 - 4.5:1 contrast */

/* Dark mode - meets WCAG AA */
.dark .text-primary { color: #10b981; } /* Green 500 - 4.7:1 contrast */
.dark .text-secondary { color: #9ca3af; } /* Gray 400 - 7:1 contrast */
.dark .text-danger { color: #f87171; } /* Red 400 - 4.8:1 contrast */
```

**Test with Tools**
- Chrome DevTools Lighthouse (Accessibility audit)
- axe DevTools browser extension
- WAVE browser extension

---

## Backend API Contracts

### 🚨 Important: Frontend-Only Definitions

**These are TypeScript interfaces for frontend use only.**
- Do NOT assume backend implementation details
- Backend team may change implementation
- Interfaces isolate frontend from backend changes
- Always sync with backend team on contract changes

### Base Types

```typescript
// types/common.ts
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
export type EntitySyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR'
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOID'
export type BillStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOID'
export type EmailStatus = 'NOT_SENT' | 'NEED_TO_SEND' | 'EMAIL_SENT'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}
```

### Authentication API

```typescript
// types/api/auth.ts

// GET /auth/quickbooks - Initiate OAuth
export interface InitiateOAuthResponse {
  redirectUrl: string
  state: string
}

// GET /auth/quickbooks/callback (handled by backend redirect)
// Frontend receives: ?connected=true in URL after redirect

// POST /auth/refresh
export interface RefreshTokenRequest {
  companyId: string
}

export interface RefreshTokenResponse {
  success: boolean
  expiresAt: string
  message?: string
}
```

### Company API

```typescript
// types/api/company.ts

export interface Company {
  id: string
  companyName: string
  qboRealmId: string
  lastSyncAt: string | null
  syncStatus: SyncStatus
  syncError?: string
  createdAt: string
  updatedAt: string
}

// GET /companies
export type GetCompaniesResponse = Company[]

// GET /companies/:id
export type GetCompanyResponse = Company

// POST /companies/:id/sync
export interface TriggerSyncResponse {
  jobId: string
  status: 'PENDING'
  message: string
}

// GET /companies/:id/sync-status
export interface SyncStatusResponse {
  companyId: string
  lastSyncAt: string
  syncStatus: SyncStatus
  lastSyncError?: string
  stats: {
    totalAccounts: number
    totalCustomers: number
    totalVendors: number
    totalTransactions: number
    totalInvoices: number
    totalBills: number
    totalJournalEntries: number
  }
}
```

### Invoice API

```typescript
// types/api/invoice.ts

export interface InvoiceLine {
  id: string
  invoiceId: string
  accountId: string
  accountName?: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Invoice {
  id: string
  companyId: string
  qboId?: string
  docNumber: string
  txnDate: string
  dueDate?: string
  customerId: string
  customerName?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  balance: number
  status: InvoiceStatus
  emailStatus: EmailStatus
  memo?: string
  privateNote?: string
  lines: InvoiceLine[]
  syncStatus: EntitySyncStatus
  syncError?: string
  createdAt: string
  updatedAt: string
  qboCreatedAt?: string
  qboUpdatedAt?: string
}

// GET /invoices
export interface GetInvoicesRequest {
  companyId: string
  status?: InvoiceStatus[]
  customerId?: string
  dateFrom?: string // ISO date
  dateTo?: string
  search?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type GetInvoicesResponse = PaginatedResponse<Invoice>

// GET /invoices/:id
export type GetInvoiceResponse = Invoice

// POST /invoices
export interface CreateInvoiceRequest {
  companyId: string
  customerId: string
  txnDate: string
  dueDate?: string
  lines: Array<{
    accountId: string
    description: string
    quantity: number
    unitPrice: number
  }>
  memo?: string
  privateNote?: string
}

export type CreateInvoiceResponse = Invoice

// PUT /invoices/:id
export interface UpdateInvoiceRequest {
  customerId?: string
  txnDate?: string
  dueDate?: string
  lines?: Array<{
    accountId: string
    description: string
    quantity: number
    unitPrice: number
  }>
  memo?: string
  privateNote?: string
}

export type UpdateInvoiceResponse = Invoice

// POST /invoices/:id/duplicate
export type DuplicateInvoiceResponse = Invoice

// POST /invoices/:id/send
export interface SendInvoiceRequest {
  emailTo?: string
}

export interface SendInvoiceResponse {
  success: boolean
  emailStatus: EmailStatus
  sentAt: string
  sentTo: string
}

// DELETE /invoices/:id (void)
export interface VoidInvoiceResponse {
  success: boolean
  status: 'VOID'
  voidedAt: string
}
```

### Bill API

```typescript
// types/api/bill.ts
// Similar structure to Invoice API

export interface BillLine {
  id: string
  billId: string
  accountId: string
  accountName?: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Bill {
  id: string
  companyId: string
  qboId?: string
  docNumber?: string
  txnDate: string
  dueDate?: string
  vendorId: string
  vendorName?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  balance: number
  status: BillStatus
  memo?: string
  privateNote?: string
  lines: BillLine[]
  syncStatus: EntitySyncStatus
  syncError?: string
  createdAt: string
  updatedAt: string
}

// GET /bills, POST /bills, etc. (similar to invoices)
```

### Transaction API

```typescript
// types/api/transaction.ts

export type TransactionType = 'INVOICE' | 'BILL' | 'PAYMENT' | 'DEPOSIT' | 'JOURNAL_ENTRY' | 'CREDIT_MEMO' | 'OTHER'

export interface Transaction {
  id: string
  companyId: string
  qboId: string
  type: TransactionType
  txnDate: string
  amount: number
  customerId?: string
  customerName?: string
  vendorId?: string
  vendorName?: string
  memo?: string
  referenceNumber?: string
  syncStatus: EntitySyncStatus
  createdAt: string
  updatedAt: string
}

// GET /transactions
export interface GetTransactionsRequest {
  companyId: string
  type?: TransactionType[]
  customerId?: string
  vendorId?: string
  accountId?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type GetTransactionsResponse = PaginatedResponse<Transaction>
```

### Reference Data APIs

```typescript
// types/api/reference.ts

export interface Account {
  id: string
  companyId: string
  qboId: string
  name: string
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'OTHER'
  accountSubType?: string
  accountNumber?: string
  description?: string
  active: boolean
  currentBalance: number
}

export interface Customer {
  id: string
  companyId: string
  qboId: string
  displayName: string
  givenName?: string
  familyName?: string
  companyName?: string
  email?: string
  phone?: string
  balance: number
  active: boolean
}

export interface Vendor {
  id: string
  companyId: string
  qboId: string
  displayName: string
  givenName?: string
  familyName?: string
  companyName?: string
  email?: string
  phone?: string
  balance: number
  active: boolean
}

// GET /accounts
export interface GetAccountsRequest {
  companyId: string
  type?: string[]
  active?: boolean
}

export type GetAccountsResponse = Account[]

// GET /customers, GET /vendors (similar structure)
```

### WebSocket Events

```typescript
// types/websocket.ts

export type WebSocketEvent =
  | EntityCreatedEvent
  | EntityUpdatedEvent
  | EntityDeletedEvent
  | SyncStatusEvent
  | SyncCompletedEvent
  | ErrorEvent
  | PongEvent

export interface EntityCreatedEvent {
  event: 'entity:created'
  data: {
    companyId: string
    entityType: 'invoice' | 'bill' | 'transaction' | 'journalEntry' | 'customer' | 'vendor'
    entityId: string
    entity: Record<string, any>
  }
}

export interface EntityUpdatedEvent {
  event: 'entity:updated'
  data: {
    companyId: string
    entityType: string
    entityId: string
    changes: Record<string, any>
    entity: Record<string, any>
  }
}

export interface EntityDeletedEvent {
  event: 'entity:deleted'
  data: {
    companyId: string
    entityType: string
    entityId: string
  }
}

export interface SyncStatusEvent {
  event: 'sync:status'
  data: {
    companyId: string
    status: 'SYNCING' | 'SYNCED' | 'FAILED'
    progress?: number // 0-100
    message?: string
    currentEntity?: string
  }
}

export interface SyncCompletedEvent {
  event: 'sync:completed'
  data: {
    companyId: string
    syncedAt: string
    stats: {
      entitiesSynced: number
      duration: number
      accountsSynced: number
      customersSynced: number
      invoicesSynced: number
      billsSynced: number
    }
  }
}

export interface ErrorEvent {
  event: 'error'
  data: {
    companyId: string
    code: string
    message: string
    details?: any
  }
}

export interface PongEvent {
  event: 'pong'
  data: {
    timestamp: string
  }
}

// Client → Server events
export interface SubscribeEvent {
  event: 'subscribe'
  data: {
    companyId: string
  }
}

export interface UnsubscribeEvent {
  event: 'unsubscribe'
  data: {
    companyId: string
  }
}

export interface PingEvent {
  event: 'ping'
}
```

### API Client Implementation

```typescript
// services/apiClient.ts
import axios, { AxiosInstance, AxiosError } from 'axios'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available (future)
        // const token = localStorage.getItem('auth_token')
        // if (token) config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<ApiError>) => {
        // Handle errors gracefully
        const apiError: ApiError = {
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details,
        }
        return Promise.reject(apiError)
      }
    )
  }

  async get<T>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put(url, data, config)
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config)
  }
}

export const apiClient = new APIClient()
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── CompanySelector (v2)
│   │   ├── SyncStatusBadge
│   │   ├── ThemeToggle
│   │   └── UserMenu
│   ├── Sidebar (optional)
│   │   └── Navigation
│   ├── Main Content (Routes)
│   └── StatusBar
├── CommandPalette (global, lazy loaded)
├── UndoToast (global)
├── ShortcutsModal (global, lazy loaded)
└── Pages
    ├── Dashboard
    ├── Invoices
    │   ├── InvoiceList
    │   │   ├── InvoiceListHeader (filters, search)
    │   │   ├── InvoiceTable (virtualized)
    │   │   │   └── InvoiceRow
    │   │   └── InvoiceListFooter (pagination)
    │   └── InvoiceForm (modal or page)
    │       ├── CustomerSelect
    │       ├── DatePicker
    │       ├── InvoiceLineItems
    │       │   └── InvoiceLineItem
    │       └── FormActions
    ├── Bills (similar to Invoices)
    ├── Transactions
    └── JournalEntries
```

### Component Design Principles

**1. Single Responsibility**
```typescript
// ✅ Good: Each component has one job
<InvoiceList invoices={invoices} />
<InvoiceFilters filters={filters} onChange={setFilters} />
<InvoiceSummary totals={totals} />

// ❌ Bad: One component doing too much
<InvoiceListWithFiltersAndSummary />
```

**2. Composition Over Props Drilling**
```typescript
// ✅ Good: Use composition
<InvoiceForm>
  <InvoiceForm.Header />
  <InvoiceForm.CustomerSection />
  <InvoiceForm.LineItems />
  <InvoiceForm.Actions />
</InvoiceForm>

// ❌ Bad: Props drilling
<InvoiceForm
  showHeader={true}
  showCustomer={true}
  showLines={true}
  showActions={true}
  headerTitle="Create Invoice"
  headerSubtitle="..."
/>
```

**3. Container/Presenter Pattern**
```typescript
// Container (logic)
function InvoiceListContainer() {
  const { data: invoices, isLoading } = useInvoices(companyId, filters)
  const { mutate: deleteInvoice } = useDeleteInvoice()

  const handleDelete = (id: string) => {
    if (confirm('Delete invoice?')) {
      deleteInvoice(id)
    }
  }

  if (isLoading) return <Skeleton />

  return (
    <InvoiceListPresenter
      invoices={invoices}
      onDelete={handleDelete}
    />
  )
}

// Presenter (pure UI)
interface InvoiceListPresenterProps {
  invoices: Invoice[]
  onDelete: (id: string) => void
}

function InvoiceListPresenter({ invoices, onDelete }: InvoiceListPresenterProps) {
  return (
    <div>
      {invoices.map(invoice => (
        <InvoiceRow key={invoice.id} invoice={invoice} onDelete={onDelete} />
      ))}
    </div>
  )
}
```

### Custom Hooks Pattern

```typescript
// hooks/useInvoiceForm.ts
export function useInvoiceForm(invoice?: Invoice) {
  const form = useForm<InvoiceFormData>({ /* ... */ })
  const { mutate: createInvoice } = useCreateInvoice()
  const { mutate: updateInvoice } = useUpdateInvoice()

  const handleSubmit = form.handleSubmit((data) => {
    if (invoice) {
      updateInvoice({ id: invoice.id, ...data })
    } else {
      createInvoice(data)
    }
  })

  const handleAddLine = () => {
    const lines = form.getValues('lines')
    form.setValue('lines', [...lines, createEmptyLine()])
  }

  return {
    form,
    handleSubmit,
    handleAddLine,
    isSubmitting: form.formState.isSubmitting,
  }
}

// Usage in component
function InvoiceForm({ invoice }: Props) {
  const { form, handleSubmit, handleAddLine } = useInvoiceForm(invoice)

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

---

## Development Workflow

### Environment Setup

```bash
# Clone repository
git clone https://github.com/yourorg/superhuman-qbo.git
cd superhuman-qbo/frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```bash
# .env.local
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_ENVIRONMENT=development
```

### Development Commands

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/invoice-form

# Commit with conventional commits
git commit -m "feat(invoices): add invoice form component"
git commit -m "fix(cache): resolve IndexedDB query bug"
git commit -m "docs(readme): update setup instructions"

# Push and create PR
git push origin feature/invoice-form
```

### Code Review Checklist

Before submitting PR:
- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Performance targets met (test with React DevTools Profiler)
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Mobile responsive (if applicable)
- [ ] No console errors or warnings
- [ ] Updated relevant documentation

---

## Open Questions (Frontend)

### 🔴 Critical

**Q1: Company Selection After OAuth**
- How does user select company in UI after OAuth redirect?
- Decision:
  - Auto-select company if only one is available
  - Show a lightweight company selector if multiple companies exist
- Rationale:
  - Reduces friction for majority of users
  - Aligns with common SaaS patterns (QuickBooks, Stripe)
- Status: ✅ Decided (MVP)

---

**Q2: Undo Implementation During Navigation**
- What happens to undo toast if user navigates away during 3-second window?
- Decision:
  - Option A: Execute action immediately on navigation
- Rationale:
  - Avoids blocking navigation
  - Prevents complex cross-route undo state
  - Keeps MVP logic simple and predictable
- Status: ✅ Decided (MVP)

---

**Q3: IndexedDB Quota Warning UI**
- At what threshold do we show warning?
- What UI component should be used?
- Decision:
  - 400MB: Non-blocking persistent banner
  - 450MB: Blocking modal requiring user action
- Rationale:
  - Prevents sudden quota failures
  - Gives early visibility without interrupting workflow
- Status: ✅ Decided (MVP)

---

### ⚠️ Important

**Q4: WebSocket Reconnection Strategy**
- How many reconnection attempts before giving up?
- What delays between attempts?
- When to show reconnecting indicator?
- Decision:
  - Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (max)
  - Retry indefinitely
  - Show "Reconnecting…" indicator after 5 seconds of disconnection
- Rationale:
  - Network issues are often transient
  - Infinite retry avoids silent data desync
- Status: ✅ Decided (MVP)

---

**Q5: Form Validation UX**
- Validate on blur or on submit?
- Show errors immediately or after submit attempt?
- Decision:
  - Validate on submit initially
  - After first submit attempt, validate on blur
- Rationale:
  - Reduces noisy error feedback
  - Improves form completion UX
- Status: ✅ Decided (MVP)

---

**Q6: Search / Filter Debounce Timing**
- Command palette search timing
- List filter timing
- Decision:
  - Command palette: 100ms debounce
  - List filters: 300ms debounce
- Rationale:
  - Command palette is a critical interaction path
  - Filters are less latency-sensitive
- Status: ✅ Decided (MVP, validate with perf testing)

---

### 📝 Nice to Have

**Q7: Empty State Illustrations**
- Use illustrations or simple text?
- Decision:
  - Simple text + icon only (no illustrations for MVP)
- Rationale:
  - Faster to implement
  - Avoids asset and design overhead
- Status: ✅ Decided (MVP)

---

**Q8: Loading Skeleton Design**
- Pulse animation or shimmer?
- Match exact layout or generic blocks?
- Decision:
  - Generic skeleton blocks with subtle pulse animation
  - Do not use shimmer
- Rationale:
  - Lower CPU/GPU cost
  - Less visual noise
  - Avoids tight coupling to layout
- Status: ✅ Decided (MVP)

---

**END OF FRONTEND_MASTER_REQUIREMENTS.md**

*This document is the single source of truth for frontend development on the Superhuman for QuickBooks MVP project. All frontend-specific requirements, patterns, and decisions are documented here.*

