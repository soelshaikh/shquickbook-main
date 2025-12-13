export interface Vendor {
  id: string;
  name: string;
  email?: string;
}

export interface BillLineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Bill {
  id: string;
  docNumber: string;
  txnDate: string;
  dueDate: string;
  vendor: Vendor;
  lineItems: BillLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'partial';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  syncStatus: 'synced' | 'pending' | 'error';
  memo?: string;
}

const vendors: Vendor[] = [
  { id: 'v1', name: 'Office Depot', email: 'billing@officedepot.com' },
  { id: 'v2', name: 'Amazon Web Services', email: 'aws-billing@amazon.com' },
  { id: 'v3', name: 'Google Cloud', email: 'billing@google.com' },
  { id: 'v4', name: 'Staples', email: 'invoices@staples.com' },
  { id: 'v5', name: 'FedEx', email: 'billing@fedex.com' },
  { id: 'v6', name: 'UPS', email: 'invoices@ups.com' },
  { id: 'v7', name: 'Verizon Business', email: 'business@verizon.com' },
  { id: 'v8', name: 'Comcast Business', email: 'billing@comcast.com' },
  { id: 'v9', name: 'Adobe Systems', email: 'billing@adobe.com' },
  { id: 'v10', name: 'Microsoft', email: 'invoices@microsoft.com' },
  { id: 'v11', name: 'Zoom Video', email: 'billing@zoom.us' },
  { id: 'v12', name: 'Slack Technologies', email: 'billing@slack.com' },
  { id: 'v13', name: 'Dropbox', email: 'billing@dropbox.com' },
  { id: 'v14', name: 'Salesforce', email: 'invoices@salesforce.com' },
  { id: 'v15', name: 'HubSpot', email: 'billing@hubspot.com' },
];

const expenseCategories = [
  'Office Supplies',
  'Cloud Services',
  'Software Subscriptions',
  'Shipping & Delivery',
  'Telecommunications',
  'Professional Services',
  'Equipment',
  'Utilities',
  'Marketing',
  'Travel',
];

const statuses: Bill['status'][] = ['draft', 'pending', 'paid', 'overdue', 'partial'];
const paymentStatuses: Bill['paymentStatus'][] = ['unpaid', 'partial', 'paid'];
const syncStatuses: Bill['syncStatus'][] = ['synced', 'pending', 'error'];

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateLineItems(): BillLineItem[] {
  const count = Math.floor(Math.random() * 4) + 1;
  const items: BillLineItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 10) + 1;
    const rate = Math.round((Math.random() * 500 + 10) * 100) / 100;
    items.push({
      id: `li-${i}`,
      description: `${expenseCategories[Math.floor(Math.random() * expenseCategories.length)]} - Item ${i + 1}`,
      category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
      quantity,
      rate,
      amount: Math.round(quantity * rate * 100) / 100,
    });
  }
  
  return items;
}

export function generateMockBills(count: number = 150): Bill[] {
  const bills: Bill[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(startDate, endDate);
    const dueDateObj = new Date(txnDate);
    dueDateObj.setDate(dueDateObj.getDate() + (Math.floor(Math.random() * 3) + 1) * 15); // 15, 30, or 45 days
    
    const lineItems = generateLineItems();
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = Math.round(subtotal * 0.0825 * 100) / 100; // 8.25% tax
    const total = Math.round((subtotal + tax) * 100) / 100;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let balance = total;
    let paymentStatus: Bill['paymentStatus'] = 'unpaid';
    
    if (status === 'paid') {
      balance = 0;
      paymentStatus = 'paid';
    } else if (status === 'partial') {
      balance = Math.round(total * (Math.random() * 0.5 + 0.25) * 100) / 100;
      paymentStatus = 'partial';
    }
    
    bills.push({
      id: `bill-${i + 1}`,
      docNumber: `BILL-${String(i + 1).padStart(5, '0')}`,
      txnDate,
      dueDate: dueDateObj.toISOString().split('T')[0],
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      balance,
      status,
      paymentStatus,
      syncStatus: syncStatuses[Math.floor(Math.random() * syncStatuses.length)],
      memo: Math.random() > 0.7 ? `Reference: PO-${Math.floor(Math.random() * 10000)}` : undefined,
    });
  }
  
  // Sort by date descending
  return bills.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

export const mockBills = generateMockBills();
export const mockVendors = vendors;
