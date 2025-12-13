/**
 * DataService - 3-tier cache orchestrator
 * 
 * SINGLE ENTRY POINT for all data operations.
 * Implements cache hierarchy: Memory → IndexedDB → API
 * Handles optimistic updates and cache invalidation.
 */

import { cacheManager } from './cacheManager';
import { db, dbHelpers, CachedInvoice, CachedBill, CachedTransaction, CachedJournalEntry } from './indexedDB';
import { apiClient } from './apiClient';
import type { Invoice } from '@/data/mockInvoices';
import type { Bill } from '@/data/mockBills';
import type { Transaction } from '@/data/mockTransactions';
import type { JournalEntry } from '@/data/mockJournalEntries';

/**
 * Cache key builders
 */
const cacheKeys = {
  invoiceList: (companyId: string, filters?: any) => 
    `invoices:${companyId}:${JSON.stringify(filters || {})}`,
  invoice: (id: string) => `invoice:${id}`,
  billList: (companyId: string, filters?: any) => 
    `bills:${companyId}:${JSON.stringify(filters || {})}`,
  bill: (id: string) => `bill:${id}`,
  transactionList: (companyId: string, filters?: any) => 
    `transactions:${companyId}:${JSON.stringify(filters || {})}`,
  transaction: (id: string) => `transaction:${id}`,
  journalEntryList: (companyId: string, filters?: any) => 
    `journalEntries:${companyId}:${JSON.stringify(filters || {})}`,
  journalEntry: (id: string) => `journalEntry:${id}`,
};

/**
 * DataService class
 */
class DataService {
  // --- INVOICES ---

