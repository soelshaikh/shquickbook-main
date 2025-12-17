import { useState, useCallback, useEffect } from 'react';

interface UseListNavigationOptions {
  itemCount: number;
  onSelect?: (index: number) => void;
  onMultiSelect?: (indices: number[]) => void;
  enabled?: boolean;
}

export function useListNavigation({
  itemCount,
  onSelect,
  onMultiSelect,
  enabled = true,
}: UseListNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);

  // Reset when item count changes
  useEffect(() => {
    if (focusedIndex >= itemCount && itemCount > 0) {
      setFocusedIndex(itemCount - 1);
    }
  }, [itemCount, focusedIndex]);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    setAnchorIndex(null);
  }, []);

  const selectIndex = useCallback((index: number, addToSelection = false) => {
    if (addToSelection) {
      setSelectedIndices(prev => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    } else {
      setSelectedIndices(new Set([index]));
      setAnchorIndex(index);
    }
    onSelect?.(index);
  }, [onSelect]);

  const selectRange = useCallback((fromIndex: number, toIndex: number) => {
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const range = new Set<number>();
    for (let i = start; i <= end; i++) {
      range.add(i);
    }
    setSelectedIndices(range);
    onMultiSelect?.(Array.from(range));
  }, [onMultiSelect]);

  const selectAll = useCallback(() => {
    const all = new Set<number>();
    for (let i = 0; i < itemCount; i++) {
      all.add(i);
    }
    setSelectedIndices(all);
    onMultiSelect?.(Array.from(all));
  }, [itemCount, onMultiSelect]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || itemCount === 0) return;

    // Check if a modal/dialog/sheet is open - don't handle list navigation
    const isModalOpen = document.querySelector('[data-state="open"][role="dialog"]') !== null;
    if (isModalOpen) {
      return; // Let the modal handle its own keyboard events
    }

    const isMod = e.metaKey || e.ctrlKey;

    // Select All: Cmd/Ctrl + A
    if (isMod && e.key === 'a') {
      e.preventDefault();
      selectAll();
      return;
    }

    // Navigation: Up/Down or j/k
    const isUp = e.key === 'ArrowUp' || e.key === 'k';
    const isDown = e.key === 'ArrowDown' || e.key === 'j';

    if (isUp || isDown) {
      e.preventDefault();
      
      const newIndex = isUp
        ? Math.max(0, focusedIndex - 1)
        : Math.min(itemCount - 1, focusedIndex + 1);

      setFocusedIndex(newIndex);

      // Shift+Arrow: Range selection
      if (e.shiftKey) {
        // Set anchor on first shift selection, then keep it fixed
        const anchor = anchorIndex ?? focusedIndex;
        if (anchorIndex === null) {
          setAnchorIndex(anchor);
        }
        selectRange(anchor, newIndex);
      } else if (!isMod) {
        // Normal navigation clears selection
        clearSelection();
      }
      return;
    }

    // Home/End
    if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      if (!e.shiftKey) clearSelection();
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(itemCount - 1);
      if (!e.shiftKey) clearSelection();
      return;
    }

    // Space: Toggle selection of focused item
    if (e.key === ' ') {
      e.preventDefault();
      selectIndex(focusedIndex, isMod);
      return;
    }

    // Enter: Confirm selection
    if (e.key === 'Enter') {
      e.preventDefault();
      selectIndex(focusedIndex, false);
      return;
    }

    // Escape: Clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSelection();
      return;
    }
  }, [enabled, itemCount, focusedIndex, anchorIndex, selectAll, selectRange, selectIndex, clearSelection]);

  return {
    focusedIndex,
    setFocusedIndex,
    selectedIndices,
    setSelectedIndices,
    anchorIndex,
    selectIndex,
    selectRange,
    selectAll,
    clearSelection,
    handleKeyDown,
    isSelected: (index: number) => selectedIndices.has(index),
    isFocused: (index: number) => focusedIndex === index,
  };
}
