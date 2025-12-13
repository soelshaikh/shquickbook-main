# Superhuman for QuickBooks
## Document 4: Security, Sync Strategy & Caching

**Version:** 1.0  
**Date:** December 2024  

---

## Table of Contents

1. [Security](#1-security)
2. [Sync Strategy](#2-sync-strategy)
3. [Local-First Caching](#3-local-first-caching)
4. [Conflict Resolution](#4-conflict-resolution)

---

## 1. Security

### 1.1 OAuth 2.0 Implementation

**OAuth Flow:**

```typescript
// Backend: auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('quickbooks')
  initiateOAuth(@Res() res: Response) {
    // Generate secure state token
    const state = crypto.randomBytes(32).toString('hex')
    
    // Store state in session/Redis (expires in 10 minutes)
    this.authService.storeOAuthState(state, 600)
    
    // Build OAuth URL
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2')
    authUrl.searchParams.append('client_id', this.configService.get('QBO_CLIENT_ID'))
    authUrl.searchParams.append('redirect_uri', this.configService.get('QBO_REDIRECT_URI'))
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting')
    authUrl.searchParams.append('state', state)
    
    return res.json({
      redirectUrl: authUrl.toString(),
      state,
    })
  }

  @Get('quickbooks/callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('realmId') realmId: string,
    @Res() res: Response,
  ) {
    // Verify state token (CSRF protection)
    const isValidState = await this.authService.verifyOAuthState(state)
    if (!isValidState) {
      throw new UnauthorizedException('Invalid state token')
    }
    
    // Exchange code for tokens
    const tokens = await this.authService.exchangeCodeForTokens(code)
    
    // Encrypt and store tokens
    const company = await this.authService.createCompany({
      qboRealmId: realmId,
      accessToken: this.encrypt(tokens.access_token),
      refreshToken: this.encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    })
    
    // Queue initial sync
    await this.syncService.queueInitialSync(company.id)
    
    // Redirect to frontend
    const frontendUrl = `${this.configService.get('FRONTEND_URL')}/dashboard?connected=true`
    return res.redirect(frontendUrl)
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  async refreshToken(@Body('companyId') companyId: string) {
    const company = await this.companiesService.findOne(companyId)
    
    // Check if token needs refresh (5-minute buffer)
    const needsRefresh = company.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)
    
    if (needsRefresh) {
      const decryptedRefreshToken = this.decrypt(company.refreshToken)
      
      // Request new tokens
      const newTokens = await this.authService.refreshAccessToken(decryptedRefreshToken)
      
      // Update database
      await this.companiesService.update(company.id, {
        accessToken: this.encrypt(newTokens.access_token),
        refreshToken: this.encrypt(newTokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
      })
      
      return { success: true, expiresAt: newTokens.expires_in }
    }
    
    return { success: true, message: 'Token still valid' }
  }
}
```

**Token Storage Encryption:**

```typescript
// encryption.service.ts
import * as crypto from 'crypto'

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key: Buffer
  
  constructor(private configService: ConfigService) {
    // Key should be 32 bytes (256 bits)
    const keyHex = this.configService.get('ENCRYPTION_KEY')
    this.key = Buffer.from(keyHex, 'hex')
  }
  
  encrypt(text: string): string {
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12)
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get auth tag
    const authTag = cipher.getAuthTag()
    
    // Combine: iv + authTag + encrypted (all hex)
    return iv.toString('hex') + authTag.toString('hex') + encrypted
  }
  
  decrypt(encryptedData: string): string {
    // Extract components
    const iv = Buffer.from(encryptedData.slice(0, 24), 'hex')
    const authTag = Buffer.from(encryptedData.slice(24, 56), 'hex')
    const encrypted = encryptedData.slice(56)
    
    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Generate encryption key (run once):
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.2 API Security

**Rate Limiting:**

```typescript
// rate-limit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { Redis } from 'ioredis'

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private redis: Redis) {}
  
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest()
    const ip = request.ip
    const key = `rate_limit:${ip}`
    
    // Get current count
    const current = await this.redis.get(key)
    const count = current ? parseInt(current) : 0
    
    // Check limit (100 requests per minute)
    if (count >= 100) {
      throw new HttpException('Rate limit exceeded', 429)
    }
    
    // Increment counter
    const pipeline = this.redis.pipeline()
    pipeline.incr(key)
    if (count === 0) {
      pipeline.expire(key, 60) // 60 seconds
    }
    await pipeline.exec()
    
    return next.handle()
  }
}

// Apply globally or per route
@UseInterceptors(RateLimitInterceptor)
```

**Input Validation:**

```typescript
// create-invoice.dto.ts
import { IsString, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

class InvoiceLineDto {
  @IsString()
  accountId: string
  
  @IsString()
  description: string
  
  @IsNumber()
  @Min(0)
  quantity: number
  
  @IsNumber()
  @Min(0)
  unitPrice: number
}

export class CreateInvoiceDto {
  @IsString()
  companyId: string
  
  @IsString()
  customerId: string
  
  @IsDateString()
  txnDate: string
  
  @IsDateString()
  dueDate?: string
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[]
  
  @IsString()
  memo?: string
}

// Use with ValidationPipe
@Post('invoices')
async create(@Body(ValidationPipe) dto: CreateInvoiceDto) {
  return this.invoicesService.create(dto)
}
```

**CORS Configuration:**

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.enableCors({
    origin: process.env.FRONTEND_URL, // Only allow frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  
  await app.listen(3000)
}
```

### 1.3 Webhook Security

**Signature Verification:**

```typescript
// webhooks.service.ts
import * as crypto from 'crypto'

@Injectable()
export class WebhooksService {
  constructor(private configService: ConfigService) {}
  
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookToken = this.configService.get('QBO_WEBHOOK_TOKEN')
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookToken)
      .update(payload)
      .digest('base64')
    
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    } catch {
      return false
    }
  }
}

// webhooks.controller.ts
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}
  
  @Post('quickbooks')
  async handleWebhook(
    @Body() payload: any,
    @Headers('intuit-signature') signature: string,
  ) {
    // Verify signature
    const isValid = this.webhooksService.verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
    )
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature')
    }
    
    // Process webhook
    await this.webhooksService.processWebhook(payload)
    
    return { success: true }
  }
}
```

### 1.4 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/superhuman_qbo"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# QuickBooks OAuth
QBO_CLIENT_ID="your_client_id"
QBO_CLIENT_SECRET="your_client_secret"
QBO_REDIRECT_URI="http://localhost:3000/auth/quickbooks/callback"
QBO_ENVIRONMENT="sandbox" # or "production"

# QuickBooks Webhook
QBO_WEBHOOK_TOKEN="your_webhook_token"

# Encryption
ENCRYPTION_KEY="64_character_hex_string" # Generate: openssl rand -hex 32

# JWT (future authentication)
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"

# Frontend
FRONTEND_URL="http://localhost:5173"

# Monitoring
SENTRY_DSN=""
NEW_RELIC_LICENSE_KEY=""
```

---

## 2. Sync Strategy

### 2.1 Initial Full Sync

**Implementation:**

```typescript
// sync.service.ts
@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private adapter: AccountingAdapter,
    private websocketGateway: RealtimeGateway,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}
  
  async queueInitialSync(companyId: string): Promise<void> {
    await this.syncQueue.add('initial-sync', {
      companyId,
      type: 'INITIAL_SYNC',
    })
  }
  
  @Process('initial-sync')
  async processInitialSync(job: Job<{ companyId: string }>) {
    const { companyId } = job.data
    
    // Update company status
    await this.prisma.company.update({
      where: { id: companyId },
      data: { syncStatus: 'SYNCING' },
    })
    
    // Broadcast sync start
    this.websocketGateway.broadcastToCompany(companyId, {
      event: 'sync:status',
      data: { companyId, status: 'SYNCING', progress: 0 },
    })
    
    try {
      // Step 1: Sync Accounts (5%)
      await this.syncAccounts(companyId)
      await this.updateProgress(companyId, 5, 'Syncing accounts')
      
      // Step 2: Sync Customers (15%)
      await this.syncCustomers(companyId)
      await this.updateProgress(companyId, 15, 'Syncing customers')
      
      // Step 3: Sync Vendors (25%)
      await this.syncVendors(companyId)
      await this.updateProgress(companyId, 25, 'Syncing vendors')
      
      // Step 4: Sync Invoices (50%)
      await this.syncInvoices(companyId)
      await this.updateProgress(companyId, 50, 'Syncing invoices')
      
      // Step 5: Sync Bills (70%)
      await this.syncBills(companyId)
      await this.updateProgress(companyId, 70, 'Syncing bills')
      
      // Step 6: Sync Journal Entries (85%)
      await this.syncJournalEntries(companyId)
      await this.updateProgress(companyId, 85, 'Syncing journal entries')
      
      // Step 7: Sync Transactions (95%)
      await this.syncTransactions(companyId)
      await this.updateProgress(companyId, 95, 'Syncing transactions')
      
      // Complete
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          syncStatus: 'SYNCED',
          lastSyncAt: new Date(),
        },
      })
      
      await this.updateProgress(companyId, 100, 'Sync complete')
      
      // Broadcast completion
      this.websocketGateway.broadcastToCompany(companyId, {
        event: 'sync:completed',
        data: {
          companyId,
          syncedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      // Handle failure
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          syncStatus: 'FAILED',
          syncError: error.message,
        },
      })
      
      this.websocketGateway.broadcastToCompany(companyId, {
        event: 'error',
        data: {
          companyId,
          code: 'SYNC_FAILED',
          message: error.message,
        },
      })
      
      throw error
    }
  }
  
  private async syncInvoices(companyId: string): Promise<void> {
    let startPosition = 1
    const maxResults = 500
    let hasMore = true
    
    while (hasMore) {
      // Fetch page from QBO
      const invoices = await this.adapter.getInvoices(companyId, {
        startPosition,
        maxResults,
      })
      
      // Upsert to database
      await this.prisma.invoice.createMany({
        data: invoices.map(inv => ({
          ...inv,
          companyId,
          syncStatus: 'SYNCED',
        })),
        skipDuplicates: true,
      })
      
      hasMore = invoices.length === maxResults
      startPosition += maxResults
    }
  }
  
  private async updateProgress(
    companyId: string,
    progress: number,
    message: string,
  ): Promise<void> {
    this.websocketGateway.broadcastToCompany(companyId, {
      event: 'sync:status',
      data: {
        companyId,
        status: 'SYNCING',
        progress,
        message,
      },
    })
  }
}
```

### 2.2 Delta Sync (Webhooks)

**Webhook Processing:**

```typescript
// webhooks.service.ts
@Injectable()
export class WebhooksService {
  constructor(
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}
  
