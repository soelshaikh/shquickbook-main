import { cn } from '@/lib/utils';

interface InvoiceListHeaderProps {
  selectedCount: number;
  totalCount: number;
}

export function InvoiceListHeader({ selectedCount, totalCount }: InvoiceListHeaderProps) {
  return (
    <div className="h-8 flex items-center text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 px-3">
      {selectedCount > 0 ? (
        <span className="text-foreground">{selectedCount} of {totalCount} selected</span>
      ) : (
        <>
          <div className="w-24">Doc #</div>
          <div className="w-24">Date</div>
          <div className="w-24">Due Date</div>
          <div className="flex-1">Customer</div>
          <div className="w-24 text-right font-mono-nums">Total</div>
          <div className="w-20 text-center">Status</div>
          <div className="w-8 text-center">Email</div>
        </>
      )}
    </div>
  );
}
