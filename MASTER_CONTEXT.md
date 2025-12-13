# MASTER_CONTEXT.md
## Superhuman for QuickBooks - Technical Specification Summary

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Pre-Implementation  

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Core Requirements](#core-requirements)
3. [Architecture Decisions](#architecture-decisions)
4. [Technical Constraints](#technical-constraints)
5. [Open Questions](#open-questions)
6. [Implementation Plan](#implementation-plan)

---

## Product Overview

### Vision
Build a **Superhuman-style productivity interface** for QuickBooks Online that delivers:
- **10x faster** navigation than native QBO UI
- **<20ms UI response time** for all interactions
- **Keyboard-first** workflow (mouse optional)
- **Local-first** architecture with instant responsiveness
- **Real-time sync** with QuickBooks Online

### Target Users
- Accountants and bookkeepers managing multiple clients
- Small business owners doing their own bookkeeping
- CFOs needing fast access to financial data
- Power users frustrated with slow QuickBooks UI

### Success Metrics (MVP)
- UI keypress response: <10ms average, <20ms p95
- Search 10K records: <50ms average, <100ms max
- Initial sync: <30 seconds for 10K entities
- Cache hit rate: >80%
- User can complete invoice creation in <30 seconds (vs. 2-3 minutes in native QBO)

---

## Core Requirements

### 1. Must Have Features (MVP v1)

**Authentication & Connection**
- OAuth 2.0 connection to QuickBooks Online
- Multi-company database structure (UI switcher in v2)
- Secure token storage with AES-256-GCM encryption
- Automatic token refresh with 5-minute buffer
- Sandbox and production environment support

**Data Synchronization**
- Initial full sync: Accounts, Customers, Vendors, Invoices, Bills, Journal Entries, Transactions
- Delta sync via webhooks + 60-second polling fallback
- Real-time push updates via WebSocket
- Sync status indicators: Syncing, Synced, Failed, Offline
- Background job queue (Bull + Redis) with retry mechanism

**Command Palette (⌘K)**
- Fuzzy search across all entities
- Multi-parameter filter chaining with Tab-to-lock
- Recent query memory (last 10 queries)
- Keyboard-only operation
- Sub-100ms search for 10K+ records

**CRUD Operations**
- Invoices: Create, Edit, Duplicate, Send
- Bills: Create, Edit, Duplicate
- Journal Entries: Create, Edit, Duplicate (with debit=credit validation)
- Transactions: View, Filter, Quick Edit (D=date, E=edit, M=memo)

**User Experience**
- 3-second undo window with visual countdown
- Optimistic updates (instant UI feedback)
- CSV export with applied filters
- Virtual scrolling for 100K+ rows
- Keyboard navigation (j/k, arrows, multi-select with Shift)

### 2. Explicitly Out of Scope (v2+)

The following features are **NOT** included in MVP to maintain focus and meet 8-week timeline:

- ❌ Reports (P&L, Balance Sheet, A/R Aging, A/P Aging)
- ❌ Multi-company UI switcher
- ❌ Email/password authentication
- ❌ Advanced conflict resolution UI
- ❌ Mobile applications
- ❌ Offline write capabilities
- ❌ Multi-user collaboration features
- ❌ Custom fields
- ❌ Bulk import via CSV
- ❌ Payment processing
- ❌ Time tracking
- ❌ Inventory management

### 3. Performance Requirements

| Operation | Target | Maximum | Measurement Point |
|-----------|--------|---------|-------------------|
| UI keypress response | <10ms | 20ms | keydown to DOM update |
| Button click feedback | <10ms | 20ms | visual state change |
| Command palette open | <30ms | 50ms | ⌘K to modal visible |
| Memory cache read | <5ms | 10ms | Map.get() return |
| IndexedDB read | <15ms | 30ms | single record fetch |
| Search 10K records | <50ms | 100ms | fuzzy search completion |
| Filter 50K records | <100ms | 200ms | predicate applied |
| Initial page load (FCP) | <1.5s | 2s | First Contentful Paint |
| Virtual list render | <50ms | 100ms | 10K rows |

**Scalability Targets:**
- 100,000+ transactions per company
- 50+ concurrent WebSocket connections
- 10,000 entities synced in <30 seconds
- IndexedDB storage: up to 500MB per company
- Memory cache: max 50MB active data

**Reliability Targets:**
- 99.5% uptime (production)
- Zero data loss during sync
- Auto-retry failed operations (3 attempts, exponential backoff)
- Graceful offline degradation

---

## Architecture Decisions

### 1. Tech Stack

**Frontend**
- **Framework:** React 18 + TypeScript (strict mode)
- **Build Tool:** Vite (fast HMR, optimized builds)
- **UI Library:** shadcn/ui (customizable components)
- **Styling:** Tailwind CSS (utility-first)
- **State Management:** Zustand (lightweight, no boilerplate)
- **Data Fetching:** React Query (caching, optimistic updates)
- **Local Storage:** Dexie.js (IndexedDB wrapper)
- **WebSocket:** Socket.io-client

**Backend**
- **Framework:** NestJS (TypeScript, enterprise-ready)
- **Database:** PostgreSQL 14+ (relational, ACID compliant)
- **ORM:** Prisma (type-safe, migration support)
- **Cache/Queue:** Redis 7+ with Bull (job queue)
- **WebSocket:** Socket.io (real-time bidirectional)
- **Authentication:** OAuth 2.0 (no JWT for MVP)

**Deployment**
- **Frontend Hosting:** Vercel (global CDN, auto-deploy)
- **Backend Hosting:** Render (auto-scaling, managed DB)
- **Database:** Render PostgreSQL (daily backups)
- **Redis:** Upstash (serverless, global)
- **Monitoring:** Sentry (errors), New Relic (performance)

### 2. Architectural Patterns

**Local-First Architecture**
```
Read Flow:
User Action → Memory Cache (0-5ms) → IndexedDB (10-20ms) → API (200-500ms)
                    ↓                       ↓                    ↓
                 INSTANT                  FAST                 SLOWER
```

**Write Flow (Optimistic Updates)**
```
User Action → Update Memory + IndexedDB immediately (optimistic)
           → Show undo toast (3 seconds)
           → If not cancelled: POST to API
           → Background job syncs to QuickBooks
           → WebSocket pushes confirmation to all clients
           → Update caches with confirmed data
```

**Sync Strategy**
```
Initial Sync: Full data fetch on first connection
    ↓
Webhook-Driven: QuickBooks pushes changes instantly
    ↓
Polling Fallback: Query every 60s if webhooks fail
```

**Decision: Why Local-First?**
- ✅ Instant UI response (<20ms requirement)
- ✅ Works during brief network interruptions
- ✅ Reduces API calls (cost + rate limits)
- ✅ Better user experience (no loading spinners)
- ⚠️ Trade-off: More complex cache invalidation

### 3. Data Model Decisions

**Multi-Company Support**
- Each Company has unique `qboRealmId` (QuickBooks identifier)
- All entities (Invoice, Bill, etc.) have `companyId` foreign key
- OAuth tokens stored per Company (encrypted at rest)
- **Decision:** Database supports multi-company from day 1, UI switcher deferred to v2

**Sync Status Tracking**
- Company-level: `PENDING | SYNCING | SYNCED | FAILED`
- Entity-level: `PENDING_SYNC | SYNCING | SYNCED | SYNC_ERROR`
- Allows granular error handling and retry logic

**Soft Deletes vs Hard Deletes**
- **Decision:** Use QuickBooks' void/inactive pattern (soft deletes)
- Invoices: status = VOID
- Entities: active = false
- Rationale: Matches QuickBooks behavior, preserves audit trail

### 4. Security Decisions

**Token Storage**
- **Decision:** AES-256-GCM encryption for OAuth tokens
- Key stored in environment variable (rotated quarterly)
- IV + auth tag prepended to ciphertext
- ✅ Protects against database breach

**CSRF Protection**
- OAuth state parameter (cryptographically random)
- Stored in Redis with 10-minute TTL
- Verified on callback

**Rate Limiting**
- Backend: 100 requests/minute per IP
- QuickBooks API: Respect 429 responses, exponential backoff
- WebSocket: Throttle reconnection attempts

### 5. Conflict Resolution Strategy

**Decision: Last-Write-Wins with QuickBooks as Source of Truth**

Rationale:
- QuickBooks is authoritative system of record
- Most conflicts are user editing same invoice in both UIs (rare)
- Auto-resolution is faster than manual UI for MVP

Flow:
1. Optimistic update shows changes immediately
2. Sync to QuickBooks fails with 409 Conflict
3. Fetch latest from QuickBooks
4. Overwrite local cache with server version
5. Show toast: "Invoice was updated elsewhere. Your changes were discarded."

**Deferred to v2:** Manual conflict resolution UI with merge options

### 6. Generic Adapter Decision

**Decision for MVP: Implement QuickBooksAdapter directly, extract interface later**

Rationale:
- Generic adapter adds complexity without immediate value
- No second provider planned for MVP
- Can refactor to interface pattern in v2 when adding Xero

**Alternative Considered:** Implement full generic adapter from start
- ❌ Over-engineering for single provider
- ❌ Slows MVP development
- ✅ Will refactor when proven necessary (YAGNI principle)

---

## Technical Constraints

### 1. QuickBooks API Limitations

**Rate Limits**
- 500 requests per minute per company (production)
- 100 requests per minute per company (sandbox)
- Mitigation: Local caching, queue with exponential backoff

**Webhook Reliability**
- Webhooks can be delayed or lost
- No guaranteed delivery
- Mitigation: Polling fallback every 60 seconds

**Data Access**
- Read-only access to certain fields (e.g., system-generated timestamps)
- Cannot modify closed periods (fiscal year locked)
- Cannot delete most entities (void/inactivate only)

**OAuth Token Expiration**
- Access token: 1 hour validity
- Refresh token: 100 days validity (rolling window)
- Must refresh before expiration or user must re-authenticate

**Entity Limitations**
- Maximum 1,000 line items per invoice/bill
- Maximum 30 custom fields per entity (not used in MVP)

### 2. Browser Limitations

**IndexedDB Quota**
- Chrome: ~60% of available disk space
- Firefox: 10% of available disk space, max 2GB per origin
- Safari: 1GB total limit (all websites combined)
- Mitigation: Warn at 400MB, auto-cleanup at 450MB

**Memory Constraints**
- Target: 50MB max for in-memory cache
- Mobile browsers: More aggressive garbage collection
- Mitigation: LRU eviction, avoid large object retention

**WebSocket Connections**
- Mobile Safari: Connection drops on background
- Mitigation: Auto-reconnect with exponential backoff

**Virtual Scrolling**
- DOM nodes: Keep rendered rows under 100 at a time
- Mitigation: react-window for windowing

### 3. Performance Constraints

**Search Performance**
- Fuzzy search with 10K records must complete in <100ms
- Constraint: JavaScript is single-threaded
- Mitigation: Deferrable search (debounce 100ms), index key fields

**Initial Sync Time**
- Target: 10K entities in <30 seconds
- Constraint: QuickBooks API rate limits
- Mitigation: Parallel requests (max 5 concurrent), pagination

**Network Latency**
- Assume 100-200ms average for API calls
- Cannot guarantee <20ms for cache misses
- Mitigation: 3-tier cache ensures 95%+ cache hits

### 4. Development Constraints

**Timeline**
- Fixed 8-week MVP timeline
- 320 hours total development time (1 full-time developer)
- No room for scope creep

**Team Size**
- 1 senior full-stack developer + AI pair programmer
- No dedicated QA (automated tests must be comprehensive)
- No dedicated DevOps (use managed services)

**Budget**
- Infrastructure: $500-1,000/year
- No budget for paid APIs beyond QuickBooks
- Must use free tiers where possible (Sentry, Vercel)

### 5. Business Constraints

**QuickBooks App Store Approval**
- Must pass security review (OAuth only, no password storage)
- Must handle rate limits gracefully
- Must provide user-friendly error messages
- Approval process: 2-4 weeks (plan for Week 9-10)

**Data Residency**
- QuickBooks data is stored on Intuit servers (cannot change)
- Our cache is temporary (can be cleared)
- No GDPR concerns for MVP (US-only launch)

**Support**
- No 24/7 support for MVP
- Email support only (response within 24 hours)
- Must have comprehensive error logging (Sentry)

---

## Open Questions

### 🔴 Critical (Must Resolve Before Week 1)

**Q1: User Authentication Model**
- **Question:** Is there a separate User model, or is Company the "user"?
- **Context:** Prisma schema has Company model with OAuth tokens, but no User model
- **Impact:** Affects database design, authentication flow, multi-company access
- **Options:**
  - A) 1 Company = 1 User (OAuth directly creates Company record)
  - B) User model with one-to-many relationship to Company
- **Recommendation:** Start with Option A for MVP simplicity, refactor to Option B in v2

**Q2: Company Selection Flow**
- **Question:** How does user initially select which company to work with after OAuth?
- **Context:** Database supports multi-company, but UI switcher is v2
- **Impact:** First-run user experience
- **Proposed Solution:** 
  - OAuth callback automatically selects the connected company
  - Store `selectedCompanyId` in localStorage
  - For MVP, user can only work with one company per browser session

**Q3: Historical Data Scope**
- **Question:** Do we sync ALL historical data or limit to recent (e.g., last 2 years)?
- **Context:** Initial sync target is 10K entities in <30 seconds
- **Impact:** Sync time, storage requirements, user expectations
- **Recommendation:** 
  - Default: Last 2 years of transactions
  - All-time: Accounts, Customers, Vendors (relatively small datasets)
  - Allow user to trigger "sync all history" as background job

### ⚠️ Important (Resolve by Week 3)

**Q4: IndexedDB Quota Management**
- **Question:** What data gets deleted first when approaching 500MB limit?
- **Options:**
  - A) Oldest transactions (FIFO)
  - B) Least recently accessed (LRU)
  - C) User chooses what to keep
