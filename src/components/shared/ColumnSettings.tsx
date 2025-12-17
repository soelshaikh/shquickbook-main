import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Columns, RotateCcw } from 'lucide-react';
import { ColumnConfig } from '@/types/columnConfig';
import { useState, useEffect } from 'react';

interface ColumnSettingsProps {
  columns: ColumnConfig[];
  onToggleColumn: (columnKey: string) => void;
  onReset: () => void;
  variant?: 'toolbar' | 'header';
}

export function ColumnSettings({ columns, onToggleColumn, onReset, variant = 'toolbar' }: ColumnSettingsProps) {
  const [open, setOpen] = useState(false);

  const visibleCount = columns.filter(c => c.visible).length;
  const totalCount = columns.length;
  
  // Global keyboard shortcut: Ctrl+Shift+C (or Cmd+Shift+C on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'toolbar' ? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Columns className="h-4 w-4" />
            Columns
            <span className="text-xs text-muted-foreground ml-1">
              ({visibleCount}/{totalCount})
            </span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 gap-1">
            <Columns className="h-3.5 w-3.5" />
            <span className="text-xs">Columns ({visibleCount}/{totalCount})</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Customize Columns</h4>
              <p className="text-xs text-muted-foreground">
                Show or hide columns in the list
              </p>
            </div>
          </div>

          {/* Column List */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${column.key}`}
                  checked={column.visible}
                  onCheckedChange={() => onToggleColumn(column.key)}
                  disabled={column.required}
                />
                <Label
                  htmlFor={`column-${column.key}`}
                  className={`flex-1 text-sm cursor-pointer ${
                    column.required ? 'opacity-60' : ''
                  }`}
                >
                  {column.label}
                  {column.required && (
                    <span className="text-xs text-muted-foreground ml-1.5">(required)</span>
                  )}
                </Label>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-1.5 h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Default
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8"
            >
              Done
            </Button>
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Shortcut: <kbd className="kbd kbd-xs">Ctrl+Shift+C</kbd>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
