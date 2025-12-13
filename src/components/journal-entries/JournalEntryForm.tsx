import { useEffect, useCallback, useState, forwardRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JournalEntry, JournalEntryLine, mockAccounts } from '@/data/mockJournalEntries';
import { Plus, Trash2, AlertCircle, Copy } from 'lucide-react';

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  onSave: (data: Partial<JournalEntry>) => void;
  onSaveAndClose: (data: Partial<JournalEntry>) => void;
  onDuplicate?: (data: Partial<JournalEntry>) => void;
}

interface LineState extends Omit<JournalEntryLine, 'id'> {
  id: string;
}

export const JournalEntryForm = forwardRef<HTMLDivElement, JournalEntryFormProps>(
  function JournalEntryForm({ open, onOpenChange, entry, onSave, onSaveAndClose, onDuplicate }, ref) {
  // Detect if this is a duplicate (has data but no id)
  const isDuplicate = entry && !entry.id;
  const [txnDate, setTxnDate] = useState('');
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<LineState[]>([]);

  // Initialize form
  useEffect(() => {
    if (entry) {
      setTxnDate(entry.txnDate);
      setMemo(entry.memo);
      setLines(entry.lines.map(l => ({ ...l })));
    } else {
      setTxnDate(new Date().toISOString().split('T')[0]);
      setMemo('');
      setLines([
        { id: '1', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
      ]);
    }
  }, [entry, open]);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = useCallback(() => {
    setLines(prev => [
      ...prev,
      { id: String(Date.now()), accountId: '', accountName: '', description: '', debit: 0, credit: 0 }
    ]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateLine = useCallback((id: string, field: keyof LineState, value: string | number) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      
      if (field === 'accountId') {
        const account = mockAccounts.find(a => a.id === value);
        return { ...l, accountId: value as string, accountName: account?.name || '' };
      }
      
      return { ...l, [field]: value };
    }));
  }, []);

  const buildData = useCallback((): Partial<JournalEntry> => {
    return {
      id: entry?.id,
      txnDate,
      memo,
      lines: lines.filter(l => l.accountId),
      totalDebit,
      totalCredit,
      status: entry?.status || 'draft',
    };
  }, [entry, txnDate, memo, lines, totalDebit, totalCredit]);

  const handleSave = useCallback(() => {
    onSave(buildData());
  }, [onSave, buildData]);

  const handleSaveAndClose = useCallback(() => {
    onSaveAndClose(buildData());
  }, [onSaveAndClose, buildData]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (isBalanced) {
          handleSaveAndClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleSave, handleSaveAndClose, onOpenChange, isBalanced]);

  const formatCurrency = (n: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>
              {isDuplicate ? 'Duplicate Journal Entry' : entry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </SheetTitle>
            {entry && entry.id && onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(buildData())}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </Button>
            )}
          </div>
          {isDuplicate && (
            <div className="mt-2 p-2 bg-primary/10 rounded text-xs text-primary">
              📋 This is a duplicate of the original record. Save to create a new copy.
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="txnDate">Date</Label>
              <Input
                id="txnDate"
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docNumber">Entry #</Label>
              <Input
                id="docNumber"
                value={entry?.docNumber || 'Auto-generated'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Enter a description..."
              rows={2}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-md">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                <div className="col-span-4">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
                <div className="col-span-1"></div>
              </div>

              {/* Lines */}
              {lines.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 items-center">
                  <div className="col-span-4">
                    <Select 
                      value={line.accountId} 
                      onValueChange={(v) => updateLine(line.id, 'accountId', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-8 text-xs text-right font-mono-nums"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-8 text-xs text-right font-mono-nums"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 text-sm font-medium">
                <div className="col-span-7 text-right">Totals:</div>
                <div className="col-span-2 text-right font-mono-nums">{formatCurrency(totalDebit)}</div>
                <div className="col-span-2 text-right font-mono-nums">{formatCurrency(totalCredit)}</div>
                <div className="col-span-1"></div>
              </div>
            </div>

            {/* Balance Warning */}
            {!isBalanced && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Entry is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
              <kbd className="kbd ml-2 text-[10px]">Esc</kbd>
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              Save
              <kbd className="kbd ml-2 text-[10px]">Ctrl+S</kbd>
            </Button>
            <Button onClick={handleSaveAndClose} disabled={!isBalanced}>
              Save & Close
              <kbd className="kbd ml-2 text-[10px]">Ctrl+↵</kbd>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

JournalEntryForm.displayName = 'JournalEntryForm';
