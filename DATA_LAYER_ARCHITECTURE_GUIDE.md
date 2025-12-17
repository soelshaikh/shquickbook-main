# Data Layer Architecture Guide
**How Data Flows in the Application**

---

## Overview

The application uses a **three-tier caching strategy** to optimize performance and enable offline functionality:

1. **Memory Cache** (React Query) - Fastest, temporary
2. **IndexedDB** (Dexie.js) - Persistent, offline-capable
3. **API Server** (Backend) - Source of truth (currently mocked)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  (React Components, Hooks, Pages)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               REACT QUERY (Memory Cache)                     │
│  - In-memory JavaScript objects                             │
│  - 5-minute stale time                                      │
│  - Automatic background refetch                             │
│  - Optimistic updates                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA SERVICE LAYER                         │
│  (src/services/dataService.ts)                              │
│  - Orchestrates caching strategy                            │
│  - Cache-first read pattern                                 │
│  - Write-through pattern                                    │
└───────────┬───────────────────────────┬─────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────┐
│   INDEXEDDB         │     │      API CLIENT             │
│   (Dexie.js)        │     │      (Axios)                │
│                     │     │                             │
│  - Persistent       │     │  - HTTP requests            │
│  - Offline storage  │     │  - Currently mocked         │
│  - Structured data  │     │  - Future: Real backend     │
└─────────────────────┘     └─────────────────────────────┘
```

---

## Detailed Data Flow

### READ Operation (Cache-First Strategy)

```
User requests data (e.g., "Get all invoices")
            │
            ▼
1. CHECK REACT QUERY CACHE (Memory)
   ├─ ✅ Cache HIT (data exists and fresh)
   │   └─> Return immediately (fastest)
   │
   └─ ❌ Cache MISS or STALE
       │
       ▼
2. CHECK INDEXEDDB (Persistent Storage)
   ├─ ✅ IndexedDB HIT
   │   ├─> Return data to user
   │   └─> Store in React Query cache
   │
   └─ ❌ IndexedDB MISS
       │
       ▼
3. FETCH FROM API (Backend)
   ├─> Make HTTP request
   ├─> Store in IndexedDB
   └─> Store in React Query cache
       └─> Return to user
```

### WRITE Operation (Write-Through Strategy)

```
User updates data (e.g., "Update invoice #123")
            │
            ▼
1. OPTIMISTIC UPDATE
   └─> Update React Query cache immediately
       └─> User sees change instantly ⚡
            │
            ▼
2. WRITE TO INDEXEDDB
   └─> Persist to local database
       └─> Survives page refresh
            │
            ▼
3. WRITE TO API
   ├─> Send HTTP request to backend
   │
   ├─ ✅ SUCCESS
   │   └─> Confirm update
   │       └─> Show "Undo" toast
   │
   └─ ❌ FAILURE or OFFLINE
       ├─> Rollback React Query cache
       ├─> Add to sync queue
       └─> Show error or "Will sync later"
