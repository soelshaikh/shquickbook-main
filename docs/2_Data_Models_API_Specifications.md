# Superhuman for QuickBooks
## Document 2: Data Models & API Specifications

**Version:** 1.0  
**Date:** December 2024  

---

## Table of Contents

1. [Data Models & Schema](#1-data-models--schema)
2. [API Specifications](#2-api-specifications)
3. [WebSocket Events](#3-websocket-events)

---

## 1. Data Models & Schema

### 1.1 Prisma Database Schema (PostgreSQL)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// COMPANIES & AUTHENTICATION
// ============================================

model Company {
  id                String   @id @default(uuid())
  qboRealmId        String   @unique
  companyName       String
  
  // OAuth tokens (encrypted)
  accessToken       String
  refreshToken      String
  tokenExpiresAt    DateTime
  
  // Sync metadata
  lastSyncAt        DateTime?
  syncStatus        SyncStatus @default(PENDING)
  syncError         String?
  
  // Provider info
  provider          String   @default("quickbooks")
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  accounts          Account[]
  customers         Customer[]
  vendors           Vendor[]
  transactions      Transaction[]
  invoices          Invoice[]
  bills             Bill[]
  journalEntries    JournalEntry[]
  
  @@index([qboRealmId])
}

enum SyncStatus {
  PENDING
  SYNCING
  SYNCED
  FAILED
}

// ============================================
// CHART OF ACCOUNTS
// ============================================

model Account {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // QuickBooks reference
  qboId             String
  
  // Account details
  name              String
  accountType       AccountType
  accountSubType    String?
  accountNumber     String?
  description       String?
  
  // Account properties
  active            Boolean  @default(true)
  currentBalance    Decimal  @db.Decimal(19, 4)
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime
  qboUpdatedAt      DateTime
  
  // Relations
  transactionLines  TransactionLine[]
  invoiceLines      InvoiceLine[]
  billLines         BillLine[]
  journalEntryLines JournalEntryLine[]
  
  @@unique([companyId, qboId])
  @@index([companyId, accountType])
  @@index([companyId, active])
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
  OTHER
}

// ============================================
// CUSTOMERS & VENDORS
// ============================================

model Customer {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  qboId             String
  
  displayName       String
  givenName         String?
  familyName        String?
  companyName       String?
  
  email             String?
  phone             String?
  
  billingAddress    Json?    // Structured address
  
  active            Boolean  @default(true)
  balance           Decimal  @db.Decimal(19, 4) @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime
  qboUpdatedAt      DateTime
  
  // Relations
  invoices          Invoice[]
  transactions      Transaction[]
  
  @@unique([companyId, qboId])
  @@index([companyId, active])
  @@index([companyId, displayName])
}

model Vendor {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  qboId             String
  
  displayName       String
  givenName         String?
  familyName        String?
  companyName       String?
  
  email             String?
  phone             String?
  
  address           Json?
  
  active            Boolean  @default(true)
  balance           Decimal  @db.Decimal(19, 4) @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime
  qboUpdatedAt      DateTime
  
  // Relations
  bills             Bill[]
  transactions      Transaction[]
  
  @@unique([companyId, qboId])
  @@index([companyId, active])
  @@index([companyId, displayName])
}

// ============================================
// TRANSACTIONS (General)
// ============================================

model Transaction {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  qboId             String
  
  // Transaction details
  type              TransactionType
  txnDate           DateTime
  amount            Decimal  @db.Decimal(19, 4)
  
  // References
  customerId        String?
  customer          Customer? @relation(fields: [customerId], references: [id])
  vendorId          String?
  vendor            Vendor?   @relation(fields: [vendorId], references: [id])
  
  // Additional fields
  memo              String?
  referenceNumber   String?
  
  // Sync metadata
  syncStatus        EntitySyncStatus @default(SYNCED)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime
  qboUpdatedAt      DateTime
  
  // Relations
  lines             TransactionLine[]
  
  @@unique([companyId, qboId])
  @@index([companyId, type])
  @@index([companyId, txnDate])
  @@index([companyId, customerId])
  @@index([companyId, vendorId])
}

model TransactionLine {
  id                String   @id @default(uuid())
  transactionId     String
  transaction       Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  
  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])
  
  amount            Decimal  @db.Decimal(19, 4)
  description       String?
  
  @@index([transactionId])
  @@index([accountId])
}

enum TransactionType {
  INVOICE
  BILL
  PAYMENT
  DEPOSIT
  JOURNAL_ENTRY
  CREDIT_MEMO
  OTHER
}

enum EntitySyncStatus {
  PENDING_SYNC
  SYNCING
  SYNCED
  SYNC_ERROR
}

// ============================================
// INVOICES
// ============================================

model Invoice {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  qboId             String?  // Null until synced to QBO
  
  // Invoice details
  docNumber         String
  txnDate           DateTime
  dueDate           DateTime?
  
  customerId        String
  customer          Customer @relation(fields: [customerId], references: [id])
  
  // Amounts
  subtotal          Decimal  @db.Decimal(19, 4)
  taxAmount         Decimal  @db.Decimal(19, 4) @default(0)
  totalAmount       Decimal  @db.Decimal(19, 4)
  balance           Decimal  @db.Decimal(19, 4)
  
  // Status
  status            InvoiceStatus @default(DRAFT)
  emailStatus       EmailStatus   @default(NOT_SENT)
  
  // Additional fields
  memo              String?
  privateNote       String?
  
  // Sync metadata
  syncStatus        EntitySyncStatus @default(PENDING_SYNC)
  syncError         String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime?
  qboUpdatedAt      DateTime?
  
  // Relations
  lines             InvoiceLine[]
  
  @@unique([companyId, qboId])
  @@index([companyId, status])
  @@index([companyId, customerId])
  @@index([companyId, txnDate])
  @@index([companyId, syncStatus])
}

model InvoiceLine {
  id                String   @id @default(uuid())
  invoiceId         String
  invoice           Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])
  
  description       String
  quantity          Decimal  @db.Decimal(19, 4)
  unitPrice         Decimal  @db.Decimal(19, 4)
  amount            Decimal  @db.Decimal(19, 4)
  
  @@index([invoiceId])
  @@index([accountId])
}

