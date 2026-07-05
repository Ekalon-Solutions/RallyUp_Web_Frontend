"use client"

/**
 * ReportTable — Generic, sortable, paginated data table for reports.
 *
 * Deliberately uses a plain HTML <table> (no TanStack Table, no AG Grid)
 * to match the pattern used in existing report tables
 * (components/admin/logistics-report-tables.tsx) and keep bundle size small.
 *
 * Supports:
 *   - Column definitions via ReportColumn<T>
 *   - Server-side sort (onSortChange callback) — the component signals intent;
 *     the parent refetches data with new sort params
 *   - Server-side pagination (onPageChange callback)
 *   - Loading skeleton (shows shimmer rows instead of content)
 *   - Empty state with customisable message
 *   - Column alignment (left / center / right)
 */

import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReportColumn, ReportPaginationMeta } from "./types"

// ─── Sort State ───────────────────────────────────────────────────────────────

export interface SortState {
  field: string
  direction: "asc" | "desc"
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportTableProps<T extends Record<string, unknown>> {
  columns: ReportColumn<T>[]
  data: T[]
  loading?: boolean
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number
  /** Pagination metadata from the API response */
  pagination?: ReportPaginationMeta
  /** Current sort state (controlled externally — server-side sort) */
  sort?: SortState
  /** Called when user clicks a sortable column header */
  onSortChange?: (sort: SortState) => void
  /** Called when user navigates to a different page */
  onPageChange?: (page: number) => void
  /** Message shown when data is empty (default: 'No data found') */
  emptyMessage?: string
  /** Row-level key accessor (default: uses array index) */
  rowKey?: keyof T | ((row: T, index: number) => string)
  /** Optional row click handler */
  onRowClick?: (row: T) => void
  /** Show a Club column for system owners viewing all clubs */
  showClubColumn?: boolean
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({
  columnKey,
  sort,
}: {
  columnKey: string
  sort?: SortState
}) {
  if (!sort || sort.field !== columnKey) {
    return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />
  }
  return sort.direction === "asc"
    ? <ChevronUp className="ml-1 h-3.5 w-3.5" />
    : <ChevronDown className="ml-1 h-3.5 w-3.5" />
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-muted animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  skeletonRows = 8,
  pagination,
  sort,
  onSortChange,
  onPageChange,
  emptyMessage = "No data found for the selected filters.",
  rowKey,
  onRowClick,
  showClubColumn,
}: ReportTableProps<T>) {

  // Only display columns not marked as exportOnly
  let visibleColumns = columns.filter((c) => !c.exportOnly)

  // Prepend Club column for system owners viewing all clubs
  if (showClubColumn) {
    const clubCol: ReportColumn<T> = {
      key: "_club",
      header: "Club",
      accessor: (row) => {
        const name = (row as Record<string, unknown>)["clubName"]
        return name ? String(name) : "—"
      },
      width: "w-36",
    }
    visibleColumns = [clubCol, ...visibleColumns]
  }

  // ── Column Resize State ────────────────────────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!resizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX
      setColumnWidths((prev) => ({
        ...prev,
        [resizing.key]: Math.max(60, resizing.startWidth + diff),
      }))
      autoScroll(e)
    }
    const handleMouseUp = () => setResizing(null)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizing])

  function autoScroll(e: MouseEvent) {
    const el = scrollRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const threshold = 40
    const speed = 12
    if (e.clientX > rect.right - threshold) {
      el.scrollLeft += speed
    }
    if (e.clientX < rect.left + threshold) {
      el.scrollLeft -= speed
    }
  }

  const handleSortClick = (col: ReportColumn<T>) => {
    if (!col.sortable || !onSortChange) return
    const newDirection =
      sort?.field === col.key && sort.direction === "asc" ? "desc" : "asc"
    onSortChange({ field: col.key, direction: newDirection })
  }

  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index)
    if (typeof rowKey === "function") return rowKey(row, index)
    return String(row[rowKey] ?? index)
  }

  const getCellValue = (row: T, col: ReportColumn<T>, index: number): React.ReactNode => {
    if (typeof col.accessor === "function") return col.accessor(row, index)
    const val = row[col.accessor as keyof T]
    if (val === null || val === undefined) return <span className="text-muted-foreground/50">—</span>
    return String(val)
  }

  const alignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center"
    if (align === "right") return "text-right"
    return "text-left"
  }

  return (
    <div className="flex flex-col">

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto" ref={scrollRef}>
        <table className="w-full text-sm table-fixed">

          {/* Header */}
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {visibleColumns.map((col) => {
                const overrideWidth = columnWidths[col.key]
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 font-medium text-muted-foreground whitespace-nowrap select-none relative overflow-hidden",
                      alignClass(col.align),
                      !overrideWidth && col.width,
                      col.sortable && onSortChange && "cursor-pointer hover:text-foreground transition-colors",
                    )}
                    style={overrideWidth ? { width: overrideWidth, minWidth: overrideWidth, maxWidth: overrideWidth } : undefined}
                    onClick={() => handleSortClick(col)}
                  >
                    <span className="inline-flex items-center">
                      {col.header}
                      {col.sortable && onSortChange && (
                        <SortIcon columnKey={col.key} sort={sort} />
                      )}
                    </span>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-border active:bg-foreground/20 select-none"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const th = (e.target as HTMLElement).closest("th")
                        const startWidth = th?.offsetWidth ?? 200
                        setResizing({ key: col.key, startX: e.clientX, startWidth })
                      }}
                    />
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} colCount={visibleColumns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-16 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    onRowClick
                      ? "cursor-pointer hover:bg-muted/40"
                      : "hover:bg-muted/20",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {visibleColumns.map((col) => {
                    const overrideWidth = columnWidths[col.key]
                    return (
                      <td
                        key={col.key}
                      className={cn(
                        "px-4 py-3 whitespace-nowrap overflow-hidden",
                        alignClass(col.align),
                        !overrideWidth && col.width,
                      )}
                      style={overrideWidth ? { width: overrideWidth, minWidth: overrideWidth, maxWidth: overrideWidth } : undefined}
                      >
                        {getCellValue(row, col, index)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>
            Showing{" "}
            <strong className="text-foreground">
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
            </strong>{" "}
            of <strong className="text-foreground">{pagination.totalItems.toLocaleString()}</strong> records
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="px-3 text-xs">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
