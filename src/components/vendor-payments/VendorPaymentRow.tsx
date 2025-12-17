import { memo } from 'react';
import { VendorPayment } from '@/services/dataService';
import { cn } from '@/lib/utils';

interface VendorPaymentRowProps {
  payment: VendorPayment;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  style: React.CSSProperties;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const syncStatusConfig = {
  synced: { label: 'Synced', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  error: { label: 'Error', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  SYNCED: { label: 'Synced', className: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  PENDING_SYNC: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  FAILED: { label: 'Failed', className: 'bg-red-500/20 text-red-600 dark:text-red-400' },
};

const paymentMethodConfig = {
  'Cash': { label: 'Cash', className: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  'Check': { label: 'Check', className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  'Credit Card': { label: 'Card', className: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' },
  'Bank Transfer': { label: 'Transfer', className: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
  'Wire Transfer': { label: 'Wire', className: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
  'ACH': { label: 'ACH', className: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
  'Other': { label: 'Other', className: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' },
};

export const VendorPaymentRow = memo(({ payment, isSelected, isFocused, isMultiSelected, style, onClick, onDoubleClick }: VendorPaymentRowProps) => {
  const syncStatus = syncStatusConfig[payment.syncStatus || 'pending'] || syncStatusConfig.pending;
  const paymentMethod = paymentMethodConfig[payment.paymentMethod || 'Other'] || { label: payment.paymentMethod || 'N/A', className: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' };

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
      {/* Payment Number / Reference */}
      <div className="w-28 font-medium truncate">
        {payment.referenceNumber || payment.id.slice(0, 8)}
      </div>
      
      {/* Date */}
      <div className="w-24 font-mono-nums text-muted-foreground">
        {formatDate(payment.txnDate)}
      </div>
      
      {/* Vendor */}
      <div className="flex-1 min-w-0 truncate">
        {payment.vendorName || 'Unknown Vendor'}
      </div>
      
      {/* Amount */}
      <div className="w-36 font-mono-nums text-right pr-2">
        {formatCurrency(payment.amount)}
      </div>
      
      {/* Payment Method */}
      <div className="w-32 flex items-center pl-2">
        <span className={cn(
          'px-1.5 py-0.5 rounded text-[10px] font-medium',
          paymentMethod.className
        )}>
          {paymentMethod.label}
        </span>
      </div>
    </div>
  );
});

VendorPaymentRow.displayName = 'VendorPaymentRow';
