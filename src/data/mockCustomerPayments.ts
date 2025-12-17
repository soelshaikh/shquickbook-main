import { CustomerPayment } from '@/services/dataService';

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

const paymentMethods = ['Check', 'Wire Transfer', 'ACH', 'Credit Card', 'Cash'];
const syncStatuses: SyncStatus[] = ['SYNCED', 'SYNCED', 'SYNCED', 'PENDING_SYNC']; // 75% synced

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateReferenceNumber(method: string, index: number): string {
  switch (method) {
    case 'Check':
      return `CHK-${String(1000 + index).padStart(4, '0')}`;
    case 'Wire Transfer':
      return `WIRE-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;
    case 'ACH':
      return `ACH-${formatDate(new Date()).replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`;
    case 'Credit Card':
      return `CC-****${String(1000 + (index % 9000)).slice(-4)}`;
    case 'Cash':
      return `CASH-${String(index + 1).padStart(4, '0')}`;
    default:
      return `PAY-${String(index + 1).padStart(4, '0')}`;
  }
}

export function generateMockCustomerPayments(count: number = 150): CustomerPayment[] {
  const payments: CustomerPayment[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(sixMonthsAgo, now);
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const amount = Math.round((Math.random() * 50000 + 500) * 100) / 100;
    const syncStatus = syncStatuses[Math.floor(Math.random() * syncStatuses.length)];
    
    // Generate applied invoices (1-3 invoices)
    const invoiceCount = Math.floor(Math.random() * 3) + 1;
    const appliedToInvoices = [];
    let remainingAmount = amount;
    
    for (let j = 0; j < invoiceCount; j++) {
      const invoiceAmount = j === invoiceCount - 1 
        ? remainingAmount 
        : Math.round((remainingAmount / (invoiceCount - j)) * Math.random() * 100) / 100;
      
      appliedToInvoices.push({
        invoiceId: `inv-${String(Math.floor(Math.random() * 12000) + 1).padStart(4, '0')}`,
        amount: invoiceAmount,
      });
      
      remainingAmount -= invoiceAmount;
    }
    
    payments.push({
      id: `cp-${String(i + 1).padStart(4, '0')}`,
      companyId: 'comp-1',
      customerId: customer.id,
      customerName: customer.name,
      txnDate: formatDate(txnDate),
      amount,
      paymentMethod,
      referenceNumber: generateReferenceNumber(paymentMethod, i),
      depositToAccountId: 'acc-bank-001',
      appliedToInvoices,
      memo: Math.random() > 0.7 ? 'Thank you for your payment' : undefined,
      syncStatus,
      createdAt: txnDate.toISOString(),
      updatedAt: txnDate.toISOString(),
    });
  }
  
  return payments.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

// Generate 150 customer payments for performance testing
export const mockCustomerPayments = generateMockCustomerPayments(150);
export { customers };
