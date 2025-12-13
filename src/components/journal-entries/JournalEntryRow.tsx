import { forwardRef, CSSProperties } from 'react';
import { JournalEntry } from '@/data/mockJournalEntries';
import { cn } from '@/lib/utils';

interface JournalEntryRowProps {
  entry: JournalEntry;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

const statusColors: Record<JournalEntry['status'], string> = {
  draft: 'text-muted-foreground',
  posted: 'text-primary',
  voided: 'text-destructive',
};

const statusLabels: Record<JournalEntry['status'], string> = {
  draft: 'Draft',
  posted: 'Posted',
  voided: 'Voided',
};

function formatCurrency(amount: number): string {
  if (amount === 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

export const JournalEntryRow = forwardRef<HTMLDivElement, JournalEntryRowProps>(
  ({ entry, isSelected, isFocused, isMultiSelected, style, onClick, onDoubleClick }, ref) => {
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
        {/* Status */}
        <div className={cn('w-20', statusColors[entry.status])}>
          {statusLabels[entry.status]}
        </div>

        {/* Date */}
        <div className="w-24 font-mono-nums">
          {formatDate(entry.txnDate)}
        </div>

        {/* Doc Number */}
        <div className="w-28 font-medium">
          {entry.docNumber}
        </div>

        {/* Memo */}
        <div className="flex-1 truncate text-muted-foreground">
          {entry.memo || '—'}
        </div>

        {/* Debit */}
        <div className="w-32 text-right font-mono-nums">
          {formatCurrency(entry.totalDebit)}
        </div>

        {/* Credit */}
        <div className="w-32 text-right font-mono-nums">
          {formatCurrency(entry.totalCredit)}
        </div>
      </div>
    );
  }
);

JournalEntryRow.displayName = 'JournalEntryRow';
