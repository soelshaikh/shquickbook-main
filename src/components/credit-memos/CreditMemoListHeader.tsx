interface CreditMemoListHeaderProps {
  selectedCount: number;
  totalCount: number;
}

export function CreditMemoListHeader({ selectedCount, totalCount }: CreditMemoListHeaderProps) {
  return (
    <div className="h-8 flex items-center px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30">
      {selectedCount > 0 ? (
        <span className="text-foreground">{selectedCount} of {totalCount} selected</span>
      ) : (
        <>
          <div className="w-24">Memo #</div>
          <div className="w-24">Date</div>
          <div className="flex-1">Customer</div>
          <div className="w-28 text-right">Amount</div>
          <div className="w-20 text-center">Status</div>
        </>
      )}
    </div>
  );
}
