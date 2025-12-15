/**
 * Error Display Helpers
 * 
 * Utilities for displaying normalized errors in the UI via toasts and other mechanisms.
 * This ensures all user-facing error messages go through the normalization layer.
 */

import { toast } from '@/hooks/use-toast';
import { normalizeError, type NormalizedError } from './errorNormalization';

/**
 * Display an error as a toast notification
 * Automatically normalizes the error before display
 * 
 * @param error - Any error value (will be normalized)
 * @param options - Optional toast customization
 * 
 * @example
 * ```typescript
 * try {
 *   await createInvoice(data);
 * } catch (error) {
 *   showErrorToast(error);
 * }
 * 
 * // With custom title
 * try {
 *   await deleteInvoice(id);
 * } catch (error) {
 *   showErrorToast(error, { title: 'Delete Failed' });
 * }
 * ```
 */
export function showErrorToast(
  error: unknown,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  const normalized = normalizeError(error);

  // Determine toast variant based on severity
  const variant = normalized.severity === 'error' ? 'destructive' : 'default';

  // Default title based on severity
  const defaultTitle = 
    normalized.severity === 'error' ? 'Error' :
    normalized.severity === 'warning' ? 'Warning' :
    'Notice';

  toast({
    title: options?.title || defaultTitle,
    description: normalized.message,
    variant,
    duration: options?.duration,
  });

  // Log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Toast]', {
      code: normalized.code,
      message: normalized.message,
      severity: normalized.severity,
      metadata: normalized.metadata,
    });
  }
}

/**
 * Display a success toast notification
 * 
 * @param message - Success message to display
 * @param options - Optional toast customization
 * 
 * @example
 * ```typescript
 * const { mutate } = useCreateInvoice();
 * 
 * mutate(data, {
 *   onSuccess: () => {
 *     showSuccessToast('Invoice created successfully');
 *   }
 * });
 * ```
 */
export function showSuccessToast(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  toast({
    title: options?.title || 'Success',
    description: message,
    duration: options?.duration,
  });
}

/**
 * Display an info toast notification
 * 
 * @param message - Info message to display
 * @param options - Optional toast customization
 */
export function showInfoToast(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  toast({
    title: options?.title || 'Info',
    description: message,
    duration: options?.duration,
  });
}

/**
 * Display a warning toast notification
 * Can accept either a string or an error (which will be normalized)
 * 
 * @param messageOrError - Warning message or error to display
 * @param options - Optional toast customization
 */
export function showWarningToast(
  messageOrError: string | unknown,
  options?: {
    title?: string;
    duration?: number;
  }
): void {
  const message = typeof messageOrError === 'string'
    ? messageOrError
    : normalizeError(messageOrError).message;

  toast({
    title: options?.title || 'Warning',
    description: message,
    duration: options?.duration,
  });
}

/**
 * Get formatted error message for display
 * Normalizes error and returns just the message string
 * Useful when you need the message without showing a toast
 * 
 * @param error - Any error value
 * @returns Normalized error message string
 * 
 * @example
 * ```typescript
 * <Alert>
 *   <AlertDescription>
 *     {getErrorMessage(error)}
 *   </AlertDescription>
 * </Alert>
 * ```
 */
export function getErrorMessage(error: unknown): string {
  return normalizeError(error).message;
}

/**
 * Get normalized error details for advanced error display
 * Useful when you need more control over error presentation
 * 
 * @param error - Any error value
 * @returns Full normalized error object
 * 
 * @example
 * ```typescript
 * const errorDetails = getErrorDetails(error);
 * 
 * return (
 *   <Alert variant={errorDetails.severity === 'error' ? 'destructive' : 'default'}>
 *     <AlertTitle>{errorDetails.code}</AlertTitle>
 *     <AlertDescription>{errorDetails.message}</AlertDescription>
 *   </Alert>
 * );
 * ```
 */
export function getErrorDetails(error: unknown): NormalizedError {
  return normalizeError(error);
}
