import { memo } from 'react';
import { Invoice } from '@/data/mockInvoices';
import { cn } from '@/lib/utils';
import { Mail, MailOpen, MailX, Send } from 'lucide-react';
import { ColumnConfig } from '@/types/columnConfig';
import { INVOICE_COLUMN_STYLES } from '@/config/invoiceColumns';

interface InvoiceRowProps {
  invoice: Invoice;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  visibleColumns?: ColumnConfig[];
  style: React.CSSProperties;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  viewed: { label: 'Viewed', className: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' },
  partial: { label: 'Partial', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  paid: { label: 'Paid', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  overdue: { label: 'Overdue', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  voided: { label: 'Voided', className: 'bg-muted text-muted-foreground line-through' },
};

const emailConfig = {
  not_sent: { icon: Mail, className: 'text-muted-foreground' },
  sent: { icon: Send, className: 'text-blue-500' },
  delivered: { icon: Mail, className: 'text-primary' },
  opened: { icon: MailOpen, className: 'text-primary' },
  bounced: { icon: MailX, className: 'text-destructive' },
};

export const InvoiceRow = memo(({ invoice, isSelected, isFocused, isMultiSelected, visibleColumns, style, onClick, onDoubleClick }: InvoiceRowProps) => {
  // Safety check: default to draft if status not found
  const status = statusConfig[invoice.status] || statusConfig.draft;
  const email = emailConfig[invoice.emailStatus] || emailConfig.not_sent;
  const EmailIcon = email.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const isOverdue = invoice.status === 'overdue' || 
    (invoice.balance > 0 && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'voided');
  
  // Helper function to check if a column is visible
  const isColumnVisible = (key: string) => {
    if (!visibleColumns || visibleColumns.length === 0) return true; // Show all if no config
    return visibleColumns.some(col => col.key === key);
  };

  return (
    <div
      data-invoice-id={invoice.id}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        'h-8 flex items-center px-3 text-xs cursor-pointer border-b border-border/50 transition-colors',
        isSelected && !isMultiSelected && 'bg-primary/10',
        isMultiSelected && 'bg-primary/20 border-l-2 border-l-primary',
        isFocused && 'ring-1 ring-inset ring-primary',
        !isSelected && !isFocused && 'hover:bg-muted/50'
      )}
    >
      {/* Render columns using centralized styles */}
      {isColumnVisible('docNumber') && (
        <div className={INVOICE_COLUMN_STYLES.docNumber.cellClass}>
          {invoice.docNumber}
        </div>
      )}
      
      {isColumnVisible('txnDate') && (
        <div className={INVOICE_COLUMN_STYLES.txnDate.cellClass}>
          {formatDate(invoice.txnDate)}
        </div>
      )}
      
      {isColumnVisible('dueDate') && (
        <div className={cn(
          INVOICE_COLUMN_STYLES.dueDate.cellClass,
          isOverdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {formatDate(invoice.dueDate)}
        </div>
      )}
      
      {isColumnVisible('customer') && (
        <div className={INVOICE_COLUMN_STYLES.customer.cellClass}>
          {invoice.customer}
        </div>
      )}
      
      {isColumnVisible('total') && (
        <div className={INVOICE_COLUMN_STYLES.total.cellClass}>
          {formatCurrency(invoice.total)}
        </div>
      )}
      
      {isColumnVisible('status') && (
        <div className={INVOICE_COLUMN_STYLES.status.cellClass}>
          <span className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            status.className
          )}>
            {status.label}
          </span>
        </div>
      )}
      
      {isColumnVisible('emailStatus') && (
        <div className={INVOICE_COLUMN_STYLES.emailStatus.cellClass}>
          <EmailIcon className={cn('h-3.5 w-3.5', email.className)} />
        </div>
      )}
      
      {isColumnVisible('memo') && (
        <div className={INVOICE_COLUMN_STYLES.memo.cellClass}>
          {invoice.memo || '—'}
        </div>
      )}
    </div>
  );
});

InvoiceRow.displayName = 'InvoiceRow';
