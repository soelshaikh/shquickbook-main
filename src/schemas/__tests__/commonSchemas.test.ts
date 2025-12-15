import { describe, it, expect } from 'vitest';
import {
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
} from '../commonSchemas';

describe('dateSchema', () => {
  it('should accept valid date in YYYY-MM-DD format', () => {
    const result = dateSchema.safeParse('2024-01-15');
    expect(result.success).toBe(true);
  });

  it('should reject empty string', () => {
    const result = dateSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Date is required');
    }
  });

  it('should reject invalid date format', () => {
    const result = dateSchema.safeParse('01/15/2024');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('YYYY-MM-DD');
    }
  });

  it('should reject partial date', () => {
    const result = dateSchema.safeParse('2024-01');
    expect(result.success).toBe(false);
  });
});

describe('optionalDateSchema', () => {
  it('should accept valid date', () => {
    const result = optionalDateSchema.safeParse('2024-01-15');
    expect(result.success).toBe(true);
  });

  it('should accept empty string', () => {
    const result = optionalDateSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const result = optionalDateSchema.safeParse('01/15/2024');
    expect(result.success).toBe(false);
  });
});

describe('amountSchema', () => {
  it('should accept zero', () => {
    const result = amountSchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it('should accept positive number', () => {
    const result = amountSchema.safeParse(100.50);
    expect(result.success).toBe(true);
  });

  it('should reject negative number', () => {
    const result = amountSchema.safeParse(-50);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('non-negative');
    }
  });

  it('should reject string', () => {
    const result = amountSchema.safeParse('100');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('number');
    }
  });

  it('should reject infinity', () => {
    const result = amountSchema.safeParse(Infinity);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('finite');
    }
  });
});

describe('positiveNumberSchema', () => {
  it('should accept positive number', () => {
    const result = positiveNumberSchema.safeParse(100);
    expect(result.success).toBe(true);
  });

  it('should accept decimal positive number', () => {
    const result = positiveNumberSchema.safeParse(0.01);
    expect(result.success).toBe(true);
  });

  it('should reject zero', () => {
    const result = positiveNumberSchema.safeParse(0);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('greater than zero');
    }
  });

  it('should reject negative number', () => {
    const result = positiveNumberSchema.safeParse(-10);
    expect(result.success).toBe(false);
  });
});

describe('lineItemSchema', () => {
  it('should accept valid line item', () => {
    const validLineItem = {
      id: '1',
      description: 'Test Item',
      quantity: 2,
      rate: 50,
      amount: 100,
    };

    const result = lineItemSchema.safeParse(validLineItem);
    expect(result.success).toBe(true);
  });

  it('should reject line item with empty description', () => {
    const invalidLineItem = {
      id: '1',
      description: '',
      quantity: 2,
      rate: 50,
      amount: 100,
    };

    const result = lineItemSchema.safeParse(invalidLineItem);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Description is required');
    }
  });

  it('should reject line item with zero quantity', () => {
    const invalidLineItem = {
      id: '1',
      description: 'Test',
      quantity: 0,
      rate: 50,
      amount: 0,
    };

    const result = lineItemSchema.safeParse(invalidLineItem);
    expect(result.success).toBe(false);
  });

  it('should reject line item with negative rate', () => {
    const invalidLineItem = {
      id: '1',
      description: 'Test',
      quantity: 2,
      rate: -50,
      amount: -100,
    };

    const result = lineItemSchema.safeParse(invalidLineItem);
    expect(result.success).toBe(false);
  });

  it('should reject description over 500 characters', () => {
    const invalidLineItem = {
      id: '1',
      description: 'a'.repeat(501),
      quantity: 1,
      rate: 100,
      amount: 100,
    };

    const result = lineItemSchema.safeParse(invalidLineItem);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('500 characters');
    }
  });
});

describe('lineItemsArraySchema', () => {
  it('should accept array with one item', () => {
    const validArray = [
      {
        id: '1',
        description: 'Test',
        quantity: 1,
        rate: 100,
        amount: 100,
      },
    ];

    const result = lineItemsArraySchema.safeParse(validArray);
    expect(result.success).toBe(true);
  });

  it('should accept array with multiple items', () => {
    const validArray = [
      {
        id: '1',
        description: 'Item 1',
        quantity: 1,
        rate: 100,
        amount: 100,
      },
      {
        id: '2',
        description: 'Item 2',
        quantity: 2,
        rate: 50,
        amount: 100,
      },
    ];

    const result = lineItemsArraySchema.safeParse(validArray);
    expect(result.success).toBe(true);
  });

  it('should reject empty array', () => {
    const result = lineItemsArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('At least one line item is required');
    }
  });
});