  /**
   * Get invoices with 3-tier cache
   */
  async getInvoices(companyId: string, filters?: any): Promise<Invoice[]> {
    const cacheKey = cacheKeys.invoiceList(companyId, filters);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<Invoice[]>(cacheKey);
    if (memoryHit) {
      console.log('[DataService] Memory cache HIT:', cacheKey);
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResults = await dbHelpers.getByCompany<CachedInvoice>(db.invoices, companyId);
      
      if (dbResults.length > 0) {
        console.log('[DataService] IndexedDB HIT:', cacheKey);
        
        // Apply filters
        let filtered = dbResults as Invoice[];
        if (filters?.status) {
          filtered = filtered.filter(inv => inv.status === filters.status);
        }
        
        // Update memory cache
        cacheManager.set(cacheKey, filtered);
        return filtered;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    console.log('[DataService] API fetch:', cacheKey);
    const apiResults = await apiClient.getInvoices(companyId, filters);

    // Update both caches
    cacheManager.set(cacheKey, apiResults);
    
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

    return apiResults;
  }

  /**
   * Get single invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const cacheKey = cacheKeys.invoice(id);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<Invoice>(cacheKey);
    if (memoryHit) {
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResult = await dbHelpers.getById(db.invoices, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as Invoice);
        return dbResult as Invoice;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    const apiResult = await apiClient.getInvoiceById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      
      try {
        await dbHelpers.upsert(db.invoices, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedInvoice);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  /**
   * Create invoice with optimistic update
   */
  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    // Call API to get real ID
    const newInvoice = await apiClient.createInvoice(data);

    // Update caches
    const cacheKey = cacheKeys.invoice(newInvoice.id);
    cacheManager.set(cacheKey, newInvoice);

    try {
      await dbHelpers.upsert(db.invoices, {
        ...newInvoice,
        syncStatus: 'SYNCED',
      } as CachedInvoice);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    // Invalidate list caches
    this.invalidateInvoiceLists();

    return newInvoice;
  }

  /**
   * Optimistic create (for immediate UI update)
   */
  optimisticCreateInvoice(tempId: string, data: Partial<Invoice>): void {
    const optimisticInvoice: Invoice = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      totalAmount: data.totalAmount || 0,
      status: 'DRAFT',
      lines: data.lines || [],
      ...data,
    };

    // Add to memory cache immediately
    const cacheKey = cacheKeys.invoice(tempId);
    cacheManager.set(cacheKey, optimisticInvoice);

    // Add to IndexedDB with PENDING_SYNC status
    try {
      dbHelpers.upsert(db.invoices, {
        ...optimisticInvoice,
        syncStatus: 'PENDING_SYNC',
      } as CachedInvoice);

      // Add to sync queue
      dbHelpers.addToSyncQueue({
        entityType: 'invoice',
        entityId: tempId,
        operation: 'CREATE',
        payload: data,
        createdAt: Date.now(),
        status: 'PENDING',
        retryCount: 0,
      });
    } catch (error) {
      console.warn('[DataService] Optimistic IndexedDB write failed:', error);
    }

    // Invalidate list caches so they refetch
    this.invalidateInvoiceLists();
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const updatedInvoice = await apiClient.updateInvoice(id, data);

    // Update caches
    const cacheKey = cacheKeys.invoice(id);
    cacheManager.set(cacheKey, updatedInvoice);

    try {
      await dbHelpers.upsert(db.invoices, {
        ...updatedInvoice,
        syncStatus: 'SYNCED',
      } as CachedInvoice);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    // Invalidate list caches
    this.invalidateInvoiceLists();

    return updatedInvoice;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    await apiClient.deleteInvoice(id);

    // Remove from caches
    cacheManager.delete(cacheKeys.invoice(id));

    try {
      await dbHelpers.deleteById(db.invoices, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    // Invalidate list caches
    this.invalidateInvoiceLists();
  }

  /**
   * Rollback optimistic create
   */
  rollbackInvoice(tempId: string): void {
    cacheManager.delete(cacheKeys.invoice(tempId));

    try {
      dbHelpers.deleteById(db.invoices, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }

    this.invalidateInvoiceLists();
  }

  private invalidateInvoiceLists(): void {
    cacheManager.invalidatePattern('invoices:');
  }

  // --- BILLS ---

  async getBills(companyId: string, filters?: any): Promise<Bill[]> {
    const cacheKey = cacheKeys.billList(companyId, filters);

    const memoryHit = cacheManager.get<Bill[]>(cacheKey);
    if (memoryHit) {
      return memoryHit;
    }

    try {
      const dbResults = await dbHelpers.getByCompany<CachedBill>(db.bills, companyId);
      if (dbResults.length > 0) {
        let filtered = dbResults as Bill[];
        if (filters?.status) {
          filtered = filtered.filter(bill => bill.status === filters.status);
        }
        cacheManager.set(cacheKey, filtered);
        return filtered;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    const apiResults = await apiClient.getBills(companyId, filters);
    cacheManager.set(cacheKey, apiResults);

    try {
      for (const bill of apiResults) {
        await dbHelpers.upsert(db.bills, {
          ...bill,
          syncStatus: 'SYNCED',
        } as CachedBill);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  async getBillById(id: string): Promise<Bill | null> {
    const cacheKey = cacheKeys.bill(id);

    const memoryHit = cacheManager.get<Bill>(cacheKey);
    if (memoryHit) return memoryHit;

    try {
      const dbResult = await dbHelpers.getById(db.bills, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as Bill);
        return dbResult as Bill;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    const apiResult = await apiClient.getBillById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      try {
        await dbHelpers.upsert(db.bills, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedBill);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  async createBill(data: Partial<Bill>): Promise<Bill> {
    const newBill = await apiClient.createBill(data);
    const cacheKey = cacheKeys.bill(newBill.id);
    cacheManager.set(cacheKey, newBill);

    try {
      await dbHelpers.upsert(db.bills, {
        ...newBill,
        syncStatus: 'SYNCED',
      } as CachedBill);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateBillLists();
    return newBill;
  }

  optimisticCreateBill(tempId: string, data: Partial<Bill>): void {
    const optimisticBill: Bill = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || '',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      totalAmount: data.totalAmount || 0,
      status: 'DRAFT',
      lines: data.lines || [],
      ...data,
    };

    cacheManager.set(cacheKeys.bill(tempId), optimisticBill);

    try {
      dbHelpers.upsert(db.bills, {
        ...optimisticBill,
        syncStatus: 'PENDING_SYNC',
      } as CachedBill);

      dbHelpers.addToSyncQueue({
        entityType: 'bill',
        entityId: tempId,
        operation: 'CREATE',
        payload: data,
        createdAt: Date.now(),
        status: 'PENDING',
        retryCount: 0,
      });
    } catch (error) {
      console.warn('[DataService] Optimistic write failed:', error);
    }

    this.invalidateBillLists();
  }

  async updateBill(id: string, data: Partial<Bill>): Promise<Bill> {
    const updatedBill = await apiClient.updateBill(id, data);
    cacheManager.set(cacheKeys.bill(id), updatedBill);

    try {
      await dbHelpers.upsert(db.bills, {
        ...updatedBill,
        syncStatus: 'SYNCED',
      } as CachedBill);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateBillLists();
    return updatedBill;
  }

  async deleteBill(id: string): Promise<void> {
    await apiClient.deleteBill(id);
    cacheManager.delete(cacheKeys.bill(id));

    try {
      await dbHelpers.deleteById(db.bills, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    this.invalidateBillLists();
  }

  rollbackBill(tempId: string): void {
    cacheManager.delete(cacheKeys.bill(tempId));
    try {
      dbHelpers.deleteById(db.bills, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }
    this.invalidateBillLists();
  }

  private invalidateBillLists(): void {
    cacheManager.invalidatePattern('bills:');
  }

  // --- TRANSACTIONS (Read-only) ---

  async getTransactions(companyId: string, filters?: any): Promise<Transaction[]> {
    const cacheKey = cacheKeys.transactionList(companyId, filters);

    const memoryHit = cacheManager.get<Transaction[]>(cacheKey);
    if (memoryHit) return memoryHit;

    try {
      const dbResults = await dbHelpers.getByCompany<CachedTransaction>(db.transactions, companyId);
      if (dbResults.length > 0) {
        let filtered = dbResults as Transaction[];
        if (filters?.type) {
          filtered = filtered.filter(txn => txn.type === filters.type);
        }
        if (filters?.status) {
          filtered = filtered.filter(txn => txn.status === filters.status);
        }
        cacheManager.set(cacheKey, filtered);
        return filtered;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    const apiResults = await apiClient.getTransactions(companyId, filters);
    cacheManager.set(cacheKey, apiResults);

    try {
      for (const txn of apiResults) {
        await dbHelpers.upsert(db.transactions, {
          ...txn,
          syncStatus: 'SYNCED',
        } as CachedTransaction);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const cacheKey = cacheKeys.transaction(id);

    const memoryHit = cacheManager.get<Transaction>(cacheKey);
    if (memoryHit) return memoryHit;

    try {
      const dbResult = await dbHelpers.getById(db.transactions, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as Transaction);
        return dbResult as Transaction;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    const apiResult = await apiClient.getTransactionById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      try {
        await dbHelpers.upsert(db.transactions, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedTransaction);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  // --- JOURNAL ENTRIES ---

  async getJournalEntries(companyId: string, filters?: any): Promise<JournalEntry[]> {
    const cacheKey = cacheKeys.journalEntryList(companyId, filters);

    const memoryHit = cacheManager.get<JournalEntry[]>(cacheKey);
    if (memoryHit) return memoryHit;

    try {
      const dbResults = await dbHelpers.getByCompany<CachedJournalEntry>(db.journalEntries, companyId);
      if (dbResults.length > 0) {
        let filtered = dbResults as JournalEntry[];
        if (filters?.status) {
          filtered = filtered.filter(je => je.status === filters.status);
        }
        cacheManager.set(cacheKey, filtered);
        return filtered;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    const apiResults = await apiClient.getJournalEntries(companyId, filters);
    cacheManager.set(cacheKey, apiResults);

    try {
      for (const je of apiResults) {
        await dbHelpers.upsert(db.journalEntries, {
          ...je,
          syncStatus: 'SYNCED',
        } as CachedJournalEntry);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | null> {
    const cacheKey = cacheKeys.journalEntry(id);

    const memoryHit = cacheManager.get<JournalEntry>(cacheKey);
    if (memoryHit) return memoryHit;

    try {
      const dbResult = await dbHelpers.getById(db.journalEntries, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as JournalEntry);
        return dbResult as JournalEntry;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    const apiResult = await apiClient.getJournalEntryById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      try {
        await dbHelpers.upsert(db.journalEntries, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedJournalEntry);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  async createJournalEntry(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const newEntry = await apiClient.createJournalEntry(data);
    cacheManager.set(cacheKeys.journalEntry(newEntry.id), newEntry);

    try {
      await dbHelpers.upsert(db.journalEntries, {
        ...newEntry,
        syncStatus: 'SYNCED',
      } as CachedJournalEntry);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateJournalEntryLists();
    return newEntry;
  }

  optimisticCreateJournalEntry(tempId: string, data: Partial<JournalEntry>): void {
    const optimisticEntry: JournalEntry = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      docNumber: data.docNumber || `JE-${Date.now()}`,
      totalDebit: data.totalDebit || 0,
      totalCredit: data.totalCredit || 0,
      status: 'DRAFT',
      lines: data.lines || [],
      ...data,
    };

    cacheManager.set(cacheKeys.journalEntry(tempId), optimisticEntry);

    try {
      dbHelpers.upsert(db.journalEntries, {
        ...optimisticEntry,
        syncStatus: 'PENDING_SYNC',
      } as CachedJournalEntry);

      dbHelpers.addToSyncQueue({
        entityType: 'journalEntry',
        entityId: tempId,
        operation: 'CREATE',
        payload: data,
        createdAt: Date.now(),
        status: 'PENDING',
        retryCount: 0,
      });
    } catch (error) {
      console.warn('[DataService] Optimistic write failed:', error);
    }

    this.invalidateJournalEntryLists();
  }

  async updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
    const updated = await apiClient.updateJournalEntry(id, data);
    cacheManager.set(cacheKeys.journalEntry(id), updated);

    try {
      await dbHelpers.upsert(db.journalEntries, {
        ...updated,
        syncStatus: 'SYNCED',
      } as CachedJournalEntry);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateJournalEntryLists();
    return updated;
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await apiClient.deleteJournalEntry(id);
    cacheManager.delete(cacheKeys.journalEntry(id));

    try {
      await dbHelpers.deleteById(db.journalEntries, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    this.invalidateJournalEntryLists();
  }

  rollbackJournalEntry(tempId: string): void {
    cacheManager.delete(cacheKeys.journalEntry(tempId));
    try {
      dbHelpers.deleteById(db.journalEntries, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }
    this.invalidateJournalEntryLists();
  }

  private invalidateJournalEntryLists(): void {
    cacheManager.invalidatePattern('journalEntries:');
  }

  // --- UTILITY METHODS ---

  /**
   * Clear all caches (e.g., on logout)
   */
  clearAllCaches(): void {
    cacheManager.clear();
    db.invoices.clear();
    db.bills.clear();
    db.transactions.clear();
    db.journalEntries.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheManager.getStats();
  }
}

// Export singleton instance
export const dataService = new DataService();
