import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MAX_RENDER_LIMIT } from '@/lib/constants';

interface RenderLimitWarningProps {
  totalCount: number;
  entityName: string;
}

/**
 * Warning banner displayed when dataset exceeds MAX_RENDER_LIMIT.
 * 
 * Non-blocking alert that informs users they're viewing a subset of data
 * and should refine their filters for better results.
 */
export function RenderLimitWarning({ totalCount, entityName }: RenderLimitWarningProps) {
  if (totalCount <= MAX_RENDER_LIMIT) {
    return null;
  }

  const excessCount = totalCount - MAX_RENDER_LIMIT;
  
  return (
    <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 mb-4">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <strong>Showing first {MAX_RENDER_LIMIT.toLocaleString()} of {totalCount.toLocaleString()} {entityName}.</strong>
        {' '}
        {excessCount.toLocaleString()} {entityName} not displayed. Please refine your filters or search to see more specific results.
      </AlertDescription>
    </Alert>
  );
}
