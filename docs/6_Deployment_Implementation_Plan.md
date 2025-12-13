# Superhuman for QuickBooks
## Document 6: Deployment & Implementation Plan

**Version:** 1.0  
**Date:** December 2024  

---

## Table of Contents

1. [Deployment Strategy](#1-deployment-strategy)
2. [DevOps & CI/CD](#2-devops--cicd)
3. [Monitoring & Observability](#3-monitoring--observability)
4. [8-Week Implementation Plan](#4-8-week-implementation-plan)

---

## 1. Deployment Strategy

### 1.1 Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vercel)                                          │
│  ├─ app.yourledger.com                                      │
│  ├─ CDN: Global edge caching                                │
│  ├─ Auto SSL                                                │
│  └─ Automatic deployments from main branch                  │
│                                                              │
│  Backend (Render)                                           │
│  ├─ api.yourledger.com                                      │
│  ├─ Auto-scaling: 1-3 instances                             │
│  ├─ Health checks: /health                                  │
│  └─ Zero-downtime deploys                                   │
│                                                              │
│  Database (Render PostgreSQL)                               │
│  ├─ PostgreSQL 14                                           │
│  ├─ Daily backups (7-day retention)                         │
│  ├─ Point-in-time recovery                                  │
│  └─ Connection pooling                                      │
│                                                              │
│  Redis (Upstash)                                            │
│  ├─ Serverless Redis                                        │
│  ├─ Global replication                                      │
│  └─ 99.99% uptime SLA                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          STAGING                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend: staging.yourledger.com                           │
│  Backend: api-staging.yourledger.com                        │
│  Database: Render PostgreSQL (Starter plan)                 │
│  Redis: Upstash (Free tier)                                 │
│  QuickBooks: Sandbox environment                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Hosting Recommendations

**Frontend: Vercel**

```yaml
# vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Benefits:**
- Global CDN (instant load times worldwide)
- Automatic HTTPS
- Preview deployments for PRs
- Zero-config deployments from Git
- Cost: $0 (Hobby) or $20/month (Pro)

**Backend: Render**

```yaml
# render.yaml
services:
  - type: web
    name: superhuman-qbo-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: superhuman-qbo-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: superhuman-qbo-redis
          type: redis
          property: connectionString
    healthCheckPath: /health
    autoDeploy: true
    
databases:
  - name: superhuman-qbo-db
    databaseName: superhuman_qbo
    user: superhuman_user
    plan: standard
    
redis:
  - name: superhuman-qbo-redis
    plan: starter
    maxmemoryPolicy: allkeys-lru
```

**Benefits:**
- Auto-scaling based on load
- Zero-downtime deployments
- Managed PostgreSQL with backups
- Simple pricing: $7/month (Starter) to $85/month (Pro)

**Alternative: AWS / DigitalOcean / Railway**

For more control or specific requirements, consider:
- **AWS**: Full control, complex setup
- **DigitalOcean**: App Platform (similar to Render)
- **Railway**: Developer-friendly, simpler than AWS

### 1.3 Domain & SSL Setup

```bash
# DNS Configuration (in your domain registrar)

# Frontend
app.yourledger.com       CNAME   cname.vercel-dns.com
www.yourledger.com       CNAME   cname.vercel-dns.com

# Backend
api.yourledger.com       CNAME   your-app.onrender.com

# SSL certificates are automatically provisioned
```

### 1.4 Environment Variables (Production)

**Backend (.env.production)**

```bash
# Never commit this file! Use Render dashboard to set these

NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@host:5432/superhuman_qbo"

# Redis
REDIS_URL="redis://default:password@host:6379"

# QuickBooks Production
QBO_CLIENT_ID="production_client_id"
QBO_CLIENT_SECRET="production_client_secret"
QBO_REDIRECT_URI="https://api.yourledger.com/auth/quickbooks/callback"
QBO_ENVIRONMENT="production"
QBO_WEBHOOK_TOKEN="production_webhook_token"

# Encryption (generate new for production!)
ENCRYPTION_KEY="64_character_hex_string"

# JWT
JWT_SECRET="your_production_jwt_secret"
JWT_EXPIRES_IN="7d"

# Frontend
FRONTEND_URL="https://app.yourledger.com"

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEW_RELIC_LICENSE_KEY="your_license_key"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

**Frontend (.env.production)**

```bash
VITE_API_URL="https://api.yourledger.com"
VITE_WS_URL="wss://api.yourledger.com"
VITE_SENTRY_DSN="https://xxx@sentry.io/xxx"
```

---

## 2. DevOps & CI/CD

### 2.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Generate Prisma Client
        working-directory: ./backend
        run: npx prisma generate
      
      - name: Run linter
        working-directory: ./backend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./backend
        run: npm run test:cov
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_HOST: localhost
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
  
  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend
        run: npm run lint
      
      - name: Type check
        working-directory: ./frontend
        run: npm run type-check
      
      - name: Run tests
        working-directory: ./frontend
        run: npm run test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
  
  # E2E Tests
  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.event_name == 'pull_request'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Playwright
        working-directory: ./frontend
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        working-directory: ./frontend
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
  
  # Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend to Render (Staging)
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_STAGING }}"
      
      - name: Deploy Frontend to Vercel (Staging)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          alias-domains: staging.yourledger.com
  
  # Deploy to Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend to Render (Production)
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_PRODUCTION }}"
      
      - name: Deploy Frontend to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2.2 Database Migrations