```

---

## What Data Goes Where?

### 1. Memory Cache (React Query)

**Location:** RAM (JavaScript heap)  
**Persistence:** Until page refresh or tab close  
**Size Limit:** Browser memory limits (~100-500 MB)

**What's Stored:**
- ✅ All fetched data (invoices, bills, transactions, etc.)
- ✅ Query results with metadata (loading, error states)
- ✅ Prefetched data for faster navigation
- ✅ Background refetch results

**Structure:**
```javascript
queryCache = {
  ['invoices', 'comp-1']: {
    data: [...invoices],
    dataUpdatedAt: 1701234567890,
    isStale: false,
    status: 'success'
  },
  ['bills', 'comp-1']: {
    data: [...bills],
    ...
  }
}
```

**When Data is Retrieved:**
- ✅ Every component render (if query is active)
- ✅ Automatic background refetch every 5 minutes
- ✅ On window focus (user returns to tab)
- ✅ On network reconnection

**Advantages:**
- ⚡ Instant access (microseconds)
- 🔄 Automatic deduplication (multiple components share same data)
- 📊 Built-in loading/error states
- 🔃 Background updates without user action

---

### 2. IndexedDB (Dexie.js)

**Location:** Browser's IndexedDB storage (disk)  
**Persistence:** Until explicitly deleted or quota exceeded  
**Size Limit:** Dynamic quota (browser-specific, typically 50-80% of available disk)

**What's Stored:**
- ✅ All entity data (invoices, bills, transactions, journal entries, etc.)
- ✅ Full records with all fields
- ✅ Indexed for fast queries
- ✅ Write queue for offline operations

**Database Schema:**
```javascript
db.version(1).stores({
  invoices: '++id, companyId, [companyId+status], customerId, txnDate',
  bills: '++id, companyId, [companyId+status], vendorId, txnDate',
  transactions: '++id, companyId, [companyId+type], date',
  journalEntries: '++id, companyId, date',
  customerPayments: '++id, companyId, customerId, date',
  vendorPayments: '++id, companyId, vendorId, date',
  creditMemos: '++id, companyId, customerId, date',
  deposits: '++id, companyId, date',
  syncQueue: '++id, timestamp, entityType, operation, data'
});
```

**When Data is Written:**
- ✅ After successful API fetch (cache warming)
- ✅ After user creates/updates/deletes (write-through)
- ✅ During offline operations (queued)
- ✅ On app startup (if empty, fetch and store)

**When Data is Retrieved:**
- ✅ When React Query cache is empty/stale
- ✅ On page load (before API call completes)
- ✅ When offline (fallback data source)
- ✅ For complex queries with indexes (faster than API)

**Advantages:**
- 💾 Survives page refresh
- 🌐 Works offline
- 🔍 Fast indexed queries
- 📦 Large storage capacity

**Example Query:**
```typescript
// Fast indexed query
const overdueInvoices = await db.invoices
  .where('[companyId+status]')
  .equals(['comp-1', 'overdue'])
  .toArray();

// Date range query
const thisMonthInvoices = await db.invoices
  .where('txnDate')
  .between('2024-12-01', '2024-12-31')
  .toArray();
```

---

### 3. API Server (Backend)

**Location:** Remote server (currently mocked in code)  
**Persistence:** Database on server (PostgreSQL, MongoDB, etc.)  
**Size Limit:** Server storage limits

**What's Stored:**
- ✅ Source of truth for all data
- ✅ Multi-user shared data
- ✅ Historical data and audit logs
- ✅ Relationships and constraints

**When Data is Written:**
- ✅ On user create/update/delete (if online)
- ✅ On sync queue processing (when reconnected)

**When Data is Retrieved:**
- ✅ On first load (if IndexedDB empty)
- ✅ On background refetch (every 5 minutes)
- ✅ On manual refresh
- ✅ After cache invalidation

**Current State:**
- ⚠️ API is MOCKED (returns hardcoded data)
- ⚠️ Waiting for backend deployment

---

## Real-World Examples

### Example 1: User Opens Invoices Page

```
Step 1: Component mounts
  └─> useInvoices('comp-1') hook called

Step 2: React Query checks memory cache
  └─> MISS (first visit)

Step 3: Query function executes
  └─> dataService.getInvoices('comp-1')

Step 4: dataService checks IndexedDB
  └─> db.invoices.where('companyId').equals('comp-1').toArray()
  
Step 5: IndexedDB has data (from previous session)
  └─> Returns 1000 invoices (50ms)
  
Step 6: Data flows back
  └─> Stored in React Query cache
  └─> Component renders with data ⚡
  
Step 7: Background refetch starts (automatic)
  └─> Calls API (currently returns mock data)
  └─> Updates IndexedDB if changes found
  └─> Updates React Query cache
  └─> Component re-renders if data changed