- **Recommendation:** Option A with user notification

**Q5: Optimistic Update Rollback**
- **Question:** How do we revert optimistic changes if user navigates away during 3-second undo window?
- **Context:** Undo toast disappears when changing routes
- **Options:**
  - A) Persist undo queue in IndexedDB (survives navigation)
  - B) Execute immediately on navigation (no undo)
  - C) Block navigation during undo window
- **Recommendation:** Option B for MVP (simpler), Option A for v2

**Q6: Token Refresh During Long Operations**
- **Question:** What if access token expires mid-sync (long initial sync)?
- **Context:** Access token valid for 1 hour, initial sync could take 30+ seconds
- **Solution:** Refresh token proactively at 55-minute mark, handle 401 with retry

### 📝 Nice to Have (Can defer to implementation)

**Q7: Duplicate Invoice DocNumber**
- **Question:** When duplicating invoice, how is docNumber assigned?
- **Options:**
  - A) Auto-increment from last invoice
  - B) User enters manually
  - C) Leave blank, QuickBooks assigns on sync
- **Recommendation:** Option C (simplest, matches QuickBooks behavior)

**Q8: Journal Entry Line Count**
- **Question:** Maximum number of lines allowed in UI (QuickBooks has no hard limit)?
- **Recommendation:** Soft limit of 50 lines with "Add more" button (covers 99% of use cases)

