import { forwardRef, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/data/mockTransactions';
import { format } from 'date-fns';
import { 
  Check, 
  RefreshCw, 
  AlertCircle, 
  AlertTriangle,
  FileText,
  Receipt,
  CreditCard,
  DollarSign,
  BookOpen,
  ArrowDownCircle
} from 'lucide-react';

interface TransactionDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="h-4 w-4" />,
  bill: <Receipt className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  expense: <DollarSign className="h-4 w-4" />,
  journal: <BookOpen className="h-4 w-4" />,
  deposit: <ArrowDownCircle className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  invoice: 'Invoice',
  bill: 'Bill',
  payment: 'Payment',
  expense: 'Expense',
  journal: 'Journal Entry',
  deposit: 'Deposit',
};

export const TransactionDetail = forwardRef<HTMLDivElement, TransactionDetailProps>(
  function TransactionDetail({ open, onOpenChange, transaction }, ref) {
    // Keyboard shortcuts for the detail panel
    useEffect(() => {
      if (!open) return;

      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onOpenChange(false);
        }
      };

      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [open, onOpenChange]);

    if (!transaction) return null;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'MMMM d, yyyy');
      } catch {
        return dateStr;
      }
    };

    const getSyncStatusBadge = () => {
      switch (transaction.status) {
        case 'synced':
          return (
            <Badge variant="outline" className="gap-1 text-[hsl(var(--sync-synced))] border-[hsl(var(--sync-synced)/0.3)]">
              <Check className="h-3 w-3" />
              Synced
            </Badge>
          );
        case 'pending':
          return (
            <Badge variant="outline" className="gap-1 text-[hsl(var(--sync-pending))] border-[hsl(var(--sync-pending)/0.3)]">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Pending
            </Badge>
          );
        case 'error':
          return (
            <Badge variant="outline" className="gap-1 text-[hsl(var(--sync-error))] border-[hsl(var(--sync-error)/0.3)]">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          );
        case 'conflict':
          return (
            <Badge variant="outline" className="gap-1 text-[hsl(var(--sync-conflict))] border-[hsl(var(--sync-conflict)/0.3)]">
              <AlertTriangle className="h-3 w-3" />
              Conflict
            </Badge>
          );
      }
    };

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" ref={ref}>
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{typeIcons[transaction.type]}</span>
              <SheetTitle className="flex-1">{typeLabels[transaction.type]}</SheetTitle>
              {/* Only show sync status badge for errors/conflicts */}
              {(transaction.status === 'error' || transaction.status === 'conflict') && getSyncStatusBadge()}
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Primary Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Document #</p>
                <p className="text-sm font-medium font-mono-nums">{transaction.docNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="text-sm font-medium">{formatDate(transaction.date)}</p>
              </div>
            </div>

            {/* Entity */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Entity</p>
              <p className="text-sm font-medium">{transaction.entity}</p>
            </div>

            {/* Memo */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Memo</p>
              <p className="text-sm">{transaction.memo || '—'}</p>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Account</p>
              <p className="text-sm font-medium">{transaction.account}</p>
            </div>

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className={`text-lg font-semibold font-mono-nums ${
                  transaction.amount >= 0 ? 'text-[hsl(var(--sync-synced))]' : 'text-[hsl(var(--sync-error))]'
                }`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className="text-lg font-semibold font-mono-nums">
                  {formatCurrency(transaction.balance)}
                </p>
              </div>
            </div>

            {/* Quick Actions Hint */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="kbd text-[10px]">D</kbd> Edit date
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="kbd text-[10px]">M</kbd> Edit memo
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="kbd text-[10px]">Esc</kbd> Close
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

TransactionDetail.displayName = 'TransactionDetail';
