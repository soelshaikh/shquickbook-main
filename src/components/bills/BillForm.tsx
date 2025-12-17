import { useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Copy } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Bill, BillLineItem, mockVendors } from '@/data/mockBills';
import {
  billFormSchema,
  type BillFormData,
  defaultBillFormValues,
  billFormDataToDomainModel,
  domainModelToBillFormData,
} from '@/schemas';

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

export function BillForm({ bill, isOpen, onClose, onSave, onSaveAndClose, onDuplicate }: BillFormProps) {
  // Detect if this is a duplicate (has data but no id)
  const isDuplicate = bill && !bill.id;
  
  // Refs for keyboard navigation to fields
  const vendorRef = useRef<HTMLButtonElement>(null);
  const billDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const firstLineItemRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);
  
  // Track if ESC was just used to blur a field (to require second ESC to close)
  const escUsedToBlurRef = useRef<boolean>(false);

  // Initialize React Hook Form with Zod validation
  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: bill 
      ? domainModelToBillFormData(bill)
      : defaultBillFormValues(),
  });

  // Field array for dynamic line items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  // Watch line items for total calculations
  const watchedLineItems = form.watch('lineItems');

  // Calculate totals (unchanged business logic)
  const subtotal = watchedLineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.round(subtotal * 0.0825 * 100) / 100; // 8.25% tax rate
  const total = Math.round((subtotal + tax) * 100) / 100;

  // Reset form when bill prop changes
  useEffect(() => {
    form.reset(
      bill 
        ? domainModelToBillFormData(bill)
        : defaultBillFormValues()
    );
  }, [bill, form]);

  // Focus first input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => vendorRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update line item amount when quantity or rate changes
  const updateLineItem = useCallback((index: number, field: 'description' | 'quantity' | 'rate' | 'category', value: string | number) => {
    const currentItem = form.getValues(`lineItems.${index}`);
    
    if (field === 'quantity' || field === 'rate') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      const quantity = field === 'quantity' ? numValue : currentItem.quantity;
      const rate = field === 'rate' ? numValue : currentItem.rate;
      const amount = Math.round(quantity * rate * 100) / 100;
      
      form.setValue(`lineItems.${index}.${field}`, numValue);
      form.setValue(`lineItems.${index}.amount`, amount);
    } else {
      form.setValue(`lineItems.${index}.${field}`, value as string);
    }
  }, [form]);

  const addLineItem = useCallback(() => {
    append({
      id: crypto.randomUUID(),
      description: '',
      category: expenseCategories[0],
      quantity: 1,
      rate: 0,
      amount: 0,
    });
  }, [append]);

  const removeLineItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Convert form data to Bill domain model
  const getFormData = (formData: BillFormData): Partial<Bill> => {
    const vendor = mockVendors.find(v => v.id === formData.vendorId);
    return billFormDataToDomainModel(
      formData,
      vendor?.name || 'Unknown Vendor',
      bill?.id ? {
        id: bill.id,
        docNumber: bill.docNumber,
        companyId: bill.companyId,
      } : undefined
    );
  };

  // Submit handlers - all trigger validation
  const handleSave = useCallback(() => {
    form.handleSubmit((data) => {
      onSave(getFormData(data));
    })();
  }, [form, onSave, bill]);

  const handleSaveAndClose = useCallback(() => {
    form.handleSubmit((data) => {
      onSaveAndClose(getFormData(data));
    })();
  }, [form, onSaveAndClose, bill]);

  // Keyboard shortcuts for form actions AND field navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      
      // Reset ESC blur flag when user types or uses other keys
      if (e.key !== 'Escape' && isTyping) {
        escUsedToBlurRef.current = false;
      }
      
      // Form action shortcuts (work even when typing)
      if (isModifier && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndClose();
        return;
      }
      // ESC key is now handled by onEscapeKeyDown prop on SheetContent
      // No need to handle it here in the window event listener
      
      // Field navigation shortcuts (work when NOT actively typing in an input/textarea)
      if (!isModifier && !isTyping) {
        const key = e.key.toLowerCase();
        
        if (key === 'v') {
          e.preventDefault();
          vendorRef.current?.click(); // Opens the select dropdown
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          billDateRef.current?.focus();
          billDateRef.current?.select(); // Select all for easy overwrite
          return;
        }
        if (key === 'u') {
          e.preventDefault();
          dueDateRef.current?.focus();
          dueDateRef.current?.select();
          return;
        }
        if (key === 'l') {
          e.preventDefault();
          firstLineItemRef.current?.focus();
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          memoRef.current?.focus();
          return;
        }
        if (key === 'n') {
          e.preventDefault();
          addLineItem();
          // Focus the newly added line item after a tick
          setTimeout(() => {
            const inputs = document.querySelectorAll('[data-line-item-description]');
            const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
            lastInput?.focus();
          }, 0);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, handleSaveAndClose, onClose, addLineItem]);

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
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on sheet open, we'll handle focus manually
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Intercept ESC key at the Sheet level (before Radix closes it)
          const target = document.activeElement as HTMLElement;
          const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
          
          // If typing in a field, blur it first and prevent sheet from closing
          if (isTyping) {
            e.preventDefault();
            target.blur();
            escUsedToBlurRef.current = true;
            // Reset flag after short delay so next ESC will close
            setTimeout(() => {
              escUsedToBlurRef.current = false;
            }, 100);
            return;
          }
          
          // If ESC was just used to blur, prevent closing
          if (escUsedToBlurRef.current) {
            e.preventDefault();
            return;
          }
          
          // Otherwise, allow default behavior (close sheet)
        }}
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <SheetTitle>
                {isDuplicate ? 'Duplicate Bill' : bill ? 'Edit Bill' : 'New Bill'}
              </SheetTitle>
              <div className="text-xs text-muted-foreground">
                Press <kbd className="kbd kbd-xs">V</kbd>, <kbd className="kbd kbd-xs">D</kbd>, <kbd className="kbd kbd-xs">L</kbd>, <kbd className="kbd kbd-xs">M</kbd> to jump between fields • <kbd className="kbd kbd-xs">?</kbd> for all shortcuts
              </div>
            </div>
            {bill && bill.id && onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentData = form.getValues();
                  onDuplicate(getFormData(currentData));
                }}
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

        {/* Form with React Hook Form provider */}
        <Form {...form}>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Vendor Selection - with validation */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Vendor
                    <kbd className="kbd text-[10px] ml-1.5 opacity-60">V</kbd>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger ref={vendorRef} className="focus:ring-ring">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockVendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates - with validation */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bill Date Field */}
              <FormField
                control={form.control}
                name="txnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Bill Date
                      <kbd className="kbd text-[10px] ml-1.5 opacity-60">D</kbd>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="font-mono focus:ring-ring"
                        {...field}
                        ref={(el) => {
                          field.ref(el);
                          billDateRef.current = el;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Due Date Field */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Due Date
                      <kbd className="kbd text-[10px] ml-1.5 opacity-60">U</kbd>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="font-mono focus:ring-ring"
                        {...field}
                        ref={(el) => {
                          field.ref(el);
                          dueDateRef.current = el;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items Section - with validation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>
                  Expense Line Items
                  <kbd className="kbd text-[10px] ml-1.5 opacity-60">L</kbd>
                </FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={addLineItem} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Line
                  <kbd className="kbd text-[10px] ml-1">N</kbd>
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
                
                {/* Line Item Rows - each field validated */}
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border items-center">
                      {/* Description Field */}
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  data-line-item-description
                                  placeholder="Description"
                                  className="h-8 text-sm focus:ring-ring"
                                  {...field}
                                  ref={(el) => {
                                    field.ref(el);
                                    if (index === 0) {
                                      firstLineItemRef.current = el;
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Category Field */}
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.category`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs focus:ring-ring">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {expenseCategories.map(cat => (
                                    <SelectItem key={cat} value={cat} className="text-xs">
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Quantity Field */}
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-8 text-sm font-mono text-right focus:ring-ring"
                                  min="0"
                                  step="1"
                                  {...field}
                                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Rate Field */}
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-8 text-sm font-mono text-right focus:ring-ring"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Amount Display */}
                      <div className="col-span-1 font-mono text-sm text-right">
                        {formatCurrency(watchedLineItems[index]?.amount || 0)}
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <Button
                            type="button"
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
                    
                    {/* Inline validation errors for line items */}
                    <div className="grid grid-cols-12 gap-2 px-3 pb-2">
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2"></div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.quantity`}
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.rate`}
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Array-level validation error */}
              {form.formState.errors.lineItems?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.lineItems.root.message}
                </p>
              )}
            </div>

            {/* Totals - unchanged business logic */}
            <div className="flex flex-col items-end space-y-1 pt-4 border-t border-border">
              <div className="flex items-center gap-8 text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-mono w-28 text-right">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <span className="text-muted-foreground">Tax (8.25%):</span>
                <span className="font-mono w-28 text-right">{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center gap-8 text-base font-semibold pt-2 border-t border-border">
                <span>Total:</span>
                <span className="font-mono w-28 text-right">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Memo Field - with validation */}
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Memo
                    <kbd className="kbd text-[10px] ml-1.5 opacity-60">M</kbd>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes or reference numbers..."
                      className="resize-none h-16 focus:ring-ring"
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        memoRef.current = el;
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons - all trigger validation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">⌘S</span> Save · 
                <span className="font-mono ml-1">⌘↵</span> Save & Close · 
                <span className="font-mono ml-1">Esc</span> Cancel
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="button" variant="secondary" onClick={handleSave}>
                  Save
                </Button>
                <Button type="button" onClick={handleSaveAndClose}>
                  Save & Close
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
