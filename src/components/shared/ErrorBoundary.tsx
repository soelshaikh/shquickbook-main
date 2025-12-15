import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { normalizeError } from '@/lib/errorNormalization';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches React component errors and displays fallback UI
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * With custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Normalize error for consistent logging
    const normalized = normalizeError(error);

    // Log error details to console
    console.error('ErrorBoundary caught an error:', {
      code: normalized.code,
      message: normalized.message,
      severity: normalized.severity,
      componentStack: errorInfo.componentStack,
      metadata: normalized.metadata,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler prop
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    // Reset error state and retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-2xl">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Something went wrong
              </AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error ? normalizeError(this.state.error).message : 'An unexpected error occurred. The application has been protected from crashing.'}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-muted rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2">Error Details (Development Only):</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Code:</span>
                        <pre className="text-xs text-muted-foreground mt-1">
                          {normalizeError(this.state.error).code}
                        </pre>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Raw Error:</span>
                        <pre className="text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap break-words mt-1">
                          {this.state.error?.toString()}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="bg-muted rounded-lg p-4 mb-4">
                <details className="cursor-pointer">
                  <summary className="font-semibold text-sm mb-2">
                    Component Stack (Development Only)
                  </summary>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-60 whitespace-pre-wrap break-words mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReset} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
