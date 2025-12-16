# AdvancedFilter Integration - Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Transactions                           [Add Filter ⌘F] [Export] │ ← PageToolbar
├─────────────────────────────────────────────────────────────────┤
│ [Filter Bar - Old System] (Conditionally shown)                 │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ Render Limit Warning (if needed)                             │
├─────────────────────────────────────────────────────────────────┤
│ Showing 45 of 500 transactions                                  │ ← Filter Results (NEW)
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [amount greater than 1000] [X]                            │   │ ← Active Filter Badges (NEW)
│ │ [date between Jan 1 - Mar 31] [X]                         │   │
│ │ [Clear all]                                               │   │
│ └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ Transaction List (Virtualized)                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Date       | Type    | Entity        | Amount    | Status  │ │
│ │ 2024-01-15 | Invoice | Acme Corp     | $5,200.00 | Synced  │ │
│ │ 2024-01-20 | Invoice | TechStart     | $3,400.00 | Synced  │ │
│ │ 2024-02-05 | Invoice | Global Sol    | $1,800.00 | Synced  │ │
│ │ ...                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Filter Builder Flow

### Step 1: Click "Add Filter"
```
┌─────────────────────────────┐
│ [+ Add Filter ⌘F]           │ ← Click this button
└─────────────────────────────┘
```

### Step 2: Select Field
```
┌─────────────────────────────┐
│ 1. Field → 2. Operator → 3. Value   ← Progress indicator
├─────────────────────────────┤
│ 🔍 Search fields...         │
├─────────────────────────────┤
│ > Description        text   │ ← Arrow keys to navigate
│   Amount            number  │
│   Date              date    │
│   Category          text    │
│   Account           text    │
│   Type              select  │
└─────────────────────────────┘
```

### Step 3: Select Operator
```
┌─────────────────────────────┐
│ 1. Field → 2. Operator → 3. Value
├─────────────────────────────┤
│ > equals                    │
│   does not equal            │
│   greater than              │ ← Choose operator
│   greater than or equal to  │
│   less than                 │
│   less than or equal to     │
│   between                   │
└─────────────────────────────┘
```

### Step 4: Enter Value
```
┌─────────────────────────────┐
│ 1. Field → 2. Operator → 3. Value
├─────────────────────────────┤
│ [1000________________]      │ ← Type value (number input)
│                             │
│         [Cancel] [Add Filter]
└─────────────────────────────┘
```

### Result: Filter Added
```
┌─────────────────────────────────────┐
│ [amount greater than 1000] [X]      │ ← New filter badge
│ [+ Add Filter ⌘F]                   │
└─────────────────────────────────────┘
```

## Filter Type Examples

### Text Filter
```
Field: Description
Operator: contains
Value: [consulting________]

Result: "description contains consulting"
```

### Number Filter
```
Field: Amount
Operator: greater than
Value: [1000______________]

Result: "amount greater than 1000"
```

### Date Filter (Single)
```
Field: Date
Operator: greater than
Value: [📅 Jan 1, 2024]

Result: "date greater than Jan 1, 2024"
```

### Date Filter (Range)
```
Field: Date
Operator: between
Value: [📅 Jan 1, 2024]
       [📅 Mar 31, 2024]

Result: "date between Jan 1, 2024 - Mar 31, 2024"
```

### Select Filter
```
Field: Type
Operator: equals
Value: [Invoice ▼]
       • Invoice
       • Payment
       • Expense

Result: "type equals Invoice"
```

## Active Filters Display

### Single Filter
```
┌─────────────────────────────────────────┐
│ [amount greater than 1000] [X]          │
└─────────────────────────────────────────┘
```

### Multiple Filters
```
┌──────────────────────────────────────────────────────────┐
│ [amount greater than 1000] [X]                           │
│ [date between Jan 1 - Mar 31] [X]                        │
│ [type equals invoice] [X]                                │
│ [Clear all]                                              │
└──────────────────────────────────────────────────────────┘
```

### With Results Summary
```
┌──────────────────────────────────────────────────────────┐
│ [amount greater than 1000] [X]                           │
│ [date between Jan 1 - Mar 31] [X]                        │
│ [Clear all]                                              │
└──────────────────────────────────────────────────────────┘

Showing 23 of 500 transactions
```

