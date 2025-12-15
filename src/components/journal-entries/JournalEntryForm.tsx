import { useEffect, useCallback, forwardRef, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { JournalEntry, mockAccounts } from '@/data/mockJournalEntries';
import { Plus, Trash2, AlertCircle, Copy } from 'lucide-react';
import {
  journalEntryFormSchema,
  type JournalEntryFormData,
  defaultJournalEntryFormValues,
  journalEntryFormDataToDomainModel,
  domainModelToJournalEntryFormData,
  calculateBalancingAmount,
} from '@/schemas';

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  onSave: (data: Partial<JournalEntry>) => void;
  onSaveAndClose: (data: Partial<JournalEntry>) => void;
  onDuplicate?: (data: Partial<JournalEntry>) => void;
}

export const JournalEntryForm = forwardRef<HTMLDivElement, JournalEntryFormProps>(
  function JournalEntryForm({ open, onOpenChange, entry, onSave, onSaveAndClose, onDuplicate }, ref) {
  // Detect if this is a duplicate (has data but no id)
  const isDuplicate = entry && !entry.id;
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Initialize React Hook Form with Zod validation
  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntryFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: entry 
      ? domainModelToJournalEntryFormData(entry)
      : defaultJournalEntryFormValues(),
  });

  // Field array for dynamic lines
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  // Watch lines for balance calculations
  const watchedLines = form.watch('lines');

  // Calculate totals (unchanged business logic)
  const totalDebit = watchedLines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = watchedLines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const balance = calculateBalancingAmount(watchedLines);

  // Reset form when entry prop changes
  useEffect(() => {
    form.reset(
      entry 
        ? domainModelToJournalEntryFormData(entry)
        : defaultJournalEntryFormValues()
    );
  }, [entry, form]);

  // Focus first input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open]);

  const addLine = useCallback(() => {
    append({
      id: crypto.randomUUID(),
      accountId: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0,
    });
  }, [append]);

  const removeLine = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const updateLineAccount = useCallback((index: number, accountId: string) => {
    const account = mockAccounts.find(a => a.id === accountId);
    form.setValue(`lines.${index}.accountId`, accountId);
    form.setValue(`lines.${index}.accountName`, account?.name || '');
  }, [form]);

  // Convert form data to JournalEntry domain model
  const getFormData = (formData: JournalEntryFormData): Partial<JournalEntry> => {
    return journalEntryFormDataToDomainModel(
      formData,
      entry?.id ? {
        id: entry.id,
        docNumber: entry.docNumber,
        companyId: entry.companyId,
        createdAt: entry.createdAt,
      } : undefined
    );
  };

  // Submit handlers - all trigger validation
  const handleSave = useCallback(() => {
    form.handleSubmit((data) => {
      onSave(getFormData(data));
    })();
  }, [form, onSave, entry]);

  const handleSaveAndClose = useCallback(() => {
    form.handleSubmit((data) => {
      onSaveAndClose(getFormData(data));
    })();
  }, [form, onSaveAndClose, entry]);

  // Keyboard shortcuts - unchanged functionality
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      
      if (isModifier && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        if (balance.isBalanced) {
          handleSaveAndClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleSave, handleSaveAndClose, onOpenChange, balance.isBalanced]);

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
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Header Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* Transaction Date Field - with validation */}
              <FormField
                control={form.control}
                name="txnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        ref={firstInputRef}
                        type="date"
                        className="focus:ring-ring"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Entry #</FormLabel>
                <Input
                  value={entry?.docNumber || 'Auto-generated'}
                  disabled
                  className="bg-muted"
                />
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
                      placeholder="Enter a description..."
                      className="resize-none h-16 focus:ring-ring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items Section - with validation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Line Items</FormLabel>
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

                {/* Line Item Rows - each field validated */}
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 items-center">
                      {/* Account Field */}
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.accountId`}
                          render={({ field }) => (
                            <FormItem>
                              <Select 
                                onValueChange={(value) => updateLineAccount(index, value)}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs focus:ring-ring">
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {mockAccounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Description Field */}
                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Description"
                                  className="h-8 text-xs focus:ring-ring"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Debit Field */}
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.debit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="h-8 text-xs text-right font-mono-nums focus:ring-ring"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Credit Field */}
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.credit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="h-8 text-xs text-right font-mono-nums focus:ring-ring"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          disabled={fields.length <= 2}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Inline validation errors for line items */}
                    <div className="grid grid-cols-12 gap-2 px-2 pb-2">
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.accountId`}
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
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
                          name={`lines.${index}.debit`}
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
                          name={`lines.${index}.credit`}
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

                {/* Totals */}
                <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 text-sm font-medium">
                  <div className="col-span-7 text-right">Totals:</div>
                  <div className="col-span-2 text-right font-mono-nums">{formatCurrency(totalDebit)}</div>
                  <div className="col-span-2 text-right font-mono-nums">{formatCurrency(totalCredit)}</div>
                  <div className="col-span-1"></div>
                </div>
              </div>

              {/* Array-level validation error */}
              {form.formState.errors.lines?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.lines.root.message}
                </p>
              )}

              {/* Balance Warning */}
              {!balance.isBalanced && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Entry is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
                </div>
              )}

              {/* Balance Helper Info */}
              {!balance.isBalanced && (
                <div className="text-xs text-muted-foreground">
                  {balance.needsDebit && (
                    <span>Add {formatCurrency(balance.amount)} to Debit to balance</span>
                  )}
                  {balance.needsCredit && (
                    <span>Add {formatCurrency(balance.amount)} to Credit to balance</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - all trigger validation */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
                <kbd className="kbd ml-2 text-[10px]">Esc</kbd>
              </Button>
              <Button 
                type="button"
                variant="secondary" 
                onClick={handleSave}
              >
                Save
                <kbd className="kbd ml-2 text-[10px]">⌘S</kbd>
              </Button>
              <Button 
                type="button"
                onClick={handleSaveAndClose} 
                disabled={!balance.isBalanced}
              >
                Save & Close
                <kbd className="kbd ml-2 text-[10px]">⌘↵</kbd>
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
});

JournalEntryForm.displayName = 'JournalEntryForm';
