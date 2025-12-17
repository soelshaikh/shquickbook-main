/**
 * Vendor Payment Store
 * 
 * Zustand store for Vendor Payment UI state management.
 * Follows the exact pattern from invoiceStore.ts and customerPaymentStore.ts
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

interface VendorPaymentState {
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

export const useVendorPaymentStore = create<VendorPaymentState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedPaymentId: null,
      filters: [],
      searchQuery: '',
      isFilterOpen: false,
      
      // Selection actions
      setSelectedPayment: (id) =>
        set({ selectedPaymentId: id }, false, 'vendorPayments/setSelectedPayment'),
      
      // Filter actions
      setFilters: (filters) =>
        set({ filters }, false, 'vendorPayments/setFilters'),
      
      addFilter: (filter) =>
        set((state) => ({
          filters: [...state.filters, filter],
        }), false, 'vendorPayments/addFilter'),
      
      removeFilter: (index) =>
        set((state) => ({
          filters: state.filters.filter((_, i) => i !== index),
        }), false, 'vendorPayments/removeFilter'),
      
      clearFilters: () =>
        set({ filters: [] }, false, 'vendorPayments/clearFilters'),
      
      // Search actions
      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'vendorPayments/setSearchQuery'),
      
      // UI actions
      toggleFilter: () =>
        set((state) => ({
          isFilterOpen: !state.isFilterOpen,
        }), false, 'vendorPayments/toggleFilter'),
    }),
    { name: 'VendorPaymentStore' }
  )
);