```

**Timeline:**
- 0ms: User clicks "Invoices"
- 50ms: Data displayed (from IndexedDB) ✅ FAST!
- 200ms: Background API check complete
- User sees data almost instantly!

---

### Example 2: User Updates Invoice

```
Step 1: User clicks "Save" on invoice form
  └─> handleSave() called

Step 2: OPTIMISTIC UPDATE (React Query)
  └─> queryClient.setQueryData(['invoices', 'comp-1'], (old) => {
        return old.map(inv => 
          inv.id === '123' ? { ...inv, customer: 'New Customer' } : inv
        );
      })
  └─> User sees change IMMEDIATELY ⚡

Step 3: PERSIST TO INDEXEDDB
  └─> await db.invoices.update('123', { customer: 'New Customer' })
  └─> Data survives page refresh ✅

Step 4: SEND TO API
  └─> await apiClient.put('/invoices/123', { customer: 'New Customer' })
  
Step 5a: API SUCCESS
  └─> Confirm update
  └─> Show undo toast (3 seconds)
  └─> Done!

Step 5b: API FAILURE (or offline)
  └─> Rollback React Query cache
  └─> Show error message
  └─> Add to syncQueue in IndexedDB
  └─> Will retry when online
```

**Timeline:**
- 0ms: User clicks "Save"
- 1ms: UI updates (optimistic) ✅ INSTANT!
- 50ms: IndexedDB updated (persisted)
- 200ms: API call completes
- 3000ms: Undo toast disappears

---

### Example 3: Offline Operation

```
Scenario: User is offline (airplane mode)

Step 1: User creates new invoice
  └─> handleSave() called

Step 2: OPTIMISTIC UPDATE (React Query)
  └─> New invoice appears in list ✅

Step 3: PERSIST TO INDEXEDDB
  └─> await db.invoices.add(newInvoice)
  └─> Data saved locally ✅

Step 4: TRY TO SEND TO API
  └─> await apiClient.post('/invoices', newInvoice)
  └─> ❌ NETWORK ERROR (offline)

Step 5: HANDLE OFFLINE
  └─> Add to sync queue
      await db.syncQueue.add({
        entityType: 'invoice',
        operation: 'create',
        data: newInvoice,
        timestamp: Date.now()
      })
  └─> Show offline indicator
  └─> Keep data in React Query cache
  └─> User can continue working!

Later: User comes back online

Step 6: AUTO-SYNC TRIGGERED
  └─> Process sync queue
  └─> Send pending operations to API
  └─> Update IndexedDB with server IDs
  └─> Sync complete! ✅
```

---

### Example 4: Multiple Components Using Same Data

```
Scenario: InvoiceList and InvoiceForm both need invoice data

Component A: InvoiceList
  └─> const { data: invoices } = useInvoices('comp-1')

Component B: InvoiceForm
  └─> const { data: invoices } = useInvoices('comp-1')

React Query Behavior:
  ✅ Makes only ONE API call (shared query)
  ✅ Both components get same data reference
  ✅ Update in one place, both components re-render
  ✅ No duplicate network requests
  ✅ No data synchronization issues
```

---

## Cache Invalidation Strategy

### When Caches are Invalidated:

**React Query Cache:**
- ⏱️ After 5 minutes (stale time)
- 🔄 On mutation success (create/update/delete)
- 🪟 On window focus
- 🌐 On network reconnect
- 🔃 On manual invalidation

**IndexedDB:**
- 🗑️ On user logout (clear all data)
- 🧹 On cache clear action
- ❌ On quota exceeded (automatic cleanup)
- Never automatically (persists forever otherwise)

**Example Code:**
```typescript
// After updating invoice
updateInvoiceMutation.mutate(
  { id: '123', data: { ... } },
  {
    onSuccess: () => {
      // Invalidate React Query cache
      queryClient.invalidateQueries(['invoices', 'comp-1']);
      
      // IndexedDB is already updated (write-through)
    }
  }
);
```

---

## Cache Priority & Fallback

```
READ PRIORITY:
1. React Query (Memory) - Check first ⚡
2. IndexedDB - Fallback if memory cache empty 💾
3. API - Fallback if both empty 🌐