```typescript
// Backend: Automated migration on deploy

// prisma/migrations/deploy.sh
#!/bin/bash

echo "Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed"
  exit 1
fi
```

```yaml
# render.yaml (add to backend service)
services:
  - type: web
    name: superhuman-qbo-api
    # ... other config
    preDeployCommand: ./prisma/migrations/deploy.sh
```

### 2.3 Health Checks

```typescript
// Backend: health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: Redis,
  ) {}
  
  @Get()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    }
    
    const allHealthy = Object.values(checks).every(
      v => typeof v !== 'object' || v.status === 'ok'
    )
    
    return {
      ...checks,
      status: allHealthy ? 'ok' : 'degraded',
    }
  }
  
  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok' }
    } catch (error) {
      return { status: 'error', message: error.message }
    }
  }
  
  private async checkRedis() {
    try {
      await this.redis.ping()
      return { status: 'ok' }
    } catch (error) {
      return { status: 'error', message: error.message }
    }
  }
}
```

### 2.4 Rollback Strategy

```bash
# Automatic rollback on health check failure

# Render automatically rolls back if:
# - Deploy fails to build
# - Health checks fail after deploy
# - Container crashes repeatedly

# Manual rollback via Render dashboard:
# 1. Go to service
# 2. Click "Rollback" button
# 3. Select previous deploy

# Or via API:
curl -X POST "https://api.render.com/v1/services/srv-xxx/deploys/dep-xxx/rollback" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 3. Monitoring & Observability

### 3.1 Application Monitoring (Sentry)

```typescript
// Backend: main.ts
import * as Sentry from '@sentry/node'

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Prisma({ client: prisma }),
      ],
    })
  }
  
  const app = await NestFactory.create(AppModule)
  // ... rest of setup
}
```

```typescript
// Frontend: main.tsx
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
```

### 3.2 Performance Monitoring (New Relic)

```javascript
// Backend: newrelic.js
exports.config = {
  app_name: ['Superhuman QBO API'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
  distributed_tracing: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 0.5,
  },
}

// Import at top of main.ts
require('newrelic')
```

### 3.3 Logging Strategy

```typescript
// Backend: logger.service.ts
import { Logger } from '@nestjs/common'
import * as winston from 'winston'

@Injectable()
export class LoggerService {
  private logger: winston.Logger
  
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    })
  }
  
  log(message: string, context?: string) {
    this.logger.info(message, { context })
  }
  
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context })
  }
  
  warn(message: string, context?: string) {
    this.logger.warn(message, { context })
  }
  
  debug(message: string, context?: string) {
    this.logger.debug(message, { context })
  }
}
```

### 3.4 Metrics Dashboard

```typescript
// Backend: metrics.controller.ts
import { promisify } from 'util'
import * as client from 'prom-client'

