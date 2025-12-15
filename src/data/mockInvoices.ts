export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'voided';
export type EmailStatus = 'not_sent' | 'sent' | 'delivered' | 'opened' | 'bounced';
export type SyncStatus = 'synced' | 'pending' | 'error' | 'local_only';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  docNumber: string;
  txnDate: string;
  dueDate: string;
  customer: string;
  customerId: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  balance: number;
  status: InvoiceStatus;
  emailStatus: EmailStatus;
  syncStatus: SyncStatus;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

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

const serviceDescriptions = [
  'Consulting Services - Strategy',
  'Software Development - Phase 1',
  'Project Management',
  'Technical Support - Monthly',
  'Training & Workshop',
  'System Integration',
  'Cloud Migration Services',
  'Security Audit',
  'Performance Optimization',
  'UI/UX Design Services',
  'API Development',
  'Database Administration',
];

const statuses: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided'];
const emailStatuses: EmailStatus[] = ['not_sent', 'sent', 'delivered', 'opened', 'bounced'];
const syncStatuses: SyncStatus[] = ['synced', 'pending', 'error', 'local_only'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateLineItems(): InvoiceLineItem[] {
  const count = Math.floor(Math.random() * 4) + 1;
  const items: InvoiceLineItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 10) + 1;
    const rate = Math.round((Math.random() * 500 + 50) * 100) / 100;
    items.push({
      id: `line-${Date.now()}-${i}`,
      description: serviceDescriptions[Math.floor(Math.random() * serviceDescriptions.length)],
      quantity,
      rate,
      amount: Math.round(quantity * rate * 100) / 100,
    });
  }
  
  return items;
}

export function generateMockInvoices(count: number = 150): Invoice[] {
  const invoices: Invoice[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(sixMonthsAgo, now);
    const dueDate = new Date(txnDate);
    dueDate.setDate(dueDate.getDate() + 30);
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const lineItems = generateLineItems();
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = Math.random() > 0.3 ? 0.0875 : 0;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let balance = total;
    if (status === 'paid') balance = 0;
    else if (status === 'partial') balance = Math.round(total * (Math.random() * 0.5 + 0.2) * 100) / 100;
    else if (status === 'voided') balance = 0;
    
    const emailStatus = status === 'draft' ? 'not_sent' : emailStatuses[Math.floor(Math.random() * emailStatuses.length)];
    const syncStatus = syncStatuses[Math.floor(Math.random() * syncStatuses.length)];
    
    invoices.push({
      id: `inv-${String(i + 1).padStart(4, '0')}`,
      companyId: 'comp-1',
      docNumber: `INV-${String(1000 + i).padStart(5, '0')}`,
      txnDate: formatDate(txnDate),
      dueDate: formatDate(dueDate),
      customer: customer.name,
      customerId: customer.id,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      balance,
      status,
      emailStatus,
      syncStatus,
      memo: Math.random() > 0.7 ? 'Net 30 terms. Thank you for your business.' : '',
      createdAt: txnDate.toISOString(),
      updatedAt: txnDate.toISOString(),
    });
  }
  
  return invoices.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

// Generate 12,000 invoices for performance testing
export const mockInvoices = generateMockInvoices(12000);
export { customers };
