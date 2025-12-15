/**
 * Journal Entry Form Schema
 * 
 * Zod validation schema for Journal Entry forms.
 * Validates double-entry bookkeeping journal entries with balanced debits and credits.
 */

import { z } from 'zod';
import {
  dateSchema,
  journalEntryLinesArraySchema,
  memoSchema,
} from './commonSchemas';

/**
 * Journal Entry Form Schema
 * 
 * Validates the complete journal entry form including:
 * - Transaction date (required)
 * - Lines (at least two required for double-entry)
 * - Optional memo field
 * 
 * Cross-field validation ensures total debits equal total credits (balanced entry).
 * This is a fundamental accounting principle for double-entry bookkeeping.
 */
export const journalEntryFormSchema = z
  .object({
    txnDate: dateSchema.describe('Transaction Date'),
    lines: journalEntryLinesArraySchema.describe('Journal Entry Lines'),
    memo: memoSchema.describe('Optional memo or notes'),
  })
  .refine(
    (data) => {
      // Calculate total debits and credits
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
      
      // Round to 2 decimal places to handle floating point precision issues
      const roundedDebit = Math.round(totalDebit * 100) / 100;
      const roundedCredit = Math.round(totalCredit * 100) / 100;
      
      return roundedDebit === roundedCredit;
    },
    {
      message: 'Total debits must equal total credits for a balanced journal entry',
      path: ['lines'],
    }
  )
  .refine(
    (data) => {
      // Ensure each line has either debit OR credit, not both
      return data.lines.every(line => {
        const hasDebit = line.debit > 0;
        const hasCredit = line.credit > 0;
        // Valid if exactly one is true (XOR logic)
        return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
      });
    },
    {
      message: 'Each line must have either a debit or credit amount, not both',
      path: ['lines'],
    }
  );

/**
 * Inferred TypeScript Type
 * Use this type for form data throughout the application
 */
export type JournalEntryFormData = z.infer<typeof journalEntryFormSchema>;

/**
 * Default Form Values
 * Provides initial state for creating new journal entries
 */
export const defaultJournalEntryFormValues = (): JournalEntryFormData => {
  const today = new Date().toISOString().split('T')[0];

  return {
    txnDate: today,
    lines: [
      {
        id: crypto.randomUUID(),
        accountId: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
      },
      {
        id: crypto.randomUUID(),
        accountId: '',
        accountName: '',
        description: '',
        debit: 0,
        credit: 0,
      },
    ],
    memo: '',
  };
};

/**
 * Convert Journal Entry Form Data to Domain Model
 * 
 * Helper function to transform validated form data into the full JournalEntry domain model.
 * This handles calculated fields and data structure mapping.
 * 
 * @param formData - Validated form data from React Hook Form
 * @param existingEntry - Optional existing journal entry for updates
 * @returns Partial JournalEntry object ready for store/service layer
 */
export const journalEntryFormDataToDomainModel = (
  formData: JournalEntryFormData,
  existingEntry?: {
    id: string;
    docNumber: string;
    companyId: string;
    createdAt: string;
  }
) => {
  const totalDebit = formData.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + line.credit, 0);

  const now = new Date().toISOString();

  return {
    id: existingEntry?.id || crypto.randomUUID(),
    companyId: existingEntry?.companyId || 'comp-1',
    docNumber: existingEntry?.docNumber || `JE-${Date.now()}`,
    txnDate: formData.txnDate,
    lines: formData.lines,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    memo: formData.memo || '',
    status: (existingEntry ? undefined : 'draft') as 'draft' | 'posted' | 'voided' | undefined,
    syncStatus: 'pending' as 'synced' | 'pending' | 'error' | 'local_only',
    createdAt: existingEntry?.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Populate Form from Domain Model
 * 
 * Helper function to populate form with existing journal entry data for editing.
 * 
 * @param entry - Existing journal entry from data layer
 * @returns Form data ready for React Hook Form
 */
export const domainModelToJournalEntryFormData = (entry: {
  txnDate: string;
  lines: Array<{
    id: string;
    accountId: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
  }>;
  memo?: string;
}): JournalEntryFormData => {
  return {
    txnDate: entry.txnDate,
    lines: entry.lines,
    memo: entry.memo || '',
  };
};

/**
 * Helper: Calculate Balancing Amount
 * 
 * Utility function to calculate the balancing debit or credit needed
 * to balance the journal entry. Useful for auto-completing entries.
 * 
 * @param lines - Current journal entry lines
 * @returns Object with balance info and suggested amount
 */
export const calculateBalancingAmount = (lines: JournalEntryFormData['lines']) => {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  
  if (difference === 0) {
    return {
      isBalanced: true,
      needsDebit: false,
      needsCredit: false,
      amount: 0,
    };
  } else if (difference > 0) {
    // Debits exceed credits, need more credit
    return {
      isBalanced: false,
      needsDebit: false,
      needsCredit: true,
      amount: Math.abs(difference),
    };
  } else {
    // Credits exceed debits, need more debit
    return {
      isBalanced: false,
      needsDebit: true,
      needsCredit: false,
      amount: Math.abs(difference),
    };
  }
};
