import { ExportColumn, formatCurrency, formatDate } from './csvExport';
import { Transaction } from '@/data/mockTransactions';
import { Invoice } from '@/data/mockInvoices';
import { Bill } from '@/data/mockBills';
import { JournalEntry } from '@/data/mockJournalEntries';
import { CustomerPayment, VendorPayment, CreditMemo, Deposit } from '@/services/dataService';

export const transactionExportColumns: ExportColumn<Transaction>[] = [
  { key: 'date', header: 'Date', formatter: formatDate },
  { key: 'type', header: 'Type' },
  { key: 'docNumber', header: 'Doc #' },
  { key: 'entity', header: 'Entity' },
  { key: 'memo', header: 'Memo' },
  { key: 'account', header: 'Account' },
  { key: 'amount', header: 'Amount', formatter: formatCurrency },
  { key: 'balance', header: 'Balance', formatter: formatCurrency },
  { key: 'status', header: 'Status' },
];

export const invoiceExportColumns: ExportColumn<Invoice>[] = [
  { key: 'docNumber', header: 'Doc #' },
  { key: 'txnDate', header: 'Date', formatter: formatDate },
  { key: 'dueDate', header: 'Due Date', formatter: formatDate },
  { key: 'customer', header: 'Customer' },
  { key: 'memo', header: 'Memo' },
  { key: 'total', header: 'Total', formatter: formatCurrency },
  { key: 'balance', header: 'Balance', formatter: formatCurrency },
  { key: 'status', header: 'Status' },
  { key: 'emailStatus', header: 'Email Status' },
];

export const billExportColumns: ExportColumn<Bill>[] = [
  { key: 'docNumber', header: 'Doc #' },
  { key: 'txnDate', header: 'Date', formatter: formatDate },
  { key: 'dueDate', header: 'Due Date', formatter: formatDate },
  { key: 'vendor.name', header: 'Vendor' },
  { key: 'memo', header: 'Memo' },
  { key: 'total', header: 'Total', formatter: formatCurrency },
  { key: 'balance', header: 'Balance', formatter: formatCurrency },
  { key: 'status', header: 'Status' },
  { key: 'paymentStatus', header: 'Payment Status' },
];

export const journalEntryExportColumns: ExportColumn<JournalEntry>[] = [
  { key: 'docNumber', header: 'Doc #' },
  { key: 'txnDate', header: 'Date', formatter: formatDate },
  { key: 'memo', header: 'Memo' },
  { key: 'totalDebit', header: 'Total Debit', formatter: formatCurrency },
  { key: 'totalCredit', header: 'Total Credit', formatter: formatCurrency },
  { key: 'status', header: 'Status' },
];

export const customerPaymentExportColumns: ExportColumn<CustomerPayment>[] = [
  { key: 'txnDate', header: 'Payment Date', formatter: formatDate },
  { key: 'customerName', header: 'Customer' },
  { key: 'amount', header: 'Amount', formatter: formatCurrency },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'referenceNumber', header: 'Reference #' },
  { key: 'memo', header: 'Memo' },
  { key: 'syncStatus', header: 'Status' },
];

export const vendorPaymentExportColumns: ExportColumn<VendorPayment>[] = [
  { key: 'txnDate', header: 'Payment Date', formatter: formatDate },
  { key: 'vendorName', header: 'Vendor' },
  { key: 'amount', header: 'Amount', formatter: formatCurrency },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'referenceNumber', header: 'Reference #' },
  { key: 'memo', header: 'Memo' },
  { key: 'syncStatus', header: 'Status' },
];

export const creditMemoExportColumns: ExportColumn<CreditMemo>[] = [
  { key: 'txnDate', header: 'Credit Date', formatter: formatDate },
  { key: 'customerName', header: 'Customer' },
  { key: 'invoiceId', header: 'Invoice #' },
  { key: 'totalAmount', header: 'Amount', formatter: formatCurrency },
  { key: 'status', header: 'Status' },
  { key: 'memo', header: 'Memo' },
];

export const depositExportColumns: ExportColumn<Deposit>[] = [
  { key: 'txnDate', header: 'Deposit Date', formatter: formatDate },
  { key: 'bankAccountName', header: 'Bank Account' },
  { key: 'referenceNumber', header: 'Reference #' },
  { key: 'totalAmount', header: 'Amount', formatter: formatCurrency },
  { key: 'status', header: 'Status' },
  { key: 'memo', header: 'Memo' },
];
