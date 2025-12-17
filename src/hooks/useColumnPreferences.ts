import { useState, useEffect, useCallback } from 'react';
import { ColumnConfig, UserColumnPreferences } from '@/types/columnConfig';

const STORAGE_KEY = 'user-column-preferences';

/**
 * Hook to manage column visibility preferences for list views
 * Saves preferences to localStorage (will be replaced with API in the future)
 */
export function useColumnPreferences(pageKey: keyof UserColumnPreferences, defaultColumns: ColumnConfig[]) {
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allPrefs: UserColumnPreferences = JSON.parse(stored);
        const pagePrefs = allPrefs[pageKey];
        
        if (pagePrefs && Array.isArray(pagePrefs)) {
          // Merge stored preferences with default columns
          // This ensures new columns are added if defaults change
          const merged = defaultColumns.map(defaultCol => {
            const stored = pagePrefs.find(p => p.key === defaultCol.key);
            return stored || defaultCol;
          });
          setColumns(merged);
        }
      }
    } catch (error) {
      console.error('Failed to load column preferences:', error);
    }
  }, [pageKey, defaultColumns]);

  // Save preferences to localStorage
  const savePreferences = useCallback((newColumns: ColumnConfig[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPrefs: UserColumnPreferences = stored ? JSON.parse(stored) : {};
      
      allPrefs[pageKey] = newColumns;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPrefs));
      setColumns(newColumns);
    } catch (error) {
      console.error('Failed to save column preferences:', error);
    }
  }, [pageKey]);

  // Toggle visibility of a column
  const toggleColumn = useCallback((columnKey: string) => {
    const newColumns = columns.map(col => {
      if (col.key === columnKey && !col.required) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
    savePreferences(newColumns);
  }, [columns, savePreferences]);

  // Reset to default columns
  const resetToDefaults = useCallback(() => {
    savePreferences(defaultColumns);
  }, [defaultColumns, savePreferences]);

  // Get only visible columns
  const visibleColumns = columns.filter(col => col.visible);

  return {
    columns,
    visibleColumns,
    toggleColumn,
    resetToDefaults,
    savePreferences,
  };
}
