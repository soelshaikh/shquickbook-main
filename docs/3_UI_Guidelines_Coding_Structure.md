# Superhuman for QuickBooks
## Document 3: UI Guidelines & Coding Structure

**Version:** 1.0  
**Date:** December 2024  

---

## Table of Contents

1. [UI Guidelines & Design Principles](#1-ui-guidelines--design-principles)
2. [Keyboard Shortcuts](#2-keyboard-shortcuts)
3. [Command Palette Usage](#3-command-palette-usage)
4. [Coding Structure](#4-coding-structure)

---

## 1. UI Guidelines & Design Principles

### 1.1 Core Design Principles

**1. Speed Above All Else**
- Every interaction must feel instant (<20ms)
- No loading spinners for cached data
- Optimistic updates for all write operations
- Skeleton screens only for initial load
- Pre-fetch predictable user actions

**2. Keyboard-First Experience**
- Every action accessible via keyboard
- Minimal mouse dependency required
- Power users never need to leave keyboard
- Discoverable shortcuts (? for help)
- Consistent shortcut patterns

**3. Dense Information Display**
- Maximize data visible on screen
- Minimal whitespace (not cluttered, but efficient)
- Bloomberg terminal aesthetic
- Monospace numbers for alignment
- Compact but readable font sizes

**4. Clear Visual Feedback**
- Immediate response to every action
- Subtle animations (<100ms duration)
- Status indicators always visible
- Error states clearly communicated
- Progress bars for long operations

**5. Dark Mode Ready**
- Light/dark theme toggle
- Consistent contrast ratios
- Reduced eye strain for extended use
- Colors work in both modes
- User preference persisted

### 1.2 Visual Design System

**Color Palette:**

```css
/* Light Mode */
:root {
  --background: #ffffff;
  --foreground: #1a1a1a;
  --primary: #10b981;      /* Green - accent color */
  --secondary: #6b7280;    /* Gray - secondary text */
  --border: #e5e7eb;       /* Light gray - borders */
  --accent: #3b82f6;       /* Blue - links, info */
  --danger: #ef4444;       /* Red - errors, delete */
  --warning: #f59e0b;      /* Amber - warnings */
  --success: #10b981;      /* Green - success states */
  
  /* Surface colors */
  --surface-1: #f9fafb;    /* Subtle background */
  --surface-2: #f3f4f6;    /* Card backgrounds */
  --surface-3: #e5e7eb;    /* Hover states */
}

/* Dark Mode */
[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #ededed;
  --primary: #10b981;
  --secondary: #9ca3af;
  --border: #262626;
  --accent: #60a5fa;
  --danger: #f87171;
  --warning: #fbbf24;
  --success: #10b981;
  
  --surface-1: #1a1a1a;
  --surface-2: #262626;
  --surface-3: #404040;
}
```

**Typography:**

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**Spacing System:**

```css
/* Base unit: 4px */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

**Border Radius:**

```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
--radius-xl: 0.75rem;  /* 12px */
--radius-full: 9999px; /* Fully rounded */
```

**Animations:**

```css
/* Durations */
--duration-fast: 100ms;    /* Micro-interactions */
--duration-normal: 200ms;  /* Standard transitions */
--duration-slow: 300ms;    /* Larger movements */

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Common Transitions */
transition: all var(--duration-fast) var(--ease-out);
```

### 1.3 Component Patterns

**Buttons:**

```tsx
// Primary Button
<button className="
  px-4 py-2
  bg-primary text-white
  rounded-md
  hover:bg-primary/90
  focus:ring-2 focus:ring-primary focus:ring-offset-2
  transition-colors duration-100
  font-medium text-sm
">
  Save
</button>

// Secondary Button
<button className="
  px-4 py-2
  bg-transparent text-foreground
  border border-border
  rounded-md
  hover:bg-surface-1
  focus:ring-2 focus:ring-primary focus:ring-offset-2
  transition-colors duration-100
  font-medium text-sm
">
  Cancel
</button>

// Danger Button
<button className="
  px-4 py-2
  bg-danger text-white
  rounded-md
  hover:bg-danger/90
  focus:ring-2 focus:ring-danger focus:ring-offset-2
  transition-colors duration-100
  font-medium text-sm
">
  Delete
</button>
```

**Input Fields:**

```tsx
<input
  type="text"
  className="
    w-full px-3 py-2
    bg-background
    border border-border
    rounded-md
    text-foreground
    placeholder:text-secondary
    focus:outline-none
    focus:ring-2 focus:ring-primary
    focus:border-transparent
    transition-all duration-100
  "
  placeholder="Search transactions..."
/>
```

**Cards:**

```tsx
<div className="
  bg-surface-2
  border border-border
  rounded-lg
  p-4
  shadow-sm
  hover:shadow-md
  transition-shadow duration-200
">
  {/* Card content */}
</div>
```

### 1.4 Status Indicators

**Sync Status Badge (Always Visible in Top Right):**

```tsx
function SyncStatusBadge() {
  const { syncStatus, lastSyncAt } = useSyncStatus()
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2">
      {syncStatus === 'SYNCED' && (
        <>
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-secondary">
            Synced {formatDistanceToNow(lastSyncAt)} ago
          </span>
        </>
      )}
      
      {syncStatus === 'SYNCING' && (
        <>
          <Spinner className="w-3 h-3 text-warning" />
          <span className="text-xs text-secondary">Syncing...</span>
        </>
      )}
      
      {syncStatus === 'FAILED' && (
        <>
          <AlertCircle className="w-3 h-3 text-danger" />
          <span className="text-xs text-danger">Sync Failed</span>
        </>
      )}
      
      {syncStatus === 'OFFLINE' && (
        <>
          <WifiOff className="w-3 h-3 text-secondary" />
          <span className="text-xs text-secondary">Offline</span>
        </>
      )}
    </div>
  )
}
```

**Entity Sync Status:**

```tsx
function EntitySyncBadge({ status, error }: Props) {
  const badges = {
    PENDING_SYNC: {
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
      color: "bg-warning/10 text-warning border-warning/20"
    },
    SYNCING: {
      icon: <Spinner className="w-3 h-3" />,
      label: "Syncing",
      color: "bg-accent/10 text-accent border-accent/20"
    },
    SYNCED: {
      icon: <Check className="w-3 h-3" />,
      label: "Synced",
      color: "bg-success/10 text-success border-success/20"
    },
    SYNC_ERROR: {
      icon: <X className="w-3 h-3" />,
      label: "Failed",
      color: "bg-danger/10 text-danger border-danger/20"
    }
  }
  
  const badge = badges[status]
  
  return (
    <Tooltip content={error}>
      <div className={`
        inline-flex items-center gap-1 px-2 py-1
        border rounded-md text-xs font-medium
        ${badge.color}
      `}>
        {badge.icon}
        <span>{badge.label}</span>
      </div>
    </Tooltip>
  )
}
```

**Undo Toast (3-Second Window):**

```tsx
function UndoToast({ message, onUndo, onComplete }: Props) {
  const [progress, setProgress] = useState(100)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.max(0, p - (100 / 30))) // 3 seconds / 100ms
    }, 100)
    
    const timeout = setTimeout(() => {
      onComplete()
    }, 3000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])
  
  return (
    <div className="
      fixed bottom-4 right-4
      bg-surface-2 border border-border
      rounded-lg shadow-lg
      p-4 min-w-[300px]
    ">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-foreground">{message}</span>
        <button
          onClick={onUndo}
          className="
            px-3 py-1
            bg-primary text-white
            rounded-md text-sm font-medium
            hover:bg-primary/90
            transition-colors duration-100
          "
        >
          UNDO
        </button>
      </div>
      
      <div className="w-full h-1 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

### 1.5 Layout Structure

```tsx
// Main App Layout
<div className="h-screen flex flex-col bg-background text-foreground">
  {/* Header */}
  <header className="
    h-14 px-4
    border-b border-border
    flex items-center justify-between
  ">
    <div className="flex items-center gap-4">
      <Logo />
      <CompanySelector />
    </div>
    
    <div className="flex items-center gap-4">
      <SyncStatusBadge />
      <ThemeToggle />
      <UserMenu />
    </div>
  </header>
  
  {/* Main Content */}
  <div className="flex-1 flex overflow-hidden">
    {/* Sidebar (optional) */}
    <aside className="w-64 border-r border-border p-4">
      <Navigation />
    </aside>
    
    {/* Content Area */}
    <main className="flex-1 overflow-auto p-6">
      {children}
    </main>
  </div>
  
  {/* Status Bar (bottom) */}
  <footer className="
    h-8 px-4
    border-t border-border
    flex items-center justify-between
    bg-surface-1
    text-xs text-secondary
  ">
    <div className="flex items-center gap-4">
      <kbd>⌘K</kbd> Command Palette
      <kbd>?</kbd> Keyboard Shortcuts
    </div>
    <div>
      <ConnectionStatus />
    </div>
  </footer>
</div>
```

---

## 2. Keyboard Shortcuts

### 2.1 Global Shortcuts

| Key Combination | Action | Context |
|----------------|--------|---------|
| `⌘K` or `Ctrl+K` | Open command palette | Anywhere |
| `Esc` | Close modal/palette | When modal/palette open |
| `/` | Focus search/filter | List views |
| `?` | Show keyboard shortcuts help | Anywhere |
| `⌘,` or `Ctrl+,` | Open settings | Anywhere |
| `⌘L` or `Ctrl+L` | Toggle light/dark mode | Anywhere |

### 2.2 Navigation Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `↑` or `k` | Move selection up | Lists |
| `↓` or `j` | Move selection down | Lists |
| `Enter` | Open/edit selected item | Lists |
| `Space` | Select/deselect item | Lists |
| `Shift + ↑↓` | Multi-select range | Lists |
| `⌘A` or `Ctrl+A` | Select all | Lists |
| `PageUp` | Scroll page up | Lists |
| `PageDown` | Scroll page down | Lists |
| `Home` | Go to first item | Lists |
| `End` | Go to last item | Lists |

### 2.3 Command Palette Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Lock current filter, add more | Palette open |
| `Enter` | Execute search/command | Palette open |
| `↑↓` | Navigate results | Palette open |
| `Esc` | Close palette | Palette open |
| `Backspace` | Remove last filter | Palette open |

### 2.4 Transaction List Shortcuts

| Key | Action |
|-----|--------|
| `T` | Open transaction filters |
| `E` | Edit selected transaction |
| `D` | Quick edit date |
| `M` | Quick edit memo |
| `Delete` | Delete selected (with confirmation) |
| `Ctrl+C` | Copy selected |
| `Ctrl+X` | Cut selected |
| `Ctrl+V` | Paste |

### 2.5 Creation Shortcuts

| Key | Action |
|-----|--------|
| `I` | New invoice |
| `B` | New bill |
| `J` | New journal entry |
| `C` | New customer |
| `V` | New vendor |

### 2.6 Form Shortcuts

| Key Combination | Action |
|----------------|--------|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Ctrl+S` | Save (keep form open) |
| `Ctrl+Enter` | Save and close |
| `Ctrl+Shift+D` | Duplicate current record |
| `Ctrl+Shift+Enter` | Send (for invoices) |
| `Esc` | Cancel/close |

### 2.7 Editing Shortcuts

| Key Combination | Action |
|----------------|--------|
| `Ctrl+Z` | Undo (within 3-second window) |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Find in page |
| `Ctrl+H` | Find and replace |

### 2.8 Export & Actions

| Key Combination | Action |
|----------------|--------|
| `Ctrl+E` | Export current view to CSV |
| `Ctrl+P` | Print |
| `Ctrl+R` | Refresh data |
| `Ctrl+Shift+S` | Sync now |

### 2.9 Keyboard Shortcuts Help Modal

```tsx
function KeyboardShortcutsModal() {
  const shortcuts = [
    {
      category: "Global",
      items: [
        { keys: ["⌘", "K"], description: "Open command palette" },
        { keys: ["?"], description: "Show this help" },
        { keys: ["Esc"], description: "Close modal" },
      ]
    },
    {
      category: "Navigation",
      items: [
        { keys: ["↑", "↓"], description: "Navigate list" },
        { keys: ["j", "k"], description: "Navigate list (vim)" },
        { keys: ["Enter"], description: "Open selected" },
      ]
    },
    {
      category: "Actions",
      items: [
        { keys: ["I"], description: "New invoice" },
        { keys: ["B"], description: "New bill" },
        { keys: ["E"], description: "Edit selected" },
      ]
    }
  ]
  
  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Keyboard Shortcuts</h2>
        
        {shortcuts.map(section => (
          <div key={section.category} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{section.category}</h3>
            
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.description} className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-foreground">{item.description}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map(key => (
                      <kbd key={key} className="
                        px-2 py-1
                        bg-surface-2
                        border border-border
                        rounded
                        text-xs font-mono
                      ">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
```

---

## 3. Command Palette Usage

### 3.1 Command Palette Syntax

**Basic Search:**
```
invoice                     → Show all invoices
bill                        → Show all bills
transaction                 → Show all transactions
customer Adobe              → Show customer named "Adobe"
```

**Filter by Entity Type:**
```
invoice Adobe               → Invoices for customer "Adobe"
bill Google                 → Bills from vendor "Google"
transaction 4000            → Transactions in account 4000
```

**Date Filters:**
```
invoice 2024-02-01          → Invoices on Feb 1, 2024
invoice Feb 2024            → Invoices in February 2024
invoice this month          → Invoices this month
invoice last 30 days        → Invoices in last 30 days
invoice today               → Invoices today
invoice yesterday           → Invoices yesterday
invoice this week           → Invoices this week
invoice this year           → Invoices this year
```

**Multi-Filter with Tab-to-Lock:**
```
Step 1: Type "invoice"
Step 2: Press Tab (locks "invoice" filter)
Step 3: Type "Adobe"
Step 4: Press Tab (locks "Adobe" filter)
Step 5: Type "Feb 2024"
Step 6: Press Enter
Result: Shows invoices for Adobe in February 2024
```

**Quick Actions:**
```
create invoice              → Open new invoice form
new bill                    → Open new bill form
send invoice 1234           → Send invoice #1234
duplicate invoice 1234      → Duplicate invoice #1234
export transactions         → Export current view to CSV
sync now                    → Trigger manual sync
```

**Status Filters:**
```
invoice draft               → Draft invoices
invoice paid                → Paid invoices
invoice overdue             → Overdue invoices
bill open                   → Open bills
```

**Amount Filters:**
```
invoice >1000               → Invoices over $1000
bill <500                   → Bills under $500
transaction 100-500         → Transactions between $100-$500
```

### 3.2 Command Palette Implementation

```tsx
function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [results, setResults] = useState<any[]>([])
  
  // Open with ⌘K
  useKeyPress(['Meta+k', 'Ctrl+k'], () => setOpen(true))
  
  // Fuzzy search
  const search = useDebouncedCallback((q: string) => {
    const allFilters = [...filters, q].filter(Boolean)
    const searchResults = fuzzySearch(allFilters, data)
    setResults(searchResults)
  }, 100)
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      // Lock current query as filter
      if (query.trim()) {
        setFilters([...filters, query.trim()])
        setQuery('')
      }
    } else if (e.key === 'Enter') {
      // Execute search or action
      if (results.length > 0) {
        executeAction(results[0])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFilters([])
      setQuery('')
    }
  }
  
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Filter chips */}
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {filters.map((filter, i) => (
              <div key={i} className="
                inline-flex items-center gap-2
                px-3 py-1
                bg-primary/10 text-primary
                border border-primary/20
                rounded-full text-sm
              ">
                <span>{filter}</span>
                <button
                  onClick={() => setFilters(filters.filter((_, j) => j !== i))}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            search(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          placeholder={filters.length > 0 ? "Add more filters..." : "Search or type a command..."}
          className="
            w-full px-4 py-3
            bg-background
            border border-border
            rounded-lg
            text-foreground
            placeholder:text-secondary
            focus:outline-none
            focus:ring-2 focus:ring-primary
          "
          autoFocus
        />
        
        {/* Results */}
        <div className="mt-2 max-h-96 overflow-auto">
          {results.map((result, i) => (
            <div
              key={i}
              className="
                px-4 py-3
                hover:bg-surface-1
                cursor-pointer
                border-b border-border last:border-0
              "
              onClick={() => executeAction(result)}
            >
              <div className="font-medium text-foreground">{result.title}</div>
              <div className="text-sm text-secondary">{result.subtitle}</div>
            </div>
          ))}
        </div>
        
        {/* Help text */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-secondary">
            <div><kbd>Tab</kbd> to lock filter</div>
            <div><kbd>Enter</kbd> to select</div>
            <div><kbd>Esc</kbd> to cancel</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
```

---

## 4. Coding Structure

### 4.1 Backend Structure (NestJS)

```
backend/
├── src/
│   ├── main.ts                          # Application entry
│   ├── app.module.ts                    # Root module
│   │
│   ├── accounting/                      # Generic adapter layer
│   │   ├── accounting.module.ts
│   │   ├── interfaces/
│   │   │   ├── accounting-adapter.interface.ts
│   │   │   ├── sync-result.interface.ts
│   │   │   └── filter-params.interface.ts
│   │   ├── adapters/
│   │   │   └── quickbooks/
│   │   │       ├── quickbooks.adapter.ts
│   │   │       ├── quickbooks-api.service.ts
│   │   │       ├── quickbooks-mapper.service.ts
│   │   │       └── dto/
│   │   └── entities/                    # Generic entities
│   │       ├── account.entity.ts
│   │       ├── invoice.entity.ts
│   │       └── ...
│   │
│   ├── auth/                            # OAuth & authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── quickbooks-oauth.strategy.ts
│   │   └── guards/
│   │       └── company.guard.ts
│   │
│   ├── companies/                       # Multi-company management
│   │   ├── companies.module.ts
│   │   ├── companies.controller.ts
│   │   ├── companies.service.ts
│   │   └── dto/
│   │
│   ├── sync/                            # Sync engine
│   │   ├── sync.module.ts
│   │   ├── sync.service.ts
│   │   ├── sync.processor.ts           # Bull processor
│   │   ├── webhooks.controller.ts
│   │   └── webhooks.service.ts
│   │
│   ├── transactions/                    # Transaction management
│   │   ├── transactions.module.ts
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   └── dto/
│   │
│   ├── invoices/                        # Invoice operations
│   │   ├── invoices.module.ts
│   │   ├── invoices.controller.ts
│   │   ├── invoices.service.ts
│   │   └── dto/
│   │       ├── create-invoice.dto.ts
│   │       ├── update-invoice.dto.ts
│   │       └── send-invoice.dto.ts
│   │
│   ├── bills/                           # Bill operations
│   │   ├── bills.module.ts
│   │   ├── bills.controller.ts
│   │   ├── bills.service.ts
│   │   └── dto/
│   │
│   ├── journal-entries/                 # JE operations
│   │   ├── journal-entries.module.ts
│   │   ├── journal-entries.controller.ts
│   │   ├── journal-entries.service.ts
│   │   └── dto/
│   │
│   ├── realtime/                        # WebSocket gateway
│   │   ├── realtime.module.ts
│   │   ├── realtime.gateway.ts
│   │   └── events/
│   │
│   ├── common/                          # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   └── config/                          # Configuration
│       ├── database.config.ts
│       ├── redis.config.ts
│       └── quickbooks.config.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

### 4.2 Frontend Structure (React)

```
frontend/
├── src/
│   ├── main.tsx                         # Entry point
│   ├── App.tsx                          # Root component
│   │
│   ├── services/                        # Data & API services
│   │   ├── data-service.ts             # Local-first data layer
│   │   ├── api-client.ts               # HTTP client
│   │   ├── websocket-client.ts         # WebSocket client
│   │   └── adapters/
│   │
│   ├── stores/                          # State management (Zustand)
│   │   ├── app-store.ts                # Global app state
│   │   ├── auth-store.ts               # Auth state
│   │   ├── data-store.ts               # Entity data
│   │   ├── ui-store.ts                 # UI state
│   │   └── sync-store.ts               # Sync status
│   │
│   ├── lib/                             # Utilities & setup
│   │   ├── indexeddb.ts                # Dexie.js
│   │   ├── cache-manager.ts            # Memory cache
│   │   ├── keyboard-shortcuts.ts       # Global shortcuts
│   │   ├── fuzzy-search.ts             # Search logic
│   │   └── utils/
│   │
│   ├── components/                      # React components
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBar.tsx
│   │   │
│   │   ├── command-palette/
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── FilterChip.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── hooks/
│   │   │       └── useCommandPalette.ts
│   │   │
│   │   ├── transaction-list/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionRow.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   └── hooks/
│   │   │       └── useTransactions.ts
│   │   │
│   │   ├── invoice-form/
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── InvoiceLineItem.tsx
│   │   │   ├── CustomerSelect.tsx
│   │   │   └── hooks/
│   │   │       └── useInvoiceForm.ts
│   │   │
│   │   ├── bill-form/
│   │   │   ├── BillForm.tsx
│   │   │   └── ...
│   │   │
│   │   ├── journal-entry-form/
│   │   │   ├── JournalEntryForm.tsx
│   │   │   └── ...
│   │   │
│   │   ├── ui/                          # shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   └── shared/
│   │       ├── SyncStatusBadge.tsx
│   │       ├── UndoToast.tsx
│   │       ├── KeyboardShortcutsModal.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                           # Custom hooks
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useKeyPress.ts
│   │   ├── useWebSocket.ts
│   │   └── useOptimisticUpdate.ts
│   │
│   ├── types/                           # TypeScript types
│   │   ├── entities.ts
│   │   ├── api.ts
│   │   ├── filters.ts
│   │   └── events.ts
│   │
│   ├── styles/                          # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── themes/
│   │
│   └── routes/                          # Routes
│       ├── index.tsx
│       ├── Dashboard.tsx
│       └── Transactions.tsx
│
├── public/
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 4.3 Coding Standards

**TypeScript Configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Naming Conventions:**

```typescript
// Files
transaction-list.tsx          // Components: kebab-case
use-transactions.ts           // Hooks: kebab-case
data-service.ts               // Services: kebab-case
transaction.entity.ts         // Entities: kebab-case
create-invoice.dto.ts         // DTOs: kebab-case

// Variables & Functions
const isLoading = true        // camelCase
function calculateTotal() {}   // camelCase
const handleClick = () => {}  // camelCase

// Classes & Interfaces
class InvoiceService {}       // PascalCase
interface TransactionFilter {} // PascalCase
type InvoiceStatus = ...      // PascalCase

// Enums
enum TransactionType {}       // PascalCase

// Constants
const API_BASE_URL = ''       // UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3  // UPPER_SNAKE_CASE
```

**Component Structure:**

```typescript
// ✅ Good component structure
import { useState, useEffect } from 'react'
import { Invoice } from '@/types/entities'
import { Button } from '@/components/ui/button'

interface InvoiceFormProps {
  invoice?: Invoice
  onSave: (invoice: Invoice) => Promise<void>
  onCancel: () => void
}

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
  // State
  const [formData, setFormData] = useState<Partial<Invoice>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Effects
  useEffect(() => {
    if (invoice) {
      setFormData(invoice)
    }
  }, [invoice])
  
  // Handlers
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSave(formData as Invoice)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Render
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

**Error Handling:**

```typescript
// ✅ Proper error handling
try {
  const result = await apiClient.post('/invoices', data)
  return result
} catch (error) {
  if (error instanceof AppError) {
    // Handle known errors
    toast.error(error.message)
  } else if (error.response?.status === 401) {
    // Handle auth errors
    router.push('/login')
  } else {
    // Handle unknown errors
    console.error('Unexpected error:', error)
    toast.error('Something went wrong')
  }
  throw error
}
```

**Git Commit Messages:**

```bash
# Format: <type>(<scope>): <subject>

feat(invoices): add duplicate invoice functionality
fix(sync): resolve webhook signature verification bug
docs(api): update invoice endpoint documentation
refactor(cache): improve memory cache eviction logic
test(data-service): add unit tests for optimistic updates
chore(deps): update dependencies to latest versions
style(ui): fix button spacing inconsistency
perf(search): optimize fuzzy search for large datasets
```

---

**END OF DOCUMENT 3**

Next Documents:
- Document 4: Security, Sync Strategy & Local-First Caching
- Document 5: Error Handling, Development Setup & Testing
- Document 6: Deployment, DevOps & 8-Week Implementation Plan
