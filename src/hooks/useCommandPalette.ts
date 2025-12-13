import { useState, useCallback, useEffect } from 'react';

const RECENT_QUERIES_KEY = 'command-palette-recent';
const MAX_RECENT_QUERIES = 5;

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  // Load recent queries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_QUERIES_KEY);
    if (stored) {
      try {
        setRecentQueries(JSON.parse(stored));
      } catch {
        setRecentQueries([]);
      }
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const addRecentQuery = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_QUERIES);
      localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentQueries = useCallback(() => {
    setRecentQueries([]);
    localStorage.removeItem(RECENT_QUERIES_KEY);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    recentQueries,
    addRecentQuery,
    clearRecentQueries,
  };
}