**Q9: Search Ranking Algorithm**
- **Question:** How should fuzzy search results be ranked?
- **Options:**
  - A) Match quality only (Levenshtein distance)
  - B) Match quality + recency
  - C) Match quality + frequency of access
- **Recommendation:** Option B for MVP

**Q10: Export Filename Convention**
- **Question:** What format for CSV filenames?
- **Examples:**
  - `transactions_2024-12-09.csv`
  - `transactions_2024-12-09_14-30-00.csv`
  - `transactions_acme-corp_2024-12-09.csv`
- **Recommendation:** `{entity-type}_{company-name}_{date}.csv`

### 🤔 Clarifications Needed

**Q11: Keyboard Shortcut Conflicts**
- **Question:** How to handle browser shortcuts that conflict with app shortcuts?
- **Example:** Ctrl+R refreshes page (we want it to sync now)
- **Solution:** Use Ctrl+Shift+R for sync, document known conflicts

**Q12: WebSocket Disconnection During Write**
- **Question:** User creates invoice, WebSocket disconnects, undo timer expires, job executes. User never sees confirmation. What happens?
- **Proposed Solution:**
  - Persist pending operations in IndexedDB with status
  - Show "Syncing..." indicator in UI
  - Poll for status if WebSocket disconnected

**Q13: Pagination for Large Entity Lists**
- **Question:** `/customers` endpoint has no pagination. What if company has 50K customers?
- **Impact:** Initial load time, memory usage
- **Recommendation:** Add pagination (limit: 1000, offset) to all list endpoints