describe('journalEntryLineSchema', () => {
  it('should accept valid journal entry line', () => {
    const validLine = {
      id: '1',
      accountId: 'acc-1',
      accountName: 'Cash',
      description: 'Payment',
      debit: 100,
      credit: 0,
    };

    const result = journalEntryLineSchema.safeParse(validLine);
    expect(result.success).toBe(true);
  });

  it('should reject line with empty accountId', () => {
    const invalidLine = {
      id: '1',
      accountId: '',
      accountName: 'Cash',
      description: 'Payment',
      debit: 100,
      credit: 0,
    };

    const result = journalEntryLineSchema.safeParse(invalidLine);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('required');
    }
  });

  it('should reject line with empty description', () => {
    const invalidLine = {
      id: '1',
      accountId: 'acc-1',
      accountName: 'Cash',
      description: '',
      debit: 100,
      credit: 0,
    };

    const result = journalEntryLineSchema.safeParse(invalidLine);
    expect(result.success).toBe(false);
  });

  it('should reject line with negative debit', () => {
    const invalidLine = {
      id: '1',
      accountId: 'acc-1',
      accountName: 'Cash',
      description: 'Payment',
      debit: -100,
      credit: 0,
    };

    const result = journalEntryLineSchema.safeParse(invalidLine);
    expect(result.success).toBe(false);
  });

  it('should reject line with negative credit', () => {
    const invalidLine = {
      id: '1',
      accountId: 'acc-1',
      accountName: 'Cash',
      description: 'Payment',
      debit: 0,
      credit: -100,
    };

    const result = journalEntryLineSchema.safeParse(invalidLine);
    expect(result.success).toBe(false);
  });
});

describe('journalEntryLinesArraySchema', () => {
  it('should accept array with two lines', () => {
    const validArray = [
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
    ];

    const result = journalEntryLinesArraySchema.safeParse(validArray);
    expect(result.success).toBe(true);
  });

  it('should reject array with only one line', () => {
    const invalidArray = [
      {
        id: '1',
        accountId: 'acc-1',
        accountName: 'Cash',
        description: 'Payment',
        debit: 100,
        credit: 0,
      },
    ];

    const result = journalEntryLinesArraySchema.safeParse(invalidArray);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'At least two lines are required for a journal entry'
      );
    }
  });

  it('should reject empty array', () => {
    const result = journalEntryLinesArraySchema.safeParse([]);
    expect(result.success).toBe(false);
  });
});

describe('billStatusSchema', () => {
  it('should accept valid bill statuses', () => {
    const validStatuses = ['draft', 'pending', 'paid', 'overdue', 'partial'];
    
    validStatuses.forEach(status => {
      const result = billStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = billStatusSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('invoiceStatusSchema', () => {
  it('should accept valid invoice statuses', () => {
    const validStatuses = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided'];
    
    validStatuses.forEach(status => {
      const result = invoiceStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = invoiceStatusSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('journalEntryStatusSchema', () => {
  it('should accept valid journal entry statuses', () => {
    const validStatuses = ['draft', 'posted', 'voided'];
    
    validStatuses.forEach(status => {
      const result = journalEntryStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = journalEntryStatusSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('syncStatusSchema', () => {
  it('should accept valid sync statuses', () => {
    const validStatuses = ['synced', 'pending', 'error', 'local_only'];
    
    validStatuses.forEach(status => {
      const result = syncStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status', () => {
    const result = syncStatusSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('taxRateSchema', () => {
  it('should accept zero tax rate', () => {
    const result = taxRateSchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it('should accept 100% tax rate', () => {
    const result = taxRateSchema.safeParse(1);
    expect(result.success).toBe(true);
  });

  it('should accept decimal tax rate', () => {
    const result = taxRateSchema.safeParse(0.0875);
    expect(result.success).toBe(true);
  });

  it('should reject negative tax rate', () => {
    const result = taxRateSchema.safeParse(-0.1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('between 0 and 1');
    }
  });

  it('should reject tax rate over 100%', () => {
    const result = taxRateSchema.safeParse(1.5);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('between 0 and 1');
    }
  });
});

describe('memoSchema', () => {
  it('should accept empty memo', () => {
    const result = memoSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('should accept memo up to 1000 characters', () => {
    const result = memoSchema.safeParse('a'.repeat(1000));
    expect(result.success).toBe(true);
  });

  it('should reject memo over 1000 characters', () => {
    const result = memoSchema.safeParse('a'.repeat(1001));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('1000 characters');
    }
  });
});

describe('idSchema', () => {
  it('should accept non-empty string', () => {
    const result = idSchema.safeParse('id-123');
    expect(result.success).toBe(true);
  });

  it('should reject empty string', () => {
    const result = idSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('ID is required');
    }
  });
});
