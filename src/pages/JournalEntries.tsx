import { forwardRef, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { FilterBar, FilterConfig, useFilterBar } from '@/components/shared/FilterBar';
import { JournalEntryList, JournalEntryListRef } from '@/components/journal-entries/JournalEntryList';
import { JournalEntryForm } from '@/components/journal-entries/JournalEntryForm';
import { UndoToast } from '@/components/shared/UndoToast';
import { ExportButton } from '@/components/shared/ExportButton';
import { RenderLimitWarning } from '@/components/shared/RenderLimitWarning';
import { JournalEntry } from '@/data/mockJournalEntries';
import { useJournalEntries, useCreateJournalEntry, useUpdateJournalEntry } from '@/hooks/useJournalEntries';
import { useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { usePagePerformance } from '@/hooks/usePerformance';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/csvExport';
import { journalEntryExportColumns } from '@/lib/exportConfigs';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { JournalEntriesErrorFallback } from '@/components/shared/FeatureErrorFallback';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { AdvancedFilter } from '@/components/shared/AdvancedFilter';
import { JOURNAL_ENTRY_FILTER_CONFIG } from '@/config/filterConfig';
import { Filter } from '@/types/filter';
import { applyFilters } from '@/lib/filterUtils';

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'status',
    label: 'Status',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'posted', label: 'Posted' },
      { value: 'voided', label: 'Voided' },
    ],
  },
];

interface UndoState {
  message: string;
  entry: JournalEntry;
  action: 'create' | 'update';
}