  async processWebhook(payload: any): Promise<void> {
    const { eventNotifications } = payload
    
    for (const notification of eventNotifications) {
      const { realmId, dataChangeEvent } = notification
      
      // Find company by realmId
      const company = await this.prisma.company.findUnique({
        where: { qboRealmId: realmId },
      })
      
      if (!company) continue
      
      // Queue sync jobs for changed entities
      for (const entity of dataChangeEvent.entities) {
        await this.syncQueue.add('entity-sync', {
          companyId: company.id,
          entityType: entity.name,
          entityId: entity.id,
          operation: entity.operation,
        })
      }
    }
  }
}

// sync.processor.ts
@Processor('sync')
export class SyncProcessor {
  constructor(
    private adapter: AccountingAdapter,
    private prisma: PrismaService,
    private websocketGateway: RealtimeGateway,
  ) {}
  
  @Process('entity-sync')
  async processEntitySync(job: Job<EntitySyncData>) {
    const { companyId, entityType, entityId, operation } = job.data
    
    try {
      if (operation === 'Delete') {
        // Handle deletion
        await this.handleDelete(companyId, entityType, entityId)
      } else {
        // Fetch updated entity from QBO
        const entity = await this.adapter.getEntity(companyId, entityType, entityId)
        
        // Upsert to database
        await this.upsertEntity(companyId, entityType, entity)
        
        // Broadcast to clients
        this.websocketGateway.broadcastToCompany(companyId, {
          event: 'entity:updated',
          data: {
            companyId,
            entityType: entityType.toLowerCase(),
            entityId,
            entity,
          },
        })
      }
    } catch (error) {
      // Retry with exponential backoff
      if (job.attemptsMade < 3) {
        throw error // Will trigger retry
      }
      
      console.error('Entity sync failed:', error)
    }
  }
  
