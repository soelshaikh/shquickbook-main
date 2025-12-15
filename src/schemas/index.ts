/**
 * Schema Index
 * 
 * Central export point for all Zod schemas and related utilities.
 * Import validation schemas from this file throughout the application.
 */

// ============================================================================
// Common Schemas
// ============================================================================
export {
  dateSchema,
  optionalDateSchema,
  amountSchema,
  positiveNumberSchema,
  lineItemSchema,
  lineItemsArraySchema,
  journalEntryLineSchema,
  journalEntryLinesArraySchema,
  billStatusSchema,
  invoiceStatusSchema,
  journalEntryStatusSchema,
  syncStatusSchema,
  taxRateSchema,
  memoSchema,
  idSchema,
} from './commonSchemas';

export type {
  LineItem,
  JournalEntryLine,
  BillStatus,
  InvoiceStatus,
  JournalEntryStatus,
  SyncStatus,
} from './commonSchemas';

// ============================================================================
// Bill Schema
// ============================================================================
export {
  billFormSchema,
  defaultBillFormValues,
  billFormDataToDomainModel,
  domainModelToBillFormData,
} from './billSchema';

export type { BillFormData } from './billSchema';

// ============================================================================
// Invoice Schema
// ============================================================================
export {
  invoiceFormSchema,
  defaultInvoiceFormValues,
  invoiceFormDataToDomainModel,
  domainModelToInvoiceFormData,
} from './invoiceSchema';

export type { InvoiceFormData } from './invoiceSchema';

// ============================================================================
// Journal Entry Schema
// ============================================================================
export {
  journalEntryFormSchema,
  defaultJournalEntryFormValues,
  journalEntryFormDataToDomainModel,
  domainModelToJournalEntryFormData,
  calculateBalancingAmount,
} from './journalEntrySchema';

export type { JournalEntryFormData } from './journalEntrySchema';
