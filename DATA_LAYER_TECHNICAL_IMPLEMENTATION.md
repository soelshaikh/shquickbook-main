# Data Layer - Technical Implementation Guide
**Complete Code Walkthrough**

---

## Overview

Your system implements a **sophisticated 3-tier caching architecture** to provide instant UI updates, offline capability, and optimal performance.

**Architecture Stack:**
```
React Components
      ↓
React Query (useInvoices hook) ← TIER 1: Memory Cache (in RAM)
      ↓
DataService.ts (orchestrator)
      ↓
   ┌──────┴──────┐
   ↓             ↓
CacheManager  IndexedDB ← TIER 2: Persistent Cache (on disk)
   (LRU)      (Dexie.js)
      ↓
   API Client ← TIER 3: Source of Truth (backend)
```

---

## TIER 1: React Query (Memory Cache)

### Location: `src/hooks/useInvoices.ts`

**Purpose:** In-memory cache for instant data access (< 1ms)

### Code Implementation:

```typescript
// src/hooks/useInvoices.ts (Lines 6-22)
export function useInvoices(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['invoices', companyId, filters],
    queryFn: () => dataService.getInvoices(companyId, filters),
    staleTime: 5 * 60 * 1000,      // Data fresh for 5 minutes
    gcTime: 10 * 60 * 1000,        // Keep in memory for 10 minutes
  });

  return {
    ...query,
    data: query.data || [],
    totalCount: query.data?.length ?? 0,
  };
}
```

**How It Works:**

1. **Query Key:** `['invoices', 'comp-1', filters]` - Unique identifier
2. **Stale Time:** Data is "fresh" for 5 minutes (no refetch)
3. **GC Time:** Data kept in memory for 10 minutes after last use
4. **Query Function:** Calls `dataService.getInvoices()` when needed

**When React Query Cache is Used:**
- ✅ Every component render (if query is active)
- ✅ Multiple components share same query (automatic deduplication)
- ✅ Background refetch every 5 minutes (automatic)
- ✅ On window focus (user returns to tab)
- ✅ On network reconnect

**Memory Structure:**
```javascript
// React Query's internal cache
queryCache = {
  '["invoices","comp-1"]': {
    data: [
      { id: 'INV-001', customer: 'Acme Corp', total: 1000, ... },
      { id: 'INV-002', customer: 'TechStart', total: 2000, ... },
      // ... 1000 invoices
    ],
    dataUpdatedAt: 1701234567890,
    isStale: false,
    isFetching: false,
    status: 'success'
  }
}
```

**Mutations (Updates):**

```typescript
// src/hooks/useInvoices.ts (Lines 45-56)
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      dataService.updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });
}
```

**Cache Invalidation:**
```typescript
// After update, React Query automatically:
1. Marks data as stale
2. Triggers background refetch
3. Updates all components using this query
4. No manual state management needed!
```

---

## TIER 2A: CacheManager (In-Memory LRU Cache)

### Location: `src/services/cacheManager.ts`

**Purpose:** Fast in-memory cache with LRU eviction (0-5ms access time)

### Code Implementation:

```typescript
// src/services/cacheManager.ts (Lines 14-25)
export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private accessOrder: string[]; // For LRU tracking
  private readonly maxSize: number;      // Default: 1000 entries
  private readonly defaultTTL: number;    // Default: 10 minutes

  constructor(maxSize = 1000, defaultTTL = 10 * 60 * 1000) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
```

**Get Operation:**
```typescript
// src/services/cacheManager.ts (Lines 31-50)
get<T>(key: string): T | null {
  const entry = this.cache.get(key);
  
  if (!entry) {
    return null;  // Cache miss
  }

  // Check if expired
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    this.cache.delete(key);           // Expired, remove
    this.removeFromAccessOrder(key);
    return null;
  }

  // Update access order (move to end = most recently used)
  this.updateAccessOrder(key);

  return entry.data as T;
}
```

**Set Operation:**
```typescript
// src/services/cacheManager.ts (Lines 55-69)
set<T>(key: string, data: T, ttl?: number): void {
  // Evict oldest entry if at max size
  if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
    this.evictOldest();  // Remove least recently used
  }

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttl ?? this.defaultTTL,
  };

  this.cache.set(key, entry);
  this.updateAccessOrder(key);
}
```

