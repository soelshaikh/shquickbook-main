import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { JournalEntry } from '../data/mockJournalEntries';

interface JournalEntryFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface JournalEntryState {
  // Selection state
  selectedIds: Set<string>;
  focusedId: string | null;
  
  // Filter state
  filters: JournalEntryFilters;
  
  // UI state
  isCreating: boolean;
  editingId: string | null;
  
  // Actions - Selection
  selectJournalEntry: (id: string) => void;
  deselectJournalEntry: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  setFocusedId: (id: string | null) => void;
  
  // Actions - Filters
  setFilters: (filters: Partial<JournalEntryFilters>) => void;
  clearFilters: () => void;
  
  // Actions - UI
  startCreating: () => void;
  cancelCreating: () => void;
  startEditing: (id: string) => void;
  cancelEditing: () => void;
}

export const useJournalEntryStore = create<JournalEntryState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedIds: new Set(),
      focusedId: null,
      filters: {},
      isCreating: false,
      editingId: null,
      
      // Selection actions
      selectJournalEntry: (id) =>
        set((state) => ({
          selectedIds: new Set(state.selectedIds).add(id),
        }), false, 'journalEntries/selectJournalEntry'),
      
      deselectJournalEntry: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          newSet.delete(id);
          return { selectedIds: newSet };
        }, false, 'journalEntries/deselectJournalEntry'),
      
      toggleSelection: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        }, false, 'journalEntries/toggleSelection'),
      
      clearSelection: () =>
        set({ selectedIds: new Set() }, false, 'journalEntries/clearSelection'),
      
      selectMultiple: (ids) =>
        set({ selectedIds: new Set(ids) }, false, 'journalEntries/selectMultiple'),
      
      setFocusedId: (id) =>
        set({ focusedId: id }, false, 'journalEntries/setFocusedId'),
      
      // Filter actions
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }), false, 'journalEntries/setFilters'),
      
      clearFilters: () =>
        set({ filters: {} }, false, 'journalEntries/clearFilters'),
      
      // UI actions
      startCreating: () =>
        set({ isCreating: true, editingId: null }, false, 'journalEntries/startCreating'),
      
      cancelCreating: () =>
        set({ isCreating: false }, false, 'journalEntries/cancelCreating'),
      
      startEditing: (id) =>
        set({ editingId: id, isCreating: false }, false, 'journalEntries/startEditing'),
      
      cancelEditing: () =>
        set({ editingId: null }, false, 'journalEntries/cancelEditing'),
    }),
    { name: 'JournalEntryStore' }
  )
);
