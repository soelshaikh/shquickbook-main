import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Transaction } from '@/data/mockTransactions';
import { TransactionRow } from './TransactionRow';
import { TransactionListHeader } from './TransactionListHeader';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useActionPerformance } from '@/hooks/usePerformance';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionSelect?: (transaction: Transaction) => void;
  onTransactionOpen?: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onTransactionSelect, onTransactionOpen }: TransactionListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeight = 32; // h-8 = 2rem = 32px
  const { measureAction } = useActionPerformance();

  const {
    focusedIndex,
    setFocusedIndex,
    selectedIndices,
    anchorIndex,
    selectIndex,
    selectRange,
    handleKeyDown: baseHandleKeyDown,
    isSelected,
    isFocused,
  } = useListNavigation({
    itemCount: transactions.length,
    onSelect: (index) => onTransactionSelect?.(transactions[index]),
  });

  // Enhanced keyboard handler with Enter to open detail
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      onTransactionOpen?.(transactions[focusedIndex]);
      return;
    }
    baseHandleKeyDown(e);
  }, [focusedIndex, transactions, onTransactionOpen, baseHandleKeyDown]);

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  // Scroll focused row into view
  useEffect(() => {
    virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
  }, [focusedIndex, virtualizer]);

  // Keyboard event listener
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

  const handleRowClick = useCallback((index: number, e: React.MouseEvent) => {
    measureAction('Transaction Row Select', () => {
      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (isShift && selectedIndices.size > 0) {
        const anchor = anchorIndex ?? Array.from(selectedIndices)[0];
        selectRange(anchor, index);
      } else {
        selectIndex(index, isMod);
      }
      setFocusedIndex(index);
      onTransactionSelect?.(transactions[index]);
    });
  }, [selectedIndices, anchorIndex, selectIndex, selectRange, setFocusedIndex, transactions, onTransactionSelect, measureAction]);

  const handleRowDoubleClick = useCallback((index: number) => {
    measureAction('Transaction Open', () => {
      onTransactionOpen?.(transactions[index]);
    });
  }, [transactions, onTransactionOpen, measureAction]);

  return (
    <div className="flex flex-col h-full">
      <TransactionListHeader 
        selectedCount={selectedIndices.size} 
        totalCount={transactions.length} 
      />
      
      <div 
        ref={parentRef} 
        className="flex-1 overflow-auto focus:outline-none"
        tabIndex={0}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const transaction = transactions[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TransactionRow
                  transaction={transaction}
                  isSelected={isSelected(virtualRow.index)}
                  isFocused={isFocused(virtualRow.index)}
                  isMultiSelected={isSelected(virtualRow.index) && selectedIndices.size > 1}
                  onClick={(e) => handleRowClick(virtualRow.index, e)}
                  onDoubleClick={() => handleRowDoubleClick(virtualRow.index)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* List footer with stats */}
      <div className="h-7 px-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{transactions.length} transactions</span>
        <div className="flex items-center gap-4">
          <span>
            Navigate: <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd>
          </span>
          <span>
            Multi-select: <kbd className="kbd">Shift</kbd>+<kbd className="kbd">↑↓</kbd>
          </span>
          <span>
            Select all: <kbd className="kbd">⌘A</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