enum InvoiceStatus {
  DRAFT
  PENDING
  SENT
  PAID
  PARTIALLY_PAID
  OVERDUE
  VOID
}

enum EmailStatus {
  NOT_SENT
  NEED_TO_SEND
  EMAIL_SENT
}

// ============================================
// BILLS
// ============================================

model Bill {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  qboId             String?
  
  // Bill details
  docNumber         String?
  txnDate           DateTime
  dueDate           DateTime?
  
  vendorId          String
  vendor            Vendor   @relation(fields: [vendorId], references: [id])
  
  // Amounts
  subtotal          Decimal  @db.Decimal(19, 4)
  taxAmount         Decimal  @db.Decimal(19, 4) @default(0)
  totalAmount       Decimal  @db.Decimal(19, 4)
  balance           Decimal  @db.Decimal(19, 4)
  
  // Status
  status            BillStatus @default(DRAFT)
  
  // Additional fields
  memo              String?
  privateNote       String?
  
  // Sync metadata
  syncStatus        EntitySyncStatus @default(PENDING_SYNC)
  syncError         String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime?
  qboUpdatedAt      DateTime?
  
  // Relations
  lines             BillLine[]
  
  @@unique([companyId, qboId])
  @@index([companyId, status])
  @@index([companyId, vendorId])
  @@index([companyId, txnDate])
  @@index([companyId, syncStatus])
}

model BillLine {
  id                String   @id @default(uuid())
  billId            String
  bill              Bill     @relation(fields: [billId], references: [id], onDelete: Cascade)
  
  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])
  
  description       String
  quantity          Decimal  @db.Decimal(19, 4)
  unitPrice         Decimal  @db.Decimal(19, 4)
  amount            Decimal  @db.Decimal(19, 4)
  
  @@index([billId])
  @@index([accountId])
}

