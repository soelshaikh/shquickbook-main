/**
 * Common Zod Schemas
 * 
 * Shared validation primitives used across multiple form schemas.
 * These schemas ensure consistency in validation logic across the application.
 */

import { z } from 'zod';

/**
 * Date Validation
 * Validates ISO 8601 date format (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * Optional Date Validation
 * Allows empty string or valid date format
 */
export const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional()
  .or(z.literal(''));

/**
 * Amount Validation
 * Validates non-negative monetary amounts with 2 decimal precision
 */
export const amountSchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .nonnegative('Amount must be non-negative')
  .finite('Amount must be a finite number');

/**
 * Positive Number Validation
 * For quantities and rates that must be greater than zero
 */
export const positiveNumberSchema = z
  .number({
    required_error: 'Value is required',
    invalid_type_error: 'Value must be a number',
  })
  .positive('Value must be greater than zero')
  .finite('Value must be a finite number');

/**
 * Line Item Schema (Shared by Bills and Invoices)
 * 
 * Represents a single line item with description, quantity, rate, and calculated amount.
 * Amount is automatically calculated as quantity × rate.
 */
export const lineItemSchema = z.object({
  id: z.string(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  quantity: positiveNumberSchema,
  rate: positiveNumberSchema,
  amount: amountSchema,
});

/**
 * Line Item Array Validation
 * Requires at least one line item for bills and invoices
 */
export const lineItemsArraySchema = z
  .array(lineItemSchema)
  .min(1, 'At least one line item is required');

/**
 * Journal Entry Line Schema
 * 
 * Represents a single line in a journal entry.
 * Each line must have either a debit OR a credit (not both).
 */
export const journalEntryLineSchema = z.object({
  id: z.string(),
  accountId: z
    .string()
    .min(1, 'Account is required'),
  accountName: z
    .string()
    .min(1, 'Account name is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  debit: amountSchema,
  credit: amountSchema,
});

/**
 * Journal Entry Lines Array Validation
 * Requires at least two lines (minimum for a balanced entry)
 */
export const journalEntryLinesArraySchema = z
  .array(journalEntryLineSchema)
  .min(2, 'At least two lines are required for a journal entry');

/**
 * Status Enums
 */
export const billStatusSchema = z.enum(['draft', 'pending', 'paid', 'overdue', 'partial']);

export const invoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'viewed',
  'partial',
  'paid',
  'overdue',
  'voided',
]);

export const journalEntryStatusSchema = z.enum(['draft', 'posted', 'voided']);

export const syncStatusSchema = z.enum(['synced', 'pending', 'error', 'local_only']);

/**
 * Tax Rate Validation
 * Validates tax rate as a decimal between 0 and 1 (0% to 100%)
 */
export const taxRateSchema = z
  .number({
    required_error: 'Tax rate is required',
    invalid_type_error: 'Tax rate must be a number',
  })
  .min(0, 'Tax rate must be between 0 and 1')
  .max(1, 'Tax rate must be between 0 and 1')
  .finite('Tax rate must be a finite number');

/**
 * Memo Field Validation
 * Optional text field with maximum length
 */
export const memoSchema = z
  .string()
  .max(1000, 'Memo must be 1000 characters or less')
  .optional();

/**
 * ID Field Validation
 * Required string identifier
 */
export const idSchema = z
  .string()
  .min(1, 'ID is required');

/**
 * Type Exports
 * Infer TypeScript types from schemas for reuse
 */
export type LineItem = z.infer<typeof lineItemSchema>;
export type JournalEntryLine = z.infer<typeof journalEntryLineSchema>;
export type BillStatus = z.infer<typeof billStatusSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type JournalEntryStatus = z.infer<typeof journalEntryStatusSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
