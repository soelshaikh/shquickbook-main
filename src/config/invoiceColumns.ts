// Centralized column configuration for Invoice list
// This ensures header and rows always have matching widths and alignment

export interface InvoiceColumnStyle {
  key: string;
  headerClass: string;
  cellClass: string;
  label: string;
}

export const INVOICE_COLUMN_STYLES: Record<string, InvoiceColumnStyle> = {
  docNumber: {
    key: 'docNumber',
    headerClass: 'w-24',
    cellClass: 'w-24 font-medium',
    label: 'Doc #',
  },
  txnDate: {
    key: 'txnDate',
    headerClass: 'w-24',
    cellClass: 'w-24 font-mono-nums text-muted-foreground',
    label: 'Date',
  },
  dueDate: {
    key: 'dueDate',
    headerClass: 'w-24',
    cellClass: 'w-24 font-mono-nums',
    label: 'Due Date',
  },
  customer: {
    key: 'customer',
    headerClass: 'flex-1 min-w-0',
    cellClass: 'flex-1 min-w-0 truncate',
    label: 'Customer',
  },
  total: {
    key: 'total',
    headerClass: 'w-24 text-right font-mono-nums',
    cellClass: 'w-24 font-mono-nums text-right',
    label: 'Amount',
  },
  status: {
    key: 'status',
    headerClass: 'w-20 flex justify-center',
    cellClass: 'w-20 flex justify-center',
    label: 'Status',
  },
  emailStatus: {
    key: 'emailStatus',
    headerClass: 'w-8 flex justify-center',
    cellClass: 'w-8 flex justify-center',
    label: '', // Icon only, no label
  },
  memo: {
    key: 'memo',
    headerClass: 'w-32 min-w-0 truncate',
    cellClass: 'w-32 min-w-0 truncate text-muted-foreground',
    label: 'Memo',
  },
};