enum BillStatus {
  DRAFT
  OPEN
  PAID
  PARTIALLY_PAID
  OVERDUE
  VOID
}

// ============================================
// JOURNAL ENTRIES
// ============================================

model JournalEntry {
  id                String   @id @default(uuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  qboId             String?
  
  // JE details
  docNumber         String?
  txnDate           DateTime
  
  // Metadata
  memo              String?
  privateNote       String?
  
  // Sync metadata
  syncStatus        EntitySyncStatus @default(PENDING_SYNC)
  syncError         String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  qboCreatedAt      DateTime?
  qboUpdatedAt      DateTime?
  
  // Relations
  lines             JournalEntryLine[]
  
  @@unique([companyId, qboId])
  @@index([companyId, txnDate])
  @@index([companyId, syncStatus])
}

model JournalEntryLine {
  id                String   @id @default(uuid())
  journalEntryId    String
  journalEntry      JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  
  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])
  
  // Either debit or credit (one must be 0)
  debitAmount       Decimal  @db.Decimal(19, 4) @default(0)
  creditAmount      Decimal  @db.Decimal(19, 4) @default(0)
  
  description       String?
  
  @@index([journalEntryId])
  @@index([accountId])
}

// ============================================
// SYNC JOBS & LOGS
// ============================================

model SyncJob {
  id                String   @id @default(uuid())
  companyId         String
  
  jobType           SyncJobType
  status            JobStatus @default(PENDING)
  
  // Job details
  startedAt         DateTime?
  completedAt       DateTime?
  
  // Results
  entitiesSynced    Int      @default(0)
  errorMessage      String?
  
  createdAt         DateTime @default(now())
  
  @@index([companyId, status])
  @@index([createdAt])
}

