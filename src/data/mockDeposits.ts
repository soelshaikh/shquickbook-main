import { Deposit } from '@/services/dataService';

export type PaymentType = 'cash' | 'check' | 'creditCard' | 'other';
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

const paymentTypes: PaymentType[] = ['cash', 'check', 'creditCard', 'other'];
const syncStatuses: SyncStatus[] = ['SYNCED', 'SYNCED', 'SYNCED', 'PENDING_SYNC']; // 75% synced

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateLineItems(depositIndex: number): Array<{
  id: string;
  paymentType: PaymentType;
  paymentMethodRef?: string;
  accountId?: string;
  customerId?: string;
  description?: string;
  amount: number;
}> {
  const count = Math.floor(Math.random() * 4) + 1; // 1-4 line items per deposit
  const items = [];
  
  for (let i = 0; i < count; i++) {
    const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
    const amount = Math.round((Math.random() * 15000 + 100) * 100) / 100;
    
    const item: any = {
      id: `line-${Date.now()}-${i}`,
      paymentType,
      amount,
    };
    
    // Add payment method reference for checks
    if (paymentType === 'check') {
      item.paymentMethodRef = `CHK-${String(1000 + depositIndex * 10 + i).padStart(4, '0')}`;
      const customer = customers[Math.floor(Math.random() * customers.length)];
      item.customerId = customer.id;
      item.description = `Payment from ${customer.name}`;
    } else if (paymentType === 'creditCard') {
      const descriptions = [
        'Credit card batch',
        'Online payment portal',
        'POS terminal payments',
        'E-commerce sales',
        'Merchant services deposit',
      ];
      item.description = descriptions[Math.floor(Math.random() * descriptions.length)];
    } else if (paymentType === 'cash') {
      const descriptions = [
        'Cash sales',
        'Petty cash deposit',
        'Daily cash receipts',
        'Counter sales',
      ];
      item.description = descriptions[Math.floor(Math.random() * descriptions.length)];
    } else {
      item.description = 'Miscellaneous payment';
    }
    
    items.push(item);
  }
  
  return items;
}

export function generateMockDeposits(count: number = 100): Deposit[] {
  const deposits: Deposit[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(sixMonthsAgo, now);
    const lineItems = generateLineItems(i);
    const totalAmount = Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const syncStatus = syncStatuses[Math.floor(Math.random() * syncStatuses.length)];
    
    // Generate memo based on line item types
    let memo: string | undefined;
    const hasChecks = lineItems.some(item => item.paymentType === 'check');
    const hasCash = lineItems.some(item => item.paymentType === 'cash');
    const hasCards = lineItems.some(item => item.paymentType === 'creditCard');
    
    if (hasChecks && hasCash && hasCards) {
      memo = 'Mixed deposit - multiple payment types';
    } else if (hasChecks && hasCash) {
      memo = 'Cash and checks deposit';
    } else if (hasChecks) {
      memo = lineItems.length > 1 ? 'Multiple check deposit' : 'Check deposit';
    } else if (hasCards) {
      memo = 'Credit card batch deposit';
    } else if (hasCash) {
      memo = 'Cash deposit';
    }
    
    deposits.push({
      id: `dep-${String(i + 1).padStart(4, '0')}`,
      companyId: 'comp-1',
      txnDate: formatDate(txnDate),
      bankAccountId: 'acc-bank-001',
      bankAccountName: 'Business Checking Account',
      depositToAccountId: 'acc-bank-001',
      depositToAccountName: 'Business Checking Account',
      depositLines: lineItems.map(item => ({
        id: item.id,
        sourceType: item.paymentType === 'check' ? 'customerPayment' : 'other',
        sourceId: item.customerId,
        description: item.description,
        amount: item.amount,
      })),
      lineItems,
      totalAmount,
      referenceNumber: `DEP-${formatDate(txnDate).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
      status: ['pending', 'cleared', 'reconciled'][Math.floor(Math.random() * 3)],
      memo,
      syncStatus,
      createdAt: txnDate.toISOString(),
      updatedAt: txnDate.toISOString(),
    });
  }
  
  return deposits.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

// Generate 100 deposits for performance testing
export const mockDeposits = generateMockDeposits(100);
export { customers };