  private async upsertEntity(
    companyId: string,
    entityType: string,
    entity: any,
  ): Promise<void> {
    const table = this.getTableName(entityType)
    
    await this.prisma[table].upsert({
      where: {
        companyId_qboId: {
          companyId,
          qboId: entity.id,
        },
      },
      update: {
        ...entity,
        syncStatus: 'SYNCED',
        qboUpdatedAt: entity.updatedAt,
      },
      create: {
        ...entity,
        companyId,
        qboId: entity.id,
        syncStatus: 'SYNCED',
      },
    })
  }
}
```

### 2.3 Polling Fallback

**Scheduled Polling:**

```typescript
// sync.service.ts
@Injectable()
export class SyncService {
  private pollingIntervals = new Map<string, NodeJS.Timeout>()
  
  startPolling(companyId: string): void {
    // Clear existing interval
    if (this.pollingIntervals.has(companyId)) {
      clearInterval(this.pollingIntervals.get(companyId))
    }
    
    // Poll every 60 seconds
    const interval = setInterval(async () => {
      await this.pollForChanges(companyId)
    }, 60 * 1000)
    
    this.pollingIntervals.set(companyId, interval)
  }
  
  stopPolling(companyId: string): void {
    if (this.pollingIntervals.has(companyId)) {
      clearInterval(this.pollingIntervals.get(companyId))
      this.pollingIntervals.delete(companyId)
    }
  }
  
