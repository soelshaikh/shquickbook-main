import { useCallback, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Invoice, InvoiceLineItem, customers } from '@/data/mockInvoices';
import { Plus, Trash2, Save, Send, X, Copy } from 'lucide-react';
import {
  invoiceFormSchema,
  type InvoiceFormData,
  defaultInvoiceFormValues,
  invoiceFormDataToDomainModel,
  domainModelToInvoiceFormData,
} from '@/schemas';

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
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
});

export function InvoiceForm({ open, onOpenChange, invoice, onSave, onSaveAndClose, onSend, onDuplicate }: InvoiceFormProps) {
  // Detect if this is a duplicate (has data but no id)
  const isDuplicate = invoice && !invoice.id;
  const firstInputRef = useRef<HTMLButtonElement>(null);

  // Initialize React Hook Form with Zod validation
  // Validation UX: validate on submit first, then on change after first attempt
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    mode: 'onSubmit', // Initial validation on submit only
    reValidateMode: 'onChange', // After first submit, validate on change to clear errors immediately
    defaultValues: invoice 
      ? domainModelToInvoiceFormData(invoice)
      : defaultInvoiceFormValues(),
  });

  // Field array for dynamic line items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  // Watch line items and taxRate for total calculations
  const watchedLineItems = form.watch('lineItems');
  const watchedTaxRate = form.watch('taxRate');
  
  // Calculate totals (business logic - unchanged)
  const subtotal = watchedLineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * watchedTaxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // Reset form when invoice prop changes
  useEffect(() => {
    form.reset(
      invoice 
        ? domainModelToInvoiceFormData(invoice)
        : defaultInvoiceFormValues()
    );
  }, [invoice, form]);

  // Set default due date (30 days from invoice date) - unchanged business logic
  const txnDate = form.watch('txnDate');
  const dueDate = form.watch('dueDate');
  useEffect(() => {
    if (txnDate && !dueDate) {
      const date = new Date(txnDate);
      date.setDate(date.getDate() + 30);
      form.setValue('dueDate', date.toISOString().split('T')[0]);
    }
  }, [txnDate, dueDate, form]);

  // Focus first input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Update line item amount when quantity or rate changes
  const updateLineItem = useCallback((index: number, field: 'description' | 'quantity' | 'rate', value: string | number) => {
    const currentItem = form.getValues(`lineItems.${index}`);
    
    if (field === 'quantity' || field === 'rate') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      const quantity = field === 'quantity' ? numValue : currentItem.quantity;
      const rate = field === 'rate' ? numValue : currentItem.rate;
      const amount = Math.round(quantity * rate * 100) / 100;
      
      form.setValue(`lineItems.${index}.${field}`, numValue);
      form.setValue(`lineItems.${index}.amount`, amount);
    } else if (field === 'description') {
      form.setValue(`lineItems.${index}.description`, value as string);
    }
  }, [form]);

  const addLineItem = useCallback(() => {
    append(defaultLineItem());
  }, [append]);

  const removeLineItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Convert form data to Invoice domain model
  const getFormData = (formData: InvoiceFormData): Partial<Invoice> => {
    const customer = customers.find(c => c.id === formData.customerId);
    return invoiceFormDataToDomainModel(
      formData,
      customer?.name || '',
      invoice?.id ? {
        id: invoice.id,
        docNumber: invoice.docNumber,
        companyId: invoice.companyId,
        createdAt: invoice.createdAt,
      } : undefined
    );
  };

  // Submit handlers - all trigger validation
  const handleSave = useCallback(() => {
    form.handleSubmit((data) => {
      onSave(getFormData(data));
    })();
  }, [form, onSave, subtotal, taxAmount, total]);

  const handleSaveAndClose = useCallback(() => {
    form.handleSubmit((data) => {
      onSaveAndClose(getFormData(data));
    })();
  }, [form, onSaveAndClose, subtotal, taxAmount, total]);

  const handleSend = useCallback(() => {
    form.handleSubmit((data) => {
      onSend(getFormData(data));
    })();
  }, [form, onSend, subtotal, taxAmount, total]);

  // Keyboard shortcuts - unchanged functionality
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [open, handleSave, handleSaveAndClose, handleSend, onOpenChange]);

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
            {/* Customer & Dates Section */}
            <div className="grid grid-cols-3 gap-4">
              {/* Customer Field - with validation */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger ref={firstInputRef} className="focus:ring-ring">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Invoice Date Field - with validation */}
              <FormField
                control={form.control}
                name="txnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="focus:ring-ring"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Due Date Field - with validation */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="focus:ring-ring"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items Section - with validation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Line Items</FormLabel>
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
              
              {/* Line Item Rows - each field validated */}
              <div className="space-y-2">
                {fields.map((item, index) => (
                  <div key={item.id} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-start">
                      {/* Description Field */}
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Description"
                                  className="h-8 text-sm focus:ring-ring"
                                  {...field}
                                />
                              </FormControl>
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
                                  className="h-8 text-sm text-right font-mono-nums focus:ring-ring"
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
                                  className="h-8 text-sm text-right font-mono-nums focus:ring-ring"
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
                      <div className="col-span-2 text-right pt-1">
                        <span className="text-sm font-mono-nums">{formatCurrency(watchedLineItems[index]?.amount || 0)}</span>
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1 flex justify-center pt-1">
                        {fields.length > 1 && (
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
                    
                    {/* Inline validation errors for line items */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
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
              
              {/* Array-level validation error (e.g., "At least one line item required") */}
              {form.formState.errors.lineItems?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.lineItems.root.message}
                </p>
              )}
            </div>

            {/* Totals Section - unchanged business logic */}
            <div className="border-t border-border pt-4">
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-8 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono-nums w-24 text-right">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <span className="text-muted-foreground">Tax ({(watchedTaxRate * 100).toFixed(2)}%)</span>
                  <span className="font-mono-nums w-24 text-right">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex items-center gap-8 text-base font-semibold">
                  <span>Total</span>
                  <span className="font-mono-nums w-24 text-right">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Memo Field - with validation */}
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes for this invoice..."
                      className="resize-none h-20 focus:ring-ring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons - all trigger validation */}
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
              
              {/* Save Button - triggers validation */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save
                <kbd className="kbd ml-1">⌘S</kbd>
              </Button>
              
              {/* Save & Close Button - triggers validation */}
              <Button
                type="button"
                onClick={handleSaveAndClose}
                className="gap-2"
              >
                Save & Close
                <kbd className="kbd ml-1">⌘↵</kbd>
              </Button>
              
              {/* Send Button - triggers validation */}
              <Button
                type="button"
                variant="default"
                onClick={handleSend}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                Send
                <kbd className="kbd ml-1">⇧⌘↵</kbd>
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