**LRU Eviction:**
```typescript
// src/services/cacheManager.ts (Lines 129-135)
private evictOldest(): void {
  if (this.accessOrder.length === 0) return;

  const oldestKey = this.accessOrder[0];  // First = least recently used
  this.cache.delete(oldestKey);
  this.accessOrder.shift();
}
```

**Pattern-Based Invalidation:**
```typescript
// src/services/cacheManager.ts (Lines 90-106)
invalidatePattern(pattern: string): number {
  let count = 0;
  const keysToDelete: string[] = [];

  for (const key of this.cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    this.delete(key);
    count++;
  }

  return count;
}

// Usage example:
cacheManager.invalidatePattern('invoices:'); // Clear all invoice caches
```

---

## TIER 2B: IndexedDB (Dexie.js)

### Location: `src/services/indexedDB.ts`

**Purpose:** Persistent disk storage for offline capability (10-50ms access time)

### Database Schema:

```typescript
// src/services/indexedDB.ts (Lines 134-164)
constructor() {
  super('SuperhumanQBDatabase');

  this.version(1).stores({
    // Invoices: indexed by id, companyId, status, syncStatus
    invoices: 'id, companyId, status, syncStatus, [companyId+status], cachedAt',
    
    // Bills: indexed by id, companyId, status, syncStatus
    bills: 'id, companyId, status, syncStatus, [companyId+status], cachedAt',
    
    // Transactions: indexed by id, companyId, type, status
    transactions: 'id, companyId, type, status, syncStatus, [companyId+type], cachedAt',
    
    // Journal Entries
    journalEntries: 'id, companyId, status, syncStatus, [companyId+status], cachedAt',
    
    // Customer Payments
    customerPayments: 'id, companyId, customerId, syncStatus, cachedAt',
    
    // Vendor Payments
    vendorPayments: 'id, companyId, vendorId, syncStatus, cachedAt',
    
    // Credit Memos
    creditMemos: 'id, companyId, customerId, invoiceId, status, syncStatus, [companyId+status], cachedAt',
    
    // Deposits
    deposits: 'id, companyId, depositToAccountId, syncStatus, cachedAt',
    
    // Sync Queue: auto-increment id
    syncQueue: '++id, entityType, entityId, status, createdAt',
  });
}
```

**Compound Indexes Explained:**
```typescript
'[companyId+status]'  // Compound index for fast queries like:
                      // "Get all overdue invoices for company comp-1"

// Example query using compound index:
await db.invoices
  .where('[companyId+status]')
  .equals(['comp-1', 'overdue'])
  .toArray();

// This is MUCH faster than:
await db.invoices
  .where('companyId').equals('comp-1')
  .filter(inv => inv.status === 'overdue')
  .toArray();
```

**Database Helper Functions:**

```typescript
// src/services/indexedDB.ts (Lines 179-195)
async upsert<T extends { id: string }>(
  table: Table<T, string>,
  entity: T
): Promise<string> {
  return await table.put(entity);  // Dexie's put = upsert (insert or update)
}

// Get all records for a company
async getByCompany<T extends { companyId: string }>(
  table: Table<T, string>,
  companyId: string
): Promise<T[]> {
  return await table
    .where('companyId')
    .equals(companyId)
    .toArray();
}
```

**Sync Queue Structure:**
```typescript
export interface SyncQueueItem {
  id?: number;                    // Auto-increment
  entityType: string;             // 'invoice', 'bill', etc.
  entityId: string;               // ID of the entity
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;                      // The actual data
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  attempts: number;
  lastError?: string;
}

// Usage: Queue operations when offline
await db.syncQueue.add({
  entityType: 'invoice',
  operation: 'UPDATE',
  entityId: 'INV-001',
  data: { customer: 'New Customer' },
  status: 'PENDING',
  createdAt: Date.now(),
  attempts: 0
});
```

---

## TIER 3: DataService (Orchestrator)

### Location: `src/services/dataService.ts`

**Purpose:** Orchestrates 3-tier caching strategy and handles all data operations

### Read Operation (Cache-First):

