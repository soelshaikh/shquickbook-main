import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JournalEntry } from '@/data/mockJournalEntries';
import { JournalEntryRow } from './JournalEntryRow';
import { JournalEntryListHeader } from './JournalEntryListHeader';
import { ListFooter } from '@/components/shared/ListFooter';
import { useListNavigation } from '@/hooks/useListNavigation';
import { useActionPerformance } from '@/hooks/usePerformance';

interface JournalEntryListProps {
  entries: JournalEntry[];
  onEntrySelect?: (entry: JournalEntry) => void;
  onEntryOpen?: (entry: JournalEntry) => void;
}

export interface JournalEntryListRef {
  focus: () => void;
}

export const JournalEntryList = forwardRef<JournalEntryListRef, JournalEntryListProps>(
  ({ entries, onEntrySelect, onEntryOpen }, ref) => {
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
      itemCount: entries.length,
      onSelect: (index) => {
        onEntrySelect?.(entries[index]);
      },
      enabled: true,
    });

    useImperativeHandle(ref, () => ({
      focus: () => containerRef.current?.focus(),
    }));

    const virtualizer = useVirtualizer({
      count: entries.length,
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
      measureAction('Journal Entry Row Select', () => {
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
      measureAction('Journal Entry Open', () => {
        onEntryOpen?.(entries[index]);
      });
    }, [entries, onEntryOpen, measureAction]);

    const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle Enter to open
      if (e.key === 'Enter' && selectedIndices.size === 1) {
        const selectedIndex = Array.from(selectedIndices)[0];
        onEntryOpen?.(entries[selectedIndex]);
        e.preventDefault();
        return;
      }

      // Handle E for edit
      if ((e.key === 'e' || e.key === 'E') && selectedIndices.size === 1) {
        const selectedIndex = Array.from(selectedIndices)[0];
        onEntryOpen?.(entries[selectedIndex]);
        e.preventDefault();
        return;
      }

      handleKeyDown(e.nativeEvent);
    }, [handleKeyDown, selectedIndices, entries, onEntryOpen]);

    return (
      <div 
        ref={containerRef}
        className="h-full flex flex-col focus:outline-none"
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
      >
        <JournalEntryListHeader 
          selectedCount={selectedIndices.size} 
          totalCount={entries.length} 
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
              const entry = entries[virtualRow.index];
              return (
                <JournalEntryRow
                  key={entry.id}
                  entry={entry}
                  isSelected={isSelected(virtualRow.index)}
                  isFocused={isFocused(virtualRow.index)}
                  isMultiSelected={isSelected(virtualRow.index) && selectedIndices.size > 1}
                  onClick={(e) => handleRowClick(virtualRow.index, e)}
                  onDoubleClick={() => handleRowDoubleClick(virtualRow.index)}
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
        
        {entries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No journal entries found
          </div>
        ) : (
          <ListFooter itemCount={entries.length} itemLabel="journal entries" />
        )}
      </div>
    );
  }
);

JournalEntryList.displayName = 'JournalEntryList';
