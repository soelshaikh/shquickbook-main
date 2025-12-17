/**
 * Vendor Payment Form Schema
 * 
 * Zod validation schema for Vendor Payment forms.
 * Validates vendor payments with bill allocations and amounts.
 */

import { z } from 'zod';
import {
  dateSchema,
  memoSchema,
  idSchema,
  amountSchema,
} from './commonSchemas';

/**
 * Bill Allocation Schema
 * 
 * Represents a single bill allocation with bill ID and applied amount.
 */
const billAllocationSchema = z.object({
  billId: idSchema.describe('Bill ID'),
  amount: amountSchema.refine((val) => val > 0, {
    message: 'Applied amount must be greater than zero',
  }),
});

/**
 * Vendor Payment Form Schema
 * 
 * Validates the complete vendor payment form including:
 * - Vendor selection (required)
 * - Transaction date (required)
 * - Payment amount (required, must be greater than zero)
 * - Bank account (required)
 * - Payment method (optional)
 * - Reference number (optional)
 * - Bill allocations (optional array)
 * - Optional memo field
 * 
 * Cross-field validation ensures:
 * - Payment amount is greater than zero
 * - If bill allocations exist, their sum must equal the payment amount
 */
export const vendorPaymentFormSchema = z
  .object({
    vendorId: idSchema.describe('Vendor ID'),
    txnDate: dateSchema.describe('Transaction Date'),
    amount: amountSchema
      .refine((val) => val > 0, {
        message: 'Payment amount must be greater than zero',
      })
      .describe('Payment Amount'),
    bankAccountId: idSchema.describe('Bank Account ID'),
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
    appliedBills: z
      .array(billAllocationSchema)
      .optional()
      .describe('Bill Allocations (Optional)'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // If no bill allocations, validation passes
      if (!data.appliedBills || data.appliedBills.length === 0) {
        return true;
      }

      // If bill allocations exist, their sum must equal payment amount
      const allocatedTotal = data.appliedBills.reduce(
        (sum, allocation) => sum + allocation.amount,
        0
      );

      // Use small epsilon for floating point comparison
      const epsilon = 0.01;
      return Math.abs(allocatedTotal - data.amount) < epsilon;
    },
    {
      message: 'Applied bill allocations must sum to the payment amount',
      path: ['appliedBills'],
    }
  );

/**
 * Inferred TypeScript Type
 * Use this type for form data throughout the application
 */
export type VendorPaymentFormData = z.infer<typeof vendorPaymentFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new vendor payments
 */
export const defaultVendorPaymentFormValues = (): VendorPaymentFormData => {
  const today = new Date().toISOString().split('T')[0];

  return {
    vendorId: '',
    txnDate: today,
    amount: 0,
    bankAccountId: '',
    paymentMethod: '',
    referenceNumber: '',
    appliedBills: [],
    memo: '',
  };
};

/**
 * Convert Vendor Payment Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full VendorPayment domain model.
 * This handles data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param vendorName - Vendor name (from vendor lookup)
 * @param existingPayment - Optional existing payment for updates
 * @returns Partial VendorPayment object ready for store/service layer
 */
export const vendorPaymentFormDataToDomainModel = (
  formData: VendorPaymentFormData,
  vendorName: string,
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
    vendorId: formData.vendorId,
    vendorName,
    txnDate: formData.txnDate,
    amount: formData.amount,
    bankAccountId: formData.bankAccountId,
    paymentMethod: formData.paymentMethod || undefined,
    referenceNumber: formData.referenceNumber || undefined,
    appliedBills: formData.appliedBills || [],
    memo: formData.memo || undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error',
    createdAt: existingPayment?.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing vendor payment data for editing.
 * 
 * @param payment - Existing vendor payment from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToVendorPaymentFormData = (payment: {
  vendorId: string;
  txnDate: string;
  amount: number;
  bankAccountId: string;
  paymentMethod?: string;
  referenceNumber?: string;
  appliedBills?: Array<{
    billId: string;
    amount: number;
  }>;
  memo?: string;
}): VendorPaymentFormData => {
  return {
    vendorId: payment.vendorId,
    txnDate: payment.txnDate,
    amount: payment.amount,
    bankAccountId: payment.bankAccountId,
    paymentMethod: payment.paymentMethod || '',
    referenceNumber: payment.referenceNumber || '',
    appliedBills: payment.appliedBills || [],
    memo: payment.memo || '',
  };
};
