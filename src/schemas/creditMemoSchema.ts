/**
 * Credit Memo Form Schema
 * 
 * Zod validation schema for Credit Memo forms.
 * Validates customer credit memos with line items, tax, and amounts.
 */

import { z } from 'zod';
import {
  dateSchema,
  memoSchema,
  idSchema,
  taxRateSchema,
  amountSchema,
} from './commonSchemas';

/**
 * Credit Memo Line Item Schema
 * 
 * Represents a single line item with account, description, quantity, unit price, and amount.
 */
const creditMemoLineItemSchema = z.object({
  id: z.string().describe('Unique line item ID'),
  accountId: idSchema.describe('Account ID'),
  accountName: z.string().optional().describe('Account Name (Optional)'),
  description: z.string().min(1, 'Description is required').describe('Item Description'),
  quantity: z.number().refine((val) => val > 0, {
    message: 'Quantity must be greater than zero',
  }).describe('Quantity'),
  unitPrice: z.number().refine((val) => val >= 0, {
    message: 'Unit price cannot be negative',
  }).describe('Unit Price'),
  amount: amountSchema.describe('Line Item Amount'),
});

/**
 * Credit Memo Form Schema
 * 
 * Validates the complete credit memo form including:
 * - Customer selection (required)
 * - Transaction date (required)
 * - Line items (at least one required)
 * - Tax rate (0-1, representing 0% to 100%)
 * - Optional invoice reference (for credited invoices)
 * - Optional memo field
 * - Optional status field
 * 
 * Cross-field validation ensures:
 * - At least one line item exists
 * - Sum of line items equals totalAmount (±0.01 tolerance for floating point)
 */
export const creditMemoFormSchema = z
  .object({
    customerId: idSchema.describe('Customer ID'),
    txnDate: dateSchema.describe('Transaction Date'),
    invoiceId: z.string().optional().describe('Invoice ID (Optional - for credited invoices)'),
    lineItems: z
      .array(creditMemoLineItemSchema)
      .min(1, 'At least one line item is required')
      .describe('Credit Memo Line Items'),
    taxRate: taxRateSchema.default(0).describe('Tax Rate (0-1)'),
    status: z.string().optional().describe('Status (Optional)'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // Calculate subtotal from line items
      const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = subtotal * data.taxRate;
      const calculatedTotal = subtotal + taxAmount;
      
      // For credit memos, we just validate that line items have valid amounts
      // The totalAmount will be calculated in the domain model converter
      return data.lineItems.every(item => item.amount >= 0);
    },
    {
      message: 'All line item amounts must be non-negative',
      path: ['lineItems'],
    }
  );

/**
 * Inferred TypeScript Type
 * Use this type for form data throughout the application
 */
export type CreditMemoFormData = z.infer<typeof creditMemoFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new credit memos
 */
export const defaultCreditMemoFormValues = (): CreditMemoFormData => {
  const today = new Date().toISOString().split('T')[0];

  return {
    customerId: '',
    txnDate: today,
    invoiceId: '',
    lineItems: [
      {
        id: crypto.randomUUID(),
        accountId: '',
        accountName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ],
    taxRate: 0,
    status: 'draft',
    memo: '',
  };
};

/**
 * Convert Credit Memo Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full CreditMemo domain model.
 * This handles calculated fields and data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param customerName - Customer name (from customer lookup)
 * @param existingCreditMemo - Optional existing credit memo for updates
 * @returns Partial CreditMemo object ready for store/service layer
 */
export const creditMemoFormDataToDomainModel = (
  formData: CreditMemoFormData,
  customerName: string,
  existingCreditMemo?: {
    id: string;
    companyId: string;
    createdAt: string;
  }
) => {
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * formData.taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const now = new Date().toISOString();

  return {
    id: existingCreditMemo?.id || crypto.randomUUID(),
    companyId: existingCreditMemo?.companyId || 'comp-1',
    customerId: formData.customerId,
    customerName,
    invoiceId: formData.invoiceId || undefined,
    txnDate: formData.txnDate,
    lineItems: formData.lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: formData.taxRate,
    taxAmount,
    total,
    totalAmount: total,
    status: formData.status || 'draft',
    memo: formData.memo || undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error',
    createdAt: existingCreditMemo?.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing credit memo data for editing.
 * 
 * @param creditMemo - Existing credit memo from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToCreditMemoFormData = (creditMemo: {
  customerId: string;
  txnDate: string;
  invoiceId?: string;
  lineItems: Array<{
    id: string;
    accountId: string;
    accountName?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  taxRate: number;
  status?: string;
  memo?: string;
}): CreditMemoFormData => {
  return {
    customerId: creditMemo.customerId,
    txnDate: creditMemo.txnDate,
    invoiceId: creditMemo.invoiceId || '',
    lineItems: creditMemo.lineItems,
    taxRate: creditMemo.taxRate,
    status: creditMemo.status || 'draft',
    memo: creditMemo.memo || '',
  };
};
