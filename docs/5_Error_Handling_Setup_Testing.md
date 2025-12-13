# Superhuman for QuickBooks
## Document 5: Error Handling, Development Setup & Testing

**Version:** 1.0  
**Date:** December 2024  

---

## Table of Contents

1. [Error Handling](#1-error-handling)
2. [Development Setup](#2-development-setup)
3. [Testing Strategy](#3-testing-strategy)

---

## 1. Error Handling

### 1.1 Error Categories & Handling

**Network Errors:**

```typescript
// network-error.handler.ts
export class NetworkErrorHandler {
  handle(error: any) {
    if (!navigator.onLine) {
      return {
        type: 'OFFLINE',
        message: 'You are currently offline. Changes will sync when connection is restored.',
        action: 'QUEUE',
        severity: 'WARNING',
      }
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        action: 'RETRY',
        severity: 'ERROR',
      }
    }
    
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet.',
      action: 'RETRY',
      severity: 'ERROR',
    }
  }
}
```

**Authentication Errors:**

```typescript
// auth-error.handler.ts
export class AuthErrorHandler {
  handle(error: any) {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'TOKEN_EXPIRED') {
        return {
          type: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please reconnect to QuickBooks.',
          action: 'REAUTH',
          severity: 'ERROR',
        }
      }
      
      return {
        type: 'UNAUTHORIZED',
        message: 'Authentication failed. Please sign in again.',
        action: 'REAUTH',
        severity: 'ERROR',
      }
    }
    
    if (error.response?.status === 403) {
      return {
        type: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
        action: 'NOTIFY',
        severity: 'ERROR',
      }
    }
    
    return null
  }
}
```

**Validation Errors:**

```typescript
// validation-error.handler.ts
export class ValidationErrorHandler {
  handle(error: any) {
    if (error.response?.status === 400) {
      const { errors } = error.response.data
      
      return {
        type: 'VALIDATION_ERROR',
        message: 'Please fix the following errors:',
        action: 'SHOW_ERRORS',
        severity: 'WARNING',
        errors: this.formatErrors(errors),
      }
    }
    
    return null
  }
  
  private formatErrors(errors: any[]): Record<string, string> {
    const formatted: Record<string, string> = {}
    
    for (const error of errors) {
      formatted[error.field] = error.message
    }
    
    return formatted
  }
}
```

**QuickBooks API Errors:**

```typescript
// qbo-error.handler.ts
export class QBOErrorHandler {
  handle(error: any) {
    const qboError = error.response?.data?.Fault?.Error?.[0]
    
    if (!qboError) return null
    
    switch (qboError.code) {
      case '429':
        return {
          type: 'RATE_LIMIT',
          message: 'Too many requests. Please wait a moment.',
          action: 'RETRY_AFTER',
          severity: 'WARNING',
          retryAfter: 60, // seconds
        }
      
      case '3200':
        return {
          type: 'STALE_OBJECT',
          message: 'This record was modified by another user.',
          action: 'CONFLICT',
          severity: 'ERROR',
        }
      
      case '6000':
        return {
          type: 'BUSINESS_VALIDATION',
          message: qboError.Message,
          action: 'NOTIFY',
          severity: 'ERROR',
        }
      
      default:
        return {
          type: 'QBO_ERROR',
          message: qboError.Message || 'QuickBooks error occurred',
          action: 'NOTIFY',
          severity: 'ERROR',
          code: qboError.code,
        }
    }
  }
}
```

**Sync Errors:**

```typescript
// sync-error.handler.ts
export class SyncErrorHandler {
  handle(error: any, context: { entityType: string; entityId: string }) {
    return {
      type: 'SYNC_ERROR',
      message: `Failed to sync ${context.entityType} (${context.entityId})`,
      action: 'MARK_ERROR',
      severity: 'ERROR',
      context,
      originalError: error,
    }
  }
}
```

### 1.2 Global Error Handler

```typescript
// error-handler.service.ts
@Injectable()
export class ErrorHandlerService {
  private handlers = [
    new NetworkErrorHandler(),
    new AuthErrorHandler(),
    new ValidationErrorHandler(),
    new QBOErrorHandler(),
    new SyncErrorHandler(),
  ]
  
  handle(error: any, context?: any) {
    // Try each handler
    for (const handler of this.handlers) {
      const result = handler.handle(error, context)
      if (result) {
        this.processErrorResult(result)
        return result
      }
    }
    
    // Unknown error
    return this.handleUnknownError(error)
  }
  
  private processErrorResult(result: ErrorResult) {
    // Log to monitoring service
    if (result.severity === 'ERROR') {
      this.logToSentry(result)
    }
    
    // Execute action
    switch (result.action) {
      case 'RETRY':
        // Queue for retry
        break
      
      case 'REAUTH':
        // Trigger re-authentication
        break
      
      case 'NOTIFY':
        // Show user notification
        break
      
      case 'CONFLICT':
        // Show conflict resolution UI
        break
      
      case 'MARK_ERROR':
        // Mark entity as error state
        break
    }
  }
  
  private handleUnknownError(error: any) {
    console.error('Unhandled error:', error)
    
    return {
      type: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      action: 'NOTIFY',
      severity: 'ERROR',
    }
  }
  
  private logToSentry(result: ErrorResult) {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(result, {
        level: result.severity.toLowerCase(),
        extra: result,
      })
    }
  }
}
```

### 1.3 User-Facing Error Messages

```typescript
// error-messages.ts
export const ERROR_MESSAGES = {
  // Network
  OFFLINE: 'You are currently offline. Changes will sync when connection is restored.',
  TIMEOUT: 'Request timed out. Please try again.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  
  // Auth
  TOKEN_EXPIRED: 'Your session has expired. Please reconnect to QuickBooks.',
  UNAUTHORIZED: 'Authentication failed. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  
  // Validation
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `${field} has an invalid format`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must be no more than ${max}`,
  
  // QuickBooks
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  STALE_OBJECT: 'This record was modified by another user. Please refresh and try again.',
  BUSINESS_VALIDATION: (msg: string) => `QuickBooks validation: ${msg}`,
  
  // Sync
  SYNC_FAILED: 'Failed to sync with QuickBooks. Your changes are saved locally.',
  SYNC_CONFLICT: 'This record was updated in QuickBooks. Your local changes conflict.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  SERVER_ERROR: 'Server error. Please try again or contact support.',
}

// Usage
toast.error(ERROR_MESSAGES.TOKEN_EXPIRED)
toast.error(ERROR_MESSAGES.REQUIRED_FIELD('Customer'))
```

### 1.4 Retry Logic

```typescript
// retry.util.ts
export interface RetryConfig {
  maxAttempts: number
  backoffType: 'fixed' | 'exponential'
  delay: number // milliseconds
  maxDelay?: number
  retryableErrors?: (error: any) => boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  const {
    maxAttempts,
    backoffType,
    delay,
    maxDelay = 60000,
    retryableErrors = () => true,
  } = config
  
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Check if error is retryable
      if (!retryableErrors(error)) {
        throw error
      }
      
      // Last attempt
      if (attempt === maxAttempts) {
        throw error
      }
      
      // Calculate delay
      let waitTime = delay
      if (backoffType === 'exponential') {
        waitTime = Math.min(delay * Math.pow(2, attempt - 1), maxDelay)
      }
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${waitTime}ms`)
      
      await sleep(waitTime)
    }
  }
  
  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Usage
const invoice = await withRetry(
  () => apiClient.post('/invoices', data),
  {
    maxAttempts: 3,
    backoffType: 'exponential',
    delay: 1000,
    retryableErrors: (error) => {
      // Only retry on network errors or 5xx
      return (
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500
      )
    },
  },
)
```

### 1.5 Error Boundary (React)

```typescript
// ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught:', error, errorInfo)
    
    // Log to Sentry
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, {
        extra: errorInfo,
      })
    }
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-secondary mb-6">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Usage in App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## 2. Development Setup

### 2.1 Prerequisites

```bash
# Required software
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 7.x
- Docker (optional, recommended)
- Git
```

### 2.2 Backend Setup

**Step 1: Clone & Install**

```bash
# Clone repository
git clone https://github.com/yourorg/superhuman-qbo.git
cd superhuman-qbo

# Install backend dependencies
cd backend
npm install
```

**Step 2: Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

```bash
# .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/superhuman_qbo"
REDIS_HOST="localhost"
REDIS_PORT=6379

# QuickBooks Sandbox Credentials
QBO_CLIENT_ID="your_sandbox_client_id"
QBO_CLIENT_SECRET="your_sandbox_client_secret"
QBO_REDIRECT_URI="http://localhost:3000/auth/quickbooks/callback"
QBO_ENVIRONMENT="sandbox"
QBO_WEBHOOK_TOKEN="your_webhook_token"

# Generate encryption key
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

**Step 3: Database Setup**

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

**Step 4: Run Backend**

```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Backend should be running on http://localhost:3000
```

### 2.3 Frontend Setup

**Step 1: Install Dependencies**

```bash
cd ../frontend
npm install
```

**Step 2: Environment Configuration**

```bash
cp .env.example .env
```

```bash
# .env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

**Step 3: Run Frontend**

```bash
# Development mode (hot reload)
npm run dev

# Build for production
npm run build
npm run preview

# Frontend should be running on http://localhost:5173
```

### 2.4 Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: superhuman-qbo-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: superhuman_qbo
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    container_name: superhuman-qbo-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Reset database
docker-compose down -v
docker-compose up -d
```

### 2.5 VSCode Configuration

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss"
  ]
}
```

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 2.6 Useful Scripts

```json
// backend/package.json scripts
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

```json
// frontend/package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 3. Testing Strategy

### 3.1 Testing Pyramid

```
        /\
       /  \       10% - E2E Tests (Critical user flows)
      /____\
     /      \     20% - Integration Tests (API endpoints)
    /________\
   /          \   70% - Unit Tests (Business logic)
  /__________  \
```

**Coverage Targets:**
- Overall: 80%+
- Critical paths: 90%+
- Business logic: 95%+

### 3.2 Unit Tests (Backend)

**Example: Invoice Service**

```typescript
// invoices.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { InvoicesService } from './invoices.service'
import { PrismaService } from '../prisma/prisma.service'
import { AccountingAdapter } from '../accounting/interfaces/accounting-adapter.interface'

describe('InvoicesService', () => {
  let service: InvoicesService
  let prisma: PrismaService
  let adapter: AccountingAdapter
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: 'AccountingAdapter',
          useValue: {
            createInvoice: jest.fn(),
            getInvoice: jest.fn(),
          },
        },
      ],
    }).compile()
    
    service = module.get<InvoicesService>(InvoicesService)
    prisma = module.get<PrismaService>(PrismaService)
    adapter = module.get<AccountingAdapter>('AccountingAdapter')
  })
  
  describe('create', () => {
    it('should create invoice with PENDING_SYNC status', async () => {
      const dto = {
        companyId: 'comp-123',
        customerId: 'cust-456',
        txnDate: '2024-12-09',
        lines: [
          {
            accountId: 'acc-789',
            description: 'Web Design',
            quantity: 10,
            unitPrice: 150,
          },
        ],
      }
      
      const mockInvoice = {
        id: 'inv-123',
        ...dto,
        syncStatus: 'PENDING_SYNC',
        totalAmount: 1500,
      }
      
      jest.spyOn(prisma.invoice, 'create').mockResolvedValue(mockInvoice as any)
      
      const result = await service.create(dto)
      
      expect(result).toEqual(mockInvoice)
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: dto.companyId,
          syncStatus: 'PENDING_SYNC',
        }),
      })
    })
    
    it('should calculate totalAmount correctly', async () => {
      const dto = {
        companyId: 'comp-123',
        customerId: 'cust-456',
        txnDate: '2024-12-09',
        lines: [
          { accountId: 'acc-1', description: 'Item 1', quantity: 2, unitPrice: 100 },
          { accountId: 'acc-2', description: 'Item 2', quantity: 3, unitPrice: 50 },
        ],
      }
      
      const result = await service.create(dto)
      
      expect(result.totalAmount).toBe(350) // (2*100) + (3*50)
    })
  })
  
  describe('send', () => {
    it('should call adapter.sendInvoice', async () => {
      const invoiceId = 'inv-123'
      
      jest.spyOn(adapter, 'sendInvoice').mockResolvedValue(undefined)
      jest.spyOn(prisma.invoice, 'update').mockResolvedValue({} as any)
      
      await service.send(invoiceId)
      
      expect(adapter.sendInvoice).toHaveBeenCalledWith(invoiceId)
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { emailStatus: 'EMAIL_SENT' },
      })
    })
  })
})
```

**Example: Data Service (Frontend)**

```typescript
// data-service.spec.ts
import { dataService } from './data-service'
import { apiClient } from './api-client'
import { db } from '@/lib/indexeddb'

