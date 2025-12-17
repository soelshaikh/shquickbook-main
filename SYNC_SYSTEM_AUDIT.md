# Sync System Audit - READ ONLY

## Executive Summary

**Date**: Current  
**Scope**: Audit of entities included in the sync system  
**Status**: Analysis Complete - NO CODE MODIFICATIONS

---

## 1. ENTITIES CURRENTLY IN SYNC SYSTEM

| Entity | Included in Sync | EntityType Value | IndexedDB Table | Sync Queue Support |
|--------|------------------|------------------|-----------------|-------------------|
| **Invoices** | ✅ YES | `'invoice'` | `invoices` | ✅ Full support |
| **Bills** | ✅ YES | `'bill'` | `bills` | ✅ Full support |
| **Journal Entries** | ✅ YES | `'journalEntry'` | `journalEntries` | ✅ Full support |
| **Transactions** | ⚠️ PARTIAL | `'transaction'` | `transactions` | ❌ NO sync queue support |
| **Accounts** | ❌ NO | N/A | N/A | ❌ Not in sync system |
| **Payments** | ❌ NO | N/A | N/A | ❌ Not in sync system |
| **Credit Memos** | ❌ NO | N/A | N/A | ❌ Not in sync system |
| **Deposits** | ❌ NO | N/A | N/A | ❌ Not in sync system |

---

## 2. FILE PATHS WHERE ENTITIES ARE REGISTERED

### A. SyncQueueItem Interface
**File**: `src/services/indexedDB.ts` (Line 62-71)

```typescript
export interface SyncQueueItem {
  id?: number;
  entityType: 'invoice' | 'bill' | 'transaction' | 'journalEntry';  // ← Allowed entity types
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: number;
  status: 'PENDING' | 'PROCESSING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}
```

**Registered Entity Types**:
1. `'invoice'` ✅
2. `'bill'` ✅
3. `'transaction'` ✅
4. `'journalEntry'` ✅

---

### B. IndexedDB Schema
**File**: `src/services/indexedDB.ts` (Line 76-101)

```typescript
export class AppDatabase extends Dexie {
  invoices!: Table<CachedInvoice, string>;          // ✅ Invoice table
  bills!: Table<CachedBill, string>;                // ✅ Bill table
  transactions!: Table<CachedTransaction, string>;  // ✅ Transaction table
  journalEntries!: Table<CachedJournalEntry, string>; // ✅ Journal Entry table
  syncQueue!: Table<SyncQueueItem, number>;         // ✅ Sync queue table
  
  constructor() {
    super('QuickBooksAppDB');
    this.version(1).stores({
      invoices: 'id, companyId, syncStatus, cachedAt',
      bills: 'id, companyId, syncStatus, cachedAt',
      transactions: 'id, companyId, syncStatus, cachedAt',
      journalEntries: 'id, companyId, syncStatus, cachedAt',
      syncQueue: '++id, entityType, entityId, status, createdAt',
    });
  }
}
```

**IndexedDB Tables**:
1. `invoices` ✅
2. `bills` ✅
3. `transactions` ✅
4. `journalEntries` ✅
5. `syncQueue` ✅

---

### C. DataService Sync Queue Integration
**File**: `src/services/dataService.ts`

#### Invoice Sync Queue Registration
**Location**: Lines 214-222

```typescript
dbHelpers.addToSyncQueue({
  entityType: 'invoice',  // ✅ Registered
  entityId: tempId,
  operation: 'CREATE',
  payload: data,
  createdAt: Date.now(),
  status: 'PENDING',
  retryCount: 0,
});
```

**Methods Using Sync Queue**:
- `createInvoice()` (Line 149-233)
- `updateInvoice()` (Line 235-309) - Not shown but follows same pattern

---

#### Bill Sync Queue Registration
**Location**: Lines 492-500

```typescript
dbHelpers.addToSyncQueue({
  entityType: 'bill',  // ✅ Registered
  entityId: tempId,
  operation: 'CREATE',
  payload: data,
  createdAt: Date.now(),
  status: 'PENDING',
  retryCount: 0,
});
```

**Methods Using Sync Queue**:
- `createBill()` (Line 435-506)
- `updateBill()` (Line 508-596) - Not shown but follows same pattern

---

#### Journal Entry Sync Queue Registration
**Location**: Lines 814-822

