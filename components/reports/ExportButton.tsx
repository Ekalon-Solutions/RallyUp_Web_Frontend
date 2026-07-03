"use client"

/**
 * ExportButton — Reusable export action button for reports.
 *
 * Supports CSV and XLSX downloads with loading states and optional dropdown selection.
 * Integrates directly with the API client file download patterns (triggerBlobDownload).
 */

import { useState } from "react"
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ExportFormat } from "./types"

interface ExportButtonProps {
  /** Called when user triggers an export */
  onExport: (format: ExportFormat) => Promise<void> | void
  /** Disables the button (e.g. while main data is loading) */
  disabled?: boolean
  /** Supported formats — if both are provided, renders a dropdown menu */
  formats?: ExportFormat[]
  /** Custom label for single-format button (default: "Export") */
  label?: string
  /** Size variant */
  size?: "default" | "sm" | "lg" | "icon"
  /** Visual variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ExportButton({
  onExport,
  disabled = false,
  formats = ["xlsx", "csv"],
  label = "Export",
  size = "sm",
  variant = "outline",
}: ExportButtonProps) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setExportingFormat(format)
    try {
      await onExport(format)
    } finally {
      setExportingFormat(null)
    }
  }

  const isExporting = exportingFormat !== null

  if (formats.length === 1) {
    const singleFormat = formats[0]
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isExporting}
        onClick={() => handleExport(singleFormat)}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {label} ({singleFormat.toUpperCase()})
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes("xlsx") && (
          <DropdownMenuItem onClick={() => handleExport("xlsx")}>
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export as Excel (.xlsx)
          </DropdownMenuItem>
        )}
        {formats.includes("csv") && (
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            Export as CSV (.csv)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