**Q14: Sandbox vs Production Environment Switching**
- **Question:** How does developer/tester switch between sandbox and production?
- **Options:**
  - A) Environment variable only (requires redeploy)
  - B) UI toggle (admin only)
  - C) Separate deployments (api-sandbox.yourledger.com)
- **Recommendation:** Option C for safety (no accidental production writes)

**Q15: Error Recovery After Multiple Sync Failures**
- **Question:** If entity fails to sync 3 times, what happens?
- **Context:** Docs mention 3 retry attempts with exponential backoff
- **Options:**
  - A) Mark as permanent error, require manual intervention
  - B) Keep retrying forever (with longer delays)
  - C) Queue for admin review
- **Recommendation:** Option A with "Retry Now" button in UI

---

## Implementation Plan

### Timeline: 8 Weeks (320 hours)

**Week 1-2: Foundation & Authentication**
- Project setup (NestJS + React + Vite + Prisma)
- Database schema + migrations
- QuickBooks OAuth flow (sandbox)
- Token encryption service
- Basic sync: Accounts, Customers, Vendors
- Deliverable: ✅ Connect to QuickBooks, sync basic data

**Week 3: Complete Sync Engine**
- Sync all entities (Invoices, Bills, JEs, Transactions)
- Webhook integration + signature verification
- Delta sync logic
- Polling fallback (60s)
- WebSocket gateway for real-time updates
- Deliverable: ✅ Real-time sync working

