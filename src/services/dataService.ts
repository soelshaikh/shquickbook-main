/**
 * DataService - 3-tier cache orchestrator
 * 
 * SINGLE ENTRY POINT for all data operations.
 * Implements cache hierarchy: Memory → IndexedDB → API
 * Handles optimistic updates and cache invalidation.
 */

import { cacheManager } from './cacheManager';
import { db, dbHelpers, CachedInvoice, CachedBill, CachedTransaction, CachedJournalEntry, CachedCustomerPayment, CachedVendorPayment, CachedCreditMemo, CachedDeposit } from './indexedDB';
import { apiClient } from './apiClient';
import type { Invoice } from '@/data/mockInvoices';
import type { Bill } from '@/data/mockBills';
import type { Transaction } from '@/data/mockTransactions';
import type { JournalEntry } from '@/data/mockJournalEntries';

// Payment type definitions
export interface CustomerPayment {
  id: string;
  companyId: string;
  customerId: string;
  customerName?: string;
  txnDate: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  depositToAccountId: string;
  appliedToInvoices?: Array<{
    invoiceId: string;
    amount: number;
  }>;
  memo?: string;
  syncStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorPayment {
  id: string;
  companyId: string;
  vendorId: string;
  vendorName?: string;
  txnDate: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  bankAccountId: string;
  appliedToBills?: Array<{
    billId: string;
    amount: number;
  }>;
  memo?: string;
  syncStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditMemo {
  id: string;
  companyId: string;
  customerId: string;
  customerName?: string;
  invoiceId?: string; // Reference to invoice being credited
  txnDate: string;
  lineItems: Array<{
    id: string;
    accountId: string;
    accountName?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  totalAmount: number;
  status: string;
  memo?: string;
  syncStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Deposit {
  id: string;
  companyId: string;
  txnDate: string;
  depositToAccountId: string;
  depositToAccountName?: string;
  lineItems: Array<{
    id: string;
    paymentType: 'cash' | 'check' | 'creditCard' | 'other';
    paymentMethodRef?: string;
    accountId?: string;
    customerId?: string;
    description?: string;
    amount: number;
  }>;
  totalAmount: number;
  memo?: string;
  syncStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  customerPaymentList: (companyId: string, filters?: any) => 
    `customerPayments:${companyId}:${JSON.stringify(filters || {})}`,
  customerPayment: (id: string) => `customerPayment:${id}`,
  vendorPaymentList: (companyId: string, filters?: any) => 
    `vendorPayments:${companyId}:${JSON.stringify(filters || {})}`,
  vendorPayment: (id: string) => `vendorPayment:${id}`,
  creditMemoList: (companyId: string, filters?: any) => 
    `creditMemos:${companyId}:${JSON.stringify(filters || {})}`,
  creditMemo: (id: string) => `creditMemo:${id}`,
  depositList: (companyId: string, filters?: any) => 
    `deposits:${companyId}:${JSON.stringify(filters || {})}`,
  deposit: (id: string) => `deposit:${id}`,
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
        
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as Invoice[]).filter(inv => inv.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.invoices.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.status) {
            filtered = filtered.filter(inv => inv.status === filters.status);
          }
          
          // Update memory cache
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
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
    // Generate unique docNumber if not provided
    const docNumber = data.docNumber || `INV-TEMP-${Date.now().toString().slice(-6)}`;
    
    const optimisticInvoice: Invoice = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      docNumber,
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      customer: data.customer || '',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      lineItems: data.lineItems || [],
      subtotal: data.subtotal || 0,
      taxRate: data.taxRate || 0,
      taxAmount: data.taxAmount || 0,
      total: data.total || 0,
      totalAmount: data.totalAmount || 0,
      balance: data.balance || data.total || 0,
      status: data.status || 'draft',
      emailStatus: data.emailStatus || 'not_sent',
      syncStatus: 'local_only',
      memo: data.memo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    // Check if this is a temp invoice (optimistically created, not yet synced to API)
    let existingInvoice: Invoice | null = null;
    
    if (id.startsWith('temp-')) {
      // For temp invoices, get from cache/IndexedDB first
      existingInvoice = cacheManager.get<Invoice>(cacheKeys.invoice(id));
      if (!existingInvoice) {
        try {
          const dbResult = await dbHelpers.getById(db.invoices, id);
          if (dbResult) {
            existingInvoice = dbResult as Invoice;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp invoice from IndexedDB:', error);
        }
      }
      
      if (!existingInvoice) {
        throw new Error(`Invoice ${id} not found in cache or IndexedDB`);
      }
      
      // Merge data with existing invoice
      const lineItems = data.lineItems || existingInvoice.lineItems;
      const subtotal = data.subtotal ?? lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const taxRate = data.taxRate ?? existingInvoice.taxRate;
      const taxAmount = data.taxAmount ?? subtotal * taxRate;
      const total = data.total ?? subtotal + taxAmount;
      
      const updatedInvoice: Invoice = {
        ...existingInvoice,
        ...data,
        lineItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        balance: data.balance ?? total,
        updatedAt: new Date().toISOString(),
      };
      
      // Update cache and IndexedDB (still pending sync)
      cacheManager.set(cacheKeys.invoice(id), updatedInvoice);
      
      try {
        await dbHelpers.upsert(db.invoices, {
          ...updatedInvoice,
          syncStatus: 'PENDING_SYNC',
        } as CachedInvoice);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateInvoiceLists();
      return updatedInvoice;
    }
    
    // For regular invoices, call API
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
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as Bill[]).filter(bill => bill.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.bills.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.status) {
            filtered = filtered.filter(bill => bill.status === filters.status);
          }
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
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
    const vendor = data.vendor || { id: data.vendorId || '', name: data.vendorName || 'New Vendor' };
    const lineItems = data.lineItems || data.lines || [];
    const subtotal = data.subtotal || lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = data.tax || subtotal * 0.0825;
    const total = data.total || data.totalAmount || subtotal + tax;
    
    // Generate unique docNumber if not provided
    const docNumber = data.docNumber || `BILL-TEMP-${Date.now().toString().slice(-6)}`;
    
    const optimisticBill: Bill = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      docNumber,
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      vendor,
      vendorId: vendor.id,
      vendorName: vendor.name,
      lineItems,
      lines: lineItems,
      subtotal,
      tax,
      total,
      totalAmount: total,
      balance: data.balance || total,
      status: data.status || 'draft',
      paymentStatus: data.paymentStatus || 'unpaid',
      syncStatus: 'pending',
      memo: data.memo,
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
    // Check if this is a temp bill (optimistically created, not yet synced to API)
    let existingBill: Bill | null = null;
    
    if (id.startsWith('temp-')) {
      // For temp bills, get from cache/IndexedDB first
      existingBill = cacheManager.get<Bill>(cacheKeys.bill(id));
      if (!existingBill) {
        try {
          const dbResult = await dbHelpers.getById(db.bills, id);
          if (dbResult) {
            existingBill = dbResult as Bill;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp bill from IndexedDB:', error);
        }
      }
      
      if (!existingBill) {
        throw new Error(`Bill ${id} not found in cache or IndexedDB`);
      }
      
      // Merge data with existing bill
      const vendor = data.vendor || existingBill.vendor;
      const lineItems = data.lineItems || data.lines || existingBill.lineItems;
      const subtotal = data.subtotal ?? (lineItems.reduce((sum, item) => sum + (item.amount || 0), 0));
      const tax = data.tax ?? subtotal * 0.0825;
      const total = data.total || data.totalAmount || subtotal + tax;
      
      const updatedBill: Bill = {
        ...existingBill,
        ...data,
        vendor,
        vendorId: vendor.id,
        vendorName: vendor.name,
        lineItems,
        lines: lineItems,
        subtotal,
        tax,
        total,
        totalAmount: total,
      };
      
      // Update cache and IndexedDB (still pending sync)
      cacheManager.set(cacheKeys.bill(id), updatedBill);
      
      try {
        await dbHelpers.upsert(db.bills, {
          ...updatedBill,
          syncStatus: 'PENDING_SYNC',
        } as CachedBill);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateBillLists();
      return updatedBill;
    }
    
    // For regular bills, call API
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
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as JournalEntry[]).filter(je => je.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.journalEntries.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.status) {
            filtered = filtered.filter(je => je.status === filters.status);
          }
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
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
    const lines = data.lines || [];
    const totalDebit = data.totalDebit || lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = data.totalCredit || lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    
    // Generate unique docNumber if not provided
    const docNumber = data.docNumber || `JE-TEMP-${Date.now().toString().slice(-6)}`;
    
    const optimisticEntry: JournalEntry = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      docNumber,
      lines,
      totalDebit,
      totalCredit,
      memo: data.memo || '',
      status: data.status || 'draft',
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    // Check if this is a temp journal entry (optimistically created, not yet synced to API)
    let existingEntry: JournalEntry | null = null;
    
    if (id.startsWith('temp-')) {
      // For temp entries, get from cache/IndexedDB first
      existingEntry = cacheManager.get<JournalEntry>(cacheKeys.journalEntry(id));
      if (!existingEntry) {
        try {
          const dbResult = await dbHelpers.getById(db.journalEntries, id);
          if (dbResult) {
            existingEntry = dbResult as JournalEntry;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp journal entry from IndexedDB:', error);
        }
      }
      
      if (!existingEntry) {
        throw new Error(`Journal Entry ${id} not found in cache or IndexedDB`);
      }
      
      // Merge data with existing entry
      const lines = data.lines || existingEntry.lines;
      const totalDebit = data.totalDebit ?? lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = data.totalCredit ?? lines.reduce((sum, l) => sum + (l.credit || 0), 0);
      
      const updatedEntry: JournalEntry = {
        ...existingEntry,
        ...data,
        lines,
        totalDebit,
        totalCredit,
        updatedAt: new Date().toISOString(),
      };
      
      // Update cache and IndexedDB (still pending sync)
      cacheManager.set(cacheKeys.journalEntry(id), updatedEntry);
      
      try {
        await dbHelpers.upsert(db.journalEntries, {
          ...updatedEntry,
          syncStatus: 'PENDING_SYNC',
        } as CachedJournalEntry);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateJournalEntryLists();
      return updatedEntry;
    }
    
    // For regular entries, call API
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

  // --- CUSTOMER PAYMENTS ---

  /**
   * Get customer payments with 3-tier cache
   */
  async getCustomerPayments(companyId: string, filters?: any): Promise<CustomerPayment[]> {
    const cacheKey = cacheKeys.customerPaymentList(companyId, filters);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<CustomerPayment[]>(cacheKey);
    if (memoryHit) {
      console.log('[DataService] Memory cache HIT:', cacheKey);
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResults = await dbHelpers.getByCompany<CachedCustomerPayment>(db.customerPayments, companyId);
      
      if (dbResults.length > 0) {
        console.log('[DataService] IndexedDB HIT:', cacheKey);
        
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as CustomerPayment[]).filter(payment => payment.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.customerPayments.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.customerId) {
            filtered = filtered.filter(payment => payment.customerId === filters.customerId);
          }
          
          // Update memory cache
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    console.log('[DataService] API fetch:', cacheKey);
    const apiResults = await apiClient.getCustomerPayments(companyId, filters);

    // Update both caches
    cacheManager.set(cacheKey, apiResults);
    
    try {
      for (const payment of apiResults) {
        await dbHelpers.upsert(db.customerPayments, {
          ...payment,
          syncStatus: 'SYNCED',
        } as CachedCustomerPayment);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  /**
   * Get single customer payment by ID
   */
  async getCustomerPaymentById(id: string): Promise<CustomerPayment | null> {
    const cacheKey = cacheKeys.customerPayment(id);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<CustomerPayment>(cacheKey);
    if (memoryHit) {
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResult = await dbHelpers.getById(db.customerPayments, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as CustomerPayment);
        return dbResult as CustomerPayment;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    const apiResult = await apiClient.getCustomerPaymentById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      
      try {
        await dbHelpers.upsert(db.customerPayments, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedCustomerPayment);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  async createCustomerPayment(data: Partial<CustomerPayment>): Promise<CustomerPayment> {
    const newPayment = await apiClient.createCustomerPayment(data);
    const cacheKey = cacheKeys.customerPayment(newPayment.id);
    cacheManager.set(cacheKey, newPayment);

    try {
      await dbHelpers.upsert(db.customerPayments, {
        ...newPayment,
        syncStatus: 'SYNCED',
      } as CachedCustomerPayment);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateCustomerPaymentLists();
    return newPayment;
  }

  optimisticCreateCustomerPayment(tempId: string, data: Partial<CustomerPayment>): void {
    const optimisticPayment: CustomerPayment = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      amount: data.amount || 0,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      depositToAccountId: data.depositToAccountId || '',
      appliedToInvoices: data.appliedToInvoices || [],
      memo: data.memo,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cacheManager.set(cacheKeys.customerPayment(tempId), optimisticPayment);

    try {
      dbHelpers.upsert(db.customerPayments, {
        ...optimisticPayment,
        syncStatus: 'PENDING_SYNC',
      } as CachedCustomerPayment);

      dbHelpers.addToSyncQueue({
        entityType: 'customerPayment',
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

    this.invalidateCustomerPaymentLists();
  }

  async updateCustomerPayment(id: string, data: Partial<CustomerPayment>): Promise<CustomerPayment> {
    let existingPayment: CustomerPayment | null = null;
    
    if (id.startsWith('temp-')) {
      existingPayment = cacheManager.get<CustomerPayment>(cacheKeys.customerPayment(id));
      if (!existingPayment) {
        try {
          const dbResult = await dbHelpers.getById(db.customerPayments, id);
          if (dbResult) {
            existingPayment = dbResult as CustomerPayment;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp customer payment from IndexedDB:', error);
        }
      }
      
      if (!existingPayment) {
        throw new Error(`Customer Payment ${id} not found in cache or IndexedDB`);
      }
      
      const updatedPayment: CustomerPayment = {
        ...existingPayment,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      cacheManager.set(cacheKeys.customerPayment(id), updatedPayment);
      
      try {
        await dbHelpers.upsert(db.customerPayments, {
          ...updatedPayment,
          syncStatus: 'PENDING_SYNC',
        } as CachedCustomerPayment);

        dbHelpers.addToSyncQueue({
          entityType: 'customerPayment',
          entityId: id,
          operation: 'UPDATE',
          payload: data,
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateCustomerPaymentLists();
      return updatedPayment;
    }
    
    const updatedPayment = await apiClient.updateCustomerPayment(id, data);
    cacheManager.set(cacheKeys.customerPayment(id), updatedPayment);

    try {
      await dbHelpers.upsert(db.customerPayments, {
        ...updatedPayment,
        syncStatus: 'SYNCED',
      } as CachedCustomerPayment);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateCustomerPaymentLists();
    return updatedPayment;
  }

  async deleteCustomerPayment(id: string): Promise<void> {
    if (id.startsWith('temp-')) {
      cacheManager.delete(cacheKeys.customerPayment(id));
      
      try {
        await dbHelpers.deleteById(db.customerPayments, id);
        
        dbHelpers.addToSyncQueue({
          entityType: 'customerPayment',
          entityId: id,
          operation: 'DELETE',
          payload: { id },
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB delete failed:', error);
      }
      
      this.invalidateCustomerPaymentLists();
      return;
    }

    await apiClient.deleteCustomerPayment(id);
    cacheManager.delete(cacheKeys.customerPayment(id));

    try {
      await dbHelpers.deleteById(db.customerPayments, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    this.invalidateCustomerPaymentLists();
  }

  rollbackCustomerPayment(tempId: string): void {
    cacheManager.delete(cacheKeys.customerPayment(tempId));
    try {
      dbHelpers.deleteById(db.customerPayments, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }
    this.invalidateCustomerPaymentLists();
  }

  private invalidateCustomerPaymentLists(): void {
    cacheManager.invalidatePattern('customerPayments:');
  }

  // --- VENDOR PAYMENTS ---

  /**
   * Get vendor payments with 3-tier cache
   */
  async getVendorPayments(companyId: string, filters?: any): Promise<VendorPayment[]> {
    const cacheKey = cacheKeys.vendorPaymentList(companyId, filters);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<VendorPayment[]>(cacheKey);
    if (memoryHit) {
      console.log('[DataService] Memory cache HIT:', cacheKey);
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResults = await dbHelpers.getByCompany<CachedVendorPayment>(db.vendorPayments, companyId);
      
      if (dbResults.length > 0) {
        console.log('[DataService] IndexedDB HIT:', cacheKey);
        
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as VendorPayment[]).filter(payment => payment.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.vendorPayments.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.vendorId) {
            filtered = filtered.filter(payment => payment.vendorId === filters.vendorId);
          }
          
          // Update memory cache
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    console.log('[DataService] API fetch:', cacheKey);
    const apiResults = await apiClient.getVendorPayments(companyId, filters);

    // Update both caches
    cacheManager.set(cacheKey, apiResults);
    
    try {
      for (const payment of apiResults) {
        await dbHelpers.upsert(db.vendorPayments, {
          ...payment,
          syncStatus: 'SYNCED',
        } as CachedVendorPayment);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  /**
   * Get single vendor payment by ID
   */
  async getVendorPaymentById(id: string): Promise<VendorPayment | null> {
    const cacheKey = cacheKeys.vendorPayment(id);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<VendorPayment>(cacheKey);
    if (memoryHit) {
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResult = await dbHelpers.getById(db.vendorPayments, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as VendorPayment);
        return dbResult as VendorPayment;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    const apiResult = await apiClient.getVendorPaymentById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      
      try {
        await dbHelpers.upsert(db.vendorPayments, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedVendorPayment);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  async createVendorPayment(data: Partial<VendorPayment>): Promise<VendorPayment> {
    const newPayment = await apiClient.createVendorPayment(data);
    const cacheKey = cacheKeys.vendorPayment(newPayment.id);
    cacheManager.set(cacheKey, newPayment);

    try {
      await dbHelpers.upsert(db.vendorPayments, {
        ...newPayment,
        syncStatus: 'SYNCED',
      } as CachedVendorPayment);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateVendorPaymentLists();
    return newPayment;
  }

  optimisticCreateVendorPayment(tempId: string, data: Partial<VendorPayment>): void {
    const optimisticPayment: VendorPayment = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || '',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      amount: data.amount || 0,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      bankAccountId: data.bankAccountId || '',
      appliedToBills: data.appliedToBills || [],
      memo: data.memo,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cacheManager.set(cacheKeys.vendorPayment(tempId), optimisticPayment);

    try {
      dbHelpers.upsert(db.vendorPayments, {
        ...optimisticPayment,
        syncStatus: 'PENDING_SYNC',
      } as CachedVendorPayment);

      dbHelpers.addToSyncQueue({
        entityType: 'vendorPayment',
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

    this.invalidateVendorPaymentLists();
  }

  async updateVendorPayment(id: string, data: Partial<VendorPayment>): Promise<VendorPayment> {
    let existingPayment: VendorPayment | null = null;
    
    if (id.startsWith('temp-')) {
      existingPayment = cacheManager.get<VendorPayment>(cacheKeys.vendorPayment(id));
      if (!existingPayment) {
        try {
          const dbResult = await dbHelpers.getById(db.vendorPayments, id);
          if (dbResult) {
            existingPayment = dbResult as VendorPayment;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp vendor payment from IndexedDB:', error);
        }
      }
      
      if (!existingPayment) {
        throw new Error(`Vendor Payment ${id} not found in cache or IndexedDB`);
      }
      
      const updatedPayment: VendorPayment = {
        ...existingPayment,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      cacheManager.set(cacheKeys.vendorPayment(id), updatedPayment);
      
      try {
        await dbHelpers.upsert(db.vendorPayments, {
          ...updatedPayment,
          syncStatus: 'PENDING_SYNC',
        } as CachedVendorPayment);

        dbHelpers.addToSyncQueue({
          entityType: 'vendorPayment',
          entityId: id,
          operation: 'UPDATE',
          payload: data,
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateVendorPaymentLists();
      return updatedPayment;
    }
    
    const updatedPayment = await apiClient.updateVendorPayment(id, data);
    cacheManager.set(cacheKeys.vendorPayment(id), updatedPayment);

    try {
      await dbHelpers.upsert(db.vendorPayments, {
        ...updatedPayment,
        syncStatus: 'SYNCED',
      } as CachedVendorPayment);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateVendorPaymentLists();
    return updatedPayment;
  }

  async deleteVendorPayment(id: string): Promise<void> {
    if (id.startsWith('temp-')) {
      cacheManager.delete(cacheKeys.vendorPayment(id));
      
      try {
        await dbHelpers.deleteById(db.vendorPayments, id);
        
        dbHelpers.addToSyncQueue({
          entityType: 'vendorPayment',
          entityId: id,
          operation: 'DELETE',
          payload: { id },
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB delete failed:', error);
      }
      
      this.invalidateVendorPaymentLists();
      return;
    }

    await apiClient.deleteVendorPayment(id);
    cacheManager.delete(cacheKeys.vendorPayment(id));

    try {
      await dbHelpers.deleteById(db.vendorPayments, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    this.invalidateVendorPaymentLists();
  }

  rollbackVendorPayment(tempId: string): void {
    cacheManager.delete(cacheKeys.vendorPayment(tempId));
    try {
      dbHelpers.deleteById(db.vendorPayments, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }
    this.invalidateVendorPaymentLists();
  }

  private invalidateVendorPaymentLists(): void {
    cacheManager.invalidatePattern('vendorPayments:');
  }

  // --- CREDIT MEMOS ---

  /**
   * Get credit memos with 3-tier cache
   */
  async getCreditMemos(companyId: string, filters?: any): Promise<CreditMemo[]> {
    const cacheKey = cacheKeys.creditMemoList(companyId, filters);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<CreditMemo[]>(cacheKey);
    if (memoryHit) {
      console.log('[DataService] Memory cache HIT:', cacheKey);
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResults = await dbHelpers.getByCompany<CachedCreditMemo>(db.creditMemos, companyId);
      
      if (dbResults.length > 0) {
        console.log('[DataService] IndexedDB HIT:', cacheKey);
        
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as CreditMemo[]).filter(memo => memo.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.creditMemos.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.customerId) {
            filtered = filtered.filter(memo => memo.customerId === filters.customerId);
          }
          if (filters?.status) {
            filtered = filtered.filter(memo => memo.status === filters.status);
          }
          
          // Update memory cache
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    console.log('[DataService] API fetch:', cacheKey);
    const apiResults = await apiClient.getCreditMemos(companyId, filters);

    // Update both caches
    cacheManager.set(cacheKey, apiResults);
    
    try {
      for (const memo of apiResults) {
        await dbHelpers.upsert(db.creditMemos, {
          ...memo,
          syncStatus: 'SYNCED',
        } as CachedCreditMemo);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  /**
   * Get single credit memo by ID
   */
  async getCreditMemoById(id: string): Promise<CreditMemo | null> {
    const cacheKey = cacheKeys.creditMemo(id);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<CreditMemo>(cacheKey);
    if (memoryHit) {
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResult = await dbHelpers.getById(db.creditMemos, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as CreditMemo);
        return dbResult as CreditMemo;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    const apiResult = await apiClient.getCreditMemoById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      
      try {
        await dbHelpers.upsert(db.creditMemos, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedCreditMemo);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  async createCreditMemo(data: Partial<CreditMemo>): Promise<CreditMemo> {
    const newCreditMemo = await apiClient.createCreditMemo(data);
    const cacheKey = cacheKeys.creditMemo(newCreditMemo.id);
    cacheManager.set(cacheKey, newCreditMemo);

    try {
      await dbHelpers.upsert(db.creditMemos, {
        ...newCreditMemo,
        syncStatus: 'SYNCED',
      } as CachedCreditMemo);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateCreditMemoLists();
    return newCreditMemo;
  }

  optimisticCreateCreditMemo(tempId: string, data: Partial<CreditMemo>): void {
    const lineItems = data.lineItems || [];
    const subtotal = data.subtotal || lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = data.taxRate || 0;
    const taxAmount = data.taxAmount || subtotal * taxRate;
    const total = data.total || data.totalAmount || subtotal + taxAmount;
    
    // Generate unique docNumber if not provided
    const docNumber = `CM-TEMP-${Date.now().toString().slice(-6)}`;
    
    const optimisticCreditMemo: CreditMemo = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      invoiceId: data.invoiceId, // Preserve invoice reference
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      totalAmount: total,
      status: data.status || 'draft',
      memo: data.memo,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cacheManager.set(cacheKeys.creditMemo(tempId), optimisticCreditMemo);

    try {
      dbHelpers.upsert(db.creditMemos, {
        ...optimisticCreditMemo,
        syncStatus: 'PENDING_SYNC',
      } as CachedCreditMemo);

      dbHelpers.addToSyncQueue({
        entityType: 'creditMemo',
        entityId: tempId,
        operation: 'CREATE',
        payload: data, // Preserve original payload including invoiceId
        createdAt: Date.now(),
        status: 'PENDING',
        retryCount: 0,
      });
    } catch (error) {
      console.warn('[DataService] Optimistic write failed:', error);
    }

    this.invalidateCreditMemoLists();
  }

  async updateCreditMemo(id: string, data: Partial<CreditMemo>): Promise<CreditMemo> {
    let existingCreditMemo: CreditMemo | null = null;
    
    if (id.startsWith('temp-')) {
      existingCreditMemo = cacheManager.get<CreditMemo>(cacheKeys.creditMemo(id));
      if (!existingCreditMemo) {
        try {
          const dbResult = await dbHelpers.getById(db.creditMemos, id);
          if (dbResult) {
            existingCreditMemo = dbResult as CreditMemo;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp credit memo from IndexedDB:', error);
        }
      }
      
      if (!existingCreditMemo) {
        throw new Error(`Credit Memo ${id} not found in cache or IndexedDB`);
      }
      
      const lineItems = data.lineItems || existingCreditMemo.lineItems;
      const subtotal = data.subtotal ?? lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const taxRate = data.taxRate ?? existingCreditMemo.taxRate;
      const taxAmount = data.taxAmount ?? subtotal * taxRate;
      const total = data.total ?? data.totalAmount ?? subtotal + taxAmount;
      
      const updatedCreditMemo: CreditMemo = {
        ...existingCreditMemo,
        ...data,
        invoiceId: data.invoiceId ?? existingCreditMemo.invoiceId, // Preserve invoice reference
        lineItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        totalAmount: total,
        updatedAt: new Date().toISOString(),
      };
      
      cacheManager.set(cacheKeys.creditMemo(id), updatedCreditMemo);
      
      try {
        await dbHelpers.upsert(db.creditMemos, {
          ...updatedCreditMemo,
          syncStatus: 'PENDING_SYNC',
        } as CachedCreditMemo);

        dbHelpers.addToSyncQueue({
          entityType: 'creditMemo',
          entityId: id,
          operation: 'UPDATE',
          payload: data, // Preserve original payload including invoiceId
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateCreditMemoLists();
      return updatedCreditMemo;
    }
    
    const updatedCreditMemo = await apiClient.updateCreditMemo(id, data);
    cacheManager.set(cacheKeys.creditMemo(id), updatedCreditMemo);

    try {
      await dbHelpers.upsert(db.creditMemos, {
        ...updatedCreditMemo,
        syncStatus: 'SYNCED',
      } as CachedCreditMemo);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateCreditMemoLists();
    return updatedCreditMemo;
  }

  async deleteCreditMemo(id: string): Promise<void> {
    if (id.startsWith('temp-')) {
      cacheManager.delete(cacheKeys.creditMemo(id));
      
      try {
        await dbHelpers.deleteById(db.creditMemos, id);
        
        dbHelpers.addToSyncQueue({
          entityType: 'creditMemo',
          entityId: id,
          operation: 'DELETE',
          payload: { id },
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB delete failed:', error);
      }
      
      this.invalidateCreditMemoLists();
      return;
    }

    await apiClient.deleteCreditMemo(id);
    cacheManager.delete(cacheKeys.creditMemo(id));

    try {
      await dbHelpers.deleteById(db.creditMemos, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    this.invalidateCreditMemoLists();
  }

  rollbackCreditMemo(tempId: string): void {
    cacheManager.delete(cacheKeys.creditMemo(tempId));
    try {
      dbHelpers.deleteById(db.creditMemos, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }
    this.invalidateCreditMemoLists();
  }

  private invalidateCreditMemoLists(): void {
    cacheManager.invalidatePattern('creditMemos:');
  }

  // --- DEPOSITS ---

  /**
   * Get deposits with 3-tier cache
   */
  async getDeposits(companyId: string, filters?: any): Promise<Deposit[]> {
    const cacheKey = cacheKeys.depositList(companyId, filters);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<Deposit[]>(cacheKey);
    if (memoryHit) {
      console.log('[DataService] Memory cache HIT:', cacheKey);
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResults = await dbHelpers.getByCompany<CachedDeposit>(db.deposits, companyId);
      
      if (dbResults.length > 0) {
        console.log('[DataService] IndexedDB HIT:', cacheKey);
        
        // Filter out items without companyId (old cached data)
        let filtered = (dbResults as Deposit[]).filter(deposit => deposit.companyId === companyId);
        
        // If no valid items found, clear cache and fetch from API
        if (filtered.length === 0) {
          console.log('[DataService] Stale IndexedDB data detected, clearing...');
          await db.deposits.clear();
          // Fall through to API fetch
        } else {
          // Apply additional filters
          if (filters?.bankAccountId) {
            filtered = filtered.filter(deposit => deposit.bankAccountId === filters.bankAccountId);
          }
          if (filters?.status) {
            filtered = filtered.filter(deposit => deposit.status === filters.status);
          }
          
          // Update memory cache
          cacheManager.set(cacheKey, filtered);
          return filtered;
        }
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    console.log('[DataService] API fetch:', cacheKey);
    const apiResults = await apiClient.getDeposits(companyId, filters);

    // Update both caches
    cacheManager.set(cacheKey, apiResults);
    
    try {
      for (const deposit of apiResults) {
        await dbHelpers.upsert(db.deposits, {
          ...deposit,
          syncStatus: 'SYNCED',
        } as CachedDeposit);
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    return apiResults;
  }

  /**
   * Get single deposit by ID
   */
  async getDepositById(id: string): Promise<Deposit | null> {
    const cacheKey = cacheKeys.deposit(id);

    // 1. Check Memory Cache
    const memoryHit = cacheManager.get<Deposit>(cacheKey);
    if (memoryHit) {
      return memoryHit;
    }

    // 2. Check IndexedDB
    try {
      const dbResult = await dbHelpers.getById(db.deposits, id);
      if (dbResult) {
        cacheManager.set(cacheKey, dbResult as Deposit);
        return dbResult as Deposit;
      }
    } catch (error) {
      console.warn('[DataService] IndexedDB read failed:', error);
    }

    // 3. Fetch from API
    const apiResult = await apiClient.getDepositById(id);
    if (apiResult) {
      cacheManager.set(cacheKey, apiResult);
      
      try {
        await dbHelpers.upsert(db.deposits, {
          ...apiResult,
          syncStatus: 'SYNCED',
        } as CachedDeposit);
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
    }

    return apiResult;
  }

  async createDeposit(data: Partial<Deposit>): Promise<Deposit> {
    const newDeposit = await apiClient.createDeposit(data);
    const cacheKey = cacheKeys.deposit(newDeposit.id);
    cacheManager.set(cacheKey, newDeposit);

    try {
      await dbHelpers.upsert(db.deposits, {
        ...newDeposit,
        syncStatus: 'SYNCED',
      } as CachedDeposit);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateDepositLists();
    return newDeposit;
  }

  optimisticCreateDeposit(tempId: string, data: Partial<Deposit>): void {
    const lineItems = data.lineItems || [];
    const totalAmount = data.totalAmount || lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const optimisticDeposit: Deposit = {
      id: tempId,
      companyId: data.companyId || 'comp-1',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      depositToAccountId: data.depositToAccountId || '',
      depositToAccountName: data.depositToAccountName,
      lineItems,
      totalAmount,
      memo: data.memo,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cacheManager.set(cacheKeys.deposit(tempId), optimisticDeposit);

    try {
      dbHelpers.upsert(db.deposits, {
        ...optimisticDeposit,
        syncStatus: 'PENDING_SYNC',
      } as CachedDeposit);

      dbHelpers.addToSyncQueue({
        entityType: 'deposit',
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

    this.invalidateDepositLists();
  }

  async updateDeposit(id: string, data: Partial<Deposit>): Promise<Deposit> {
    let existingDeposit: Deposit | null = null;
    
    if (id.startsWith('temp-')) {
      existingDeposit = cacheManager.get<Deposit>(cacheKeys.deposit(id));
      if (!existingDeposit) {
        try {
          const dbResult = await dbHelpers.getById(db.deposits, id);
          if (dbResult) {
            existingDeposit = dbResult as Deposit;
          }
        } catch (error) {
          console.warn('[DataService] Failed to get temp deposit from IndexedDB:', error);
        }
      }
      
      if (!existingDeposit) {
        throw new Error(`Deposit ${id} not found in cache or IndexedDB`);
      }
      
      const lineItems = data.lineItems || existingDeposit.lineItems;
      const totalAmount = data.totalAmount ?? lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      const updatedDeposit: Deposit = {
        ...existingDeposit,
        ...data,
        lineItems,
        totalAmount,
        updatedAt: new Date().toISOString(),
      };
      
      cacheManager.set(cacheKeys.deposit(id), updatedDeposit);
      
      try {
        await dbHelpers.upsert(db.deposits, {
          ...updatedDeposit,
          syncStatus: 'PENDING_SYNC',
        } as CachedDeposit);

        dbHelpers.addToSyncQueue({
          entityType: 'deposit',
          entityId: id,
          operation: 'UPDATE',
          payload: data,
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB write failed:', error);
      }
      
      this.invalidateDepositLists();
      return updatedDeposit;
    }
    
    const updatedDeposit = await apiClient.updateDeposit(id, data);
    cacheManager.set(cacheKeys.deposit(id), updatedDeposit);

    try {
      await dbHelpers.upsert(db.deposits, {
        ...updatedDeposit,
        syncStatus: 'SYNCED',
      } as CachedDeposit);
    } catch (error) {
      console.warn('[DataService] IndexedDB write failed:', error);
    }

    this.invalidateDepositLists();
    return updatedDeposit;
  }

  async deleteDeposit(id: string): Promise<void> {
    if (id.startsWith('temp-')) {
      cacheManager.delete(cacheKeys.deposit(id));
      
      try {
        await dbHelpers.deleteById(db.deposits, id);
        
        dbHelpers.addToSyncQueue({
          entityType: 'deposit',
          entityId: id,
          operation: 'DELETE',
          payload: { id },
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0,
        });
      } catch (error) {
        console.warn('[DataService] IndexedDB delete failed:', error);
      }
      
      this.invalidateDepositLists();
      return;
    }

    await apiClient.deleteDeposit(id);
    cacheManager.delete(cacheKeys.deposit(id));

    try {
      await dbHelpers.deleteById(db.deposits, id);
    } catch (error) {
      console.warn('[DataService] IndexedDB delete failed:', error);
    }

    this.invalidateDepositLists();
  }

  rollbackDeposit(tempId: string): void {
    cacheManager.delete(cacheKeys.deposit(tempId));
    try {
      dbHelpers.deleteById(db.deposits, tempId);
    } catch (error) {
      console.warn('[DataService] Rollback failed:', error);
    }
    this.invalidateDepositLists();
  }

  private invalidateDepositLists(): void {
    cacheManager.invalidatePattern('deposits:');
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
    db.customerPayments.clear();
    db.vendorPayments.clear();
    db.creditMemos.clear();
    db.deposits.clear();
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