WRITE PRIORITY:
1. React Query (Optimistic) - Update first ⚡
2. IndexedDB - Persist immediately 💾
3. API - Sync to server 🌐
```

---

## Performance Characteristics

| Operation | React Query | IndexedDB | API |
|-----------|-------------|-----------|-----|
| **Read Speed** | <1ms ⚡⚡⚡ | 10-50ms ⚡⚡ | 100-500ms ⚡ |
| **Write Speed** | <1ms ⚡⚡⚡ | 10-50ms ⚡⚡ | 100-500ms ⚡ |
| **Persistence** | ❌ No | ✅ Yes | ✅ Yes |
| **Offline** | ⚠️ Partial | ✅ Yes | ❌ No |
| **Size Limit** | ~500 MB | ~Several GB | Unlimited |
| **Shared Across Tabs** | ❌ No | ✅ Yes | ✅ Yes |

---

## Current Data Flow Implementation

### File Structure:

```
src/services/
├── apiClient.ts          # Axios HTTP client (configured but mocked)
├── dataService.ts        # Main data orchestration layer
├── cacheManager.ts       # Cache invalidation logic
└── indexedDB.ts          # Dexie database wrapper

src/hooks/
├── useInvoices.ts        # React Query hooks for invoices
├── useBills.ts           # React Query hooks for bills
├── useTransactions.ts    # React Query hooks for transactions
└── ...                   # More entity hooks
```

### Example: How useInvoices Works

```typescript
// src/hooks/useInvoices.ts
export function useInvoices(companyId: string) {
  return useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => dataService.getInvoices(companyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// src/services/dataService.ts
export const dataService = {
  async getInvoices(companyId: string): Promise<Invoice[]> {
    try {
      // 1. Try IndexedDB first (cache-first)
      const cached = await db.invoices
        .where('companyId')
        .equals(companyId)
        .toArray();
      
      if (cached && cached.length > 0) {
        console.log('✅ Returning from IndexedDB cache');
        return cached;
      }
      
      // 2. Fetch from API (currently mocked)
      console.log('📡 Fetching from API');
      const response = await apiClient.get(`/invoices?companyId=${companyId}`);
      const invoices = response.data;
      
      // 3. Store in IndexedDB for next time
      await db.invoices.bulkPut(invoices);
      
      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw normalizeError(error);
    }
  },
  
  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    try {
      // 1. Update IndexedDB immediately
      await db.invoices.update(id, data);
      
      // 2. Send to API
      const response = await apiClient.put(`/invoices/${id}`, data);
      const updated = response.data;
      
      // 3. Update IndexedDB with server response
      await db.invoices.put(updated);
      
      return updated;
    } catch (error) {
      // If offline, queue for later
      if (!navigator.onLine) {
        await db.syncQueue.add({
          entityType: 'invoice',
          operation: 'update',
          entityId: id,
          data,
          timestamp: Date.now()
        });
      }
      throw normalizeError(error);
    }
  }
};
```

---

## Summary

**Three-Tier Caching Strategy:**

1. **Memory (React Query)** - Instant access, temporary
2. **IndexedDB (Dexie)** - Fast access, persistent, offline-capable
3. **API (Backend)** - Source of truth, shared across users

**Key Principles:**
- ⚡ Speed: Memory > IndexedDB > API
- 💾 Persistence: API = IndexedDB > Memory
- 🌐 Offline: IndexedDB works, others don't
- 🔄 Sync: Optimistic updates with eventual consistency

**Result:**
- Users see data instantly (memory or IndexedDB)
- Data persists across sessions
- Works offline
- Syncs automatically when online
- "Superhuman" speed! ⚡

---

**END OF DATA LAYER GUIDE**
