import { VendorPayment } from '@/services/dataService';

export type SyncStatus = 'SYNCED' | 'PENDING_SYNC' | 'FAILED';

const vendors = [
  { id: 'vend-001', name: 'Office Supplies Co' },
  { id: 'vend-002', name: 'Tech Equipment LLC' },
  { id: 'vend-003', name: 'Utilities Provider' },
  { id: 'vend-004', name: 'Cleaning Services Inc' },
  { id: 'vend-005', name: 'Marketing Agency Pro' },
  { id: 'vend-006', name: 'Insurance Brokers Ltd' },
  { id: 'vend-007', name: 'Software Licensing Corp' },
  { id: 'vend-008', name: 'Property Management Co' },
  { id: 'vend-009', name: 'Legal Services Group' },
  { id: 'vend-010', name: 'Cloud Hosting Solutions' },
  { id: 'vend-011', name: 'Telecom Services Inc' },
  { id: 'vend-012', name: 'Shipping & Logistics' },
];

const paymentMethods = ['Check', 'Wire Transfer', 'ACH', 'Credit Card'];
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
      return `CHK-${String(2000 + index).padStart(4, '0')}`;
    case 'Wire Transfer':
      return `WIRE-${new Date().getFullYear()}-${String(index + 100).padStart(3, '0')}`;
    case 'ACH':
      return `ACH-${formatDate(new Date()).replace(/-/g, '')}-${String(index + 100).padStart(3, '0')}`;
    case 'Credit Card':
      return `CC-****${String(5000 + (index % 5000)).slice(-4)}`;
    default:
      return `PAY-${String(index + 1).padStart(4, '0')}`;
  }
}

export function generateMockVendorPayments(count: number = 150): VendorPayment[] {
  const payments: VendorPayment[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(sixMonthsAgo, now);
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const amount = Math.round((Math.random() * 30000 + 200) * 100) / 100;
    const syncStatus = syncStatuses[Math.floor(Math.random() * syncStatuses.length)];
    
    // Generate applied bills (1-2 bills)
    const billCount = Math.floor(Math.random() * 2) + 1;
    const appliedToBills = [];
    let remainingAmount = amount;
    
    for (let j = 0; j < billCount; j++) {
      const billAmount = j === billCount - 1 
        ? remainingAmount 
        : Math.round((remainingAmount / (billCount - j)) * Math.random() * 100) / 100;
      
      appliedToBills.push({
        billId: `bill-${String(Math.floor(Math.random() * 5000) + 1).padStart(4, '0')}`,
        amount: billAmount,
      });
      
      remainingAmount -= billAmount;
    }
    
    payments.push({
      id: `vp-${String(i + 1).padStart(4, '0')}`,
      companyId: 'comp-1',
      vendorId: vendor.id,
      vendorName: vendor.name,
      txnDate: formatDate(txnDate),
      amount,
      paymentMethod,
      referenceNumber: generateReferenceNumber(paymentMethod, i),
      bankAccountId: 'acc-bank-001',
      appliedToBills,
      memo: Math.random() > 0.8 ? 'Regular monthly payment' : undefined,
      syncStatus,
      createdAt: txnDate.toISOString(),
      updatedAt: txnDate.toISOString(),
    });
  }
  
  return payments.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

// Generate 150 vendor payments for performance testing
export const mockVendorPayments = generateMockVendorPayments(150);
export { vendors };