enum SyncJobType {
  INITIAL_SYNC
  DELTA_SYNC
  WEBHOOK_SYNC
  MANUAL_SYNC
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### 1.2 IndexedDB Schema (Dexie.js)

```typescript
// src/lib/indexeddb.ts

import Dexie, { Table } from 'dexie'

// Define types matching backend entities
interface Company {
  id: string
  qboRealmId: string
  companyName: string
  lastSyncAt?: string
  syncStatus: string
}

interface Account {
  id: string
  companyId: string
  qboId: string
  name: string
  accountType: string
  currentBalance: number
  active: boolean
}

interface Customer {
  id: string
  companyId: string
  qboId: string
  displayName: string
  email?: string
  balance: number
  active: boolean
}

interface Vendor {
  id: string
  companyId: string
  qboId: string
  displayName: string
  email?: string
  balance: number
  active: boolean
}

interface Transaction {
  id: string
  companyId: string
  qboId: string
  type: string
  txnDate: string
  amount: number
  customerId?: string
  vendorId?: string
  memo?: string
}

interface Invoice {
  id: string
  companyId: string
  qboId?: string
  docNumber: string
  txnDate: string
  customerId: string
  totalAmount: number
  balance: number
  status: string
  syncStatus: string
  lines: InvoiceLine[]
}

interface InvoiceLine {
  id: string
  invoiceId: string
  accountId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Bill {
  id: string
  companyId: string
  qboId?: string
  txnDate: string
  vendorId: string
  totalAmount: number
  balance: number
  status: string
  syncStatus: string
  lines: BillLine[]
}

interface BillLine {
  id: string
  billId: string
  accountId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface JournalEntry {
  id: string
  companyId: string
  qboId?: string
  txnDate: string
  memo?: string
  syncStatus: string
  lines: JournalEntryLine[]
}

interface JournalEntryLine {
  id: string
  journalEntryId: string
  accountId: string
  debitAmount: number
  creditAmount: number
  description?: string
}

// Define database
class AppDatabase extends Dexie {
  companies!: Table<Company>
  accounts!: Table<Account>
  customers!: Table<Customer>
  vendors!: Table<Vendor>
  transactions!: Table<Transaction>
  invoices!: Table<Invoice>
  bills!: Table<Bill>
  journalEntries!: Table<JournalEntry>

  constructor() {
    super('SuperhumanQBO')
    
    this.version(1).stores({
      companies: 'id, qboRealmId',
      accounts: 'id, companyId, [companyId+accountType], [companyId+active]',
      customers: 'id, companyId, [companyId+active], [companyId+displayName]',
      vendors: 'id, companyId, [companyId+active], [companyId+displayName]',
      transactions: 'id, companyId, [companyId+type], [companyId+txnDate], [companyId+customerId], [companyId+vendorId]',
      invoices: 'id, companyId, [companyId+status], [companyId+customerId], [companyId+txnDate], [companyId+syncStatus]',
      bills: 'id, companyId, [companyId+status], [companyId+vendorId], [companyId+txnDate], [companyId+syncStatus]',
      journalEntries: 'id, companyId, [companyId+txnDate], [companyId+syncStatus]',
    })
  }
}

export const db = new AppDatabase()

export type {
  Company,
  Account,
  Customer,
  Vendor,
  Transaction,
  Invoice,
  InvoiceLine,
  Bill,
  BillLine,
  JournalEntry,
  JournalEntryLine,
}
```

### 1.3 Entity Relationships Diagram

```
Company (1) ──< (N) Account
Company (1) ──< (N) Customer
Company (1) ──< (N) Vendor
Company (1) ──< (N) Transaction
Company (1) ──< (N) Invoice
Company (1) ──< (N) Bill
Company (1) ──< (N) JournalEntry

Customer (1) ──< (N) Invoice
Customer (1) ──< (N) Transaction

Vendor (1) ──< (N) Bill
Vendor (1) ──< (N) Transaction

Invoice (1) ──< (N) InvoiceLine
InvoiceLine (N) ──> (1) Account

Bill (1) ──< (N) BillLine
BillLine (N) ──> (1) Account

JournalEntry (1) ──< (N) JournalEntryLine
JournalEntryLine (N) ──> (1) Account

Transaction (1) ──< (N) TransactionLine
TransactionLine (N) ──> (1) Account
```

---

## 2. API Specifications

### 2.1 Authentication Endpoints

**POST /auth/quickbooks**
```typescript
// Initiate OAuth flow

Request: None

Response: {
  redirectUrl: string  // QBO OAuth URL
  state: string        // Security token
}

Example Response:
{
  "redirectUrl": "https://appcenter.intuit.com/connect/oauth2?client_id=...",
  "state": "abc123xyz789"
}
```

**GET /auth/quickbooks/callback**
```typescript
// OAuth callback handler

Query Parameters:
  code: string       // Authorization code from QBO
  state: string      // State token for CSRF protection
  realmId: string    // Company ID in QBO

Response: {
  success: boolean
  companyId: string
  companyName: string
  redirectUrl: string  // Frontend redirect URL
}

Example Response:
{
  "success": true,
  "companyId": "comp-uuid-123",
  "companyName": "Acme Corp",
  "redirectUrl": "http://localhost:5173/dashboard?connected=true"
}
```

**POST /auth/refresh**
```typescript
// Manually refresh access token

Request: {
  companyId: string
}

Response: {
  success: boolean
  expiresAt: string  // ISO timestamp
}
```

### 2.2 Company Endpoints

**GET /companies**
```typescript
// Get all companies for current user

Response: {
  companies: Array<{
    id: string
    companyName: string
    qboRealmId: string
    lastSyncAt: string | null
    syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
    createdAt: string
  }>
}

Example Response:
{
  "companies": [
    {
      "id": "comp-123",
      "companyName": "Acme Corp",
      "qboRealmId": "123456789",
      "lastSyncAt": "2024-12-09T10:30:00Z",
      "syncStatus": "SYNCED",
      "createdAt": "2024-12-01T08:00:00Z"
    }
  ]
}
```

**GET /companies/:id**
```typescript
// Get company details

Response: {
  id: string
  companyName: string
  qboRealmId: string
  lastSyncAt: string | null
  syncStatus: string
  syncError?: string
  createdAt: string
  updatedAt: string
}
```

**POST /companies/:id/sync**
```typescript
// Trigger manual sync

Response: {
  jobId: string
  status: 'PENDING'
  message: string
}

Example Response:
{
  "jobId": "job-abc-123",
  "status": "PENDING",
  "message": "Sync job queued successfully"
}
```

**GET /companies/:id/sync-status**
```typescript
// Get sync status

Response: {
  companyId: string
  lastSyncAt: string
  syncStatus: string
  lastSyncError?: string
  nextScheduledSync?: string
  stats: {
    totalAccounts: number
    totalCustomers: number
    totalVendors: number
    totalTransactions: number
    totalInvoices: number
    totalBills: number
    totalJournalEntries: number
  }
}
```

### 2.3 Transaction Endpoints

**GET /transactions**
```typescript
// Get transactions with filters

Query Parameters:
  companyId: string (required)
  type?: string[]              // ['INVOICE', 'BILL', 'PAYMENT', ...]
  customerId?: string
  vendorId?: string
  accountId?: string
  dateFrom?: string            // ISO date: '2024-01-01'
  dateTo?: string              // ISO date: '2024-12-31'
  minAmount?: number
  maxAmount?: number
  search?: string              // Fuzzy search on memo, reference
  limit?: number (default: 100, max: 1000)
  offset?: number (default: 0)
  sortBy?: string (default: 'txnDate')
  sortOrder?: 'asc' | 'desc' (default: 'desc')

Response: {
  transactions: Array<{
    id: string
    type: string
    txnDate: string
    amount: number
    customerId?: string
    customerName?: string
    vendorId?: string
    vendorName?: string
    memo?: string
    referenceNumber?: string
    syncStatus: string
  }>
  total: number
  limit: number
  offset: number
}

Example Response:
{
  "transactions": [
    {
      "id": "txn-123",
      "type": "INVOICE",
      "txnDate": "2024-12-01",
      "amount": 1500.00,
      "customerId": "cust-456",
      "customerName": "Adobe Inc",
      "memo": "Web Design Services",
      "syncStatus": "SYNCED"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

**GET /transactions/:id**
```typescript
// Get transaction details with lines

Response: {
  id: string
  companyId: string
  qboId: string
  type: string
  txnDate: string
  amount: number
  customer?: {
    id: string
    displayName: string
  }
  vendor?: {
    id: string
    displayName: string
  }
  memo?: string
  referenceNumber?: string
  lines: Array<{
    id: string
    accountId: string
    accountName: string
    amount: number
    description?: string
  }>
  syncStatus: string
  createdAt: string
  updatedAt: string
}
```

**POST /transactions/export**
```typescript
// Export transactions to CSV

Request: {
  companyId: string
  filters: {
    // Same as GET /transactions query params
  }
}

Response: {
  downloadUrl: string
  filename: string
  expiresAt: string
  totalRecords: number
}

Example Response:
{
  "downloadUrl": "https://cdn.yourapp.com/exports/txns-20241209-abc123.csv",
  "filename": "transactions_2024-12-09.csv",
  "expiresAt": "2024-12-09T11:00:00Z",
  "totalRecords": 1543
}
```

### 2.4 Invoice Endpoints

**GET /invoices**
```typescript
// Get invoices with filters

Query Parameters:
  companyId: string (required)
  status?: string[]            // ['DRAFT', 'SENT', 'PAID', ...]
  customerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string              // Search doc number, memo
  limit?: number
  offset?: number

Response: {
  invoices: Array<{
    id: string
    qboId?: string
    docNumber: string
    txnDate: string
    dueDate?: string
    customerId: string
    customerName: string
    subtotal: number
    taxAmount: number
    totalAmount: number
    balance: number
    status: string
    emailStatus: string
    syncStatus: string
  }>
  total: number
}
```

**GET /invoices/:id**
```typescript
// Get invoice details

Response: {
  id: string
  companyId: string
  qboId?: string
  docNumber: string
  txnDate: string
  dueDate?: string
  customer: {
    id: string
    displayName: string
    email?: string
  }
  subtotal: number
  taxAmount: number
  totalAmount: number
  balance: number
  status: string
  emailStatus: string
  memo?: string
  privateNote?: string
  lines: Array<{
    id: string
    accountId: string
    accountName: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  syncStatus: string
  syncError?: string
  createdAt: string
  updatedAt: string
}
```

**POST /invoices**
```typescript
// Create invoice

Request: {
  companyId: string
  customerId: string
  txnDate: string              // ISO date
  dueDate?: string             // ISO date
  lines: Array<{
    accountId: string
    description: string
    quantity: number
    unitPrice: number
  }>
  memo?: string
  privateNote?: string
}

Response: {
  id: string
  docNumber: string
  syncStatus: 'PENDING_SYNC'
  // ... full invoice object
}

Example Request:
{
  "companyId": "comp-123",
  "customerId": "cust-456",
  "txnDate": "2024-12-09",
  "dueDate": "2024-12-31",
  "lines": [
    {
      "accountId": "acc-789",
      "description": "Web Design Services",
      "quantity": 10,
      "unitPrice": 150.00
    }
  ],
  "memo": "December web design work"
}

Example Response:
{
  "id": "inv-abc-123",
  "docNumber": "INV-1001",
  "customerId": "cust-456",
  "txnDate": "2024-12-09",
  "totalAmount": 1500.00,
  "syncStatus": "PENDING_SYNC",
  "lines": [...]
}
```

**PUT /invoices/:id**
```typescript
// Update invoice

Request: {
  customerId?: string
  txnDate?: string
  dueDate?: string
  lines?: Array<{
    accountId: string
    description: string
    quantity: number
    unitPrice: number
  }>
  memo?: string
  privateNote?: string
}

Response: {
  // ... full updated invoice object
}
```

**POST /invoices/:id/duplicate**
```typescript
// Duplicate invoice

Response: {
  // ... new invoice object with:
  // - New ID
  // - Incremented doc number
  // - Today's date
  // - DRAFT status
  // - All lines copied
}
```

**POST /invoices/:id/send**
```typescript
// Send invoice via QBO email

Request: {
  emailTo?: string  // Override customer email (optional)
}

Response: {
  success: boolean
  emailStatus: 'EMAIL_SENT'
  sentAt: string
  sentTo: string
}

Example Response:
{
  "success": true,
  "emailStatus": "EMAIL_SENT",
  "sentAt": "2024-12-09T10:35:00Z",
  "sentTo": "customer@example.com"
}
```

**DELETE /invoices/:id**
```typescript
// Void invoice (soft delete)

Response: {
  success: boolean
  status: 'VOID'
  voidedAt: string
}
```

### 2.5 Bill Endpoints

**GET /bills**
```typescript
// Get bills with filters (similar to invoices)

Query Parameters:
  companyId: string (required)
  status?: string[]
  vendorId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
  offset?: number

Response: {
  bills: Array<{
    id: string
    qboId?: string
    docNumber?: string
    txnDate: string
    vendorId: string
    vendorName: string
    totalAmount: number
    balance: number
    status: string
    syncStatus: string
  }>
  total: number
}
```

**GET /bills/:id**
**POST /bills**
**PUT /bills/:id**
**POST /bills/:id/duplicate**
**DELETE /bills/:id**

*(Similar structure to invoice endpoints)*

### 2.6 Journal Entry Endpoints

**GET /journal-entries**
```typescript
// Get journal entries with filters

Query Parameters:
  companyId: string (required)
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
  offset?: number

Response: {
  journalEntries: Array<{
    id: string
    qboId?: string
    docNumber?: string
    txnDate: string
    memo?: string
    totalDebit: number
    totalCredit: number
    syncStatus: string
  }>
  total: number
}
```

**GET /journal-entries/:id**
```typescript
// Get journal entry details

Response: {
  id: string
  companyId: string
  qboId?: string
  docNumber?: string
  txnDate: string
  memo?: string
  privateNote?: string
  lines: Array<{
    id: string
    accountId: string
    accountName: string
    debitAmount: number
    creditAmount: number
    description?: string
  }>
  syncStatus: string
}
```

**POST /journal-entries**
```typescript
// Create journal entry

Request: {
  companyId: string
  txnDate: string
  lines: Array<{
    accountId: string
    debitAmount: number      // One must be 0
    creditAmount: number     // One must be 0
    description?: string
  }>
  memo?: string
  privateNote?: string
}

// Validation Rule: Sum of debits must equal sum of credits

Response: {
  id: string
  syncStatus: 'PENDING_SYNC'
  // ... full journal entry object
}

Example Request:
{
  "companyId": "comp-123",
  "txnDate": "2024-12-09",
  "lines": [
    {
      "accountId": "acc-cash",
      "debitAmount": 1000.00,
      "creditAmount": 0,
      "description": "Receive payment"
    },
    {
      "accountId": "acc-ar",
      "debitAmount": 0,
      "creditAmount": 1000.00,
      "description": "Clear receivable"
    }
  ],
  "memo": "Payment received from customer"
}
```

**PUT /journal-entries/:id**
**POST /journal-entries/:id/duplicate**
**DELETE /journal-entries/:id**

### 2.7 Reference Data Endpoints

**GET /accounts**
```typescript
// Get chart of accounts

Query Parameters:
  companyId: string (required)
  type?: string[]              // ['ASSET', 'LIABILITY', ...]
  active?: boolean

Response: {
  accounts: Array<{
    id: string
    qboId: string
    name: string
    accountType: string
    accountSubType?: string
    accountNumber?: string
    active: boolean
    currentBalance: number
  }>
}
```

**GET /customers**
```typescript
// Get customers

Query Parameters:
  companyId: string (required)
  active?: boolean
  search?: string

Response: {
  customers: Array<{
    id: string
    qboId: string
    displayName: string
    email?: string
    phone?: string
    balance: number
    active: boolean
  }>
}
```

**GET /vendors**
```typescript
// Get vendors (similar to customers)

Query Parameters:
  companyId: string (required)
  active?: boolean
  search?: string

Response: {
  vendors: Array<{
    id: string
    qboId: string
    displayName: string
    email?: string
    phone?: string
    balance: number
    active: boolean
  }>
}
```

### 2.8 Webhook Endpoint

**POST /webhooks/quickbooks**
```typescript
// QuickBooks webhook notification

Headers:
  intuit-signature: string  // HMAC signature for verification

Request Body:
{
  eventNotifications: Array<{
    realmId: string
    dataChangeEvent: {
      entities: Array<{
        name: string        // 'Invoice', 'Bill', 'Customer', etc.
        id: string          // QBO entity ID
        operation: string   // 'Create', 'Update', 'Delete', 'Merge'
        lastUpdated: string // ISO timestamp
      }>
    }
  }>
}

Response: {
  success: boolean
}

Example Webhook Payload:
{
  "eventNotifications": [
    {
      "realmId": "123456789",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Invoice",
            "id": "1234",
            "operation": "Update",
            "lastUpdated": "2024-12-09T10:30:00Z"
          },
          {
            "name": "Bill",
            "id": "5678",
            "operation": "Create",
            "lastUpdated": "2024-12-09T10:31:00Z"
          }
        ]
      }
    }
  ]
}
```

---

## 3. WebSocket Events

### 3.1 Client → Server Events

**Subscribe to company updates:**
```typescript
{
  event: 'subscribe',
  data: {
    companyId: string
  }
}
```

**Unsubscribe:**
```typescript
{
  event: 'unsubscribe',
  data: {
    companyId: string
  }
}
```

**Heartbeat (keep-alive):**
```typescript
{
  event: 'ping'
}
```

### 3.2 Server → Client Events

**Entity created:**
```typescript
{
  event: 'entity:created',
  data: {
    companyId: string
    entityType: 'invoice' | 'bill' | 'transaction' | 'journalEntry' | 'customer' | 'vendor'
    entityId: string
    entity: { /* full entity object */ }
  }
}

