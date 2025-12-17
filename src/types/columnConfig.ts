// Column configuration types for customizable list views

export interface ColumnConfig {
  key: string;           // Unique identifier (e.g., 'docNumber', 'customer')
  label: string;         // Display name (e.g., 'Invoice #', 'Customer')
  visible: boolean;      // Whether column is currently visible
  required?: boolean;    // If true, user cannot hide this column
  width?: string;        // Column width (e.g., '150px', 'auto')
}

export interface UserColumnPreferences {
  invoices?: ColumnConfig[];
  bills?: ColumnConfig[];
  transactions?: ColumnConfig[];
  journalEntries?: ColumnConfig[];
  customerPayments?: ColumnConfig[];
  vendorPayments?: ColumnConfig[];
  creditMemos?: ColumnConfig[];
  deposits?: ColumnConfig[];
}

export const INVOICE_DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'docNumber', label: 'Invoice #', visible: true, required: true },
  { key: 'txnDate', label: 'Date', visible: true },
  { key: 'dueDate', label: 'Due Date', visible: true },
  { key: 'customer', label: 'Customer', visible: true, required: true },
  { key: 'total', label: 'Amount', visible: true, required: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'emailStatus', label: 'Email', visible: true },
  { key: 'memo', label: 'Memo', visible: true },
];

export const BILL_DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'docNumber', label: 'Bill #', visible: true, required: true },
  { key: 'txnDate', label: 'Date', visible: true },
  { key: 'dueDate', label: 'Due Date', visible: true },
  { key: 'vendor', label: 'Vendor', visible: true, required: true },
  { key: 'total', label: 'Amount', visible: true, required: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'memo', label: 'Memo', visible: true },
];
