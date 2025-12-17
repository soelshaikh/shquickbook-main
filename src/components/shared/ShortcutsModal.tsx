import { forwardRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: 'Global',
    items: [
      { keys: ['⌘', 'K'], description: 'Open Command Palette' },
      { keys: ['⌘', 'L'], description: 'Toggle Theme' },
      { keys: ['⌘', ','], description: 'Open Settings' },
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', 'Y'], description: 'Redo' },
      { keys: ['/'], description: 'Focus Search' },
      { keys: ['?'], description: 'Show Keyboard Shortcuts' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['T'], description: 'Go to Transactions' },
      { keys: ['I'], description: 'Go to Invoices / New Invoice (on page)' },
      { keys: ['B'], description: 'Go to Bills / New Bill (on page)' },
      { keys: ['J'], description: 'Go to Journal Entries / New Entry (on page)' },
      { keys: ['P'], description: 'Go to Customer Payments' },
      { keys: ['V'], description: 'Go to Vendor Payments' },
      { keys: ['C'], description: 'Go to Credit Memos' },
      { keys: ['D'], description: 'Go to Deposits' },
    ],
  },
  {
    category: 'List Navigation',
    items: [
      { keys: ['↑', '↓'], description: 'Navigate up/down' },
      { keys: ['Home'], description: 'Go to first item' },
      { keys: ['End'], description: 'Go to last item' },
      { keys: ['F'], description: 'Focus search / filter' },
      { keys: ['Shift', '↑↓'], description: 'Range select' },
      { keys: ['Shift', 'Click'], description: 'Range select (mouse)' },
      { keys: ['⌘', 'A'], description: 'Select all' },
      { keys: ['Space'], description: 'Toggle selection' },
      { keys: ['Enter'], description: 'Open selected item' },
      { keys: ['E'], description: 'Open selected item' },
      { keys: ['Esc'], description: 'Clear selection' },
    ],
  },
  {
    category: 'Transaction Quick Edit',
    items: [
      { keys: ['D'], description: 'Quick edit date (Transactions only)' },
      { keys: ['M'], description: 'Quick edit memo (Transactions only)' },
    ],
  },
  {
    category: 'Invoice/Bill Form Editing',
    items: [
      { keys: ['C'], description: 'Focus Customer field' },
      { keys: ['D'], description: 'Focus Invoice/Due Date' },
      { keys: ['U'], description: 'Focus Due Date' },
      { keys: ['L'], description: 'Focus Line Items (first)' },
      { keys: ['N'], description: 'Add new line item' },
      { keys: ['M'], description: 'Focus Memo field' },
      { keys: ['Tab'], description: 'Move to next field' },
    ],
  },
  {
    category: 'Form Actions',
    items: [
      { keys: ['Ctrl', 'S'], description: 'Save' },
      { keys: ['Ctrl', 'Enter'], description: 'Save and Close' },
      { keys: ['Ctrl', 'Shift', 'Enter'], description: 'Send Invoice' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Duplicate current record (when selected)' },
      { keys: ['Esc'], description: 'Close form' },
    ],
  },
  {
    category: 'Data',
    items: [
      { keys: ['Ctrl', 'Shift', 'E'], description: 'Export current view to CSV' },
    ],
  },
];

export const ShortcutsModal = forwardRef<HTMLDivElement, ShortcutsModalProps>(
  ({ open, onOpenChange }, ref) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <kbd key={keyIdx} className="kbd">
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
        </DialogContent>
      </Dialog>
    );
  }
);

ShortcutsModal.displayName = 'ShortcutsModal';
