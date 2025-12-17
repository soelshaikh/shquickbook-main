import { cn } from '@/lib/utils';
import { ColumnSettings } from '@/components/shared/ColumnSettings';
import { ColumnConfig } from '@/types/columnConfig';
import { Mail } from 'lucide-react';
import { INVOICE_COLUMN_STYLES } from '@/config/invoiceColumns';

interface InvoiceListHeaderProps {
  selectedCount: number;
  totalCount: number;
  columns?: ColumnConfig[];
  onToggleColumn?: (columnKey: string) => void;
  onResetColumns?: () => void;
}

export function InvoiceListHeader({ 
  selectedCount, 
  totalCount,
  columns,
  onToggleColumn,
  onResetColumns,
}: InvoiceListHeaderProps) {
  // Get visible columns
  const visibleColumns = columns?.filter(col => col.visible) || [];
  
  return (
    <div className="h-8 flex items-center text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 px-3">
      {selectedCount > 0 ? (
        <div className="flex items-center justify-between w-full">
          <span className="text-foreground">{selectedCount} of {totalCount} selected</span>
          {columns && onToggleColumn && onResetColumns && (
            <ColumnSettings 
              columns={columns}
              onToggleColumn={onToggleColumn}
              onReset={onResetColumns}
              variant="header"
            />
          )}
        </div>
      ) : (
        <>
          {/* Dynamically render column headers based on visibility */}
          {(!columns || columns.length === 0) ? (
            // Fallback to default columns if no column config provided
            <>
              {Object.values(INVOICE_COLUMN_STYLES).map(style => (
                <div key={style.key} className={style.headerClass}>
                  {style.key === 'emailStatus' ? (
                    <Mail className="h-3.5 w-3.5" />
                  ) : (
                    style.label
                  )}
                </div>
              ))}
            </>
          ) : (
            // Render only visible columns using centralized styles
            <>
              {visibleColumns.map(col => {
                const style = INVOICE_COLUMN_STYLES[col.key];
                if (!style) return null;
                
                return (
                  <div key={col.key} className={style.headerClass}>
                    {col.key === 'emailStatus' ? (
                      <Mail className="h-3.5 w-3.5" />
                    ) : (
                      style.label
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
