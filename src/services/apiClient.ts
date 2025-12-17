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
import { mockCustomerPayments } from '@/data/mockCustomerPayments';
import { mockVendorPayments } from '@/data/mockVendorPayments';
import { mockCreditMemos } from '@/data/mockCreditMemos';
import { mockDeposits } from '@/data/mockDeposits';
import type { CustomerPayment, VendorPayment, CreditMemo, Deposit } from './dataService';

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
    
    const vendor = data.vendor || { id: data.vendorId || '', name: data.vendorName || 'New Vendor' };
    const lineItems = data.lineItems || data.lines || [];
    const subtotal = data.subtotal || lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = data.tax || subtotal * 0.0825;
    const total = data.total || data.totalAmount || subtotal + tax;
    
    const newBill: Bill = {
      id: generateId('bill'),
      companyId: data.companyId || 'comp-1',
      docNumber: data.docNumber || `BILL-${Date.now()}`,
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
      syncStatus: 'synced',
      memo: data.memo,
    };
    
    return newBill;
  }

  async updateBill(id: string, data: Partial<Bill>): Promise<Bill> {
    await simulateDelay(350);
    
    const existing = mockBills.find(bill => bill.id === id);
    if (!existing) {
      throw new Error(`Bill ${id} not found`);
    }
    
    // Merge vendor data properly
    const vendor = data.vendor || existing.vendor;
    const lineItems = data.lineItems || data.lines || existing.lineItems;
    const subtotal = data.subtotal ?? (lineItems.reduce((sum, item) => sum + (item.amount || 0), 0));
    const tax = data.tax ?? subtotal * 0.0825;
    const total = data.total || data.totalAmount || subtotal + tax;
    
    return { 
      ...existing, 
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
    
    const lines = data.lines || [];
    const totalDebit = data.totalDebit || lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = data.totalCredit || lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    
    const newEntry: JournalEntry = {
      id: generateId('je'),
      companyId: data.companyId || 'comp-1',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      docNumber: data.docNumber || `JE-${Date.now()}`,
      lines,
      totalDebit,
      totalCredit,
      memo: data.memo || '',
      status: data.status || 'draft',
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newEntry;
  }

  async updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
    await simulateDelay(350);
    
    const existing = mockJournalEntries.find(je => je.id === id);
    if (!existing) {
      throw new Error(`Journal Entry ${id} not found`);
    }
    
    const lines = data.lines || existing.lines;
    const totalDebit = data.totalDebit ?? lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = data.totalCredit ?? lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    
    return { 
      ...existing, 
      ...data,
      lines,
      totalDebit,
      totalCredit,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockJournalEntries.find(je => je.id === id);
    if (!existing) {
      throw new Error(`Journal Entry ${id} not found`);
    }
  }

  // --- CUSTOMER PAYMENTS ---

  async getCustomerPayments(companyId: string, filters?: any): Promise<CustomerPayment[]> {
    await simulateDelay(250);
    
    // TEMPORARY: Filter mock data
    return mockCustomerPayments.filter(payment => payment.companyId === companyId);
  }

  async getCustomerPaymentById(id: string): Promise<CustomerPayment | null> {
    await simulateDelay(200);
    
    const payment = mockCustomerPayments.find(p => p.id === id);
    return payment || null;
  }

  async createCustomerPayment(data: Partial<CustomerPayment>): Promise<CustomerPayment> {
    await simulateDelay(400);
    
    const newPayment: CustomerPayment = {
      id: generateId('payment'),
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
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newPayment;
  }

  async updateCustomerPayment(id: string, data: Partial<CustomerPayment>): Promise<CustomerPayment> {
    await simulateDelay(350);
    
    const existing = mockCustomerPayments.find(p => p.id === id);
    if (!existing) {
      throw new Error(`Customer Payment ${id} not found`);
    }
    
    return { 
      ...existing, 
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteCustomerPayment(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockCustomerPayments.find(p => p.id === id);
    if (!existing) {
      throw new Error(`Customer Payment ${id} not found`);
    }
  }

  // --- VENDOR PAYMENTS ---

  async getVendorPayments(companyId: string, filters?: any): Promise<VendorPayment[]> {
    await simulateDelay(250);
    
    // TEMPORARY: Filter mock data
    return mockVendorPayments.filter(payment => payment.companyId === companyId);
  }

  async getVendorPaymentById(id: string): Promise<VendorPayment | null> {
    await simulateDelay(200);
    
    const payment = mockVendorPayments.find(p => p.id === id);
    return payment || null;
  }

  async createVendorPayment(data: Partial<VendorPayment>): Promise<VendorPayment> {
    await simulateDelay(400);
    
    const newPayment: VendorPayment = {
      id: generateId('vpayment'),
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
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newPayment;
  }

  async updateVendorPayment(id: string, data: Partial<VendorPayment>): Promise<VendorPayment> {
    await simulateDelay(350);
    
    const existing = mockVendorPayments.find(p => p.id === id);
    if (!existing) {
      throw new Error(`Vendor Payment ${id} not found`);
    }
    
    return { 
      ...existing, 
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteVendorPayment(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockVendorPayments.find(p => p.id === id);
    if (!existing) {
      throw new Error(`Vendor Payment ${id} not found`);
    }
  }

  // --- CREDIT MEMOS ---

  async getCreditMemos(companyId: string, filters?: any): Promise<CreditMemo[]> {
    await simulateDelay(250);
    
    // TEMPORARY: Filter mock data
    return mockCreditMemos.filter(memo => memo.companyId === companyId);
  }

  async getCreditMemoById(id: string): Promise<CreditMemo | null> {
    await simulateDelay(200);
    
    const memo = mockCreditMemos.find(m => m.id === id);
    return memo || null;
  }

  async createCreditMemo(data: Partial<CreditMemo>): Promise<CreditMemo> {
    await simulateDelay(400);
    
    const lineItems = data.lineItems || [];
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = data.taxRate || 0;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    
    const newCreditMemo: CreditMemo = {
      id: generateId('creditmemo'),
      companyId: data.companyId || 'comp-1',
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      invoiceId: data.invoiceId,
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      totalAmount: total,
      status: data.status || 'draft',
      memo: data.memo,
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newCreditMemo;
  }

  async updateCreditMemo(id: string, data: Partial<CreditMemo>): Promise<CreditMemo> {
    await simulateDelay(350);
    
    const existing = mockCreditMemos.find(m => m.id === id);
    if (!existing) {
      throw new Error(`Credit Memo ${id} not found`);
    }
    
    const lineItems = data.lineItems || existing.lineItems;
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = data.taxRate ?? existing.taxRate;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    
    return { 
      ...existing, 
      ...data,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      totalAmount: total,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteCreditMemo(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockCreditMemos.find(m => m.id === id);
    if (!existing) {
      throw new Error(`Credit Memo ${id} not found`);
    }
  }

  // --- DEPOSITS ---

  async getDeposits(companyId: string, filters?: any): Promise<Deposit[]> {
    await simulateDelay(250);
    
    // TEMPORARY: Filter mock data
    return mockDeposits.filter(deposit => deposit.companyId === companyId);
  }

  async getDepositById(id: string): Promise<Deposit | null> {
    await simulateDelay(200);
    
    const deposit = mockDeposits.find(d => d.id === id);
    return deposit || null;
  }

  async createDeposit(data: Partial<Deposit>): Promise<Deposit> {
    await simulateDelay(400);
    
    const depositLines = data.depositLines || [];
    const totalAmount = depositLines.reduce((sum, line) => sum + line.amount, 0);
    
    const newDeposit: Deposit = {
      id: generateId('deposit'),
      companyId: data.companyId || 'comp-1',
      txnDate: data.txnDate || new Date().toISOString().split('T')[0],
      bankAccountId: data.bankAccountId || '',
      bankAccountName: data.bankAccountName,
      depositToAccountId: data.depositToAccountId || data.bankAccountId || '',
      depositToAccountName: data.depositToAccountName || data.bankAccountName,
      depositLines,
      lineItems: data.lineItems || depositLines,
      totalAmount,
      referenceNumber: data.referenceNumber,
      status: data.status || 'pending',
      memo: data.memo,
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newDeposit;
  }

  async updateDeposit(id: string, data: Partial<Deposit>): Promise<Deposit> {
    await simulateDelay(350);
    
    const existing = mockDeposits.find(d => d.id === id);
    if (!existing) {
      throw new Error(`Deposit ${id} not found`);
    }
    
    const depositLines = data.depositLines || existing.depositLines;
    const totalAmount = depositLines.reduce((sum, line) => sum + line.amount, 0);
    
    return { 
      ...existing, 
      ...data,
      depositLines,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteDeposit(id: string): Promise<void> {
    await simulateDelay(300);
    
    const existing = mockDeposits.find(d => d.id === id);
    if (!existing) {
      throw new Error(`Deposit ${id} not found`);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
