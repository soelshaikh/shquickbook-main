/**
 * SyncStatusIndicator - Global sync status UI indicator
 * 
 * A small, non-blocking visual indicator showing:
 * - Offline: Red indicator with offline icon
 * - Online with pending sync: Yellow indicator with sync icon
 * - Online with all changes saved: Green indicator with checkmark
 * 
 * This is a read-only UI component with no business logic.
 * Designed to be placed in StatusBar or Header.
 */

import { Wifi, WifiOff, Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  /**
   * Display mode: 'compact' shows icon only, 'full' shows icon + text
   */
  mode?: 'compact' | 'full';
  /**
   * Size variant
   */
  size?: 'sm' | 'md';
}

export function SyncStatusIndicator({ 
  mode = 'full', 
  size = 'sm' 
}: SyncStatusIndicatorProps) {
  const { state, isOnline, pendingCount } = useSyncStatus();

  // Determine icon, color, and text based on state
  const getStatusConfig = () => {
    switch (state) {
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-[hsl(var(--sync-error))]',
          bgColor: 'bg-[hsl(var(--sync-error))]/10',
          text: 'Offline',
          tooltip: 'No internet connection. Changes will sync when online.',
        };
      case 'online-pending':
        return {
          icon: Loader2,
          color: 'text-[hsl(var(--sync-pending))]',
          bgColor: 'bg-[hsl(var(--sync-pending))]/10',
          text: `${pendingCount} pending`,
          tooltip: `${pendingCount} change${pendingCount !== 1 ? 's' : ''} waiting to sync`,
          animate: true,
        };
      case 'online-synced':
        return {
          icon: Check,
          color: 'text-[hsl(var(--sync-synced))]',
          bgColor: 'bg-[hsl(var(--sync-synced))]/10',
          text: 'Synced',
          tooltip: 'All changes saved',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const content = (
    <div className={`flex items-center gap-1.5 ${config.bgColor} px-2 py-0.5 rounded-md transition-colors`}>
      <Icon 
        className={`${iconSize} ${config.color} ${config.animate ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {mode === 'full' && (
        <span className={`${textSize} ${config.color} font-medium`}>
          {config.text}
        </span>
      )}
    </div>
  );

  // Wrap in tooltip for additional context
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            aria-label={config.tooltip}
          >
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
