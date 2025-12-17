import { useState, useMemo, useCallback, useEffect } from 'react';
import { CustomerPaymentList } from '@/components/customer-payments/CustomerPaymentList';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { FilterBar, FilterConfig, useFilterBar } from '@/components/shared/FilterBar';
import { ExportButton } from '@/components/shared/ExportButton';
import { RenderLimitWarning } from '@/components/shared/RenderLimitWarning';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { CUSTOMER_PAYMENT_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';
import { applyFilters } from '@/lib/filterUtils';
import { useCustomerPayments } from '@/hooks/useCustomerPayments';
import { exportToCSV } from '@/lib/csvExport';
import { customerPaymentExportColumns } from '@/lib/exportConfigs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useKeyboard } from '@/contexts/KeyboardContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { CustomerPaymentsErrorFallback } from '@/components/shared/FeatureErrorFallback';
import { usePagePerformance } from '@/hooks/usePerformance';

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'paymentMethod',
    label: 'Payment Method',
    options: [
      { value: 'Cash', label: 'Cash' },
      { value: 'Check', label: 'Check' },
      { value: 'Credit Card', label: 'Credit Card' },
      { value: 'Bank Transfer', label: 'Bank Transfer' },
      { value: 'ACH', label: 'ACH' },
      { value: 'Other', label: 'Other' },
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

function CustomerPaymentsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<Filter[]>([]);
  const filterBar = useFilterBar();
  const { registerHandler, unregisterHandler } = useKeyboard();

  // Performance tracking
  usePagePerformance('CustomerPayments');

  const { data: payments = [], totalCount, isLoading, isFetching } = useCustomerPayments('comp-1');

  const filteredPayments = useMemo(() => {
    let result = payments;
    
    // Apply filter chips (old filter system)
    filterBar.filters.forEach(chip => {
      if (chip.type === 'paymentMethod') {
        result = result.filter(payment => payment.paymentMethod === chip.value);
      } else if (chip.type === 'syncStatus') {
        result = result.filter(payment => payment.syncStatus === chip.value);
      }
    });
    
    // Apply search query when filter bar is closed
    if (!filterBar.isOpen && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(payment => 
        payment.customerName?.toLowerCase().includes(query) ||
        payment.referenceNumber?.toLowerCase().includes(query) ||
        payment.memo?.toLowerCase().includes(query) ||
        payment.paymentMethod?.toLowerCase().includes(query)
      );
    }
    
    // Apply advanced filters
    if (advancedFilters.length > 0) {
      result = applyFilters(result, advancedFilters);
    }
    
    return result;
  }, [payments, searchQuery, filterBar.filters, filterBar.isOpen, advancedFilters]);

  // Apply render limit AFTER filtering to ensure we search all data
  // but only render a safe amount
  const displayPayments = useMemo(() => {
    const MAX_RENDER_LIMIT = 1000;
    return filteredPayments.slice(0, MAX_RENDER_LIMIT);
  }, [filteredPayments]);

  // Export handler
  const handleExport = useCallback(() => {
    exportToCSV({
      data: filteredPayments,
      columns: customerPaymentExportColumns,
      entityName: 'customer-payments',
      filters: filterBar.filters,
    });
    toast.success(`Exported ${filteredPayments.length} customer payments`);
  }, [filteredPayments, filterBar.filters]);

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
        title="Customer Payments"
        searchPlaceholder="Search payments..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        hideSearch={filterBar.isOpen}
        actions={
          <div className="flex items-center gap-2">
            <AdvancedFilter
              filters={advancedFilters}
              config={CUSTOMER_PAYMENT_FILTER_CONFIG}
              onChange={setAdvancedFilters}
              triggerLabel="Add Filter"
              shortcutHint="⌘F"
            />
            <ExportButton onClick={handleExport} itemCount={filteredPayments.length} />
          </div>
        }
      />

      {/* Filter Bar */}
      {filterBar.isOpen && (
        <FilterBar
          filters={filterBar.filters}
          onFiltersChange={filterBar.setFilters}
          filterConfigs={FILTER_CONFIGS}
          placeholder="Filter customer payments... (Tab to lock)"
          onClose={filterBar.close}
        />
      )}

      {/* Render Limit Warning - shown when dataset exceeds MAX_RENDER_LIMIT */}
      {!isLoading && (
        <div className="px-4 pt-4">
          <RenderLimitWarning totalCount={totalCount} entityName="customer payments" />
        </div>
      )}

      {/* Advanced Filter Results Summary */}
      {!isLoading && advancedFilters.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{displayPayments.length}</strong> of <strong>{filteredPayments.length}</strong> filtered payments
            {filteredPayments.length < payments.length && ` (${payments.length} total)`}
            {filteredPayments.length > displayPayments.length && (
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
        ) : displayPayments.length === 0 ? (
          /* Empty state - no data after loading */
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No customer payments found</p>
          </div>
        ) : (
          /* Normal state - render list with data */
          <>
            <CustomerPaymentList payments={displayPayments} />
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

export default function CustomerPayments() {
  return (
    <ErrorBoundary fallback={<CustomerPaymentsErrorFallback />}>
      <CustomerPaymentsContent />
    </ErrorBoundary>
  );
}
