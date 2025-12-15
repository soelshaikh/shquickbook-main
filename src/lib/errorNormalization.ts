/**
 * Centralized Error Normalization Layer
 * 
 * This module provides a consistent error interface for the frontend,
 * insulating the UI from backend error contract changes.
 * 
 * Key principles:
 * - NEVER throws (always returns normalized error)
 * - Handles unknown/any error input gracefully
 * - No backend assumptions (future-proof)
 * - Preserves original error for debugging
 * - Severity controls presentation only (not logic)
 */

/**
 * Normalized error contract for frontend consumption
 */
export interface NormalizedError {
  /**
   * Error code - machine-readable identifier
   * Examples: 'NETWORK_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND', 'UNKNOWN_ERROR'
   */
  code: string;

  /**
   * Human-readable error message for display
   */
  message: string;

  /**
   * Severity level - controls UI presentation (toast color, icon, etc.)
   * - 'info': Informational, blue, no urgency
   * - 'warning': Caution, yellow/orange, needs attention
   * - 'error': Critical, red, requires action
   */
  severity: 'info' | 'warning' | 'error';

  /**
   * Optional metadata for additional context
   */
  metadata?: {
    /**
     * Original error object for debugging (not displayed to user)
     */
    originalError?: unknown;

    /**
     * HTTP status code if applicable
     */
    statusCode?: number;

    /**
     * Additional details from backend or error source
     */
    details?: Record<string, unknown>;

    /**
     * Timestamp when error was normalized
     */
    timestamp?: string;
  };
}

/**
 * Default error messages for common scenarios
 */
const DEFAULT_ERROR_MESSAGES = {
  UNKNOWN: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network connection issue. Please check your connection and try again.',
  VALIDATION: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access to this resource is forbidden.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  TIMEOUT: 'The request timed out. Please try again.',
} as const;

/**
 * Type guard to check if value is an Error object
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extract error message from various error shapes
 */
function extractMessage(error: unknown): string {
  // Native Error or Error-like objects
  if (isError(error)) {
    return error.message || DEFAULT_ERROR_MESSAGES.UNKNOWN;
  }

  // String errors
  if (typeof error === 'string') {
    return error || DEFAULT_ERROR_MESSAGES.UNKNOWN;
  }

  // Object with message property
  if (isObject(error)) {
    if (typeof error.message === 'string' && error.message) {
      return error.message;
    }
    
    // Some APIs use 'error' or 'errorMessage' fields
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }
    
    if (typeof error.errorMessage === 'string' && error.errorMessage) {
      return error.errorMessage;
    }

    // Axios-like error with response.data.message
    if (isObject(error.response) && isObject(error.response.data)) {
      const data = error.response.data;
      if (typeof data.message === 'string' && data.message) {
        return data.message;
      }
    }
  }

  return DEFAULT_ERROR_MESSAGES.UNKNOWN;
}

/**
 * Extract error code from various error shapes
 */
