/**
 * Tests for useSyncStatus hook
 * 
 * Verifies:
 * - Correct state derivation from navigator.onLine and syncQueue
 * - Offline/online transitions
 * - Reactive updates when sync queue changes
 * - Graceful degradation on IndexedDB errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSyncStatus } from '../useSyncStatus';
import { db } from '@/services/indexedDB';

// Mock navigator.onLine
let onlineStatus = true;
Object.defineProperty(window.navigator, 'onLine', {
  get: () => onlineStatus,
  configurable: true,
});

describe('useSyncStatus', () => {
  beforeEach(async () => {
    // Reset online status
    onlineStatus = true;
    
    // Clear sync queue
    await db.syncQueue.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return online-synced when online with no pending items', async () => {
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.state).toBe('online-synced');
      expect(result.current.isOnline).toBe(true);
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('should return offline when navigator.onLine is false', async () => {
    onlineStatus = false;

    const { result } = renderHook(() => useSyncStatus());

    // Trigger offline event
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current.state).toBe('offline');
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('should return online-pending when online with pending sync items', async () => {
    // Add items to sync queue
    await db.syncQueue.add({
      entityType: 'invoice',
      entityId: 'test-1',
      operation: 'CREATE',
      payload: { test: 'data' },
      createdAt: Date.now(),
      status: 'PENDING',
      retryCount: 0,
    });

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.state).toBe('online-pending');
      expect(result.current.isOnline).toBe(true);
      expect(result.current.pendingCount).toBe(1);
    });
  });

  it('should handle offline to online transition', async () => {
    onlineStatus = false;
    const { result } = renderHook(() => useSyncStatus());

    // Start offline
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current.state).toBe('offline');
    });

    // Go online
    onlineStatus = true;
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(result.current.state).toBe('online-synced');
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('should update pendingCount when sync queue changes', async () => {
    const { result } = renderHook(() => useSyncStatus());

    // Initially no pending items
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    // Add item to sync queue
    await db.syncQueue.add({
      entityType: 'bill',
      entityId: 'test-2',
      operation: 'UPDATE',
      payload: { test: 'data' },
      createdAt: Date.now(),
      status: 'PENDING',
      retryCount: 0,
    });

    // Should update automatically via Dexie subscription
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
      expect(result.current.state).toBe('online-pending');
    });

    // Add another item
    await db.syncQueue.add({
      entityType: 'transaction',
      entityId: 'test-3',
      operation: 'DELETE',
      payload: {},
      createdAt: Date.now(),
      status: 'PENDING',
      retryCount: 0,
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(2);
    });
  });

  it('should ignore non-PENDING sync queue items', async () => {
    // Add PROCESSING item
    await db.syncQueue.add({
      entityType: 'invoice',
      entityId: 'test-4',
      operation: 'CREATE',
      payload: {},
      createdAt: Date.now(),
      status: 'PROCESSING',
      retryCount: 0,
    });

    // Add FAILED item
    await db.syncQueue.add({
      entityType: 'invoice',
      entityId: 'test-5',
      operation: 'CREATE',
      payload: {},
      createdAt: Date.now(),
      status: 'FAILED',
      retryCount: 1,
    });

    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.state).toBe('online-synced');
    });
  });

  it('should gracefully handle IndexedDB errors', async () => {
    // Mock IndexedDB error
    const spy = vi.spyOn(db.syncQueue, 'where').mockImplementation(() => {
      throw new Error('IndexedDB error');
    });

    const { result } = renderHook(() => useSyncStatus());

    // Should not crash and default to 0 pending items
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.state).toBe('online-synced');
    });

    spy.mockRestore();
  });

  it('should include lastChecked timestamp', async () => {
    const beforeTest = Date.now();
    const { result } = renderHook(() => useSyncStatus());

    await waitFor(() => {
      expect(result.current.lastChecked).toBeGreaterThanOrEqual(beforeTest);
      expect(result.current.lastChecked).toBeLessThanOrEqual(Date.now());
    });
  });
});
