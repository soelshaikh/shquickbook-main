import { describe, it, expect } from 'vitest';
import {
  invoiceFormSchema,
  defaultInvoiceFormValues,
  invoiceFormDataToDomainModel,
  domainModelToInvoiceFormData,
  type InvoiceFormData,
} from '../invoiceSchema';

describe('invoiceFormSchema', () => {
  describe('valid data', () => {
    it('should accept valid invoice data', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Consulting Services',
            quantity: 10,
            rate: 150,
            amount: 1500,
          },
        ],
        taxRate: 0.0875,
        memo: 'Monthly consulting',
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept invoice with optional empty due date', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '', // Optional
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept invoice with zero tax rate', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0, // Tax-exempt
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept invoice with 100% tax rate', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 1, // 100%
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept invoice when due date equals transaction date', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-01-15', // Same day
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('required fields', () => {
    it('should reject missing customerId', () => {
      const invalidData = {
        customerId: '',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject missing txnDate', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('date validation', () => {
    it('should reject due date before transaction date when due date is provided', () => {
      const invalidData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-02-15',
        dueDate: '2024-01-15', // Before txnDate!
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Due date must be on or after transaction date'
        );
        expect(result.error.errors[0].path).toContain('dueDate');
      }
    });

    it('should accept invoice when due date is empty (optional)', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '', // Empty is valid
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '01/15/2024', // Wrong format
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('line items validation', () => {
    it('should reject empty line items array', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('At least one line item is required');
      }
    });

    it('should reject line item with empty description', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: '', // Empty!
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Description is required');
      }
    });

    it('should reject line item with negative quantity', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: -5, // Negative!
            rate: 100,
            amount: -500,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('greater than zero');
      }
    });

    it('should reject line item with zero quantity', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 0, // Zero!
            rate: 100,
            amount: 0,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject line item with negative rate', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: -100, // Negative!
            amount: -100,
          },
        ],
        taxRate: 0,
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('greater than zero');
      }
    });
  });

  describe('tax rate validation', () => {
    it('should reject tax rate below 0', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: -0.1, // Negative!
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('between 0 and 1');
      }
    });

    it('should reject tax rate above 1', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 1.5, // Over 100%!
        memo: '',
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('between 0 and 1');
      }
    });
  });

  describe('memo validation', () => {
    it('should accept memo up to 1000 characters', () => {
      const validData: InvoiceFormData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: 'a'.repeat(1000),
      };

      const result = invoiceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject memo over 1000 characters', () => {
      const invalidData = {
        customerId: 'customer-1',
        txnDate: '2024-01-15',
        dueDate: '2024-02-15',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            rate: 100,
            amount: 100,
          },
        ],
        taxRate: 0,
        memo: 'a'.repeat(1001), // Too long!
      };

      const result = invoiceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('1000 characters');
      }
    });
  });
});

describe('defaultInvoiceFormValues', () => {
  it('should return default form values with correct structure', () => {
    const defaults = defaultInvoiceFormValues();

    expect(defaults).toHaveProperty('customerId');
    expect(defaults).toHaveProperty('txnDate');
    expect(defaults).toHaveProperty('dueDate');
    expect(defaults).toHaveProperty('lineItems');
    expect(defaults).toHaveProperty('taxRate');
    expect(defaults).toHaveProperty('memo');
  });

  it('should have empty customerId', () => {
    const defaults = defaultInvoiceFormValues();
    expect(defaults.customerId).toBe('');
  });

  it('should have today as txnDate', () => {
    const defaults = defaultInvoiceFormValues();
    const today = new Date().toISOString().split('T')[0];
    expect(defaults.txnDate).toBe(today);
  });

  it('should have due date 30 days from today', () => {
    const defaults = defaultInvoiceFormValues();
    const expectedDueDate = new Date();
    expectedDueDate.setDate(expectedDueDate.getDate() + 30);
    const expected = expectedDueDate.toISOString().split('T')[0];
    expect(defaults.dueDate).toBe(expected);
  });

  it('should have one default line item', () => {
    const defaults = defaultInvoiceFormValues();
    expect(defaults.lineItems).toHaveLength(1);
  });

  it('should have zero tax rate by default', () => {
    const defaults = defaultInvoiceFormValues();
    expect(defaults.taxRate).toBe(0);
  });

  it('should have empty memo', () => {
    const defaults = defaultInvoiceFormValues();
    expect(defaults.memo).toBe('');
  });
});

