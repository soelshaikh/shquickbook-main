/**
 * Credit Memo Store
 * 
 * Zustand store for Credit Memo UI state management.
 * Follows the exact pattern from invoiceStore.ts and customerPaymentStore.ts
 * 
 * Responsibilities:
 * - Selection state (focused credit memo)
 * - Filter state (advanced filters + search)
 * - UI state (filter panel visibility)
 * 
 * NO data fetching, NO IndexedDB, NO side effects - pure UI state only.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Filter } from '../types/filter';

interface CreditMemoState {
  // Selection state
  selectedCreditMemoId: string | null;
  
  // Filter state
  filters: Filter[];
  searchQuery: string;
  
  // UI state
  isFilterOpen: boolean;
  
  // Actions - Selection
  setSelectedCreditMemo: (id: string | null) => void;
  
  // Actions - Filters
  setFilters: (filters: Filter[]) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  
  // Actions - Search
  setSearchQuery: (query: string) => void;
  
  // Actions - UI
  toggleFilter: () => void;
}

export const useCreditMemoStore = create<CreditMemoState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedCreditMemoId: null,
      filters: [],
      searchQuery: '',
      isFilterOpen: false,
      
      // Selection actions
      setSelectedCreditMemo: (id) =>
        set({ selectedCreditMemoId: id }, false, 'creditMemos/setSelectedCreditMemo'),
      
      // Filter actions
      setFilters: (filters) =>
        set({ filters }, false, 'creditMemos/setFilters'),
      
      addFilter: (filter) =>
        set((state) => ({
          filters: [...state.filters, filter],
        }), false, 'creditMemos/addFilter'),
      
      removeFilter: (index) =>
        set((state) => ({
          filters: state.filters.filter((_, i) => i !== index),
        }), false, 'creditMemos/removeFilter'),
      
      clearFilters: () =>
        set({ filters: [] }, false, 'creditMemos/clearFilters'),
      
      // Search actions
      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'creditMemos/setSearchQuery'),
      
      // UI actions
      toggleFilter: () =>
        set((state) => ({
          isFilterOpen: !state.isFilterOpen,
        }), false, 'creditMemos/toggleFilter'),
    }),
    { name: 'CreditMemoStore' }
  )
);