### Combined with Old Filters
```
┌──────────────────────────────────────────────────────────┐
│ Old Filter Chips: [Type: Invoice] [X]  [Status: Synced] [X]
├──────────────────────────────────────────────────────────┤
│ Advanced Filters: [amount > 1000] [X]  [date between...] [X]
│ [Clear all]                                              │
└──────────────────────────────────────────────────────────┘

Showing 12 of 500 transactions (combined with filter chips)
```

## Keyboard Shortcuts

### Opening Filter Builder
```
⌘F (Mac) or Ctrl+F (Windows)
  ↓
Opens filter popover at "Field" step
```

### Navigating Options
```
↑ / ↓  - Navigate through field/operator list
Enter  - Select current item and move to next step
Escape - Close popover / Cancel filter
Tab    - Navigate between input fields
```

### Managing Filters
```
Click [X] on badge - Remove individual filter
Click "Clear all"  - Remove all advanced filters
```

## User Interaction Flow

### Quick Filter Creation
```
1. User presses ⌘F
   ↓
2. Field selector appears, type "am" to search
   ↓
3. "Amount" is highlighted, press Enter
   ↓
4. Operator selector appears, arrow to "greater than"
   ↓
5. Press Enter
   ↓
6. Number input appears, type "1000"
   ↓
7. Press Enter
   ↓
8. Filter badge appears, list updates instantly
```

### Complex Filter Scenario
```
Goal: Find Q1 2024 invoices over $5,000 to Acme Corp

Steps:
1. Advanced Filter: date between Jan 1 - Mar 31, 2024
2. Advanced Filter: amount > 5000
3. Advanced Filter: type equals invoice
4. Search box: "Acme"

Result: 3 transactions match all criteria
```

## Visual States

### Normal State (No Filters)
```
┌─────────────────────────────────────────┐
│ [+ Add Filter ⌘F] [Export]              │
│                                         │
│ 500 transactions                        │
│ [All transactions displayed...]         │
└─────────────────────────────────────────┘
```

### Filtered State (Active Filters)
```
┌─────────────────────────────────────────┐
│ [amount > 1000] [X] [+ Add Filter] [Export]
│                                         │
│ Showing 45 of 500 transactions         │
│ [Filtered transactions displayed...]    │
└─────────────────────────────────────────┘
```

### Empty State (No Matches)
```
┌─────────────────────────────────────────┐
│ [amount > 999999] [X] [+ Add Filter]    │
│                                         │
│ Showing 0 of 500 transactions          │
│                                         │
│         No transactions found           │
│                                         │
└─────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────┐
│ [+ Add Filter ⌘F] [Export]              │
│                                         │
│ [Loading skeleton...]                   │
│ [Loading skeleton...]                   │
│ [Loading skeleton...]                   │
└─────────────────────────────────────────┘
```

## Mobile/Responsive Considerations

### Desktop (>768px)
- Filter badges display inline
- Full field labels shown
- Popover aligned to button

### Tablet (768px - 1024px)
- Filter badges wrap to multiple lines
- Slightly smaller popover
- Touch-friendly tap targets

### Mobile (<768px)
- Filter badges stack vertically
- Full-screen popover overlay
- Large tap targets for touch

## Accessibility Features

### Screen Reader Announcements
```
"Add Filter button, keyboard shortcut Command F"
"Filter popover opened, Step 1 of 3: Select field"
"Amount field, number type"
"Filter added: amount greater than 1000"
"Showing 45 of 500 transactions"
```

### Keyboard Navigation
```
Tab order:
1. Add Filter button
2. Active filter badges (X buttons)
3. Clear all button
4. Transaction list
```

### Focus Management
```
Open popover → Focus on search input
Select field → Focus on operator list
Select operator → Focus on value input
Add filter → Focus returns to Add Filter button
```

## Color Coding (Following Design System)

```
• Filter Badges: secondary variant (gray background)
• Active state: primary border
• Hover state: slightly darker background
• Remove button: ghost variant, destructive on hover
• Results text: muted-foreground color
• Strong emphasis: foreground color, bold weight
```

## Integration Points

### Existing Features (Preserved)
```
✓ Search box
✓ Old FilterBar
✓ Export button
✓ Render limit warning
✓ Quick edit (D/M keys)
✓ Transaction detail
✓ List navigation
✓ Multi-select
```

### New Features (Added)
```
+ AdvancedFilter component
+ Filter configuration
+ Filter application logic
+ Results summary
+ Combined filter support
```

---

This visual guide demonstrates how the AdvancedFilter seamlessly integrates into the existing Transactions page UI.