const JournalEntries = forwardRef<HTMLDivElement>((_, ref) => {
  usePagePerformance('JournalEntries');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: entries = [], totalCount, isLoading, isFetching, error } = useJournalEntries('comp-1');
  const queryClient = useQueryClient();
  const createJournalEntryMutation = useCreateJournalEntry();
  const updateJournalEntryMutation = useUpdateJournalEntry();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // NEW: Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState<Filter[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<JournalEntryListRef>(null);
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

  const filteredEntries = useMemo(() => {
    let result = entries;
    
    // Apply filter chips (old filter system)
    filterBar.filters.forEach(chip => {
      if (chip.type === 'status') {
        result = result.filter(e => e.status === chip.value);
      }
    });
    
    // Apply search query when filter bar is closed
    if (!filterBar.isOpen && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.docNumber.toLowerCase().includes(query) ||
        e.memo.toLowerCase().includes(query)
      );
    }
    
    // NEW: Apply advanced filters
    if (advancedFilters.length > 0) {
      result = applyFilters(result, advancedFilters);
    }
    
    return result;
  }, [entries, searchQuery, filterBar.filters, filterBar.isOpen, advancedFilters]);

  // Export handler
  const handleExport = useCallback(() => {
    exportToCSV({
      data: filteredEntries,
      columns: journalEntryExportColumns,
      entityName: 'journal-entries',
      filters: filterBar.filters,
    });
    toast.success(`Exported ${filteredEntries.length} journal entries`);
  }, [filteredEntries, filterBar.filters]);

  // Register keyboard handlers
  useEffect(() => {
    const handleNewEntry = () => {
      setEditingEntry(null);
      setFormOpen(true);
    };

    const handleToggleFilter = () => {
      filterBar.toggle();
    };

    const handleEditSelected = () => {
      if (selectedEntry) {
        setEditingEntry(selectedEntry);
        setFormOpen(true);
      }
    };

    const handleDuplicateEntry = () => {
      if (selectedEntry) {
        const duplicateData: JournalEntry = {
          ...selectedEntry,
          id: '',
          docNumber: '',
          status: 'draft',
          syncStatus: 'local_only',
          txnDate: new Date().toISOString().split('T')[0],
          lines: selectedEntry.lines.map(line => ({ ...line, id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
        };
        setEditingEntry(duplicateData);
        setFormOpen(true);
      }
    };

    const handleExportView = () => {
      handleExport();
    };

    registerHandler('new-journal-entry', handleNewEntry);
    registerHandler('toggle-filter', handleToggleFilter);
    registerHandler('edit-selected', handleEditSelected);
    registerHandler('duplicate-journal-entry', handleDuplicateEntry);
    registerHandler('export-current-view', handleExportView);
    
    return () => {
      unregisterHandler('new-journal-entry');
      unregisterHandler('toggle-filter');
      unregisterHandler('edit-selected');
      unregisterHandler('duplicate-journal-entry');
      unregisterHandler('export-current-view');
    };
  }, [registerHandler, unregisterHandler, selectedEntry, filterBar, handleExport]);

  const handleNewEntry = useCallback(() => {
    setEditingEntry(null);
    setFormOpen(true);
  }, []);

  const handleEntryOpen = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  }, []);

  const handleEntrySelect = useCallback((entry: JournalEntry | null) => {
    setSelectedEntry(entry);
  }, []);

  const handleSave = useCallback(async (data: Partial<JournalEntry>) => {
    // Check if it's an update - has an ID and it's not empty
    // This works for both original mock IDs (je-1) and newly created ones (je-1736789012-xyz)
    const isUpdate = editingEntry && editingEntry.id && editingEntry.id.trim() !== '';
    
    if (isUpdate) {
      const previousEntry = { ...editingEntry };
      
      await updateJournalEntryMutation.mutateAsync({ 
        id: editingEntry.id, 
        data: { ...data, companyId: 'comp-1' }
      });
      
      setUndoState({ message: 'Journal entry updated', entry: previousEntry, action: 'update' });
    } else {
      const tempId = `temp-${Date.now()}`;
      const entryData = { ...data, companyId: 'comp-1' };
      
      dataService.optimisticCreateJournalEntry(tempId, entryData);
      
      // Invalidate React Query cache so it refetches from dataService/IndexedDB
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      
      const tempEntry: JournalEntry = {
        id: tempId,
        companyId: 'comp-1',
        docNumber: `JE-TEMP-${Date.now().toString().slice(-6)}`,
        txnDate: data.txnDate || new Date().toISOString().split('T')[0],
        lines: data.lines || [],
        totalDebit: data.totalDebit || 0,
        totalCredit: data.totalCredit || 0,
        memo: data.memo || '',
        status: data.status || 'draft',
        syncStatus: 'local_only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUndoState({ message: 'Journal entry created', entry: tempEntry, action: 'create' });
    }
  }, [editingEntry, updateJournalEntryMutation, queryClient]);

  const handleSaveAndClose = useCallback(async (data: Partial<JournalEntry>) => {
    await handleSave(data);
    setFormOpen(false);
    setEditingEntry(null);
  }, [handleSave]);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    
    if (undoState.action === 'create') {
      dataService.rollbackJournalEntry(undoState.entry.id);
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      toast.success('Journal entry creation undone');
    } else if (undoState.action === 'update') {
      // For updates, revert to previous state
      updateJournalEntryMutation.mutate({ 
        id: undoState.entry.id, 
        data: undoState.entry 
      });
      toast.success('Journal entry update undone');
    }
    
    setUndoState(null);
  }, [undoState, queryClient, updateJournalEntryMutation]);

  const handleDuplicateFromForm = useCallback(() => {
    if (editingEntry && editingEntry.id) {
      const duplicateData: JournalEntry = {
        ...editingEntry,
        id: '',
        docNumber: '',
        status: 'draft',
        syncStatus: 'local_only',
        txnDate: new Date().toISOString().split('T')[0],
        lines: editingEntry.lines.map(line => ({ 
          ...line, 
          id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}` 
        })),
      };
      setEditingEntry(duplicateData);
    }
  }, [editingEntry]);

  return (
    <ErrorBoundary fallback={<JournalEntriesErrorFallback />}>
      <div ref={ref} className="h-full flex flex-col">
        <PageToolbar
          title="Journal Entries"
          searchPlaceholder="Search journal entries..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          hideSearch={filterBar.isOpen}
          actions={
            <div className="flex items-center gap-2">
              <AdvancedFilter
                filters={advancedFilters}
                config={JOURNAL_ENTRY_FILTER_CONFIG}
                onChange={setAdvancedFilters}
                triggerLabel="Add Filter"
                shortcutHint="⌘F"
              />
              <ExportButton onClick={handleExport} itemCount={filteredEntries.length} />
              <Button size="sm" onClick={handleNewEntry} className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Entry
                <kbd className="kbd ml-1 text-[10px]">J</kbd>
              </Button>
            </div>
          }
        />

        {/* Filter Bar */}
        {filterBar.isOpen && (
          <FilterBar
            filters={filterBar.filters}
            onFiltersChange={filterBar.setFilters}
            filterConfigs={FILTER_CONFIGS}
            placeholder="Filter journal entries... (Tab to lock)"
            onClose={filterBar.close}
          />
        )}

        {/* Render Limit Warning - shown when dataset exceeds MAX_RENDER_LIMIT */}
        {!isLoading && (
          <div className="px-4 pt-4">
            <RenderLimitWarning totalCount={totalCount} entityName="journal entries" />
          </div>
        )}

        {/* Advanced Filter Results Summary */}
        {!isLoading && advancedFilters.length > 0 && (
          <div className="px-4 pb-2">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredEntries.length}</strong> of <strong>{entries.length}</strong> journal entries
              {filterBar.filters.length > 0 && ' (combined with filter chips)'}
            </div>
          </div>
        )}

        <div ref={listContainerRef} className="flex-1 overflow-hidden" tabIndex={-1}>
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
          ) : filteredEntries.length === 0 ? (
            /* Empty state - no data after loading */
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No journal entries found</p>
            </div>
          ) : (
            /* Normal state - render list with data */
            <>
              <JournalEntryList
                ref={listRef}
                entries={filteredEntries}
                onEntryOpen={handleEntryOpen}
                onEntrySelect={handleEntrySelect}
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

        <JournalEntryForm
          open={formOpen}
          onOpenChange={setFormOpen}
          entry={editingEntry}
          onSave={handleSave}
          onSaveAndClose={handleSaveAndClose}
          onDuplicate={handleDuplicateFromForm}
        />

        {undoState && (
          <UndoToast
            message={undoState.message}
            onUndo={handleUndo}
            onDismiss={() => setUndoState(null)}
            duration={3000}
          />
        )}
      </div>
    </ErrorBoundary>
  );
});

JournalEntries.displayName = 'JournalEntries';

export default JournalEntries;
