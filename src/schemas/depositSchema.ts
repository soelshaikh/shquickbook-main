/**
 * Deposit Form Schema
 * 
 * Zod validation schema for Deposit forms.
 * Validates bank deposits with deposit lines and amounts.
 */

import { z } from 'zod';
import {
  dateSchema,
  memoSchema,
  idSchema,
  amountSchema,
} from './commonSchemas';

/**
 * Deposit Line Schema
 * 
 * Represents a single deposit line with source type, optional source reference, description, and amount.
 */
const depositLineSchema = z.object({
  id: z.string().describe('Unique line ID'),
  sourceType: z.enum(['customerPayment', 'other']).describe('Source Type'),
  sourceId: z.string().optional().describe('Source ID (Optional - for customer payments)'),
  description: z.string().optional().describe('Description (Optional)'),
  amount: amountSchema.refine((val) => val > 0, {
    message: 'Amount must be greater than zero',
  }).describe('Line Amount'),
});

/**
 * Deposit Form Schema
 * 
 * Validates the complete deposit form including:
 * - Transaction date (required)
 * - Bank account (required)
 * - Deposit lines (at least one required)
 * - Reference number (optional)
 * - Optional memo field
 * - Optional status field
 * 
 * Cross-field validation ensures:
 * - At least one deposit line exists
 * - Sum of deposit lines equals totalAmount (±0.01 tolerance for floating point)
 */
export const depositFormSchema = z
  .object({
    txnDate: dateSchema.describe('Transaction Date'),
    bankAccountId: idSchema.describe('Bank Account ID'),
    totalAmount: amountSchema
      .refine((val) => val > 0, {
        message: 'Total amount must be greater than zero',
      })
      .describe('Total Deposit Amount'),
    depositLines: z
      .array(depositLineSchema)
      .min(1, 'At least one deposit line is required')
      .describe('Deposit Lines'),
    referenceNumber: z
      .string()
      .max(100, 'Reference number must be 100 characters or less')
      .optional()
      .describe('Reference Number (Optional)'),
    status: z.string().optional().describe('Status (Optional)'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // Sum of deposit lines must equal total amount
      const linesTotal = data.depositLines.reduce(
        (sum, line) => sum + line.amount,
        0
      );

      // Use small epsilon for floating point comparison
      const epsilon = 0.01;
      return Math.abs(linesTotal - data.totalAmount) < epsilon;
    },
    {
      message: 'Deposit lines must sum to the total amount',
      path: ['depositLines'],
    }
  );

/**
 * Inferred TypeScript Type
 * Use this type for form data throughout the application
 */
export type DepositFormData = z.infer<typeof depositFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new deposits
 */
export const defaultDepositFormValues = (): DepositFormData => {
  const today = new Date().toISOString().split('T')[0];

  return {
    txnDate: today,
    bankAccountId: '',
    totalAmount: 0,
    depositLines: [
      {
        id: crypto.randomUUID(),
        sourceType: 'customerPayment',
        sourceId: '',
        description: '',
        amount: 0,
      },
    ],
    referenceNumber: '',
    status: 'pending',
    memo: '',
  };
};

/**
 * Convert Deposit Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full Deposit domain model.
 * This handles data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param existingDeposit - Optional existing deposit for updates
 * @returns Partial Deposit object ready for store/service layer
 */
export const depositFormDataToDomainModel = (
  formData: DepositFormData,
  existingDeposit?: {
    id: string;
    companyId: string;
    createdAt: string;
  }
) => {
  const now = new Date().toISOString();

  return {
    id: existingDeposit?.id || crypto.randomUUID(),
    companyId: existingDeposit?.companyId || 'comp-1',
    txnDate: formData.txnDate,
    bankAccountId: formData.bankAccountId,
    totalAmount: formData.totalAmount,
    depositLines: formData.depositLines,
    referenceNumber: formData.referenceNumber || undefined,
    status: formData.status || 'pending',
    memo: formData.memo || undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error',
    createdAt: existingDeposit?.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing deposit data for editing.
 * 
 * @param deposit - Existing deposit from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToDepositFormData = (deposit: {
  txnDate: string;
  bankAccountId: string;
  totalAmount: number;
  depositLines: Array<{
    id: string;
    sourceType: 'customerPayment' | 'other';
    sourceId?: string;
    description?: string;
    amount: number;
  }>;
  referenceNumber?: string;
  status?: string;
  memo?: string;
}): DepositFormData => {
  return {
    txnDate: deposit.txnDate,
    bankAccountId: deposit.bankAccountId,
    totalAmount: deposit.totalAmount,
    depositLines: deposit.depositLines,
    referenceNumber: deposit.referenceNumber || '',
    status: deposit.status || 'pending',
    memo: deposit.memo || '',
  };
};
