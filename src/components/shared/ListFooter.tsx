interface ListFooterProps {
  itemCount: number;
  itemLabel?: string;
  showHints?: boolean;
}

export function ListFooter({ 
  itemCount, 
  itemLabel = 'items',
  showHints = true 
}: ListFooterProps) {
  return (
    <div className="h-7 px-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
      <span>{itemCount} {itemLabel}</span>
      {showHints && (
        <div className="flex items-center gap-4">
          <span>
            Navigate: <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd>
          </span>
          <span>
            Multi-select: <kbd className="kbd">Shift</kbd>+<kbd className="kbd">↑↓</kbd>
          </span>
          <span>
            Select all: <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">A</kbd>
          </span>
          <span>
            Export: <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">Shift</kbd>+<kbd className="kbd">E</kbd>
          </span>
        </div>
      )}
    </div>
  );
}
