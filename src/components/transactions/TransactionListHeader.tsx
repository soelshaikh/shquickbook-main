import { forwardRef } from 'react';

interface TransactionListHeaderProps {
  selectedCount: number;
  totalCount: number;
}

export const TransactionListHeader = forwardRef<HTMLDivElement, TransactionListHeaderProps>(
  function TransactionListHeader({ selectedCount, totalCount }, ref) {
    return (
      <div ref={ref} className="flex items-center h-8 px-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground sticky top-0 z-10">
        {/* Status */}
        <div className="w-6 flex-shrink-0" />

        {/* Date */}
        <div className="w-24 flex-shrink-0">Date</div>

        {/* Type */}
        <div className="w-16 flex-shrink-0">Type</div>

        {/* Doc Number */}
        <div className="w-28 flex-shrink-0">Doc #</div>

        {/* Entity */}
        <div className="flex-1 min-w-0">Entity</div>

        {/* Memo */}
        <div className="w-40 flex-shrink-0">Memo</div>

        {/* Account */}
        <div className="w-36 flex-shrink-0">Account</div>

        {/* Amount */}
        <div className="w-28 flex-shrink-0 text-right">Amount</div>

        {/* Balance */}
        <div className="w-28 flex-shrink-0 text-right">Balance</div>

        {/* Selection indicator */}
        {selectedCount > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">
            {selectedCount} of {totalCount} selected
          </div>
        )}
      </div>
    );
  }
);
