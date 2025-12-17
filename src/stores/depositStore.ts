/**
 * Deposit Store
 * 
 * Zustand store for Deposit UI state management.
 * Follows the exact pattern from invoiceStore.ts and customerPaymentStore.ts
 * 
 * Responsibilities:
 * - Selection state (focused deposit)
 * - Filter state (advanced filters + search)
 * - UI state (filter panel visibility)
 * 
 * NO data fetching, NO IndexedDB, NO side effects - pure UI state only.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Filter } from '../types/filter';

interface DepositState {
  // Selection state
  selectedDepositId: string | null;
  
  // Filter state
  filters: Filter[];
  searchQuery: string;
  
  // UI state
  isFilterOpen: boolean;
  
  // Actions - Selection
  setSelectedDeposit: (id: string | null) => void;
  
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

export const useDepositStore = create<DepositState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedDepositId: null,
      filters: [],
      searchQuery: '',
      isFilterOpen: false,
      
      // Selection actions
      setSelectedDeposit: (id) =>
        set({ selectedDepositId: id }, false, 'deposits/setSelectedDeposit'),
      
      // Filter actions
      setFilters: (filters) =>
        set({ filters }, false, 'deposits/setFilters'),
      
      addFilter: (filter) =>
        set((state) => ({
          filters: [...state.filters, filter],
        }), false, 'deposits/addFilter'),
      
      removeFilter: (index) =>
        set((state) => ({
          filters: state.filters.filter((_, i) => i !== index),
        }), false, 'deposits/removeFilter'),
      
      clearFilters: () =>
        set({ filters: [] }, false, 'deposits/clearFilters'),
      
      // Search actions
      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'deposits/setSearchQuery'),
      
      // UI actions
      toggleFilter: () =>
        set((state) => ({
          isFilterOpen: !state.isFilterOpen,
        }), false, 'deposits/toggleFilter'),
    }),
    { name: 'DepositStore' }
  )
);
