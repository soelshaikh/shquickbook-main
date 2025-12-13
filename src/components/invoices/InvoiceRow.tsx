import { memo } from 'react';
import { Invoice } from '@/data/mockInvoices';
import { cn } from '@/lib/utils';
import { Mail, MailOpen, MailX, Send } from 'lucide-react';

interface InvoiceRowProps {
  invoice: Invoice;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
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

export const InvoiceRow = memo(({ invoice, isSelected, isFocused, isMultiSelected, style, onClick, onDoubleClick }: InvoiceRowProps) => {
  const status = statusConfig[invoice.status];
  const email = emailConfig[invoice.emailStatus];
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

  return (
    <div
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
      {/* Doc Number */}
      <div className="w-24 font-medium">{invoice.docNumber}</div>
      
      {/* Date */}
      <div className="w-24 font-mono-nums text-muted-foreground">
        {formatDate(invoice.txnDate)}
      </div>
      
      {/* Due Date */}
      <div className={cn(
        'w-24 font-mono-nums',
        isOverdue ? 'text-red-500' : 'text-muted-foreground'
      )}>
        {formatDate(invoice.dueDate)}
      </div>
      
      {/* Customer */}
      <div className="flex-1 min-w-0 truncate">
        {invoice.customer}
      </div>
      
      {/* Total */}
      <div className="w-24 font-mono-nums text-right">
        {formatCurrency(invoice.total)}
      </div>
      
      {/* Status */}
      <div className="w-20 flex justify-center">
        <span className={cn(
          'px-1.5 py-0.5 rounded text-[10px] font-medium',
          status.className
        )}>
          {status.label}
        </span>
      </div>
      
      {/* Email Status */}
      <div className="w-8 flex justify-center">
        <EmailIcon className={cn('h-3.5 w-3.5', email.className)} />
      </div>
    </div>
  );
});

InvoiceRow.displayName = 'InvoiceRow';