**Week 4: Frontend Data Layer**
- IndexedDB setup (Dexie.js)
- Memory cache manager (LRU)
- DataService (3-tier read strategy)
- WebSocket client with auto-reconnect
- React Query integration
- Deliverable: ✅ UI reads from cache (<20ms)

**Week 5: Command Palette & Lists**
- Command palette (cmdk) with fuzzy search
- Multi-filter with Tab-to-lock
- Transaction list with virtual scrolling
- Global keyboard shortcuts
- Status indicators
- Deliverable: ✅ Keyboard-first navigation

**Week 6: Invoice Form & Operations**
- Invoice form component
- Form validation
- Create/Edit/Duplicate/Send operations
- Optimistic updates
- 3-second undo toast
- Deliverable: ✅ Full invoice CRUD

**Week 7: Bills, JEs & Export**
- Bill form (similar to invoice)
- Journal entry form (debit=credit validation)
- CSV export functionality
- Dark mode toggle
- Error states + empty states
- Deliverable: ✅ All MVP CRUD operations

**Week 8: Testing & Deployment**
- Unit tests (target: 80% coverage)
- Integration tests (API endpoints)
- E2E tests (Playwright)
- Performance testing
- Production deployment (Vercel + Render)
- Monitoring setup (Sentry)
- CI/CD pipeline (GitHub Actions)
- Deliverable: ✅ Production-ready MVP

### Key Milestones

| Week | Milestone | Success Criteria |
|------|-----------|------------------|
| 2 | OAuth + Basic Sync | Can connect sandbox account and view accounts |
| 4 | Local-First Cache | UI responds in <20ms from cache |
| 6 | Invoice CRUD | Can create/edit invoice with undo |
| 8 | MVP Complete | All acceptance criteria met, deployed |

### Risk Mitigation

**High-Risk Items:**
1. **Performance targets (<20ms UI)** - Mitigate: Early performance testing, profiling
2. **QuickBooks API complexity** - Mitigate: Start with sandbox, test edge cases
3. **Cache invalidation bugs** - Mitigate: Comprehensive unit tests, clear cache strategy
4. **Sync reliability** - Mitigate: Polling fallback, retry logic, status tracking

**Contingency Plans:**
- If behind schedule at Week 4: Descope generic adapter (use QuickBooksAdapter directly)
- If behind schedule at Week 6: Descope Bills/JEs (focus on Invoices only)
- If behind schedule at Week 8: Launch with known bugs, create v1.1 hotfix release

---

## Success Criteria (Definition of Done)

