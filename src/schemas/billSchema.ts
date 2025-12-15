/**
 * Bill Form Schema
 * 
 * Zod validation schema for Bill forms.
 * Validates vendor bills with line items, dates, and amounts.
 */

import { z } from 'zod';
import {
  dateSchema,
  lineItemsArraySchema,
  memoSchema,
  idSchema,
} from './commonSchemas';

/**
 * Bill Form Schema
 * 
 * Validates the complete bill form including:
 * - Vendor selection (required)
 * - Transaction and due dates (required, with due date >= transaction date)
 * - Line items (at least one required)
 * - Optional memo field
 * 
 * Cross-field validation ensures due date is not before transaction date.
 */
export const billFormSchema = z
  .object({
    vendorId: idSchema.describe('Vendor ID'),
    txnDate: dateSchema.describe('Transaction Date'),
    dueDate: dateSchema.describe('Due Date'),
    lineItems: lineItemsArraySchema.describe('Bill Line Items'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // Ensure due date is not before transaction date
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
export type BillFormData = z.infer<typeof billFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new bills
 */
export const defaultBillFormValues = (): BillFormData => {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Default: 30 days from today
  const dueDateString = dueDate.toISOString().split('T')[0];

  return {
    vendorId: '',
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
    memo: '',
  };
};

/**
 * Convert Bill Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full Bill domain model.
 * This handles calculated fields and data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param vendorName - Vendor name (from vendor lookup)
 * @param existingBill - Optional existing bill for updates
 * @returns Partial Bill object ready for store/service layer
 */
export const billFormDataToDomainModel = (
  formData: BillFormData,
  vendorName: string,
  existingBill?: { id: string; docNumber: string; companyId: string }
) => {
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.round(subtotal * 0.0825 * 100) / 100; // 8.25% default tax rate
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    id: existingBill?.id || crypto.randomUUID(),
    companyId: existingBill?.companyId || 'comp-1',
    docNumber: existingBill?.docNumber || `BILL-${Date.now()}`,
    vendorId: formData.vendorId,
    vendorName,
    txnDate: formData.txnDate,
    dueDate: formData.dueDate,
    lineItems: formData.lineItems,
    lines: formData.lineItems, // Duplicate for compatibility
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    total,
    totalAmount: total,
    balance: total,
    status: (existingBill ? undefined : 'draft') as 'draft' | 'pending' | 'paid' | 'overdue' | 'partial' | undefined,
    paymentStatus: (existingBill ? undefined : 'unpaid') as 'unpaid' | 'partial' | 'paid' | undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error',
    memo: formData.memo || '',
    vendor: {
      id: formData.vendorId,
      name: vendorName,
    },
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing bill data for editing.
 * 
 * @param bill - Existing bill from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToBillFormData = (bill: {
  vendorId: string;
  txnDate: string;
  dueDate: string;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  memo?: string;
}): BillFormData => {
  return {
    vendorId: bill.vendorId,
    txnDate: bill.txnDate,
    dueDate: bill.dueDate,
    lineItems: bill.lineItems,
    memo: bill.memo || '',
  };
};
