import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePagePerformance } from '@/hooks/usePerformance';

const NotFound = forwardRef<HTMLDivElement>((_, ref) => {
  usePagePerformance('NotFound');
  const navigate = useNavigate();

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-full p-4">
      <h1 className="text-4xl font-bold text-muted-foreground mb-2">404</h1>
      <p className="text-sm text-muted-foreground mb-4">Page not found</p>
      <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
        Go to Transactions
      </Button>
    </div>
  );
});

NotFound.displayName = 'NotFound';

export default NotFound;
