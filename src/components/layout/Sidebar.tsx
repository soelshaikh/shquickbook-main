import { useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeftRight, 
  FileText, 
  Receipt, 
  BookOpen,
  Settings,
  Link as LinkIcon,
  CreditCard,
  Wallet,
  FileX,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnection } from '@/contexts/ConnectionContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight, shortcut: 'T' },
  { label: 'Invoices', path: '/invoices', icon: FileText, shortcut: 'I' },
  { label: 'Bills', path: '/bills', icon: Receipt, shortcut: 'B' },
  { label: 'Journal Entries', path: '/journal-entries', icon: BookOpen, shortcut: 'J' },
  { label: 'Customer Payments', path: '/customer-payments', icon: CreditCard, shortcut: 'C' },
  { label: 'Vendor Payments', path: '/vendor-payments', icon: Wallet, shortcut: 'V' },
  { label: 'Credit Memos', path: '/credit-memos', icon: FileX, shortcut: 'M' },
  { label: 'Deposits', path: '/deposits', icon: Landmark, shortcut: 'D' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { isConnected } = useConnection();

  return (
    <aside className="w-48 border-r border-border bg-sidebar-background flex flex-col shrink-0">
      <nav className="flex-1 py-2">
        <div className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors',
                  'hover:bg-sidebar-accent',
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                    : 'text-sidebar-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="kbd text-[10px]">{item.shortcut}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-sidebar-border py-2 px-2 space-y-0.5">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors',
                'hover:bg-sidebar-accent',
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Connect QBO - shown only during onboarding when not connected */}
        {!isConnected && (
          <Link
            to="/connect"
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors',
              'hover:bg-sidebar-accent text-primary'
            )}
          >
            <LinkIcon className="h-4 w-4 shrink-0" />
            <span>Connect QBO</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
