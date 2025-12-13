import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Bill } from '../data/mockBills';

interface BillFilters {
  status?: string;
  vendor?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface BillState {
  // Selection state
  selectedIds: Set<string>;
  focusedId: string | null;
  
  // Filter state
  filters: BillFilters;
  
  // UI state
  isCreating: boolean;
  editingId: string | null;
  
  // Actions - Selection
  selectBill: (id: string) => void;
  deselectBill: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  setFocusedId: (id: string | null) => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<BillFilters>) => void;
  clearFilters: () => void;
  
  // Actions - UI
  startCreating: () => void;
  cancelCreating: () => void;
  startEditing: (id: string) => void;
  cancelEditing: () => void;
}

export const useBillStore = create<BillState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedIds: new Set(),
      focusedId: null,
      filters: {},
      isCreating: false,
      editingId: null,
      
      // Selection actions
      selectBill: (id) =>
        set((state) => ({
          selectedIds: new Set(state.selectedIds).add(id),
        }), false, 'bills/selectBill'),
      
      deselectBill: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          newSet.delete(id);
          return { selectedIds: newSet };
        }, false, 'bills/deselectBill'),
      
      toggleSelection: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        }, false, 'bills/toggleSelection'),
      
      clearSelection: () =>
        set({ selectedIds: new Set() }, false, 'bills/clearSelection'),
      
      selectMultiple: (ids) =>
        set({ selectedIds: new Set(ids) }, false, 'bills/selectMultiple'),
      
      setFocusedId: (id) =>
        set({ focusedId: id }, false, 'bills/setFocusedId'),
      
      // Filter actions
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }), false, 'bills/setFilters'),
      
      clearFilters: () =>
        set({ filters: {} }, false, 'bills/clearFilters'),
      
      // UI actions
      startCreating: () =>
        set({ isCreating: true, editingId: null }, false, 'bills/startCreating'),
      
      cancelCreating: () =>
        set({ isCreating: false }, false, 'bills/cancelCreating'),
      
      startEditing: (id) =>
        set({ editingId: id, isCreating: false }, false, 'bills/startEditing'),
      
      cancelEditing: () =>
        set({ editingId: null }, false, 'bills/cancelEditing'),
    }),
    { name: 'BillStore' }
  )
);
