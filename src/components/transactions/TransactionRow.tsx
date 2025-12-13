import { forwardRef } from 'react';
import { Transaction, TransactionType } from '@/data/mockTransactions';
import { FileText, Receipt, CreditCard, Wallet, BookOpen, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  isFocused: boolean;
  isMultiSelected?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

const typeIcons: Record<TransactionType, React.ReactNode> = {
  invoice: <FileText className="h-3.5 w-3.5" />,
  bill: <Receipt className="h-3.5 w-3.5" />,
  payment: <CreditCard className="h-3.5 w-3.5" />,
  expense: <Wallet className="h-3.5 w-3.5" />,
  journal: <BookOpen className="h-3.5 w-3.5" />,
  deposit: <PiggyBank className="h-3.5 w-3.5" />,
};

const typeLabels: Record<TransactionType, string> = {
  invoice: 'INV',
  bill: 'BILL',
  payment: 'PMT',
  expense: 'EXP',
  journal: 'JE',
  deposit: 'DEP',
};

const statusColors: Record<string, string> = {
  synced: 'bg-[hsl(var(--sync-synced))]',
  pending: 'bg-[hsl(var(--sync-pending))]',
  error: 'bg-[hsl(var(--sync-error))]',
  conflict: 'bg-[hsl(var(--sync-conflict))]',
};

function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `(${formatted})` : formatted;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export const TransactionRow = forwardRef<HTMLDivElement, TransactionRowProps>(
  function TransactionRow({ transaction, isSelected, isFocused, isMultiSelected, onClick, onDoubleClick }, ref) {
    return (
      <div
        ref={ref}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={cn(
          'flex items-center h-8 px-3 border-b border-border/50 text-sm cursor-pointer transition-colors',
          isSelected && !isMultiSelected && 'bg-primary/10',
          isMultiSelected && 'bg-primary/20 border-l-2 border-l-primary',
          isFocused && 'ring-1 ring-inset ring-primary',
          !isSelected && !isFocused && 'hover:bg-muted/50'
        )}
      >
        {/* Status indicator */}
        <div className="w-6 flex-shrink-0">
          <div className={cn('w-1.5 h-1.5 rounded-full', statusColors[transaction.status])} />
        </div>

        {/* Date */}
        <div className="w-24 flex-shrink-0 font-mono-nums text-xs text-muted-foreground">
          {formatDate(transaction.date)}
        </div>

        {/* Type */}
        <div className="w-16 flex-shrink-0 flex items-center gap-1.5 text-muted-foreground">
          {typeIcons[transaction.type]}
          <span className="text-xs font-medium">{typeLabels[transaction.type]}</span>
        </div>

        {/* Doc Number */}
        <div className="w-28 flex-shrink-0 font-mono-nums text-xs">
          {transaction.docNumber}
        </div>

        {/* Entity */}
        <div className="flex-1 min-w-0 truncate">
          {transaction.entity}
        </div>

        {/* Memo */}
        <div className="w-40 flex-shrink-0 truncate text-muted-foreground text-xs">
          {transaction.memo}
        </div>

        {/* Account */}
        <div className="w-36 flex-shrink-0 truncate text-muted-foreground text-xs">
          {transaction.account}
        </div>

        {/* Amount */}
        <div className={cn(
          'w-28 flex-shrink-0 text-right font-mono-nums',
          transaction.amount < 0 ? 'text-destructive' : 'text-foreground'
        )}>
          {formatCurrency(transaction.amount)}
        </div>

        {/* Balance */}
        <div className={cn(
          'w-28 flex-shrink-0 text-right font-mono-nums',
          transaction.balance < 0 ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {formatCurrency(transaction.balance)}
        </div>
      </div>
    );
  }
);
