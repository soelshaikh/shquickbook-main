import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface FeatureErrorFallbackProps {
  featureName: string;
  onReset?: () => void;
}

/**
 * FeatureErrorFallback - Minimal error fallback for feature-level boundaries
 * 
 * Used to wrap individual features (Invoices, Bills, Journal Entries)
 * Provides a lightweight error UI without breaking the entire app
 */
export const FeatureErrorFallback: React.FC<FeatureErrorFallbackProps> = ({
  featureName,
  onReset,
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            {featureName} Error
          </AlertTitle>
          <AlertDescription className="mt-2">
            There was a problem loading {featureName.toLowerCase()}. The rest of the application is still working.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3 mt-6">
          {onReset && (
            <Button onClick={onReset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Pre-configured fallback components for each feature
 */
export const InvoicesErrorFallback: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <FeatureErrorFallback featureName="Invoices" onReset={onReset} />
);

export const BillsErrorFallback: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <FeatureErrorFallback featureName="Bills" onReset={onReset} />
);

export const JournalEntriesErrorFallback: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <FeatureErrorFallback featureName="Journal Entries" onReset={onReset} />
);

export const TransactionsErrorFallback: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <FeatureErrorFallback featureName="Transactions" onReset={onReset} />
);
