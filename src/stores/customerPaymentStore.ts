/**
 * Customer Payment Store
 * 
 * Zustand store for Customer Payment UI state management.
 * Follows the exact pattern from invoiceStore.ts
 * 
 * Responsibilities:
 * - Selection state (focused payment)
 * - Filter state (advanced filters + search)
 * - UI state (filter panel visibility)
 * 
 * NO data fetching, NO IndexedDB, NO side effects - pure UI state only.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Filter } from '../types/filter';

interface CustomerPaymentState {
  // Selection state
  selectedPaymentId: string | null;
  
  // Filter state
  filters: Filter[];
  searchQuery: string;
  
  // UI state
  isFilterOpen: boolean;
  
  // Actions - Selection
  setSelectedPayment: (id: string | null) => void;
  
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

export const useCustomerPaymentStore = create<CustomerPaymentState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedPaymentId: null,
      filters: [],
      searchQuery: '',
      isFilterOpen: false,
      
      // Selection actions
      setSelectedPayment: (id) =>
        set({ selectedPaymentId: id }, false, 'customerPayments/setSelectedPayment'),
      
      // Filter actions
      setFilters: (filters) =>
        set({ filters }, false, 'customerPayments/setFilters'),
      
      addFilter: (filter) =>
        set((state) => ({
          filters: [...state.filters, filter],
        }), false, 'customerPayments/addFilter'),
      
      removeFilter: (index) =>
        set((state) => ({
          filters: state.filters.filter((_, i) => i !== index),
        }), false, 'customerPayments/removeFilter'),
      
      clearFilters: () =>
        set({ filters: [] }, false, 'customerPayments/clearFilters'),
      
      // Search actions
      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'customerPayments/setSearchQuery'),
      
      // UI actions
      toggleFilter: () =>
        set((state) => ({
          isFilterOpen: !state.isFilterOpen,
        }), false, 'customerPayments/toggleFilter'),
    }),
    { name: 'CustomerPaymentStore' }
  )
);
