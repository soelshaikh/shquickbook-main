/**
 * Advanced Filter Type Definitions
 * 
 * These types define the structure for reusable, entity-agnostic filtering.
 * Components emit these normalized filter objects; hooks/pages apply them.
 */

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Field data types determine which operators are available
 * and what input component to render
 */
export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

/**
 * Filter field configuration
 * Defines a filterable field for an entity
 */
export interface FilterField {
  /** Unique field identifier (matches entity property key) */
  key: string;
  /** Human-readable label */
  label: string;
  /** Data type of the field */
  type: FilterFieldType;
  /** Available operators for this field type */
  operators: FilterOperator[];
  /** For 'select' type: available options */
  options?: Array<{ label: string; value: string | number }>;
  /** Optional placeholder for value input */
  placeholder?: string;
}

/**
 * Normalized filter object
 * This is what the AdvancedFilter component emits
 */
export interface Filter {
  /** Field key being filtered */
  field: string;
  /** Operator applied to the field */
  operator: FilterOperator;
  /** Filter value(s) */
  value: string | number | boolean | Date | [Date, Date] | Array<string | number>;
}

/**
 * Entity filter configuration
 * Passed to AdvancedFilter to configure available fields
 */
export interface FilterConfig {
  /** Entity name (for display) */
  entity: string;
  /** Available filterable fields */
  fields: FilterField[];
}

/**
 * AdvancedFilter component props
 */
export interface AdvancedFilterProps {
  /** Current active filters */
  filters: Filter[];
  /** Filter configuration for the entity */
  config: FilterConfig;
  /** Called when filters change */
  onChange: (filters: Filter[]) => void;
  /** Optional trigger button label */
  triggerLabel?: string;
  /** Optional keyboard shortcut hint */
  shortcutHint?: string;
}
