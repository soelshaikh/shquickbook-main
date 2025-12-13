import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExportButtonProps {
  onClick: () => void;
  itemCount: number;
  disabled?: boolean;
}

export function ExportButton({ onClick, itemCount, disabled }: ExportButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={disabled || itemCount === 0}
            className="h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export ({itemCount})
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export filtered data to CSV</p>
          <p className="text-xs text-muted-foreground">
            <kbd className="kbd text-[10px]">Ctrl</kbd>+<kbd className="kbd text-[10px]">Shift</kbd>+<kbd className="kbd text-[10px]">E</kbd>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