```typescript
// src/services/dataService.ts (Lines 146-204)
async getInvoices(companyId: string, filters?: any): Promise<Invoice[]> {
  const cacheKey = cacheKeys.invoiceList(companyId, filters);

  // 1. Check Memory Cache (CacheManager)
  const memoryHit = cacheManager.get<Invoice[]>(cacheKey);
  if (memoryHit) {
    console.log('[DataService] Memory cache HIT:', cacheKey);
    return memoryHit;  // ⚡ < 1ms
  }

  // 2. Check IndexedDB
  try {
    const dbResults = await dbHelpers.getByCompany<CachedInvoice>(
      db.invoices, 
      companyId
    );
    
    if (dbResults.length > 0) {
      console.log('[DataService] IndexedDB HIT:', cacheKey);
      
      // Filter out stale data
      let filtered = (dbResults as Invoice[]).filter(
        inv => inv.companyId === companyId
      );
      
      // Apply additional filters
      if (filters?.status) {
        filtered = filtered.filter(inv => inv.status === filters.status);
      }
      
      // Update memory cache
      cacheManager.set(cacheKey, filtered);
      return filtered;  // ⚡ 10-50ms
    }
  } catch (error) {
    console.warn('[DataService] IndexedDB read failed:', error);
  }

  // 3. Fetch from API
  console.log('[DataService] API fetch:', cacheKey);
  const apiResults = await apiClient.getInvoices(companyId, filters);

  // Update both caches
  cacheManager.set(cacheKey, apiResults);  // Memory cache
  
  try {
    for (const invoice of apiResults) {
      await dbHelpers.upsert(db.invoices, {
        ...invoice,
        syncStatus: 'SYNCED',
      } as CachedInvoice);
    }
  } catch (error) {
    console.warn('[DataService] IndexedDB write failed:', error);
  }

  return apiResults;  // 🌐 100-500ms
}
```

**Read Flow Diagram:**
```
User requests invoices
        ↓
1. Check CacheManager (memory)
   └─ HIT? Return in < 1ms ⚡
   └─ MISS? Continue ↓
        
2. Check IndexedDB (disk)
   └─ HIT? 
       ├─ Store in CacheManager
       └─ Return in 10-50ms ⚡
   └─ MISS? Continue ↓
        
3. Fetch from API
   ├─ Store in CacheManager
   ├─ Store in IndexedDB
   └─ Return in 100-500ms 🌐
```

### Write Operation (Write-Through):

```typescript
// src/services/dataService.ts (Lines 280-340)
async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
  // Handle temp IDs (optimistic creates)
  if (id.startsWith('temp-')) {
    // For temp invoices, get from cache/IndexedDB first
    let existing: Invoice | null = null;
    
    // Try memory cache first
    const cachedList = cacheManager.get<Invoice[]>(
      cacheKeys.invoiceList(data.companyId!)
    );
    if (cachedList) {
      existing = cachedList.find(inv => inv.id === id) || null;
    }
    
    // Try IndexedDB if not in memory
    if (!existing) {
      try {
        existing = await db.invoices.get(id) as Invoice;
      } catch (error) {
        console.warn('[DataService] Failed to get temp invoice from IndexedDB:', error);
      }
    }
    
    if (!existing) {
      throw new Error(`Invoice ${id} not found in cache or IndexedDB`);
    }
    
    // Merge the update
    const updated = { ...existing, ...data };
    
    // Update cache and IndexedDB (still pending sync)
    cacheManager.invalidatePattern('invoice');
    
    try {
      await dbHelpers.upsert(db.invoices, {
        ...updated,
        syncStatus: 'PENDING_SYNC',
      } as CachedInvoice);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }
    
    return updated;
  }

  // Regular update (not a temp ID)
  const result = await apiClient.updateInvoice(id, data);
  
  // Update both caches
  cacheManager.invalidatePattern('invoice');
  
  try {
    await dbHelpers.upsert(db.invoices, {
      ...result,
      syncStatus: 'SYNCED',
    } as CachedInvoice);
  } catch (error) {
    console.warn('[DataService] IndexedDB write failed:', error);
  }
  
  return result;
}
```

**Write Flow Diagram:**
```
User updates invoice
        ↓
1. Is it a temp ID (optimistic)?
   YES ↓
       ├─ Get from cache/IndexedDB
       ├─ Merge updates
       ├─ Mark as PENDING_SYNC
       └─ Return immediately ⚡
   NO ↓
       
2. Send to API
        ↓
3. API responds with updated data
        ↓
4. Invalidate CacheManager
        ↓
5. Update IndexedDB
        ↓
6. Mark as SYNCED
        ↓
7. Return to user
```

