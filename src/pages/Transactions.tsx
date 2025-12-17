import { forwardRef, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { FilterBar, FilterConfig, useFilterBar } from '@/components/shared/FilterBar';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionDetail } from '@/components/transactions/TransactionDetail';
import { ExportButton } from '@/components/shared/ExportButton';
import { RenderLimitWarning } from '@/components/shared/RenderLimitWarning';
import { Transaction } from '@/data/mockTransactions';
import { useTransactions } from '@/hooks/useTransactions';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { usePagePerformance } from '@/hooks/usePerformance';
import { exportToCSV } from '@/lib/csvExport';
import { transactionExportColumns } from '@/lib/exportConfigs';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { TransactionsErrorFallback } from '@/components/shared/FeatureErrorFallback';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { TRANSACTION_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';
import { applyFilters } from '@/lib/filterUtils';

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'type',
    label: 'Type',
    options: [
      { value: 'invoice', label: 'Invoice' },
      { value: 'payment', label: 'Payment' },
      { value: 'expense', label: 'Expense' },
      { value: 'bill', label: 'Bill' },
      { value: 'journal', label: 'Journal Entry' },
    ],
  },
  {
    type: 'status',
    label: 'Status',
    options: [
      { value: 'synced', label: 'Synced' },
      { value: 'pending', label: 'Pending' },
      { value: 'error', label: 'Error' },
    ],
  },
  {
    type: 'account',
    label: 'Account',
    options: [
      { value: 'checking', label: 'Checking' },
      { value: 'savings', label: 'Savings' },
      { value: 'receivable', label: 'Accounts Receivable' },
      { value: 'payable', label: 'Accounts Payable' },
    ],
  },
];