jest.mock('./api-client')
jest.mock('@/lib/indexeddb')

describe('DataService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('getTransactions', () => {
    it('should return from memory cache if available', async () => {
      const mockTransactions = [{ id: '1', amount: 100 }]
      
      // Populate cache
      dataService['transactionCache'].set('transactions:{}', mockTransactions)
      
      const result = await dataService.getTransactions({})
      
      expect(result).toEqual(mockTransactions)
      expect(apiClient.get).not.toHaveBeenCalled()
    })
    
    it('should fetch from API on cache miss', async () => {
      const mockTransactions = [{ id: '1', amount: 100 }]
      
      jest.spyOn(apiClient, 'get').mockResolvedValue({
        data: { transactions: mockTransactions },
      })
      
      const result = await dataService.getTransactions({})
      
      expect(result).toEqual(mockTransactions)
      expect(apiClient.get).toHaveBeenCalledWith('/transactions', expect.any(Object))
    })
  })
})
```

### 3.3 Integration Tests (Backend)

```typescript
// invoices.controller.spec.ts
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'

describe('Invoices (e2e)', () => {
  let app: INestApplication
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    
    app = moduleFixture.createNestApplication()
    await app.init()
  })
  
  afterAll(async () => {
    await app.close()
  })
  
  describe('POST /invoices', () => {
    it('should create invoice', () => {
      return request(app.getHttpServer())
        .post('/invoices')
        .send({
          companyId: 'comp-123',
          customerId: 'cust-456',
          txnDate: '2024-12-09',
          lines: [
            {
              accountId: 'acc-789',
              description: 'Web Design',
              quantity: 10,
              unitPrice: 150,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id')
          expect(res.body.syncStatus).toBe('PENDING_SYNC')
          expect(res.body.totalAmount).toBe(1500)
        })
    })
    
    it('should return 400 on validation error', () => {
      return request(app.getHttpServer())
        .post('/invoices')
        .send({
          companyId: 'comp-123',
          // Missing customerId
          txnDate: '2024-12-09',
          lines: [],
        })
        .expect(400)
    })
  })
  
  describe('GET /invoices/:id', () => {
    it('should return invoice', async () => {
      // First create invoice
      const createRes = await request(app.getHttpServer())
        .post('/invoices')
        .send({
          companyId: 'comp-123',
          customerId: 'cust-456',
          txnDate: '2024-12-09',
          lines: [
            { accountId: 'acc-789', description: 'Test', quantity: 1, unitPrice: 100 },
          ],
        })
      
      const invoiceId = createRes.body.id
      
      // Then fetch it
      return request(app.getHttpServer())
        .get(`/invoices/${invoiceId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(invoiceId)
          expect(res.body).toHaveProperty('lines')
        })
    })
    
    it('should return 404 for non-existent invoice', () => {
      return request(app.getHttpServer())
        .get('/invoices/non-existent-id')
        .expect(404)
    })
  })
})
```

### 3.4 E2E Tests (Frontend - Playwright)

```typescript
// tests/e2e/invoice-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('http://localhost:5173')
    await page.click('text=Connect QuickBooks')
    // ... OAuth flow
    await page.waitForURL('**/dashboard')
  })
  
  test('should create invoice via command palette', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K')
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible()
    
    // Type command
    await page.fill('[data-testid="command-input"]', 'create invoice')
    await page.keyboard.press('Enter')
    
    // Wait for form
    await expect(page.locator('[data-testid="invoice-form"]')).toBeVisible()
    
    // Fill form
    await page.selectOption('[data-testid="customer-select"]', 'cust-456')
    await page.fill('[data-testid="txn-date"]', '2024-12-09')
    
    // Add line item
    await page.click('[data-testid="add-line"]')
    await page.selectOption('[data-testid="account-select-0"]', 'acc-789')
    await page.fill('[data-testid="description-0"]', 'Web Design Services')
    await page.fill('[data-testid="quantity-0"]', '10')
    await page.fill('[data-testid="unit-price-0"]', '150')
    
    // Save
    await page.keyboard.press('Control+Enter')
    
    // Verify success
    await expect(page.locator('text=Invoice created')).toBeVisible()
    await expect(page.locator('[data-testid="invoice-list"]')).toContainText('INV-')
  })
  
  test('should show undo toast and allow cancellation', async ({ page }) => {
    // Create invoice
    await createInvoiceViaUI(page)
    
    // Undo toast should appear
    await expect(page.locator('[data-testid="undo-toast"]')).toBeVisible()
    
    // Click undo within 3 seconds
    await page.click('[data-testid="undo-button"]')
    
    // Verify invoice was not created
    await expect(page.locator('[data-testid="invoice-list"]')).not.toContainText('INV-')
  })
})
```

### 3.5 Performance Tests

```typescript
// tests/performance/search-performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Search Performance', () => {
  test('should respond to keypresses within 20ms', async ({ page }) => {
    await page.goto('http://localhost:5173/transactions')
    
    const measurements: number[] = []
    
    // Measure 50 keypresses
    for (let i = 0; i < 50; i++) {
      const start = Date.now()
      
      await page.keyboard.press('j')
      
      // Wait for selection change
      await page.waitForSelector('[data-selected="true"]', { timeout: 100 })
      
      const duration = Date.now() - start
      measurements.push(duration)
    }
    
    // Calculate stats
    const avg = measurements.reduce((a, b) => a + b) / measurements.length
    const max = Math.max(...measurements)
    const p95 = measurements.sort()[Math.floor(measurements.length * 0.95)]
    
    console.log(`Average: ${avg}ms, Max: ${max}ms, P95: ${p95}ms`)
    
    // Assertions
    expect(avg).toBeLessThan(20)
    expect(p95).toBeLessThan(50)
  })
  
  test('should search 10K records in <100ms', async ({ page }) => {
    await page.goto('http://localhost:5173/transactions')
    
    // Trigger search
    const start = Date.now()
    await page.fill('[data-testid="search-input"]', 'adobe')
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')
    const duration = Date.now() - start
    
    console.log(`Search took ${duration}ms`)
    expect(duration).toBeLessThan(100)
  })
})
```

### 3.6 Test Coverage Report

```bash
# Backend
cd backend
npm run test:cov

# Output:
# ----------------------|---------|----------|---------|---------|-------------------
# File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# ----------------------|---------|----------|---------|---------|-------------------
# All files             |   82.14 |    76.32 |   85.42 |   83.21 |
#  invoices/            |   90.12 |    85.71 |   92.31 |   91.23 |
#   invoices.service.ts |   92.45 |    88.89 |   94.12 |   93.15 | 45-47,103
#  sync/                |   78.56 |    71.43 |   81.25 |   79.87 |
#   sync.service.ts     |   76.32 |    69.23 |   78.95 |   77.42 | 78-92,145-156
# ----------------------|---------|----------|---------|---------|-------------------

# Frontend
cd frontend
npm run test:cov
```

---

**END OF DOCUMENT 5**

Final Document:
- Document 6: Deployment, DevOps & 8-Week Implementation Plan
