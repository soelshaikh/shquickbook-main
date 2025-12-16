import { ReactNode, useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { CommandPalette } from '@/components/CommandPalette';
import { ShortcutsModal } from '@/components/shared/ShortcutsModal';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { useUndo } from '@/contexts/UndoContext';
import { toast } from 'sonner';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme } = useThemeContext();
  const { triggerAction } = useKeyboard();
  const { canUndo, canRedo, undo, redo, lastAction } = useUndo();
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const { 
    isOpen: commandPaletteOpen, 
    open: openCommandPalette,
    close: closeCommandPalette,
    toggle: toggleCommandPalette,
    recentQueries,
    addRecentQuery,
  } = useCommandPalette();

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    // Command Palette: Cmd/Ctrl + K
    if (isMod && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
      return;
    }

    // Theme toggle: Cmd/Ctrl + L
    if (isMod && e.key === 'l') {
      e.preventDefault();
      toggleTheme();
      return;
    }

    // Settings: Cmd/Ctrl + ,
    if (isMod && e.key === ',') {
      e.preventDefault();
      navigate('/settings');
      return;
    }

    // Undo: Cmd/Ctrl + Z
    if (isMod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (canUndo) {
        undo();
        toast.info(`Undone: ${lastAction?.description || 'action'}`);
      }
      return;
    }

    // Redo: Cmd/Ctrl + Y or Cmd/Ctrl + Shift + Z
    if ((isMod && e.key === 'y') || (isMod && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      if (canRedo) {
        redo();
        toast.info('Redo completed');
      }
      return;
    }

    // Prevent shortcuts when typing in inputs or command palette is open
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      commandPaletteOpen
    ) {
      return;
    }

    // Shortcuts help: ? (Shift+/ on most keyboards)
    if (e.key === '?') {
      e.preventDefault();
      setShortcutsModalOpen(true);
      return;
    }

    // Search shortcut: /
    if (e.key === '/') {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    // F key: Toggle filter bar
    if (e.key.toLowerCase() === 'f' && !isMod) {
      e.preventDefault();
      triggerAction('toggle-filter');
      return;
    }

    // E key: Edit selected item
    if (e.key.toLowerCase() === 'e' && !isMod) {
      e.preventDefault();
      triggerAction('edit-selected');
      return;
    }

    // Context-aware navigation shortcuts
    const currentPath = location.pathname;

    // I key: New Invoice on /invoices, navigate otherwise
    if (e.key.toLowerCase() === 'i' && !isMod) {
      e.preventDefault();
      if (currentPath === '/invoices') {
        triggerAction('new-invoice');
      } else {
        navigate('/invoices?focus=list');
      }
      return;
    }

    // B key: New Bill on /bills, navigate otherwise
    if (e.key.toLowerCase() === 'b' && !isMod) {
      e.preventDefault();
      if (currentPath === '/bills') {
        triggerAction('new-bill');
      } else {
        navigate('/bills?focus=list');
      }
      return;
    }

    // J key: New Journal Entry on /journal-entries, navigate otherwise
    if (e.key.toLowerCase() === 'j' && !isMod) {
      e.preventDefault();
      if (currentPath === '/journal-entries') {
        triggerAction('new-journal-entry');
      } else {
        navigate('/journal-entries?focus=list');
      }
      return;
    }

    // T key: Go to Transactions
    if (e.key.toLowerCase() === 't' && !isMod) {
      e.preventDefault();
      navigate('/transactions?focus=list');
      return;
    }

    // Ctrl+Shift+D: Duplicate current record
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      const currentPath = location.pathname;
      if (currentPath.startsWith('/invoices')) {
        triggerAction('duplicate-invoice');
      } else if (currentPath.startsWith('/bills')) {
        triggerAction('duplicate-bill');
      } else if (currentPath.startsWith('/journal-entries')) {
        triggerAction('duplicate-journal-entry');
      }
      return;
    }

    // Ctrl+Shift+E: Export current view
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      triggerAction('export-current-view');
      return;
    }
  }, [navigate, toggleTheme, commandPaletteOpen, openCommandPalette, toggleCommandPalette, location.pathname, triggerAction, canUndo, canRedo, undo, redo, lastAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <StatusBar onOpenCommandPalette={openCommandPalette} />
      
      <CommandPalette 
        open={commandPaletteOpen}
        onOpenChange={(open) => open ? openCommandPalette() : closeCommandPalette()}
        recentQueries={recentQueries}
        onQueryExecuted={addRecentQuery}
      />

      <ShortcutsModal
        open={shortcutsModalOpen}
        onOpenChange={setShortcutsModalOpen}
      />
    </div>
  );
}
