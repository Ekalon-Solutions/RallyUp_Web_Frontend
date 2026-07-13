/**
 * Shared TypeScript types for the report UI components.
 *
 * Mirrors the StandardReportResponse envelope from the backend so the
 * frontend can type API responses without duplicating the interface.
 */

// ─── API Response Shape ───────────────────────────────────────────────────────

/** Matches StandardReportResponse<TRow, TSummary> from src/utils/report/reportResponse.ts */
export interface ReportApiResponse<TRow = unknown, TSummary = Record<string, number | string | null>> {
  success: boolean;
  meta: {
    reportId?: string;
    generatedAt: string;
    appliedFilters?: Record<string, unknown>;
    pagination?: ReportPaginationMeta;
  };
  summary: TSummary;
  data: TRow[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface ReportPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Table ────────────────────────────────────────────────────────────────────

/**
 * Column definition for ReportTable.
 *
 * `accessor` can be:
 *   - A keyof T for direct property display
 *   - A render function returning a React node for custom cells
 */
export interface ReportColumn<T = Record<string, unknown>> {
  /** Unique column identifier */
  key: string;
  /** Display header */
  header: string;
  /** Property accessor or render function */
  accessor: keyof T | ((row: T, index: number) => React.ReactNode);
  /** Text alignment (default: left) */
  align?: 'left' | 'center' | 'right';
  /** Whether the column is sortable (triggers onSortChange) */
  sortable?: boolean;
  /** Tailwind width class e.g. 'w-32', 'min-w-[160px]' */
  width?: string;
  /** If true, column is excluded from display but present in export */
  exportOnly?: boolean;
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

export interface SummaryCard {
  /** Card title / metric label */
  label: string;
  /** Display value (formatted by caller) */
  value: string | number;
  /** Optional sub-label or period description */
  subLabel?: string;
  /** Optional percentage change (positive = green, negative = red) */
  change?: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ReportFiltersState {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  search?: string;
  status?: string;
  /** Additional report-specific filters — passed through as query params */
  extras?: Record<string, string>;
}

/** A single option in a status/category dropdown */
export interface FilterSelectOption {
  value: string;
  label: string;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'xlsx';