  private async pollForChanges(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })
    
    if (!company || !company.lastSyncAt) return
    
    try {
      // Query entities modified since last sync
      const changedEntities = await this.adapter.queryChangedEntities(
        companyId,
        company.lastSyncAt,
      )
      
      // Queue sync jobs
      for (const entity of changedEntities) {
        await this.syncQueue.add('entity-sync', {
          companyId,
          entityType: entity.type,
          entityId: entity.id,
          operation: 'Update',
        })
      }
      
      // Update last sync time
      await this.prisma.company.update({
        where: { id: companyId },
        data: { lastSyncAt: new Date() },
      })
    } catch (error) {
      console.error('Polling failed:', error)
    }
  }
}
```

### 2.4 Sync Status Tracking

```typescript
// Database: SyncJob model tracks all sync operations

interface SyncJob {
  id: string
  companyId: string
  jobType: 'INITIAL_SYNC' | 'DELTA_SYNC' | 'WEBHOOK_SYNC' | 'MANUAL_SYNC'
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  startedAt?: Date
  completedAt?: Date
  entitiesSynced: number
  errorMessage?: string
}

// API to get sync status
@Get('companies/:id/sync-status')
async getSyncStatus(@Param('id') companyId: string) {
  const company = await this.prisma.company.findUnique({
    where: { id: companyId },
    include: {
      _count: {
        select: {
          accounts: true,
          customers: true,
          vendors: true,
          invoices: true,
          bills: true,
          transactions: true,
        },
      },
    },
  })
  
  const lastJob = await this.prisma.syncJob.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  })
  
  return {
    companyId,
    syncStatus: company.syncStatus,
    lastSyncAt: company.lastSyncAt,
    lastSyncError: company.syncError,
    stats: company._count,
    lastJob,
  }
}
```

---

## 3. Local-First Caching

### 3.1 Memory Cache Implementation

```typescript
// cache-manager.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
}

export class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private ttl: number // Time to live in milliseconds
  
  constructor(maxSize = 1000, ttl = 10 * 60 * 1000) { // 10 minutes default
    this.maxSize = maxSize
    this.ttl = ttl
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // Update access count (for LRU)
    entry.accessCount++
    
    return entry.data
  }
  
  set(key: string, data: T): void {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    })
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }
  
  private evictLRU(): void {
    // Find least recently used entry
    let lruKey: string | null = null
    let minAccessCount = Infinity
    let oldestTimestamp = Infinity
    
    for (const [key, entry] of this.cache.entries()) {
      if (
        entry.accessCount < minAccessCount ||
        (entry.accessCount === minAccessCount && entry.timestamp < oldestTimestamp)
      ) {
        lruKey = key
        minAccessCount = entry.accessCount
        oldestTimestamp = entry.timestamp
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    }
  }
  
  private calculateHitRate(): number {
    // Implementation for tracking hits/misses
    return 0.85 // Placeholder
  }
}

