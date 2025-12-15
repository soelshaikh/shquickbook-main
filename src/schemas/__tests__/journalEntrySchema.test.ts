import { describe, it, expect } from 'vitest';
import {
  journalEntryFormSchema,
  defaultJournalEntryFormValues,
  journalEntryFormDataToDomainModel,
  domainModelToJournalEntryFormData,
  calculateBalancingAmount,
  type JournalEntryFormData,
} from '../journalEntrySchema';

describe('journalEntryFormSchema', () => {
  describe('valid data', () => {
    it('should accept valid balanced journal entry', () => {
      const validData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment received',
            debit: 1000,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Service revenue',
            debit: 0,
            credit: 1000,
          },
        ],
        memo: 'Monthly revenue',
      };

      const result = journalEntryFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept complex balanced entry with multiple lines', () => {
      const validData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Cash payment',
            debit: 500,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Equipment',
            description: 'Equipment purchase',
            debit: 500,
            credit: 0,
          },
          {
            id: '3',
            accountId: 'acc-3',
            accountName: 'Accounts Payable',
            description: 'Payment to vendor',
            debit: 0,
            credit: 1000,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept entry with decimal amounts', () => {
      const validData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 123.45,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 123.45,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty memo', () => {
      const validData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('required fields', () => {
    it('should reject missing txnDate', () => {
      const invalidData = {
        txnDate: '',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject line with missing accountId', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: '', // Missing!
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject line with missing description', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: '', // Missing!
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Description is required');
      }
    });
  });

  describe('minimum lines validation', () => {
    it('should reject entry with only one line', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'At least two lines are required for a journal entry'
        );
      }
    });

    it('should reject entry with zero lines', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('balanced entry validation', () => {
    it('should reject unbalanced entry (debits > credits)', () => {
      const invalidData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 1000,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 500, // Unbalanced!
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Total debits must equal total credits for a balanced journal entry'
        );
        expect(result.error.errors[0].path).toContain('lines');
      }
    });

    it('should reject unbalanced entry (credits > debits)', () => {
      const invalidData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 500,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 1000, // Unbalanced!
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Total debits must equal total credits for a balanced journal entry'
        );
      }
    });
  });

  describe('XOR validation (debit OR credit, not both)', () => {
    it('should reject line with both debit and credit', () => {
      const invalidData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 500,
            credit: 500, // Both present!
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 0,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Each line must have either a debit or credit amount, not both'
        );
        expect(result.error.errors[0].path).toContain('lines');
      }
    });

    it('should reject line with neither debit nor credit', () => {
      const invalidData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 0, // Neither!
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 0,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Each line must have either a debit or credit amount, not both'
        );
      }
    });
  });

  describe('numeric validation', () => {
    it('should reject line with negative debit', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: -100, // Negative!
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('non-negative');
      }
    });

    it('should reject line with negative credit', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: -100, // Negative!
          },
        ],
        memo: '',
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('non-negative');
      }
    });
  });

  describe('memo validation', () => {
    it('should accept memo up to 1000 characters', () => {
      const validData: JournalEntryFormData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: 'a'.repeat(1000),
      };

      const result = journalEntryFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject memo over 1000 characters', () => {
      const invalidData = {
        txnDate: '2024-01-15',
        lines: [
          {
            id: '1',
            accountId: 'acc-1',
            accountName: 'Cash',
            description: 'Payment',
            debit: 100,
            credit: 0,
          },
          {
            id: '2',
            accountId: 'acc-2',
            accountName: 'Revenue',
            description: 'Income',
            debit: 0,
            credit: 100,
          },
        ],
        memo: 'a'.repeat(1001), // Too long!
      };

      const result = journalEntryFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1000 characters');
      }
    });
  });
});

