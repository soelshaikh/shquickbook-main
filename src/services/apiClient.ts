/**
 * ApiClient - HTTP client with mock data adapter
 * 
 * TEMPORARY: Returns mock data during MVP development.
 * FUTURE: Will be swapped to real fetch/axios calls when backend is ready.
 * 
 * This is the ONLY file that imports mock data.
 * When backend APIs go live, only this file changes.
 */

import { mockInvoices, Invoice } from '@/data/mockInvoices';
import { mockBills, Bill } from '@/data/mockBills';
import { mockTransactions, Transaction } from '@/data/mockTransactions';
import { mockJournalEntries, JournalEntry } from '@/data/mockJournalEntries';

/**
 * Simulate network delay for realistic testing
 */
const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a unique ID for new entities
 */
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * API Client class
 * 
 * When backend is ready, replace mock logic with:
 * - fetch() or axios calls
 * - Real authentication headers
 * - Proper error handling
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // --- INVOICES ---

  async getInvoices(companyId: string, filters?: any): Promise<Invoice[]> {
    await simulateDelay(250);
    
    // TEMPORARY: Filter mock data
    let results = mockInvoices.filter(inv => inv.companyId === companyId);
    
    if (filters?.status) {
      results = results.filter(inv => inv.status === filters.status);
    }
    if (filters?.customerId) {
      results = results.filter(inv => inv.customerId === filters.customerId);
    }
    
    return results;

    // FUTURE: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/invoices?companyId=${companyId}`, {
    //   headers: { Authorization: `Bearer ${getToken()}` }
    // });
    // return response.json();
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await simulateDelay(200);
    
    // TEMPORARY: Find in mock data
    return mockInvoices.find(inv => inv.id === id) || null;

    // FUTURE:
    // const response = await fetch(`${this.baseUrl}/invoices/${id}`);
    // return response.json();
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    await simulateDelay(400);
    
    // TEMPORARY: Create mock invoice with generated ID
    const newInvoice: Invoice = {
      id: generateId('inv'),
      companyId: data.companyId || 'comp-1',
      customerId: data.customerId || '',
      customerName: data.customerName || 'New Customer',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      totalAmount: data.totalAmount || 0,
      status: 'DRAFT',
      lines: data.lines || [],
      ...data,
    };
    
    return newInvoice;

    // FUTURE:
    // const response = await fetch(`${this.baseUrl}/invoices`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return response.json();
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    await simulateDelay(350);
    
    // TEMPORARY: Find and merge with mock data
    const existing = mockInvoices.find(inv => inv.id === id);
    if (!existing) {
      throw new Error(`Invoice ${id} not found`);
    }
    
    return { ...existing, ...data };

    // FUTURE:
    // const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return response.json();
  }

  async deleteInvoice(id: string): Promise<void> {
    await simulateDelay(300);
    
    // TEMPORARY: Just simulate success
    const existing = mockInvoices.find(inv => inv.id === id);
    if (!existing) {
      throw new Error(`Invoice ${id} not found`);
    }

    // FUTURE:
    // await fetch(`${this.baseUrl}/invoices/${id}`, { method: 'DELETE' });
  }

  // --- BILLS ---

  async getBills(companyId: string, filters?: any): Promise<Bill[]> {
    await simulateDelay(250);
    
    let results = mockBills.filter(bill => bill.companyId === companyId);
    
    if (filters?.status) {
      results = results.filter(bill => bill.status === filters.status);
    }
    if (filters?.vendorId) {
      results = results.filter(bill => bill.vendorId === filters.vendorId);
    }
    
    return results;
  }

  async getBillById(id: string): Promise<Bill | null> {
    await simulateDelay(200);
    return mockBills.find(bill => bill.id === id) || null;
  }

  async createBill(data: Partial<Bill>): Promise<Bill> {
    await simulateDelay(400);
    
    const newBill: Bill = {
      id: generateId('bill'),
      companyId: data.companyId || 'comp-1',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || 'New Vendor',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      totalAmount: data.totalAmount || 0,
      status: 'DRAFT',
      lines: data.lines || [],
      ...data,
    };
    
    return newBill;
  }

  async updateBill(id: string, data: Partial<Bill>): Promise<Bill> {
    await simulateDelay(350);
    
    const existing = mockBills.find(bill => bill.id === id);
    if (!existing) {
      throw new Error(`Bill ${id} not found`);
    }
    
    return { ...existing, ...data };
  }

  async deleteBill(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockBills.find(bill => bill.id === id);
    if (!existing) {
      throw new Error(`Bill ${id} not found`);
    }
  }

  // --- TRANSACTIONS (Read-only) ---

  async getTransactions(companyId: string, filters?: any): Promise<Transaction[]> {
    await simulateDelay(250);
    
    let results = mockTransactions.filter(txn => txn.companyId === companyId);
    
    if (filters?.type) {
      results = results.filter(txn => txn.type === filters.type);
    }
    if (filters?.status) {
      results = results.filter(txn => txn.status === filters.status);
    }
    
    return results;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    await simulateDelay(200);
    return mockTransactions.find(txn => txn.id === id) || null;
  }

  // --- JOURNAL ENTRIES ---

  async getJournalEntries(companyId: string, filters?: any): Promise<JournalEntry[]> {
    await simulateDelay(250);
    
    let results = mockJournalEntries.filter(je => je.companyId === companyId);
    
    if (filters?.status) {
      results = results.filter(je => je.status === filters.status);
    }
    
    return results;
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | null> {
    await simulateDelay(200);
    return mockJournalEntries.find(je => je.id === id) || null;
  }

  async createJournalEntry(data: Partial<JournalEntry>): Promise<JournalEntry> {
    await simulateDelay(400);
    
    const newEntry: JournalEntry = {
      id: generateId('je'),
      companyId: data.companyId || 'comp-1',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      docNumber: data.docNumber || `JE-${Date.now()}`,
      totalDebit: data.totalDebit || 0,
      totalCredit: data.totalCredit || 0,
      status: 'DRAFT',
      lines: data.lines || [],
      ...data,
    };
    
    return newEntry;
  }

  async updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
    await simulateDelay(350);
    
    const existing = mockJournalEntries.find(je => je.id === id);
    if (!existing) {
      throw new Error(`Journal Entry ${id} not found`);
    }
    
    return { ...existing, ...data };
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockJournalEntries.find(je => je.id === id);
    if (!existing) {
      throw new Error(`Journal Entry ${id} not found`);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
