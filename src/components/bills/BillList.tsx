import { useRef, useCallback, KeyboardEvent, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Bill } from '@/data/mockBills';
import { BillRow } from './BillRow';
import { BillListHeader } from './BillListHeader';
import { ListFooter } from '@/components/shared/ListFooter';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useActionPerformance } from '@/hooks/usePerformance';

interface BillListProps {
  bills: Bill[];
  onSelect?: (bill: Bill) => void;
  onEdit?: (bill: Bill) => void;
}

export function BillList({ bills, onSelect, onEdit }: BillListProps) {
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
    itemCount: bills.length,
    onSelect: (index) => {
      if (onSelect && bills[index]) {
        onSelect(bills[index]);
      }
    },
  });

  const virtualizer = useVirtualizer({
    count: bills.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  // Scroll focused row into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, virtualizer]);

  const handleRowClick = useCallback((index: number, event: React.MouseEvent) => {
    measureAction('Bill Row Select', () => {
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

  const handleRowDoubleClick = useCallback((bill: Bill) => {
    measureAction('Bill Open', () => {
      if (onEdit) {
        onEdit(bill);
      }
    });
  }, [onEdit, measureAction]);

  // Enhanced keyboard handler with Enter to open
  const handleKeyDownWrapper = useCallback((e: KeyboardEvent) => {
    // Don't handle if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Handle Enter to open
    if (e.key === 'Enter' && selectedIndices.size === 1) {
      const selectedIndex = Array.from(selectedIndices)[0];
      onEdit?.(bills[selectedIndex]);
      e.preventDefault();
      return;
    }

    // Handle 'E' for edit
    if ((e.key === 'e' || e.key === 'E') && selectedIndices.size === 1) {
      const selectedIndex = Array.from(selectedIndices)[0];
      onEdit?.(bills[selectedIndex]);
      e.preventDefault();
      return;
    }
    
    handleKeyDown(e);
  }, [handleKeyDown, selectedIndices, bills, onEdit]);

  // Keyboard event listener (global)
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDownWrapper);
    return () => window.removeEventListener('keydown', handleKeyDownWrapper);
  }, [handleKeyDownWrapper]);

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col"
    >
      <BillListHeader 
        selectedCount={selectedIndices.size} 
        totalCount={bills.length} 
      />
      
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            clearSelection();
          }
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const bill = bills[virtualRow.index];
            return (
              <BillRow
                key={bill.id}
                bill={bill}
                isSelected={isSelected(virtualRow.index)}
                isFocused={isFocused(virtualRow.index)}
                isMultiSelected={isSelected(virtualRow.index) && selectedIndices.size > 1}
                onClick={(e) => handleRowClick(virtualRow.index, e)}
                onDoubleClick={() => handleRowDoubleClick(bill)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
      
      {bills.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No bills found
        </div>
      ) : (
        <ListFooter itemCount={bills.length} itemLabel="bills" />
      )}
    </div>
  );
}