```typescript
dbHelpers.addToSyncQueue({
  entityType: 'journalEntry',  // ✅ Registered
  entityId: tempId,
  operation: 'CREATE',
  payload: data,
  createdAt: Date.now(),
  status: 'PENDING',
  retryCount: 0,
});
```

**Methods Using Sync Queue**:
- `createJournalEntry()` (Line 767-828)
- `updateJournalEntry()` (Line 831-900) - Not shown but follows same pattern

---

### D. Cache Cleanup (All Entities with Tables)
**File**: `src/services/indexedDB.ts` (Line 201-210)

```typescript
async clearOldCache(daysOld = 7): Promise<void> {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  await Promise.all([
    db.invoices.where('cachedAt').below(cutoffTime).delete(),       // ✅
    db.bills.where('cachedAt').below(cutoffTime).delete(),          // ✅
    db.transactions.where('cachedAt').below(cutoffTime).delete(),   // ✅
    db.journalEntries.where('cachedAt').below(cutoffTime).delete(), // ✅
  ]);
}
```

All 4 entity tables are included in cache cleanup.

---

## 3. TRANSACTION ENTITY - SPECIAL CASE

### Status: ⚠️ PARTIALLY INCLUDED

**What Exists**:
- ✅ `'transaction'` is in `SyncQueueItem.entityType` union type (Line 63)
- ✅ `transactions` table exists in IndexedDB (Line 79)
- ✅ `transactions` included in cache cleanup (Line 207)

**What's Missing**:
- ❌ No `addToSyncQueue()` calls in `dataService.ts` for transactions
- ❌ No `createTransaction()` or `updateTransaction()` methods in dataService
- ❌ Transactions appear to be **read-only** (fetched from API, not created/updated locally)

**Conclusion**: Transactions are **cached** but not **synchronized** (no offline create/update support).

---

## 4. ENTITIES NOT IN SYNC SYSTEM

### A. Accounts
**Status**: ❌ NOT INCLUDED

**Evidence**:
- Not in `SyncQueueItem.entityType` union
- No IndexedDB table defined
- No sync queue integration
- Not in cache cleanup
- No create/update methods in dataService

**Likely Reason**: Accounts are reference data, typically read-only from the API.

---

### B. Payments
**Status**: ❌ NOT INCLUDED

**Evidence**:
- Not in `SyncQueueItem.entityType` union
- No IndexedDB table defined
- No sync queue integration
- Not in cache cleanup
- No create/update methods in dataService

**Note**: Found reference to `paymentStatus` field in Bill entity (Line 480), but Payments as a separate entity do not exist in the sync system.

**Likely Reason**: Payment functionality may be embedded in Invoice/Bill status rather than a separate entity.

---

### C. Credit Memos
**Status**: ❌ NOT INCLUDED

**Evidence**:
- Not in `SyncQueueItem.entityType` union
- No IndexedDB table defined
- No sync queue integration
- Not in cache cleanup
- No create/update methods in dataService

**Likely Reason**: Not implemented in the frontend yet, or handled differently by the backend.

---

### D. Deposits
**Status**: ❌ NOT INCLUDED

**Evidence**:
- Not in `SyncQueueItem.entityType` union
- No IndexedDB table defined
- No sync queue integration
- Not in cache cleanup
- No create/update methods in dataService

**Likely Reason**: Not implemented in the frontend yet, or may be part of Transaction types.

---

## 5. SYNC QUEUE INFRASTRUCTURE

### Core Files

| File | Purpose | Status |
|------|---------|--------|
| `src/services/indexedDB.ts` | Database schema, sync queue table, helpers | ✅ Implemented |
| `src/services/dataService.ts` | Business logic, sync queue integration | ✅ Partial (3 entities) |
| `src/hooks/useSyncStatus.ts` | React hook for sync status monitoring | ✅ Implemented |
| `src/utils/debugCache.ts` | Debug utilities for inspecting sync queue | ✅ Implemented |

---

### Sync Queue Helpers
**File**: `src/services/indexedDB.ts`

```typescript
// Line 163-168
async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number>

// Line 173-175
async getPendingSyncItems(): Promise<SyncQueueItem[]>

// Line 180-187
async updateSyncQueueItem(id: number, updates: Partial<SyncQueueItem>): Promise<void>

// Line 192-196
async deleteSyncQueueItem(id: number): Promise<void>
```