describe('defaultJournalEntryFormValues', () => {
  it('should return default form values with correct structure', () => {
    const defaults = defaultJournalEntryFormValues();

    expect(defaults).toHaveProperty('txnDate');
    expect(defaults).toHaveProperty('lines');
    expect(defaults).toHaveProperty('memo');
  });

  it('should have today as txnDate', () => {
    const defaults = defaultJournalEntryFormValues();
    const today = new Date().toISOString().split('T')[0];
    expect(defaults.txnDate).toBe(today);
  });

  it('should have two default lines', () => {
    const defaults = defaultJournalEntryFormValues();
    expect(defaults.lines).toHaveLength(2);
  });

  it('should have lines with zero amounts', () => {
    const defaults = defaultJournalEntryFormValues();
    expect(defaults.lines[0].debit).toBe(0);
    expect(defaults.lines[0].credit).toBe(0);
    expect(defaults.lines[1].debit).toBe(0);
    expect(defaults.lines[1].credit).toBe(0);
  });

  it('should have empty memo', () => {
    const defaults = defaultJournalEntryFormValues();
    expect(defaults.memo).toBe('');
  });
});

describe('journalEntryFormDataToDomainModel', () => {
  it('should convert form data to domain model correctly', () => {
    const formData: JournalEntryFormData = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment received',
          debit: 1000,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Revenue',
          description: 'Service revenue',
          debit: 0,
          credit: 1000,
        },
      ],
      memo: 'Monthly revenue',
    };

    const result = journalEntryFormDataToDomainModel(formData);

    expect(result.txnDate).toBe('2024-01-15');
    expect(result.lines).toEqual(formData.lines);
    expect(result.memo).toBe('Monthly revenue');
  });

  it('should calculate total debit correctly', () => {
    const formData: JournalEntryFormData = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment 1',
          debit: 500,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Equipment',
          description: 'Payment 2',
          debit: 300,
          credit: 0,
        },
        {
          id: '3',
          accountId: 'acc-3',
          accountName: 'Revenue',
          description: 'Income',
          debit: 0,
          credit: 800,
        },
      ],
      memo: '',
    };

    const result = journalEntryFormDataToDomainModel(formData);
    expect(result.totalDebit).toBe(800);
  });

  it('should calculate total credit correctly', () => {
    const formData: JournalEntryFormData = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment',
          debit: 800,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Revenue',
          description: 'Income 1',
          debit: 0,
          credit: 500,
        },
        {
          id: '3',
          accountId: 'acc-3',
          accountName: 'Sales',
          description: 'Income 2',
          debit: 0,
          credit: 300,
        },
      ],
      memo: '',
    };

    const result = journalEntryFormDataToDomainModel(formData);
    expect(result.totalCredit).toBe(800);
  });

  it('should preserve existing entry id when provided', () => {
    const formData: JournalEntryFormData = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment',
          debit: 100,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Revenue',
          description: 'Income',
          debit: 0,
          credit: 100,
        },
      ],
      memo: '',
    };

    const existingEntry = {
      id: 'je-123',
      docNumber: 'JE-001',
      companyId: 'comp-1',
      createdAt: '2024-01-01T00:00:00Z',
    };

    const result = journalEntryFormDataToDomainModel(formData, existingEntry);
    expect(result.id).toBe('je-123');
    expect(result.docNumber).toBe('JE-001');
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should generate new id when not provided', () => {
    const formData: JournalEntryFormData = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment',
          debit: 100,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Revenue',
          description: 'Income',
          debit: 0,
          credit: 100,
        },
      ],
      memo: '',
    };

    const result = journalEntryFormDataToDomainModel(formData);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
  });
});

