/**
 * Global performance and rendering constants
 * 
 * These constants enforce strict client-side guardrails to prevent
 * browser crashes and performance degradation when handling large datasets.
 */

/**
 * Maximum number of records to render in virtualized lists.
 * 
 * WHY THIS EXISTS:
 * - Backend pagination is not yet available
 * - Large datasets (10k-100k+ records) may exist in memory
 * - Browser memory is finite and can cause crashes/freezes
 * - Even with virtualization, DOM operations have overhead
 * 
 * ENFORCEMENT:
 * - Applied in data hooks BEFORE rendering
 * - NOT applied in JSX render loops
 * - Works with filtering, searching, keyboard navigation
 * 
 * If total dataset > MAX_RENDER_LIMIT:
 * - Only first MAX_RENDER_LIMIT items are rendered
 * - Clear warning banner is shown to user
 * - User is prompted to refine filters
 */
export const MAX_RENDER_LIMIT = 1000;
