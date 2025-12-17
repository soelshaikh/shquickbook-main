import { CreditMemo } from '@/services/dataService';

export type CreditMemoStatus = 'draft' | 'pending' | 'applied' | 'voided';
export type SyncStatus = 'SYNCED' | 'PENDING_SYNC' | 'FAILED';

const customers = [
  { id: 'cust-001', name: 'Acme Corporation' },
  { id: 'cust-002', name: 'TechStart Inc.' },
  { id: 'cust-003', name: 'Global Dynamics LLC' },
  { id: 'cust-004', name: 'Pinnacle Ventures' },
  { id: 'cust-005', name: 'Summit Holdings' },
  { id: 'cust-006', name: 'Blue Ocean Partners' },
  { id: 'cust-007', name: 'Evergreen Solutions' },
  { id: 'cust-008', name: 'Stellar Systems' },
  { id: 'cust-009', name: 'Phoenix Enterprises' },
  { id: 'cust-010', name: 'Atlas Industries' },
  { id: 'cust-011', name: 'Quantum Labs' },
  { id: 'cust-012', name: 'Horizon Group' },
];

const reasons = [
  'Returned defective items',
  'Service quality adjustment',
  'Pricing error correction',
  'Damaged goods return',
  'Billing error adjustment',
  'Cancelled order refund',
  'Goodwill credit',
  'Partial refund per agreement',
  'Product recall credit',
  'Service delay compensation',
];

const statuses: CreditMemoStatus[] = ['draft', 'pending', 'applied', 'applied', 'applied']; // 60% applied
const syncStatuses: SyncStatus[] = ['SYNCED', 'SYNCED', 'SYNCED', 'PENDING_SYNC']; // 75% synced

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateLineItems(): Array<{
  id: string;
  accountId: string;
  accountName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}> {
  const count = Math.floor(Math.random() * 2) + 1; // 1-2 line items
  const items = [];
  
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = Math.round((Math.random() * 500 + 50) * 100) / 100;
    items.push({
      id: `line-${Date.now()}-${i}`,
      accountId: 'acc-revenue-001',
      accountName: Math.random() > 0.5 ? 'Product Sales' : 'Service Revenue',
      description: reasons[Math.floor(Math.random() * reasons.length)],
      quantity,
      unitPrice,
      amount: Math.round(quantity * unitPrice * 100) / 100,
    });
  }
  
  return items;
}

export function generateMockCreditMemos(count: number = 100): CreditMemo[] {
  const creditMemos: CreditMemo[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(sixMonthsAgo, now);
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const lineItems = generateLineItems();
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = Math.random() > 0.3 ? 0.0825 : 0;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const syncStatus = syncStatuses[Math.floor(Math.random() * syncStatuses.length)];
    
    // 70% of credit memos reference an invoice
    const hasInvoiceRef = Math.random() > 0.3;
    
    creditMemos.push({
      id: `cm-${String(i + 1).padStart(4, '0')}`,
      companyId: 'comp-1',
      customerId: customer.id,
      customerName: customer.name,
      invoiceId: hasInvoiceRef ? `inv-${String(Math.floor(Math.random() * 12000) + 1).padStart(4, '0')}` : undefined,
      txnDate: formatDate(txnDate),
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      totalAmount: total,
      status,
      memo: Math.random() > 0.6 ? lineItems[0].description : undefined,
      syncStatus,
      createdAt: txnDate.toISOString(),
      updatedAt: txnDate.toISOString(),
    });
  }
  
  return creditMemos.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

// Generate 100 credit memos for performance testing
export const mockCreditMemos = generateMockCreditMemos(100);
export { customers };
