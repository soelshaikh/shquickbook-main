import { SyncStatusIndicator } from '@/components/shared/SyncStatusIndicator';

interface StatusBarProps {
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
}

export function StatusBar({ 
  onOpenCommandPalette,
  onOpenShortcuts 
}: StatusBarProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <footer className="h-6 border-t border-border bg-[hsl(var(--statusbar-background))] flex items-center justify-between px-3 text-[10px] text-[hsl(var(--statusbar-foreground))] shrink-0">
      {/* Left side - Command hints */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <span className="kbd text-[9px]">{modKey}+K</span>
          <span>Command Palette</span>
        </button>
        
        <button 
          onClick={onOpenShortcuts}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <span className="kbd text-[9px]">?</span>
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Right side - Sync status indicator */}
      <SyncStatusIndicator mode="full" size="sm" />
    </footer>
  );
}
