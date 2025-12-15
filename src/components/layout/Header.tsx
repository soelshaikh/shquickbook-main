import { Sun, Moon, User, LogOut, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
type SyncStatus = 'synced' | 'pending' | 'error';
interface HeaderProps {
  syncStatus?: SyncStatus;
}
export function Header({
  syncStatus = 'synced'
}: HeaderProps) {
  const {
    theme,
    toggleTheme
  } = useThemeContext();
  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <Check className="h-3 w-3 text-[hsl(var(--sync-synced))]" />;
      case 'pending':
        return <RefreshCw className="h-3 w-3 text-[hsl(var(--sync-pending))] animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-[hsl(var(--sync-error))]" />;
    }
  };
  const getSyncText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'pending':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
    }
  };
  return <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <span className="font-semibold text-sm tracking-tight">SH-QuickBooks</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">

        {/* Sync Status Badge - Only show for errors */}
        {syncStatus === 'error' && <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-secondary">
            {getSyncIcon()}
            <span className="text-muted-foreground">{getSyncText()}</span>
          </div>}

        {/* Theme Toggle - Cmd+L */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} title={`Toggle theme (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+L)`}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              className="text-xs cursor-pointer" 
              onClick={() => {
                // TODO: Navigate to account settings page
                console.log('Account clicked - Navigate to /settings');
                window.location.href = '/settings';
              }}
            >
              <User className="h-3 w-3 mr-2" />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-xs text-destructive cursor-pointer" 
              onClick={() => {
                // TODO: Implement disconnect logic
                console.log('Disconnect QBO clicked');
                if (confirm('Are you sure you want to disconnect from QuickBooks Online?')) {
                  // For now, just reload to connection page
                  window.location.href = '/connect';
                }
              }}
            >
              <LogOut className="h-3 w-3 mr-2" />
              Disconnect QBO
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
}