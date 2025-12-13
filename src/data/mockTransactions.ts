// Mock transaction data for Phase 3

export type TransactionType = 'invoice' | 'bill' | 'payment' | 'expense' | 'journal' | 'deposit';
export type TransactionStatus = 'synced' | 'pending' | 'error' | 'conflict';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  docNumber: string;
  entity: string;
  memo: string;
  amount: number;
  balance: number;
  status: TransactionStatus;
  account: string;
}

// Generate 500 mock transactions
function generateMockTransactions(count: number): Transaction[] {
  const types: TransactionType[] = ['invoice', 'bill', 'payment', 'expense', 'journal', 'deposit'];
  const statuses: TransactionStatus[] = ['synced', 'synced', 'synced', 'synced', 'pending', 'error', 'conflict'];
  
  const entities = [
    'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Smith & Associates',
    'Johnson LLC', 'Prime Consulting', 'Atlas Enterprises', 'Vertex Systems',
    'Omega Holdings', 'Delta Services', 'Sigma Industries', 'Alpha Tech',
    'Beta Manufacturing', 'Gamma Logistics', 'Epsilon Partners', 'Zeta Finance'
  ];
  
  const accounts = [
    'Checking ••4521', 'Savings ••8834', 'Credit Card ••2211',
    'Accounts Receivable', 'Accounts Payable', 'Cash on Hand',
    'Operating Account', 'Payroll Account'
  ];

  const memos = [
    'Monthly retainer', 'Project milestone', 'Consulting services',
    'Software license', 'Office supplies', 'Equipment rental',
    'Travel expenses', 'Marketing services', 'Legal fees',
    'Quarterly payment', 'Annual subscription', 'Maintenance fee'
  ];

  const transactions: Transaction[] = [];
  let runningBalance = 125000.00;

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const isDebit = ['bill', 'expense', 'payment'].includes(type);
    const amount = Math.round((Math.random() * 9500 + 500) * 100) / 100;
    
    runningBalance += isDebit ? -amount : amount;

    const date = new Date();
    date.setDate(date.getDate() - i);

    transactions.push({
      id: `txn-${String(i + 1).padStart(6, '0')}`,
      date: date.toISOString().split('T')[0],
      type,
      docNumber: `${type.charAt(0).toUpperCase()}-${String(1000 + i).padStart(5, '0')}`,
      entity: entities[Math.floor(Math.random() * entities.length)],
      memo: memos[Math.floor(Math.random() * memos.length)],
      amount: isDebit ? -amount : amount,
      balance: Math.round(runningBalance * 100) / 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      account: accounts[Math.floor(Math.random() * accounts.length)],
    });
  }

  return transactions;
}

export const mockTransactions = generateMockTransactions(500);
