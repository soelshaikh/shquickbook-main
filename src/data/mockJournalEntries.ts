export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  docNumber: string;
  txnDate: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  memo: string;
  status: 'draft' | 'posted' | 'voided';
  syncStatus: 'synced' | 'pending' | 'error' | 'local_only';
  createdAt: string;
  updatedAt: string;
}

const accounts = [
  { id: 'acc-1', name: 'Cash' },
  { id: 'acc-2', name: 'Accounts Receivable' },
  { id: 'acc-3', name: 'Accounts Payable' },
  { id: 'acc-4', name: 'Revenue' },
  { id: 'acc-5', name: 'Cost of Goods Sold' },
  { id: 'acc-6', name: 'Office Expenses' },
  { id: 'acc-7', name: 'Payroll Expenses' },
  { id: 'acc-8', name: 'Rent Expense' },
  { id: 'acc-9', name: 'Utilities Expense' },
  { id: 'acc-10', name: 'Depreciation Expense' },
  { id: 'acc-11', name: 'Accumulated Depreciation' },
  { id: 'acc-12', name: 'Prepaid Expenses' },
  { id: 'acc-13', name: 'Inventory' },
  { id: 'acc-14', name: 'Equipment' },
  { id: 'acc-15', name: 'Owner\'s Equity' },
];

const statuses: JournalEntry['status'][] = ['draft', 'posted', 'voided'];
const syncStatuses: JournalEntry['syncStatus'][] = ['synced', 'pending', 'error', 'local_only'];

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateBalancedLines(): JournalEntryLine[] {
  const lineCount = Math.floor(Math.random() * 3) + 2; // 2-4 lines
  const lines: JournalEntryLine[] = [];
  let totalDebit = 0;
  
  // Generate debit lines
  const debitCount = Math.floor(lineCount / 2) || 1;
  for (let i = 0; i < debitCount; i++) {
    const amount = Math.round((Math.random() * 5000 + 100) * 100) / 100;
    totalDebit += amount;
    const account = accounts[Math.floor(Math.random() * accounts.length)];
    lines.push({
      id: `line-${i}`,
      accountId: account.id,
      accountName: account.name,
      description: `Debit entry ${i + 1}`,
      debit: amount,
      credit: 0,
    });
  }
  
  // Generate credit lines that balance
  const creditCount = lineCount - debitCount;
  let remainingCredit = totalDebit;
  
  for (let i = 0; i < creditCount; i++) {
    const isLast = i === creditCount - 1;
    const amount = isLast 
      ? Math.round(remainingCredit * 100) / 100
      : Math.round((remainingCredit * Math.random() * 0.5 + 0.1) * 100) / 100;
    
    remainingCredit -= amount;
    const account = accounts[Math.floor(Math.random() * accounts.length)];
    lines.push({
      id: `line-${debitCount + i}`,
      accountId: account.id,
      accountName: account.name,
      description: `Credit entry ${i + 1}`,
      debit: 0,
      credit: amount,
    });
  }
  
  return lines;
}

export function generateMockJournalEntries(count: number = 100): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(startDate, endDate);
    const lines = generateBalancedLines();
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
    
    entries.push({
      id: `je-${i + 1}`,
      docNumber: `JE-${String(i + 1).padStart(5, '0')}`,
      txnDate,
      lines,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      memo: Math.random() > 0.5 ? `Adjusting entry for ${txnDate}` : '',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      syncStatus: syncStatuses[Math.floor(Math.random() * syncStatuses.length)],
      createdAt: new Date(txnDate).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  return entries.sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
}

export const mockJournalEntries = generateMockJournalEntries();
export const mockAccounts = accounts;
