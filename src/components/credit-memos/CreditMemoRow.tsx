import { memo } from 'react';
import { CreditMemo } from '@/services/dataService';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface CreditMemoRowProps {
  creditMemo: CreditMemo;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  style: React.CSSProperties;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  applied: { label: 'Applied', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  voided: { label: 'Voided', className: 'bg-muted text-muted-foreground line-through' },
};

const syncStatusConfig = {
  pending: { icon: Clock, className: 'text-amber-500' },
  SYNCED: { icon: CheckCircle2, className: 'text-green-500' },
  PENDING_SYNC: { icon: Clock, className: 'text-amber-500' },
  FAILED: { icon: XCircle, className: 'text-red-500' },
};

export const CreditMemoRow = memo(({ creditMemo, isSelected, isFocused, isMultiSelected, style, onClick, onDoubleClick }: CreditMemoRowProps) => {
  const status = statusConfig[creditMemo.status] || statusConfig.draft;
  const syncStatus = syncStatusConfig[creditMemo.syncStatus || 'pending'] || syncStatusConfig.pending;
  const SyncIcon = syncStatus.icon;

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
      {/* Memo Number */}
      <div className="w-24 font-medium">
        CM-{creditMemo.id.slice(0, 6)}
      </div>
      
      {/* Date */}
      <div className="w-24 font-mono-nums text-muted-foreground">
        {formatDate(creditMemo.txnDate)}
      </div>
      
      {/* Customer */}
      <div className="flex-1 min-w-0 truncate">
        {creditMemo.customerName || 'Unknown Customer'}
      </div>
      
      {/* Total */}
      <div className="w-28 font-mono-nums text-right">
        {formatCurrency(creditMemo.totalAmount)}
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
    </div>
  );
});

CreditMemoRow.displayName = 'CreditMemoRow';
