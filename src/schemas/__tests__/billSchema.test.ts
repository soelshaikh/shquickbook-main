import { describe, it, expect } from 'vitest';
import {
  billFormSchema,
  defaultBillFormValues,
  billFormDataToDomainModel,
  domainModelToBillFormData,
  type BillFormData,
} from '../billSchema';

describe('billFormSchema', () => {
  describe('valid data', () => {
    it('should accept valid bill data', () => {
      const validData: BillFormData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Office Supplies',
            category: 'Office Supplies',
            quantity: 5,
            rate: 20,
            amount: 100,
          },
        ],
        memo: 'Test bill',
      };

      const result = billFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept bill with multiple line items', () => {
      const validData: BillFormData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Item 1',
            category: 'Office Supplies',
            quantity: 2,
            rate: 50,
            amount: 100,
          },
          {
            id: '2',
            description: 'Item 2',
            category: 'Equipment',
            quantity: 1,
            rate: 500,
            amount: 500,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept bill when due date equals transaction date', () => {
      const validData: BillFormData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-01-15', // Same day
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty memo', () => {
      const validData: BillFormData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('required fields', () => {
    it('should reject missing vendorId', () => {
      const invalidData = {
        vendorId: '',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject missing txnDate', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing dueDate', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('date validation', () => {
    it('should reject due date before transaction date', () => {
      const invalidData: BillFormData = {
        vendorId: 'vendor-1',
        txnDate: '2024-02-15',
        dueDate: '2024-01-15', // Before txnDate!
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Due date must be on or after transaction date'
        );
        expect(result.error.errors[0].path).toContain('dueDate');
      }
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '01/15/2024', // Wrong format
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('line items validation', () => {
    it('should reject empty line items array', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('At least one line item is required');
      }
    });

    it('should reject line item with empty description', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: '', // Empty!
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Description is required');
      }
    });

    it('should reject line item with negative quantity', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: -5, // Negative!
            rate: 100,
            amount: -500,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('greater than zero');
      }
    });

    it('should reject line item with zero quantity', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 0, // Zero!
            rate: 100,
            amount: 0,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject line item with negative rate', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: -100, // Negative!
            amount: -100,
          },
        ],
        memo: '',
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('greater than zero');
      }
    });
  });

  describe('memo validation', () => {
    it('should accept memo up to 1000 characters', () => {
      const validData: BillFormData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: 'a'.repeat(1000),
      };

      const result = billFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject memo over 1000 characters', () => {
      const invalidData = {
        vendorId: 'vendor-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Test',
            category: 'Office Supplies',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        memo: 'a'.repeat(1001), // Too long!
      };

      const result = billFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1000 characters');
      }
    });
  });
});

describe('defaultBillFormValues', () => {
  it('should return default form values with correct structure', () => {
    const defaults = defaultBillFormValues();

    expect(defaults).toHaveProperty('vendorId');
    expect(defaults).toHaveProperty('txnDate');
    expect(defaults).toHaveProperty('dueDate');
    expect(defaults).toHaveProperty('lineItems');
    expect(defaults).toHaveProperty('memo');
  });

  it('should have empty vendorId', () => {
    const defaults = defaultBillFormValues();
    expect(defaults.vendorId).toBe('');
  });

  it('should have today as txnDate', () => {
    const defaults = defaultBillFormValues();
    const today = new Date().toISOString().split('T')[0];
    expect(defaults.txnDate).toBe(today);
  });

  it('should have due date 30 days from today', () => {
    const defaults = defaultBillFormValues();
    const expectedDueDate = new Date();
    expectedDueDate.setDate(expectedDueDate.getDate() + 30);
    const expected = expectedDueDate.toISOString().split('T')[0];
    expect(defaults.dueDate).toBe(expected);
  });

  it('should have one default line item', () => {
    const defaults = defaultBillFormValues();
    expect(defaults.lineItems).toHaveLength(1);
    expect(defaults.lineItems[0]).toHaveProperty('id');
    expect(defaults.lineItems[0]).toHaveProperty('description');
    expect(defaults.lineItems[0]).toHaveProperty('quantity');
    expect(defaults.lineItems[0]).toHaveProperty('rate');
    expect(defaults.lineItems[0]).toHaveProperty('amount');
  });

  it('should have empty memo', () => {
    const defaults = defaultBillFormValues();
    expect(defaults.memo).toBe('');
  });
});

