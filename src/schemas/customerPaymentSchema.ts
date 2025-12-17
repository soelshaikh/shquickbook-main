/**
 * Customer Payment Form Schema
 * 
 * Zod validation schema for Customer Payment forms.
 * Validates customer payments with invoice allocations and amounts.
 */

import { z } from 'zod';
import {
  dateSchema,
  memoSchema,
  idSchema,
  amountSchema,
} from './commonSchemas';

/**
 * Invoice Allocation Schema
 * 
 * Represents a single invoice allocation with invoice ID and applied amount.
 */
const invoiceAllocationSchema = z.object({
  invoiceId: idSchema.describe('Invoice ID'),
  amount: amountSchema.refine((val) => val > 0, {
    message: 'Applied amount must be greater than zero',
  }),
});

/**
 * Customer Payment Form Schema
 * 
 * Validates the complete customer payment form including:
 * - Customer selection (required)
 * - Transaction date (required)
 * - Payment amount (required, must be greater than zero)
 * - Payment method (optional)
 * - Reference number (optional)
 * - Deposit to account (required)
 * - Invoice allocations (optional array)
 * - Optional memo field
 * 
 * Cross-field validation ensures:
 * - Payment amount is greater than zero
 * - If invoice allocations exist, their sum must equal the payment amount
 */
export const customerPaymentFormSchema = z
  .object({
    customerId: idSchema.describe('Customer ID'),
    txnDate: dateSchema.describe('Transaction Date'),
    amount: amountSchema
      .refine((val) => val > 0, {
        message: 'Payment amount must be greater than zero',
      })
      .describe('Payment Amount'),
    paymentMethod: z
      .string()
      .max(100, 'Payment method must be 100 characters or less')
      .optional()
      .describe('Payment Method (Optional)'),
    referenceNumber: z
      .string()
      .max(100, 'Reference number must be 100 characters or less')
      .optional()
      .describe('Reference Number (Optional)'),
    depositToAccountId: idSchema.describe('Deposit to Account ID'),
    appliedToInvoices: z
      .array(invoiceAllocationSchema)
      .optional()
      .describe('Invoice Allocations (Optional)'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // If no invoice allocations, validation passes
      if (!data.appliedToInvoices || data.appliedToInvoices.length === 0) {
        return true;
      }

      // If invoice allocations exist, their sum must equal payment amount
      const allocatedTotal = data.appliedToInvoices.reduce(
        (sum, allocation) => sum + allocation.amount,
        0
      );

      // Use small epsilon for floating point comparison
      const epsilon = 0.01;
      return Math.abs(allocatedTotal - data.amount) < epsilon;
    },
    {
      message: 'Applied invoice allocations must sum to the payment amount',
      path: ['appliedToInvoices'],
    }
  );

/**
 * Inferred TypeScript Type
 * Use this type for form data throughout the application
 */
export type CustomerPaymentFormData = z.infer<typeof customerPaymentFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new customer payments
 */
export const defaultCustomerPaymentFormValues = (): CustomerPaymentFormData => {
  const today = new Date().toISOString().split('T')[0];

  return {
    customerId: '',
    txnDate: today,
    amount: 0,
    paymentMethod: '',
    referenceNumber: '',
    depositToAccountId: '',
    appliedToInvoices: [],
    memo: '',
  };
};

/**
 * Convert Customer Payment Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full CustomerPayment domain model.
 * This handles data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param customerName - Customer name (from customer lookup)
 * @param existingPayment - Optional existing payment for updates
 * @returns Partial CustomerPayment object ready for store/service layer
 */
export const customerPaymentFormDataToDomainModel = (
  formData: CustomerPaymentFormData,
  customerName: string,
  existingPayment?: {
    id: string;
    companyId: string;
    createdAt: string;
  }
) => {
  const now = new Date().toISOString();

  return {
    id: existingPayment?.id || crypto.randomUUID(),
    companyId: existingPayment?.companyId || 'comp-1',
    customerId: formData.customerId,
    customerName,
    txnDate: formData.txnDate,
    amount: formData.amount,
    paymentMethod: formData.paymentMethod || undefined,
    referenceNumber: formData.referenceNumber || undefined,
    depositToAccountId: formData.depositToAccountId,
    appliedToInvoices: formData.appliedToInvoices || [],
    memo: formData.memo || undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error',
    createdAt: existingPayment?.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing customer payment data for editing.
 * 
 * @param payment - Existing customer payment from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToCustomerPaymentFormData = (payment: {
  customerId: string;
  txnDate: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  depositToAccountId: string;
  appliedToInvoices?: Array<{
    invoiceId: string;
    amount: number;
  }>;
  memo?: string;
}): CustomerPaymentFormData => {
  return {
    customerId: payment.customerId,
    txnDate: payment.txnDate,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod || '',
    referenceNumber: payment.referenceNumber || '',
    depositToAccountId: payment.depositToAccountId,
    appliedToInvoices: payment.appliedToInvoices || [],
    memo: payment.memo || '',
  };
};
