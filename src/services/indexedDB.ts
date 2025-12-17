/**
 * IndexedDB - Dexie.js wrapper for persistent cache
 * 
 * Stores all entities as a CACHE (not source of truth).
 * Backend API is the authoritative source.
 * Provides fast reads (10-30ms) and offline support.
 */

import Dexie, { Table } from 'dexie';

// Entity interfaces (will be moved to types/entities.ts later)
export interface CachedInvoice {
  id: string;
  companyId: string;
  customerId: string;
  txnDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any; // Allow additional fields
}

export interface CachedBill {
  id: string;
  companyId: string;
  vendorId: string;
  txnDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface CachedTransaction {
  id: string;
  companyId: string;
  txnDate: string;
  type: string;
  status: string;
  amount: number;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface CachedJournalEntry {
  id: string;
  companyId: string;
  txnDate: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface CachedCustomerPayment {
  id: string;
  companyId: string;
  customerId: string;
  txnDate: string;
  amount: number;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface CachedVendorPayment {
  id: string;
  companyId: string;
  vendorId: string;
  txnDate: string;
  amount: number;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface CachedCreditMemo {
  id: string;
  companyId: string;
  customerId: string;
  invoiceId?: string; // Optional reference to invoice being credited
  txnDate: string;
  totalAmount: number;
  status: string;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface CachedDeposit {
  id: string;
  companyId: string;
  txnDate: string;
  depositToAccountId: string;
  totalAmount: number;
  memo?: string;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'FAILED';
  cachedAt: number;
  [key: string]: any;
}

export interface SyncQueueItem {
  id?: number; // Auto-increment
  entityType: 'invoice' | 'bill' | 'transaction' | 'journalEntry' | 'customerPayment' | 'vendorPayment' | 'creditMemo' | 'deposit';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: number;
  status: 'PENDING' | 'PROCESSING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

/**
 * Database class extending Dexie
 */
export class AppDatabase extends Dexie {
  invoices!: Table<CachedInvoice, string>;
  bills!: Table<CachedBill, string>;
  transactions!: Table<CachedTransaction, string>;
  journalEntries!: Table<CachedJournalEntry, string>;
  customerPayments!: Table<CachedCustomerPayment, string>;
  vendorPayments!: Table<CachedVendorPayment, string>;
  creditMemos!: Table<CachedCreditMemo, string>;
  deposits!: Table<CachedDeposit, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('SuperhumanQBDatabase');

    this.version(1).stores({
      // Invoices: indexed by id, companyId, status, syncStatus
      invoices: 'id, companyId, status, syncStatus, [companyId+status], cachedAt',
      
      // Bills: indexed by id, companyId, status, syncStatus
      bills: 'id, companyId, status, syncStatus, [companyId+status], cachedAt',
      
      // Transactions: indexed by id, companyId, type, status
      transactions: 'id, companyId, type, status, syncStatus, [companyId+type], cachedAt',
      
      // Journal Entries: indexed by id, companyId, status
      journalEntries: 'id, companyId, status, syncStatus, [companyId+status], cachedAt',
      
      // Customer Payments: indexed by id, companyId, syncStatus
      customerPayments: 'id, companyId, customerId, syncStatus, cachedAt',
      
      // Vendor Payments: indexed by id, companyId, syncStatus
      vendorPayments: 'id, companyId, vendorId, syncStatus, cachedAt',
      
      // Credit Memos: indexed by id, companyId, invoiceId, status, syncStatus
      creditMemos: 'id, companyId, customerId, invoiceId, status, syncStatus, [companyId+status], cachedAt',
      
      // Deposits: indexed by id, companyId, depositToAccountId, syncStatus
      deposits: 'id, companyId, depositToAccountId, syncStatus, cachedAt',
      
      // Sync Queue: auto-increment id, indexed by status and createdAt
      syncQueue: '++id, entityType, entityId, status, createdAt',
    });
  }
}

// Export singleton instance
export const db = new AppDatabase();

/**
 * Helper functions for common operations
 */

export const dbHelpers = {
  /**
   * Add or update entity in cache
   */
  async upsert<T extends { id: string }>(
    table: Table<T, string>,
    entity: T
  ): Promise<void> {
    await table.put({ ...entity, cachedAt: Date.now() } as T);
  },

  /**
   * Get entity by id
   */
  async getById<T>(
    table: Table<T, string>,
    id: string
  ): Promise<T | undefined> {
    return table.get(id);
  },

  /**
   * Get all entities for a company
   */
  async getByCompany<T extends { companyId: string }>(
    table: Table<T, string>,
    companyId: string
  ): Promise<T[]> {
    return table.where('companyId').equals(companyId).toArray();
  },

  /**
   * Delete entity by id
   */
  async deleteById<T>(
    table: Table<T, string>,
    id: string
  ): Promise<void> {
    await table.delete(id);
  },

  /**
   * Clear all data from a table
   */
  async clearTable<T>(table: Table<T, any>): Promise<void> {
    await table.clear();
  },

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
    const id = await db.syncQueue.add(item as SyncQueueItem);
    // Notify sync status listeners
    window.dispatchEvent(new CustomEvent('syncQueueChange'));
    return id;
  },

  /**
   * Get pending sync queue items
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return db.syncQueue.where('status').equals('PENDING').toArray();
  },

  /**
   * Update sync queue item status
   */
  async updateSyncQueueItem(
    id: number,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    await db.syncQueue.update(id, updates);
    // Notify sync status listeners
    window.dispatchEvent(new CustomEvent('syncQueueChange'));
  },

  /**
   * Delete sync queue item
   */
  async deleteSyncQueueItem(id: number): Promise<void> {
    await db.syncQueue.delete(id);
    // Notify sync status listeners
    window.dispatchEvent(new CustomEvent('syncQueueChange'));
  },

  /**
   * Clear old cache entries (older than specified days)
   */
  async clearOldCache(daysOld = 7): Promise<void> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    await Promise.all([
      db.invoices.where('cachedAt').below(cutoffTime).delete(),
      db.bills.where('cachedAt').below(cutoffTime).delete(),
      db.transactions.where('cachedAt').below(cutoffTime).delete(),
      db.journalEntries.where('cachedAt').below(cutoffTime).delete(),
      db.customerPayments.where('cachedAt').below(cutoffTime).delete(),
      db.vendorPayments.where('cachedAt').below(cutoffTime).delete(),
      db.creditMemos.where('cachedAt').below(cutoffTime).delete(),
      db.deposits.where('cachedAt').below(cutoffTime).delete(),
    ]);
  },
};
