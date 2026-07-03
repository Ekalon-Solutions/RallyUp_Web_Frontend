"use client"

/**
 * ReportFilters — Reusable filter bar component for reports (Pattern v1.1).
 *
 * Pattern v1.1 Rules:
 *   1. Search: Auto-filters while typing with 400ms debounce. Pressing Enter searches immediately.
 *      Does not require clicking Apply Filters.
 *   2. Date Filters: Changing From Date or To Date immediately refreshes the report.
 *   3. Dropdown Filters: Use Apply Filters button so multiple dropdown changes can be executed together.
 *   4. Reset: Clears search, dates, dropdowns, and triggers an immediate report refresh.
 */

import { useState, useEffect, useRef, ReactNode } from "react"
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
  const [searchValue, setSearchValue] = useState<string>(initialFilters.search || "")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // Sync initialFilters search value if updated externally
  useEffect(() => {
    if (initialFilters.search !== undefined && initialFilters.search !== searchValue) {
      setSearchValue(initialFilters.search || "")
    }
  }, [initialFilters.search])

  // Debounced search trigger (400ms)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const updatedSearch = searchValue.trim() || undefined
      if (updatedSearch !== filters.search) {
        const nextFilters = { ...filters, search: updatedSearch }
        setFilters(nextFilters)
        onApplyFilters(nextFilters)
      }
    }, 400)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchValue])

  // Immediate search on Enter keypress
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      const updatedSearch = searchValue.trim() || undefined
      const nextFilters = { ...filters, search: updatedSearch }
      setFilters(nextFilters)
      onApplyFilters(nextFilters)
    }
  }

  // Immediate Date change handler
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const nextValue = value || undefined
    const nextFilters = { ...filters, [field]: nextValue }
    setFilters(nextFilters)
    onApplyFilters(nextFilters)
  }

  // Status change handler
  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }))
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    const updatedSearch = searchValue.trim() || undefined
    const nextFilters = { ...filters, search: updatedSearch }
    setFilters(nextFilters)
    onApplyFilters(nextFilters)
  }

  const handleReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setSearchValue("")
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
      {/* Date Range Filters (Immediate refresh on selection) */}
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

      {/* Search Input (Debounced auto-search + immediate Enter search) */}
      {showSearch && (
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
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
