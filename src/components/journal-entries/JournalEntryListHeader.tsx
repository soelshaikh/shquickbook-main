interface JournalEntryListHeaderProps {
  selectedCount: number;
  totalCount: number;
}

export function JournalEntryListHeader({ selectedCount, totalCount }: JournalEntryListHeaderProps) {
  return (
    <div className="h-8 flex items-center text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 px-3">
      {selectedCount > 0 ? (
        <span className="text-foreground">{selectedCount} of {totalCount} selected</span>
      ) : (
        <>
          <div className="w-20">Status</div>
          <div className="w-24">Date</div>
          <div className="w-28">Doc #</div>
          <div className="flex-1">Memo</div>
          <div className="w-32 text-right font-mono-nums">Debit</div>
          <div className="w-32 text-right font-mono-nums">Credit</div>
        </>
      )}
    </div>
  );
}