Example:
{
  "event": "entity:created",
  "data": {
    "companyId": "comp-123",
    "entityType": "invoice",
    "entityId": "inv-456",
    "entity": {
      "id": "inv-456",
      "docNumber": "INV-1001",
      "totalAmount": 1500.00,
      ...
    }
  }
}
```

**Entity updated:**
```typescript
{
  event: 'entity:updated',
  data: {
    companyId: string
    entityType: string
    entityId: string
    changes: { /* only changed fields */ }
    entity: { /* full updated entity */ }
  }
}

Example:
{
  "event": "entity:updated",
  "data": {
    "companyId": "comp-123",
    "entityType": "invoice",
    "entityId": "inv-456",
    "changes": {
      "status": "PAID",
      "balance": 0
    },
    "entity": { /* full invoice */ }
  }
}
```

**Entity deleted:**
```typescript
{
  event: 'entity:deleted',
  data: {
    companyId: string
    entityType: string
    entityId: string
  }
}
```

**Sync status update:**
```typescript
{
  event: 'sync:status',
  data: {
    companyId: string
    status: 'SYNCING' | 'SYNCED' | 'FAILED'
    progress?: number      // 0-100
    message?: string
    currentEntity?: string // 'Syncing invoices...'
  }
}

Example:
{
  "event": "sync:status",
  "data": {
    "companyId": "comp-123",
    "status": "SYNCING",
    "progress": 45,
    "message": "Syncing invoices",
    "currentEntity": "invoices"
  }
}
```

**Sync completed:**
```typescript
{
  event: 'sync:completed',
  data: {
    companyId: string
    syncedAt: string
    stats: {
      entitiesSynced: number
      duration: number // milliseconds
      accountsSynced: number
      customersSynced: number
      invoicesSynced: number
      billsSynced: number
    }
  }
}

