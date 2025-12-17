import { useState, useEffect, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type FieldType = 'text' | 'textarea' | 'date' | 'number' | 'select';

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string;
  fieldType: FieldType;
  currentValue: string | number;
  onSave: (value: string | number) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  selectOptions?: SelectOption[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  children?: React.ReactNode;
}

export function InlineEditPopover({
  open,
  onOpenChange,
  fieldLabel,
  fieldType,
  currentValue,
  onSave,
  onCancel,
  placeholder,
  selectOptions = [],
  validation,
  children,
}: InlineEditPopoverProps) {
  const [value, setValue] = useState<string | number>(currentValue);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const escUsedToBlurRef = useRef<boolean>(false);

  // Reset value when popover opens or currentValue changes
  useEffect(() => {
    if (open) {
      setValue(currentValue);
      setError('');
      escUsedToBlurRef.current = false;
      // Auto-focus input after a tick
      setTimeout(() => {
        if (fieldType === 'select') {
          // For select, just focus (don't auto-open)
          selectTriggerRef.current?.focus();
        } else {
          inputRef.current?.focus();
          if (fieldType === 'text' || fieldType === 'date') {
            (inputRef.current as HTMLInputElement)?.select();
          }
        }
      }, 50);
    }
  }, [open, currentValue, fieldType]);

  // Validate input
  const validate = useCallback((val: string | number): boolean => {
    if (!validation) return true;

    const strValue = String(val).trim();

    if (validation.required && !strValue) {
      setError(validation.message || 'This field is required');
      return false;
    }

    if (validation.pattern && !validation.pattern.test(strValue)) {
      setError(validation.message || 'Invalid format');
      return false;
    }

    if (validation.min !== undefined && typeof val === 'number' && val < validation.min) {
      setError(validation.message || `Value must be at least ${validation.min}`);
      return false;
    }

    if (validation.max !== undefined && typeof val === 'number' && val > validation.max) {
      setError(validation.message || `Value must be at most ${validation.max}`);
      return false;
    }

    setError('');
    return true;
  }, [validation]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validate(value)) {
      return;
    }

    // Don't save if value hasn't changed
    if (value === currentValue) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      onOpenChange(false);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [value, currentValue, validate, onSave, onOpenChange]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setValue(currentValue);
    setError('');
    onCancel?.();
    onOpenChange(false);
  }, [currentValue, onCancel, onOpenChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isModifier = e.ctrlKey || e.metaKey;

      // Reset ESC blur flag when user types
      if (e.key !== 'Escape' && isTyping) {
        escUsedToBlurRef.current = false;
      }

      // Cmd+S to save
      if (isModifier && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Enter to save (except in textarea)
      if (e.key === 'Enter' && !e.shiftKey && fieldType !== 'textarea') {
        e.preventDefault();
        handleSave();
        return;
      }

      // ESC to cancel (with blur-first behavior for inputs)
      if (e.key === 'Escape') {
        if (isTyping) {
          e.preventDefault();
          target.blur();
          escUsedToBlurRef.current = true;
          setTimeout(() => {
            escUsedToBlurRef.current = false;
          }, 100);
          return;
        }

        if (escUsedToBlurRef.current) {
          e.preventDefault();
          return;
        }

        e.preventDefault();
        handleCancel();
        return;
      }

      // Field-specific shortcuts (when NOT typing in input/textarea)
      // This allows user to quickly refocus the field if they navigated away
      if (!isModifier && !isTyping) {
        const key = e.key.toLowerCase();
        
        // These shortcuts match the field type to help with keyboard navigation
        // C = Customer (select), D = Date, U = dUe date, M = Memo (textarea)
        const shouldFocus = 
          (key === 'c' && fieldType === 'select') ||
          (key === 'd' && fieldType === 'date') ||
          (key === 'u' && fieldType === 'date') ||
          (key === 'm' && fieldType === 'textarea');
        
        if (shouldFocus) {
          e.preventDefault();
          
          if (fieldType === 'select') {
            // For select, just focus (user can press Space/Enter to open)
            selectTriggerRef.current?.focus();
          } else if (inputRef.current) {
            inputRef.current.focus();
            if (fieldType === 'date' || fieldType === 'text') {
              (inputRef.current as HTMLInputElement).select();
            }
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSave, handleCancel, fieldType]);

  // Render appropriate input based on field type
  const renderInput = () => {
    const commonClasses = cn(
      'focus:ring-ring',
      error && 'border-destructive focus:ring-destructive'
    );

    switch (fieldType) {
      case 'textarea':
        return (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={cn(commonClasses, 'resize-none h-24')}
            disabled={isSaving}
          />
        );

      case 'date':
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            className={cn(commonClasses, 'font-mono')}
            disabled={isSaving}
          />
        );

      case 'number':
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={value as number}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            className={cn(commonClasses, 'font-mono text-right')}
            disabled={isSaving}
          />
        );

      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={(val) => setValue(val)}
            disabled={isSaving}
          >
            <SelectTrigger ref={selectTriggerRef} className={commonClasses}>
              <SelectValue placeholder={placeholder}>
                {value && selectOptions.find(opt => opt.value === value)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'text':
      default:
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={commonClasses}
            disabled={isSaving}
          />
        );
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children || <div />}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          // Prevent default Radix escape behavior, we handle it in our keyboard handler
          e.preventDefault();
        }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{fieldLabel}</Label>
            <div className="text-xs text-muted-foreground">
              <kbd className="kbd kbd-xs">⌘S</kbd> save • <kbd className="kbd kbd-xs">Esc</kbd> cancel
            </div>
          </div>

          {/* Input Field */}
          <div className="space-y-2">
            {renderInput()}
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
