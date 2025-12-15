import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/lib/errorDisplay';

interface FeatureErrorFallbackProps {
  featureName: string;
  onReset?: () => void;
  error?: unknown;
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
  error,
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  // Use normalized error message if error is provided, otherwise use generic message
  const errorMessage = error 
    ? getErrorMessage(error)
    : `There was a problem loading ${featureName.toLowerCase()}. The rest of the application is still working.`;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            {featureName} Error
          </AlertTitle>
          <AlertDescription className="mt-2">
            {errorMessage}
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
export const InvoicesErrorFallback: React.FC<{ onReset?: () => void; error?: unknown }> = ({ onReset, error }) => (
  <FeatureErrorFallback featureName="Invoices" onReset={onReset} error={error} />
);

export const BillsErrorFallback: React.FC<{ onReset?: () => void; error?: unknown }> = ({ onReset, error }) => (
  <FeatureErrorFallback featureName="Bills" onReset={onReset} error={error} />
);

export const JournalEntriesErrorFallback: React.FC<{ onReset?: () => void; error?: unknown }> = ({ onReset, error }) => (
  <FeatureErrorFallback featureName="Journal Entries" onReset={onReset} error={error} />
);

export const TransactionsErrorFallback: React.FC<{ onReset?: () => void; error?: unknown }> = ({ onReset, error }) => (
  <FeatureErrorFallback featureName="Transactions" onReset={onReset} error={error} />
);
