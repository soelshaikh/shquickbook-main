import { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CreditMemoRow } from './CreditMemoRow';
import { CreditMemoListHeader } from './CreditMemoListHeader';
import { ListFooter } from '@/components/shared/ListFooter';
import { useListNavigation } from '@/hooks/useListNavigation';
import { CreditMemo } from '@/services/dataService';
import { useActionPerformance } from '@/hooks/usePerformance';

interface CreditMemoListProps {
  creditMemos: CreditMemo[];
  onCreditMemoSelect?: (creditMemo: CreditMemo) => void;
  onCreditMemoOpen?: (creditMemo: CreditMemo) => void;
}

export function CreditMemoList({ creditMemos, onCreditMemoSelect, onCreditMemoOpen }: CreditMemoListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { measureAction } = useActionPerformance();
  
  const {
    focusedIndex,
    selectedIndices,
    isSelected,
    isFocused,
    handleKeyDown,
    selectIndex,
    clearSelection,
  } = useListNavigation({
    itemCount: creditMemos.length,
    onSelect: (index) => {
      onCreditMemoSelect?.(creditMemos[index]);
    },
    enabled: true,
  });

  const virtualizer = useVirtualizer({
    count: creditMemos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, virtualizer]);

  const handleRowClick = useCallback((index: number, event: React.MouseEvent) => {
    measureAction('CreditMemo Row Select', () => {
      if (event.metaKey || event.ctrlKey) {
        selectIndex(index, true);
      } else {
        clearSelection();
        selectIndex(index, false);
      }
    });
  }, [selectIndex, clearSelection, measureAction]);

  const handleRowDoubleClick = useCallback((index: number) => {
    measureAction('CreditMemo Row Open', () => {
      onCreditMemoOpen?.(creditMemos[index]);
    });
  }, [creditMemos, onCreditMemoOpen, measureAction]);

  // Keyboard event listener (global)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      handleKeyDown(e);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown]);

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col"
    >
      <CreditMemoListHeader 
        selectedCount={selectedIndices.size} 
        totalCount={creditMemos.length} 
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
            const creditMemo = creditMemos[virtualRow.index];
            return (
              <CreditMemoRow
                key={creditMemo.id}
                creditMemo={creditMemo}
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
      
      {creditMemos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No credit memos found
        </div>
      ) : (
        <ListFooter itemCount={creditMemos.length} itemLabel="credit memos" />
      )}
    </div>
  );
}
