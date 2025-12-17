import { memo } from 'react';
import { Deposit } from '@/services/dataService';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface DepositRowProps {
  deposit: Deposit;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  style: React.CSSProperties;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  cleared: { label: 'Cleared', className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  reconciled: { label: 'Reconciled', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  voided: { label: 'Voided', className: 'bg-muted text-muted-foreground line-through' },
};

export const DepositRow = memo(({ deposit, isSelected, isFocused, isMultiSelected, style, onClick, onDoubleClick }: DepositRowProps) => {
  const status = statusConfig[deposit.status || 'pending'] || statusConfig.pending;

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
      {/* Deposit Number */}
      <div className="w-24 font-medium">
        DEP-{deposit.id.slice(0, 6)}
      </div>
      
      {/* Date */}
      <div className="w-24 font-mono-nums text-muted-foreground">
        {formatDate(deposit.txnDate)}
      </div>
      
      {/* Account */}
      <div className="flex-1 min-w-0 truncate">
        {deposit.depositToAccountName || 'Bank Account'}
      </div>
      
      {/* Total Amount */}
      <div className="w-28 font-mono-nums text-right">
        {formatCurrency(deposit.totalAmount)}
      </div>
      
      {/* Line Items Count */}
      <div className="w-16 text-center text-muted-foreground">
        {deposit.lineItems?.length || 0}
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

DepositRow.displayName = 'DepositRow';
