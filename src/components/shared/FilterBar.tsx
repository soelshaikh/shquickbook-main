import { useState, useRef, useEffect, KeyboardEvent, useCallback, forwardRef } from 'react';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  type: string;
  value: string;
  label: string;
}

export interface FilterConfig {
  type: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterChip[];
  onFiltersChange: (filters: FilterChip[]) => void;
  filterConfigs: FilterConfig[];
  placeholder?: string;
  onClose?: () => void;
  className?: string;
}

export const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar({
  filters,
  onFiltersChange,
  filterConfigs,
  placeholder = 'Type to filter... (Tab to lock)',
  onClose,
  className,
}, ref) {
  const [inputValue, setInputValue] = useState('');
  const [lockedType, setLockedType] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ type: 'type' | 'value'; items: { value: string; label: string }[] }>({ type: 'type', items: [] });
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update suggestions based on input and locked type
  useEffect(() => {
    if (lockedType) {
      // Show value suggestions for locked type
      const config = filterConfigs.find(c => c.type === lockedType);
      if (config) {
        const filtered = config.options.filter(opt =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
        );
        setSuggestions({ type: 'value', items: filtered });
      }
    } else if (inputValue) {
      // Show type suggestions
      const filtered = filterConfigs.filter(c =>
        c.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        c.type.toLowerCase().includes(inputValue.toLowerCase())
      ).map(c => ({ value: c.type, label: c.label }));
      setSuggestions({ type: 'type', items: filtered });
    } else {
      // Show all types when empty
      setSuggestions({
        type: 'type',
        items: filterConfigs.map(c => ({ value: c.type, label: c.label }))
      });
    }
    setSelectedSuggestion(0);
  }, [inputValue, lockedType, filterConfigs]);

  const lockType = useCallback((type: string) => {
    setLockedType(type);
    setInputValue('');
    inputRef.current?.focus();
  }, []);

  const addFilter = useCallback((type: string, value: string, label: string) => {
    const typeConfig = filterConfigs.find(c => c.type === type);
    const newChip: FilterChip = {
      id: `${type}-${value}-${Date.now()}`,
      type,
      value,
      label: `${typeConfig?.label || type}: ${label}`,
    };
    onFiltersChange([...filters, newChip]);
    setLockedType(null);
    setInputValue('');
    inputRef.current?.focus();
  }, [filters, onFiltersChange, filterConfigs]);

  const removeFilter = useCallback((id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id));
    inputRef.current?.focus();
  }, [filters, onFiltersChange]);

  const removeLastFilter = useCallback(() => {
    if (lockedType) {
      setLockedType(null);
    } else if (filters.length > 0) {
      onFiltersChange(filters.slice(0, -1));
    }
  }, [lockedType, filters, onFiltersChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (!lockedType && suggestions.items.length > 0) {
          const selected = suggestions.items[selectedSuggestion];
          lockType(selected.value);
        } else if (lockedType && suggestions.items.length > 0) {
          const selected = suggestions.items[selectedSuggestion];
          addFilter(lockedType, selected.value, selected.label);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (suggestions.items.length > 0) {
          const selected = suggestions.items[selectedSuggestion];
          if (!lockedType) {
            lockType(selected.value);
          } else {
            addFilter(lockedType, selected.value, selected.label);
          }
        }
        break;

      case 'Backspace':
        if (inputValue === '') {
          e.preventDefault();
          removeLastFilter();
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (lockedType) {
          setLockedType(null);
        } else if (inputValue) {
          setInputValue('');
        } else {
          onClose?.();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev < suggestions.items.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : 0);
        break;
    }
  };

  return (
    <div className={cn('bg-card border-b border-border', className)}>
      <div className="h-12 px-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        
        {/* Filter Chips */}
        {filters.map(chip => (
          <Badge
            key={chip.id}
            variant="secondary"
            className="gap-1 pr-1 shrink-0"
          >
            {chip.label}
            <button
              onClick={() => removeFilter(chip.id)}
              className="ml-0.5 hover:bg-muted rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Locked Type Chip */}
        {lockedType && (
          <Badge variant="outline" className="bg-primary/10 border-primary/30 shrink-0">
            {filterConfigs.find(c => c.type === lockedType)?.label}:
          </Badge>
        )}

        {/* Input */}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={lockedType ? 'Select a value...' : placeholder}
          className="flex-1 h-8 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
        />

        {/* Keyboard hints */}
        <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-2">
          <span><kbd className="kbd text-[10px]">Tab</kbd> lock</span>
          <span><kbd className="kbd text-[10px]">⌫</kbd> rewind</span>
          <span><kbd className="kbd text-[10px]">Esc</kbd> close</span>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {suggestions.items.length > 0 && (
        <div className="border-t border-border/50 bg-card max-h-48 overflow-y-auto">
          {suggestions.items.map((item, idx) => (
            <button
              key={item.value}
              onClick={() => {
                if (!lockedType) {
                  lockType(item.value);
                } else {
                  addFilter(lockedType, item.value, item.label);
                }
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50',
                idx === selectedSuggestion && 'bg-muted'
              )}
            >
               {/* {!lockedType && (
                <span className="text-muted-foreground text-xs font-mono w-16">{item.value}:</span>
              )} */}
              <span>{item.label}</span>
              {idx === selectedSuggestion && (
                <span className="ml-auto text-xs text-muted-foreground">
                  <kbd className="kbd text-[10px]">Tab</kbd> or <kbd className="kbd text-[10px]">Enter</kbd>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// Hook for filter bar state management
export function useFilterBar(initialFilters: FilterChip[] = []) {
  const [filters, setFilters] = useState<FilterChip[]>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const clearFilters = useCallback(() => setFilters([]), []);

  return {
    filters,
    setFilters,
    isOpen,
    open,
    close,
    toggle,
    clearFilters,
  };
}