Example:
{
  "event": "sync:completed",
  "data": {
    "companyId": "comp-123",
    "syncedAt": "2024-12-09T10:35:00Z",
    "stats": {
      "entitiesSynced": 1543,
      "duration": 25000,
      "accountsSynced": 45,
      "customersSynced": 123,
      "invoicesSynced": 567,
      "billsSynced": 234
    }
  }
}
```

**Error notification:**
```typescript
{
  event: 'error',
  data: {
    companyId: string
    code: string
    message: string
    details?: any
  }
}

Example:
{
  "event": "error",
  "data": {
    "companyId": "comp-123",
    "code": "SYNC_FAILED",
    "message": "Failed to sync invoices from QuickBooks",
    "details": {
      "errorType": "RATE_LIMIT",
      "retryAfter": 60
    }
  }
}
```

**Heartbeat response:**
```typescript
{
  event: 'pong',
  data: {
    timestamp: string
  }
}
```

### 3.3 WebSocket Connection Example

```typescript
// Frontend - Connect to WebSocket
import io from 'socket.io-client'

const socket = io('ws://localhost:3000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
})

// Subscribe to company updates
socket.emit('subscribe', {
  companyId: 'comp-123'
})

// Listen for entity updates
socket.on('entity:updated', (data) => {
  console.log('Entity updated:', data)
  // Update local caches
  dataService.handleRealtimeUpdate(data)
})

// Listen for sync completion
socket.on('sync:completed', (data) => {
  console.log('Sync completed:', data)
  toast.success('Sync completed successfully')
})

// Handle disconnection
socket.on('disconnect', () => {
  console.log('WebSocket disconnected')
  // Show offline indicator
})

// Handle reconnection
socket.on('reconnect', () => {
  console.log('WebSocket reconnected')
  // Resubscribe
  socket.emit('subscribe', { companyId: 'comp-123' })
})

// Heartbeat every 30 seconds
setInterval(() => {
  socket.emit('ping')
}, 30000)
```

---

**END OF DOCUMENT 2**

Next Documents:
- Document 3: UI Guidelines, Keyboard Shortcuts & Coding Structure
- Document 4: Security, Sync Strategy & Local-First Caching
- Document 5: Error Handling, Development Setup & Testing
- Document 6: Deployment, DevOps & 8-Week Implementation Plan
