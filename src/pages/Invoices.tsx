import { forwardRef, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { FilterBar, FilterConfig, useFilterBar } from '@/components/shared/FilterBar';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { UndoToast } from '@/components/shared/UndoToast';
import { ExportButton } from '@/components/shared/ExportButton';
import { Invoice, InvoiceStatus } from '@/data/mockInvoices';
import { useInvoices, useCreateInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { dataService } from '@/services/dataService';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { usePagePerformance } from '@/hooks/usePerformance';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/csvExport';
import { invoiceExportColumns } from '@/lib/exportConfigs';

const FILTER_CONFIGS: FilterConfig[] = [
  {
    type: 'status',
    label: 'Status',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'viewed', label: 'Viewed' },
      { value: 'partial', label: 'Partial' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'voided', label: 'Voided' },
    ],
  },
  {
    type: 'email',
    label: 'Email Status',
    options: [
      { value: 'not_sent', label: 'Not Sent' },
      { value: 'sent', label: 'Sent' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'opened', label: 'Opened' },
      { value: 'bounced', label: 'Bounced' },
    ],
  },
];

interface UndoState {
  message: string;
  invoice: Invoice;
  action: 'create' | 'update' | 'delete';
}

const Invoices = forwardRef<HTMLDivElement>((_, ref) => {
  usePagePerformance('Invoices');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: invoices = [], isLoading, error } = useInvoices('comp-1');
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    
    // Apply filter chips
    filterBar.filters.forEach(chip => {
      if (chip.type === 'status') {
        result = result.filter(inv => inv.status === chip.value);
      } else if (chip.type === 'email') {
        result = result.filter(inv => inv.emailStatus === chip.value);
      }
    });
    
    // Apply search query when filter bar is closed
    if (!filterBar.isOpen && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        inv.customer.toLowerCase().includes(query) ||
        inv.docNumber.toLowerCase().includes(query) ||
        inv.memo.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [invoices, searchQuery, filterBar.filters, filterBar.isOpen]);

  // Export handler
  const handleExport = useCallback(() => {
    exportToCSV({
      data: filteredInvoices,
      columns: invoiceExportColumns,
      entityName: 'invoices',
      filters: filterBar.filters,
    });
    toast.success(`Exported ${filteredInvoices.length} invoices`);
  }, [filteredInvoices, filterBar.filters]);

  // Register keyboard handlers
  useEffect(() => {
    const handleNewInvoice = () => {
      setEditingInvoice(null);
      setFormOpen(true);
    };

    const handleToggleFilter = () => {
      filterBar.toggle();
    };

    const handleEditSelected = () => {
      if (selectedInvoice) {
        setEditingInvoice(selectedInvoice);
        setFormOpen(true);
      }
    };

    const handleDuplicateInvoice = () => {
      if (selectedInvoice) {
        const duplicateData: Invoice = {
          ...selectedInvoice,
          id: '',
          docNumber: '',
          status: 'draft',
          emailStatus: 'not_sent',
          syncStatus: 'local_only',
          txnDate: new Date().toISOString().split('T')[0],
        };
        setEditingInvoice(duplicateData);
        setFormOpen(true);
      }
    };

    const handleExportView = () => {
      handleExport();
    };

    registerHandler('new-invoice', handleNewInvoice);
    registerHandler('toggle-filter', handleToggleFilter);
    registerHandler('edit-selected', handleEditSelected);
    registerHandler('duplicate-invoice', handleDuplicateInvoice);
    registerHandler('export-current-view', handleExportView);
    
    return () => {
      unregisterHandler('new-invoice');
      unregisterHandler('toggle-filter');
      unregisterHandler('edit-selected');
      unregisterHandler('duplicate-invoice');
      unregisterHandler('export-current-view');
    };
  }, [registerHandler, unregisterHandler, selectedInvoice, filterBar, handleExport]);

  const handleNewInvoice = useCallback(() => {
    setEditingInvoice(null);
    setFormOpen(true);
  }, []);

  const handleInvoiceOpen = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormOpen(true);
  }, []);

  const handleInvoiceSelect = useCallback((invoice: Invoice | null) => {
    setSelectedInvoice(invoice);
  }, []);

  const handleSave = useCallback(async (data: Partial<Invoice>) => {
    if (editingInvoice && editingInvoice.id) {
      const previousInvoice = editingInvoice;
      setUndoState({ message: 'Invoice updated', invoice: previousInvoice, action: 'update' });
      
      await updateInvoiceMutation.mutateAsync({ 
        id: editingInvoice.id, 
        data: { ...data, companyId: 'comp-1' }
      });
    } else {
      const tempId = `temp-${Date.now()}`;
      const invoiceData = { 
        ...data, 
        companyId: 'comp-1',
        emailStatus: data.emailStatus || 'not_sent',
        syncStatus: 'local_only'
      };
      
      dataService.optimisticCreateInvoice(tempId, invoiceData);
      
      const tempInvoice: Invoice = {
        id: tempId,
        docNumber: `INV-TEMP`,
        txnDate: data.txnDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || '',
        customer: data.customer || '',
        customerId: data.customerId || '',
        companyId: 'comp-1',
        lineItems: data.lineItems || [],
        subtotal: data.subtotal || 0,
        taxRate: data.taxRate || 0,
        taxAmount: data.taxAmount || 0,
        total: data.total || 0,
        balance: data.balance || data.total || 0,
        status: data.status || 'draft',
        emailStatus: 'not_sent',
        syncStatus: 'local_only',
        memo: data.memo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUndoState({ message: 'Invoice created', invoice: tempInvoice, action: 'create' });
    }
  }, [editingInvoice, createInvoiceMutation, updateInvoiceMutation]);

  const handleSaveAndClose = useCallback(async (data: Partial<Invoice>) => {
    await handleSave(data);
    setFormOpen(false);
    setEditingInvoice(null);
  }, [handleSave]);

  const handleSend = useCallback(async (data: Partial<Invoice>) => {
    const invoiceData = { 
      ...data, 
      status: 'sent' as InvoiceStatus, 
      emailStatus: 'sent' as const, 
      companyId: 'comp-1',
      syncStatus: 'local_only'
    };
    
    if (editingInvoice && editingInvoice.id) {
      const previousInvoice = editingInvoice;
      setUndoState({ message: 'Invoice sent', invoice: previousInvoice, action: 'update' });
      
      await updateInvoiceMutation.mutateAsync({ 
        id: editingInvoice.id, 
        data: invoiceData
      });
    } else {
      const tempId = `temp-${Date.now()}`;
      
      dataService.optimisticCreateInvoice(tempId, invoiceData);
      
      const tempInvoice: Invoice = {
        id: tempId,
        docNumber: `INV-TEMP`,
        txnDate: invoiceData.txnDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate || '',
        customer: invoiceData.customer || '',
        customerId: invoiceData.customerId || '',
        companyId: 'comp-1',
        lineItems: invoiceData.lineItems || [],
        subtotal: invoiceData.subtotal || 0,
        taxRate: invoiceData.taxRate || 0,
        taxAmount: invoiceData.taxAmount || 0,
        total: invoiceData.total || 0,
        balance: invoiceData.balance || invoiceData.total || 0,
        status: 'sent',
        emailStatus: 'sent',
        syncStatus: 'local_only',
        memo: invoiceData.memo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUndoState({ message: 'Invoice created and sent', invoice: tempInvoice, action: 'create' });
    }
    
    setFormOpen(false);
    setEditingInvoice(null);
  }, [editingInvoice, updateInvoiceMutation]);

  const handleUndo = useCallback(() => {
    if (!undoState) return;
    
    if (undoState.action === 'create') {
      dataService.rollbackInvoice(undoState.invoice.id);
    }
    
    setUndoState(null);
  }, [undoState]);

  const handleDuplicateFromForm = useCallback(() => {
    if (editingInvoice && editingInvoice.id) {
      const duplicateData: Invoice = {
        ...editingInvoice,
        id: '',
        docNumber: '',
        status: 'draft',
        emailStatus: 'not_sent',
        syncStatus: 'local_only',
        txnDate: new Date().toISOString().split('T')[0],
      };
      setEditingInvoice(duplicateData);
    }
  }, [editingInvoice]);

  return (
    <div ref={ref} className="h-full flex flex-col">
      <PageToolbar
        title="Invoices"
        searchPlaceholder="Search invoices..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        hideSearch={filterBar.isOpen}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton onClick={handleExport} itemCount={filteredInvoices.length} />
            <Button size="sm" onClick={handleNewInvoice} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Invoice
              <kbd className="kbd ml-1 text-[10px]">I</kbd>
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
          placeholder="Filter invoices... (Tab to lock)"
          onClose={filterBar.close}
        />
      )}

      <div ref={listContainerRef} className="flex-1 overflow-hidden" tabIndex={-1}>
        <InvoiceList 
          invoices={filteredInvoices}
          onInvoiceOpen={handleInvoiceOpen}
          onInvoiceSelect={handleInvoiceSelect}
        />
      </div>

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        onSave={handleSave}
        onSaveAndClose={handleSaveAndClose}
        onSend={handleSend}
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
  );
});

Invoices.displayName = 'Invoices';

export default Invoices;