describe('domainModelToJournalEntryFormData', () => {
  it('should convert domain model to form data correctly', () => {
    const domainModel = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment received',
          debit: 1000,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Revenue',
          description: 'Service revenue',
          debit: 0,
          credit: 1000,
        },
      ],
      memo: 'Monthly revenue',
    };

    const result = domainModelToJournalEntryFormData(domainModel);

    expect(result.txnDate).toBe('2024-01-15');
    expect(result.lines).toEqual(domainModel.lines);
    expect(result.memo).toBe('Monthly revenue');
  });

  it('should handle empty memo', () => {
    const domainModel = {
      txnDate: '2024-01-15',
      lines: [
        {
          id: '1',
          accountId: 'acc-1',
          accountName: 'Cash',
          description: 'Payment',
          debit: 100,
          credit: 0,
        },
        {
          id: '2',
          accountId: 'acc-2',
          accountName: 'Revenue',
          description: 'Income',
          debit: 0,
          credit: 100,
        },
      ],
    };

    const result = domainModelToJournalEntryFormData(domainModel);
    expect(result.memo).toBe('');
  });
});

describe('calculateBalancingAmount', () => {
  it('should identify balanced entry', () => {
    const lines = [
      {
        id: '1',
        accountId: 'acc-1',
        accountName: 'Cash',
        description: 'Payment',
        debit: 1000,
        credit: 0,
      },
      {
        id: '2',
        accountId: 'acc-2',
        accountName: 'Revenue',
        description: 'Income',
        debit: 0,
        credit: 1000,
      },
    ];

    const result = calculateBalancingAmount(lines);
    expect(result.isBalanced).toBe(true);
    expect(result.needsDebit).toBe(false);
    expect(result.needsCredit).toBe(false);
    expect(result.amount).toBe(0);
  });

  it('should calculate credit needed when debits exceed credits', () => {
    const lines = [
      {
        id: '1',
        accountId: 'acc-1',
        accountName: 'Cash',
        description: 'Payment',
        debit: 1000,
        credit: 0,
      },
      {
        id: '2',
        accountId: 'acc-2',
        accountName: 'Revenue',
        description: 'Income',
        debit: 0,
        credit: 700,
      },
    ];

    const result = calculateBalancingAmount(lines);
    expect(result.isBalanced).toBe(false);
    expect(result.needsDebit).toBe(false);
    expect(result.needsCredit).toBe(true);
    expect(result.amount).toBe(300);
  });

  it('should calculate debit needed when credits exceed debits', () => {
    const lines = [
      {
        id: '1',
        accountId: 'acc-1',
        accountName: 'Cash',
        description: 'Payment',
        debit: 500,
        credit: 0,
      },
      {
        id: '2',
        accountId: 'acc-2',
        accountName: 'Revenue',
        description: 'Income',
        debit: 0,
        credit: 800,
      },
    ];

    const result = calculateBalancingAmount(lines);
    expect(result.isBalanced).toBe(false);
    expect(result.needsDebit).toBe(true);
    expect(result.needsCredit).toBe(false);
    expect(result.amount).toBe(300);
  });

  it('should handle zero amounts', () => {
    const lines = [
      {
        id: '1',
        accountId: 'acc-1',
        accountName: 'Cash',
        description: 'Payment',
        debit: 0,
        credit: 0,
      },
      {
        id: '2',
        accountId: 'acc-2',
        accountName: 'Revenue',
        description: 'Income',
        debit: 0,
        credit: 0,
      },
    ];

    const result = calculateBalancingAmount(lines);
    expect(result.isBalanced).toBe(true);
    expect(result.amount).toBe(0);
  });

  it('should handle decimal amounts correctly', () => {
    const lines = [
      {
        id: '1',
        accountId: 'acc-1',
        accountName: 'Cash',
        description: 'Payment',
        debit: 123.45,
        credit: 0,
      },
      {
        id: '2',
        accountId: 'acc-2',
        accountName: 'Revenue',
        description: 'Income',
        debit: 0,
        credit: 100.00,
      },
    ];

    const result = calculateBalancingAmount(lines);
    expect(result.isBalanced).toBe(false);
    expect(result.needsCredit).toBe(true);
    expect(result.amount).toBe(23.45);
  });
});
