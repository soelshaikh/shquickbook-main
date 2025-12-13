/**
 * Debug utilities for inspecting cache in browser console
 * 
 * Usage in browser console:
 *   window.debugCache.memory()
 *   window.debugCache.indexedDB()
 *   window.debugCache.syncQueue()
 */

import { dataService } from '@/services/dataService';
import { db } from '@/services/indexedDB';

export const debugCache = {
  /**
   * Show memory cache statistics
   */
  memory: () => {
    const stats = dataService.getCacheStats();
    console.log('═══════════════════════════════════════');
    console.log('📦 MEMORY CACHE');
    console.log('═══════════════════════════════════════');
    console.log(`Size: ${stats.size} / ${stats.maxSize}`);
    console.log('\nCached Keys:');
    stats.keys.forEach((key: string) => console.log(`  - ${key}`));
    console.log('═══════════════════════════════════════\n');
    return stats;
  },

  /**
   * Show all IndexedDB data
   */
  indexedDB: async () => {
    const invoices = await db.invoices.toArray();
    const bills = await db.bills.toArray();
    const journalEntries = await db.journalEntries.toArray();
    const transactions = await db.transactions.toArray();

    console.log('═══════════════════════════════════════');
    console.log('💾 INDEXEDDB');
    console.log('═══════════════════════════════════════');
    console.log(`Invoices: ${invoices.length}`);
    console.log(`Bills: ${bills.length}`);
    console.log(`Journal Entries: ${journalEntries.length}`);
    console.log(`Transactions: ${transactions.length}`);
    console.log('═══════════════════════════════════════\n');

    return { invoices, bills, journalEntries, transactions };
  },

  /**
   * Show sync queue
   */
  syncQueue: async () => {
    const queue = await db.syncQueue.toArray();
    
    console.log('═══════════════════════════════════════');
    console.log('📤 SYNC QUEUE');
    console.log('═══════════════════════════════════════');
    console.log(`Total items: ${queue.length}\n`);
    
    queue.forEach((item: any) => {
      console.log(`[${item.id}] ${item.entityType.toUpperCase()} - ${item.operation}`);
      console.log(`  Entity ID: ${item.entityId}`);
      console.log(`  Status: ${item.status}`);
      console.log(`  Retry Count: ${item.retryCount}`);
      console.log(`  Created: ${new Date(item.createdAt).toLocaleString()}`);
      if (item.lastError) {
        console.log(`  Error: ${item.lastError}`);
      }
      console.log('');
    });
    
    console.log('═══════════════════════════════════════\n');
    return queue;
  },

  /**
   * Show specific invoices
   */
  invoices: async () => {
    const invoices = await db.invoices.toArray();
    console.table(invoices.map(inv => ({
      id: inv.id,
      customer: inv.customerName || inv.customerId,
      amount: inv.totalAmount,
      status: inv.status,
      syncStatus: inv.syncStatus,
      cached: new Date(inv.cachedAt).toLocaleString()
    })));
    return invoices;
  },

  /**
   * Show specific bills
   */
  bills: async () => {
    const bills = await db.bills.toArray();
    console.table(bills.map(bill => ({
      id: bill.id,
      vendor: bill.vendorName || bill.vendorId,
      amount: bill.totalAmount,
      status: bill.status,
      syncStatus: bill.syncStatus,
      cached: new Date(bill.cachedAt).toLocaleString()
    })));
    return bills;
  },

  /**
   * Show specific journal entries
   */
  journalEntries: async () => {
    const entries = await db.journalEntries.toArray();
    console.table(entries.map(je => ({
      id: je.id,
      docNumber: je.docNumber,
      debit: je.totalDebit,
      credit: je.totalCredit,
      status: je.status,
      syncStatus: je.syncStatus,
      cached: new Date(je.cachedAt).toLocaleString()
    })));
    return entries;
  },

  /**
   * Clear all caches
   */
  clearAll: async () => {
    const confirm = window.confirm('⚠️ Clear ALL cache data? This cannot be undone.');
    if (!confirm) {
      console.log('Cancelled');
      return;
    }

    dataService.clearAllCaches();
    console.log('✅ All caches cleared');
  },

  /**
   * Show everything
   */
  all: async () => {
    console.clear();
    debugCache.memory();
    await debugCache.indexedDB();
    await debugCache.syncQueue();
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugCache = debugCache;
}
