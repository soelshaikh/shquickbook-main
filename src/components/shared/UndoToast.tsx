import { forwardRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const UndoToast = forwardRef<HTMLDivElement, UndoToastProps>(({ message, onUndo, onDismiss, duration = 3000 }, ref) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setIsVisible(false);
        setTimeout(onDismiss, 200); // Allow animation to complete
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const handleUndo = () => {
    setIsVisible(false);
    onUndo();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'fixed bottom-16 left-1/2 -translate-x-1/2 z-50 transition-all duration-200',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-80">
        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm flex-1">{message}</span>
          
          <button
            onClick={handleUndo}
            className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
          >
            UNDO
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

UndoToast.displayName = 'UndoToast';
