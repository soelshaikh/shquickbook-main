/**
 * AdvancedFilter Component
 * 
 * A reusable, keyboard-first filter builder for entity lists.
 * 
 * Features:
 * - Progressive disclosure: Field → Operator → Value
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Accessible (ARIA labels, focus management)
 * - Entity-agnostic (configured via FilterConfig)
 * - Emits normalized filter objects only (no data filtering)
 * 
 * Usage:
 *   <AdvancedFilter
 *     filters={filters}
 *     config={TRANSACTION_FILTER_CONFIG}
 *     onChange={setFilters}
 *   />
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Filter, FilterField, FilterOperator, AdvancedFilterProps } from '@/types/filter';
import { Filter as FilterIcon, X, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Operator display labels
 */
const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'equals',
  notEquals: 'does not equal',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  endsWith: 'ends with',
  greaterThan: 'greater than',
  greaterThanOrEqual: 'greater than or equal to',
  lessThan: 'less than',
  lessThanOrEqual: 'less than or equal to',
  between: 'between',
  in: 'is one of',
  notIn: 'is not one of',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
};

/**
 * Filter builder state machine steps
 */
type FilterBuilderStep = 'field' | 'operator' | 'value';

/**
 * Partial filter during construction
 */
interface PartialFilter {
  field?: string;
  operator?: FilterOperator;
  value?: Filter['value'];
}