describe('invoiceFormDataToDomainModel', () => {
  it('should convert form data to domain model correctly', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Consulting',
          quantity: 10,
          rate: 150,
          amount: 1500,
        },
      ],
      taxRate: 0.0875,
      memo: 'Monthly invoice',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer');

    expect(result.customerId).toBe('customer-1');
    expect(result.customer).toBe('Test Customer');
    expect(result.txnDate).toBe('2024-01-15');
    expect(result.dueDate).toBe('2024-02-15');
    expect(result.lineItems).toEqual(formData.lineItems);
    expect(result.taxRate).toBe(0.0875);
    expect(result.memo).toBe('Monthly invoice');
  });

  it('should calculate subtotal correctly', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item 1',
          quantity: 2,
          rate: 100,
          amount: 200,
        },
        {
          id: '2',
          description: 'Item 2',
          quantity: 1,
          rate: 300,
          amount: 300,
        },
      ],
      taxRate: 0,
      memo: '',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer');
    expect(result.subtotal).toBe(500);
  });

  it('should calculate tax amount correctly', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0.1, // 10%
      memo: '',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer');
    expect(result.taxAmount).toBe(10); // 100 * 0.1
  });

  it('should calculate total as subtotal + tax', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0.1,
      memo: '',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer');
    expect(result.total).toBe(110); // 100 + 10
    expect(result.balance).toBe(110);
  });

  it('should handle empty due date', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '', // Empty
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0,
      memo: '',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer');
    expect(result.dueDate).toBe('');
  });

  it('should preserve existing invoice id when provided', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0,
      memo: '',
    };

    const existingInvoice = {
      id: 'inv-123',
      docNumber: 'INV-001',
      companyId: 'comp-1',
      createdAt: '2024-01-01T00:00:00Z',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer', existingInvoice);
    expect(result.id).toBe('inv-123');
    expect(result.docNumber).toBe('INV-001');
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should generate new id when not provided', () => {
    const formData: InvoiceFormData = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0,
      memo: '',
    };

    const result = invoiceFormDataToDomainModel(formData, 'Test Customer');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
  });
});

describe('domainModelToInvoiceFormData', () => {
  it('should convert domain model to form data correctly', () => {
    const domainModel = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Consulting',
          quantity: 10,
          rate: 150,
          amount: 1500,
        },
      ],
      taxRate: 0.0875,
      memo: 'Monthly invoice',
    };

    const result = domainModelToInvoiceFormData(domainModel);

    expect(result.customerId).toBe('customer-1');
    expect(result.txnDate).toBe('2024-01-15');
    expect(result.dueDate).toBe('2024-02-15');
    expect(result.lineItems).toEqual(domainModel.lineItems);
    expect(result.taxRate).toBe(0.0875);
    expect(result.memo).toBe('Monthly invoice');
  });

  it('should handle missing due date', () => {
    const domainModel = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0,
    };

    const result = domainModelToInvoiceFormData(domainModel);
    expect(result.dueDate).toBe('');
  });

  it('should handle empty memo', () => {
    const domainModel = {
      customerId: 'customer-1',
      txnDate: '2024-01-15',
      dueDate: '2024-02-15',
      lineItems: [
        {
          id: '1',
          description: 'Item',
          quantity: 1,
          rate: 100,
          amount: 100,
        },
      ],
      taxRate: 0,
    };

    const result = domainModelToInvoiceFormData(domainModel);
    expect(result.memo).toBe('');
  });
});
