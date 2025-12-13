import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Transaction, TransactionType, TransactionStatus } from '../data/mockTransactions';

interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  account?: string;
}

interface TransactionState {
  // Selection state
  selectedIds: Set<string>;
  focusedId: string | null;
  
  // Filter state
  filters: TransactionFilters;
  
  // UI state
  detailId: string | null;
  
  // Actions - Selection
  selectTransaction: (id: string) => void;
  deselectTransaction: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  setFocusedId: (id: string | null) => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  
  // Actions - UI
  showDetail: (id: string) => void;
  closeDetail: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedIds: new Set(),
      focusedId: null,
      filters: {},
      detailId: null,
      
      // Selection actions
      selectTransaction: (id) =>
        set((state) => ({
          selectedIds: new Set(state.selectedIds).add(id),
        }), false, 'transactions/selectTransaction'),
      
      deselectTransaction: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          newSet.delete(id);
          return { selectedIds: newSet };
        }, false, 'transactions/deselectTransaction'),
      
      toggleSelection: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        }, false, 'transactions/toggleSelection'),
      
      clearSelection: () =>
        set({ selectedIds: new Set() }, false, 'transactions/clearSelection'),
      
      selectMultiple: (ids) =>
        set({ selectedIds: new Set(ids) }, false, 'transactions/selectMultiple'),
      
      setFocusedId: (id) =>
        set({ focusedId: id }, false, 'transactions/setFocusedId'),
      
      // Filter actions
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }), false, 'transactions/setFilters'),
      
      clearFilters: () =>
        set({ filters: {} }, false, 'transactions/clearFilters'),
      
      // UI actions
      showDetail: (id) =>
        set({ detailId: id }, false, 'transactions/showDetail'),
      
      closeDetail: () =>
        set({ detailId: null }, false, 'transactions/closeDetail'),
    }),
    { name: 'TransactionStore' }
  )
);