// Usage
const transactionCache = new CacheManager<Transaction>(5000, 10 * 60 * 1000)
const invoiceCache = new CacheManager<Invoice>(2000, 10 * 60 * 1000)
```

### 3.2 DataService Implementation (Frontend)

```typescript
// data-service.ts
import { db } from '@/lib/indexeddb'
import { CacheManager } from '@/lib/cache-manager'
import { apiClient } from '@/services/api-client'

class DataService {
  private transactionCache = new CacheManager<Transaction>(5000)
  private invoiceCache = new CacheManager<Invoice>(2000)
  private customerCache = new CacheManager<Customer>(1000)
  
  async getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    const cacheKey = this.buildCacheKey('transactions', filters)
    
    // 1. Check memory cache (0-5ms)
    const cached = this.transactionCache.get(cacheKey)
    if (cached) {
      console.log('✅ Memory cache HIT')
      return cached
    }
    
    // 2. Check IndexedDB (10-20ms)
    try {
      const stored = await this.queryIndexedDB(filters)
      if (stored && stored.length > 0) {
        console.log('✅ IndexedDB HIT')
        
        // Update memory cache
        this.transactionCache.set(cacheKey, stored)
        
        return stored
      }
    } catch (error) {
      console.warn('IndexedDB query failed:', error)
    }
    
    // 3. Fetch from API (200-500ms)
    console.log('⚠️ API fetch (cache MISS)')
    const fetched = await apiClient.get('/transactions', { params: filters })
    
    // Update caches
    this.transactionCache.set(cacheKey, fetched.data.transactions)
    await db.transactions.bulkPut(fetched.data.transactions)
    
    return fetched.data.transactions
  }
  
  async getInvoice(id: string): Promise<Invoice> {
    const cacheKey = `invoice:${id}`
    
    // Check memory
    const cached = this.invoiceCache.get(cacheKey)
    if (cached) return cached
    
    // Check IndexedDB
    const stored = await db.invoices.get(id)
    if (stored) {
      this.invoiceCache.set(cacheKey, stored)
      return stored
    }
    
    // Fetch from API
    const fetched = await apiClient.get(`/invoices/${id}`)
    
    // Update caches
    this.invoiceCache.set(cacheKey, fetched.data)
    await db.invoices.put(fetched.data)
    
    return fetched.data
  }
  
  async createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`
    
    const optimisticInvoice: Invoice = {
      ...data,
      id: tempId,
      syncStatus: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
    }
    
    // Update local caches immediately (optimistic)
    this.invoiceCache.set(`invoice:${tempId}`, optimisticInvoice)
    await db.invoices.put(optimisticInvoice)
    
    // Post to API
    try {
      const response = await apiClient.post('/invoices', data)
      const confirmedInvoice = response.data
      
      // Replace temp with confirmed
      this.invoiceCache.delete(`invoice:${tempId}`)
      this.invoiceCache.set(`invoice:${confirmedInvoice.id}`, confirmedInvoice)
      await db.invoices.delete(tempId)
      await db.invoices.put(confirmedInvoice)
      
      return confirmedInvoice
    } catch (error) {
      // Mark as error
      optimisticInvoice.syncStatus = 'SYNC_ERROR'
      await db.invoices.put(optimisticInvoice)
      throw error
    }
  }
  
  handleRealtimeUpdate(event: WebSocketEvent): void {
    const { entityType, entityId, entity } = event.data
    
    switch (entityType) {
      case 'invoice':
        this.invoiceCache.set(`invoice:${entityId}`, entity)
        db.invoices.put(entity)
        break
      
      case 'transaction':
        // Invalidate transaction list caches
        this.transactionCache.invalidatePattern(/^transactions:/)
        db.transactions.put(entity)
        break
      
      // ... other entity types
    }
  }
  
  private buildCacheKey(type: string, filters: any): string {
    return `${type}:${JSON.stringify(filters)}`
  }
  
  private async queryIndexedDB(filters: TransactionFilters): Promise<Transaction[]> {
    let query = db.transactions.where('companyId').equals(filters.companyId)
    
    if (filters.type) {
      query = query.and(txn => filters.type.includes(txn.type))
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query = query.and(txn => {
        const date = new Date(txn.txnDate)
        const from = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0)
        const to = filters.dateTo ? new Date(filters.dateTo) : new Date()
        return date >= from && date <= to
      })
    }
    
    return query.toArray()
  }
}

export const dataService = new DataService()
```

