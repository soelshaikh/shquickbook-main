import { forwardRef, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { FilterBar, FilterConfig, useFilterBar } from '@/components/shared/FilterBar';
import { BillList } from '@/components/bills/BillList';
import { BillForm } from '@/components/bills/BillForm';
import { UndoToast } from '@/components/shared/UndoToast';
import { ExportButton } from '@/components/shared/ExportButton';
import { mockBills, Bill } from '@/data/mockBills';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { usePagePerformance } from '@/hooks/usePerformance';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/csvExport';
import { billExportColumns } from '@/lib/exportConfigs';

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'status',
    label: 'Status',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'partial', label: 'Partial' },
    ],
  },
  {
    type: 'payment',
    label: 'Payment',
    options: [
      { value: 'unpaid', label: 'Unpaid' },
      { value: 'partial', label: 'Partial' },
      { value: 'paid', label: 'Paid' },
    ],
  },
];

const Bills = forwardRef<HTMLDivElement>((_, ref) => {
  usePagePerformance('Bills');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [undoState, setUndoState] = useState<{
    message: string;
    previousBills: Bill[];
  } | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

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

  const filteredBills = useMemo(() => {
    let result = bills;
    
    // Apply filter chips
    filterBar.filters.forEach(chip => {
      if (chip.type === 'status') {
        result = result.filter(bill => bill.status === chip.value);
      } else if (chip.type === 'payment') {
        result = result.filter(bill => bill.paymentStatus === chip.value);
      }
    });

    // Apply search query when filter bar is closed
    if (!filterBar.isOpen && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(bill =>
        bill.docNumber.toLowerCase().includes(searchLower) ||
        bill.vendor.name.toLowerCase().includes(searchLower) ||
        bill.memo?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [bills, searchQuery, filterBar.filters, filterBar.isOpen]);

  // Export handler
  const handleExport = useCallback(() => {
    exportToCSV({
      data: filteredBills,
      columns: billExportColumns,
      entityName: 'bills',
      filters: filterBar.filters,
    });
    toast.success(`Exported ${filteredBills.length} bills`);
  }, [filteredBills, filterBar.filters]);

  // Register keyboard handlers
  useEffect(() => {
    const handleNewBill = () => {
      setEditingBill(null);
      setIsFormOpen(true);
    };

    const handleToggleFilter = () => {
      filterBar.toggle();
    };

    const handleEditSelected = () => {
      if (selectedBill) {
        setEditingBill(selectedBill);
        setIsFormOpen(true);
      }
    };

    const handleDuplicateBill = () => {
      if (selectedBill) {
        const today = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);
        const duplicateData: Bill = {
          ...selectedBill,
          id: '',
          docNumber: '',
          status: 'draft',
          paymentStatus: 'unpaid',
          syncStatus: 'pending',
          txnDate: today,
          dueDate: due.toISOString().split('T')[0],
        };
        setEditingBill(duplicateData);
        setIsFormOpen(true);
      }
    };

    const handleExportView = () => {
      handleExport();
    };

    registerHandler('new-bill', handleNewBill);
    registerHandler('toggle-filter', handleToggleFilter);
    registerHandler('edit-selected', handleEditSelected);
    registerHandler('duplicate-bill', handleDuplicateBill);
    registerHandler('export-current-view', handleExportView);
    
    return () => {
      unregisterHandler('new-bill');
      unregisterHandler('toggle-filter');
      unregisterHandler('edit-selected');
      unregisterHandler('duplicate-bill');
      unregisterHandler('export-current-view');
    };
  }, [registerHandler, unregisterHandler, selectedBill, filterBar, handleExport]);

  const handleNewBill = useCallback(() => {
    setEditingBill(null);
    setIsFormOpen(true);
  }, []);

  const handleEditBill = useCallback((bill: Bill) => {
    setEditingBill(bill);
    setIsFormOpen(true);
  }, []);

  const handleBillSelect = useCallback((bill: Bill | null) => {
    setSelectedBill(bill);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingBill(null);
  }, []);

  const handleSave = useCallback((billData: Partial<Bill>) => {
    const previousBills = [...bills];
    
    setBills(prev => {
      const existingIndex = prev.findIndex(b => b.id === billData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...prev[existingIndex], ...billData } as Bill;
        return updated;
      } else {
        return [billData as Bill, ...prev];
      }
    });

    setUndoState({
      message: editingBill ? 'Bill updated' : 'Bill created',
      previousBills,
    });
  }, [bills, editingBill]);

  const handleSaveAndClose = useCallback((billData: Partial<Bill>) => {
    handleSave(billData);
    handleCloseForm();
  }, [handleSave, handleCloseForm]);

  const handleUndo = useCallback(() => {
    if (undoState) {
      setBills(undoState.previousBills);
      setUndoState(null);
    }
  }, [undoState]);

  const handleDismissUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  const handleDuplicateFromForm = useCallback(() => {
    if (editingBill && editingBill.id) {
      const today = new Date().toISOString().split('T')[0];
      const due = new Date();
      due.setDate(due.getDate() + 30);
      const duplicateData: Bill = {
        ...editingBill,
        id: '',
        docNumber: '',
        status: 'draft',
        paymentStatus: 'unpaid',
        syncStatus: 'pending',
        txnDate: today,
        dueDate: due.toISOString().split('T')[0],
      };
      setEditingBill(duplicateData);
    }
  }, [editingBill]);

  return (
    <div ref={ref} className="h-full flex flex-col">
      <PageToolbar
        title="Bills"
        searchPlaceholder="Search bills..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        hideSearch={filterBar.isOpen}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} itemCount={filteredBills.length} />
            <Button size="sm" onClick={handleNewBill} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Bill
              <kbd className="kbd ml-1 text-[10px]">B</kbd>
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
          placeholder="Filter bills... (Tab to lock)"
          onClose={filterBar.close}
        />
      )}

      <div ref={listContainerRef} className="flex-1 overflow-hidden" tabIndex={-1}>
        <BillList
          bills={filteredBills}
          onEdit={handleEditBill}
          onSelect={handleBillSelect}
        />
      </div>

      <BillForm
        bill={editingBill}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        onSaveAndClose={handleSaveAndClose}
        onDuplicate={handleDuplicateFromForm}
      />

      {undoState && (
        <UndoToast
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={handleDismissUndo}
        />
      )}
    </div>
  );
});

Bills.displayName = 'Bills';

export default Bills;