const Transactions = forwardRef<HTMLDivElement>((_, ref) => {
  usePagePerformance('Transactions');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: transactions = [], totalCount, isLoading, isFetching, error } = useTransactions('comp-1');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [quickEditMode, setQuickEditMode] = useState<'date' | 'memo' | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  
  // NEW: Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState<Filter[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const { registerHandler, unregisterHandler } = useKeyboard();
  const filterBar = useFilterBar();

  // Auto-focus list when navigated via keyboard shortcut
  useEffect(() => {
    if (searchParams.get('focus') === 'list') {
      setTimeout(() => listContainerRef.current?.focus(), 50);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    // Apply filter chips (old filter system)
    filterBar.filters.forEach(chip => {
      if (chip.type === 'type') {
        result = result.filter(txn => txn.type.toLowerCase() === chip.value);
      } else if (chip.type === 'status') {
        result = result.filter(txn => txn.status === chip.value);
      } else if (chip.type === 'account') {
        result = result.filter(txn => txn.account.toLowerCase().includes(chip.value));
      }
    });

    // Apply search query when filter bar is closed
    if (!filterBar.isOpen && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(txn => 
        txn.entity.toLowerCase().includes(query) ||
        txn.docNumber.toLowerCase().includes(query) ||
        txn.memo.toLowerCase().includes(query) ||
        txn.account.toLowerCase().includes(query)
      );
    }
    
    // NEW: Apply advanced filters
    if (advancedFilters.length > 0) {
      result = applyFilters(result, advancedFilters);
    }
    
    return result;
  }, [transactions, searchQuery, filterBar.filters, filterBar.isOpen, advancedFilters]);

  // Apply render limit AFTER filtering to ensure we search all data
  // but only render a safe amount
  const displayTransactions = useMemo(() => {
    const MAX_RENDER_LIMIT = 1000;
    return filteredTransactions.slice(0, MAX_RENDER_LIMIT);
  }, [filteredTransactions]);

  // Export handler
  const handleExport = useCallback(() => {
    exportToCSV({
      data: filteredTransactions,
      columns: transactionExportColumns,
      entityName: 'transactions',
      filters: filterBar.filters,
    });
    toast.success(`Exported ${filteredTransactions.length} transactions`);
  }, [filteredTransactions, filterBar.filters]);

  // Register keyboard handlers
  useEffect(() => {
    const handleToggleFilter = () => {
      filterBar.toggle();
    };

    const handleEditSelected = () => {
      if (selectedTransaction) {
        setDetailOpen(true);
      }
    };

    const handleExportView = () => {
      handleExport();
    };

    registerHandler('toggle-filter', handleToggleFilter);
    registerHandler('edit-selected', handleEditSelected);
    registerHandler('export-current-view', handleExportView);
    
    return () => {
      unregisterHandler('toggle-filter');
      unregisterHandler('edit-selected');
      unregisterHandler('export-current-view');
    };
  }, [registerHandler, unregisterHandler, selectedTransaction, filterBar, handleExport]);

  const handleTransactionSelect = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailOpen(true);
  }, []);

  // Quick edit handlers
  const startQuickEdit = useCallback((mode: 'date' | 'memo') => {
    if (!selectedTransaction) {
      toast.error('No transaction selected');
      return;
    }
    setQuickEditMode(mode);
    setQuickEditValue(mode === 'date' ? selectedTransaction.date : selectedTransaction.memo);
  }, [selectedTransaction]);

  const saveQuickEdit = useCallback(() => {
    if (!selectedTransaction || !quickEditMode) return;
    
    toast.success(`${quickEditMode === 'date' ? 'Date' : 'Memo'} updated`);
    setQuickEditMode(null);
    setQuickEditValue('');
  }, [selectedTransaction, quickEditMode]);

  const cancelQuickEdit = useCallback(() => {
    setQuickEditMode(null);
    setQuickEditValue('');
  }, []);

  // Quick edit keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (quickEditMode) {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancelQuickEdit();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            saveQuickEdit();
          }
        }
        return;
      }

      if (detailOpen) return;

      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        startQuickEdit('date');
      } else if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        startQuickEdit('memo');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [detailOpen, quickEditMode, startQuickEdit, saveQuickEdit, cancelQuickEdit]);

  return (
    <div ref={ref} className="h-full flex flex-col">
      <PageToolbar
        title="Transactions"
        searchPlaceholder="Search transactions..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        hideSearch={filterBar.isOpen}
        actions={
          <>
            <AdvancedFilter
              filters={advancedFilters}
              config={TRANSACTION_FILTER_CONFIG}
              onChange={setAdvancedFilters}
              triggerLabel="Add Filter"
              shortcutHint="⌘F"
            />
            <ExportButton onClick={handleExport} itemCount={filteredTransactions.length} />
          </>
        }
      />

      {/* Filter Bar */}
      {filterBar.isOpen && (
        <FilterBar
          filters={filterBar.filters}
          onFiltersChange={filterBar.setFilters}
          filterConfigs={FILTER_CONFIGS}
          placeholder="Filter transactions... (Tab to lock)"
          onClose={filterBar.close}
        />
      )}

      {/* Render Limit Warning - shown when dataset exceeds MAX_RENDER_LIMIT */}
      {!isLoading && (
        <div className="px-4 pt-4">
          <RenderLimitWarning totalCount={totalCount} entityName="transactions" />
        </div>
      )}

      {/* Advanced Filter Results Summary */}
      {!isLoading && advancedFilters.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{displayTransactions.length}</strong> of <strong>{filteredTransactions.length}</strong> filtered transactions
            {filteredTransactions.length < transactions.length && ` (${transactions.length} total)`}
            {filterBar.filters.length > 0 && ' (combined with filter chips)'}
            {filteredTransactions.length > displayTransactions.length && (
              <span className="text-amber-600 font-medium"> - Displaying first 1,000 results, refine filters to see more</span>
            )}
          </div>
        </div>
      )}

      {/* Quick Edit Overlay */}
      {quickEditMode && selectedTransaction && (
        <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Quick edit {quickEditMode} for <strong>{selectedTransaction.docNumber}</strong>:
          </span>
          {quickEditMode === 'date' ? (
            <Input
              type="date"
              value={quickEditValue}
              onChange={(e) => setQuickEditValue(e.target.value)}
              className="w-40 h-7 text-sm"
              autoFocus
            />
          ) : (
            <Input
              value={quickEditValue}
              onChange={(e) => setQuickEditValue(e.target.value)}
              placeholder="Enter memo..."
              className="flex-1 max-w-md h-7 text-sm"
              autoFocus
            />
          )}
          <span className="text-xs text-muted-foreground">
            <kbd className="kbd text-[10px]">Enter</kbd> save
            <kbd className="kbd text-[10px] ml-2">Esc</kbd> cancel
          </span>
        </div>
      )}

      <div ref={listContainerRef} className="flex-1 overflow-hidden relative" tabIndex={-1}>
        {/* Initial loading state - show skeleton */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : displayTransactions.length === 0 ? (
          /* Empty state - no data after loading */
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No transactions found</p>
          </div>
        ) : (
          /* Normal state - render list with data */
          <>
            <TransactionList 
              transactions={displayTransactions}
              onTransactionSelect={setSelectedTransaction}
              onTransactionOpen={handleTransactionSelect}
            />
            {/* Background fetching indicator - subtle, non-blocking */}
            {isFetching && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>

      <TransactionDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
});

// Wrap with error boundary
const TransactionsWithErrorBoundary = forwardRef<HTMLDivElement>((props, ref) => (
  <ErrorBoundary fallback={<TransactionsErrorFallback />}>
    <Transactions ref={ref} {...props} />
  </ErrorBoundary>
));

Transactions.displayName = 'Transactions';
TransactionsWithErrorBoundary.displayName = 'TransactionsWithErrorBoundary';

export default TransactionsWithErrorBoundary;
