/**
 * CacheDebugger - Development tool to inspect cache state
 * Shows what's in Memory Cache and IndexedDB
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { db } from '@/services/indexedDB';

export function CacheDebugger() {
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [indexedDBData, setIndexedDBData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = async () => {
    // Get memory cache stats
    const stats = dataService.getCacheStats();
    setMemoryStats(stats);

    // Get IndexedDB data
    const invoices = await db.invoices.toArray();
    const bills = await db.bills.toArray();
    const journalEntries = await db.journalEntries.toArray();
    const transactions = await db.transactions.toArray();
    const syncQueue = await db.syncQueue.toArray();

    setIndexedDBData({
      invoices,
      bills,
      journalEntries,
      transactions,
      syncQueue,
    });
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        🔍 Cache Debugger
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Cache Debugger</h3>
        <div className="space-x-2">
          <Button onClick={refresh} size="sm" variant="outline">
            Refresh
          </Button>
          <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
            ✕
          </Button>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Memory Cache */}
        <div>
          <h4 className="font-semibold mb-2">Memory Cache:</h4>
          <div className="bg-gray-100 p-2 rounded">
            <div>Size: {memoryStats?.size} / {memoryStats?.maxSize}</div>
            <div className="mt-2">Keys:</div>
            <ul className="list-disc pl-4 max-h-32 overflow-auto">
              {memoryStats?.keys.map((key: string) => (
                <li key={key} className="truncate">{key}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* IndexedDB */}
        <div>
          <h4 className="font-semibold mb-2">IndexedDB:</h4>
          <div className="bg-gray-100 p-2 rounded space-y-1">
            <div>Invoices: {indexedDBData?.invoices.length || 0}</div>
            <div>Bills: {indexedDBData?.bills.length || 0}</div>
            <div>Journal Entries: {indexedDBData?.journalEntries.length || 0}</div>
            <div>Transactions: {indexedDBData?.transactions.length || 0}</div>
            <div>Sync Queue: {indexedDBData?.syncQueue.length || 0}</div>
          </div>
        </div>

        {/* Sync Queue Details */}
        {indexedDBData?.syncQueue.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Sync Queue Items:</h4>
            <div className="bg-gray-100 p-2 rounded max-h-32 overflow-auto">
              {indexedDBData.syncQueue.map((item: any) => (
                <div key={item.id} className="mb-2 pb-2 border-b">
                  <div>{item.entityType}: {item.operation}</div>
                  <div className="text-gray-600">ID: {item.entityId}</div>
                  <div className="text-gray-600">Status: {item.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