function extractCode(error: unknown): string {
  // Object with code property
  if (isObject(error)) {
    if (typeof error.code === 'string' && error.code) {
      return error.code;
    }

    // HTTP status code based codes
    if (typeof error.status === 'number') {
      return `HTTP_${error.status}`;
    }

    // Axios-like error with response.status
    if (isObject(error.response) && typeof error.response.status === 'number') {
      return `HTTP_${error.response.status}`;
    }

    // Network error detection (Axios-like)
    if (error.message === 'Network Error' || typeof error.isAxiosError === 'boolean') {
      return 'NETWORK_ERROR';
    }
  }

  // Native Error with name
  if (isError(error) && error.name) {
    return error.name.toUpperCase().replace(/\s+/g, '_');
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Determine severity from error code or status
 */
function determineSeverity(error: unknown, code: string): NormalizedError['severity'] {
  // Network errors are typically high severity
  if (code === 'NETWORK_ERROR') {
    return 'error';
  }

  // HTTP status code based severity
  if (isObject(error)) {
    const status = typeof error.status === 'number' 
      ? error.status 
      : isObject(error.response) && typeof error.response.status === 'number'
        ? error.response.status
        : null;

    if (status !== null) {
      if (status >= 500) return 'error'; // Server errors
      if (status >= 400 && status < 500) {
        if (status === 401 || status === 403) return 'error'; // Auth errors
        if (status === 404) return 'warning'; // Not found
        return 'warning'; // Client errors (validation, etc.)
      }
      if (status >= 200 && status < 300) return 'info'; // Success (shouldn't normally be an error)
    }
  }

  // Default to error for unknown issues
  return 'error';
}

/**
 * Extract HTTP status code if available
 */
function extractStatusCode(error: unknown): number | undefined {
  if (isObject(error)) {
    if (typeof error.status === 'number') {
      return error.status;
    }

    if (isObject(error.response) && typeof error.response.status === 'number') {
      return error.response.status;
    }
  }

  return undefined;
}

/**
 * Extract additional details from error object
 */
function extractDetails(error: unknown): Record<string, unknown> | undefined {
  if (isObject(error)) {
    // Axios-like error with response.data
    if (isObject(error.response) && isObject(error.response.data)) {
      const data = error.response.data;
      if (isObject(data.details)) {
        return data.details as Record<string, unknown>;
      }
    }

    // Direct details property
    if (isObject(error.details)) {
      return error.details as Record<string, unknown>;
    }

    // Validation errors (common pattern)
    if (isObject(error.errors)) {
      return { validationErrors: error.errors };
    }
  }

  return undefined;
}

/**
 * Normalize any error into a consistent frontend error contract
 * 
 * This function NEVER throws - it always returns a NormalizedError.
 * 
 * @param error - Any error value (Error, string, object, unknown)
 * @returns Normalized error object safe for UI consumption
 * 
 * @example
 * ```typescript
 * // Native Error
 * const normalized = normalizeError(new Error('Something went wrong'));
 * 
 * // String error
 * const normalized = normalizeError('Network connection failed');
 * 
 * // Axios-like error
 * const normalized = normalizeError({
 *   response: {
 *     status: 404,
 *     data: { message: 'User not found' }
 *   }
 * });
 * 
 * // Unknown value
 * const normalized = normalizeError(null); // Returns safe default
 * 
 * // Usage in component
 * try {
 *   await createInvoice(data);
 * } catch (error) {
 *   const normalized = normalizeError(error);
 *   toast({
 *     title: 'Error',
 *     description: normalized.message,
 *     variant: normalized.severity === 'error' ? 'destructive' : 'default'
 *   });
 * }
 * ```
 */
export function normalizeError(error: unknown): NormalizedError {
  try {
    // Extract core error information
    const message = extractMessage(error);
    const code = extractCode(error);
    const severity = determineSeverity(error, code);
    const statusCode = extractStatusCode(error);
    const details = extractDetails(error);

    return {
      code,
      message,
      severity,
      metadata: {
        originalError: error,
        statusCode,
        details,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (normalizationError) {
    // Failsafe: If normalization itself fails, return ultra-safe default
    console.error('Error during error normalization:', normalizationError);
    return {
      code: 'NORMALIZATION_ERROR',
      message: DEFAULT_ERROR_MESSAGES.UNKNOWN,
      severity: 'error',
      metadata: {
        originalError: error,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Helper to create a normalized error from scratch
 * Useful for creating custom errors in business logic
 * 
 * @example
 * ```typescript
 * const error = createNormalizedError(
 *   'VALIDATION_ERROR',
 *   'Customer name is required',
 *   'warning'
 * );
 * ```
 */
export function createNormalizedError(
  code: string,
  message: string,
  severity: NormalizedError['severity'] = 'error',
  details?: Record<string, unknown>
): NormalizedError {
  return {
    code,
    message,
    severity,
    metadata: {
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Check if an error is a normalized error
 */
export function isNormalizedError(value: unknown): value is NormalizedError {
  return (
    isObject(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    (value.severity === 'info' || value.severity === 'warning' || value.severity === 'error')
  );
}