### 3.3 Cache Warming Strategy

```typescript
// cache-warmer.ts
export class CacheWarmer {
  constructor(private dataService: DataService) {}
  
  async warmCache(companyId: string): Promise<void> {
    console.log('Warming cache...')
    
    // Warm up most frequently accessed data
    const warmupPromises = [
      // Recent transactions (last 3 months)
      this.dataService.getTransactions({
        companyId,
        dateFrom: subMonths(new Date(), 3).toISOString(),
        limit: 1000,
      }),
      
      // All active customers
      this.dataService.getCustomers({
        companyId,
        active: true,
      }),
      
      // All active vendors
      this.dataService.getVendors({
        companyId,
        active: true,
      }),
      
      // All accounts
      this.dataService.getAccounts({
        companyId,
      }),
      
      // Recent invoices
      this.dataService.getInvoices({
        companyId,
        dateFrom: subMonths(new Date(), 3).toISOString(),
        limit: 500,
      }),
    ]
    
    await Promise.all(warmupPromises)
    
    console.log('✅ Cache warmed')
  }
}

// Trigger after login/company selection
useEffect(() => {
  if (selectedCompanyId) {
    const warmer = new CacheWarmer(dataService)
    warmer.warmCache(selectedCompanyId)
  }
}, [selectedCompanyId])
```

---

## 4. Conflict Resolution

### 4.1 Conflict Detection

```typescript
// Optimistic Locking with Version Field
interface Invoice {
  id: string
  version: number  // Incremented on each update
  // ... other fields
}

// On update, check version
@Put('invoices/:id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdateInvoiceDto,
) {
  const invoice = await this.prisma.invoice.findUnique({ where: { id } })
  
  if (invoice.version !== dto.version) {
    throw new ConflictException('Invoice was modified by another user')
  }
  
  // Update with incremented version
  return this.prisma.invoice.update({
    where: { id },
    data: {
      ...dto,
      version: invoice.version + 1,
    },
  })
}
```

### 4.2 Conflict Resolution UI

```typescript
// ConflictModal.tsx
function ConflictModal({ localData, serverData, onResolve }: Props) {
  const [resolution, setResolution] = useState<'local' | 'server' | 'merge'>('server')
  
  return (
    <Modal open>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Conflict Detected</h2>
        <p className="text-sm text-secondary mb-6">
          This invoice was modified by another user. Choose how to resolve:
        </p>
        
        <div className="space-y-4">
          <RadioOption
            value="server"
            checked={resolution === 'server'}
            onChange={setResolution}
            label="Use server version (discard my changes)"
            description="Accept the other user's changes"
          />
          
          <RadioOption
            value="local"
            checked={resolution === 'local'}
            onChange={setResolution}
            label="Use my version (overwrite server)"
            description="Keep my changes, discard theirs"
          />
          
          <RadioOption
            value="merge"
            checked={resolution === 'merge'}
            onChange={setResolution}
            label="Merge both (advanced)"
            description="Manually combine changes"
          />
        </div>
        
        <div className="mt-6 flex gap-3">
          <Button onClick={() => onResolve(resolution, localData, serverData)}>
            Resolve
          </Button>
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

### 4.3 Last-Write-Wins Strategy

```typescript
// Default strategy: QuickBooks is source of truth

async function syncInvoice(localInvoice: Invoice): Promise<void> {
  try {
    // Attempt to update QBO
    const updated = await qboAdapter.updateInvoice(localInvoice.id, localInvoice)
    
    // Success - update local with confirmed data
    await db.invoices.put({
      ...updated,
      syncStatus: 'SYNCED',
    })
  } catch (error) {
    if (error.status === 409) { // Conflict
      // Fetch latest from QBO
      const latest = await qboAdapter.getInvoice(localInvoice.id)
      
      // Overwrite local with server version
      await db.invoices.put({
        ...latest,
        syncStatus: 'SYNCED',
      })
      
      // Notify user
      toast.warning('Invoice was updated by another user. Your changes were discarded.')
    } else {
      throw error
    }
  }
}
```

---

**END OF DOCUMENT 4**

Next Documents:
- Document 5: Error Handling, Development Setup & Testing
- Document 6: Deployment & Implementation Plan
