/**
 * useSyncStatus - Derive global sync state from navigator.onLine and IndexedDB syncQueue
 * 
 * This is a read-only visibility layer that monitors:
 * 1. Browser online/offline state (navigator.onLine)
 * 2. Pending sync queue items in IndexedDB
 * 
 * Returns derived sync state:
 * - 'offline': No network connection
 * - 'online-pending': Online with pending changes in sync queue
 * - 'online-synced': Online with all changes synced
 * 
 * Edge cases handled:
 * - Offline → Online transitions trigger re-check
 * - IndexedDB access failures degrade gracefully
 * - Event-driven updates via custom event system
 * - No backend assumptions
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/indexedDB';

export type SyncState = 'offline' | 'online-pending' | 'online-synced';

export interface SyncStatus {
  state: SyncState;
  isOnline: boolean;
  pendingCount: number;
  lastChecked: number;
}

// Custom event name for sync queue changes
const SYNC_QUEUE_CHANGE_EVENT = 'syncQueueChange';

/**
 * Dispatch custom event when sync queue changes
 * Call this after adding/removing items from sync queue
 */
export function notifySyncQueueChange() {
  window.dispatchEvent(new CustomEvent(SYNC_QUEUE_CHANGE_EVENT));
}

/**
 * Hook to monitor global sync status
 * Returns current sync state derived from navigator.onLine and syncQueue length
 */
export function useSyncStatus(): SyncStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(Date.now());

  // Check pending sync queue items
  const checkPendingSync = useCallback(async () => {
    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .count();
      
      setPendingCount(pendingItems);
      setLastChecked(Date.now());
    } catch (error) {
      // Gracefully degrade - if IndexedDB fails, assume no pending items
      console.warn('Failed to check sync queue:', error);
      setPendingCount(0);
      setLastChecked(Date.now());
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Re-check pending items when coming back online
      checkPendingSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkPendingSync]);

  // Listen to custom sync queue change events
  // Components that modify the sync queue should call notifySyncQueueChange()
  useEffect(() => {
    const handleSyncQueueChange = () => {
      checkPendingSync();
    };

    window.addEventListener(SYNC_QUEUE_CHANGE_EVENT, handleSyncQueueChange);

    return () => {
      window.removeEventListener(SYNC_QUEUE_CHANGE_EVENT, handleSyncQueueChange);
    };
  }, [checkPendingSync]);

  // Derive sync state from online status and pending count
  const state: SyncState = !isOnline
    ? 'offline'
    : pendingCount > 0
    ? 'online-pending'
    : 'online-synced';

  return {
    state,
    isOnline,
    pendingCount,
    lastChecked,
  };
}