### Optimistic Create:

```typescript
// src/services/dataService.ts (Lines 256-278)
async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  // Generate temp ID for optimistic UI
  const tempId = `temp-${Date.now()}`;
  const optimisticInvoice: Invoice = {
    id: tempId,
    companyId: data.companyId!,
    docNumber: 'PENDING',
    ...data,
    syncStatus: 'PENDING_SYNC',
  } as Invoice;

  // Add to IndexedDB with PENDING_SYNC status
  try {
    await dbHelpers.upsert(db.invoices, {
      ...optimisticInvoice,
      syncStatus: 'PENDING_SYNC',
    } as CachedInvoice);
  } catch (error) {
    console.warn('[DataService] Optimistic IndexedDB write failed:', error);
  }

  // Invalidate memory cache so it refetches with new item
  cacheManager.invalidatePattern('invoice');

  // Return optimistic invoice immediately (API call happens in background)
  return optimisticInvoice;
}
```

**Optimistic Create Flow:**
```
User clicks "Create Invoice"
        ↓
1. Generate temp ID: "temp-1701234567890"
        ↓
2. Create optimistic invoice with temp ID
        ↓
3. Store in IndexedDB with PENDING_SYNC
        ↓
4. Invalidate memory cache
        ↓
5. Return optimistic invoice ⚡ INSTANT!
        ↓
6. UI shows new invoice immediately
        ↓
        
Later (background):
7. React Query mutation sends to API
        ↓
8. API returns real ID: "INV-12345"
        ↓
9. Replace temp invoice with real one
        ↓
10. Update IndexedDB with real ID
        ↓
11. Mark as SYNCED
```

---

## Real-World Example: Complete Flow

### Scenario: User Opens Invoices Page

```typescript
// 1. Component renders
function Invoices() {
  const { data: invoices, isLoading } = useInvoices('comp-1');
  // ... rest of component
}

// 2. React Query checks its cache
// Query key: ['invoices', 'comp-1']
// Result: MISS (first visit)

// 3. React Query calls query function
// queryFn: () => dataService.getInvoices('comp-1')

// 4. DataService.getInvoices executes
const cacheKey = 'invoices:comp-1';

// 5. Check CacheManager (memory)
const memoryHit = cacheManager.get(cacheKey);
// Result: MISS

// 6. Check IndexedDB
const dbResults = await db.invoices
  .where('companyId')
  .equals('comp-1')
  .toArray();
// Result: HIT! (from previous session)
// Returns: 1000 invoices in 50ms

// 7. Store in CacheManager
cacheManager.set(cacheKey, dbResults);

// 8. Return to React Query
// React Query stores in its cache

// 9. Component re-renders with data
// User sees 1000 invoices ⚡ 50ms total!

// 10. Background refetch starts (automatic)
const apiResults = await apiClient.getInvoices('comp-1');
// Takes 200ms

// 11. API returns (might have updates)
// Update IndexedDB
// Update CacheManager
// React Query updates cache
// Component re-renders if data changed
```

**Timeline:**
- **0ms**: User clicks "Invoices"
- **50ms**: Data displayed from IndexedDB ✅
- **250ms**: Background API check complete
- **User Experience**: Instant! ⚡

---

## Performance Characteristics

### Access Speed:

| Layer | Read Speed | Write Speed | Example |
|-------|-----------|-------------|---------|
| **React Query** | < 1ms | < 1ms | queryClient.getQueryData() |
| **CacheManager** | 0-5ms | 0-5ms | cacheManager.get(key) |
| **IndexedDB** | 10-50ms | 10-50ms | db.invoices.toArray() |
| **API** | 100-500ms | 100-500ms | apiClient.get('/invoices') |

### Storage Capacity:

| Layer | Capacity | Persistence | Shared Across Tabs |
|-------|----------|-------------|-------------------|
| **React Query** | ~500 MB | Until refresh | ❌ No |
| **CacheManager** | 1000 entries | Until refresh | ❌ No |
| **IndexedDB** | Several GB | Forever | ✅ Yes |
| **API** | Unlimited | Forever | ✅ Yes |

