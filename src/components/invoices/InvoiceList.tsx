import { useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Invoice } from '@/data/mockInvoices';
import { InvoiceRow } from './InvoiceRow';
import { InvoiceListHeader } from './InvoiceListHeader';
import { ListFooter } from '@/components/shared/ListFooter';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useActionPerformance } from '@/hooks/usePerformance';

interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceSelect?: (invoice: Invoice) => void;
  onInvoiceOpen?: (invoice: Invoice) => void;
}

export function InvoiceList({ invoices, onInvoiceSelect, onInvoiceOpen }: InvoiceListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { measureAction } = useActionPerformance();
  
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
      } else if (event.metaKey || event.ctrlKey) {
        selectIndex(index, true);
      } else {
        clearSelection();
        selectIndex(index, false);
      }
    });
  }, [selectedIndices, anchorIndex, selectIndex, selectRange, clearSelection, measureAction]);

  const handleRowDoubleClick = useCallback((index: number) => {
    measureAction('Invoice Open', () => {
      onInvoiceOpen?.(invoices[index]);
    });
  }, [invoices, onInvoiceOpen, measureAction]);

  const handleContainerKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter to open
    if (e.key === 'Enter' && selectedIndices.size === 1) {
      const selectedIndex = Array.from(selectedIndices)[0];
      onInvoiceOpen?.(invoices[selectedIndex]);
      e.preventDefault();
      return;
    }

    // Handle 'E' for edit
    if ((e.key === 'e' || e.key === 'E') && selectedIndices.size === 1) {
      const selectedIndex = Array.from(selectedIndices)[0];
      onInvoiceOpen?.(invoices[selectedIndex]);
      e.preventDefault();
      return;
    }
    
    handleKeyDown(e as unknown as globalThis.KeyboardEvent);
  }, [handleKeyDown, selectedIndices, invoices, onInvoiceOpen]);

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col focus:outline-none"
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
    >
      <InvoiceListHeader 
        selectedCount={selectedIndices.size} 
        totalCount={invoices.length} 
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
    </div>
  );
}
