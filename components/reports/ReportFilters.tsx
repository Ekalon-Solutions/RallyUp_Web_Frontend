"use client"

/**
 * ReportFilters — Reusable filter bar component for reports.
 *
 * Provides standard date range controls (start/end date or month picker),
 * search input, status dropdown, custom extra filter slots, and apply/reset actions.
 */

import { useState, ReactNode } from "react"
import { Search, RotateCcw, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ReportFiltersState, FilterSelectOption } from "./types"

interface ReportFiltersProps {
  /** Initial filter state */
  initialFilters?: ReportFiltersState
  /** Status options list if status dropdown is enabled */
  statusOptions?: FilterSelectOption[]
  /** Label for status filter (default: "Status") */
  statusLabel?: string
  /** Placeholder for search input (if enabled) */
  searchPlaceholder?: string
  /** Whether to show date inputs (default: true) */
  showDateRange?: boolean
  /** Whether to show search input (default: true) */
  showSearch?: boolean
  /** Additional custom filter controls */
  children?: ReactNode
  /** Called when user submits filters */
  onApplyFilters: (filters: ReportFiltersState) => void
  /** Called when user resets filters */
  onResetFilters?: () => void
  /** Loading state during refetch */
  loading?: boolean
}

export function ReportFilters({
  initialFilters = {},
  statusOptions,
  statusLabel = "Status",
  searchPlaceholder = "Search...",
  showDateRange = true,
  showSearch = true,
  children,
  onApplyFilters,
  onResetFilters,
  loading = false,
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFiltersState>(initialFilters)

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
  }

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }))
  }

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }))
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    onApplyFilters(filters)
  }

  const handleReset = () => {
    const emptyState: ReportFiltersState = {}
    setFilters(emptyState)
    if (onResetFilters) {
      onResetFilters()
    } else {
      onApplyFilters(emptyState)
    }
  }

  return (
    <form onSubmit={handleApply} className="flex flex-wrap items-end gap-4 text-sm">
      {/* Date Range Filters */}
      {showDateRange && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From Date</Label>
            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className="w-38"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To Date</Label>
            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className="w-38"
            />
          </div>
        </>
      )}

      {/* Status Filter */}
      {statusOptions && statusOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{statusLabel}</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={`All ${statusLabel}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {statusLabel}s</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Search Input */}
      {showSearch && (
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Custom Extra Filters */}
      {children}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Apply Filters
        </Button>
      </div>
    </form>
  )
}
