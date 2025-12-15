/**
 * Invoice Form Schema
 * 
 * Zod validation schema for Invoice forms.
 * Validates customer invoices with line items, dates, tax, and amounts.
 */

import { z } from 'zod';
import {
  dateSchema,
  optionalDateSchema,
  lineItemsArraySchema,
  memoSchema,
  idSchema,
  taxRateSchema,
} from './commonSchemas';

/**
 * Invoice Form Schema
 * 
 * Validates the complete invoice form including:
 * - Customer selection (required)
 * - Transaction date (required)
 * - Due date (optional, but if provided must be >= transaction date)
 * - Line items (at least one required)
 * - Tax rate (0-1, representing 0% to 100%)
 * - Optional memo field
 * 
 * Cross-field validation ensures due date is not before transaction date when provided.
 */
export const invoiceFormSchema = z
  .object({
    customerId: idSchema.describe('Customer ID'),
    txnDate: dateSchema.describe('Transaction Date'),
    dueDate: optionalDateSchema.describe('Due Date (Optional)'),
    lineItems: lineItemsArraySchema.describe('Invoice Line Items'),
    taxRate: taxRateSchema.default(0).describe('Tax Rate (0-1)'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // If due date is provided, ensure it's not before transaction date
      if (!data.dueDate || data.dueDate === '') {
        return true;
      }
      const txnDate = new Date(data.txnDate);
      const dueDate = new Date(data.dueDate);
      return dueDate >= txnDate;
    },
    {
      message: 'Due date must be on or after transaction date',
      path: ['dueDate'],
    }
  );

/**
 * Inferred TypeScript Type
 * Use this type for form data throughout the application
 */
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new invoices
 */
export const defaultInvoiceFormValues = (): InvoiceFormData => {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Default: 30 days from today
  const dueDateString = dueDate.toISOString().split('T')[0];

  return {
    customerId: '',
    txnDate: today,
    dueDate: dueDateString,
    lineItems: [
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    taxRate: 0,
    memo: '',
  };
};

/**
 * Convert Invoice Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full Invoice domain model.
 * This handles calculated fields and data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param customerName - Customer name (from customer lookup)
 * @param existingInvoice - Optional existing invoice for updates
 * @returns Partial Invoice object ready for store/service layer
 */
export const invoiceFormDataToDomainModel = (
  formData: InvoiceFormData,
  customerName: string,
  existingInvoice?: {
    id: string;
    docNumber: string;
    companyId: string;
    createdAt: string;
  }
) => {
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * formData.taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const now = new Date().toISOString();

  return {
    id: existingInvoice?.id || crypto.randomUUID(),
    companyId: existingInvoice?.companyId || 'comp-1',
    docNumber: existingInvoice?.docNumber || `INV-${Date.now()}`,
    customerId: formData.customerId,
    customer: customerName,
    txnDate: formData.txnDate,
    dueDate: formData.dueDate || '',
    lineItems: formData.lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: formData.taxRate,
    taxAmount,
    total,
    balance: total,
    status: (existingInvoice ? undefined : 'draft') as
      | 'draft'
      | 'sent'
      | 'viewed'
      | 'partial'
      | 'paid'
      | 'overdue'
      | 'voided'
      | undefined,
    emailStatus: (existingInvoice ? undefined : 'not_sent') as
      | 'not_sent'
      | 'sent'
      | 'delivered'
      | 'opened'
      | 'bounced'
      | undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error' | 'local_only',
    memo: formData.memo || '',
    createdAt: existingInvoice?.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing invoice data for editing.
 * 
 * @param invoice - Existing invoice from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToInvoiceFormData = (invoice: {
  customerId: string;
  txnDate: string;
  dueDate?: string;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  taxRate: number;
  memo?: string;
}): InvoiceFormData => {
  return {
    customerId: invoice.customerId,
    txnDate: invoice.txnDate,
    dueDate: invoice.dueDate || '',
    lineItems: invoice.lineItems,
    taxRate: invoice.taxRate,
    memo: invoice.memo || '',
  };
};
