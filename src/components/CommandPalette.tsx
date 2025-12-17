import { useCallback, useState, useEffect, forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { useUndo } from '@/contexts/UndoContext';
import {
  ArrowRightLeft,
  FileText,
  Receipt,
  BookOpen,
  Settings,
  Link,
  Sun,
  Moon,
  Clock,
  Search,
  Plus,
  Undo2,
  Redo2,
  Copy,
  Download,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentQueries: string[];
  onQueryExecuted: (query: string) => void;
}

interface CommandItemType {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings';
  shortcut?: string;
  disabled?: boolean;
  hidden?: boolean;
}

export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(
  ({ open, onOpenChange, recentQueries, onQueryExecuted }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeContext();
  const { triggerAction } = useKeyboard();
  const { canUndo, canRedo, undo, redo, lastAction } = useUndo();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch('');
      setActiveFilter(null);
    }
  }, [open]);

  const runCommand = useCallback((callback: () => void, query?: string) => {
    onOpenChange(false);
    if (query) {
      onQueryExecuted(query);
    }
    callback();
  }, [onOpenChange, onQueryExecuted]);

  const commands: CommandItemType[] = [
    // Navigation
    {
      id: 'nav-transactions',
      label: 'Go to Transactions',
      keywords: ['transactions', 'txn', 'list', 'navigate'],
      icon: <ArrowRightLeft className="h-4 w-4" />,
      action: () => navigate('/transactions'),
      category: 'navigation',
    },
    {
      id: 'nav-invoices',
      label: 'Go to Invoices',
      keywords: ['invoices', 'inv', 'sales', 'navigate'],
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate('/invoices'),
      category: 'navigation',
    },
    {
      id: 'nav-bills',
      label: 'Go to Bills',
      keywords: ['bills', 'expenses', 'payables', 'navigate'],
      icon: <Receipt className="h-4 w-4" />,
      action: () => navigate('/bills'),
      category: 'navigation',
    },
    {
      id: 'nav-journal',
      label: 'Go to Journal Entries',
      keywords: ['journal', 'entries', 'je', 'adjustments', 'navigate'],
      icon: <BookOpen className="h-4 w-4" />,
      action: () => navigate('/journal-entries'),
      category: 'navigation',
    },
    {
      id: 'nav-customer-payments',
      label: 'Go to Customer Payments',
      keywords: ['customer', 'payments', 'receivables', 'money', 'received', 'navigate'],
      icon: <Receipt className="h-4 w-4" />,
      action: () => navigate('/customer-payments'),
      category: 'navigation',
      shortcut: 'P',
    },
    {
      id: 'nav-vendor-payments',
      label: 'Go to Vendor Payments',
      keywords: ['vendor', 'payments', 'payables', 'money', 'paid', 'navigate'],
      icon: <Receipt className="h-4 w-4" />,
      action: () => navigate('/vendor-payments'),
      category: 'navigation',
      shortcut: 'V',
    },
    {
      id: 'nav-credit-memos',
      label: 'Go to Credit Memos',
      keywords: ['credit', 'memos', 'refunds', 'returns', 'credits', 'navigate'],
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate('/credit-memos'),
      category: 'navigation',
      shortcut: 'C',
    },
    {
      id: 'nav-deposits',
      label: 'Go to Deposits',
      keywords: ['deposits', 'bank', 'deposit', 'money', 'navigate'],
      icon: <ArrowRightLeft className="h-4 w-4" />,
      action: () => navigate('/deposits'),
      category: 'navigation',
      shortcut: 'D',
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      keywords: ['settings', 'preferences', 'config', 'navigate'],
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/settings'),
      category: 'navigation',
      shortcut: '⌘,',
    },
    {
      id: 'nav-connect',
      label: 'Connect QuickBooks',
      keywords: ['connect', 'quickbooks', 'qbo', 'link', 'oauth'],
      icon: <Link className="h-4 w-4" />,
      action: () => navigate('/connect'),
      category: 'navigation',
    },
    // Actions - New entities
    {
      id: 'action-new-invoice',
      label: 'New Invoice',
      keywords: ['new', 'create', 'invoice', 'add'],
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        navigate('/invoices');
        setTimeout(() => triggerAction('new-invoice'), 100);
      },
      category: 'actions',
      shortcut: 'I',
    },
    {
      id: 'action-new-bill',
      label: 'New Bill',
      keywords: ['new', 'create', 'bill', 'add', 'expense'],
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        navigate('/bills');
        setTimeout(() => triggerAction('new-bill'), 100);
      },
      category: 'actions',
      shortcut: 'B',
    },
    {
      id: 'action-new-journal',
      label: 'New Journal Entry',
      keywords: ['new', 'create', 'journal', 'entry', 'add', 'je'],
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        navigate('/journal-entries');
        setTimeout(() => triggerAction('new-journal-entry'), 100);
      },
      category: 'actions',
      shortcut: 'J',
    },
    // Duplicate commands (context-aware)
    {
      id: 'action-duplicate-invoice',
      label: 'Duplicate Invoice',
      keywords: ['duplicate', 'copy', 'clone', 'invoice'],
      icon: <Copy className="h-4 w-4" />,
      action: () => triggerAction('duplicate-invoice'),
      category: 'actions',
      shortcut: '⌃⇧D',
      hidden: !location.pathname.startsWith('/invoices'),
    },
    {
      id: 'action-duplicate-bill',
      label: 'Duplicate Bill',
      keywords: ['duplicate', 'copy', 'clone', 'bill'],
      icon: <Copy className="h-4 w-4" />,
      action: () => triggerAction('duplicate-bill'),
      category: 'actions',
      shortcut: '⌃⇧D',
      hidden: !location.pathname.startsWith('/bills'),
    },
    {
      id: 'action-duplicate-journal',
      label: 'Duplicate Journal Entry',
      keywords: ['duplicate', 'copy', 'clone', 'journal', 'entry'],
      icon: <Copy className="h-4 w-4" />,
      action: () => triggerAction('duplicate-journal-entry'),
      category: 'actions',
      shortcut: '⌃⇧D',
      hidden: !location.pathname.startsWith('/journal-entries'),
    },
    // Export commands (context-aware)
    {
      id: 'action-export-transactions',
      label: 'Export Transactions',
      keywords: ['export', 'csv', 'download', 'transactions'],
      icon: <Download className="h-4 w-4" />,
      action: () => triggerAction('export-current-view'),
      category: 'actions',
      shortcut: '⌃⇧E',
      hidden: !location.pathname.startsWith('/transactions'),
    },
    {
      id: 'action-export-invoices',
      label: 'Export Invoices',
      keywords: ['export', 'csv', 'download', 'invoices'],
      icon: <Download className="h-4 w-4" />,
      action: () => triggerAction('export-current-view'),
      category: 'actions',
      shortcut: '⌃⇧E',
      hidden: !location.pathname.startsWith('/invoices'),
    },
    {
      id: 'action-export-bills',
      label: 'Export Bills',
      keywords: ['export', 'csv', 'download', 'bills'],
      icon: <Download className="h-4 w-4" />,
      action: () => triggerAction('export-current-view'),
      category: 'actions',
      shortcut: '⌃⇧E',
      hidden: !location.pathname.startsWith('/bills'),
    },
    {
      id: 'action-export-journal',
      label: 'Export Journal Entries',
      keywords: ['export', 'csv', 'download', 'journal', 'entries'],
      icon: <Download className="h-4 w-4" />,
      action: () => triggerAction('export-current-view'),
      category: 'actions',
      shortcut: '⌃⇧E',
      hidden: !location.pathname.startsWith('/journal-entries'),
    },
    // Undo/Redo
    {
      id: 'action-undo',
      label: `Undo${lastAction ? `: ${lastAction.description}` : ''}`,
      keywords: ['undo', 'revert', 'back'],
      icon: <Undo2 className="h-4 w-4" />,
      action: () => undo(),
      category: 'actions',
      shortcut: '⌘Z',
      disabled: !canUndo,
    },
    {
      id: 'action-redo',
      label: 'Redo',
      keywords: ['redo', 'forward'],
      icon: <Redo2 className="h-4 w-4" />,
      action: () => redo(),
      category: 'actions',
      shortcut: '⌘Y',
      disabled: !canRedo,
    },
    // Settings
    {
      id: 'settings-theme',
      label: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance', 'toggle'],
      icon: theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
      action: toggleTheme,
      category: 'settings',
      shortcut: '⌘L',
    },
  ];

  // Filter commands based on search, active filter, and hidden state
  const filteredCommands = commands.filter(cmd => {
    if (cmd.disabled) return false;
    if (cmd.hidden) return false;
    if (activeFilter && cmd.category !== activeFilter) return false;
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords.some(kw => kw.includes(searchLower))
    );
  });

  const navigationCommands = filteredCommands.filter(c => c.category === 'navigation');
  const actionCommands = filteredCommands.filter(c => c.category === 'actions');
  const settingsCommands = filteredCommands.filter(c => c.category === 'settings');

  // Handle Tab key to lock filter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && search) {
      e.preventDefault();
      const filterMap: Record<string, string> = {
        'nav': 'navigation',
        'go': 'navigation',
        'new': 'actions',
        'create': 'actions',
        'set': 'settings',
        'theme': 'settings',
      };
      
      const matchedFilter = Object.entries(filterMap).find(([key]) => 
        search.toLowerCase().startsWith(key)
      );
      
      if (matchedFilter) {
        setActiveFilter(matchedFilter[1]);
        setSearch('');
      }
    }
    
    if (e.key === 'Escape' && activeFilter) {
      e.preventDefault();
      e.stopPropagation();
      setActiveFilter(null);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div onKeyDown={handleKeyDown}>
        <div className="flex items-center border-b border-border px-3">
          {activeFilter && (
            <span className="mr-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {activeFilter}
            </span>
          )}
          <CommandInput
            placeholder={activeFilter ? `Filter by ${activeFilter}...` : "Type a command or search..."}
            value={search}
            onValueChange={setSearch}
            className="border-0"
          />
        </div>
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No results found.</p>
              <p className="text-xs">Try a different search term.</p>
            </div>
          </CommandEmpty>

          {/* Recent Queries */}
          {!search && !activeFilter && recentQueries.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentQueries.map((query, index) => (
                  <CommandItem
                    key={`recent-${index}`}
                    value={`recent-${query}`}
                    onSelect={() => setSearch(query)}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{query}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          {navigationCommands.length > 0 && (
            <CommandGroup heading="Navigation">
              {navigationCommands.map(cmd => (
                <CommandItem
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={() => runCommand(cmd.action, cmd.label)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-muted-foreground">{cmd.icon}</span>
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Actions */}
          {actionCommands.length > 0 && (
            <>
              {navigationCommands.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Actions">
                {actionCommands.map(cmd => (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => runCommand(cmd.action, cmd.label)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="mr-2 text-muted-foreground">{cmd.icon}</span>
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Settings */}
          {settingsCommands.length > 0 && (
            <>
              {(navigationCommands.length > 0 || actionCommands.length > 0) && <CommandSeparator />}
              <CommandGroup heading="Settings">
                {settingsCommands.map(cmd => (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => runCommand(cmd.action, cmd.label)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="mr-2 text-muted-foreground">{cmd.icon}</span>
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Hint */}
          {!search && !activeFilter && (
            <>
              <CommandSeparator />
              <div className="px-3 py-2 text-xs text-muted-foreground">
                <span className="opacity-70">Tip: Type </span>
                <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">nav</kbd>
                <span className="opacity-70">, </span>
                <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">new</kbd>
                <span className="opacity-70">, or </span>
                <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">set</kbd>
                <span className="opacity-70"> then press </span>
                <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">Tab</kbd>
                <span className="opacity-70"> to filter</span>
              </div>
            </>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  );
});

CommandPalette.displayName = 'CommandPalette';
