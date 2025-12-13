import { FilterChip } from '@/components/shared/FilterBar';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, row: T) => string;
}

export interface ExportConfig<T> {
  data: T[];
  columns: ExportColumn<T>[];
  entityName: string;
  filters?: FilterChip[];
}

// Escape CSV field values
function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Format currency values
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

// Format date values from ISO to MM/DD/YYYY
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Generate date-stamped filename with filter info
export function generateFilename(entityName: string, filters?: FilterChip[]): string {
  const date = new Date().toISOString().split('T')[0];
  let filename = `${entityName}_${date}`;
  
  if (filters && filters.length > 0) {
    const filterParts = filters.map(f => `${f.type}-${f.value}`).join('_');
    filename += `_${filterParts}`;
  }
  
  return `${filename}.csv`;
}

// Get nested value from object using dot notation
function getNestedValue<T>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

// Generate CSV content
export function generateCSV<T>(config: ExportConfig<T>): string {
  const { data, columns, entityName, filters } = config;
  const lines: string[] = [];
  
  // Add metadata header as comments
  lines.push(`# Export: ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`);
  lines.push(`# Date: ${new Date().toLocaleString()}`);
  if (filters && filters.length > 0) {
    const filterStr = filters.map(f => `${f.type}: ${f.label}`).join(', ');
    lines.push(`# Filters: ${filterStr}`);
  }
  lines.push(`# Total Records: ${data.length}`);
  lines.push('');
  
  // Add header row
  const headers = columns.map(col => escapeCSVField(col.header));
  lines.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = columns.map(col => {
      const rawValue = getNestedValue(row, col.key as string);
      const formatted = col.formatter ? col.formatter(rawValue, row) : rawValue;
      return escapeCSVField(formatted);
    });
    lines.push(values.join(','));
  }
  
  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + lines.join('\n');
}

// Download CSV file
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convenience function to export data
export function exportToCSV<T>(config: ExportConfig<T>): void {
  const csv = generateCSV(config);
  const filename = generateFilename(config.entityName, config.filters);
  downloadCSV(csv, filename);
}
