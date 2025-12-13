import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { X, Plus, Trash2, Copy } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bill, BillLineItem, Vendor, mockVendors } from '@/data/mockBills';
import { cn } from '@/lib/utils';

interface BillFormProps {
  bill?: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Partial<Bill>) => void;
  onSaveAndClose: (bill: Partial<Bill>) => void;
  onDuplicate?: (bill: Partial<Bill>) => void;
}

const expenseCategories = [
  'Office Supplies',
  'Cloud Services',
  'Software Subscriptions',
  'Shipping & Delivery',
  'Telecommunications',
  'Professional Services',
  'Equipment',
  'Utilities',
  'Marketing',
  'Travel',
];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function BillForm({ bill, isOpen, onClose, onSave, onSaveAndClose, onDuplicate }: BillFormProps) {
  // Detect if this is a duplicate (has data but no id)
  const isDuplicate = bill && !bill.id;
  const [vendorId, setVendorId] = useState('');
  const [txnDate, setTxnDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<BillLineItem[]>([]);
  const [memo, setMemo] = useState('');

  // Initialize form when bill changes or form opens
  useEffect(() => {
    if (isOpen) {
      if (bill) {
        setVendorId(bill.vendor.id);
        setTxnDate(bill.txnDate);
        setDueDate(bill.dueDate);
        setLineItems(bill.lineItems.map(item => ({ ...item })));
        setMemo(bill.memo || '');
      } else {
        // New bill defaults
        const today = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);
        
        setVendorId('');
        setTxnDate(today);
        setDueDate(due.toISOString().split('T')[0]);
        setLineItems([{
          id: generateId(),
          description: '',
          category: expenseCategories[0],
          quantity: 1,
          rate: 0,
          amount: 0,
        }]);
        setMemo('');
      }
    }
  }, [bill, isOpen]);

  const calculateSubtotal = useCallback(() => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  }, [lineItems]);

  const calculateTax = useCallback(() => {
    return calculateSubtotal() * 0.0825;
  }, [calculateSubtotal]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTax();
  }, [calculateSubtotal, calculateTax]);

  const updateLineItem = useCallback((index: number, field: keyof BillLineItem, value: string | number) => {
    setLineItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      if (field === 'quantity' || field === 'rate') {
        item[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
        item.amount = Math.round(item.quantity * item.rate * 100) / 100;
      } else {
        (item as any)[field] = value;
      }
      
      updated[index] = item;
      return updated;
    });
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, {
      id: generateId(),
      description: '',
      category: expenseCategories[0],
      quantity: 1,
      rate: 0,
      amount: 0,
    }]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const buildBillData = useCallback((): Partial<Bill> => {
    const vendor = mockVendors.find(v => v.id === vendorId);
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();

    return {
      id: bill?.id || `bill-${generateId()}`,
      docNumber: bill?.docNumber || `BILL-${String(Date.now()).slice(-5)}`,
      txnDate,
      dueDate,
      vendor: vendor || { id: vendorId, name: 'Unknown Vendor' },
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      balance: Math.round(total * 100) / 100,
      status: 'pending',
      paymentStatus: 'unpaid',
      syncStatus: 'pending',
      memo: memo || undefined,
    };
  }, [bill, vendorId, txnDate, dueDate, lineItems, memo, calculateSubtotal, calculateTax, calculateTotal]);

  const handleSave = useCallback(() => {
    onSave(buildBillData());
  }, [onSave, buildBillData]);

  const handleSaveAndClose = useCallback(() => {
    onSaveAndClose(buildBillData());
  }, [onSaveAndClose, buildBillData]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [handleSave, handleSaveAndClose, onClose]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        className="w-full sm:max-w-2xl overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {isDuplicate ? 'Duplicate Bill' : bill ? 'Edit Bill' : 'New Bill'}
            </SheetTitle>
            {bill && bill.id && onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(buildBillData())}
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

        <div className="space-y-6">
          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="focus:ring-primary">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {mockVendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="txnDate">Bill Date</Label>
              <Input
                id="txnDate"
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="font-mono focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="font-mono focus:ring-primary"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Expense Line Items</Label>
              <Button variant="ghost" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Items */}
              {lineItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border items-center"
                >
                  <div className="col-span-4">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="h-8 text-sm focus:ring-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <Select 
                      value={item.category} 
                      onValueChange={(value) => updateLineItem(index, 'category', value)}
                    >
                      <SelectTrigger className="h-8 text-xs focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      className="h-8 text-sm font-mono text-right focus:ring-primary"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                      className="h-8 text-sm font-mono text-right focus:ring-primary"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1 font-mono text-sm text-right">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-1 pt-4 border-t border-border">
            <div className="flex items-center gap-8 text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-mono w-28 text-right">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <span className="text-muted-foreground">Tax (8.25%):</span>
              <span className="font-mono w-28 text-right">{formatCurrency(calculateTax())}</span>
            </div>
            <div className="flex items-center gap-8 text-base font-semibold pt-2 border-t border-border">
              <span>Total:</span>
              <span className="font-mono w-28 text-right">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add notes or reference numbers..."
              className="resize-none focus:ring-primary"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <span className="font-mono">Ctrl+S</span> Save · 
              <span className="font-mono ml-1">Ctrl+Enter</span> Save & Close · 
              <span className="font-mono ml-1">Esc</span> Cancel
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleSave}>
                Save
              </Button>
              <Button onClick={handleSaveAndClose}>
                Save & Close
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
