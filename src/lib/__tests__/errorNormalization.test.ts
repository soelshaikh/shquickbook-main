/**
 * Tests for error normalization layer
 * 
 * These tests demonstrate how the normalization handles various error shapes
 * without making backend assumptions.
 */

import { describe, it, expect } from 'vitest';
import { 
  normalizeError, 
  createNormalizedError, 
  isNormalizedError,
  type NormalizedError 
} from '../errorNormalization';

describe('errorNormalization', () => {
  describe('normalizeError', () => {
    it('should handle native Error objects', () => {
      const error = new Error('Something went wrong');
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('ERROR');
      expect(normalized.message).toBe('Something went wrong');
      expect(normalized.severity).toBe('error');
      expect(normalized.metadata?.originalError).toBe(error);
    });

    it('should handle string errors', () => {
      const error = 'Network connection failed';
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('UNKNOWN_ERROR');
      expect(normalized.message).toBe('Network connection failed');
      expect(normalized.severity).toBe('error');
    });

    it('should handle empty string errors with default message', () => {
      const error = '';
      const normalized = normalizeError(error);

      expect(normalized.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle Axios-like error structure (HTTP 404)', () => {
      const error = {
        response: {
          status: 404,
          data: {
            message: 'Invoice not found',
            code: 'NOT_FOUND',
          },
        },
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('NOT_FOUND');
      expect(normalized.message).toBe('Invoice not found');
      expect(normalized.severity).toBe('warning'); // 404 is warning
      expect(normalized.metadata?.statusCode).toBe(404);
    });

    it('should handle Axios-like error structure (HTTP 500)', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('HTTP_500');
      expect(normalized.message).toBe('Internal server error');
      expect(normalized.severity).toBe('error'); // 500+ is error
      expect(normalized.metadata?.statusCode).toBe(500);
    });

    it('should handle Axios-like network errors', () => {
      const error = {
        message: 'Network Error',
        isAxiosError: true,
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('NETWORK_ERROR');
      expect(normalized.message).toBe('Network Error');
      expect(normalized.severity).toBe('error');
    });

    it('should handle validation errors (HTTP 400)', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: {
              customerName: 'Customer name is required',
              dueDate: 'Due date must be in the future',
            },
          },
        },
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('VALIDATION_ERROR');
      expect(normalized.message).toBe('Validation failed');
      expect(normalized.severity).toBe('warning'); // 400 is warning
      expect(normalized.metadata?.statusCode).toBe(400);
      expect(normalized.metadata?.details).toEqual({
        customerName: 'Customer name is required',
        dueDate: 'Due date must be in the future',
      });
    });

    it('should handle authorization errors (HTTP 401)', () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('HTTP_401');
      expect(normalized.message).toBe('Unauthorized');
      expect(normalized.severity).toBe('error'); // Auth errors are severe
      expect(normalized.metadata?.statusCode).toBe(401);
    });

    it('should handle forbidden errors (HTTP 403)', () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'Access denied',
          },
        },
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('HTTP_403');
      expect(normalized.message).toBe('Access denied');
      expect(normalized.severity).toBe('error'); // Auth errors are severe
      expect(normalized.metadata?.statusCode).toBe(403);
    });

    it('should handle fetch-like error structure', () => {
      const error = {
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ message: 'Invalid data format' }),
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('HTTP_422');
      expect(normalized.severity).toBe('warning');
      expect(normalized.metadata?.statusCode).toBe(422);
    });

    it('should handle object with error field', () => {
      const error = {
        error: 'Database connection timeout',
      };
      const normalized = normalizeError(error);

      expect(normalized.message).toBe('Database connection timeout');
    });

    it('should handle object with errorMessage field', () => {
      const error = {
        errorMessage: 'Transaction already processed',
      };
      const normalized = normalizeError(error);

      expect(normalized.message).toBe('Transaction already processed');
    });

    it('should handle null error', () => {
      const normalized = normalizeError(null);

      expect(normalized.code).toBe('UNKNOWN_ERROR');
      expect(normalized.message).toBe('An unexpected error occurred. Please try again.');
      expect(normalized.severity).toBe('error');
    });

    it('should handle undefined error', () => {
      const normalized = normalizeError(undefined);

      expect(normalized.code).toBe('UNKNOWN_ERROR');
      expect(normalized.message).toBe('An unexpected error occurred. Please try again.');
      expect(normalized.severity).toBe('error');
    });

    it('should handle plain object without message', () => {
      const error = { foo: 'bar' };
      const normalized = normalizeError(error);

      expect(normalized.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should never throw during normalization', () => {
      const weirdValues = [
        { circular: null as any },
        Symbol('test'),
        () => {},
        123,
        true,
        [],
        new Date(),
      ];

      // Create circular reference
      weirdValues[0].circular = weirdValues[0];

      weirdValues.forEach((value) => {
        expect(() => normalizeError(value)).not.toThrow();
        const result = normalizeError(value);
        expect(result).toHaveProperty('code');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('severity');
      });
    });

    it('should include timestamp in metadata', () => {
      const error = new Error('Test');
      const before = new Date().toISOString();
      const normalized = normalizeError(error);
      const after = new Date().toISOString();

      expect(normalized.metadata?.timestamp).toBeDefined();
      expect(normalized.metadata!.timestamp!).toBeGreaterThanOrEqual(before);
      expect(normalized.metadata!.timestamp!).toBeLessThanOrEqual(after);
    });

    it('should handle errors with custom code property', () => {
      const error = {
        code: 'CUSTOM_ERROR_CODE',
        message: 'Custom error message',
      };
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('CUSTOM_ERROR_CODE');
      expect(normalized.message).toBe('Custom error message');
    });

    it('should preserve original error in metadata', () => {
      const originalError = new Error('Original');
      const normalized = normalizeError(originalError);

      expect(normalized.metadata?.originalError).toBe(originalError);
    });
  });

  describe('createNormalizedError', () => {
    it('should create a normalized error from scratch', () => {
      const error = createNormalizedError(
        'VALIDATION_ERROR',
        'Customer name is required',
        'warning'
      );

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Customer name is required');
      expect(error.severity).toBe('warning');
      expect(error.metadata?.timestamp).toBeDefined();
    });

    it('should default to error severity', () => {
      const error = createNormalizedError('TEST_ERROR', 'Test message');

      expect(error.severity).toBe('error');
    });

    it('should include details in metadata', () => {
      const details = { field: 'customerName', value: '' };
      const error = createNormalizedError(
        'VALIDATION_ERROR',
        'Field is required',
        'warning',
        details
      );

      expect(error.metadata?.details).toEqual(details);
    });
  });

  describe('isNormalizedError', () => {
    it('should identify normalized errors', () => {
      const error = createNormalizedError('TEST', 'Test message');
      expect(isNormalizedError(error)).toBe(true);
    });

    it('should reject non-normalized errors', () => {
      expect(isNormalizedError(new Error('test'))).toBe(false);
      expect(isNormalizedError('error')).toBe(false);
      expect(isNormalizedError(null)).toBe(false);
      expect(isNormalizedError(undefined)).toBe(false);
      expect(isNormalizedError({})).toBe(false);
      expect(isNormalizedError({ code: 'TEST' })).toBe(false); // Missing message and severity
    });

    it('should validate severity values', () => {
      const invalid = { code: 'TEST', message: 'Test', severity: 'critical' };
      expect(isNormalizedError(invalid)).toBe(false);

      const valid = { code: 'TEST', message: 'Test', severity: 'error' };
      expect(isNormalizedError(valid)).toBe(true);
    });
  });

  describe('real-world error scenarios', () => {
    it('should handle QuickBooks API error format (example)', () => {
      const error = {
        response: {
          status: 400,
          data: {
            Fault: {
              Error: [
                {
                  Message: 'Duplicate Document Number Error',
                  Detail: 'The document number you specified has already been used.',
                  code: '6140',
                },
              ],
              type: 'ValidationFault',
            },
          },
        },
      };
      const normalized = normalizeError(error);

      // Even though this has a non-standard structure, we extract what we can
      expect(normalized.code).toBe('HTTP_400');
      expect(normalized.severity).toBe('warning');
      expect(normalized.metadata?.statusCode).toBe(400);
    });

    it('should handle timeout errors', () => {
      const error = new Error('timeout of 30000ms exceeded');
      error.name = 'TimeoutError';
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('TIMEOUTERROR');
      expect(normalized.message).toBe('timeout of 30000ms exceeded');
      expect(normalized.severity).toBe('error');
    });

    it('should handle CORS errors', () => {
      const error = new TypeError('Failed to fetch');
      const normalized = normalizeError(error);

      expect(normalized.code).toBe('TYPEERROR');
      expect(normalized.message).toBe('Failed to fetch');
      expect(normalized.severity).toBe('error');
    });
  });
});
