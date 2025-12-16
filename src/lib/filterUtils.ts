/**
 * Filter Utility Functions
 * 
 * Helper functions to apply filters to data.
 * These live in hooks/pages, NOT in the AdvancedFilter component.
 */

import { Filter } from '@/types/filter';

/**
 * Helper to convert date strings or Date objects to comparable format
 */
function toComparableDate(value: any): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.getTime();
  }
  return null;
}

/**
 * Apply a single filter to a data item
 */
export function applyFilter<T extends Record<string, any>>(
  item: T,
  filter: Filter
): boolean {
  const fieldValue = item[filter.field];

  // Handle isEmpty/isNotEmpty
  if (filter.operator === 'isEmpty') {
    return fieldValue === null || fieldValue === undefined || fieldValue === '';
  }
  if (filter.operator === 'isNotEmpty') {
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  }

  // Early return if field is empty for other operators
  if (fieldValue === null || fieldValue === undefined) {
    return false;
  }

  const value = filter.value;

  switch (filter.operator) {
    case 'equals':
      // For dates, compare normalized timestamps
      const fieldDate = toComparableDate(fieldValue);
      const valueDate = toComparableDate(value);
      if (fieldDate !== null && valueDate !== null) {
        // Compare dates ignoring time (same day)
        return new Date(fieldDate).toDateString() === new Date(valueDate).toDateString();
      }
      return fieldValue === value;

    case 'notEquals':
      const fieldDateNE = toComparableDate(fieldValue);
      const valueDateNE = toComparableDate(value);
      if (fieldDateNE !== null && valueDateNE !== null) {
        return new Date(fieldDateNE).toDateString() !== new Date(valueDateNE).toDateString();
      }
      return fieldValue !== value;

    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

    case 'notContains':
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());

    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());

    case 'greaterThan':
      const fieldDateGT = toComparableDate(fieldValue);
      const valueDateGT = toComparableDate(value);
      if (fieldDateGT !== null && valueDateGT !== null) {
        return fieldDateGT > valueDateGT;
      }
      return Number(fieldValue) > Number(value);

    case 'greaterThanOrEqual':
      const fieldDateGTE = toComparableDate(fieldValue);
      const valueDateGTE = toComparableDate(value);
      if (fieldDateGTE !== null && valueDateGTE !== null) {
        return fieldDateGTE >= valueDateGTE;
      }
      return Number(fieldValue) >= Number(value);

    case 'lessThan':
      const fieldDateLT = toComparableDate(fieldValue);
      const valueDateLT = toComparableDate(value);
      if (fieldDateLT !== null && valueDateLT !== null) {
        return fieldDateLT < valueDateLT;
      }
      return Number(fieldValue) < Number(value);

    case 'lessThanOrEqual':
      const fieldDateLTE = toComparableDate(fieldValue);
      const valueDateLTE = toComparableDate(value);
      if (fieldDateLTE !== null && valueDateLTE !== null) {
        return fieldDateLTE <= valueDateLTE;
      }
      return Number(fieldValue) <= Number(value);

    case 'between':
      if (!Array.isArray(value) || value.length !== 2) return false;
      const [min, max] = value;
      
      const fieldDateBetween = toComparableDate(fieldValue);
      const minDate = toComparableDate(min);
      const maxDate = toComparableDate(max);
      
      if (fieldDateBetween !== null && minDate !== null && maxDate !== null) {
        return fieldDateBetween >= minDate && fieldDateBetween <= maxDate;
      }
      return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);

    case 'in':
      if (!Array.isArray(value)) return false;
      return value.includes(fieldValue);

    case 'notIn':
      if (!Array.isArray(value)) return false;
      return !value.includes(fieldValue);

    default:
      return true;
  }
}

/**
 * Apply multiple filters to a dataset (AND logic)
 */
export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filters: Filter[]
): T[] {
  if (filters.length === 0) return data;

  return data.filter((item) => {
    return filters.every((filter) => applyFilter(item, filter));
  });
}

/**
 * Get count of items that match filters
 */
export function getFilteredCount<T extends Record<string, any>>(
  data: T[],
  filters: Filter[]
): number {
  return applyFilters(data, filters).length;
}