describe('billFormDataToDomainModel', () => {
  it('should convert form data to domain model correctly', () => {
    const formData: BillFormData = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Test Item',
          category: 'Office Supplies',
          quantity: 2,
          rate: 50,
          amount: 100,
        },
      ],
      memo: 'Test memo',
    };

    const result = billFormDataToDomainModel(formData, 'Test Vendor');

    expect(result.vendorId).toBe('vendor-1');
    expect(result.vendor).toEqual({ id: 'vendor-1', name: 'Test Vendor' });
    expect(result.txnDate).toBe('2024-01-15');
    expect(result.dueDate).toBe('2024-02-15');
    expect(result.lineItems).toEqual(formData.lineItems);
    expect(result.memo).toBe('Test memo');
  });

  it('should calculate subtotal correctly', () => {
    const formData: BillFormData = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item 1',
          category: 'Office Supplies',
          quantity: 2,
          rate: 50,
          amount: 100,
        },
        {
          id: '2',
          description: 'Item 2',
          category: 'Equipment',
          quantity: 1,
          rate: 200,
          amount: 200,
        },
      ],
      memo: '',
    };

    const result = billFormDataToDomainModel(formData, 'Test Vendor');
    expect(result.subtotal).toBe(300);
  });

  it('should calculate tax at 8.25% of subtotal', () => {
    const formData: BillFormData = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          category: 'Office Supplies',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      memo: '',
    };

    const result = billFormDataToDomainModel(formData, 'Test Vendor');
    expect(result.tax).toBe(8.25); // 100 * 0.0825
  });

  it('should calculate total as subtotal + tax', () => {
    const formData: BillFormData = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          category: 'Office Supplies',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      memo: '',
    };

    const result = billFormDataToDomainModel(formData, 'Test Vendor');
    expect(result.total).toBe(108.25); // 100 + 8.25
    expect(result.balance).toBe(108.25);
  });

  it('should preserve existing bill id when provided', () => {
    const formData: BillFormData = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          category: 'Office Supplies',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      memo: '',
    };

    const existingBill = {
      id: 'bill-123',
      docNumber: 'BILL-001',
      companyId: 'comp-1',
    };

    const result = billFormDataToDomainModel(formData, 'Test Vendor', existingBill);
    expect(result.id).toBe('bill-123');
    expect(result.docNumber).toBe('BILL-001');
  });

  it('should generate new id when not provided', () => {
    const formData: BillFormData = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          category: 'Office Supplies',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      memo: '',
    };

    const result = billFormDataToDomainModel(formData, 'Test Vendor');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
  });
});

describe('domainModelToBillFormData', () => {
  it('should convert domain model to form data correctly', () => {
    const domainModel = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Test Item',
          category: 'Office Supplies',
          quantity: 2,
          rate: 50,
          amount: 100,
        },
      ],
      memo: 'Test memo',
    };

    const result = domainModelToBillFormData(domainModel);

    expect(result.vendorId).toBe('vendor-1');
    expect(result.txnDate).toBe('2024-01-15');
    expect(result.dueDate).toBe('2024-02-15');
    expect(result.lineItems).toEqual(domainModel.lineItems);
    expect(result.memo).toBe('Test memo');
  });

  it('should handle empty memo', () => {
    const domainModel = {
      vendorId: 'vendor-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          category: 'Office Supplies',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
    };

    const result = domainModelToBillFormData(domainModel);
    expect(result.memo).toBe('');
  });
});
