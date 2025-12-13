import { useState, useCallback, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Invoice, InvoiceLineItem, customers } from '@/data/mockInvoices';
import { Plus, Trash2, Save, Send, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSave: (invoice: Partial<Invoice>) => void;
  onSaveAndClose: (invoice: Partial<Invoice>) => void;
  onSend: (invoice: Partial<Invoice>) => void;
  onDuplicate?: (invoice: Partial<Invoice>) => void;
}

const defaultLineItem = (): InvoiceLineItem => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
});

export function InvoiceForm({ open, onOpenChange, invoice, onSave, onSaveAndClose, onSend, onDuplicate }: InvoiceFormProps) {
  // Detect if this is a duplicate (has data but no id)
  const isDuplicate = invoice && !invoice.id;
  const [customerId, setCustomerId] = useState(invoice?.customerId || '');
  const [txnDate, setTxnDate] = useState(invoice?.txnDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(invoice?.lineItems || [defaultLineItem()]);
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 0.0875);
  const [memo, setMemo] = useState(invoice?.memo || '');
  
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLButtonElement>(null);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // Set default due date (30 days from invoice date)
  useEffect(() => {
    if (txnDate && !dueDate) {
      const date = new Date(txnDate);
      date.setDate(date.getDate() + 30);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [txnDate, dueDate]);

  // Focus first input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when in input fields (except for our specific combos)
      const isModifier = e.ctrlKey || e.metaKey;
      
      if (isModifier && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isModifier && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveAndClose();
      } else if (isModifier && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, customerId, txnDate, dueDate, lineItems, taxRate, memo]);

  const updateLineItem = useCallback((index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      if (field === 'quantity' || field === 'rate') {
        item[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
        item.amount = Math.round(item.quantity * item.rate * 100) / 100;
      } else if (field === 'description') {
        item.description = value as string;
      }
      
      updated[index] = item;
      return updated;
    });
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, defaultLineItem()]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFormData = (): Partial<Invoice> => {
    const customer = customers.find(c => c.id === customerId);
    return {
      customerId,
      customer: customer?.name || '',
      txnDate,
      dueDate,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      balance: total,
      memo,
      status: 'draft',
    };
  };

  const handleSave = () => {
    if (!customerId) return;
    onSave(getFormData());
  };

  const handleSaveAndClose = () => {
    if (!customerId) return;
    onSaveAndClose(getFormData());
  };

  const handleSend = () => {
    if (!customerId) return;
    onSend(getFormData());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {isDuplicate ? 'Duplicate Invoice' : invoice ? 'Edit Invoice' : 'New Invoice'}
            </SheetTitle>
            {invoice && invoice.id && onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(getFormData())}
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

        <form ref={formRef} className="space-y-6" onSubmit={e => e.preventDefault()}>
          {/* Customer & Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger ref={firstInputRef} className="focus:ring-ring">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="txnDate">Invoice Date</Label>
              <Input
                id="txnDate"
                type="date"
                value={txnDate}
                onChange={e => setTxnDate(e.target.value)}
                className="focus:ring-ring"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="focus:ring-ring"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addLineItem}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Line
              </Button>
            </div>
            
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1" />
            </div>
            
            {/* Line Item Rows */}
            <div className="space-y-2">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      value={item.description}
                      onChange={e => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="h-8 text-sm focus:ring-ring"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                      className="h-8 text-sm text-right font-mono-nums focus:ring-ring"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={e => updateLineItem(index, 'rate', e.target.value)}
                      className="h-8 text-sm text-right font-mono-nums focus:ring-ring"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-mono-nums">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-8 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono-nums w-24 text-right">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(2)}%)</span>
                <span className="font-mono-nums w-24 text-right">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center gap-8 text-base font-semibold">
                <span>Total</span>
                <span className="font-mono-nums w-24 text-right">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="Notes for this invoice..."
              className="resize-none h-20 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
              <kbd className="kbd ml-1">Esc</kbd>
            </Button>
            
            <div className="flex-1" />
            
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={!customerId}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
              <kbd className="kbd ml-1">⌘S</kbd>
            </Button>
            
            <Button
              type="button"
              onClick={handleSaveAndClose}
              disabled={!customerId}
              className="gap-2"
            >
              Save & Close
              <kbd className="kbd ml-1">⌘↵</kbd>
            </Button>
            
            <Button
              type="button"
              variant="default"
              onClick={handleSend}
              disabled={!customerId}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              Send
              <kbd className="kbd ml-1">⇧⌘↵</kbd>
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
