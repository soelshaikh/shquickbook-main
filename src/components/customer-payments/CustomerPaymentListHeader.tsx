interface CustomerPaymentListHeaderProps {
  selectedCount: number;
  totalCount: number;
}

export function CustomerPaymentListHeader({ selectedCount, totalCount }: CustomerPaymentListHeaderProps) {
  return (
    <div className="h-8 flex items-center px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30">
      {selectedCount > 0 ? (
        <span className="text-foreground">{selectedCount} of {totalCount} selected</span>
      ) : (
        <>
          <div className="w-28">Payment #</div>
          <div className="w-24">Date</div>
          <div className="flex-1 min-w-0">Customer</div>
          <div className="w-36 text-right pr-2">Amount</div>
          <div className="w-32 pl-2">Method</div>
        </>
      )}
    </div>
  );
}