### Functional Requirements
- ✅ User can connect QuickBooks sandbox account via OAuth
- ✅ Initial sync completes in <60 seconds for 10K entities
- ✅ Real-time updates arrive within 1 second of change in QuickBooks
- ✅ Command palette opens in <50ms and returns search results in <100ms
- ✅ Can create/edit/duplicate invoices with optimistic updates
- ✅ Can create/edit/duplicate bills
- ✅ Can create/edit/duplicate journal entries (debits=credits validation)
- ✅ 3-second undo window works for all write operations
- ✅ CSV export works for all entity types with applied filters
- ✅ All core actions accessible via keyboard shortcuts

### Performance Requirements
- ✅ UI interactions respond in <20ms (p95)
- ✅ Memory cache hit rate >80%
- ✅ No UI freezing or jank during normal operations
- ✅ Smooth scrolling with 100K+ rows in transaction list
- ✅ Initial page load (FCP) <2s

### Reliability Requirements
- ✅ Zero data loss during sync operations
- ✅ Graceful offline handling (queue operations, show status)
- ✅ Sync errors clearly communicated with actionable messages
- ✅ Automatic retry on failures (3 attempts, exponential backoff)

### Quality Requirements
- ✅ Test coverage ≥80% (unit + integration)
- ✅ All E2E critical paths covered (invoice creation, sync, command palette)
- ✅ No console errors or warnings in production build
- ✅ Code follows TypeScript strict mode + ESLint rules
- ✅ API documentation (Swagger) complete

### Deployment Requirements
- ✅ Runs in production environment (Vercel + Render)
- ✅ Health checks passing (/health endpoint)
- ✅ Monitoring active (Sentry for errors, uptime monitoring)
- ✅ CI/CD pipeline functional (automated tests + deploy)
- ✅ Environment variables properly configured

---

## Development Resources

### Repository Structure
```
superhuman-qbo/
├── backend/          # NestJS API
├── frontend/         # React + Vite
├── docs/            # Technical specs (6 documents)
├── MASTER_CONTEXT.md # This file
└── README.md        # Setup instructions
```

### Documentation References
- **Doc 1:** Requirements, Architecture & Diagrams
- **Doc 2:** Data Models & API Specifications
- **Doc 3:** UI Guidelines & Coding Structure
- **Doc 4:** Security, Sync Strategy & Caching
- **Doc 5:** Error Handling, Setup & Testing
- **Doc 6:** Deployment & Implementation Plan

### External Resources
- QuickBooks API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/
- Prisma Docs: https://www.prisma.io/docs
- NestJS Docs: https://docs.nestjs.com
- React Query: https://tanstack.com/query/latest
- Dexie.js: https://dexie.org

### Cost Estimate
- **Development:** $14,000-18,000 (320 hours @ $50-75/hr)
- **Infrastructure (Year 1):** $500-1,000
  - Render Pro: $85/month
  - Vercel Pro: $20/month
  - Upstash Redis: $10/month
  - Sentry: $0-26/month
  - Domain + SSL: $15/year
- **Total MVP Cost:** $14,500-19,000

Compare to external vendor (TechExtensor): $30,000 = **47% cost savings**

---

## Next Steps

### Immediate Actions (Before Week 1)
1. ✅ Resolve critical questions (Q1-Q3)
2. ✅ Create QuickBooks sandbox account
3. ✅ Set up GitHub repository
4. ✅ Configure development environment (Docker, VSCode)
5. ✅ Review all 6 technical spec documents

### Week 1 Kickoff Checklist
- [ ] Repository initialized with backend + frontend scaffolding
- [ ] Docker Compose running (Postgres + Redis)
- [ ] Prisma schema created + migrations run
- [ ] QuickBooks OAuth credentials obtained (sandbox)
- [ ] First OAuth flow test successful

### Decision Points
- **End of Week 2:** Confirm sync performance meets targets or adjust approach
- **End of Week 4:** Evaluate cache hit rates, optimize if needed
- **End of Week 6:** Go/No-Go decision on Bills/JEs (descope if behind)
- **End of Week 8:** Production deployment or defer to Week 9

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-12-09 | 1.0 | Initial MASTER_CONTEXT created from 6 technical specs | AI Assistant |

---

**END OF MASTER_CONTEXT.md**

*This document is the single source of truth for the Superhuman for QuickBooks MVP project. All decisions, requirements, constraints, and open questions are consolidated here for easy reference during implementation.*

