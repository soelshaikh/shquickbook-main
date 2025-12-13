import { Wifi, WifiOff } from 'lucide-react';

interface StatusBarProps {
  isOnline?: boolean;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
}

export function StatusBar({ 
  isOnline = true, 
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

      {/* Right side - Connection status */}
      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 text-[hsl(var(--sync-synced))]" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-[hsl(var(--sync-error))]" />
            <span className="text-[hsl(var(--sync-error))]">Offline</span>
          </>
        )}
      </div>
    </footer>
  );
}