export function AdvancedFilter({
  filters,
  config,
  onChange,
  triggerLabel = 'Add Filter',
  shortcutHint,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<FilterBuilderStep>('field');
  const [partialFilter, setPartialFilter] = useState<PartialFilter>({});
  const [selectedFieldConfig, setSelectedFieldConfig] = useState<FilterField | null>(null);

  /**
   * Reset builder state
   */
  const resetBuilder = () => {
    setStep('field');
    setPartialFilter({});
    setSelectedFieldConfig(null);
  };

  /**
   * Handle field selection
   */
  const handleFieldSelect = (fieldKey: string) => {
    const fieldConfig = config.fields.find((f) => f.key === fieldKey);
    if (!fieldConfig) return;

    setSelectedFieldConfig(fieldConfig);
    setPartialFilter({ field: fieldKey });
    setStep('operator');
  };

  /**
   * Handle operator selection
   */
  const handleOperatorSelect = (operator: FilterOperator) => {
    setPartialFilter((prev) => ({ ...prev, operator }));
    
    // Skip value step for operators that don't need a value
    if (operator === 'isEmpty' || operator === 'isNotEmpty') {
      completeFilter({ ...partialFilter, operator });
    } else {
      setStep('value');
    }
  };

  /**
   * Handle value input
   */
  const handleValueInput = (value: Filter['value']) => {
    setPartialFilter((prev) => ({ ...prev, value }));
  };

  /**
   * Complete and add filter
   */
  const completeFilter = (filter?: PartialFilter) => {
    const finalFilter = filter || partialFilter;
    
    if (!finalFilter.field || !finalFilter.operator) return;

    const newFilter: Filter = {
      field: finalFilter.field,
      operator: finalFilter.operator,
      value: finalFilter.value || '',
    };

    onChange([...filters, newFilter]);
    resetBuilder();
    setIsOpen(false);
  };

  /**
   * Remove a filter
   */
  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    onChange([]);
  };

  /**
   * Get field label from key
   */
  const getFieldLabel = (fieldKey: string): string => {
    return config.fields.find((f) => f.key === fieldKey)?.label || fieldKey;
  };

  /**
   * Format filter for display
   */
  const formatFilter = (filter: Filter): string => {
    const fieldLabel = getFieldLabel(filter.field);
    const operatorLabel = OPERATOR_LABELS[filter.operator];
    
    let valueStr = '';
    if (filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty') {
      if (Array.isArray(filter.value)) {
        if (filter.value[0] instanceof Date) {
          valueStr = ` ${format(filter.value[0] as Date, 'MMM d, yyyy')} - ${format(filter.value[1] as Date, 'MMM d, yyyy')}`;
        } else {
          valueStr = ` ${filter.value.join(', ')}`;
        }
      } else if (filter.value instanceof Date) {
        valueStr = ` ${format(filter.value, 'MMM d, yyyy')}`;
      } else {
        valueStr = ` ${filter.value}`;
      }
    }

    return `${fieldLabel} ${operatorLabel}${valueStr}`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Active Filters */}
      {filters.length > 0 && (
        <>
          {filters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1">
              <span className="text-xs">{formatFilter(filter)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter(index)}
                aria-label={`Remove filter: ${formatFilter(filter)}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        </>
      )}

      {/* Add Filter Popover */}
      <Popover open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetBuilder();
      }}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <Plus className="h-3 w-3" />
            {triggerLabel}
            {shortcutHint && (
              <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {shortcutHint}
              </kbd>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <FilterBuilder
            step={step}
            partialFilter={partialFilter}
            fieldConfig={selectedFieldConfig}
            config={config}
            onFieldSelect={handleFieldSelect}
            onOperatorSelect={handleOperatorSelect}
            onValueInput={handleValueInput}
            onComplete={(value) => {
              // Complete filter with the provided value
              if (value !== undefined) {
                completeFilter({ ...partialFilter, value });
              } else {
                completeFilter(partialFilter);
              }
            }}
            onCancel={() => {
              resetBuilder();
              setIsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Filter Builder Internal Component
 * Manages the progressive step flow
 */
interface FilterBuilderProps {
  step: FilterBuilderStep;
  partialFilter: PartialFilter;
  fieldConfig: FilterField | null;
  config: FilterConfig;
  onFieldSelect: (field: string) => void;
  onOperatorSelect: (operator: FilterOperator) => void;
  onValueInput: (value: Filter['value']) => void;
  onComplete: () => void;
  onCancel: () => void;
}

function FilterBuilder({
  step,
  partialFilter,
  fieldConfig,
  config,
  onFieldSelect,
  onOperatorSelect,
  onValueInput,
  onComplete,
  onCancel,
}: FilterBuilderProps) {
  return (
    <div className="space-y-2 p-2">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
        <span className={step === 'field' ? 'text-foreground font-medium' : ''}>
          1. Field
        </span>
        <span>→</span>
        <span className={step === 'operator' ? 'text-foreground font-medium' : ''}>
          2. Operator
        </span>
        <span>→</span>
        <span className={step === 'value' ? 'text-foreground font-medium' : ''}>
          3. Value
        </span>
      </div>

      {/* Step Content */}
      {step === 'field' && (
        <FieldSelector fields={config.fields} onSelect={onFieldSelect} />
      )}

      {step === 'operator' && fieldConfig && (
        <OperatorSelector
          operators={fieldConfig.operators}
          onSelect={onOperatorSelect}
          onBack={onCancel}
        />
      )}

      {step === 'value' && fieldConfig && partialFilter.operator && (
        <ValueInput
          fieldConfig={fieldConfig}
          operator={partialFilter.operator}
          value={partialFilter.value}
          onInput={onValueInput}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

/**
 * Field Selector Step
 */
interface FieldSelectorProps {
  fields: FilterField[];
  onSelect: (field: string) => void;
}

function FieldSelector({ fields, onSelect }: FieldSelectorProps) {
  return (
    <Command>
      <CommandInput placeholder="Search fields..." />
      <CommandList>
        <CommandEmpty>No fields found.</CommandEmpty>
        <CommandGroup>
          {fields.map((field) => (
            <CommandItem
              key={field.key}
              onSelect={() => onSelect(field.key)}
              className="cursor-pointer"
            >
              <span>{field.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {field.type}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/**
 * Operator Selector Step
 */
interface OperatorSelectorProps {
  operators: FilterOperator[];
  onSelect: (operator: FilterOperator) => void;
  onBack: () => void;
}

function OperatorSelector({ operators, onSelect, onBack }: OperatorSelectorProps) {
  return (
    <Command>
      <CommandList>
        <CommandGroup>
          {operators.map((operator) => (
            <CommandItem
              key={operator}
              onSelect={() => onSelect(operator)}
              className="cursor-pointer"
            >
              {OPERATOR_LABELS[operator]}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/**
 * Value Input Step
 */
interface ValueInputProps {
  fieldConfig: FilterField;
  operator: FilterOperator;
  value?: Filter['value'];
  onInput: (value: Filter['value']) => void;
  onComplete: (value?: Filter['value']) => void;
  onCancel: () => void;
}

function ValueInput({
  fieldConfig,
  operator,
  value,
  onInput,
  onComplete,
  onCancel,
}: ValueInputProps) {
  const [inputValue, setInputValue] = useState<string>(
    typeof value === 'string' || typeof value === 'number' ? String(value) : ''
  );
  const [dateValue, setDateValue] = useState<Date | undefined>(
    value instanceof Date ? value : undefined
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: Array.isArray(value) && value[0] instanceof Date ? value[0] : undefined,
    to: Array.isArray(value) && value[1] instanceof Date ? value[1] : undefined,
  });
  const [selectValue, setSelectValue] = useState<string>(
    typeof value === 'string' ? value : ''
  );

  const handleSubmit = () => {
    let finalValue: Filter['value'];

    if (fieldConfig.type === 'date') {
      if (operator === 'between') {
        if (!dateRange.from || !dateRange.to) return;
        finalValue = [dateRange.from, dateRange.to];
      } else {
        if (!dateValue) return;
        finalValue = dateValue;
      }
    } else if (fieldConfig.type === 'number') {
      finalValue = parseFloat(inputValue);
      if (isNaN(finalValue)) return;
    } else if (fieldConfig.type === 'select') {
      finalValue = selectValue;
      if (!finalValue) return;
    } else {
      finalValue = inputValue;
      if (!finalValue.trim()) return;
    }

    // Update state with the value
    onInput(finalValue);
    // Pass the value directly to onComplete so it doesn't have to wait for state update
    onComplete(finalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input based on field type */}
      {fieldConfig.type === 'text' && (
        <Input
          placeholder={fieldConfig.placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      )}

      {fieldConfig.type === 'number' && (
        <Input
          type="number"
          placeholder={fieldConfig.placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      )}

      {fieldConfig.type === 'date' && operator !== 'between' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateValue && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => {
                setDateValue(date);
                if (date) {
                  onInput(date);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      {fieldConfig.type === 'date' && operator === 'between' && (
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, 'PPP') : 'Start date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.to && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, 'PPP') : 'End date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {fieldConfig.type === 'select' && fieldConfig.options && (
        <Select value={selectValue} onValueChange={setSelectValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {fieldConfig.options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit}>
          Add Filter
        </Button>
      </div>
    </div>
  );
}
