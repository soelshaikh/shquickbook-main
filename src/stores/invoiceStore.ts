import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Invoice } from '../data/mockInvoices';

interface InvoiceFilters {
  status?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface InvoiceState {
  // Selection state
  selectedIds: Set<string>;
  focusedId: string | null;
  
  // Filter state
  filters: InvoiceFilters;
  
  // UI state
  isCreating: boolean;
  editingId: string | null;
  
  // Actions - Selection
  selectInvoice: (id: string) => void;
  deselectInvoice: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  setFocusedId: (id: string | null) => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  clearFilters: () => void;
  
  // Actions - UI
  startCreating: () => void;
  cancelCreating: () => void;
  startEditing: (id: string) => void;
  cancelEditing: () => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedIds: new Set(),
      focusedId: null,
      filters: {},
      isCreating: false,
      editingId: null,
      
      // Selection actions
      selectInvoice: (id) =>
        set((state) => ({
          selectedIds: new Set(state.selectedIds).add(id),
        }), false, 'invoices/selectInvoice'),
      
      deselectInvoice: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          newSet.delete(id);
          return { selectedIds: newSet };
        }, false, 'invoices/deselectInvoice'),
      
      toggleSelection: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        }, false, 'invoices/toggleSelection'),
      
      clearSelection: () =>
        set({ selectedIds: new Set() }, false, 'invoices/clearSelection'),
      
      selectMultiple: (ids) =>
        set({ selectedIds: new Set(ids) }, false, 'invoices/selectMultiple'),
      
      setFocusedId: (id) =>
        set({ focusedId: id }, false, 'invoices/setFocusedId'),
      
      // Filter actions
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }), false, 'invoices/setFilters'),
      
      clearFilters: () =>
        set({ filters: {} }, false, 'invoices/clearFilters'),
      
      // UI actions
      startCreating: () =>
        set({ isCreating: true, editingId: null }, false, 'invoices/startCreating'),
      
      cancelCreating: () =>
        set({ isCreating: false }, false, 'invoices/cancelCreating'),
      
      startEditing: (id) =>
        set({ editingId: id, isCreating: false }, false, 'invoices/startEditing'),
      
      cancelEditing: () =>
        set({ editingId: null }, false, 'invoices/cancelEditing'),
    }),
    { name: 'InvoiceStore' }
  )
);
