import { useState, useMemo, useCallback, useEffect } from 'react';
import { CreditMemoList } from '@/components/credit-memos/CreditMemoList';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { FilterBar, FilterConfig, useFilterBar } from '@/components/shared/FilterBar';
import { ExportButton } from '@/components/shared/ExportButton';
import { RenderLimitWarning } from '@/components/shared/RenderLimitWarning';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { CREDIT_MEMO_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';
import { applyFilters } from '@/lib/filterUtils';
import { useCreditMemos } from '@/hooks/useCreditMemos';
import { exportToCSV } from '@/lib/csvExport';
import { creditMemoExportColumns } from '@/lib/exportConfigs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useKeyboard } from '@/contexts/KeyboardContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { CreditMemosErrorFallback } from '@/components/shared/FeatureErrorFallback';
import { usePagePerformance } from '@/hooks/usePerformance';

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'status',
    label: 'Status',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'pending', label: 'Pending' },
      { value: 'applied', label: 'Applied' },
      { value: 'voided', label: 'Voided' },
    ],
  },
  {
    type: 'syncStatus',
    label: 'Sync Status',
    options: [
      { value: 'synced', label: 'Synced' },
      { value: 'pending', label: 'Pending' },
      { value: 'error', label: 'Error' },
    ],
  },
];

function CreditMemosContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Filter[]>([]);
  const filterBar = useFilterBar();
  const { registerHandler, unregisterHandler } = useKeyboard();

  // Performance tracking
  usePagePerformance('CreditMemos');

  const { data: creditMemos = [], totalCount, isLoading, isFetching } = useCreditMemos('comp-1');

  const filteredCreditMemos = useMemo(() => {
    let result = creditMemos;
    
    // Apply filter chips (old filter system)
    filterBar.filters.forEach(chip => {
      if (chip.type === 'status') {
        result = result.filter(memo => memo.status === chip.value);
      } else if (chip.type === 'syncStatus') {
        result = result.filter(memo => memo.syncStatus === chip.value);
      }
    });
    
    // Apply search query when filter bar is closed
    if (!filterBar.isOpen && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(memo => 
        memo.customerName?.toLowerCase().includes(query) ||
        memo.invoiceId?.toLowerCase().includes(query) ||
        memo.memo?.toLowerCase().includes(query) ||
        memo.status?.toLowerCase().includes(query)
      );
    }
    
    // Apply advanced filters
    if (advancedFilters.length > 0) {
      result = applyFilters(result, advancedFilters);
    }
    
    return result;
  }, [creditMemos, searchQuery, filterBar.filters, filterBar.isOpen, advancedFilters]);

  // Apply render limit AFTER filtering to ensure we search all data
  // but only render a safe amount
  const displayCreditMemos = useMemo(() => {
    const MAX_RENDER_LIMIT = 1000;
    return filteredCreditMemos.slice(0, MAX_RENDER_LIMIT);
  }, [filteredCreditMemos]);

  // Export handler
  const handleExport = useCallback(() => {
    exportToCSV({
      data: filteredCreditMemos,
      columns: creditMemoExportColumns,
      entityName: 'credit-memos',
      filters: filterBar.filters,
    });
    toast.success(`Exported ${filteredCreditMemos.length} credit memos`);
  }, [filteredCreditMemos, filterBar.filters]);

  // Register keyboard handlers
  useEffect(() => {
    const handleToggleFilter = () => {
      filterBar.toggle();
    };

    const handleExportView = () => {
      handleExport();
    };

    registerHandler('toggle-filter', handleToggleFilter);
    registerHandler('export-current-view', handleExportView);
    
    return () => {
      unregisterHandler('toggle-filter');
      unregisterHandler('export-current-view');
    };
  }, [registerHandler, unregisterHandler, filterBar, handleExport]);

  return (
    <div className="h-full flex flex-col">
      <PageToolbar
        title="Credit Memos"
        searchPlaceholder="Search credit memos..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        hideSearch={filterBar.isOpen}
        actions={
          <div className="flex items-center gap-2">
            <AdvancedFilter
              filters={advancedFilters}
              config={CREDIT_MEMO_FILTER_CONFIG}
              onChange={setAdvancedFilters}
              triggerLabel="Add Filter"
              shortcutHint="⌘F"
            />
            <ExportButton onClick={handleExport} itemCount={filteredCreditMemos.length} />
          </div>
        }
      />

      {/* Filter Bar */}
      {filterBar.isOpen && (
        <FilterBar
          filters={filterBar.filters}
          onFiltersChange={filterBar.setFilters}
          filterConfigs={FILTER_CONFIGS}
          placeholder="Filter credit memos... (Tab to lock)"
          onClose={filterBar.close}
        />
      )}

      {/* Render Limit Warning - shown when dataset exceeds MAX_RENDER_LIMIT */}
      {!isLoading && (
        <div className="px-4 pt-4">
          <RenderLimitWarning totalCount={totalCount} entityName="credit memos" />
        </div>
      )}

      {/* Advanced Filter Results Summary */}
      {!isLoading && advancedFilters.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{displayCreditMemos.length}</strong> of <strong>{filteredCreditMemos.length}</strong> filtered credit memos
            {filteredCreditMemos.length < creditMemos.length && ` (${creditMemos.length} total)`}
            {filteredCreditMemos.length > displayCreditMemos.length && (
              <span className="text-amber-600 font-medium"> - Displaying first 1,000 results, refine filters to see more</span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
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
        ) : displayCreditMemos.length === 0 ? (
          /* Empty state - no data after loading */
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No credit memos found</p>
          </div>
        ) : (
          /* Normal state - render list with data */
          <>
            <CreditMemoList creditMemos={displayCreditMemos} />
            {/* Background fetching indicator - subtle, non-blocking */}
            {isFetching && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CreditMemos() {
  return (
    <ErrorBoundary fallback={<CreditMemosErrorFallback />}>
      <CreditMemosContent />
    </ErrorBoundary>
  );
}
