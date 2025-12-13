import { ReactNode, RefObject } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PageToolbarProps {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
  filters?: ReactNode;
  actions?: ReactNode;
  hideSearch?: boolean;
}

export function PageToolbar({
  title,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  searchInputRef,
  filters,
  actions,
  hideSearch = false,
}: PageToolbarProps) {
  return (
    <div className="h-12 px-4 flex items-center gap-3 border-b border-border bg-card">
      <h1 className="text-sm font-semibold">{title}</h1>
      
      <div className="flex-1" />
      
      {/* Search - can be hidden when FilterBar is open */}
      {!hideSearch && (
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}

      {/* Filters slot */}
      {filters}

      {/* Actions slot */}
      {actions}
    </div>
  );
}