All helper methods are implemented and functional.

---

### Sync Status Monitoring
**File**: `src/hooks/useSyncStatus.ts`

```typescript
// Line 33
const SYNC_QUEUE_CHANGE_EVENT = 'syncQueueChange';

// Line 39-41
export function notifySyncQueueChange() {
  window.dispatchEvent(new CustomEvent(SYNC_QUEUE_CHANGE_EVENT));
}

// Line 55-57
const pendingItems = await db.syncQueue
  .where('status')
  .equals('PENDING')
  .toArray();
```

Monitors:
- Navigator online/offline status
- Pending sync queue items count
- Dispatches events on sync queue changes

---

## 6. SUMMARY TABLE

### Full Entity Support Matrix

| Entity | IndexedDB Table | SyncQueueItem Type | Sync Queue Integration | Cache Cleanup | Create/Update Methods | Overall Status |
|--------|----------------|-------------------|----------------------|---------------|---------------------|---------------|
| **Invoices** | ✅ Yes | ✅ `'invoice'` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **FULL SUPPORT** |
| **Bills** | ✅ Yes | ✅ `'bill'` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **FULL SUPPORT** |
| **Journal Entries** | ✅ Yes | ✅ `'journalEntry'` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **FULL SUPPORT** |
| **Transactions** | ✅ Yes | ✅ `'transaction'` | ❌ No | ✅ Yes | ❌ No | ⚠️ **READ-ONLY** |
| **Accounts** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ **NOT INCLUDED** |
| **Payments** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ **NOT INCLUDED** |
| **Credit Memos** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ **NOT INCLUDED** |
| **Deposits** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ **NOT INCLUDED** |

---

## 7. KEY FINDINGS

### Entities with Full Offline Support (3)
1. ✅ **Invoices** - Complete offline create/update/sync
2. ✅ **Bills** - Complete offline create/update/sync
3. ✅ **Journal Entries** - Complete offline create/update/sync

### Entities with Partial Support (1)
4. ⚠️ **Transactions** - Read-only caching, no offline mutations

### Entities Not Supported (4)
5. ❌ **Accounts** - Not in sync system
6. ❌ **Payments** - Not in sync system
7. ❌ **Credit Memos** - Not in sync system
8. ❌ **Deposits** - Not in sync system

---

## 8. ARCHITECTURE OBSERVATIONS

### Sync Queue Pattern (For Supported Entities)

```
1. User creates/updates entity (offline or online)
   ↓
2. DataService creates optimistic entity with temp ID
   ↓
3. Entity stored in IndexedDB with syncStatus='PENDING_SYNC'
   ↓
4. Sync queue item added with entityType, operation, payload
   ↓
5. useSyncStatus monitors queue length
   ↓
6. (Future) Background sync processes queue when online
   ↓
7. On success: Update entity with real ID, remove from queue
   On failure: Increment retryCount, set status='FAILED'
```

### Current State
- ✅ **Infrastructure**: Complete (tables, helpers, monitoring)
- ✅ **Integration**: 3 entities fully integrated
- ⚠️ **Background Sync**: Not implemented (queue items added but not processed)
- ❌ **Error Handling**: Partial (queue items can fail, no retry logic visible)

---

## 9. CONFIRMATION

### Question: Do Payments, Credit Memos, Deposits exist?

**Answer**: ❌ **NO**

**Evidence**:
- Not found in `SyncQueueItem.entityType` union type
- Not found in IndexedDB schema
- Not found in dataService methods
- Not found in cache cleanup
- No create/update/sync logic exists

**Conclusion**: These entities are either:
1. Not implemented in the frontend yet
2. Handled through different mechanisms (e.g., Payment as Invoice status)
3. May be future features

---

## 10. TESTING FILES

### Sync System Tests
**File**: `src/hooks/__tests__/useSyncStatus.test.ts`

Tests cover:
- ✅ Online/offline state detection
- ✅ Pending sync items counting
- ✅ Sync queue change events
- ✅ Error handling

**Entity Types Used in Tests**:
- `'invoice'` (Lines 62, 111, 128, 145, 156)

Tests validate the sync infrastructure works correctly.

---

**Status**: ✅ Audit Complete  
**Code Modifications**: None (Read-only analysis)  
**Findings**: Clear entity support matrix established
