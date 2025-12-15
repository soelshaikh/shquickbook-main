import { forwardRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { Bill } from '@/data/mockBills';
import { Clock } from 'lucide-react';

interface BillRowProps {
  bill: Bill;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  paid: { label: 'Paid', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  overdue: { label: 'Overdue', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  partial: { label: 'Partial', className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
};

const paymentStatusConfig = {
  unpaid: { label: 'Unpaid', className: 'text-muted-foreground' },
  partial: { label: 'Partial', className: 'text-blue-600 dark:text-blue-400' },
  paid: { label: 'Paid', className: 'text-green-600 dark:text-green-400' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function isOverdue(dueDate: string, status: Bill['status']): boolean {
  if (status === 'paid') return false;
  return new Date(dueDate) < new Date();
}

export const BillRow = forwardRef<HTMLDivElement, BillRowProps>(
  ({ bill, isSelected, isFocused, isMultiSelected, style, onClick, onDoubleClick }, ref) => {
    // Safety check: default to draft if status not found
    const status = statusConfig[bill.status] || statusConfig.draft;
    const paymentStatus = paymentStatusConfig[bill.paymentStatus] || paymentStatusConfig.unpaid;
    const overdue = isOverdue(bill.dueDate, bill.status);

    return (
      <div
        ref={ref}
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
        <div className="w-24 font-medium">{bill.docNumber}</div>
        
        {/* Date */}
        <div className="w-24 font-mono-nums text-muted-foreground">
          {formatDate(bill.txnDate)}
        </div>
        
        {/* Due Date */}
        <div className={cn(
          'w-24 font-mono-nums flex items-center gap-1',
          overdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {overdue && <Clock className="h-3 w-3" />}
          {formatDate(bill.dueDate)}
        </div>
        
        {/* Vendor */}
        <div className="flex-1 min-w-0 truncate">
          {bill.vendor.name}
        </div>
        
        {/* Total */}
        <div className="w-24 font-mono-nums text-right">
          {formatCurrency(bill.total)}
        </div>
        
        {/* Balance */}
        <div className={cn(
          'w-24 font-mono-nums text-right',
          bill.balance > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {formatCurrency(bill.balance)}
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
        
        {/* Payment Status */}
        <div className="w-16 text-center">
          <span className={cn('text-[10px] font-medium', paymentStatus.className)}>
            {paymentStatus.label}
          </span>
        </div>
      </div>
    );
  }
);

BillRow.displayName = 'BillRow';