---

## Cache Keys Strategy

```typescript
// src/services/dataService.ts (Lines 115-136)
const cacheKeys = {
  invoiceList: (companyId: string, filters?: any) => 
    `invoices:${companyId}${filters ? ':' + JSON.stringify(filters) : ''}`,
  invoice: (id: string) => `invoice:${id}`,
  
  billList: (companyId: string, filters?: any) => 
    `bills:${companyId}${filters ? ':' + JSON.stringify(filters) : ''}`,
  bill: (id: string) => `bill:${id}`,
  
  transactionList: (companyId: string, filters?: any) => 
    `transactions:${companyId}${filters ? ':' + JSON.stringify(filters) : ''}`,
  transaction: (id: string) => `transaction:${id}`,
  
  // ... more entity keys
};

// Examples:
// 'invoices:comp-1'
// 'invoices:comp-1:{"status":"overdue"}'
// 'invoice:INV-001'
```

**Why This Matters:**
- Unique keys prevent cache collisions
- Pattern-based invalidation (`invoices:` clears all invoice caches)
- Filters included in key (different filters = different cache)

---

## Offline Support

### When User Goes Offline:

```typescript
// 1. User updates invoice while offline
await dataService.updateInvoice('INV-001', { customer: 'New Customer' });

// 2. DataService detects offline (API call fails)
try {
  const result = await apiClient.updateInvoice(id, data);
} catch (error) {
  // Network error
  if (!navigator.onLine) {
    // Add to sync queue
    await db.syncQueue.add({
      entityType: 'invoice',
      operation: 'UPDATE',
      entityId: id,
      data,
      status: 'PENDING',
      createdAt: Date.now(),
      attempts: 0
    });
    
    // Update IndexedDB anyway (local cache)
    await db.invoices.update(id, {
      ...data,
      syncStatus: 'PENDING_SYNC'
    });
  }
}

// 3. User sees update immediately (from IndexedDB)
// 4. Sync queue stores the operation
// 5. When online, sync queue is processed
```

### When User Comes Online:

```typescript
// Connection restored
window.addEventListener('online', async () => {
  // Get all pending operations
  const pending = await db.syncQueue
    .where('status')
    .equals('PENDING')
    .sortBy('createdAt');
  
  // Process each operation
  for (const item of pending) {
    try {
      switch (item.operation) {
        case 'CREATE':
          await apiClient.createInvoice(item.data);
          break;
        case 'UPDATE':
          await apiClient.updateInvoice(item.entityId, item.data);
          break;
        case 'DELETE':
          await apiClient.deleteInvoice(item.entityId);
          break;
      }
      
      // Mark as completed
      await db.syncQueue.update(item.id!, { status: 'COMPLETED' });
    } catch (error) {
      // Mark as failed, increment attempts
      await db.syncQueue.update(item.id!, {
        status: 'FAILED',
        attempts: item.attempts + 1,
        lastError: error.message
      });
    }
  }
});
```

---

## Summary

### Code Locations:

| Component | File | Purpose |
|-----------|------|---------|
| **React Query Hooks** | `src/hooks/useInvoices.ts` | Memory cache integration |
| **CacheManager** | `src/services/cacheManager.ts` | LRU in-memory cache |
| **IndexedDB** | `src/services/indexedDB.ts` | Persistent disk storage |
| **DataService** | `src/services/dataService.ts` | Orchestrates all caching |
| **API Client** | `src/services/apiClient.ts` | HTTP communication |

### Data Flow:
```
Component → useInvoices → React Query → DataService
                                            ↓
                              ┌─────────────┴─────────────┐
                              ↓                           ↓
                        CacheManager                  IndexedDB
                        (0-5ms)                       (10-50ms)
                              ↓                           ↓
                              └─────────────┬─────────────┘
                                            ↓
                                       API Client
                                       (100-500ms)
```

### Key Benefits:
- ⚡ **Instant UI updates** - Optimistic updates
- 💾 **Offline capable** - IndexedDB + sync queue
- 🔄 **Automatic sync** - React Query background refetch
- 🚀 **Fast reads** - 3-tier caching
- 📦 **Large datasets** - Handles 10,000+ items
- 🔧 **No manual state** - React Query manages everything

---

**END OF TECHNICAL GUIDE**