@Controller('metrics')
export class MetricsController {
  private register = new client.Registry()
  
  constructor() {
    // Collect default metrics
    client.collectDefaultMetrics({ register: this.register })
    
    // Custom metrics
    this.register.registerMetric(
      new client.Counter({
        name: 'api_requests_total',
        help: 'Total API requests',
        labelNames: ['method', 'route', 'status'],
      }),
    )
  }
  
  @Get()
  async getMetrics() {
    return this.register.metrics()
  }
}
```

### 3.5 Uptime Monitoring

**UptimeRobot Configuration:**

```yaml
Monitors:
  - name: Frontend (Production)
    url: https://app.yourledger.com
    type: HTTP
    interval: 5 minutes
    
  - name: Backend (Production)
    url: https://api.yourledger.com/health
    type: HTTP
    interval: 5 minutes
    expected_response: 200
    
  - name: WebSocket (Production)
    url: wss://api.yourledger.com
    type: Port
    port: 443
    interval: 5 minutes

Alert Contacts:
  - email: team@yourledger.com
  - slack: #alerts channel
  - sms: +1-xxx-xxx-xxxx (critical only)
```

---

## 4. 8-Week Implementation Plan

### Week 1-2: Foundation & Authentication

**Week 1:**
- [x] Project setup
  - [x] Initialize NestJS backend
  - [x] Initialize React + Vite frontend
  - [x] Configure ESLint, Prettier, TypeScript
  - [x] Set up Git repository
  - [x] Create development Docker Compose
- [x] Database setup
  - [x] Design Prisma schema with multi-company support
  - [x] Create initial migration
  - [x] Set up PostgreSQL locally
  - [x] Set up Redis locally
- [x] QuickBooks OAuth
  - [x] Register sandbox app
  - [x] Implement OAuth flow (initiate + callback)
  - [x] Token encryption service
  - [x] Store company + tokens in database

**Week 2:**
- [x] Generic adapter interface
  - [x] Define AccountingAdapter interface
  - [x] Create QuickBooksAdapter implementation
  - [x] Implement basic CRUD methods
- [x] Initial sync engine
  - [x] Sync accounts (Chart of Accounts)
  - [x] Sync customers
  - [x] Sync vendors
  - [x] Progress tracking via WebSocket
- [x] Basic backend API
  - [x] GET /companies
  - [x] GET /accounts
  - [x] GET /customers
  - [x] GET /vendors

**Deliverable:** Connect to QuickBooks sandbox, sync basic data

---

### Week 3: Complete Sync Engine

**Tasks:**
- [x] Full entity sync
  - [x] Sync invoices (paginated)
  - [x] Sync bills (paginated)
  - [x] Sync journal entries
  - [x] Sync transactions (last 2 years)
- [x] Webhook integration
  - [x] Webhook endpoint + signature verification
  - [x] Parse webhook events
  - [x] Queue entity sync jobs
- [x] Delta sync logic
  - [x] Fetch changed entities from QBO
  - [x] Update database
  - [x] Broadcast to clients via WebSocket
- [x] Polling fallback
  - [x] Query entities modifiedSince last check
  - [x] Run every 60 seconds
- [x] WebSocket gateway
  - [x] Socket.io setup
  - [x] Room-based subscriptions (per company)
  - [x] Broadcast entity updates

**Deliverable:** Real-time sync working (webhooks + polling)

---

### Week 4: Frontend Data Layer

**Tasks:**
- [x] IndexedDB setup
  - [x] Dexie.js configuration
  - [x] Define schemas matching backend
  - [x] Create compound indexes
- [x] Memory cache manager
  - [x] LRU cache implementation
  - [x] TTL support (10 minutes default)
  - [x] Pattern-based invalidation
- [x] DataService implementation
  - [x] 3-tier read strategy (Memory → IDB → API)
  - [x] Optimistic write operations
  - [x] Cache warming on load
- [x] WebSocket client
  - [x] Connection management
  - [x] Auto-reconnect with backoff
  - [x] Event handlers
  - [x] Update local caches on push
- [x] React Query setup
  - [x] Configure query client
  - [x] Custom hooks for entities
  - [x] Optimistic updates

**Deliverable:** UI reads from cache (<20ms), real-time updates working

---

### Week 5: Command Palette & Lists

**Tasks:**
- [x] Command palette
  - [x] Install cmdk library
  - [x] Fuzzy search implementation
  - [x] Multi-filter with Tab-to-lock
  - [x] Recent query memory
  - [x] Command shortcuts (create, send, export)
- [x] Transaction list
  - [x] Virtual scrolling (react-window)
  - [x] Filter UI (date range, type, entity)
  - [x] Keyboard navigation (j/k, arrows)
  - [x] Multi-select with Shift
  - [x] Quick edit shortcuts (D, E, M)
- [x] Global keyboard shortcuts
  - [x] ⌘K to open palette
  - [x] ? for help modal
  - [x] I/B/J for new invoice/bill/JE
- [x] Status indicators
  - [x] Sync status badge (always visible)
  - [x] Entity sync badges (per row)

**Deliverable:** Keyboard-first navigation, instant search results

---

### Week 6: Invoice Form & Operations

**Tasks:**
- [x] Invoice form component
  - [x] Customer select (searchable)
  - [x] Date pickers (txnDate, dueDate)
  - [x] Line item editor
    - [x] Account select per line
    - [x] Description, quantity, unit price
    - [x] Auto-calculate amounts
  - [x] Add/remove lines
  - [x] Memo and private note fields
- [x] Form validation
  - [x] Required fields
  - [x] Business rules (e.g., positive amounts)
  - [x] Show errors inline
- [x] Invoice operations
  - [x] Create invoice (POST /invoices)
  - [x] Edit invoice (PUT /invoices/:id)
  - [x] Duplicate invoice (POST /invoices/:id/duplicate)
  - [x] Send invoice (POST /invoices/:id/send)
- [x] Optimistic updates
  - [x] Immediate UI update
  - [x] Show PENDING_SYNC status
  - [x] Handle sync confirmation
- [x] Undo toast
  - [x] 3-second countdown
  - [x] Cancel button
  - [x] Rollback on cancel

**Deliverable:** Full invoice CRUD, optimistic updates, undo

---

### Week 7: Bills, Journal Entries & Export

**Tasks:**
- [x] Bill form
  - [x] Vendor select
  - [x] Line items (similar to invoice)
  - [x] Create/edit/duplicate operations
- [x] Journal entry form
  - [x] Debit/credit line editor
  - [x] Validation: debits = credits
  - [x] Create/edit/duplicate operations
- [x] CSV export
  - [x] Export transactions with filters
  - [x] Export invoices
  - [x] Export bills
  - [x] Date-stamped filenames
- [x] Polish
  - [x] Error states (sync failures)
  - [x] Success/error toasts
  - [x] Loading skeletons
  - [x] Empty states
  - [x] Dark mode toggle
  - [x] Keyboard shortcuts help (? modal)

**Deliverable:** All MVP CRUD operations, professional UI

---

### Week 8: Testing, Documentation & Deployment

**Tasks:**
- [x] Unit tests (target: 80% coverage)
  - [x] Backend services
  - [x] Frontend DataService
  - [x] Frontend components
  - [x] Utility functions
- [x] Integration tests
  - [x] API endpoints (create/read/update)
  - [x] OAuth flow
  - [x] Webhook processing
  - [x] Sync operations
- [x] E2E tests (Playwright)
  - [x] Invoice creation flow
  - [x] Command palette usage
  - [x] Keyboard navigation
  - [x] Undo functionality
  - [x] Real-time sync
- [x] Performance testing
  - [x] Keypress response time (<20ms)
  - [x] Search 10K records (<100ms)
  - [x] Cache hit rates (>80%)
- [x] Documentation
  - [x] README with setup instructions
  - [x] API documentation (Swagger)
  - [x] Architecture diagrams
  - [x] Deployment guide
- [x] Production deployment
  - [x] Set up Render (backend + DB)
  - [x] Set up Vercel (frontend)
  - [x] Configure production OAuth
  - [x] Set up monitoring (Sentry)
  - [x] Configure CI/CD pipeline
  - [x] Load testing
- [x] Beta launch preparation
  - [x] Create onboarding flow
  - [x] Write user guide
  - [x] Set up support channel
  - [x] Prepare feedback form

**Deliverable:** Production-ready MVP, deployed and tested

---

### Post-Launch: Week 9-10 (Optional Buffer)

**If ahead of schedule, implement v2 features:**
- [ ] Reports (P&L, Balance Sheet, A/R, A/P)
- [ ] Multi-company UI switcher
- [ ] Advanced filters (saved queries)
- [ ] Bulk operations
- [ ] Invoice scheduling

**If on schedule:**
- [ ] Bug fixes from beta feedback
- [ ] Performance optimizations
- [ ] Documentation improvements
- [ ] User onboarding flow refinements

---

## Implementation Checklist

### Pre-Development
- [ ] QuickBooks sandbox app created
- [ ] GitHub repository set up
- [ ] Development team confirmed
- [ ] Project management tool configured (Linear, Jira, etc.)
- [ ] Communication channels set up (Slack, Discord)

### Week 1-2 Checklist
- [ ] Docker Compose running (Postgres + Redis)
- [ ] Backend compiles and runs
- [ ] Frontend compiles and runs
- [ ] OAuth flow tested with sandbox
- [ ] Can sync accounts, customers, vendors
- [ ] Data visible in database

### Week 3 Checklist
- [ ] Full sync completes (<60 seconds for 10K entities)
- [ ] Webhooks verified with QBO test tool
- [ ] WebSocket connection stable
- [ ] Polling fallback tested
- [ ] Can manually trigger re-sync

### Week 4 Checklist
- [ ] IndexedDB stores all entities
- [ ] Memory cache returns data in <5ms
- [ ] DataService reads from cache first
- [ ] WebSocket updates refresh UI
- [ ] Cache invalidation working correctly

### Week 5 Checklist
- [ ] Command palette opens with ⌘K
- [ ] Fuzzy search returns results <100ms
- [ ] Tab-to-lock adds multiple filters
- [ ] Transaction list scrolls smoothly (100K+ rows)
- [ ] Keyboard navigation (j/k) works
- [ ] All global shortcuts working

### Week 6 Checklist
- [ ] Can create invoice via UI
- [ ] Can edit existing invoice
- [ ] Can duplicate invoice
- [ ] Can send invoice (email sent)
- [ ] Undo toast appears and works
- [ ] Optimistic update feels instant
- [ ] Sync status visible and accurate

### Week 7 Checklist
- [ ] Can create/edit/duplicate bill
- [ ] Can create/edit/duplicate journal entry
- [ ] Journal entry validates debits = credits
- [ ] CSV export downloads correctly
- [ ] All entity types exportable
- [ ] Dark mode works throughout
- [ ] Error states show helpful messages

### Week 8 Checklist
- [ ] Test coverage ≥80%
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Production environment configured
- [ ] CI/CD pipeline working
- [ ] Monitoring dashboards set up
- [ ] Beta users can access app

---

## Success Criteria

**MVP is complete when:**

✅ **Core Functionality**
- User can connect QuickBooks sandbox account
- Full sync completes in <60 seconds
- Real-time updates arrive within 1 second
- Command palette responds in <50ms
- Search 10K records in <100ms
- Can create/edit/duplicate invoices, bills, JEs
- Undo works within 3-second window
- CSV export works for all entities

✅ **Performance**
- UI interactions <20ms (p95)
- Cache hit rate >80%
- No UI freezing or jank
- Smooth scrolling with 100K+ rows

✅ **Reliability**
- Zero data loss during sync
- Graceful offline handling
- Sync errors clearly communicated
- Automatic retry on failures

✅ **Usability**
- All actions keyboard-accessible
- Clear visual feedback for all operations
- Status indicators always visible
- Error messages are helpful

✅ **Quality**
- Test coverage ≥80%
- All E2E tests pass
- No console errors or warnings
- Code follows style guide

✅ **Deployment**
- Runs in production environment
- Health checks passing
- Monitoring active
- CI/CD pipeline functional

---

## Team & Resources

**Recommended Team:**
- 1 Full-Stack Developer (senior)
- Claude Code (AI pair programmer)

**Time Commitment:**
- Full-time: 40 hours/week × 8 weeks = 320 hours
- Part-time: 20 hours/week × 12-16 weeks

**Budget Estimate:**
- Development: $14,000-18,000 (contractor rate: $50-75/hr)
- Infrastructure (Year 1): $500-1,000
  - Render Pro: $85/month
  - Vercel Pro: $20/month
  - Upstash Redis: $10/month
  - Sentry: $0-26/month
  - UptimeRobot: $0-7/month
- QuickBooks API: Free (sandbox), $0-30/month (production)
- **Total MVP Cost: $14,500-19,000**

Compare to TechExtensor proposal: **$30,000** (47% cost savings)

---

## Risk Mitigation

**Technical Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| QuickBooks API rate limits | High | Implement queue with backoff, cache aggressively |
| Webhook unreliability | Medium | Polling fallback every 60s |
| IndexedDB quota exceeded | Medium | Auto-cleanup old data, warn user at 400MB |
| Memory cache grows too large | Low | LRU eviction at 50MB limit |
| Slow initial sync | Medium | Background jobs, progress indicators, pagination |

**Business Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| User churn (slow UI) | High | Performance testing, <20ms requirement |
| Data loss during sync | Critical | Transactional updates, retry logic, logging |
| Security breach | Critical | Encryption, OAuth only, security audit |
| QuickBooks API changes | Medium | Generic adapter layer, version pinning |

---

## Post-MVP Roadmap

**Version 2.0 (Weeks 9-12):**
- Reports (P&L, Balance Sheet, A/R, A/P)
- Multi-company UI switcher
- User authentication (email/password)
- Advanced conflict resolution
- Saved queries
- Recent query memory

**Version 2.5 (Months 4-5):**
- Invoice scheduling
- Revenue recognition/deferral
- Bulk operations (CSV import)
- AI-powered data entry
- Mobile-responsive design

**Version 3.0 (Months 6-8):**
- Xero integration (via generic adapter)
- Advanced reporting & analytics
- Multi-user collaboration
- Custom fields
- API for third-party integrations

---

**END OF DOCUMENT 6**

---

# Complete Technical Specification - Summary

This completes the full 6-document technical specification for building Superhuman for QuickBooks MVP.

**Documents Created:**
1. ✅ Requirements, Architecture & Diagrams (41KB)
2. ✅ Data Models & API Specifications (34KB)
3. ✅ UI Guidelines & Coding Structure (32KB)
4. ✅ Security, Sync Strategy & Caching (30KB)
5. ✅ Error Handling, Setup & Testing (28KB)
6. ✅ Deployment & Implementation Plan (26KB)

**Total:** 191KB of comprehensive technical documentation

**What's Included:**
- Complete system architecture with Mermaid diagrams
- Full database schema (Prisma + IndexedDB)
- All API endpoint specifications
- UI/UX guidelines with keyboard shortcuts
- Security implementation (OAuth, encryption, webhooks)
- Local-first 3-tier caching strategy
- Real-time sync (webhooks + polling)
- Error handling patterns
- Development setup guide
- Testing strategy (Unit, Integration, E2E)
- CI/CD pipeline
- Monitoring & deployment
- Week-by-week implementation plan

**Ready to build!** This specification provides everything a developer needs to implement the MVP from start to finish.
