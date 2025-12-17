/**
 * Entity Filter Configurations
 * 
 * Defines filterable fields and operators for each entity.
 * Add new entities here without modifying the AdvancedFilter component.
 */

import { FilterConfig, FilterOperator } from '@/types/filter';

/**
 * Common operator sets for reuse
 */
const TEXT_OPERATORS: FilterOperator[] = [
  'equals',
  'notEquals',
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  'isEmpty',
  'isNotEmpty',
];

const NUMBER_OPERATORS: FilterOperator[] = [
  'equals',
  'notEquals',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'between',
  'isEmpty',
  'isNotEmpty',
];

const DATE_OPERATORS: FilterOperator[] = [
  'equals',
  'notEquals',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'between',
];

const SELECT_OPERATORS: FilterOperator[] = [
  'equals',
  'notEquals',
  'in',
  'notIn',
];

const BOOLEAN_OPERATORS: FilterOperator[] = ['equals'];

/**
 * Transaction Filter Configuration
 */
export const TRANSACTION_FILTER_CONFIG: FilterConfig = {
  entity: 'Transaction',
  fields: [
    {
      key: 'entity',
      label: 'Entity',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter entity name...',
    },
    {
      key: 'memo',
      label: 'Memo',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter memo...',
    },
    {
      key: 'docNumber',
      label: 'Document Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter doc number...',
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'balance',
      label: 'Balance',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter balance...',
    },
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'account',
      label: 'Account',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter account...',
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Invoice', value: 'invoice' },
        { label: 'Bill', value: 'bill' },
        { label: 'Payment', value: 'payment' },
        { label: 'Expense', value: 'expense' },
        { label: 'Journal', value: 'journal' },
        { label: 'Deposit', value: 'deposit' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Synced', value: 'synced' },
        { label: 'Pending', value: 'pending' },
        { label: 'Error', value: 'error' },
        { label: 'Conflict', value: 'conflict' },
      ],
    },
  ],
};

/**
 * Invoice Filter Configuration
 */
export const INVOICE_FILTER_CONFIG: FilterConfig = {
  entity: 'Invoice',
  fields: [
    {
      key: 'docNumber',
      label: 'Invoice Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter invoice number...',
    },
    {
      key: 'customer',
      label: 'Customer Name',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter customer name...',
    },
    {
      key: 'total',
      label: 'Total Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'balance',
      label: 'Balance',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter balance...',
    },
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Viewed', value: 'viewed' },
        { label: 'Partial', value: 'partial' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Voided', value: 'voided' },
      ],
    },
  ],
};

/**
 * Bill Filter Configuration
 */
export const BILL_FILTER_CONFIG: FilterConfig = {
  entity: 'Bill',
  fields: [
    {
      key: 'docNumber',
      label: 'Bill Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter bill number...',
    },
    {
      key: 'vendorName',
      label: 'Vendor Name',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter vendor name...',
    },
    {
      key: 'total',
      label: 'Total Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'balance',
      label: 'Balance',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter balance...',
    },
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Partial', value: 'partial' },
      ],
    },
  ],
};

/**
 * Journal Entry Filter Configuration
 */
export const JOURNAL_ENTRY_FILTER_CONFIG: FilterConfig = {
  entity: 'Journal Entry',
  fields: [
    {
      key: 'docNumber',
      label: 'Entry Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter entry number...',
    },
    {
      key: 'memo',
      label: 'Memo',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter memo...',
    },
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'totalDebit',
      label: 'Total Debit',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter debit amount...',
    },
    {
      key: 'totalCredit',
      label: 'Total Credit',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter credit amount...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Posted', value: 'posted' },
        { label: 'Voided', value: 'voided' },
      ],
    },
  ],
};

/**
 * Customer Payment Filter Configuration
 */
export const CUSTOMER_PAYMENT_FILTER_CONFIG: FilterConfig = {
  entity: 'Customer Payment',
  fields: [
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Cash', value: 'Cash' },
        { label: 'Check', value: 'Check' },
        { label: 'Credit Card', value: 'Credit Card' },
        { label: 'Bank Transfer', value: 'Bank Transfer' },
        { label: 'ACH', value: 'ACH' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      key: 'referenceNumber',
      label: 'Reference Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter reference number...',
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter customer name...',
    },
    {
      key: 'memo',
      label: 'Memo',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter memo...',
    },
  ],
};

/**
 * Vendor Payment Filter Configuration
 */
export const VENDOR_PAYMENT_FILTER_CONFIG: FilterConfig = {
  entity: 'Vendor Payment',
  fields: [
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Cash', value: 'Cash' },
        { label: 'Check', value: 'Check' },
        { label: 'Credit Card', value: 'Credit Card' },
        { label: 'Bank Transfer', value: 'Bank Transfer' },
        { label: 'ACH', value: 'ACH' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      key: 'referenceNumber',
      label: 'Reference Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter reference number...',
    },
    {
      key: 'vendorName',
      label: 'Vendor Name',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter vendor name...',
    },
    {
      key: 'memo',
      label: 'Memo',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter memo...',
    },
  ],
};

/**
 * Credit Memo Filter Configuration
 */
export const CREDIT_MEMO_FILTER_CONFIG: FilterConfig = {
  entity: 'Credit Memo',
  fields: [
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter customer name...',
    },
    {
      key: 'invoiceId',
      label: 'Invoice ID',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter invoice ID...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending', value: 'pending' },
        { label: 'Applied', value: 'applied' },
        { label: 'Voided', value: 'voided' },
      ],
    },
    {
      key: 'memo',
      label: 'Memo',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter memo...',
    },
  ],
};

/**
 * Deposit Filter Configuration
 */
export const DEPOSIT_FILTER_CONFIG: FilterConfig = {
  entity: 'Deposit',
  fields: [
    {
      key: 'txnDate',
      label: 'Transaction Date',
      type: 'date',
      operators: DATE_OPERATORS,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      type: 'number',
      operators: NUMBER_OPERATORS,
      placeholder: 'Enter amount...',
    },
    {
      key: 'bankAccountName',
      label: 'Bank Account',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter bank account...',
    },
    {
      key: 'referenceNumber',
      label: 'Reference Number',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter reference number...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      operators: SELECT_OPERATORS,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Cleared', value: 'cleared' },
        { label: 'Reconciled', value: 'reconciled' },
        { label: 'Voided', value: 'voided' },
      ],
    },
    {
      key: 'memo',
      label: 'Memo',
      type: 'text',
      operators: TEXT_OPERATORS,
      placeholder: 'Enter memo...',
    },
  ],
};

/**
 * Helper to get filter config by entity type
 */
export function getFilterConfig(entityType: 'transaction' | 'invoice' | 'bill' | 'journalEntry'): FilterConfig {
  switch (entityType) {
    case 'transaction':
      return TRANSACTION_FILTER_CONFIG;
    case 'invoice':
      return INVOICE_FILTER_CONFIG;
    case 'bill':
      return BILL_FILTER_CONFIG;
    case 'journalEntry':
      return JOURNAL_ENTRY_FILTER_CONFIG;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
