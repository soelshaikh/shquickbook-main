import { useRef, useCallback, useEffect, KeyboardEvent, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Invoice, customers } from '@/data/mockInvoices';
import { InvoiceRow } from './InvoiceRow';
import { InvoiceListHeader } from './InvoiceListHeader';
import { ListFooter } from '@/components/shared/ListFooter';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useActionPerformance } from '@/hooks/usePerformance';
import { InlineEditPopover } from '@/components/shared/InlineEditPopover';
import { ColumnConfig } from '@/types/columnConfig';

interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceSelect?: (invoice: Invoice) => void;
  onInvoiceOpen?: (invoice: Invoice) => void;
  onInlineEdit?: (invoiceId: string, data: Partial<Invoice>) => Promise<void>;
  columns?: ColumnConfig[];
  onToggleColumn?: (columnKey: string) => void;
  onResetColumns?: () => void;
}

export function InvoiceList({ invoices, onInvoiceSelect, onInvoiceOpen, onInlineEdit, columns, onToggleColumn, onResetColumns }: InvoiceListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { measureAction } = useActionPerformance();
  
  // Inline edit state
  const [inlineEditState, setInlineEditState] = useState<{
    invoice: Invoice;
    field: 'memo' | 'txnDate' | 'dueDate' | 'customer';
  } | null>(null);
  
  const {
    focusedIndex,
    selectedIndices,
    anchorIndex,
    isSelected,
    isFocused,
    handleKeyDown,
    selectIndex,
    selectRange,
    clearSelection,
    setFocusedIndex,
  } = useListNavigation({
    itemCount: invoices.length,
    onSelect: (index) => {
      onInvoiceSelect?.(invoices[index]);
    },
    enabled: true,
  });

  const virtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // h-8 = 32px
    overscan: 10,
  });

  // Scroll focused row into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, virtualizer]);

  const handleRowClick = useCallback((index: number, event: React.MouseEvent) => {
    measureAction('Invoice Row Select', () => {
      if (event.shiftKey && selectedIndices.size > 0) {
        const anchor = anchorIndex ?? Array.from(selectedIndices)[0];
        selectRange(anchor, index);
        // Also update focus to the clicked row
        setFocusedIndex(index);
      } else if (event.metaKey || event.ctrlKey) {
        selectIndex(index, true);
        // Also update focus to the clicked row
        setFocusedIndex(index);
      } else {
        // Single click: clear selection, select this row, AND focus it (Option A)
        clearSelection();
        selectIndex(index, false);
        setFocusedIndex(index);
      }
    });
  }, [selectedIndices, anchorIndex, selectIndex, selectRange, clearSelection, setFocusedIndex, measureAction]);

  const handleRowDoubleClick = useCallback((index: number) => {
    measureAction('Invoice Open', () => {
      onInvoiceOpen?.(invoices[index]);
    });
  }, [invoices, onInvoiceOpen, measureAction]);

  // Handle inline edit for a specific field
  const handleInlineEdit = useCallback((field: 'memo' | 'txnDate' | 'dueDate' | 'customer') => {
    // Allow inline edit on focused row (when navigating with arrow keys)
    // OR on selected row (when clicking)
    let targetIndex: number | null = null;
    
    if (focusedIndex !== null) {
      // Prefer focused row (arrow key navigation)
      targetIndex = focusedIndex;
    } else if (selectedIndices.size === 1) {
      // Fallback to selected row (click selection)
      targetIndex = Array.from(selectedIndices)[0];
    }
    
    if (targetIndex !== null && invoices[targetIndex]) {
      const invoice = invoices[targetIndex];
      
      setInlineEditState({
        invoice,
        field,
      });
    }
  }, [focusedIndex, selectedIndices, invoices]);

  // Handle save from inline edit
  const handleInlineSave = useCallback(async (field: 'memo' | 'txnDate' | 'dueDate' | 'customer', value: string | number) => {
    if (!inlineEditState || !onInlineEdit) return;

    const updateData: Partial<Invoice> = {};

    // If customer field is being edited, we need to update both customerId and customer name
    if (field === 'customer') {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        updateData.customerId = selectedCustomer.id;
        updateData.customer = selectedCustomer.name;
      }
    } else {
      // For other fields, just update the field directly
      updateData[field] = value;
    }

    await onInlineEdit(inlineEditState.invoice.id, updateData);
    setInlineEditState(null);
  }, [inlineEditState, onInlineEdit]);

  // Enhanced keyboard handler with Enter to open and inline edit shortcuts
  const handleKeyDownWrapper = useCallback((e: KeyboardEvent) => {
    // Don't handle if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Don't handle if inline edit popover is open (let it handle its own shortcuts)
    if (inlineEditState) {
      return;
    }

    // Handle Enter to open
    if (e.key === 'Enter' && selectedIndices.size === 1) {
      const selectedIndex = Array.from(selectedIndices)[0];
      onInvoiceOpen?.(invoices[selectedIndex]);
      e.preventDefault();
      return;
    }

    // Handle 'E' for edit (full form)
    if ((e.key === 'e' || e.key === 'E') && selectedIndices.size === 1) {
      const selectedIndex = Array.from(selectedIndices)[0];
      onInvoiceOpen?.(invoices[selectedIndex]);
      e.preventDefault();
      return;
    }

    // Inline edit shortcuts (work when a row is focused OR selected)
    // Use Shift+Key to avoid conflicts with global navigation shortcuts
    if ((focusedIndex !== null || selectedIndices.size === 1) && onInlineEdit && e.shiftKey) {
      const key = e.key.toLowerCase();
      
      // Shift+C = Customer
      if (key === 'c') {
        e.preventDefault();
        handleInlineEdit('customer');
        return;
      }
      
      // Shift+D = Date (Invoice Date)
      if (key === 'd') {
        e.preventDefault();
        handleInlineEdit('txnDate');
        return;
      }
      
      // Shift+U = Due Date
      if (key === 'u') {
        e.preventDefault();
        handleInlineEdit('dueDate');
        return;
      }
      
      // Shift+M = Memo
      if (key === 'm') {
        e.preventDefault();
        handleInlineEdit('memo');
        return;
      }
    }
    
    handleKeyDown(e);
  }, [handleKeyDown, selectedIndices, invoices, onInvoiceOpen, onInlineEdit, handleInlineEdit]);

  // Keyboard event listener (global)
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDownWrapper);
    return () => window.removeEventListener('keydown', handleKeyDownWrapper);
  }, [handleKeyDownWrapper]);

  // Get field label and options based on field type
  const getFieldConfig = (field: 'memo' | 'txnDate' | 'dueDate' | 'customer') => {
    switch (field) {
      case 'customer':
        return {
          label: 'Customer',
          type: 'select' as const,
          options: customers.map(c => ({ value: c.id, label: c.name })),
        };
      case 'txnDate':
        return {
          label: 'Invoice Date',
          type: 'date' as const,
        };
      case 'dueDate':
        return {
          label: 'Due Date',
          type: 'date' as const,
        };
      case 'memo':
        return {
          label: 'Memo',
          type: 'textarea' as const,
          placeholder: 'Add notes...',
        };
    }
  };

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col"
    >
      <InvoiceListHeader 
        selectedCount={selectedIndices.size} 
        totalCount={invoices.length}
        columns={columns}
        onToggleColumn={onToggleColumn}
        onResetColumns={onResetColumns}
      />
      
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const invoice = invoices[virtualRow.index];
            return (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isSelected={isSelected(virtualRow.index)}
                isFocused={isFocused(virtualRow.index)}
                isMultiSelected={isSelected(virtualRow.index) && selectedIndices.size > 1}
                visibleColumns={columns?.filter(c => c.visible)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={(e) => handleRowClick(virtualRow.index, e)}
                onDoubleClick={() => handleRowDoubleClick(virtualRow.index)}
              />
            );
          })}
        </div>
      </div>
      
      {invoices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No invoices found
        </div>
      ) : (
        <ListFooter itemCount={invoices.length} itemLabel="invoices" />
      )}

      {/* Inline Edit Popover */}
      {inlineEditState && (() => {
        const fieldConfig = getFieldConfig(inlineEditState.field);
        const anchorElement = document.querySelector(`[data-invoice-id="${inlineEditState.invoice.id}"]`);
        
        // Get the current value - for customer field, use customerId instead of customer name
        let currentValue: string | number;
        if (inlineEditState.field === 'customer') {
          currentValue = inlineEditState.invoice.customerId || '';
        } else {
          currentValue = inlineEditState.invoice[inlineEditState.field] as string;
        }
        
        return (
          <InlineEditPopover
            open={true}
            onOpenChange={(open) => {
              if (!open) setInlineEditState(null);
            }}
            fieldLabel={fieldConfig.label}
            fieldType={fieldConfig.type}
            currentValue={currentValue}
            onSave={(value) => handleInlineSave(inlineEditState.field, value)}
            onCancel={() => setInlineEditState(null)}
            placeholder={fieldConfig.placeholder}
            selectOptions={fieldConfig.type === 'select' ? fieldConfig.options : undefined}
          >
            {anchorElement && <div style={{ position: 'absolute', top: 0, left: 0 }} />}
          </InlineEditPopover>
        );
      })()}
    </div>
  );
}
